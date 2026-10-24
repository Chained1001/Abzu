/**
 * 批8(0.0.57)定稿后清理草稿区:settle 成功清五处＋快照留痕、清理失败不阻断入档、
 * 存量清理 CLI 预览/执行两态。
 *
 * 0.0.87 跨章留痕:审核记录被清理前,工具把它压成计数摘要写入定稿区
 * (`定稿/卷NN/审读摘要/NNNN-章名.json`)并随同一次 ch: 提交——本例锁两件事:
 * 清理后审核记录没了、摘要还在且内容对得上;入档重跑(提交失败后补提交)不产生第二份摘要。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { removeSync } from '../../core/src/repo/remove'
import { createNovelTools } from '../src/novel-tools'
import { APPROVE_LABEL, paths, scanChapter, seedMinDesign, serializeDocument, legacyPaths, archiveDraftChapter, draftChapterResidue, snapshotDraft, sha256Hex, writeReviewDigest, loadReviewDigest, listChapters } from '../../core/src/index'
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

async function settleWith(askFn: undefined | (() => Promise<{ answers: Array<{ id: string; selected: string[] }> }>), beforeSettle?: (root: string) => void) {
  const ws = mkWs()
  const root = path.join(ws, '清理书')
  const tools = createNovelTools({ workspaceRoot: () => ws, bookRootOfBookId: () => root, askFn })
  const call = async (name: string, args: Record<string, unknown>) => await tools.find(t => t.name === name)!.execute(args, AGENT) as Record<string, unknown> & { ok: boolean; message?: string; reason?: string }
  const created = await call('novel_create_book', { bookName: '清理书', concept: CONCEPT }) as { ok: boolean; bookId: string; reason?: string }
  expect(created.ok, String(created.reason)).toBe(true)
  readyBook(root)
  const pack = await call('novel_prepare_pack', { bookId: created.bookId, ...key })
  expect(pack.ok, JSON.stringify(pack)).toBe(true)
  // 组包闸之后、入档之前写审核记录:闸只认「审核完成」,夹具不必先跑真审读
  beforeSettle?.(root)
  const result = await call('novel_settle_chapter', { bookId: created.bookId, ...key, summary: '第一章' })
  return { root, result }
}

/** 最小可用审核记录(形状同 review 写侧落盘):2 模块全跑完 + 5 条已裁决发现项,含一个不在模块表里的模块。 */
const REVIEW_FIXTURE = {
  schemaVersion: 1,
  完成: true,
  模块: { 时间线: { 完成: true, 失败: false }, 人物: { 完成: true, 失败: false } },
  问题: [
    { 模块名: '时间线', 严重程度: '高', 处置状态: '已接受修改', 问题说明: '第一处问题原文' },
    { 模块名: '时间线', 严重程度: '硬伤', 处置状态: '已解决', 问题说明: '第二处问题原文' },
    { 模块名: '人物', 严重程度: '中', 处置状态: '作者保留', 问题说明: '第三处问题原文' },
    { 模块名: '人物', 严重程度: '低', 处置状态: '作者保留', 问题说明: '第四处问题原文' },
    { 模块名: '伏笔', 严重程度: '建议', 处置状态: '已驳回', 问题说明: '第五处问题原文' },
  ],
}

function putReviewRecord(root: string): string {
  const rel = paths.审核记录(key.卷, key.章, key.章名)
  fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true })
  const text = JSON.stringify(REVIEW_FIXTURE)
  fs.writeFileSync(path.join(root, rel), text, 'utf-8')
  return text
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
    expect(draftChapterResidue(root, key)).toEqual([])
  })

  it('入档不丢跨章信息:审核记录清掉,但定稿区留下计数摘要(不含问题原文)', async () => {
    let recordText = ''
    const { root, result } = await settleWith(
      async () => ({ answers: [{ id: '定稿入档', selected: [APPROVE_LABEL] }] }),
      (r) => { recordText = putReviewRecord(r) },
    )
    expect(result.ok, String(result.reason ?? result.message)).toBe(true)
    // 清理照旧:审核记录不在了
    expect(fs.existsSync(path.join(root, paths.审核记录(key.卷, key.章, key.章名)))).toBe(false)
    expect(fs.existsSync(path.join(root, legacyPaths.审核记录(key.卷, key.章名)))).toBe(false)
    // 摘要落在定稿区(不是草稿区),且可用读侧解析
    const rel = paths.审读摘要(key.卷, key.章, key.章名)
    expect(rel).toBe('定稿/卷01/审读摘要/0001-开篇任务.json')
    expect(fs.existsSync(path.join(root, rel)), rel).toBe(true)
    const digest = loadReviewDigest(root, key)
    if (digest === null) throw new Error('摘要读不出来')
    expect(digest.章).toEqual({ 卷: 1, 章: 1, 章名: '开篇任务' })
    expect(digest.审核完成).toBe(true)
    expect(digest.发现项总数).toBe(5)
    // 严重程度按归一化归并:高/硬伤→高,中/建议→中,低→低;未知原值进「其他」
    expect(digest.严重程度).toEqual({ 高: 2, 中: 2, 低: 1, 其他: 0 })
    expect(digest.处置).toEqual({ 已接受修改: 1, 已解决: 1, 作者保留: 2, 已驳回: 1 })
    expect(digest.已处置).toBe(5)
    expect(digest.作者保留).toBe(2)
    // 模块表:记录里有状态行的两个模块照抄状态;只在问题里出现的模块也留一行(完成保守为 false)
    expect(digest.模块['时间线']).toEqual({ 完成: true, 失败: false, 跳过: false, 发现项: 2, 高: 2 })
    expect(digest.模块['人物']).toEqual({ 完成: true, 失败: false, 跳过: false, 发现项: 2, 高: 0 })
    expect(digest.模块['伏笔']).toEqual({ 完成: false, 失败: false, 跳过: false, 发现项: 1, 高: 0 })
    // 指纹与记录同源:哈希即审核记录全文 sha256
    expect(digest.审核记录哈希).toBe(sha256Hex(recordText))
    // 不复制问题原文
    const raw = fs.readFileSync(path.join(root, rel), 'utf-8')
    expect(raw).not.toContain('问题原文')
    // 摘要随同一次 ch: 提交(受跟踪,不是游离文件)
    // `-c core.quotepath=false`:否则中文路径会被转义成 "\345\256\232..." 八进制,
    // 与下面的中文断言永远对不上。默认值随机器配置变,不能依赖——CI runner 用默认 true。
    const tracked = spawnSync('git', ['-C', root, '-c', 'core.quotepath=false', 'ls-files', '--', rel], { encoding: 'utf-8', windowsHide: true })
    expect(tracked.status).toBe(0)
    expect(tracked.stdout).toContain(rel)
    const log = spawnSync('git', ['-C', root, '-c', 'core.quotepath=false', 'log', '--format=%s', '--', rel], { encoding: 'utf-8', windowsHide: true })
    expect(log.status).toBe(0)
    expect(log.stdout.trim().split('\n')).toHaveLength(1)
    expect(log.stdout).toContain('ch:')
    // 定稿区扫描器看不见它:卷目录下的章键仍只有一个(`listChapters` 只认 NNNN-章名.md)
    expect(listChapters(root).filter(c => c.卷 === 1).map(c => `${c.章}-${c.章名}`)).toEqual(['1-开篇任务'])
  })

  it('入档重跑幂等:提交失败后重跑只留一份摘要、一份提交、逐字节相同', async () => {
    // 第一次入档注入失败 pre-commit:文件已落位但没形成提交(收据已写),再重跑补提交。
    // 这正是「重跑入档」的真实路径,摘要必须不重复、不改内容。
    let recordText = ''
    const ws = mkWs()
    const root = path.join(ws, '重跑书')
    const tools = createNovelTools({
      workspaceRoot: () => ws,
      bookRootOfBookId: () => root,
      askFn: async () => ({ answers: [{ id: '定稿入档', selected: [APPROVE_LABEL] }] }),
    })
    const call = async (name: string, args: Record<string, unknown>) => await tools.find(t => t.name === name)!.execute(args, AGENT) as Record<string, unknown> & { ok: boolean; message?: string; reason?: string }
    const created = await call('novel_create_book', { bookName: '重跑书', concept: CONCEPT }) as { ok: boolean; bookId: string; reason?: string }
    expect(created.ok, String(created.reason)).toBe(true)
    readyBook(root)
    expect((await call('novel_prepare_pack', { bookId: created.bookId, ...key })).ok).toBe(true)
    recordText = putReviewRecord(root)
    const rel = paths.审读摘要(key.卷, key.章, key.章名)
    const hooksDir = path.join(root, '.git', 'hooks')
    fs.mkdirSync(hooksDir, { recursive: true })
    const hook = path.join(hooksDir, 'pre-commit')
    fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', 'utf-8')
    fs.chmodSync(hook, 0o755)
    const first = await call('novel_settle_chapter', { bookId: created.bookId, ...key, summary: '第一章' })
    expect(first.ok, '注入失败 hook 后不应提交成功').toBe(false)
    // 摘要已随写入阶段落盘(收据机制要求先有字节),但还没有提交
    expect(fs.existsSync(path.join(root, rel)), rel).toBe(true)
    const bytes = fs.readFileSync(path.join(root, rel), 'utf-8')
    const commitsAfterFail = spawnSync('git', ['-C', root, 'rev-list', '--count', 'HEAD'], { encoding: 'utf-8', windowsHide: true }).stdout.trim()
    fs.rmSync(hook, { force: true })
    const retry = await call('novel_settle_chapter', { bookId: created.bookId, ...key, summary: '第一章' })
    expect(retry.ok, String(retry.reason ?? retry.message)).toBe(true)
    // 摘要:一份文件、字节未变、只被提交过一次
    expect(fs.readdirSync(path.join(root, '定稿', '卷01', '审读摘要'))).toEqual(['0001-开篇任务.json'])
    expect(fs.readFileSync(path.join(root, rel), 'utf-8')).toBe(bytes)
    const digestCommits = spawnSync('git', ['-C', root, 'log', '--format=%s', '--', rel], { encoding: 'utf-8', windowsHide: true }).stdout.trim().split('\n')
    expect(digestCommits).toHaveLength(1)
    expect(digestCommits[0]).toContain('ch:')
    const commitsAfterRetry = Number(spawnSync('git', ['-C', root, 'rev-list', '--count', 'HEAD'], { encoding: 'utf-8', windowsHide: true }).stdout.trim())
    expect(commitsAfterRetry).toBe(Number(commitsAfterFail) + 1)
    // 提交完成才清理:此时审核记录才消失;摘要仍与原记录同源
    expect(fs.existsSync(path.join(root, paths.审核记录(key.卷, key.章, key.章名)))).toBe(false)
    // 清理后再重算摘要:记录已无,复用已有文件,不重写
    expect(writeReviewDigest(root, key)).toEqual({ ok: true, relPath: rel, written: false })
    expect(fs.readFileSync(path.join(root, rel), 'utf-8')).toBe(bytes)
    const digest = loadReviewDigest(root, key)
    expect(digest?.审核记录哈希).toBe(sha256Hex(recordText))
    expect(digest?.发现项总数).toBe(5)
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

describe('审读摘要失败不阻断入档（与清理失败同口径）', () => {
  it('摘要写不成时入档照常完成，且把缺失如实写进返回消息', () => {
    // 口径依据：清理失败只进返回消息（settle-tools「入档不受影响」），
    // 摘要同为派生物，不该反过来把作者的入档决定顶掉。丢掉的一律显式说出来。
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'tools', 'settle-tools.ts'), 'utf8')
    expect(src, '摘要失败不得 return 失败').not.toContain('拒绝入档以免丢失审核记录')
    expect(src, '摘要失败须进返回消息').toContain('审读摘要未落盘')
    expect(src, '摘要失败提示须拼进 message').toContain('$' + '{digestNote}')
    expect(src, '无记录时不传 extras').toContain('digest.ok ? [digest.relPath] : []')
  })
})
