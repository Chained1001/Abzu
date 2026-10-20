/**
 * 定稿准备(格式规格 §9.3):组装七件 + 清单,卷对账呈报偏离,清单/卷对账不入档。
 */

import * as path from 'node:path'
import { readBookTextOrNull } from '../repo/read'
import { sha256Hex } from '../repo/hash'
import { scanChapter, type ChapterKey } from '../derive/scan'
import { writeBatchAtomic, type FileOp } from '../repo/atomic'
import { parseDocument, serializeDocument } from '../repo/frontmatter'
import { assertSegment, paths } from '../repo/paths'
import { resolveDraftRel } from '../repo/draft-paths'
import { MACHINE_SCHEMA_VERSION, serializeMachineJson } from '../repo/schema'
import { countPendingReviewDrafts, countProseText, findPendingReviewDraft, splitCandidateFacts } from '../repo/drafts'
import { applyVersionFields, extractVersionFields, initialVersion } from '../provenance'
import { parseOutline } from '../outline/parse'
import { reconcileLedger } from '../ledger'
import {
  checkLedgerSectionFields,
  checkMemorySectionFields,
  parseFactSections,
  parseLedgerSections,
  parseMemorySections,
  parseTimelineSections,
} from '../settlement'
import { bookWriter } from '../repo/atomic'
import { 待定稿包七件 } from './artifacts'

export { 待定稿包七件 } from './artifacts'

/** 沉淀候选(沉淀子代理对账产出,主 Agent 经 novel_prepare_pack 传入):逐段预校验后写入七件。 */
export interface 沉淀候选 {
  readonly 时间线变更?: string
  readonly 账本变更?: string
  readonly 记忆候选?: string
  readonly 章摘要?: string
  readonly 事实变更?: string
}

export interface PreparePackResult {
  readonly ok: boolean
  readonly dir: string
  readonly reason?: string
  readonly files: readonly string[]
}

/** 哈希单源(批F):sha256Hex 等价替换,指纹逐字节不变。 */
function sha256Of(content: string): string {
  return sha256Hex(content)
}

const readText = readBookTextOrNull

/**
 * 沉淀候选预校验:只解析不写,失败抛出解析器原话,调用方原样返回且不写任何文件。
 * 只校验传入的段;占位段(无候选)留给真正入档时的 planSettlement 判定。
 */
function validateCandidates(candidates: 沉淀候选): void {
  if (candidates.时间线变更 !== undefined && candidates.时间线变更.trim() !== '') parseTimelineSections(candidates.时间线变更)
  if (candidates.账本变更 !== undefined && candidates.账本变更.trim() !== '') {
    for (const section of parseLedgerSections(candidates.账本变更)) checkLedgerSectionFields(section)
  }
  if (candidates.记忆候选 !== undefined && candidates.记忆候选.trim() !== '') {
    for (const section of parseMemorySections(candidates.记忆候选)) checkMemorySectionFields(section)
  }
  if (candidates.事实变更 !== undefined && candidates.事实变更.trim() !== '') parseFactSections(candidates.事实变更)
  if (candidates.章摘要 !== undefined && candidates.章摘要.trim() === '') throw new Error('章摘要候选为空')
}

function reconciliationSections(bookRoot: string, volume: number): { readonly 实际: string; readonly 偏离: string; readonly 已呈报: boolean } {
  const result = reconcileLedger(bookRoot, volume)
  if (!result.ok) {
    return {
      // A-2 步 3：unreadable（真源在、读不了）不得与解析失败混为一谈。
      实际: `（事实时间线${result.kind === 'missing' ? '未初始化' : result.kind === 'unreadable' ? '不可读' : '解析失败'}）`,
      偏离: `无法对账：${result.reason}`,
      已呈报: false,
    }
  }
  const actual = result.report.事实.length === 0
    ? '（无已沉淀事实时间线）'
    : result.report.事实.map((item) => `- ${item.名称}（${item.来源}）`).join('\n')
  const 未归类 = result.report.未归类计划行.map((item) => `- 未归类计划行：${item.名称}（${item.来源}）`)
  // 章级计划待核对(任务21, B1):只呈报,同章任一事件不等于内容兑现;非空时不得写「无偏离」
  const 待核对行 = result.report.章级待核对.map((p) =>
    `- 章级计划待核对：${p.计划项.名称}（第${p.章号}章；本章事实：${p.本章事实.length === 0 ? '无' : p.本章事实.map((f) => f.名称).join('、')}；依据：按全书章号关联同章事实供核对，同章任一事件不等于计划内容兑现）`)
  待核对行.push(...(result.report.疑似占位待核对 ?? []).map(item => `- 疑似模板占位待核对：${item.名称}（${item.来源}）；与历史占位模板完全一致，请核实计划，未自动删除原文`))
  const deviation = result.report.状态 === '无偏离'
    ? ['无偏离', ...未归类].join('\n')
    : result.report.状态 === '待核对'
      ? ['待核对', ...待核对行, ...未归类].join('\n')
      : [
          '有偏离',
          ...result.report.计划未兑现.map((item) => `- 计划未兑现：${item.名称}`),
          ...result.report.事实未计划.map((item) => `- 事实未计划：${item.名称}`),
          ...待核对行,
          ...未归类,
        ].join('\n')
  return { 实际: actual, 偏离: deviation, 已呈报: true }
}

/** 组装待定稿包(R21 切割):纯算零写盘,返回精确写盘载荷;无唯一待审稿或校验失败则不产文件。 */
export function computePack(bookRoot: string, key: ChapterKey, 沉淀候选?: 沉淀候选): ComputedPack {
  // 章名进路径(待定稿包目录/定稿章/章摘要),先过白名单——`a/b` 会建嵌套目录、尾点章名在 Windows 产生不一致仓(B2)
  assertSegment(key.章名, '章名')
  const dir = resolveDraftRel(bookRoot, '待定稿包目录', key)
  const pendingCount = countPendingReviewDrafts(bookRoot, key)
  const pending = findPendingReviewDraft(bookRoot, key)
  if (pendingCount > 1) return { ok: false, dir, reason: `待审稿不唯一:${pendingCount}份` }
  if (pendingCount === 0 || pending === null) return { ok: false, dir, reason: '无待审稿' }

  // 审核完成/润色承接的**门禁不在这里**，在工具层 `novel_prepare_pack`（见 packGateGaps）。
  // computePack 是纯计算：夹具与测试直调它造包是合法用法，不该被流程状态挡住。

  if (沉淀候选 !== undefined) {
    try {
      validateCandidates(沉淀候选)
    } catch (err) {
      return { ok: false, dir, reason: err instanceof Error ? err.message : String(err) }
    }
  }

  const 计划 = readText(bookRoot, paths.计划时间线(key.卷))
  const confirmedOutlineRel = paths.确认细纲(key.卷, key.章, key.章名)
  const confirmedOutlineText = readText(bookRoot, confirmedOutlineRel)
  const outlineDoc = confirmedOutlineText === null ? null : parseDocument(confirmedOutlineText)
  const outlineVersion = extractVersionFields(outlineDoc?.ok ? outlineDoc.data.fields : {}).版本
  const outlineRefs = outlineDoc?.ok ? parseOutline(confirmedOutlineText!).来源引用 : []
  const rawBody = splitCandidateFacts(pending.body).prose.replace(/\r\n/g, '\n').replace(/\n+$/, '')
  const { 字符数, 汉字数 } = countProseText(pending.body)
  const finalizedFields = applyVersionFields({
    身份: { 卷: key.卷, 章: key.章, 章名: key.章名 },
    状态: '已定稿',
    章号: key.章,
    字数统计: { 字符数, 汉字数 },
    来源细纲版本: outlineVersion === null ? confirmedOutlineRel : `${confirmedOutlineRel}@${outlineVersion}`,
    事实条目引用清单: [],
    来源引用: outlineRefs,
    作用域: '本书',
    写入范围: [paths.定稿章(key.卷, key.章, key.章名)],
    恢复信息: { 可重跑: true, 来源草稿: pending.relPath },
  }, initialVersion('定稿入档', { 来源草稿: pending.relPath, 来源细纲: confirmedOutlineRel }))
  const 正文 = serializeDocument(finalizedFields, rawBody)
  const 事实变更 = `# 事实变更\n\n${沉淀候选?.事实变更?.trim() || '（无事实变更）'}\n`
  const 时间线变更 = `# 时间线变更\n\n${沉淀候选?.时间线变更?.trim() || '（无时间线变更）'}\n`
  const 账本变更 = `# 账本变更\n\n${沉淀候选?.账本变更?.trim() || '（无账本变更）'}\n`
  const 记忆 = `# 本书层记忆候选\n\n${沉淀候选?.记忆候选?.trim() || '（无记忆候选）'}\n`
  const 章摘要 = `# 章摘要\n\n${沉淀候选?.章摘要?.trim() || '（无摘要沉淀）'}\n`
  const 对账 = reconciliationSections(bookRoot, key.卷)
  const 卷对账 = [
    '# 卷对账',
    '',
    '## 计划',
    '',
    计划 === null ? '（无计划时间线）' : 计划.trim(),
    '',
    '## 实际',
    '',
    对账.实际,
    '',
    '## 偏离',
    '',
    对账.偏离,
    '',
  ].join('\n')

  const pendingDoc = parseDocument(pending.text)
  const 来源版本 = extractVersionFields(pendingDoc.ok ? pendingDoc.data.fields : {}).版本
  const dest正文 = paths.定稿章(key.卷, key.章, key.章名)
  const dest摘要 = paths.章摘要(key.卷, key.章, key.章名)

  const contents: Record<(typeof 待定稿包七件)[number], string> = {
    '正文.md': 正文,
    '事实变更.md': 事实变更,
    '时间线变更.md': 时间线变更,
    '账本变更.md': 账本变更,
    '章摘要.md': 章摘要,
    '卷对账.md': 卷对账,
    '本书层记忆候选.md': 记忆,
  }

  const 文件 = [
    { 源: '正文.md', 目标: dest正文, sha256: sha256Of(正文), 来源版本: 来源版本 ?? pending.relPath },
    { 源: '章摘要.md', 目标: dest摘要, sha256: sha256Of(章摘要), 来源版本: 来源版本 ?? pending.relPath },
  ]
  const 工件 = 待定稿包七件.map((名) => ({ 名, sha256: sha256Of(contents[名]) }))
  const 清单 = serializeMachineJson({
    文件,
    工件,
    来源版本: 来源版本 ?? pending.relPath,
    校验: '通过',
    偏离已呈报: 对账.已呈报,
  }, MACHINE_SCHEMA_VERSION)

  const ops: FileOp[] = [
    ...待定稿包七件.map((名) => ({ relPath: path.posix.join(dir, 名), content: contents[名] })),
    { relPath: path.posix.join(dir, '清单.json'), content: 清单 },
  ]
  return { ok: true, dir, 文件: ops, files: ops.map((o) => o.relPath) }
}

/** 纯算结果(R21 切割):`文件` 是精确写盘载荷,供写入器落盘与脚本 stdout 共用。 */
export interface ComputedPack {
  readonly ok: boolean
  readonly dir: string
  readonly reason?: string
  readonly 文件?: readonly FileOp[]
  readonly files?: readonly string[]
}

/** 组装并落盘待定稿包(R21 写侧):进程内重算＋写入器原子落盘;失败零文件。 */
function preparePackLocked(bookRoot: string, key: ChapterKey, 沉淀候选?: 沉淀候选): PreparePackResult {
  const c = computePack(bookRoot, key, 沉淀候选)
  if (!c.ok || c.文件 === undefined) return { ok: false, dir: c.dir, reason: c.reason, files: [] }
  writeBatchAtomic(bookRoot, c.文件)
  return { ok: true, dir: c.dir, files: c.files ?? [] }
}

export const preparePack = bookWriter(preparePackLocked)

/**
 * 组包前置闸（门禁本体，工具层调用；纯函数、只读、不写盘）。
 *
 * 为什么在工具层而不是 computePack：computePack 是纯计算，测试与夹具直调它造包是合法用法
 * （见 reliability-fix1 / proposal 等用例），在那里拦会误伤。工具层才是「作者/主控真走的那道门」，
 * 与 gateWriteDraft 的分工一致：core 出判据，工具层用。
 *
 * 只拦「明确不成立」的两态，理由给解法，且无审核记录的老书不误拦：
 * - 有审核记录但未完成 → 停（待回写或待处置）
 * - 审核完成但润色未承接 → 停（润色承接或登记跳过）
 */
export function packGateGaps(bookRoot: string, key: ChapterKey): string[] {
  let facts
  try {
    facts = scanChapter(bookRoot, key)
  } catch {
    // 扫描失败不阻断组包（读取/解析异常另有专门的失败分流），只放行
    return []
  }
  const gaps: string[] = []
  if (facts.有审核记录 && !facts.审核完成) {
    gaps.push('本章审核未完成（仍有待回写模块或待处置发现项）：先跑《全面审读》并逐条处置，再组包')
  }
  if (facts.审核完成 && !facts.润色已承接) {
    gaps.push('审核已通过但润色未承接：《精修润色》登记承接（novel_record_polish），或作者不要润色时登记跳过，再组包')
  }
  return gaps
}
