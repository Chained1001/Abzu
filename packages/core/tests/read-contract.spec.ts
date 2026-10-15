/**
 * 读书仓文件的契约钉子（A-2 步 3 的行为变更，与实现同一个 commit）。
 *
 * 契约：**io（读不了）与 missing（确实没有）分开报**。
 * - io 走失败通道 / 降级位，面向作者的文案**不得说「不存在」**；
 * - missing 的既有文案与判据一条都不许变（真·缺失仍然是「不存在」，不是「不可读」）。
 * 这两组必须成对存在：只钉 io 会让「改文案一刀切」也能过。
 *
 * 注入形态统一：把「被读的那个文件」换成**同名目录** → `fs.readFileSync` 抛 EISDIR
 * （Windows 上唯一稳定可得的 io；「父路径是文件」在本机会塌成 ENOENT、被判成 missing，
 * 不能用；EACCES 只能 POSIX-only）。注入必须落在**被读的文件本身**，
 * 有些判据点 read 之前先 existsSync/isDirectory 判掉了父目录，落父目录走不到 read。
 */
import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { planSettlement } from '../src/settlement'
import { scanDesignDetail } from '../src/progress'
import { scanChapter } from '../src/derive/scan'
import { rebuildResume } from '../src/recovery'
import { queryMemory } from '../src/ledger'

const roots: string[] = []
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟 */ } } })

const KEY = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const APPROVAL = { 章节: KEY, 批准: true, 裁决记录: '作者批准' }
const PKG_REL = '草稿区/定稿准备/卷01-开篇任务'

function mkRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-points-'))
  roots.push(root)
  fs.mkdirSync(path.join(root, '账本'), { recursive: true })
  fs.mkdirSync(path.join(root, '本书记忆'), { recursive: true })
  fs.mkdirSync(path.join(root, '作品契约'), { recursive: true })
  for (const name of ['故事线', '人物弧线', '承诺', '线索', '时间线']) {
    fs.writeFileSync(path.join(root, '账本', `${name}.md`), `# ${name}\n既有条目\n`, 'utf8')
  }
  fs.writeFileSync(path.join(root, '作品契约', '契约.md'), '---\n书id: test-book\n---\n\n# 作品契约\n\n六部。\n', 'utf8')
  return root
}

function putPackage(root: string, files: Record<string, string>): string {
  const dir = path.join(root, PKG_REL)
  fs.mkdirSync(dir, { recursive: true })
  const base: Record<string, string> = {
    '正文.md': '正文\n',
    '章摘要.md': '摘要\n',
    '事实变更.md': '# 事实变更\n\n（无事实变更）\n',
    '时间线变更.md': '# 时间线变更\n\n（无时间线变更）\n',
    '账本变更.md': '# 账本变更\n\n（无账本变更）\n',
    '本书层记忆候选.md': '# 本书层记忆候选\n\n（无记忆候选）\n',
  }
  for (const [name, text] of Object.entries({ ...base, ...files })) {
    fs.writeFileSync(path.join(dir, name), text, 'utf8')
  }
  return dir
}

/** io 注入：把该路径换成同名目录（EISDIR）。 */
function toDir(p: string): void {
  fs.rmSync(p, { force: true, recursive: true })
  fs.mkdirSync(p, { recursive: true })
}

const reasonOf = (result: unknown): string => String((result as { reason?: unknown }).reason ?? '')

describe('读侧契约：IO 故障不得被说成「不存在」', () => {
  it('① settlement 候选文件不可读 → 走失败通道，不能当「无候选」', () => {
    const root = mkRoot()
    const dir = putPackage(root, {})
    toDir(path.join(dir, '账本变更.md'))
    const result = planSettlement(root, dir, APPROVAL, KEY, '追加')
    const shown = JSON.stringify(result)
    expect(result.ok, shown).toBe(false)
    expect(reasonOf(result), shown).toMatch(/不可读|读取失败/)
    expect(reasonOf(result), shown).not.toContain('不存在')
  })

  it('② 世界书更正目标条目不可读 → 文案不得说「不存在」', () => {
    const root = mkRoot()
    const dir = putPackage(root, { '事实变更.md': '# 事实变更\n\n## 人物档案\n\n### 主角\n\n主角是铁匠出身。\n' })
    fs.mkdirSync(path.join(root, '世界书', '人物档案'), { recursive: true })
    toDir(path.join(root, '世界书', '人物档案', '主角.md'))
    const result = planSettlement(root, dir, APPROVAL, KEY, '更正')
    const shown = JSON.stringify(result)
    expect(result.ok, shown).toBe(false)
    expect(reasonOf(result), shown).not.toContain('不存在')
    expect(reasonOf(result), shown).toMatch(/不可读|读取失败|EISDIR/)
  })

  it('③ 真源账本不可读 → reason 不得说「真源不存在」', () => {
    const root = mkRoot()
    const dir = putPackage(root, { '时间线变更.md': '# 时间线变更\n\n## 事件甲\n\n事件：主角抵达渡口。\n' })
    toDir(path.join(root, '账本', '时间线.md'))
    const result = planSettlement(root, dir, APPROVAL, KEY, '追加')
    const shown = JSON.stringify(result)
    expect(result.ok, shown).toBe(false)
    expect(reasonOf(result), shown).not.toContain('不存在')
    expect(reasonOf(result), shown).toMatch(/不可读|读取失败|EISDIR/)
  })

  it('④ 契约不可读 → 设计明细要出「不可读」降级位，不能当空设计', () => {
    const root = mkRoot()
    toDir(path.join(root, '作品契约', '契约.md'))
    const detail = scanDesignDetail(root, 1)
    const shown = JSON.stringify(detail)
    expect(shown, shown).toContain('不可读')
  })

  it('⑤ 近期窗口 / 确认细纲不可读 → scan 出降级事实位、resume 注入「读取失败」', () => {
    const root = mkRoot()
    fs.mkdirSync(path.join(root, '大纲', '卷规划', '卷01', '章细纲'), { recursive: true })
    toDir(path.join(root, '大纲', '卷规划', '卷01', '近期窗口.md'))
    toDir(path.join(root, '大纲', '卷规划', '卷01', '章细纲', '0001-开篇任务.md'))

    const facts = scanChapter(root, KEY) as unknown as Record<string, unknown>
    expect(facts['读取降级'], JSON.stringify(facts)).toBe(true)

    const resume = rebuildResume(root, KEY)
    expect(resume.injection.细纲, JSON.stringify(resume.injection)).toContain('读取失败')
  })

  it('⑥ 本书记忆文件不可读 → kind 必须是 unreadable，不能报「记忆不存在」', () => {
    const root = mkRoot()
    fs.writeFileSync(path.join(root, '本书记忆', '文风.md'), '# 文风\n既有记忆\n', 'utf8')
    toDir(path.join(root, '本书记忆', '文风.md'))
    const result = queryMemory(root) as unknown as Record<string, unknown>
    const shown = JSON.stringify(result)
    expect(result['kind'], shown).toBe('unreadable')
    expect(String(result['reason'] ?? ''), shown).not.toContain('不存在')
  })
})

/**
 * 配对对照：真正「缺失」时，行为必须原样保留。
 * 有了这一组，「io 与 missing 分开」才是真的分开，而不是把文案一刀切改掉。
 */
describe('读侧契约：真缺失的文案必须原样保留', () => {
  it('①m 候选文件缺失 → 仍是「无候选」', () => {
    const root = mkRoot()
    const dir = putPackage(root, {})
    const result = planSettlement(root, dir, APPROVAL, KEY, '追加') as unknown as Record<string, unknown>
    expect(result['ok']).toBe(true)
    expect(result['有候选']).toBe(false)
  })

  it('②m 世界书条目确实缺失 → 仍说「不存在」', () => {
    const root = mkRoot()
    const dir = putPackage(root, { '事实变更.md': '# 事实变更\n\n## 人物档案\n\n### 主角\n\n主角是铁匠出身。\n' })
    fs.mkdirSync(path.join(root, '世界书', '人物档案'), { recursive: true })
    const result = planSettlement(root, dir, APPROVAL, KEY, '更正')
    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('不存在')
    expect(reasonOf(result)).not.toContain('不可读')
  })

  it('③m 真源账本确实缺失 → 仍说「真源不存在」', () => {
    const root = mkRoot()
    const dir = putPackage(root, { '时间线变更.md': '# 时间线变更\n\n## 事件甲\n\n事件：主角抵达渡口。\n' })
    fs.rmSync(path.join(root, '账本', '时间线.md'), { force: true })
    const result = planSettlement(root, dir, APPROVAL, KEY, '追加')
    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('不存在')
    expect(reasonOf(result)).not.toContain('不可读')
  })

  it('④m 契约确实缺失 → 不得冒出「不可读」降级位', () => {
    const root = mkRoot()
    fs.rmSync(path.join(root, '作品契约', '契约.md'), { force: true })
    const detail = JSON.stringify(scanDesignDetail(root, 1))
    expect(detail).not.toContain('不可读')
  })

  it('⑤m 窗口/细纲确实缺失 → 不得出降级事实位、注入仍是空串', () => {
    const root = mkRoot()
    const facts = scanChapter(root, KEY) as unknown as Record<string, unknown>
    expect(facts['读取降级']).not.toBe(true)
    const resume = rebuildResume(root, KEY)
    expect(resume.injection.细纲).toBe('')
    expect(resume.injection.细纲).not.toContain('读取失败')
  })

  it('⑥m 本书记忆为空目录 → 仍是 kind missing / 「不存在」', () => {
    const root = mkRoot()
    const result = queryMemory(root) as unknown as Record<string, unknown>
    expect(result['kind']).toBe('missing')
    expect(String(result['reason'] ?? '')).toContain('不存在')
  })
})
