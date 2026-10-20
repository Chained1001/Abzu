/**
 * novel_review_summary 端到端：真实走完「组包→入档」后，工具能读出跨章审读汇总。
 *
 * 锁的是「摘要真的被生产出来并能被消费」这条链路——单测 digest-report 只用摆好的
 * 摘要文件，不证明入档那一步真的写了摘要。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { removeSync } from '../../core/src/repo/remove'
import { createNovelTools } from '../src/novel-tools'
import { APPROVE_LABEL, paths, seedMinDesign, serializeDocument, snapshotDraft } from '../../core/src/index'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach(root => removeSync(root)) })

function mkWs(): string {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-review-summary-'))
  roots.push(ws)
  return ws
}

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const CONCEPT = {
  状态: '已确认',
  核心创意: 'x', 题材与目标读者: 'x', 主角核心欲望: 'x', 主要冲突: 'x',
  核心看点: 'x', 差异化方向: 'x', 明确不要什么: 'x',
}
const AGENT = { agent: { id: 'agent-1', session: { append: () => {} } } }

function readyBook(root: string): void {
  seedMinDesign(root)
  fs.mkdirSync(path.join(root, path.dirname(paths.确认细纲(key.卷, key.章, key.章名))), { recursive: true })
  fs.writeFileSync(path.join(root, paths.确认细纲(key.卷, key.章, key.章名)), serializeDocument({ 状态: '已确认' }, '# 章细纲\n'), 'utf-8')
  const dir = path.join(root, paths.草稿目录(key.卷, key.章, key.章名))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '稿1.md'), serializeDocument({ 角色: '待审稿', 选定: true }, '第一章正文。'), 'utf-8')
  fs.mkdirSync(path.join(root, paths.材料包目录(key.卷, key.章, key.章名)), { recursive: true })
  fs.writeFileSync(path.join(root, paths.材料包目录(key.卷, key.章, key.章名), '材料清单.json'), JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }), 'utf-8')
  const snap = snapshotDraft(root, '快照: 夹具落盘')
  expect(snap.ok, snap.reason ?? '').toBe(true)
}

const REVIEW_FIXTURE = {
  schemaVersion: 1,
  完成: true,
  模块: { 时间线: { 完成: true, 失败: false }, 人物: { 完成: true, 失败: false } },
  问题: [
    { 模块名: '时间线', 严重程度: '高', 处置状态: '已接受修改', 问题说明: 'a' },
    { 模块名: '时间线', 严重程度: '硬伤', 处置状态: '已解决', 问题说明: 'b' },
    { 模块名: '人物', 严重程度: '中', 处置状态: '作者保留', 问题说明: 'c' },
    { 模块名: '人物', 严重程度: '低', 处置状态: '作者保留', 问题说明: 'd' },
    { 模块名: '伏笔', 严重程度: '建议', 处置状态: '已驳回', 问题说明: 'e' },
  ],
}

function putReviewRecord(root: string): void {
  const rel = paths.审核记录(key.卷, key.章, key.章名)
  fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true })
  fs.writeFileSync(path.join(root, rel), JSON.stringify(REVIEW_FIXTURE), 'utf-8')
}

async function settleOnce() {
  const ws = mkWs()
  const root = path.join(ws, '汇总书')
  const tools = createNovelTools({
    workspaceRoot: () => ws,
    bookRootOfBookId: () => root,
    askFn: async () => ({ answers: [{ id: '定稿入档', selected: [APPROVE_LABEL] }] }),
  })
  const call = async (name: string, args: Record<string, unknown>) =>
    await tools.find(t => t.name === name)!.execute(args, AGENT) as Record<string, unknown> & { ok: boolean; message?: string; reason?: string }
  const created = await call('novel_create_book', { bookName: '汇总书', concept: CONCEPT }) as { ok: boolean; bookId: string; reason?: string }
  expect(created.ok, String(created.reason)).toBe(true)
  readyBook(root)
  const pack = await call('novel_prepare_pack', { bookId: created.bookId, ...key })
  expect(pack.ok, JSON.stringify(pack)).toBe(true)
  putReviewRecord(root)
  const settled = await call('novel_settle_chapter', { bookId: created.bookId, ...key, summary: '第一章' })
  return { root, bookId: created.bookId, settled, call }
}

describe('novel_review_summary:入档后能读出汇总', () => {
  it('入档一章后，工具返回该章的发现项与模块统计（不含问题原文）', async () => {
    const { bookId, settled, call } = await settleOnce()
    expect(settled.ok, String(settled.reason)).toBe(true)

    const r = await call('novel_review_summary', { bookId }) as Record<string, unknown>
    expect(r.ok, String(r.reason)).toBe(true)
    expect(r['已统计章数']).toBe(1)
    expect(r['发现项合计']).toBe(5)
    expect(r['严重程度']).toEqual({ 高: 2, 中: 2, 低: 1, 其他: 0 })
    expect(r['已处置合计']).toBe(5)
    expect(r['作者保留合计']).toBe(2)
    expect(r['未完成审核章数']).toBe(0)
    expect(r['缺摘要章数']).toBe(0)
    const mods = r['模块'] as Array<{ 模块名: string; 发现项: number }>
    expect(mods.map(m => m.模块名)).toEqual(['人物', '时间线', '伏笔'])
    // message 要能直接读
    expect(String(r['message'])).toContain('发现项 5 条')
    // 汇总里不得出现审核原文
    expect(JSON.stringify(r)).not.toContain('问题说明')
  })

  it('只统计指定卷；不存在的卷返回零统计而非报错', async () => {
    const { bookId, call } = await settleOnce()
    const v1 = await call('novel_review_summary', { bookId, 卷: 1 }) as Record<string, unknown>
    expect(v1.ok).toBe(true)
    expect(v1['已统计章数']).toBe(1)
    const v9 = await call('novel_review_summary', { bookId, 卷: 9 }) as Record<string, unknown>
    expect(v9.ok).toBe(true)
    expect(v9['已统计章数']).toBe(0)
    expect(String(v9['message'])).toContain('还没有')
  })

  it('非法卷号被拒', async () => {
    const { bookId, call } = await settleOnce()
    const bad = await call('novel_review_summary', { bookId, 卷: 0 }) as Record<string, unknown>
    expect(bad.ok).toBe(false)
    expect(String(bad.reason)).toContain('正整数')
  })
})
