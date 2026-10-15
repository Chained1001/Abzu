import { describe, expect, it, vi } from 'vitest'
import { EditorState } from '@codemirror/state'
import { ensureSyntaxTree } from '@codemirror/language'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { Decoration, type DecorationSet, type ViewUpdate } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'
import { editorFocused, linkClicks, livePreview } from '../src/client/editor/live-preview'

/**
 * 直测（沿 editor-collab.spec 的无 DOM 桩模式）：livePreview 是 ViewPlugin，实例经
 * `create(view)` 以「EditorView 形状的最小桩」构造——build() 只读 state/root/viewport/
 * visibleRanges，装饰是纯数据；widget.toDOM 才碰 document，本件不触达。
 */

const DOC = [
  '# 标题',
  '',
  '*侧重*',
  '',
  '> 引文',
  '',
  '- 列表项',
  '',
  '1. 有序项',
  '',
  '---',
  '',
  '收尾段。',
].join('\n')

interface FakeOptions { readonly focused?: boolean; readonly anchor?: number }

function fakeView(doc: string, options: FakeOptions = {}): { view: EditorView; state: EditorState } {
  const state = EditorState.create({
    doc,
    extensions: [markdown({ base: markdownLanguage })],
    ...(options.anchor === undefined ? {} : { selection: { anchor: options.anchor } }),
  })
  const contentDOM = {} as HTMLElement
  const view = {
    state,
    contentDOM,
    root: { activeElement: options.focused === false ? {} : contentDOM },
    viewport: { from: 0, to: state.doc.length },
    visibleRanges: [{ from: 0, to: state.doc.length }],
  } as unknown as EditorView
  return { view, state }
}

interface Entry { from: number; to: number; class?: string; widget?: unknown }

function decorationsOf(view: EditorView): Entry[] {
  const instance = (livePreview as unknown as { create(view: EditorView): { decorations: DecorationSet } }).create(view)
  const out: Entry[] = []
  const cursor = instance.decorations.iter()
  while (cursor.value) {
    const spec = (cursor.value as Decoration).spec as { class?: string; widget?: unknown } | undefined
    out.push({ from: cursor.from, to: cursor.to, class: spec?.class, widget: spec?.widget })
    cursor.next()
  }
  return out
}

describe('编辑器实时预览(live-preview)', () => {
  it('editorFocused:焦点在正文为真,窗口失焦后 activeElement 仍在正文即保持(切应用不丢标注)', () => {
    const focused = fakeView(DOC)
    expect(editorFocused(focused.view)).toBe(true)
    const blurred = fakeView(DOC, { focused: false })
    // 根元素上挂着别处的 activeElement——窗口失焦时浏览器保留 contentDOM 为 activeElement
    expect(editorFocused(blurred.view)).toBe(false)
  })

  it('行级装饰:标题/空行/引用/列表/分隔线/段落各得行类,光标不在标记行时标记隐藏', () => {
    const { view, state } = fakeView(DOC, { anchor: DOC.length })
    const entries = decorationsOf(view)
    const of = (cls: string) => entries.filter((e) => e.class === cls)
    expect(of('cm-lp-h1')).toHaveLength(1)
    expect(of('cm-lp-blank')).toHaveLength(6)
    expect(of('cm-lp-quote')).toHaveLength(1)
    expect(of('cm-lp-li')).toHaveLength(2)
    expect(of('cm-lp-hr')).toHaveLength(1)
    expect(of('cm-lp-p')).toHaveLength(2)
    // 行内样式:强调内文得 cm-lp-em;有序项标记降级为可显 cm-lp-ol;无序列表标记换圆点 widget
    expect(of('cm-lp-em')).toHaveLength(1)
    expect(of('cm-lp-ol')).toHaveLength(1)
    const widgets = entries.filter((e) => e.widget !== undefined)
    const listMark = widgets.find((e) => e.from === state.doc.line(7).from)!
    expect(listMark.to, '无序列表标记换圆点 widget').toBe(state.doc.line(7).from + 1)
    expect((listMark.widget as { eq(other: unknown): boolean }).eq(listMark.widget)).toBe(true)
    const rule = widgets.find((e) => e.from === state.doc.line(11).from)!
    expect(rule.to).toBe(state.doc.line(11).to)
    // 未触焦行:标题井号连随空格一并隐藏(## 标题 读作 标题)
    const hidden = entries.filter((e) => e.class === undefined)
    const heading = state.doc.line(1)
    expect(hidden.some((e) => e.from === heading.from && e.to === heading.from + 2)).toBe(true)
    expect(of('cm-lp-mark')).toHaveLength(0)
  })

  it('光标所在行揭示原始标记:标题行/行内强调标记改挂 cm-lp-mark 而非隐藏', () => {
    const heading = fakeView(DOC, { anchor: 0 })
    const onHeading = decorationsOf(heading.view)
    const revealed = onHeading.filter((e) => e.class === 'cm-lp-mark')
    expect(revealed.some((e) => e.from === 0 && e.to === 2)).toBe(true)
    const hidden = onHeading.filter((e) => e.class === undefined)
    expect(hidden.some((e) => e.from === 0 && e.to === 2)).toBe(false)

    const emphasis = fakeView(DOC, { anchor: DOC.indexOf('侧重') })
    const onEmphasis = decorationsOf(emphasis.view)
    const marks = onEmphasis.filter((e) => e.class === 'cm-lp-mark').map((e) => `${e.from}-${e.to}`)
    const line = emphasis.state.doc.line(3)
    expect(marks).toContain(`${line.from}-${line.from + 1}`)
    expect(marks).toContain(`${line.to - 1}-${line.to}`)
  })

  it('编辑器失焦后标记一律隐藏(不随选区揭示),行类保留', () => {
    const { view } = fakeView(DOC, { focused: false, anchor: 0 })
    const entries = decorationsOf(view)
    expect(entries.filter((e) => e.class === 'cm-lp-mark')).toHaveLength(0)
    const heading = (view.state as EditorState).doc.line(1)
    expect(entries.filter((e) => e.class === undefined).some((e) => e.from === heading.from && e.to === heading.from + 2)).toBe(true)
    expect(entries.filter((e) => e.class === 'cm-lp-h1')).toHaveLength(1)
  })

  it('文档变更触发重建,无变更更新保持装饰集引用不变(增量口径)', () => {
    const first = fakeView('甲\n\n乙')
    const instance = (livePreview as unknown as { create(view: EditorView): { decorations: DecorationSet; update(update: ViewUpdate): void } }).create(first.view)
    const before = instance.decorations
    const idle = { docChanged: false, viewportChanged: false, selectionSet: false, focusChanged: false, startState: first.view.state, state: first.view.state, view: first.view } as unknown as ViewUpdate
    instance.update(idle)
    expect(instance.decorations).toBe(before)

    const second = fakeView('## 副题\n\n乙')
    const changed = { docChanged: true, viewportChanged: false, selectionSet: false, focusChanged: false, startState: first.view.state, state: second.view.state, view: second.view } as unknown as ViewUpdate
    instance.update(changed)
    const rebuilt: Entry[] = []
    const cursor = instance.decorations.iter()
    while (cursor.value) {
      const spec = (cursor.value as Decoration).spec as { class?: string } | undefined
      rebuilt.push({ from: cursor.from, to: cursor.to, class: spec?.class })
      cursor.next()
    }
    expect(rebuilt.some((e) => e.class === 'cm-lp-h2')).toBe(true)
  })

  it('linkClicks:Ctrl/Cmd 单击链接经书房打开,普通单击与非链接位置不劫持', () => {
    const opened: string[] = []
    const extension = linkClicks((href) => opened.push(href)) as unknown as { domEventHandlers: { mousedown: (event: MouseEvent, view: EditorView) => boolean } }
    const mousedown = extension.domEventHandlers.mousedown!
    const doc = '见[灯塔](https://example.com/灯)一处。'
    const { view, state } = fakeView(doc)
    ensureSyntaxTree(state, doc.length, 200)
    const event = (over: Partial<MouseEvent>) => {
      const preventDefault = vi.fn()
      return { ctrlKey: false, metaKey: false, button: 0, clientX: 1, clientY: 1, preventDefault, ...over } as MouseEvent & { preventDefault: ReturnType<typeof vi.fn> }
    }

    const plain = event({})
    expect(mousedown(plain, view)).toBe(false)
    expect(opened).toEqual([])
    expect(plain.preventDefault).not.toHaveBeenCalled()

    const rightButton = event({ ctrlKey: true, button: 2 })
    expect(mousedown(rightButton, view)).toBe(false)

    const offLink = event({ ctrlKey: true })
    expect(mousedown(offLink, { ...view, posAtCoords: () => 0 } as unknown as EditorView)).toBe(false)
    expect(opened).toEqual([])

    const noCoords = event({ ctrlKey: true })
    expect(mousedown(noCoords, { ...view, posAtCoords: () => null } as unknown as EditorView)).toBe(false)

    const onLink = event({ ctrlKey: true })
    const at = { ...view, posAtCoords: () => doc.indexOf('灯塔') } as unknown as EditorView
    expect(mousedown(onLink, at)).toBe(true)
    expect(opened).toEqual(['https://example.com/灯'])
    expect(onLink.preventDefault).toHaveBeenCalledTimes(1)

    const cmd = event({ metaKey: true })
    expect(mousedown(cmd, at)).toBe(true)
    expect(opened).toEqual(['https://example.com/灯', 'https://example.com/灯'])
  })
})

/**
 * 覆盖边界：装饰随 viewport/焦点/选区联动的重算时机由 update 分支按最小桩覆盖
 * （docChanged 重建、全静默保持引用）；selectionSet/focusChanged/语法树替换三分支
 * 与 build() 的真实 DOM 呈现（widget.toDOM、块引用行折叠视口）不在 node 直测面内，
 * 由编辑器集成（FocusEditor 装配）与浏览器侧 probe 夹具守。
 */
