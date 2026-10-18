// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { Bold } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EditorView } from '@codemirror/view'
import { FocusEditor } from '../src/client/editor/FocusEditor'
import { ContextMenu, type MenuSection } from '../src/client/editor/Menu'
import { TooltipLayer } from '../src/client/editor/Tooltip'
import { DEFAULT_TYPOGRAPHY, FindPanel, OutlinePanel, TypePanel, TYPE_LIMITS } from '../src/client/editor/panels'
import { EditorMemory } from '../src/client/editor/memory'
import type { EditorRequests } from '../src/client/editor/requests'
import type { EditorActions } from '../src/client/editor'
import type { BufferState, EditorStore } from '../src/client/store'
import type { StudyDocument } from '../src/study/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/**
 * jsdom 没有实现 CodeMirror 量行所需的部分布局 API。只在本测试文件内补齐，让真实
 * EditorView 能挂载并响应文本/键盘事件；所有矩形都退化为 0，不做任何视觉断言。
 */
const emptyRect = (): DOMRect => ({
  x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0,
  toJSON: () => ({}),
})
Range.prototype.getBoundingClientRect = emptyRect
Range.prototype.getClientRects = () => [] as unknown as DOMRectList
Element.prototype.scrollIntoView = () => {}
if (!('ResizeObserver' in globalThis)) {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null
}

const BODY = '第一段。\n\n第二段。'
const SESSION = 'session-one'
const BUFFER_KEY = JSON.stringify(['book:one', '草稿区/稿1.md'])

const documentOf = (body = BODY): StudyDocument => ({
  ref: { space: 'book:one', path: '草稿区/稿1.md' },
  owner: '作品',
  name: '稿1.md',
  absolutePath: 'C:/作品/草稿区/稿1.md',
  body,
  hash: 'hash-1',
  version: 1,
})
const bufferOf = (body = BODY): BufferState => ({ document: documentOf(body), text: body })

function harness(body = BODY) {
  const mounted: EditorView[] = []
  const store = {
    updateBuffer: vi.fn(),
    save: vi.fn(async () => undefined),
    useDisk: vi.fn(),
    compare: vi.fn(async () => undefined),
    retry: vi.fn(async () => undefined),
  }
  const actions: EditorActions = { quote: vi.fn(), close: vi.fn(), openLink: vi.fn() }
  const requests = {
    mount: vi.fn((_sessionId: string, _key: string, _identity: string, view: EditorView) => { mounted.push(view) }),
    unmount: vi.fn(),
    unsent: vi.fn(() => [] as string[]),
    submit: vi.fn(async () => undefined),
    record: vi.fn(),
    meta: vi.fn(() => undefined),
    cancel: vi.fn(async () => undefined),
    expire: vi.fn(),
    reopen: vi.fn(),
    replay: vi.fn(),
    commit: vi.fn(),
    pull: vi.fn(() => [] as string[]),
    subscribe: vi.fn(() => () => {}),
  }
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const memory = new EditorMemory()
  const buffer = bufferOf(body)
  return {
    container,
    root,
    store,
    actions,
    requests,
    mounted,
    memory,
    buffer,
    render: () => act(async () => {
      root.render(React.createElement(FocusEditor, {
        identity: SESSION + ':' + BUFFER_KEY,
        buffer,
        store: store as unknown as EditorStore,
        sessionId: SESSION,
        bufferKey: BUFFER_KEY,
        memory,
        actions,
        requests: requests as unknown as EditorRequests,
        plainText: false,
      }))
    }),
    dispose: async () => {
      await act(async () => { root.unmount() })
      container.remove()
    },
  }
}

const key = (target: EventTarget, keyValue: string, options: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: keyValue, bubbles: true, cancelable: true, ...options }))
}

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('编辑器 UI 模块', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('入口组件与面板可加载，排版默认值落在允许区间', () => {
    for (const component of [FocusEditor, ContextMenu, TooltipLayer, FindPanel, TypePanel, OutlinePanel]) {
      expect(typeof component).toBe('function')
    }
    expect(DEFAULT_TYPOGRAPHY.size).toBeGreaterThanOrEqual(TYPE_LIMITS.sizeMin)
    expect(DEFAULT_TYPOGRAPHY.size).toBeLessThanOrEqual(TYPE_LIMITS.sizeMax)
    expect(DEFAULT_TYPOGRAPHY.leading).toBeGreaterThanOrEqual(TYPE_LIMITS.leadingMin)
    expect(DEFAULT_TYPOGRAPHY.leading).toBeLessThanOrEqual(TYPE_LIMITS.leadingMax)
  })

  it('右键菜单在真实 DOM 中渲染，点击菜单项回传关闭并执行动作', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    let closed = false
    let ran = false
    const sections: MenuSection[] = [{
      id: 'main',
      items: [{ id: 'bold', icon: Bold, label: '加粗', run: () => { ran = true } }],
    }]
    await act(async () => {
      root.render(React.createElement(ContextMenu, {
        x: 10, y: 10, bounds: { width: 800, height: 600 }, sections, header: '正文',
        onClose: () => { closed = true },
      }))
    })
    const item = container.querySelector<HTMLElement>('[role=menuitem]')
    expect(item).not.toBeNull()
    await act(async () => { item!.click() })
    expect(closed).toBe(true)
    expect(ran).toBe(true)
    await act(async () => { root.unmount() })
    container.remove()
  })
})

describe('FocusEditor 真实 DOM 交互', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('挂载后渲染真实 CodeMirror 编辑区，初始正文可见', async () => {
    const ui = harness()
    await ui.render()
    try {
      const content = ui.container.querySelector<HTMLElement>('.cm-content')
      expect(ui.container.querySelector('.nw-focus')).not.toBeNull()
      expect(ui.container.querySelector('.cm-editor')).not.toBeNull()
      expect(content).not.toBeNull()
      expect(content!.getAttribute('aria-label')).toBe('文档正文')
      expect(content!.textContent).toContain('第一段。')
      expect(content!.textContent).toContain('第二段。')
      expect(ui.mounted).toHaveLength(1)
      expect(ui.mounted[0]!.state.doc.toString()).toBe(BODY)
    } finally {
      await ui.dispose()
    }
  })

  it('在编辑区输入后 store 收到新正文，并通过真实键盘事件触发保存', async () => {
    const ui = harness()
    await ui.render()
    try {
      const view = ui.mounted[0]!
      const content = ui.container.querySelector<HTMLElement>('.cm-content')!
      await act(async () => {
        view.dispatch({
          changes: { from: 0, insert: '新开头。' },
          selection: { anchor: '新开头。'.length },
          userEvent: 'input.type',
        })
      })
      expect(ui.store.updateBuffer).toHaveBeenCalled()
      const [sessionId, bufferKey, patch] = ui.store.updateBuffer.mock.calls.at(-1)!
      expect(sessionId).toBe(SESSION)
      expect(bufferKey).toBe(BUFFER_KEY)
      expect(patch).toEqual({ text: '新开头。' + BODY })
      expect(content.textContent).toContain('新开头。')

      await act(async () => { key(content, 's', { ctrlKey: true }) })
      expect(ui.store.save).toHaveBeenCalledTimes(1)
      expect(ui.store.save).toHaveBeenCalledWith(SESSION, BUFFER_KEY, [])
    } finally {
      await ui.dispose()
    }
  })

  it('右键编辑区打开真实菜单，点击“引用到对话”调用 actions.quote', async () => {
    const ui = harness()
    await ui.render()
    try {
      const content = ui.container.querySelector<HTMLElement>('.cm-content')!
      await act(async () => {
        content.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, clientX: 12, clientY: 12,
        }))
      })
      const menu = ui.container.querySelector<HTMLElement>('[role=menu][aria-label="编辑器菜单"]')
      expect(menu).not.toBeNull()
      expect(menu!.textContent).toContain('引用到对话')

      const quote = ui.container.querySelector<HTMLButtonElement>('[role=menuitem][aria-label="引用到对话"]')
      expect(quote).not.toBeNull()
      await act(async () => { quote!.click() })
      expect(ui.actions.quote).toHaveBeenCalledWith(SESSION, { text: '第一段。', line: 1 })
      expect(ui.container.querySelector('[role=menu][aria-label="编辑器菜单"]')).toBeNull()
    } finally {
      await ui.dispose()
    }
  })

  it('Ctrl+F 打开查找面板，输入后显示命中数，Escape 关闭', async () => {
    const ui = harness()
    await ui.render()
    try {
      const content = ui.container.querySelector<HTMLElement>('.cm-content')!
      await act(async () => { key(content, 'f', { ctrlKey: true }) })
      const panel = ui.container.querySelector<HTMLElement>('[role=search][aria-label="查找替换"]')
      expect(panel).not.toBeNull()
      const input = panel!.querySelector<HTMLInputElement>('input[aria-label="查找内容"]')
      expect(input).not.toBeNull()
      const count = panel!.querySelector<HTMLElement>('.ed-find-count')!

      await act(async () => { setInputValue(input!, '第二段') })
      expect(input!.value).toBe('第二段')
      expect(count.textContent).toBe('–/1')

      const next = panel!.querySelector<HTMLButtonElement>('button[aria-label="下一个"]')!
      expect(next.disabled).toBe(false)
      await act(async () => { next.click() })
      expect(count.textContent).toBe('1/1')

      await act(async () => {
        input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      })
      expect(ui.container.querySelector('[role=search][aria-label="查找替换"]')).toBeNull()
    } finally {
      await ui.dispose()
    }
  })

  it('从右键菜单打开排版面板，点击黑体后根节点字体与本地存储同步', async () => {
    const ui = harness()
    await ui.render()
    try {
      const content = ui.container.querySelector<HTMLElement>('.cm-content')!
      await act(async () => {
        content.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }))
      })
      const typeItem = ui.container.querySelector<HTMLButtonElement>('[role=menuitem][aria-label="排版"]')!
      await act(async () => { typeItem.click() })
      const panel = ui.container.querySelector<HTMLElement>('[role=dialog][aria-label="排版"]')
      expect(panel).not.toBeNull()

      const sans = panel!.querySelector<HTMLButtonElement>('button[aria-label="黑体"]')!
      await act(async () => { sans.click() })
      expect(sans.getAttribute('aria-pressed')).toBe('true')
      expect(ui.container.querySelector<HTMLElement>('.nw-focus')!.style.getPropertyValue('--ed-font')).toContain('PingFang SC')
      expect(JSON.parse(localStorage.getItem('abzu-editor-typography') ?? '{}')).toMatchObject({ font: 'sans' })

      await act(async () => { panel!.querySelector<HTMLButtonElement>('button[aria-label="关闭"]')!.click() })
      expect(ui.container.querySelector('[role=dialog][aria-label="排版"]')).toBeNull()
    } finally {
      await ui.dispose()
    }
  })

  it('Ctrl+Shift+O 打开大纲，点击条目把光标移到对应标题并关闭面板', async () => {
    const markdown = '# 第一章\n\n正文。\n\n## 小节\n'
    const ui = harness(markdown)
    await ui.render()
    try {
      const content = ui.container.querySelector<HTMLElement>('.cm-content')!
      await act(async () => { key(content, 'o', { ctrlKey: true, shiftKey: true }) })
      const panel = ui.container.querySelector<HTMLElement>('[role=dialog][aria-label="大纲"]')
      expect(panel).not.toBeNull()
      const items = [...panel!.querySelectorAll<HTMLButtonElement>('.ed-outline-item')]
      expect(items.map(item => item.textContent)).toEqual(['第一章', '小节'])

      await act(async () => { items[1]!.click() })
      expect(ui.mounted[0]!.state.selection.main.head).toBe(markdown.indexOf('## 小节'))
      expect(ui.container.querySelector('[role=dialog][aria-label="大纲"]')).toBeNull()
    } finally {
      await ui.dispose()
    }
  })
})
