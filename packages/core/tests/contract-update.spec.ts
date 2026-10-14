/**
 * C-01 契约按节替换（core 侧）：更新一个分部，不再整篇按模板重建。
 *
 * 旧实现（`contractTemplate` 重建）有三处静默删作者正文：六部外的 `##` 小节被整段删、
 * 丢了〔状态〕标签的六部被写成〔留白〕并清空正文、更新父分部时 `### 章节篇幅` 子节被抹掉。
 *
 * 规格锚（Doc 核）：docs/book-format.md:26「沿用 novel_update_contract 更新该分部，保留其中已有内容」、
 * docs/CONTEXT.md:42「作品契约｜分部更新、绝不整体重写」。
 *
 * 职责边界（定稿裁定）：篇幅子节在 **core 侧保留**——`prepareContract` 把旧子节整块接回，调用侧不回填；
 * 护栏只兜底绕过工具的写入路径。所以「主分部带正文但漏写子节」会被接回（本文件 j 条），
 * 只有「正文为空/留白」或「自带不规范 `###` 导致缺合法子节」才撞护栏（h / i 两条）。
 *
 * 夹具一律**手写契约原文**（不经 `contractTemplate`），否则钉不住"原文保留"。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { chapterLengthIdentity, contractTemplate, parseChapterLength, parseDocument, prepareContract, writeContract } from '../src/index'
import { removeSync } from '../src/repo/remove'

let root: string
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-contract-')) })
afterEach(() => removeSync(root))

const REL = path.join('作品契约', '契约.md')
function put(text: string): void {
  fs.mkdirSync(path.join(root, '作品契约'), { recursive: true })
  fs.writeFileSync(path.join(root, REL), text, 'utf8')
}
const read = (): string => fs.readFileSync(path.join(root, REL), 'utf8')

/** 手写契约原文：含一部漏〔状态〕标签、一部带围栏内 `## `、一部六部外小节、一部带合法「章节篇幅」。 */
const ORIGINAL = [
  '---',
  '书id: b-1',
  '版本: 1',
  '---',
  '# 作品契约',
  '',
  '## 题材与读者定位 〔已确认〕',
  '',
  '商业类型小说，读者是通勤人群。',
  '',
  '## 核心看点与差异化 〔留白〕',
  '',
  '## 阅读体验与情绪承诺 〔已确认〕',
  '',
  '阅读体验正文：先紧后松。',
  '',
  '### 章节篇幅',
  '- 目标汉字数: 2000',
  '- 下限汉字数: 1600',
  '- 上限汉字数: 2400',
  '',
  '## 主角原则与关系边界 〔暂定〕',
  '',
  '不背弃同伴。',
  '',
  '## 叙事方式与文风基调',
  '',
  '限知视角，短句为主。',
  '',
  '## 创作禁区与不可妥协项 〔留白〕',
  '',
  '作者说明：以下示例不算分部。',
  '',
  '```md',
  '## 这不是分部',
  '示例内容',
  '```',
  '',
  '## 自定义小节',
  '',
  '作者自留：本卷不加新主线。',
  '',
].join('\n') + '\n'

const lines = (text: string): string[] => text.split('\n')
/** 独立实现的可见行扫描（故意不复用 visibleLines，否则围栏那条断言会自我循环）。 */
function visibleOnly(text: string): string[] {
  let fence: string | undefined
  return lines(text).map((line) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)
    if (fence !== undefined) {
      if (marker && marker[1]![0] === fence) fence = undefined
      return ''
    }
    if (marker) { fence = marker[1]![0]!; return '' }
    return line
  })
}
/** 分部名（去〔状态〕标签）：次序与去留只看名字，标签变化是本次更新的预期效果。 */
const sectionNames = (text: string): string[] =>
  visibleOnly(text).filter((line) => /^##\s+\S/.test(line)).map((line) => /^##\s+(.+?)(?:\s*[〔(].*?[〕)])?\s*$/.exec(line)![1]!.trim())

const LENGTH_BLOCK = '### 章节篇幅\n- 目标汉字数: 2000\n- 下限汉字数: 1600\n- 上限汉字数: 2400'

describe('C-01 core 按节替换（其余字节原样保留）', () => {
  it('a) 未更新部分逐字节不动：目标节之前与之后两段切片与原文完全相同', () => {
    put(ORIGINAL)
    const marker = '## 主角原则与关系边界'
    const before = parseDocument(ORIGINAL)
    const body = before.ok ? before.data.body : ''
    const heading = body.split('\n').find((line) => line.startsWith(marker))!
    const at = body.indexOf(heading)
    const prefix = body.slice(0, at)
    // 未更新段的起点＝目标节之后的第一个分部标题（目标节自身的正文本来就该被替换）；
    // 只归一化文末换行（serializeDocument 的既有行为），其余字节逐一比对。
    const nextHeading = '## 叙事方式与文风基调'
    const tail = (text: string): string => text.slice(text.indexOf(nextHeading)).replace(/\n+$/, '')

    const op = prepareContract(root, { '主角原则与关系边界': { state: '已确认', body: '不背弃同伴，也不替作者做决定。' } })

    const after = parseDocument(op.content)
    const outBody = after.ok ? after.data.body : ''
    const outHeading = outBody.split('\n').find((line) => line.startsWith(marker))!
    const outAt = outBody.indexOf(outHeading)
    expect(outAt, '目标节标题应原位').toBeGreaterThan(-1)
    expect(outBody.slice(0, outAt), '目标节之前的正文不得变').toBe(prefix)
    expect(tail(outBody), '目标节之后（漏标签六部 / 围栏块 / 六部外小节）的正文不得变').toBe(tail(body))
    expect(sectionNames(op.content)).toEqual(sectionNames(ORIGINAL))
  })

  it('b) 漏〔状态〕标签的六部：标题原文与正文仍在，不被写成〔留白〕', () => {
    put(ORIGINAL)

    const op = prepareContract(root, { '题材与读者定位': { state: '已确认', body: '改后的定位。' } })

    expect(op.content).toContain('## 叙事方式与文风基调\n')
    expect(op.content).toContain('限知视角，短句为主。')
    expect(op.content).not.toContain('## 叙事方式与文风基调 〔留白〕')
    expect(parseDocument(op.content)).toMatchObject({ ok: true, data: { fields: { 书id: 'b-1' } } })
  })

  it('c) 六部之外的 ## 小节与围栏内的 `## `：更新后仍在，且围栏内那行不算分部', () => {
    put(ORIGINAL)

    const op = prepareContract(root, { '题材与读者定位': { state: '已确认', body: '改后的定位。' } })

    expect(op.content).toContain('## 自定义小节')
    expect(op.content).toContain('作者自留：本卷不加新主线。')
    expect(op.content).toContain('```md\n## 这不是分部\n示例内容\n```')
    expect(sectionNames(op.content)).not.toContain('这不是分部')
    expect(sectionNames(op.content)).toEqual(sectionNames(ORIGINAL))
    expect(sectionNames(op.content).at(-1)).toBe('自定义小节')
  })

  it('d) 幂等：同参数连跑零 diff，以第一次结果为输入再跑仍零 diff', () => {
    put(ORIGINAL)
    const parts = { '题材与读者定位': { state: '已确认', body: '改后的定位。' } } as const

    const first = prepareContract(root, parts)
    put(first.content)
    const second = prepareContract(root, parts)

    expect(second.content).toBe(first.content)
  })

  it('e) 带合法子节可正常更新；移除子节才抛，且抛错前后磁盘逐字相同', () => {
    put(ORIGINAL)

    const kept = prepareContract(root, { 阅读体验与情绪承诺: { state: '已确认', body: `重写后的阅读体验正文。\n\n${LENGTH_BLOCK}` } })
    expect(kept.content).toContain('重写后的阅读体验正文。')
    expect(parseChapterLength(kept.content)).toMatchObject({ 状态: '已配置', 范围: { 目标汉字数: 2000 } })
    expect(chapterLengthIdentity(parseChapterLength(kept.content))).not.toBeUndefined()

    expect(() => prepareContract(root, { 阅读体验与情绪承诺: { state: '留白' } })).toThrow(/章节篇幅/)
    expect(() => writeContract(root, { 阅读体验与情绪承诺: { state: '留白' } })).toThrow(/章节篇幅/)
    expect(read()).toBe(ORIGINAL)
  })

  it('f) 新建路径不回归：空目录仍生成六部、以换行结尾', () => {
    const op = prepareContract(root)

    for (const name of ['题材与读者定位', '核心看点与差异化', '阅读体验与情绪承诺', '主角原则与关系边界', '叙事方式与文风基调', '创作禁区与不可妥协项']) {
      expect(op.content).toContain(`## ${name} 〔留白〕`)
    }
    expect(op.content.endsWith('\n')).toBe(true)
  })
})

describe('C-01 同批：〔留白〕不再连带清空正文（标签与正文是两件事）', () => {
  it('contractTemplate：显式〔留白〕+ 有正文 ⇒ 正文保留、标签不被改写成〔已确认〕', () => {
    const text = contractTemplate({ '核心看点与差异化': { state: '留白', body: '尚未定稿但已写下的看点。' } })

    expect(text).toContain('## 核心看点与差异化 〔留白〕')
    expect(text).toContain('尚未定稿但已写下的看点。')
    expect(text).not.toContain('## 核心看点与差异化 〔已确认〕')
  })

  it('prepareContract：更新某部为〔留白〕且带正文 ⇒ 该部正文保留', () => {
    put(ORIGINAL)

    const op = prepareContract(root, { '核心看点与差异化': { state: '留白', body: '留白但保留的看点。' } })

    expect(op.content).toContain('## 核心看点与差异化 〔留白〕')
    expect(op.content).toContain('留白但保留的看点。')
  })
})

describe('C-01 裁定④与护栏定稿文案', () => {
  /** 围栏里先出现一个同名假分部：按原始行定位会从围栏那行切起，按可见行定位不会（这才是切错起点的回归）。 */
  const FENCE_BEFORE_TARGET = [
    '---', '书id: b-1', '---', '# 作品契约', '',
    '## 题材与读者定位 〔已确认〕', '',
    '示例（不是分部）：', '',
    '```md', '## 核心看点与差异化 〔已确认〕', '围栏里的示例正文。', '```', '',
    '商业类型小说，读者是通勤人群。', '',
    '## 核心看点与差异化 〔留白〕', '',
    '## 创作禁区与不可妥协项 〔留白〕', '',
  ].join('\n') + '\n'

  it('g) 围栏里的同名假分部在真分部之前 ⇒ 只改真分部，假分行的正文一字不动', () => {
    put(FENCE_BEFORE_TARGET)

    const op = prepareContract(root, { '核心看点与差异化': { state: '已确认', body: '真看点。' } })

    expect(op.content, '围栏内示例正文必须原样保留').toContain('围栏里的示例正文。')
    expect(op.content).not.toContain('## 核心看点与差异化 〔留白〕')
    expect(op.content).toContain('## 核心看点与差异化 〔已确认〕\n\n真看点。')
    expect(op.content.match(/^## 核心看点与差异化/gm), '围栏内 1 处 + 真分部 1 处').toHaveLength(2)
  })

  it('h) 裁定④：content 自带不规范 ### ＋旧有合法子节 ⇒ 不接回，按情形①拦下（/已拦下/），磁盘不动', () => {
    put(ORIGINAL)
    const body = '重写后的阅读体验正文。\n\n### 篇幅要求\n- 目标汉字数: 3000'

    let message = ''
    try { prepareContract(root, { 阅读体验与情绪承诺: { state: '已确认', body } }) } catch (error) { message = (error as Error).message }
    expect(message).toMatch(/章节篇幅/)
    expect(message).toMatch(/已拦下/)
    expect(message, '不得复用 ChapterLengthPolicy 的「配置错误」术语').not.toMatch(/配置错误/)
    expect(read(), '抛错发生在 prepareContract，磁盘必须逐字未变').toBe(ORIGINAL)
  })

  it('h2) 裁定④：旧文本本来没有子节 ⇒ 不接回也不抛（旧书兼容）', () => {
    const noLength = ORIGINAL.replace(`${LENGTH_BLOCK}\n\n`, '')
    expect(noLength).not.toContain('### 章节篇幅')
    put(noLength)

    const op = prepareContract(root, { 阅读体验与情绪承诺: { state: '已确认', body: '正文。\n\n### 篇幅要求\n- 目标汉字数: 3000' } })

    expect(op.content).toContain('### 篇幅要求')
    expect(op.content).not.toContain('### 章节篇幅')
    expect(parseChapterLength(op.content).状态).toBe('未配置')
  })

  it('i) 情形②文案：正文为空/留白致子节消失 ⇒ /已拒绝/、不含「配置错误」前缀，且不再推荐「清空子节内容」', () => {
    put(ORIGINAL)

    let message = ''
    try { prepareContract(root, { 阅读体验与情绪承诺: { state: '留白' } }) } catch (error) { message = (error as Error).message }
    expect(message).toMatch(/章节篇幅/)
    expect(message).toMatch(/已拒绝/)
    expect(message).not.toMatch(/配置错误/)
    expect(message, '推荐路径必须可达：不得再让作者「清空子节内容」').not.toMatch(/清空/)
    expect(read()).toBe(ORIGINAL)
  })

  it('j) 回归闸门：更新主分部且不带子节 ⇒ core 侧接回旧子节，仍「已配置」、指纹不为 undefined', () => {
    put(ORIGINAL)

    const op = prepareContract(root, { 阅读体验与情绪承诺: { state: '已确认', body: '重写后的阅读体验正文。' } })

    expect(op.content).toContain('重写后的阅读体验正文。')
    expect(op.content).toContain('### 章节篇幅')
    expect(op.content).toContain('- 目标汉字数: 2000')
    const policy = parseChapterLength(op.content)
    expect(policy).toMatchObject({ 状态: '已配置', 范围: { 目标汉字数: 2000, 下限汉字数: 1600, 上限汉字数: 2400 } })
    expect(chapterLengthIdentity(policy), '指纹不得变成 undefined（否则审读不再含篇幅要求）').not.toBeUndefined()
  })
})
