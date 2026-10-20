import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 章型双轴 → 评审分级门禁表的接线。
 *
 * 背景：旧设计里「章型」有四套互不兼容的分类（细纲侧关键/过渡、门禁侧关键/普通/过渡、
 * 设计侧常规/过渡/高潮、产品文档对白戏/叙事/独行），两处判定不一致时无人对账。
 * 章型落 frontmatter 后，门禁表必须从该字段读档，不能再并列一套散文判定。
 */
describe('章型 → 评审门禁接线', () => {
  const root = path.join(__dirname, '..', 'skills', 'novel-director', 'references')
  const gate = fs.readFileSync(path.join(root, '评审分级与门禁.md'), 'utf8')

  it('门禁表声明章级位置档取章型字段，而非散文重判', () => {
    expect(gate).toContain('章级位置档直接取 `章型` 字段')
    expect(gate, '旧散文定义须降为兜底').toContain('只作为 `章型` 缺失时的兜底判据')
  })

  it('三个承诺档取值都有对应档位映射', () => {
    expect(gate).toContain('`章型: 关键·*`')
    expect(gate).toContain('`章型: 过渡·*`')
  })

  it('余波与高潮不得被当成纯过渡档放行', () => {
    // 这是拆轴的核心收益：余波是高设计密度章，不能被「过渡章」标签带进留白档。
    expect(gate).toContain('`过渡·余波`／`过渡·高潮` 仍须跑「确定性＋单维」')
    expect(gate, '须点名余波查什么').toContain('连续钝收与泄压钩居位')
  })

  it('章型缺失按关键档走，不缺省成过渡', () => {
    expect(gate).toContain('`章型` 未标 → 按**关键章**走')
    expect(gate, '缺字段不是少审的理由').toContain('缺字段不是少审的理由')
  })

  it('章纲与正文读同一字段，不再各自重判', () => {
    expect(gate).toContain('章纲与正文读同一个 `章型` 字段')
    expect(gate, '须写明旧问题来源').toContain('两处判定对不上的来源')
  })

  it('冲突时取高的旧规则不被章型绕过', () => {
    // 章型是默认值，L 级仍可把它抬上去——这条不能被新接线吃掉。
    expect(gate).toContain('**冲突时取高**')
    expect(gate).toContain('不能把它压下来')
  })
})
