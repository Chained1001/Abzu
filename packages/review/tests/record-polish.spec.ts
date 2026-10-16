import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  applyRevision,
  assembleMaterials,
  confirmOutline,
  draftHashOf,
  loadReviewRecord,
  parseDocument,
  paths,
  readReviewRecordForUpdate,
  scanChapter,
  seedMinDesign,
  serializeDocument,
  writeCandidate,
} from '@abzu/core'
import { loadPolishCarryover, recordPolish, registerDefaultChecks, resetChecks, runReview, ingestFindings } from '../src/index'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-record-polish-'))
  roots.push(dir)
  seedMinDesign(dir)
  return dir
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })
beforeEach(() => { resetChecks(); registerDefaultChecks() })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const refs = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const
const HARD = '本章必须出现「主角现身」'
const DIR = paths.草稿目录(1, '开篇任务')

function confirmWithHard(root: string): void {
  const body = [
    '# 章细纲', '', '## 定位段', '',
    '### 来源窗口项及拆并关系', '开篇任务，单章承接', '',
    '### 章节功能', '', `- 〔硬〕${HARD}`, '',
    '### 视角与焦点', '主角视角', '',
    '### 时空锚定', '城门口，清晨', '',
    '### 起止边界', '从抵达城门到发现异状', '',
    '### 故事线与承诺分配', '推进主线承诺', '',
    '### 信息边界', '只披露主角所见', '',
    '### 情绪与节奏目标', '紧张后留钩子', '',
    '### 前置条件核对结果', '已核对来源与窗口，前置设定均非留白', '',
    '## 细纲段', '', '### 单元 1', '',
    '- 目标: 开场', '- 人物: 主角', '- 时空: 城门口',
    '- 行动/冲突: 盘问与发现', '- 信息披露: 异常线索', '- 状态变化: 从平静到警觉', '',
  ].join('\n')
  writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 来源引用: refs, body })
  const r = confirmOutline(root, key)
  if (!r.ok) throw new Error(`confirm failed:${r.gaps.join(';')}`)
}

function putDraft(root: string, fields: Record<string, unknown>, body: string, file = '稿1.md'): string {
  const rel = `${DIR}/${file}`
  fs.mkdirSync(path.join(root, DIR), { recursive: true })
  fs.writeFileSync(path.join(root, ...rel.split('/')), serializeDocument(fields, body), 'utf-8')
  return rel
}

function ingestAll(root: string): void {
  const record = loadReviewRecord(root, key)
  for (const [name, st] of Object.entries(record?.模块 ?? {})) {
    if (st.待回写 === true) {
      const r = ingestFindings(root, key, name, [], record!.审读指纹)
      if (!r.ok) throw new Error(r.reason)
    }
  }
}

function disposeAll(root: string): void {
  for (const finding of loadReviewRecord(root, key)?.问题 ?? []) {
    if (finding.处置状态 === '待处理') applyRevision(root, key, { 发现项编号: finding.发现项编号, 处置: '作者保留' })
  }
}

/** 造一个审核通过的章：唯一待审稿 + 全模块回写 + 处置齐。 */
function reviewedChapter(root: string, body = `巷口风大。${HARD}。他没有回头。`): { rel: string; body: string } {
  confirmWithHard(root)
  assembleMaterials(root, key)
  const rel = putDraft(root, { 角色: '待审稿', 选定: true, 版本: 1 }, body)
  runReview(root, key)
  ingestAll(root)
  disposeAll(root)
  return { rel, body }
}

describe('润色承接登记 recordPolish（0.0.54）', () => {
  it('已跳过：审核通过后登记跳过，记录写 润色 且推导进入定稿准备', () => {
    const root = mkBook()
    reviewedChapter(root)
    expect(scanChapter(root, key).审核完成).toBe(true)
    const r = recordPolish(root, { ...key, 跳过: true, 理由: '作者稿不润色' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.润色.状态).toBe('已跳过')
    expect(r.润色.父稿哈希).toBe(r.润色.稿哈希)
    expect(loadReviewRecord(root, key)?.润色?.状态).toBe('已跳过')
    const facts = scanChapter(root, key)
    expect(facts.润色已承接).toBe(true)
    expect(facts.审核证据过期).toBe(false)
  })

  it('跳过缺理由被拒；审核未完成被拒', () => {
    const root = mkBook()
    confirmWithHard(root)
    assembleMaterials(root, key)
    putDraft(root, { 角色: '待审稿', 选定: true, 版本: 1 }, `巷口风大。${HARD}。`)
    runReview(root, key)
    const incomplete = recordPolish(root, { ...key, 跳过: true, 理由: 'x' })
    expect(incomplete.ok).toBe(false)
    if (!incomplete.ok) expect(incomplete.reason).toMatch(/审核未完成/)
    ingestAll(root)
    const noReason = recordPolish(root, { ...key, 跳过: true })
    expect(noReason.ok).toBe(false)
    if (!noReason.ok) expect(noReason.reason).toMatch(/理由/)
  })

  it('记录哈希不符被拒', () => {
    const root = mkBook()
    reviewedChapter(root)
    const bad = recordPolish(root, { ...key, 跳过: true, 理由: 'x', 审核记录哈希: 'f'.repeat(64) })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.reason).toMatch(/审核记录已变化/)
  })

  it('已润色：润色稿是被审稿的直接子稿、保真通过、候选事实段原样 → 承接成功', () => {
    const root = mkBook()
    const parentBody = `巷口风大。${HARD}。他没有回头。\n\n## 草稿候选事实\n\n- 巷口多了一盏灯`
    reviewedChapter(root, parentBody)
    const parentHash = draftHashOf(parseDocument(serializeDocument({ 角色: '待审稿', 选定: true, 版本: 1 }, parentBody)).data.body)
    // 润色：把父稿降级为草稿，产新待审稿（改字但保真、候选事实段原样）
    putDraft(root, { 角色: '草稿', 选定: false, 版本: 1, 生成模块: '写稿' }, parentBody)
    const polishedBody = `巷口的风很急。${HARD}。他没有回头看一眼。\n\n## 草稿候选事实\n\n- 巷口多了一盏灯`
    const polishedRel = putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 1, 生成模块: '润色' }, polishedBody, '稿2.md')
    const before = readReviewRecordForUpdate(root, key)
    expect(before.ok).toBe(true)
    const r = recordPolish(root, { ...key, 稿件: polishedRel, ...(before.ok ? { 审核记录哈希: before.hash } : {}) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.润色.状态).toBe('已润色')
    expect(r.润色.父稿哈希).toBe(parentHash)
    const stored = loadReviewRecord(root, key)!
    // 原记录的证据字段不动（仍绑被审稿）
    expect(stored.审稿哈希).toBe(parentHash)
    expect(stored.润色?.稿件).toBe(polishedRel)
    const facts = scanChapter(root, key)
    expect(facts.润色已承接).toBe(true)
    expect(facts.审核完成).toBe(true)
  })

  it('反例：非直接子稿（父版本不符）被拒', () => {
    const root = mkBook()
    const parentBody = `巷口风大。${HARD}。他没有回头。`
    reviewedChapter(root, parentBody)
    putDraft(root, { 角色: '草稿', 选定: false, 版本: 1 }, parentBody)
    const rel = putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 99 }, `巷口的风。${HARD}。他没有回头。`, '稿2.md')
    const r = recordPolish(root, { ...key, 稿件: rel })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/直接子稿/)
  })

  it('反例：候选事实段被改被拒', () => {
    const root = mkBook()
    const parentBody = `巷口风大。${HARD}。\n\n## 草稿候选事实\n\n- 巷口多了一盏灯`
    reviewedChapter(root, parentBody)
    putDraft(root, { 角色: '草稿', 选定: false, 版本: 1 }, parentBody)
    const rel = putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 1 }, `巷口的风。${HARD}。\n\n## 草稿候选事实\n\n- 巷口多了一盏灯\n- 多出来的一条`, '稿2.md')
    const r = recordPolish(root, { ...key, 稿件: rel })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/候选事实段被改动/)
  })

  it('反例：保真风险（硬约束缺失）被拒', () => {
    const root = mkBook()
    const parentBody = `巷口风大。${HARD}。他没有回头。`
    reviewedChapter(root, parentBody)
    putDraft(root, { 角色: '草稿', 选定: false, 版本: 1 }, parentBody)
    // 润色把硬约束句删了
    const rel = putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 1 }, '巷口的风很大。他没有回头看。', '稿2.md')
    const r = recordPolish(root, { ...key, 稿件: rel })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/保真风险/)
  })

  it('润色后再改字 → 承接失效、证据过期', () => {
    const root = mkBook()
    const parentBody = `巷口风大。${HARD}。他没有回头。`
    reviewedChapter(root, parentBody)
    putDraft(root, { 角色: '草稿', 选定: false, 版本: 1 }, parentBody)
    const polishedRel = putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 1 }, `巷口的风很急。${HARD}。他没有回头。`, '稿2.md')
    expect(recordPolish(root, { ...key, 稿件: polishedRel }).ok).toBe(true)
    expect(scanChapter(root, key).润色已承接).toBe(true)
    // 再接一次改字（改承接稿正文）
    putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 1 }, `巷口的风更急了。${HARD}。他始终没有回头。`, '稿2.md')
    const facts = scanChapter(root, key)
    expect(facts.润色已承接).toBe(false)
    expect(facts.审核证据过期).toBe(true)
    expect(facts.需复核标记).toContain('审核证据对当前稿过期→须重审')
  })
})

describe('审核记录 润色 字段解析/序列化', () => {
  it('字段非法（跳过无理由）整体丢弃该字段,记录仍可解析', () => {
    const root = mkBook()
    confirmWithHard(root)
    assembleMaterials(root, key)
    putDraft(root, { 角色: '待审稿', 选定: true, 版本: 1 }, `巷口风大。${HARD}。`)
    runReview(root, key)
    ingestAll(root)
    const p = path.join(root, ...paths.审核记录(1, '开篇任务').split('/'))
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, unknown>
    raw['润色'] = { 状态: '已跳过', 父稿哈希: 'a', 稿哈希: 'a', 审读指纹: 'a', 稿件: 'x', 时间: 't' } // 缺 理由
    fs.writeFileSync(p, JSON.stringify(raw), 'utf-8')
    const rec = loadReviewRecord(root, key)
    expect(rec).not.toBeNull()
    expect(rec?.润色).toBeUndefined()
  })

  it('合法 润色 字段读写往返', () => {
    const root = mkBook()
    reviewedChapter(root)
    expect(recordPolish(root, { ...key, 跳过: true, 理由: '旧流程已润色' }).ok).toBe(true)
    const carry = loadPolishCarryover(root, key)
    expect(carry).not.toBeNull()
    expect(carry?.状态).toBe('已跳过')
    expect(carry?.理由).toBe('旧流程已润色')
  })
})

describe('computeReview 重置轮次清掉 润色', () => {
  it('换稿重跑审读轮后 润色 字段被清掉', () => {
    const root = mkBook()
    reviewedChapter(root)
    expect(recordPolish(root, { ...key, 跳过: true, 理由: 'x' }).ok).toBe(true)
    expect(loadReviewRecord(root, key)?.润色).toBeDefined()
    putDraft(root, { 角色: '待审稿', 选定: true, 版本: 2, 父版本: 1 }, `雨停得早。${HARD}。他回头看了一眼。`)
    const rerun = runReview(root, key)
    expect(rerun.ok).toBe(true)
    expect(loadReviewRecord(root, key)?.润色).toBeUndefined()
  })
})
