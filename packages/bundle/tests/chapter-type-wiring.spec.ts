import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 章型双轴在技能侧的接线。
 * core 侧解析/校验由 packages/core/tests/chapter-type*.spec.ts 覆盖；
 * 这里只管「文档是否真的按两轴展开、取档表是否与 core 口径一致」。
 */
describe('章型双轴：技能侧接线', () => {
  const skillsRoot = path.join(__dirname, '..', 'skills')
  const read = (rel: string) => fs.readFileSync(path.join(skillsRoot, rel), 'utf8')

  it('细纲 SKILL 用两轴定义章型，不再有「过渡章＝其余」的单轴定义', () => {
    const outline = read('novel-outline/SKILL.md')
    expect(outline).toContain('轴 A 承诺档')
    expect(outline).toContain('轴 B 情绪位')
    expect(outline, '旧单轴定义应已退役').not.toContain('过渡章**＝其余')
    // 四值必须都在文档里出现，否则模型无从取值
    for (const v of ['铺垫', '高潮', '余波', '切换']) {
      expect(outline, `情绪位应含 ${v}`).toContain(v)
    }
  })

  it('章型落 frontmatter 字段，且软校验口径写明', () => {
    const outline = read('novel-outline/SKILL.md')
    expect(outline).toContain('章型: <承诺档>·<情绪位>')
    expect(outline, '需写明缺失不拦').toContain('缺字段只播报不拦')
    expect(outline, '需写明写错则拒').toContain('写错拒确认')
  })

  it('余波必须指定调剂式（旧设计漏掉的高设计密度章）', () => {
    const outline = read('novel-outline/SKILL.md')
    expect(outline).toContain('须指定调剂式')
    for (const v of ['日常', '喜剧', '清算']) {
      expect(outline, `调剂三式应含 ${v}`).toContain(v)
    }
    const spec = read('novel-outline/templates/章细纲固定小节规格.md')
    expect(spec, '简章规格须按两轴组合取档').toContain('过渡·余波')
    expect(spec, '简章规格须点名余波那格').toContain('简章但十查全项')
  })

  it('审读侧有章型取档表，且与 core 派发口径一致', () => {
    const tier = read('novel-review/references/章型取档.md')
    const cases: ReadonlyArray<[string, string]> = [
      ['`关键·*`', '9 维全跑'],
      ['`过渡·余波`', '确定性＋单维（章节结构）'],
      ['`过渡·高潮`', '确定性＋单维（节奏与张力）'],
      ['`过渡·切换`', '确定性＋单维（情节与因果）'],
      ['`过渡·铺垫`', '确定性＋单维（线索与伏笔）'],
    ]
    for (const [k, v] of cases) {
      expect(tier, `${k} 应取 ${v}`).toContain(k)
      expect(tier, `${k} 应取 ${v}`).toContain(v)
    }
    // 未标不降档，否则旧书会因为没这个字段而被少审
    expect(tier).toContain('未标')
    expect(tier, '缺章型不是少审的理由').toContain('宁可多审')
    // 降档不得压掉跨维发现
    expect(tier).toContain('超出本章型档位')
  })

  it('审读派发模板带章型槽位', () => {
    const review = read('novel-review/SKILL.md')
    expect(review).toContain('本章章型')
    expect(review).toContain('references/章型取档.md')
  })

  it('润色侧不得再按对白占比自行重判章型（第四套轴）', () => {
    // 历史问题：细纲侧定「关键/过渡」，润色侧用「按对白占比粗判章型」另判一遍，
    // 两处判定不一致时无人对账。章型统一由细纲 frontmatter 给出，下游只读不判。
    const polish = read('novel-polish/SKILL.md')
    expect(polish, '润色不应自行重判章型').not.toMatch(/按对白占比粗判章型/)
  })
})
