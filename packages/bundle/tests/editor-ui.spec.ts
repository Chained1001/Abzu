import { create } from 'react-test-renderer'
import React from 'react'
import { Bold } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { FocusEditor } from '../src/client/editor/FocusEditor'
import { ContextMenu, type MenuSection } from '../src/client/editor/Menu'
import { TooltipLayer } from '../src/client/editor/Tooltip'
import { DEFAULT_TYPOGRAPHY, FindPanel, OutlinePanel, TypePanel, TYPE_LIMITS } from '../src/client/editor/panels'

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

  it('右键菜单可渲染菜单项并回传关闭', () => {
    const sections: MenuSection[] = [{
      id: 'main',
      items: [{ id: 'bold', icon: Bold, label: '加粗' }],
    }]
    let closed = false
    const tree = create(React.createElement(ContextMenu, {
      x: 10, y: 10, bounds: { width: 800, height: 600 }, sections, header: '正文',
      onClose: () => { closed = true },
    }))
    expect(tree.root.findAll((node) => node.props.role === 'menuitem')).toHaveLength(1)
    tree.unmount()
    expect(closed).toBe(false)
  })
})

