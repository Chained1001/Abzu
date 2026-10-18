// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { Bold } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { FocusEditor } from '../src/client/editor/FocusEditor'
import { ContextMenu, type MenuSection } from '../src/client/editor/Menu'
import { TooltipLayer } from '../src/client/editor/Tooltip'
import { DEFAULT_TYPOGRAPHY, FindPanel, OutlinePanel, TypePanel, TYPE_LIMITS } from '../src/client/editor/panels'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('编辑器 UI 模块', () => {
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

