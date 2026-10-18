import { describe, expect, it } from 'vitest'
import { FocusEditor } from '../src/client/editor/FocusEditor'
import { ContextMenu } from '../src/client/editor/Menu'
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
})
