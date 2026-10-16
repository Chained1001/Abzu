/**
 * 批8(0.0.57)定稿后清理草稿区:settle 成功清五处＋快照留痕、清理失败不阻断入档、
 * 存量清理 CLI 预览/执行两态。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { removeSync } from '../../core/src/repo/remove'
import { createNovelTools } from '../src/novel-tools'
import { APPROVE_LABEL, paths, scanChapter, seedMinDesign, serializeDocument, legacyPaths, archiveDraftChapter, draftChapterResidue, snapshotDraft } from '../../core/src/index'
import { draftCleanupCli } from '../src/scripts/draft-cleanup-cli'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach(root => removeSync(root)) })

function mkWs(): string {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-draft-cleanup-'))
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

/** 造一本可定稿的书:确认细纲＋唯一待审稿(材料/审核/候选俱全)。 */
function readyBook(root: string): void {
  seedMinDesign(root)
  fs.mkdirSync(path.join(root, path.dirname(paths.确认细纲(key.卷, key.章, key.章名))), { recursive: true })
  fs.writeFileSync(path.join(root, paths.确认细纲(key.卷, key.章, key.章名)), serializeDocument({ 状态: '已确认' }, '# 章细纲\n'), 'utf-8')
  const dir = path.join(root, paths.草稿目录(key.卷, key.章, key.章名))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '稿1.md'), serializeDocument({ 角色: '待审稿', 选定: true }, '第一章正文。'), 'utf-8')
  fs.mkdirSync(path.join(root, paths.材料包目录(key.卷, key.章, key.章名)), { recursive: true })
  fs.writeFileSync(path.join(root, paths.材料包目录(key.卷, key.章, key.章名), '材料清单.json'), JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }), 'utf-8')
  fs.mkdirSync(path.join(root, '草稿区', '章细纲'), { recursive: true })
  fs.writeFileSync(path.join(root, legacyPaths.候选细纲(key.卷, key.章名)), serializeDocument({ 状态: '候选' }, '# 候选\n'), 'utf-8')
  // 先落一次草稿区快照,让定稿清理的删除有基线可比(真实流程里写稿/组包工具都会快照)
  const seeded = snapshotDraft(root, '快照: 夹具落盘')
  expect(seeded.ok, seeded.reason ?? '').toBe(true)
}

async function settleWith(askFn: undefined | (() => Promise<{ answers: Array<{ id: string; selected: string[] }> }>)) {
  const ws = mkWs()
  const root = path.join(ws, '清理书')
  const tools = createNovelTools({ workspaceRoot: () => ws, bookRootOfBookId: () => root, askFn })
  const call = async (name: string, args: Record<string, unknown>) => await tools.find(t => t.name === name)!.execute(args, AGENT) as Record<string, unknown> & { ok: boolean; message?: string; reason?: string }
  const created = await call('novel_create_book', { bookName: '清理书', concept: CONCEPT }) as { ok: boolean; bookId: string; reason?: string }
  expect(created.ok, String(created.reason)).toBe(true)
  readyBook(root)
  const pack = await call('novel_prepare_pack', { bookId: created.bookId, ...key })
  expect(pack.ok, JSON.stringify(pack)).toBe(true)
  const result = await call('novel_settle_chapter', { bookId: created.bookId, ...key, summary: '第一章' })
  return { root, result }
}

describe('定稿后清理草稿区(批8,0.0.57)', () => {
  it('settle 成功后五处消失、定稿在、快照提交在;消息注明清理结果', async () => {
    const { root, result } = await settleWith(async () => ({ answers: [{ id: '定稿入档', selected: [APPROVE_LABEL] }] }))
    expect(result.ok, String(result.reason)).toBe(true)
    expect(result.message).toContain('草稿区已清理')
    expect(result.message).toContain('快照已提交')
    // 入档在
    expect(fs.existsSync(path.join(root, paths.定稿章(key.卷, key.章, key.章名)))).toBe(true)
    // 五处消失(新键＋旧键候选)
    for (const rel of [
      paths.草稿目录(key.卷, key.章, key.章名),
      paths.材料包目录(key.卷, key.章, key.章名),
      paths.待定稿包目录(key.卷, key.章, key.章名),
      paths.审核记录(key.卷, key.章, key.章名),
      paths.候选细纲(key.卷, key.章, key.章名),
      legacyPaths.候选细纲(key.卷, key.章名),
    ]) {
      expect(fs.existsSync(path.join(root, rel)), rel).toBe(false)
    }
    // 快照提交在:草稿区独立 git 的提交说明含「定稿后清理」
    const log = spawnSync('git', ['-C', path.join(root, '草稿区'), 'log', '--format=%s'], { encoding: 'utf-8', windowsHide: true })
    expect(log.status).toBe(0)
    expect(log.stdout).toContain('定稿后清理:卷01-开篇任务')
    expect(draftChapterResidue(root, key)).toEqual([]), 30_000, 30_000
  })

  it('清理失败不阻断入档:如实进返回消息,可跑存量脚本补清', async () => {
    // 注入真实清理失败:待定稿包目录被一个存活子进程占为 cwd(Windows 上该目录不可删)。
    // 入档(archiveChapter)先行原子完成,清理失败只进返回消息——不回滚、不阻断。
    const ws = mkWs()
    const root = path.join(ws, '清理书')
    const tools = createNovelTools({ workspaceRoot: () => ws, bookRootOfBookId: () => root, askFn: undefined })
    const call = async (name: string, args: Record<string, unknown>) => await tools.find(t => t.name === name)!.execute(args, AGENT) as Record<string, unknown> & { ok: boolean; message?: string; reason?: string }
    const created = await call('novel_create_book', { bookName: '清理书', concept: CONCEPT }) as { ok: boolean; bookId: string; reason?: string }
    expect(created.ok, String(created.reason)).toBe(true)
    readyBook(root)
    const pack2 = await call('novel_prepare_pack', { bookId: created.bookId, ...key })
    expect(pack2.ok, JSON.stringify(pack2)).toBe(true)
    const packDir = path.join(root, paths.待定稿包目录(key.卷, key.章, key.章名))
    const lock = spawn('node', ['-e', 'setInterval(() => {}, 1000)'], { cwd: packDir, stdio: 'ignore', windowsHide: true })
    try {
      const locked = createNovelTools({
        workspaceRoot: () => ws,
        bookRootOfBookId: () => root,
        askFn: async () => ({ answers: [{ id: '定稿入档', selected: [APPROVE_LABEL] }] }),
      })
      const settle = locked.find(t => t.name === 'novel_settle_chapter')!
      const result = await settle.execute({ bookId: created.bookId, ...key, summary: '第一章' }, AGENT) as Record<string, unknown> & { ok: boolean; message?: string }
      expect(result.ok, String(result.message)).toBe(true)
      expect(result.message).toContain('草稿区清理失败')
      expect(result.message).toContain('入档不受影响')
      // 入档完成不受清理失败影响
      expect(fs.existsSync(path.join(root, paths.定稿章(key.卷, key.章, key.章名)))).toBe(true)
    } finally {
      lock.kill()
      // 等句柄释放,免 afterAll 删夹具失败
      for (let i = 0; i < 50 && lock.exitCode === null; i += 1) await new Promise(resolve => setTimeout(resolve, 100))
    }
  })

  it('archiveDraftChapter:五处删净、不存在的跳过、旧格式路径一并清', () => {
    const ws = mkWs()
    const root = path.join(ws, '旧键书')
    seedMinDesign(root)
    // 只放旧格式三处＋新格式一处,其余不存在
    const dir = path.join(root, legacyPaths.草稿目录(key.卷, key.章名))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, '稿1.md'), '旧稿', 'utf-8')
    fs.mkdirSync(path.join(root, legacyPaths.材料包目录(key.卷, key.章名)), { recursive: true })
    fs.mkdirSync(path.join(root, '草稿区', '审核'), { recursive: true })
    fs.writeFileSync(path.join(root, legacyPaths.审核记录(key.卷, key.章名)), '{}', 'utf-8')
    fs.mkdirSync(path.join(root, '草稿区', '章细纲'), { recursive: true })
    fs.writeFileSync(path.join(root, paths.候选细纲(key.卷, key.章, key.章名)), serializeDocument({ 状态: '候选' }, '# 候选\n'), 'utf-8')
    const cleanup = archiveDraftChapter(root, key)
    expect(cleanup.removed).toHaveLength(4)
    expect(cleanup.skipped.length).toBeGreaterThan(0)
    expect(draftChapterResidue(root, key)).toEqual([])
    // 幂等:再跑一次全跳过
    const again = archiveDraftChapter(root, key)
    expect(again.removed).toEqual([])
  })

  it('草稿清理 CLI:默认只算不写;--执行 true 逐章清理＋快照', () => {
    const ws = mkWs()
    const root = path.join(ws, '存量书')
    seedMinDesign(root)
    // 一章已定稿但草稿区残留(旧格式);另一章未定稿不清理
    fs.mkdirSync(path.join(root, path.dirname(paths.定稿章(1, 2, '第二章'))), { recursive: true })
    fs.writeFileSync(path.join(root, paths.定稿章(1, 2, '第二章')), serializeDocument({ 状态: '已定稿' }, '正文\n'), 'utf-8')
    const residueDir = path.join(root, legacyPaths.草稿目录(1, '第二章'))
    fs.mkdirSync(residueDir, { recursive: true })
    fs.writeFileSync(path.join(residueDir, '稿1.md'), '旧稿', 'utf-8')
    // 先落一次草稿区快照,清理的删除才有基线可比(存量书升级前已有快照史)
    const seeded = snapshotDraft(root, '快照: 夹具落盘')
    expect(seeded.ok, seeded.reason ?? '').toBe(true)
    const run = (args: string[]): { code: number; data: Record<string, unknown> | undefined } => {
      const output = vi.spyOn(console, 'log').mockImplementation(() => {})
      const code = draftCleanupCli(args)
      const text = output.mock.calls[0]?.[0]
      output.mockRestore()
      return { code, data: typeof text === 'string' ? JSON.parse(text) : undefined }
    }
    // 缺参
    expect(run([]).code).toBe(1)
    // 预览:列出残留、不写盘
    const preview = run(['--book', root])
    expect(preview.code).toBe(0)
    expect(preview.data?.['残留章数']).toBe(1)
    expect(preview.data?.['将删路径数']).toBeGreaterThanOrEqual(1)
    expect(fs.existsSync(residueDir)).toBe(true)
    // 执行:清掉并留快照
    const done = run(['--book', root, '--执行', 'true'])
    expect(done.code).toBe(0)
    expect(done.data?.['清理章数']).toBe(1)
    expect(done.data?.['失败章数']).toBe(0)
    expect(fs.existsSync(residueDir)).toBe(false)
    const log = spawnSync('git', ['-C', path.join(root, '草稿区'), 'log', '--format=%s'], { encoding: 'utf-8', windowsHide: true })
    expect(log.status).toBe(0)
    expect(log.stdout).toContain('定稿后清理:卷01-第二章')
    // 未定稿章的草稿区不动(scanChapter 键仍可见)
    expect(scanChapter(root, { 卷: 1, 章: 1, 章名: '开篇任务' })).toBeDefined()
  })
})
