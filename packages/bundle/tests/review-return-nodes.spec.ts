import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 审读发现项的六类返回节点，必须每一类都有真实落地通道。
 *
 * 历史问题：`novel-review/SKILL.md:42-47` 定义六类返回节点，但其中两类下游不收：
 * - 「细纲」：`novel-outline` 只有重入勘误，不读审核记录，无接收槽
 * - 「沉淀（账本更正）」：`novel-settle` 只有入档后的 retcon，未入档前的账本无通道
 *
 * 修法是把这两类挂到既有通道上（细纲→轻量改纲；账本→按入档前后分界），
 * 并在两侧技能里点名这是「审读发现项回流的唯一通道」，避免主控只口头转述。
 */
describe('审读返回节点落地通道', () => {
  const skills = path.join(__dirname, '..', 'skills')
  const read = (rel: string): string => fs.readFileSync(path.join(skills, rel), 'utf8')

  const review = read('novel-review/SKILL.md')
  const outline = read('novel-outline/SKILL.md')
  const settle = read('novel-settle/SKILL.md')

  it('审读定义了六类返回节点', () => {
    for (const node of ['润色', '改稿', '细纲', '备料', '沉淀（账本更正）', '作者裁决']) {
      expect(review, `应定义返回节点「${node}」`).toContain(node)
    }
  })

  it('「细纲」节点在 novel-outline 有明确接收通道', () => {
    expect(outline, '应点名承接审读细纲类发现项').toContain('返回节点＝细纲')
    expect(outline, '须声明是唯一通道').toContain('唯一通道')
    // 挂的是既有勘误通道，不是新造门槛
    expect(outline).toContain('轻量改纲三类同走勘误通道')
    expect(outline, '须说明关闭方式').toContain('原发现项不再命中即关闭')
  })

  it('「账本更正」节点在 novel-settle 有明确分界通道', () => {
    expect(settle, '应点名承接账本更正类发现项').toContain('返回节点＝沉淀（账本更正）')
    // 入档前走后组包，入档后走 retcon —— 两条都要写明
    expect(settle, '入档前应走重组包').toContain('改候选「账本变更」段重组包')
    expect(settle, '入档后应走吃书补偿').toContain('吃书补偿')
  })

  it('两类通道都反对口头转述', () => {
    expect(outline, '细纲侧须禁止口头转述').toContain('不口头转述')
    expect(settle, '账本侧须禁止口头转述').toContain('不口头转述')
  })

  it('其余四类通道在原文里仍有落点', () => {
    // 润色
    expect(review).toContain('留润色')
    // 改稿
    expect(review).toContain('`novel_apply_revision_batch`')
    // 备料
    expect(review).toContain('补料刷新材料包')
    // 作者裁决
    expect(review).toContain('作者裁决（主控动作，非返回节点）')
  })
})
