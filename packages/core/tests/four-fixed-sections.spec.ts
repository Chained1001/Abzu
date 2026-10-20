import { describe, expect, it } from 'vitest'
import { 四固定小节, 四固定小节缺失 } from '../src/outline/template'

describe('四固定小节软校验', () => {
  const full = `# 章细纲\n\n### 本章形状\n反转揭半留半\n\n### 已排除走向\n无\n\n### 冲突与爽点\n外部一行\n\n### 章末双钩\n信息钩一行\n`
  it('齐全 → null', () => { expect(四固定小节缺失(full)).toBeNull() })
  it('全缺 → 播报四节名', () => {
    const r = 四固定小节缺失('# 章细纲\n\n## 定位段\n\n### 章节功能\nx\n')
    expect(r).toContain('未写四固定小节')
    expect(r).toContain('不拦确认')
  })
  it('部分缺 → 点名缺哪几节', () => {
    const r = 四固定小节缺失('### 本章形状\nx\n\n### 章末双钩\ny\n')
    expect(r).toContain('已排除走向')
    expect(r).toContain('冲突与爽点')
    expect(r).not.toContain('本章形状（')
  })
  it('行内写法不算有该节（须纯标题行）', () => {
    expect(四固定小节缺失('### 本章形状：反转揭半留半\n')).toContain('未写四固定小节')
  })
  it('四节常量与规格一致', () => {
    expect([...四固定小节]).toEqual(['本章形状', '已排除走向', '冲突与爽点', '章末双钩'])
  })
})
