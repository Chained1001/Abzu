import { describe, expect, it } from 'vitest'
import { 严重程度列表, 归一化严重程度, 是高级严重程度 } from '../src'

describe('严重程度归一化', () => {
  it('三档列表固定，技能侧第二套词表映射到三档', () => {
    expect(严重程度列表).toEqual(['高', '中', '低'])
    expect(归一化严重程度('高')).toBe('高')
    expect(归一化严重程度('硬伤')).toBe('高')
    expect(归一化严重程度('严重')).toBe('高')
    expect(归一化严重程度('中')).toBe('中')
    expect(归一化严重程度('建议')).toBe('中')
    expect(归一化严重程度('低')).toBe('低')
    expect(归一化严重程度('仅供参考')).toBe('低')
  })

  it('未知值原样保留，不静默改写证据；高级判定只认归一后的高', () => {
    expect(归一化严重程度('待定')).toBe('待定')
    expect(是高级严重程度('硬伤')).toBe(true)
    expect(是高级严重程度('建议')).toBe(false)
    expect(是高级严重程度('待定')).toBe(false)
  })
})
