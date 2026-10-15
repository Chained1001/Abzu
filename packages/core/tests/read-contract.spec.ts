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
import { computeVolumeSummaryCandidate } from '../src/summary'
import { computePack } from '../src/prepare/pack'
import { computeMaterials } from '../src/assembly/assemble'
import { confirmOutline, writeCandidate } from '../src/outline/write'
import { seedMinDesign } from '../src/design/seed'
import { writeFileAtomic } from '../src/repo/atomic'
import { serializeDocument } from '../src/repo/frontmatter'
import { paths } from '../src/repo/paths'

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

// ─────────────────────────────────────────────────────────────────────────────
// 第 5 批（第三态 `unreadable` 引入后暴露的 io 误分类）：同样是「EISDIR + 真缺失」成对。
// 这些分支在只有 missing/parse-error 两态时 else 分支都是对的，是第三态让它们集体变成错分类。
// ─────────────────────────────────────────────────────────────────────────────

/** 空壳设计书（seedMinDesign）；材料包 / 待定稿包 / 卷摘要三个判据点共用。 */
function mkSeedBook(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-points-'))
  roots.push(root)
  seedMinDesign(root)
  return root
}

/** 卷一第 1 章定稿 + 章摘要齐（卷摘要候选的前置）。 */
function mkOneFinalChapter(root: string): void {
  const fin = path.join(root, paths.定稿章(1, 1, '开篇任务'))
  fs.mkdirSync(path.dirname(fin), { recursive: true })
  fs.writeFileSync(fin, serializeDocument({ 状态: '已定稿' }, '第1章正文。'), 'utf8')
  const sum = path.join(root, paths.章摘要(1, 1, '开篇任务'))
  fs.mkdirSync(path.dirname(sum), { recursive: true })
  fs.writeFileSync(sum, '# 章摘要\n\n开篇摘要：埋了一个钩子。', 'utf8')
}

/** 唯一待审稿（待定稿包的前置）。 */
function mkPendingDraft(root: string): void {
  const dir = path.join(root, paths.草稿目录(1, '开篇任务'))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '稿1.md'), serializeDocument({ 角色: '待审稿' }, '第1章正文草稿。'), 'utf8')
}

const CONFIRM_REFS = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const

/** 本卷第 1 章确认细纲（材料包的前置）；与 assembly.spec 同款夹具。 */
function confirmReady(root: string): void {
  const body = [
    '# 章细纲', '', '## 定位段', '',
    '### 来源窗口项及拆并关系', '开篇任务，单章承接', '',
    '### 章节功能', '建立开场冲突', '- 〔软〕节奏平稳', '',
    '### 视角与焦点', '主角视角', '',
    '### 时空锚定', '城门口，清晨', '',
    '### 起止边界', '从抵达城门到发现异状', '',
    '### 故事线与承诺分配', '推进主线承诺', '',
    '### 信息边界', '只披露主角所见', '',
    '### 情绪与节奏目标', '紧张后留钩子', '',
    '### 前置条件核对结果', '已核对来源与窗口，前置设定均非留白', '',
    '## 细纲段', '', '### 单元 1', '',
    '- 目标: 找到异常', '- 人物: 主角', '- 时空: 城门口',
    '- 行动/冲突: 盘问与发现', '- 信息披露: 异常线索', '- 状态变化: 从平静到警觉', '',
  ].join('\n')
  writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 来源引用: CONFIRM_REFS, body })
  const r = confirmOutline(root, KEY)
  if (!r.ok) throw new Error(`confirm failed:${r.gaps.join(';')}`)
}

/** 把「账本/<名>.md」换成同名目录（EISDIR）；真缺失对照则整份账本都不建。 */
function ledgerAsDir(root: string, name: string): void {
  fs.mkdirSync(path.join(root, '账本'), { recursive: true })
  toDir(path.join(root, '账本', `${name}.md`))
}

/** 材料包某段的记录（computeMaterials 纯算，不落盘）。 */
function sectionOf(root: string, 段: string): { readonly 完整性: string } {
  const record = computeMaterials(root, KEY).段?.find((s) => s.段 === 段)
  if (record === undefined) throw new Error(`材料包缺段:${段}`)
  return record
}

/** 材料包某段的正文（同一次纯算的写盘载荷里取，不落盘）。 */
function sectionBody(root: string, 段: string): string {
  const op = computeMaterials(root, KEY).文件?.find((f) => f.relPath.endsWith(`-${段}.md`))
  if (op === undefined) throw new Error(`材料包缺段文件:${段}`)
  return op.content
}

/** 待定稿包里某件的内容（computePack 纯算，取写盘载荷而不是落盘）。 */
function packArtifact(root: string, 名: string): string {
  const computed = computePack(root, KEY)
  const op = computed.文件?.find((f) => f.relPath.endsWith(名))
  if (op === undefined) throw new Error(`待定稿包缺 ${名}：${computed.reason ?? '未知原因'}`)
  return op.content
}

describe('第 5 批：io 不得被说成「未建账 / 解析失败 / 空」', () => {
  it('⑦ 卷摘要：线索账本不可读 → 报「不可读」，不报「解析失败」', () => {
    const root = mkSeedBook()
    mkOneFinalChapter(root)
    ledgerAsDir(root, '线索')
    const r = computeVolumeSummaryCandidate(root, 1)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toContain('不可读')
    expect(r.reason).not.toContain('解析失败')
  })

  it('⑦m 卷摘要：线索账本确实缺失 → 仍报「缺失」', () => {
    const root = mkSeedBook()
    mkOneFinalChapter(root)
    const r = computeVolumeSummaryCandidate(root, 1)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toContain('缺失')
    expect(r.reason).not.toContain('不可读')
  })

  it('⑧ 待定稿包：时间线账本不可读 → 卷对账写「事实时间线不可读」，不写解析失败', () => {
    const root = mkSeedBook()
    mkPendingDraft(root)
    ledgerAsDir(root, '时间线')
    const 卷对账 = packArtifact(root, '卷对账.md')
    expect(卷对账).toContain('事实时间线不可读')
    expect(卷对账).not.toContain('事实时间线解析失败')
  })

  it('⑧m 待定稿包：时间线账本确实缺失 → 仍写「事实时间线未初始化」', () => {
    const root = mkSeedBook()
    mkPendingDraft(root)
    const 卷对账 = packArtifact(root, '卷对账.md')
    expect(卷对账).toContain('事实时间线未初始化')
    expect(卷对账).not.toContain('不可读')
  })

  it('⑨ 材料包：时间线账本不可读 → 段记残缺，正文写「不可读」不写「无账本时间线」', () => {
    const root = mkSeedBook()
    confirmReady(root)
    ledgerAsDir(root, '时间线')
    expect(sectionOf(root, '当前事实与连续性').完整性).toBe('残缺')
    const body = sectionBody(root, '当前事实与连续性')
    expect(body).toContain('账本时间线不可读')
    expect(body).not.toContain('（无账本时间线）')
  })

  it('⑨m 材料包：时间线账本确实缺失 → 仍是「空」，正文保持「（无账本时间线）」', () => {
    const root = mkSeedBook()
    confirmReady(root)
    expect(sectionOf(root, '当前事实与连续性').完整性).toBe('空')
    const body = sectionBody(root, '当前事实与连续性')
    expect(body).toContain('（无账本时间线）')
    expect(body).not.toContain('不可读')
  })

  it('⑩ 材料包：承诺账本不可读 → 段记残缺，正文写「不可读」不写「无账本条目」', () => {
    const root = mkSeedBook()
    confirmReady(root)
    ledgerAsDir(root, '承诺')
    expect(sectionOf(root, '故事线承诺线索').完整性).toBe('残缺')
    const body = sectionBody(root, '故事线承诺线索')
    expect(body).toContain('账本条目不可读')
    expect(body).not.toContain('（无账本条目）')
  })

  it('⑩m 材料包：账本确实缺失 → 仍是「空」，正文保持「（无账本条目）」', () => {
    const root = mkSeedBook()
    confirmReady(root)
    expect(sectionOf(root, '故事线承诺线索').完整性).toBe('空')
    const body = sectionBody(root, '故事线承诺线索')
    expect(body).toContain('（无账本条目）')
    expect(body).not.toContain('不可读')
  })
})
