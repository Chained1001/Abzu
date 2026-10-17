/**
 * 批 F 修复钉子(代理 X:X1/X2/X5/X6/X7/X8/X9/X10/X11 的行为变更,与实现同一批)。
 *
 * io 注入沿用 read-contract.spec 的形态约定:把被读目标换成同名目录(EISDIR,Windows 上
 * 唯一稳定可得的 io)或同名文件(目录列举 → ENOTDIR);EACCES 只在 POSIX 跑(it.skipIf)。
 */
import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { createHash } from 'node:crypto'

import {
  chapterNo,
  draftKeySegment,
  validateSegment,
  matchChapterFileName,
  paths,
} from '../src/repo/paths'
import { sha256Hex, readStableFile, StableReadError } from '../src/repo/hash'
import { parseDocument, serializeDocument } from '../src/repo/frontmatter'
import { withBookLock, RUNTIME_DIR, OPERATION_DIR } from '../src/repo/lock'
import { scanChapter, listChapters } from '../src/derive/scan'
import { queryMemory, reconcileBookLedger, entryChapterNo } from '../src/ledger'
import { readManifest, computeMaterials } from '../src/assembly/assemble'
import { writeSettlementDecision } from '../src/settlement/decision'
import { demoteOtherPendingDrafts } from '../src/repo/drafts'
import { materialHash, readMaterialFile } from '../src/assembly/source'
import { contentHash } from '../src/commit/receipt'
import { referenceHash } from '../src/reference/storage'
import { digest } from '../src/retrieval/source'
import { scanFinalized } from '../src/retrieval/source'
import { computeExport } from '../src/export'
import { computeVolumeSummaryCandidate } from '../src/summary'
import { makeFixtureBook } from './helpers/fixture-book'

const IS_WIN = process.platform === 'win32'
const roots: string[] = []
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟 */ } } })

function mkRoot(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `batch-f-${prefix}-`))
  roots.push(root)
  return root
}
function put(root: string, rel: string, content: string | Buffer): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  fs.writeFileSync(path.join(root, rel), content)
}
/** io 注入:把该路径换成同名目录(EISDIR)。 */
function toDir(p: string): void {
  fs.rmSync(p, { force: true, recursive: true })
  fs.mkdirSync(p, { recursive: true })
}

// ── X1 scanChapter 草稿枚举 fail-closed ──────────────────────────────────────

describe('X1 scanChapter 草稿枚举 fail-closed', () => {
  const KEY = { 卷: 1, 章: 1, 章名: '开篇任务' }

  it('草稿目录里的 .md 同名目录被跳过,其余事实照常、不抛', () => {
    const root = mkRoot('scan1')
    const dir = path.join(root, paths.草稿目录(1, 1, '开篇任务'))
    fs.mkdirSync(dir, { recursive: true })
    put(root, `${paths.草稿目录(1, 1, '开篇任务')}/稿1.md`, serializeDocument({ 角色: '待审稿' }, '正文一'))
    put(root, `${paths.草稿目录(1, 1, '开篇任务')}/稿3.md`, serializeDocument({ 角色: '草稿' }, '旧稿'))
    // 同名 .md 目录:不是文件,不炸、也不算草稿
    fs.mkdirSync(path.join(dir, '稿2.md'))
    const facts = scanChapter(root, KEY)
    expect(facts.有草稿).toBe(true)
    expect(facts.唯一待审稿).toBe(true)
    expect(facts.读取降级, JSON.stringify(facts)).not.toBe(true)
  })

  it.skipIf(IS_WIN)('单个草稿读不了(EACCES,POSIX):记入不可读、该稿跳过、整章不抛', () => {
    const root = mkRoot('scan2')
    const dirRel = paths.草稿目录(1, 1, '开篇任务')
    put(root, `${dirRel}/稿1.md`, serializeDocument({ 角色: '待审稿' }, '正文一'))
    put(root, `${dirRel}/稿2.md`, serializeDocument({ 角色: '待审稿' }, '正文二'))
    fs.chmodSync(path.join(root, dirRel, '稿2.md'), 0o000)
    const facts = scanChapter(root, KEY)
    expect(facts.读取降级).toBe(true)
    // 稿2 读不了:待审只剩稿1,仍唯一——但「有草稿」不得因此变成 false
    expect(facts.有草稿).toBe(true)
  })
})

// ── X2 章号上限 ──────────────────────────────────────────────────────────────

describe('X2 章号合法域 1–9999(写侧断言)', () => {
  it('9999 过、10000 拒(错误带收到值)、0 占位语义保留', () => {
    expect(chapterNo(9999)).toBe('9999')
    expect(chapterNo(0)).toBe('0000')
    expect(() => chapterNo(10000)).toThrow(/10000/)
    expect(() => chapterNo(-1)).toThrow(/-1/)
    expect(() => chapterNo(1.5)).toThrow(/1\.5/)
    expect(draftKeySegment(1, 9999, '终章')).toBe('卷01-9999-终章')
    expect(draftKeySegment(1, 0, '未定位')).toBe('卷01-0000-未定位')
    expect(() => draftKeySegment(1, 10000, '越界')).toThrow(/10000/)
  })
})

// ── X5 滚动清理与 stage 残留 ────────────────────────────────────────────────

describe('X5 .abzu 运行态滚动清理', () => {
  it('operations 超过 500 份时删最老的已完成,failed 一律保留', () => {
    const root = mkRoot('ops')
    const dir = path.join(root, OPERATION_DIR)
    fs.mkdirSync(dir, { recursive: true })
    const base = Date.now() - 100_000
    for (let i = 0; i < 505; i += 1) {
      const file = path.join(dir, `op-old-${String(i).padStart(3, '0')}.json`)
      fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1, status: 'completed' }))
      const at = new Date(base + i)
      fs.utimesSync(file, at, at)
    }
    fs.writeFileSync(path.join(dir, 'op-failed.json'), JSON.stringify({ schemaVersion: 1, status: 'failed' }))
    const at = new Date(base + 1000)
    fs.utimesSync(path.join(dir, 'op-failed.json'), at, at)

    withBookLock(root, () => 'done', { operationId: 'op-new' })

    const names = fs.readdirSync(dir).filter((n) => n.endsWith('.json'))
    expect(names.length, '滚动到 500').toBe(500)
    expect(names, 'failed 是待查证据,不删').toContain('op-failed.json')
    expect(names).toContain('op-new.json')
    expect(names, '删的是最老的 completed').not.toContain('op-old-000.json')
  }, 30_000)

  it('获锁后清超过 60s 的 .writer-*.stage 残留,新鲜的保留', () => {
    const root = mkRoot('stage')
    const runtime = path.join(root, RUNTIME_DIR)
    fs.mkdirSync(runtime, { recursive: true })
    const stale = path.join(runtime, '.writer-00000000-0000-0000-0000-000000000001.stage')
    const fresh = path.join(runtime, '.writer-00000000-0000-0000-0000-000000000002.stage')
    fs.mkdirSync(stale); fs.writeFileSync(path.join(stale, 'owner-x.json'), '{}')
    fs.mkdirSync(fresh); fs.writeFileSync(path.join(fresh, 'owner-y.json'), '{}')
    const old = new Date(Date.now() - 120_000)
    fs.utimesSync(stale, old, old)

    withBookLock(root, () => 'done')

    expect(fs.existsSync(stale), '崩溃残留被清').toBe(false)
    expect(fs.existsSync(fresh), '活跃竞争者的 stage 不碰').toBe(true)
  })
})

// ── X6 demote 批化 ──────────────────────────────────────────────────────────

describe('X6 demoteOtherPendingDrafts 单批原子写', () => {
  it('除保留稿外,待审稿降级为草稿并清选定,单批落盘', () => {
    const root = mkRoot('demote')
    const dirRel = paths.草稿目录(1, 2, '风起')
    put(root, `${dirRel}/稿1.md`, serializeDocument({ 角色: '待审稿', 选定: true }, '正文一'))
    put(root, `${dirRel}/稿2.md`, serializeDocument({ 角色: '待审稿' }, '正文二'))
    const demoted = demoteOtherPendingDrafts(root, { 卷: 1, 章: 2, 章名: '风起' }, `${dirRel}/稿1.md`)
    expect(demoted).toEqual([`${dirRel}/稿2.md`])
    const kept = parseDocument(fs.readFileSync(path.join(root, dirRel, '稿1.md'), 'utf-8'))
    const other = parseDocument(fs.readFileSync(path.join(root, dirRel, '稿2.md'), 'utf-8'))
    expect(kept.ok && kept.data.fields['角色']).toBe('待审稿')
    expect(other.ok && other.data.fields['角色']).toBe('草稿')
    expect(other.ok && other.data.fields['选定']).toBe(false)
  })
})

// ── X7 io 三态分流 ──────────────────────────────────────────────────────────

describe('X7 io 三态分流(读不了 ≠ 不存在)', () => {
  it('本书记忆目录是文件(ENOTDIR)→ kind unreadable;真缺失仍是 missing', () => {
    const unreadable = mkRoot('mem1')
    put(unreadable, '本书记忆', '不是目录')
    const r = queryMemory(unreadable) as { ok: boolean; kind: string; reason: string }
    expect(r.ok).toBe(false)
    expect(r.kind).toBe('unreadable')
    expect(r.reason).not.toContain('不存在')

    const missing = mkRoot('mem2')
    const m = queryMemory(missing) as { ok: boolean; kind: string; reason: string }
    expect(m.kind).toBe('missing')
    expect(m.reason).toContain('不存在')
  })

  it('卷规划目录读不了 → 全书对账 ok:false kind:unreadable;真缺失不报不可读', () => {
    const unreadable = mkRoot('vol1')
    put(unreadable, '大纲/卷规划', '不是目录')
    const r = reconcileBookLedger(unreadable)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.kind).toBe('unreadable')
      expect(r.reason).toContain('卷规划目录不可读')
    }

    const missing = mkRoot('vol2')
    const m = reconcileBookLedger(missing)
    // 空书仓:账本缺失按原样 missing(卷规划不存在只是没有卷),绝无「不可读」
    expect(m.ok).toBe(false)
    if (!m.ok) {
      expect(m.kind).toBe('missing')
      expect(m.reason).not.toContain('不可读')
    }
  })

  it('待定稿包清单读不了(EISDIR)→ 报「不可读」;真缺失仍报「缺清单」', () => {
    const unreadable = mkRoot('dec1')
    const pkg = paths.待定稿包目录(1, 1, '开篇任务')
    put(unreadable, `${pkg}/清单.json`, JSON.stringify({ schemaVersion: 1, 文件: [] }))
    toDir(path.join(unreadable, pkg, '清单.json'))
    const r = writeSettlementDecision(unreadable, { 卷: 1, 章: 1, 章名: '开篇任务' }, '已批准')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toContain('不可读')
      expect(r.reason).not.toContain('缺清单')
    }

    const missing = mkRoot('dec2')
    const m = writeSettlementDecision(missing, { 卷: 1, 章: 1, 章名: '开篇任务' }, '已批准')
    expect(m.ok).toBe(false)
    if (!m.ok) expect(m.reason).toContain('缺清单')
  })

  it('材料清单读不了(EISDIR)→ readManifest 抛「不可读」;真缺失仍是 null', () => {
    const unreadable = mkRoot('man1')
    const dir = paths.材料包目录(1, 1, '开篇任务')
    put(unreadable, `${dir}/材料清单.json`, JSON.stringify({ schemaVersion: 1, 状态: '段齐备', 合计字数: 0, 段: [] }))
    toDir(path.join(unreadable, dir, '材料清单.json'))
    expect(() => readManifest(unreadable, { 卷: 1, 章: 1, 章名: '开篇任务' })).toThrow(/不可读/)

    const missing = mkRoot('man2')
    expect(readManifest(missing, { 卷: 1, 章: 1, 章名: '开篇任务' })).toBeNull()
  })
})

// ── X8 材料组装降载(行为等价) ────────────────────────────────────────────────

describe('X8 组装近章定径读取(行为等价)', () => {
  it('跨卷上一章:卷2 首章带卷1 卷摘要＋近三章章摘要＋上一章末尾;卷1 首章无上一章', () => {
    const root = mkRoot('assemble')
    makeFixtureBook(root, 5, { 每卷章数: 3 }) // 章1–3 卷1,章4–5 卷2
    const c4 = computeMaterials(root, { 卷: 2, 章: 4, 章名: '章4' })
    expect(c4.ok, c4.gaps.join(';')).toBe(true)
    const 衔接 = c4.文件?.find((f) => f.relPath.endsWith('-近期正文衔接.md'))?.content ?? ''
    expect(衔接).toContain('### 第0001章 章1')
    expect(衔接).toContain('### 第0003章 章3')
    expect(衔接).toContain('### 卷01 卷摘要')
    expect(衔接).toContain('本章收束于城门')
    const c1 = computeMaterials(root, { 卷: 1, 章: 1, 章名: '章1' })
    expect(c1.ok).toBe(true)
    const 首章衔接 = c1.文件?.find((f) => f.relPath.endsWith('-近期正文衔接.md'))?.content ?? ''
    expect(首章衔接).toContain('（无上一章定稿）')
  })
})

// ── X9 章号文件名单源 ───────────────────────────────────────────────────────

describe('X9 matchChapterFileName 单源(宽松 1–4 位)', () => {
  it('12-名字.md 与 0012-名字.md 同认;非章节形态不认', () => {
    expect(matchChapterFileName('12-名字.md')).toEqual({ 章: 12, 章名: '名字' })
    expect(matchChapterFileName('0012-名字.md')).toEqual({ 章: 12, 章名: '名字' })
    expect(matchChapterFileName('12-名字.MD')).toEqual({ 章: 12, 章名: '名字' })
    expect(matchChapterFileName('名字.md')).toBeNull()
    expect(matchChapterFileName('12345-名字.md')).toBeNull()
    expect(matchChapterFileName('12-名字.txt')).toBeNull()
  })

  it('各读侧一致认到 12-名字.md:listChapters / 卷摘要 / 检索索引 / 导出 / 账本章号', async () => {
    const root = mkRoot('m9')
    put(root, '大纲/卷规划/卷01/章细纲/12-名字.md', serializeDocument({ 状态: '已确认' }, '# 细纲'))
    put(root, '定稿/卷01/12-名字.md', serializeDocument({ 状态: '已定稿' }, '第12章正文。'))
    put(root, paths.章摘要(1, 12, '名字'), '# 章摘要\n\n第12章摘要：钩子。')
    put(root, paths.账本('线索'), '# 线索\n')

    expect(listChapters(root)).toContainEqual({ 卷: 1, 章: 12, 章名: '名字' })

    const summary = computeVolumeSummaryCandidate(root, 1)
    expect(summary.ok, summary.ok ? '' : summary.reason).toBe(true)
    if (summary.ok) expect(summary.候选).toContain('### 第0012章 名字')

    const snapshot = await scanFinalized(root)
    expect(snapshot.documents.map((d) => d.chapter)).toEqual([12])

    const exported = computeExport(root)
    expect(exported.ok, exported.gaps.join(';')).toBe(true)
    expect(exported.章列表[0]?.章).toBe(12)
    expect(exported.合集).toContain('### 第0012章 名字')

    expect(entryChapterNo({ 字段: { 来源: '12-名字.md' } })).toBe(12)
    expect(entryChapterNo({ 字段: { 实际落点: '定稿/卷01/0012-名字.md' } })).toBe(12)
    expect(entryChapterNo({ 字段: { 来源: '第12章' } })).toBe(12)
  })
})

// ── X10 哈希与稳定读单源 ────────────────────────────────────────────────────

describe('X10 sha256Hex/readStableFile 单源', () => {
  it('sha256Hex 与原各处包装逐字节一致(字符串 utf8、Buffer 原始字节)', () => {
    const text = '中文内容\ntext\n'
    const expected = createHash('sha256').update(text, 'utf-8').digest('hex')
    expect(sha256Hex(text)).toBe(expected)
    expect(contentHash(text)).toBe(expected)
    expect(materialHash(text)).toBe(expected)
    expect(referenceHash(text)).toBe(expected)
    expect(digest(text)).toBe(expected)

    const bytes = Buffer.from('\uFEFF带 BOM 的原始字节\n', 'utf8')
    const expectedBytes = createHash('sha256').update(bytes).digest('hex')
    expect(sha256Hex(bytes)).toBe(expectedBytes)
    expect(sha256Hex(new Uint8Array(bytes))).toBe(expectedBytes)
  })

  it('readMaterialFile 哈希仍是原始字节(BOM 计入),文本忠实原始字节', () => {
    const root = mkRoot('hash')
    const raw = Buffer.from('\uFEFF正文\n', 'utf8')
    put(root, '世界书/人物档案/主角.md', raw)
    const read = readMaterialFile(root, '世界书/人物档案/主角.md')
    expect(read.hash).toBe(sha256Hex(raw))
    expect(read.hash).toBe(sha256Hex(fs.readFileSync(path.join(root, '世界书/人物档案/主角.md'))))
    expect(read.text.startsWith('\uFEFF')).toBe(true)
  })

  it('readStableFile:普通文件按字节返回;目录形态按 not-plain-file 拒绝', () => {
    const root = mkRoot('stable')
    put(root, '普通.md', '内容')
    expect(readStableFile(root, '普通.md').toString('utf8')).toBe('内容')
    fs.mkdirSync(path.join(root, '目录.md'))
    let caught: unknown
    try {
      readStableFile(root, '目录.md')
    } catch (error) {
      caught = error
    }
    expect(caught, '目录必须被拒').toBeInstanceOf(StableReadError)
    expect((caught as StableReadError).code).toBe('not-plain-file')
  })
})

// ── X11 速赢 ────────────────────────────────────────────────────────────────

describe('X11 速赢钉子', () => {
  it('保留名判定先剥扩展名:CON.md / com1.md 拒,普通名不误伤', () => {
    expect(validateSegment('CON.md')).toContain('为系统保留名')
    expect(validateSegment('com1.md')).toContain('为系统保留名')
    expect(validateSegment('名字.md')).not.toContain('为系统保留名')
    expect(validateSegment('CON')).toContain('为系统保留名')
  })

  it('frontmatter 容忍文件以 --- 结尾且无尾行', () => {
    const r = parseDocument('---\n状态: 已确认\n---')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.fields['状态']).toBe('已确认')
      expect(r.data.body).toBe('')
    }
    // 既有行为不变:闭合后有正文
    const normal = parseDocument('---\n状态: 已确认\n---\n正文')
    expect(normal.ok).toBe(true)
    if (normal.ok) expect(normal.data.body).toBe('正文')
    // 仍未闭合:报 parse-error
    const open = parseDocument('---\n状态: 已确认')
    expect(open.ok).toBe(false)
  })
})
