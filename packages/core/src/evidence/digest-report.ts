/**
 * 审读汇总(0.0.87 跨章留痕的消费方):把已入档章的审读摘要聚成**卷级/全书报表**,
 * 回答「哪个模块老出问题、高/中级各多少、作者保留了多少、处置是否拖延」。
 *
 * 数据源只有 `定稿/卷NN/审读摘要/*.json`(由 digest.ts 在入档时写),不读草稿区——
 * 所以这本书**入档过的章**才进统计;没入档的章没有摘要,不虚报成 0。
 *
 * 三条纪律:
 * - **只聚合不判分**:输出计数与比率,不给「这一章审得差」这类结论——判断归主 Agent/作者;
 * - **分子分母都说清**:比率带分母(已入档且有摘要的章数),缺摘要的章单列,不用 0 冒充;
 * - **纯读**:不写盘、不改任何真源,可在任意时刻调用。
 */

import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { LAYOUT } from '../repo/paths'
import { listChapters } from '../derive/scan'
import { loadReviewDigest, type 审读摘要记录 } from './digest'
import { 处置状态列表, type 处置状态 } from './record'

/** 一章的摘要行(含章键,便于主 Agent 指回具体章)。 */
export interface 审读汇总章行 {
  readonly 卷: number
  readonly 章: number
  readonly 章名: string
  readonly 审核完成: boolean
  readonly 发现项总数: number
  readonly 高: number
  readonly 中: number
  readonly 低: number
  readonly 已处置: number
  readonly 作者保留: number
}

/** 单模块的累计行。 */
export interface 审读汇总模块行 {
  readonly 模块名: string
  /** 在多少章里出过发现项。 */
  readonly 出现章数: number
  readonly 发现项: number
  /** 其中归一化为「高」的条数。摘要的模块行只有这一档严重程度单列,中/低不按模块拆——故不给出,不编造 0。 */
  readonly 高: number
  /**
   * 该模块跑完的章数 / 有摘要的章数。
   * 注意分母是「有摘要的章」,不是全书章数——没入档的章没有摘要,不在分母里。
   */
  readonly 完成章数: number
}

export interface 审读汇总 {
  readonly schemaVersion: 1
  /** 统计范围:卷号,或 null 表示全书。 */
  readonly 范围: { readonly 卷: number | null }
  /** 参与统计的章数(已入档且有摘要)。 */
  readonly 已统计章数: number
  /** 定稿区里有章、但没有摘要的章数(本版之前入档的老章或摘要写失败)。 */
  readonly 缺摘要章数: number
  readonly 缺摘要章: ReadonlyArray<{ readonly 卷: number; readonly 章: number; readonly 章名: string }>
  /** 发现项合计与严重程度分布(按归一化后的高/中/低;「其他」为不认识的原值)。 */
  readonly 发现项合计: number
  readonly 严重程度: { readonly 高: number; readonly 中: number; readonly 低: number; readonly 其他: number }
  /** 处置分布:词表序,只列非零项。 */
  readonly 处置: Readonly<Partial<Record<处置状态, number>>>
  /** 已裁决条数(处置非「待处理」)。 */
  readonly 已处置合计: number
  readonly 待处置合计: number
  /** 作者保留的条数——它不算「已解决」,单列以便主 Agent 区分「放过」与「改好」。 */
  readonly 作者保留合计: number
  /** 未完成审核的章数(摘要里 审核完成=false):这些章的计数应打折看。 */
  readonly 未完成审核章数: number
  /** 按发现项总数降序;只列至少出过一条发现项的模块。 */
  readonly 模块: ReadonlyArray<审读汇总模块行>
  /** 逐章行,按章号升序。 */
  readonly 章: ReadonlyArray<审读汇总章行>
}

/**
 * 扫一个卷目录下的审读摘要。目录不存在时返回空表(老书/新书都没有这个目录)。
 * 只认 `NNNN-章名.json`——与写侧 paths.审读摘要 一致。
 */
function readVolumeDigests(bookRoot: string, 卷: number): ReadonlyArray<{ readonly 章: number; readonly 章名: string; readonly digest: 审读摘要记录 }> {
  const dir = nodePath.join(bookRoot, LAYOUT.定稿(卷), '审读摘要')
  let names: string[]
  try {
    names = fs.readdirSync(dir)
  } catch {
    return []
  }
  const out: Array<{ 章: number; 章名: string; digest: 审读摘要记录 }> = []
  for (const name of names) {
    const m = /^(\d{1,4})-(.+)\.json$/.exec(name)
    if (m === null) continue
    const 章 = Number(m[1])
    const 章名 = m[2]!
    const digest = loadReviewDigest(bookRoot, { 卷, 章, 章名 })
    if (digest === null) continue
    out.push({ 章, 章名, digest })
  }
  out.sort((a, b) => a.章 - b.章)
  return out
}

/** 该书所有有定稿章的卷号(升序)。只读目录名,不扫章内容。 */
function volumesWithFinalized(bookRoot: string): number[] {
  let names: string[]
  try {
    names = fs.readdirSync(nodePath.join(bookRoot, '定稿'))
  } catch {
    return []
  }
  const out: number[] = []
  for (const name of names) {
    const m = /^卷(\d+)$/.exec(name)
    if (m !== null) out.push(Number(m[1]))
  }
  return out.sort((a, b) => a - b)
}

/**
 * 聚合成审读汇总。`卷` 缺省＝全书(跨卷合计,逐章行仍带卷号)。
 *
 * 缺摘要的章:从 listChapters 取该范围的章键,减去有摘要的——这样「有章但没摘要」
 * 能被如实数出来,而不是让读者以为那些章零发现项。
 */
export function summarizeReviewDigests(
  bookRoot: string,
  opts: { readonly 卷?: number } = {},
): 审读汇总 {
  const 卷范围 = opts.卷
  const 卷们 = 卷范围 === undefined ? volumesWithFinalized(bookRoot) : [卷范围]

  const 章行: 审读汇总章行[] = []
  const 有摘要键 = new Set<string>()
  for (const 卷 of 卷们) {
    for (const { 章, 章名, digest } of readVolumeDigests(bookRoot, 卷)) {
      const 高 = digest.严重程度?.高 ?? 0
      const 中 = digest.严重程度?.中 ?? 0
      const 低 = digest.严重程度?.低 ?? 0
      章行.push({
        卷,
        章,
        章名,
        审核完成: digest.审核完成 === true,
        发现项总数: digest.发现项总数 ?? 0,
        高,
        中,
        低,
        已处置: digest.已处置 ?? 0,
        作者保留: digest.作者保留 ?? 0,
      })
      有摘要键.add(`${卷}/${章}/${章名}`)
    }
  }

  // 缺摘要:该范围内 listChapters 有、但读不到摘要的章
  const 缺摘要章: Array<{ 卷: number; 章: number; 章名: string }> = []
  for (const k of listChapters(bookRoot)) {
    if (卷范围 !== undefined && k.卷 !== 卷范围) continue
    if (k.章 <= 0) continue // 未定位的窗口条目不是「已入档章」
    if (有摘要键.has(`${k.卷}/${k.章}/${k.章名}`)) continue
    if (!fs.existsSync(nodePath.join(bookRoot, LAYOUT.定稿(k.卷), `${String(k.章).padStart(4, '0')}-${k.章名}.md`))) continue
    缺摘要章.push({ 卷: k.卷, 章: k.章, 章名: k.章名 })
  }
  缺摘要章.sort((a, b) => a.卷 - b.卷 || a.章 - b.章)

  // 严重程度与处置:用摘要里的分布直接相加,不重算(摘要是单章权威)
  const 严重 = { 高: 0, 中: 0, 低: 0, 其他: 0 }
  const 处置计数: Partial<Record<处置状态, number>> = {}
  let 已处置合计 = 0
  let 作者保留合计 = 0
  let 未完成审核章数 = 0
  const 模块表 = new Map<string, { 出现章数: number; 发现项: number; 高: number; 完成章数: number }>()

  for (const 卷 of 卷们) {
    for (const { digest } of readVolumeDigests(bookRoot, 卷)) {
      const d = digest
      严重.高 += d.严重程度?.高 ?? 0
      严重.中 += d.严重程度?.中 ?? 0
      严重.低 += d.严重程度?.低 ?? 0
      严重.其他 += d.严重程度?.其他 ?? 0
      已处置合计 += d.已处置 ?? 0
      作者保留合计 += d.作者保留 ?? 0
      if (d.审核完成 !== true) 未完成审核章数 += 1
      for (const [state, count] of Object.entries(d.处置 ?? {})) {
        if (typeof count !== 'number') continue
        处置计数[state as 处置状态] = (处置计数[state as 处置状态] ?? 0) + count
      }
      for (const [模块名, row] of Object.entries(d.模块 ?? {})) {
        const acc = 模块表.get(模块名) ?? { 出现章数: 0, 发现项: 0, 高: 0, 完成章数: 0 }
        if ((row.发现项 ?? 0) > 0) acc.出现章数 += 1
        acc.发现项 += row.发现项 ?? 0
        acc.高 += row.高 ?? 0
        if (row.完成 === true) acc.完成章数 += 1
        模块表.set(模块名, acc)
      }
    }
  }

  const 处置有序: Partial<Record<处置状态, number>> = {}
  for (const state of 处置状态列表) {
    const count = 处置计数[state]
    if (count !== undefined) 处置有序[state] = count
  }

  const 发现项合计 = 章行.reduce((n, r) => n + r.发现项总数, 0)
  const 已统计章数 = 章行.length
  const 模块行: 审读汇总模块行[] = [...模块表.entries()]
    .filter(([, v]) => v.发现项 > 0)
    .map(([模块名, v]) => ({
      模块名,
      出现章数: v.出现章数,
      发现项: v.发现项,
      高: v.高,
      完成章数: v.完成章数,
    }))
    .sort((a, b) => b.发现项 - a.发现项 || a.模块名.localeCompare(b.模块名))

  return {
    schemaVersion: 1,
    范围: { 卷: 卷范围 ?? null },
    已统计章数,
    缺摘要章数: 缺摘要章.length,
    缺摘要章,
    发现项合计,
    严重程度: 严重,
    处置: 处置有序,
    已处置合计,
    待处置合计: Math.max(0, 发现项合计 - 已处置合计),
    作者保留合计,
    未完成审核章数,
    模块: 模块行,
    章: 章行,
  }
}
