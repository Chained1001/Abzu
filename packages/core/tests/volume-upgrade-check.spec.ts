import { describe, expect, it } from 'vitest'
import { volumeOutlineGaps, volumeUpgradeCheckNotice, 卷纲第五段, 卷纲脚手架段 } from '../src/design/volume'

/**
 * 卷纲第五段「压力升级检查」的软校验。
 *
 * 背景：novel-arcplan/SKILL.md 与 卷纲固定段规格.md 都要求卷纲在四段之外加第五段，
 * 但 core 的 卷纲脚手架段 只有四段（建书脚手架 book/scaffold.ts 只建四段），
 * 于是「强制要求」与「实际校验」脱节——缺第五段照样能确认。
 *
 * 处理与章型同款：**不并入硬校验**（存量卷纲没有第五段，硬拦会让旧书确认不了），
 * 改为播报；但「写了就必须像样」——有标题无分条核对项要报。
 */
describe('卷纲第五段软校验', () => {
  const 四段 = ['## 叙事结构', '## 弧线', '## 线索推进', '## 卷末兑现']
  const 完整四段 = [...四段, '', '内容'].join('\n')

  it('第五段不并入硬校验段列表', () => {
    // 这是刻意的：并入就会把存量卷纲全拦下
    expect(卷纲脚手架段).not.toContain(卷纲第五段)
    expect(卷纲脚手架段).toHaveLength(4)
  })

  it('缺第五段：四段齐全时硬校验通过，但播报提示', () => {
    expect(volumeOutlineGaps(完整四段)).toEqual([])
    const notice = volumeUpgradeCheckNotice(完整四段)
    expect(notice).not.toBeNull()
    expect(notice).toContain(卷纲第五段)
    expect(notice, '须说明是存量可后补、不拦确认').toContain('不拦确认')
  })

  it('写了第五段且分条：无播报', () => {
    const body = `${完整四段}\n\n## 压力升级检查\n\n1. 层级对齐\n2. 对手出牌\n3. 卷末去向\n4. 终局暗手\n5. 升级位\n`
    expect(volumeUpgradeCheckNotice(body)).toBeNull()
  })

  it('有标题但无分条核对项：播报（走了形式）', () => {
    const body = `${完整四段}\n\n## 压力升级检查\n\n这段话没有分条。\n`
    const notice = volumeUpgradeCheckNotice(body)
    expect(notice).not.toBeNull()
    expect(notice).toContain('没有分条核对项')
  })

  it('第五段整体标〔留白〕：不播报（合法留白）', () => {
    const body = `${完整四段}\n\n## 压力升级检查\n\n〔留白〕本卷不适用，理由：终章卷。\n`
    expect(volumeUpgradeCheckNotice(body)).toBeNull()
  })

  it('标题带〔已确认〕尾注也能识别', () => {
    const body = `${完整四段}\n\n## 压力升级检查 〔已确认〕\n\n1. a\n2. b\n`
    expect(volumeUpgradeCheckNotice(body)).toBeNull()
  })

  it('缺第五段时仍能报四段缺口（两者不互相遮蔽）', () => {
    const gaps = volumeOutlineGaps('## 叙事结构\n\n内容')
    expect(gaps).toContain('卷纲段落不完整:弧线')
    expect(volumeUpgradeCheckNotice('## 叙事结构\n\n内容')).toContain(卷纲第五段)
  })

  it('空正文不崩，播报缺第五段', () => {
    expect(() => volumeUpgradeCheckNotice('')).not.toThrow()
    expect(volumeUpgradeCheckNotice('')).not.toBeNull()
  })
})
