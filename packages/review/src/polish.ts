/**
 * 润色承接登记(0.0.54 润色后移批)。
 *
 * 流程改为「起草 → 审读 ⇄ 改稿 → 润色 → 沉淀」后,润色会改字,审核证据绑定的
 * 正文哈希与审读指纹随之失配,derive 会把审核判回「审核」。本模块提供唯一的
 * 承接登记通道:审核通过后由主控调用,记下「当前稿是已审稿经润色的直接子稿、
 * 保真通过、确定性复核通过」(或作者明确跳过润色),推导据此认可审核仍有效。
 *
 * 只在此一处写 `润色` 字段;保真函数从 @abzu/polish 取——review → polish 无环
 * (polish 不依赖 review;core 不依赖任何上层包)。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  bookWriter,
  chapterLengthIdentity,
  checkChapterLength,
  countProseText,
  draftHashOf,
  loadMaterialPackage,
  loadReviewRecord,
  parseDocument,
  paths,
  readBookText,
  readChapterLength,
  resolveDraftRel,
  readReviewRecordForUpdate,
  reviewInputFingerprintOf,
  reviewRecordHashOf,
  scanChapter,
  serializeReviewRecord,
  splitCandidateFacts,
  writeFileAtomic,
  是高级严重程度,
  type ChapterKey,
  type Finding,
  type PolishCarryover,
  type ReviewRecord,
} from '@abzu/core'
import { checkFidelity } from '@abzu/polish'
import { runCanonCheck, runTextNorm } from './checks'
import type { CheckInput } from './registry'

export interface RecordPolishInput {
  readonly 卷: number
  readonly 章: number
  readonly 章名: string
  /** 必须与当前审核记录哈希一致(照 applyRevisionBatch 的 checkRecord 口径)。 */
  readonly 审核记录哈希?: string
  /** 已润色:润色稿仓内相对路径(须是当前唯一待审稿、被审稿的直接子稿)。 */
  readonly 稿件?: string
  /** 已跳过:作者稿或作者不要润色时登记跳过。 */
  readonly 跳过?: boolean
  /** 跳过时必填。 */
  readonly 理由?: string
}

export type RecordPolishResult =
  | { readonly ok: true; readonly 审核记录哈希: string; readonly 润色: PolishCarryover }
  | { readonly ok: false; readonly reason: string }

interface DraftView {
  readonly relPath: string
  readonly body: string
  readonly fields: Record<string, unknown>
  readonly 版本: number | null
}

function readText(root: string, rel: string): string | null {
  // 0.0.60:细纲读取改 core 的 readBookText——剥 BOM 与 scan/computeReview 同口径,
  // 外部编辑器带 BOM 保存的细纲不再让承接指纹永不成立(草稿读入后仍走 parseDocument,口径不变)。
  const result = readBookText(root, rel)
  return result.ok ? result.text : null
}

function draftViews(root: string, key: Pick<ChapterKey, '卷' | '章名'>): DraftView[] {
  const dir = resolveDraftRel(root, '草稿目录', key)
  let files: string[]
  try { files = fs.readdirSync(path.join(root, ...dir.split('/'))) } catch { return [] }
  const views: DraftView[] = []
  for (const file of files) {
    if (!/\.md$/i.test(file)) continue
    const rel = `${dir}/${file}`
    const text = readText(root, rel)
    if (text === null) continue
    const doc = parseDocument(text)
    if (!doc.ok) continue
    const 版本 = doc.data.fields['版本']
    views.push({ relPath: rel, body: doc.data.body, fields: doc.data.fields, 版本: typeof 版本 === 'number' ? 版本 : null })
  }
  return views
}

/** 记录是否已完成且每条发现项有效处置(不含证据适用性——那是各自分支的判据)。 */
function undisposed(record: ReviewRecord): string | undefined {
  if (record.完成 !== true) return '审核未完成：仍有待处理发现项'
  if (record.模块 === undefined || Object.keys(record.模块).length === 0) return '审核未完成：记录缺模块状态'
  for (const p of record.问题) {
    const d = p.处置状态 ?? p.处置
    if (d === '待处理') return '审核未完成：仍有待处理发现项'
  }
  return undefined
}

/** 对给定正文算审读指纹,与 computeReview/scan 同口径(材料标识取自 loadMaterialPackage)。 */
function fingerprintFor(root: string, key: RecordPolishInput, body: string, record: ReviewRecord): string {
  const outline = readText(root, paths.确认细纲(key.卷, key.章, key.章名)) ?? ''
  const materials = loadMaterialPackage(root, key)
  return reviewInputFingerprintOf({
    正文: body,
    细纲: outline,
    材料清单: materials.审读材料标识,
    方案: record.方案,
    章节篇幅: chapterLengthIdentity(readChapterLength(root)),
  })
}

/** 确定性复核(照 computeReview 组装输入):对给定正文跑两个确定性模块。 */
function deterministicFindings(root: string, key: RecordPolishInput, view: DraftView): Finding[] {
  const outline = readText(root, paths.确认细纲(key.卷, key.章, key.章名)) ?? ''
  const materials = loadMaterialPackage(root, key)
  const counts = countProseText(view.body)
  const 篇幅核对 = checkChapterLength(readChapterLength(root), counts.汉字数)
  const input: CheckInput = {
    bookRoot: root,
    key: { 卷: key.卷, 章: key.章, 章名: key.章名 },
    待审稿: view.body,
    细纲: outline,
    审核编号: `审-${String(key.卷).padStart(2, '0')}-${String(key.章).padStart(4, '0')}`,
    材料版本: view.版本 === null ? view.relPath : `${view.relPath}@${view.版本}`,
    材料段: materials.段,
    篇幅核对,
  }
  return [...runTextNorm(input), ...runCanonCheck(input)]
}

function singlePending(views: readonly DraftView[]): { ok: true; view: DraftView } | { ok: false; reason: string } {
  const pending = views.filter((v) => v.fields['角色'] === '待审稿')
  if (pending.length === 0) return { ok: false, reason: '无待审稿' }
  if (pending.length > 1) return { ok: false, reason: `待审稿不唯一:${pending.length}份` }
  return { ok: true, view: pending[0]! }
}

function reviewKey(input: RecordPolishInput): { readonly 卷: number; readonly 章: number; readonly 章名: string } {
  return { 卷: input.卷, 章: input.章, 章名: input.章名 }
}

function skipCarryover(root: string, input: RecordPolishInput, record: ReviewRecord, view: DraftView, 理由: string): RecordPolishResult {
  const 稿哈希 = draftHashOf(view.body)
  const carryover: PolishCarryover = {
    状态: '已跳过',
    父稿哈希: 稿哈希,
    稿哈希,
    审读指纹: fingerprintFor(root, reviewKey(input), view.body, record),
    稿件: view.relPath,
    理由,
    时间: new Date().toISOString(),
  }
  const content = serializeReviewRecord({ ...record, 润色: carryover })
  writeFileAtomic(root, resolveDraftRel(root, '审核记录', input), content)
  return { ok: true, 审核记录哈希: reviewRecordHashOf(content), 润色: carryover }
}

function polishCarryover(root: string, input: RecordPolishInput, record: ReviewRecord, polished: DraftView, parent: DraftView): RecordPolishResult {
  // 确定性检查产「高」，技能侧第二套词表用「硬伤」；旧测试数据用过「严重」——统一由 core 归一化。
  // 1. 保真:两稿正文(不含候选事实段)对确认细纲硬约束核验
  const outlineText = readText(root, paths.确认细纲(input.卷, input.章, input.章名)) ?? ''
  const parentSplit = splitCandidateFacts(parent.body)
  const polishedSplit = splitCandidateFacts(polished.body)
  const risks = checkFidelity({ draft: parentSplit.prose, polished: polishedSplit.prose, outlineText })
  if (risks.length > 0) {
    return { ok: false, reason: `保真风险：${risks.map((r) => `${r.kind}:${r.detail}`).join('；')}` }
  }
  // 2. 候选事实段原样
  if (parentSplit.facts.length !== polishedSplit.facts.length
    || parentSplit.facts.some((f, i) => f !== polishedSplit.facts[i])) {
    return { ok: false, reason: '候选事实段被改动：润色只能改正文，候选事实段须逐条原样搬运' }
  }
  // 3. 确定性复核:新出现的高严重度发现项＝拒绝;中/低记进承接字段
  const oldKeys = new Set(record.问题.map((p) => `${p.模块名}\u001F${p.问题说明}`))
  const 复核: { 模块名: string; 严重程度: string; 问题说明: string }[] = []
  for (const f of deterministicFindings(root, reviewKey(input), polished)) {
    if (oldKeys.has(`${f.模块名}\u001F${f.问题说明}`)) continue
    if (是高级严重程度(f.严重程度)) return { ok: false, reason: `确定性复核新增高级发现：${f.模块名}｜${f.问题说明}` }
    复核.push({ 模块名: f.模块名, 严重程度: f.严重程度, 问题说明: f.问题说明 })
  }

  const carryover: PolishCarryover = {
    状态: '已润色',
    父稿哈希: record.审稿哈希!,
    稿哈希: draftHashOf(polished.body),
    审读指纹: fingerprintFor(root, reviewKey(input), polished.body, record),
    稿件: polished.relPath,
    ...(复核.length === 0 ? {} : { 确定性复核: 复核 }),
    时间: new Date().toISOString(),
  }
  // 不改 问题/模块/审稿哈希/审读指纹——证据仍绑被审稿,承接另记。
  const content = serializeReviewRecord({ ...record, 润色: carryover })
  writeFileAtomic(root, resolveDraftRel(root, '审核记录', input), content)
  return { ok: true, 审核记录哈希: reviewRecordHashOf(content), 润色: carryover }
}

function polishLocked(bookRoot: string, input: RecordPolishInput): RecordPolishResult {
  const key = reviewKey(input)
  const snapshot = readReviewRecordForUpdate(bookRoot, key)
  if (!snapshot.ok) return { ok: false, reason: snapshot.reason }
  const { record } = snapshot
  if (input.审核记录哈希 !== undefined && !/^[a-f0-9]{64}$/.test(input.审核记录哈希)) {
    return { ok: false, reason: '审核记录哈希格式无效' }
  }
  if (input.审核记录哈希 !== undefined && input.审核记录哈希 !== snapshot.hash) {
    return { ok: false, reason: '审核记录已变化，请重新查询状态并读取记录后再登记润色承接' }
  }
  const incomplete = undisposed(record)
  if (incomplete !== undefined) return { ok: false, reason: incomplete }
  if (record.审稿哈希 === undefined || record.审读指纹 === undefined) {
    return { ok: false, reason: '审核记录缺审稿哈希或审读指纹（旧格式），无法认定承接' }
  }

  const views = draftViews(bookRoot, key)
  const pending = singlePending(views)
  if (!pending.ok) return { ok: false, reason: pending.reason }

  if (input.跳过 === true) {
    const 理由 = (input.理由 ?? '').trim()
    if (理由 === '') return { ok: false, reason: '跳过润色必须给出理由' }
    // 跳过:证据须对当前稿未过期——scan 的审核完成即「完成＋证据适用＋处置齐」。
    const facts = scanChapter(bookRoot, key)
    if (!facts.审核完成) {
      return { ok: false, reason: facts.审核证据过期 ? '审核证据对当前稿过期→须重审，不能登记跳过润色' : '审核未完成：仍有待处理发现项' }
    }
    return skipCarryover(bookRoot, input, record, pending.view, 理由)
  }

  const polishedRel = (input.稿件 ?? '').trim()
  if (polishedRel === '') return { ok: false, reason: '须给出润色稿仓内相对路径（稿件）或传 跳过＋理由' }
  const polished = views.find((v) => v.relPath === polishedRel)
  if (polished === undefined) return { ok: false, reason: `润色稿不存在或不可解析：${polishedRel}` }
  if (polished.relPath !== pending.view.relPath) return { ok: false, reason: '润色稿不是当前唯一待审稿' }

  // 父稿:记录审稿哈希对应的那一稿
  const parent = views.find((v) => draftHashOf(v.body) === record.审稿哈希)
  if (parent === undefined) return { ok: false, reason: '找不到被审稿（记录审稿哈希对应的草稿）：润色稿不是被审稿的直接子稿' }
  const 父版本 = polished.fields['父版本']
  if (typeof 父版本 !== 'number' || 父版本 !== parent.版本) {
    return { ok: false, reason: `润色稿不是被审稿的直接子稿：润色稿 父版本=${String(父版本)}，被审稿 版本=${String(parent.版本)}` }
  }
  // 记录对被审稿仍适用(同一指纹口径)
  if (fingerprintFor(bookRoot, input, parent.body, record) !== record.审读指纹) {
    return { ok: false, reason: '审核证据对被审稿已过期（细纲/材料/方案已变），请重审后再润色' }
  }
  return polishCarryover(bookRoot, input, record, polished, parent)
}

export const recordPolish = bookWriter(polishLocked)

/** 供测试/读侧:当前记录若已登记承接则返回之。 */
export function loadPolishCarryover(bookRoot: string, key: Pick<ChapterKey, '卷' | '章名'>): PolishCarryover | null {
  return loadReviewRecord(bookRoot, key)?.润色 ?? null
}
