/**
 * 审读摘要(0.0.87 跨章留痕):入档时把本章审核记录压成**计数快照**,落在
 * `定稿/卷NN/审读摘要/NNNN-章名.json`。
 *
 * 为什么需要:草稿区审核记录随入档清理(`archiveDraftChapter`),而跨章统计要的
 * 「哪个模块老出问题、高/中级各多少、作者保留了多少」只在审核记录里。清理后原文
 * 不可读,统计源就永久断了——故入档前先把这几列抽出来留在定稿区(受跟踪、随 ch: 提交)。
 *
 * 三条硬约束:
 * - **只留计数与指纹,不留问题原文**——摘要不是审核记录的副本,体积固定、可长期留;
 * - **纯派生**:同一份审核记录必然产出逐字节相同的文本(键序固定、无时间戳、模块名排序),
 *   入档重跑写回同字节,不会产生互相冲突的摘要;
 * - 落在定稿区卷目录的**子目录**且扩展名 `.json`:定稿区所有章扫描器(检索/进度/导出/
 *   组装/章号冲突)只认卷目录正下方的 `NNNN-章名.md`,故对它们全部不可见。
 */

import * as nodePath from 'node:path'
import { bookWriter, writeFileAtomic } from '../repo/atomic'
import { sha256Hex } from '../repo/hash'
import { paths } from '../repo/paths'
import { resolveDraftRel } from '../repo/draft-paths'
import { readBookTextOrNull } from '../repo/read'
import { MACHINE_SCHEMA_VERSION, parseMachineJson, readMachineText, serializeMachineJson } from '../repo/schema'
import { 严重程度列表, 归一化严重程度, 处置状态列表, parseReviewRecord, type ReviewRecord, type 处置状态 } from './record'

/** 单模块行:该模块跑没跑完、出了几条、其中几条高级。 */
export interface 审读摘要模块行 {
  readonly 完成: boolean
  readonly 失败: boolean
  readonly 跳过: boolean
  readonly 发现项: number
  readonly 高: number
}

/**
 * 摘要正文(机器态,schemaVersion 1)。`审核记录哈希` 是**整份记录文本**的 sha256,
 * 与审核记录同源可核;`审读指纹`/`审稿哈希` 沿用记录原值,供跨章对齐审核输入版本。
 */
export interface 审读摘要记录 {
  readonly schemaVersion: number
  readonly 章: { readonly 卷: number; readonly 章: number; readonly 章名: string }
  readonly 审核完成: boolean
  readonly 发现项总数: number
  /** 归一化后分布(硬伤/严重→高,建议→中,仅供参考→低);不认识的原值计入「其他」。 */
  readonly 严重程度: { readonly 高: number; readonly 中: number; readonly 低: number; readonly 其他: number }
  /** 处置分布:只列非零项,词表序固定。 */
  readonly 处置: Readonly<Partial<Record<处置状态, number>>>
  /** 已裁决条数(处置状态非「待处理」)——「作者保留」是其中一支,单列便于对账。 */
  readonly 已处置: number
  readonly 作者保留: number
  /** 模块表按模块名排序;只在记录里出现过发现项的模块也算一行(完成标记为 false)。 */
  readonly 模块: Readonly<Record<string, 审读摘要模块行>>
  readonly 审核记录哈希: string
  readonly 审读指纹?: string
  readonly 审稿哈希?: string
  readonly 润色承接?: '已润色' | '已跳过'
}

/** 纯构建:审核记录 → 摘要对象(不碰磁盘;键序固定,同输入同字节)。 */
export function buildReviewDigest(
  record: ReviewRecord,
  key: { readonly 卷: number; readonly 章?: number; readonly 章名: string },
  审核记录哈希: string,
): 审读摘要记录 {
  const 严重程度 = { 高: 0, 中: 0, 低: 0, 其他: 0 }
  const 处置计数: Partial<Record<处置状态, number>> = {}
  interface 可变模块行 { 完成: boolean; 失败: boolean; 跳过: boolean; 发现项: number; 高: number }
  const 模块: Record<string, 可变模块行> = {}
  for (const name of Object.keys(record.模块)) {
    const state = record.模块[name]
    模块[name] = { 完成: state?.完成 === true, 失败: state?.失败 === true, 跳过: state?.跳过 === true, 发现项: 0, 高: 0 }
  }
  for (const finding of record.问题) {
    const 归一 = 归一化严重程度(finding.严重程度)
    if ((严重程度列表 as readonly string[]).includes(归一)) 严重程度[归一 as '高' | '中' | '低'] += 1
    else 严重程度.其他 += 1
    // 记录里没有状态行的模块(旧记录/手写记录)也留一行,计数照算,完成标记保守为 false。
    const row = 模块[finding.模块名] ?? (模块[finding.模块名] = { 完成: false, 失败: false, 跳过: false, 发现项: 0, 高: 0 })
    row.发现项 += 1
    if (归一 === '高') row.高 += 1
    处置计数[finding.处置状态] = (处置计数[finding.处置状态] ?? 0) + 1
  }
  const 处置有序: Partial<Record<处置状态, number>> = {}
  for (const state of 处置状态列表) {
    const count = 处置计数[state]
    if (count !== undefined) 处置有序[state] = count
  }
  const 模块有序: Record<string, 审读摘要模块行> = {}
  for (const name of Object.keys(模块).sort()) 模块有序[name] = 模块[name]!
  return {
    schemaVersion: MACHINE_SCHEMA_VERSION,
    章: { 卷: key.卷, 章: key.章 ?? 0, 章名: key.章名 },
    审核完成: record.完成 === true,
    发现项总数: record.问题.length,
    严重程度,
    处置: 处置有序,
    已处置: record.问题.length - (处置计数['待处理'] ?? 0),
    作者保留: 处置计数['作者保留'] ?? 0,
    模块: 模块有序,
    审核记录哈希,
    ...(record.审读指纹 === undefined ? {} : { 审读指纹: record.审读指纹 }),
    ...(record.审稿哈希 === undefined ? {} : { 审稿哈希: record.审稿哈希 }),
    ...(record.润色 === undefined ? {} : { 润色承接: record.润色.状态 }),
  }
}

export type 审读摘要写入结果 =
  | { readonly ok: true; readonly relPath: string; /** false＝已存在同字节,未再写盘。 */ readonly written: boolean }
  | { readonly ok: false; readonly reason: string }

function writeReviewDigestLocked(bookRoot: string, key: { readonly 卷: number; readonly 章?: number; readonly 章名: string }): 审读摘要写入结果 {
  const relPath = paths.审读摘要(key.卷, key.章 ?? 0, key.章名)
  let text: string
  try {
    text = readMachineText(nodePath.join(bookRoot, resolveDraftRel(bookRoot, '审核记录', key)))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') return { ok: false, reason: `审核记录读取失败（${code ?? '未知错误'}）` }
    // 审核记录已被上一次成功入档清掉(重跑同一请求):已有摘要原样纳入本次提交——既不重写,
    // 也让 extraPaths 与首次请求一致,重跑仍走可信收据的 alreadyCommitted 快路。
    if (readBookTextOrNull(bookRoot, relPath) !== null) return { ok: true, relPath, written: false }
    // 无审核记录的老书照常入档:没有可摘要的东西,不拦沉淀。
    return { ok: false, reason: '无审核记录' }
  }
  const content = serializeMachineJson({ ...buildReviewDigest(parseReviewRecord(text), key, sha256Hex(text)) } as Readonly<Record<string, unknown>>, MACHINE_SCHEMA_VERSION)
  // 同字节不重写:入档重跑(补提交)时摘要保持原字节,不会产生第二份或冲突内容。
  if (readBookTextOrNull(bookRoot, relPath) === content) return { ok: true, relPath, written: false }
  writeFileAtomic(bookRoot, relPath, content)
  return { ok: true, relPath, written: true }
}

/**
 * 入档前写本章审读摘要(工具层在 `archiveChapter` 之前调用;摘要再由 `extraPaths`
 * 随同一次 `ch:` 提交)。同字节重复调用返回 `written: false`——入档重跑幂等。
 */
export const writeReviewDigest = bookWriter(writeReviewDigestLocked)

/** 读侧(跨章统计/核对):无文件或非本版机器态返回 null,由调用方决定降级口径。 */
export function loadReviewDigest(
  bookRoot: string,
  key: { readonly 卷: number; readonly 章?: number; readonly 章名: string },
): 审读摘要记录 | null {
  const text = readBookTextOrNull(bookRoot, paths.审读摘要(key.卷, key.章 ?? 0, key.章名))
  if (text === null) return null
  const parsed = parseMachineJson(text, MACHINE_SCHEMA_VERSION)
  return parsed.ok ? parsed.data as unknown as 审读摘要记录 : null
}
