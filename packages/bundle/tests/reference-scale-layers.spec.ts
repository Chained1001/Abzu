import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 参考标尺（v3 规划三段制）。
 *
 * 这组测试守的是结构与消费契约，不是具体校准值：
 * 1. 标尺只服务中文长篇连载网文；止于幕纲，章纲与正文执行期不查本表；
 * 2. 三段分节（零、先定档／一、大纲／二、卷纲／三、幕纲）＋三个附录；
 * 3. 每行五列 schema（id｜项｜参考｜口径／说明｜强度），强度三档只有硬/参考/对照；
 * 4. 行 ID 唯一、稳定；不在表的章级行不得回流；
 * 5. 全书无 EV-/S1–S5/证据台账等自证残留，无具体书名与角色名；
 * 6. 章级执行红线内联在写前十查／审读底本／雷点清单，不从标尺取；
 * 7. 两个已退役件（证据台账、标尺使用日志）不得回流；artifact-contract 不再登记。
 */

const SKILLS = path.join(__dirname, '..', 'skills')
const SCALE_PATH = path.join(SKILLS, 'novel-design', 'references', '参考标尺.md')
const text = fs.readFileSync(SCALE_PATH, 'utf8')

const STRENGTH = new Set(['硬', '参考', '对照'])

type Row = {
  readonly line: number
  readonly id: string
  readonly cells: readonly string[]
  readonly strength: string
}

function cellsOf(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((s) => s.trim())
}

const rows: Row[] = []
for (const [i, line] of text.split(/\r?\n/).entries()) {
  const id = /^\|\s*(L[0-9]-[A-Za-z0-9-]+)\s*\|/.exec(line)?.[1]
  if (id === undefined) continue
  const cells = cellsOf(line)
  expect(cells.length, `第 ${i + 1} 行 ${id}: 表格列数应为 5`).toBe(5)
  rows.push({ line: i + 1, id, cells, strength: cells[4]! })
}

function rowById(id: string): Row {
  const row = rows.find((r) => r.id === id)
  expect(row, `缺少标尺行 ${id}`).toBeDefined()
  return row!
}

function sectionOf(title: string): string {
  const start = text.indexOf(`## ${title}`)
  expect(start, `缺少节「${title}」`).toBeGreaterThanOrEqual(0)
  const next = text.indexOf('\n## ', start + 1)
  return next === -1 ? text.slice(start) : text.slice(start, next)
}

/** 章级行 v3 已移出标尺，改由写前十查／审读底本内联。 */
const CHAPTER_LEVEL_IDS = [
  'L0-02', 'L1-01', 'L1-02', 'L1-03', 'L1-04', 'L1-05',
  'L2-A1-03', 'L2-A1-05', 'L2-A4-04',
]
/** L3 本书覆盖层 v3 已整层删除，由《本书节奏基线》三项承担。 */
const L3_IDS = ['L3-01', 'L3-02', 'L3-03', 'L3-04', 'L3-05', 'L3-06', 'L3-07', 'L3-08']

describe('参考标尺 v3 结构与 schema', () => {
  it('定位：中文长篇连载网文，止于幕纲，章纲与执行期不查本表', () => {
    expect(text).toMatch(/^# 参考标尺$/m)
    expect(text).toContain('中文长篇连载网文')
    expect(text).toContain('覆盖大纲 → 卷纲 → 幕纲三段规划')
    expect(text, '应写明章纲与执行期不查本表').toContain('章纲与正文执行期不查本表')
    expect(text, '应写明数字是参考区间不是配额').toContain('数字是参考区间，不是配额')
  })

  it('三段分节＋三个附录齐备，目录条数与实际行数一致', () => {
    for (const section of ['## 零、先定档', '## 一、大纲', '## 二、卷纲', '## 三、幕纲']) {
      expect(text, `缺少节 ${section}`).toContain(section)
    }
    for (const appendix of ['## 附：本书基线', '## 附：体量对账', '## 附：长度换算']) {
      expect(text, `缺少附录 ${appendix}`).toContain(appendix)
    }

    const expectedBySection: Array<readonly [string, number]> = [
      ['零、先定档', 8],
      ['一、大纲', 37],
      ['二、卷纲', 24],
      ['三、幕纲', 14],
    ]
    for (const [title, expected] of expectedBySection) {
      const body = sectionOf(title)
      const count = body.split(/\r?\n/).filter((line) => /^\|\s*L[0-9]-[A-Za-z0-9-]+\s*\|/.test(line)).length
      expect(count, `「${title}」行数应为 ${expected}`).toBe(expected)
      expect(body, `「${title}」目录条数应与实际一致`).toBeDefined()
    }
    expect(rows).toHaveLength(83)

    // 目录表里的条数必须与实测一致，防止加行忘改目录
    const indexRows = text.slice(text.indexOf('## 目录'), text.indexOf('## 怎么用'))
    for (const [title, count] of [['零、先定档', 8], ['一、大纲', 37], ['二、卷纲', 24], ['三、幕纲', 14]]) {
      const line = indexRows.split(/\r?\n/).find((l) => l.startsWith(`| ${title} |`))
      expect(line, `目录缺「${title}」行`).toBeDefined()
      expect(line!, `目录「${title}」条数应为 ${count}`).toContain(`| ${count} |`)
    }
  })

  it('schema：每行五列非空，强度只有硬/参考/对照三档，行 ID 唯一', () => {
    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size, '行 ID 不得重复').toBe(ids.length)

    for (const row of rows) {
      for (const [index, cell] of row.cells.entries()) {
        expect(cell.length, `${row.id} 第 ${index + 1} 列不得为空`).toBeGreaterThan(0)
      }
      expect(STRENGTH.has(row.strength), `${row.id}: 强度「${row.strength}」非法（只可 硬/参考/对照）`).toBe(true)
      expect(row.cells[1], `${row.id}: 项列不得为空`).toBeDefined()
    }
    expect(text, '强度三档应写明').toContain('**强度三档**')
    for (const strength of ['`硬`', '`参考`', '`对照`']) {
      expect(text, `强度说明应含 ${strength}`).toContain(strength)
    }
  })

  it('章级行不回流：已下沉的九行不得回到标尺', () => {
    for (const id of CHAPTER_LEVEL_IDS) {
      expect(rows.some((r) => r.id === id), `章级行 ${id} 应已移出标尺`).toBe(false)
    }
  })

  it('L3 本书覆盖层整层退役，改由《本书节奏基线》承担', () => {
    for (const id of L3_IDS) {
      expect(rows.some((r) => r.id === id), `L3 行 ${id} 应已退役`).toBe(false)
    }
    expect(text, '附录应把本书基线指到基线件').toContain('《本书节奏基线》')
    expect(text, '应写明 L0 与硬红线不可被本书基线覆盖').toContain('L0 不变量与硬红线不可被本书基线覆盖')
  })

  it('零节八个轴齐全且顺序固定 A1→A8', () => {
    const axisRows = rows.filter((r) => r.id.startsWith('L2-AX-'))
    expect(axisRows).toHaveLength(8)
    expect(axisRows.map((r) => r.cells[1]!.slice(0, 2))).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'])
  })

  it('幕级十三行在位，幕纲产品单位取 01B、宏观幕取 01A', () => {
    const actIds = rows.filter((r) => r.id.startsWith('L2-ACT-')).map((r) => r.id)
    expect(actIds).toEqual([
      'L2-ACT-01', 'L2-ACT-01A', 'L2-ACT-01B',
      'L2-ACT-02', 'L2-ACT-03', 'L2-ACT-04', 'L2-ACT-05', 'L2-ACT-06',
      'L2-ACT-07', 'L2-ACT-08', 'L2-ACT-09', 'L2-ACT-10', 'L2-ACT-11',
    ])
    expect(rowById('L2-ACT-01').cells.join(''), '族入口应指向 01A／01B').toContain('01A')
    expect(rowById('L2-ACT-01B').cells.join(''), '幕纲产品单位取本行').toContain('幕纲产品单位取本行')
    expect(rowById('L2-ACT-01A').cells.join(''), '宏观幕不是产品单位').toContain('不是幕纲产品单位')
  })

  it('幕的术语 gloss：本表说的幕＝卷内单元，不是 act', () => {
    expect(text).toContain('本表说的「幕」＝卷内单元（≈sequence）')
    expect(text, '应排除三幕/四幕的 act').toContain('不是三幕／四幕的 act')
    expect(text, '幕纲六段映射应在位').toContain('**幕纲六段对应**')
    for (const segment of ['本幕故事', '线与伏笔', '出场人物', '查证清单', '章组排布', '幕末结算']) {
      expect(text, `幕纲六段应含「${segment}」`).toContain(segment)
    }
  })

  it('世界复杂度：压力源七类、接口、移动、背景事件、善后五问均有定位', () => {
    const definition = (id: string): string => rowById(id).cells[2]!
    const pressure = definition('L0-03')
    for (const source of ['人', '制度', '资源', '自然', '时间', '关系', '自我']) {
      expect(pressure, `L0-03 应含压力源「${source}」`).toContain(source)
    }
    expect(pressure).toContain('不以反派数量代替')

    const interfaces = definition('L0-15')
    for (const iface of ['市井', '官府', '军队', '宗门', '商队', '教会', '家族', '江湖']) {
      expect(interfaces, `L0-15 应含接口「${iface}」`).toContain(iface)
    }
    expect(definition('L0-16'), '物理移动不是通用必需').toContain('物理移动不是通用必需')
    const background = definition('L0-17')
    for (const event of ['战争', '灾荒', '政变', '节日', '瘟疫', '物价', '门派内斗']) {
      expect(background, `L0-17 应含背景事件「${event}」`).toContain(event)
    }
    const aftermath = definition('L0-18')
    for (const question of ['谁看见', '谁传开', '谁追责', '谁收尸', '谁得利']) {
      expect(aftermath, `L0-18 应含善后五问「${question}」`).toContain(question)
    }
    expect(rows.filter((r) => r.id.startsWith('L2-WC-')), '世界复杂度形态档应五条').toHaveLength(5)
  })

  it('L1-06 拆行保留：主线数、支线数、成长弧段数三行各自独立', () => {
    expect(rowById('L1-06').cells[1]).toContain('主线')
    expect(rowById('L1-06').cells[2]).toContain('1–2')
    expect(rowById('L1-06A').cells[1]).toContain('支线')
    expect(rowById('L1-06A').cells[2]).toContain('3–8')
    expect(rowById('L1-06B').cells[1]).toContain('成长弧')
    const growth = rowById('L1-06B').cells.join('')
    expect(growth, 'L1-06B 应承认 flat arc').toContain('flat arc')
    expect(growth, 'L1-06B 不变主角按 0 段豁免').toContain('0 段豁免')
  })

  it('无自证残留：不出现 EV- 编号、S1–S5 样本码、证据台账指针', () => {
    for (const marker of ['EV-', 'S1–S5', 'S6 抽样', '证据台账', 'n=28', 'n=14', 'n=23']) {
      expect(text, `标尺不应残留「${marker}」`).not.toContain(marker)
    }
    for (const marker of ['【待校准】', 'unverified', 'experimental', '【未验证】', '【低置信】', '待参考标尺校准流程定']) {
      expect(text, `标尺不应残留占位「${marker}」`).not.toContain(marker)
    }
    expect(text, '应声明只保留结论、不逐行自证').toContain('只保留结论，不逐行自证')
  })

  it('零具体书名/角色名', () => {
    const blacklist = [
      '大奉打更人', '大奉', '诡秘之主', '诡秘', '我真没想重生啊', '重生啊',
      '绍宋', '十日终焉', '十日', '斗破苍穹', '斗破', '道诡异仙', '道诡',
      '魏渊', '罗塞尔', '徐芷溪',
    ]
    for (const name of blacklist) {
      expect(text, `参考标尺不应出现具体书名/角色名「${name}」`).not.toContain(name)
    }
  })

  it('旧类目与取数速查表不当现行：无固定层/比例层/取数速查表标题', () => {
    for (const stale of ['固定层', '比例层', '题材包', '题材修正']) {
      expect(text, `标尺不应把「${stale}」当现行`).not.toContain(stale)
    }
    expect(text, '取数速查表不得再当标题').not.toMatch(/^#+.*取数速查表/m)
    expect(text, '长度换算只作粗算').toContain('只用于同一口径下按篇幅粗算数量')
  })

  it('附录体量对账：列式与对账项在位，本书规划数不凭印象估', () => {
    const appendix = sectionOf('附：体量对账')
    expect(appendix, '列式应在位').toContain('体量项｜参考标尺建议（取数算式）｜本书规划数｜差额｜处理（补足／说明理由）')
    expect(appendix, '应写明不凭印象估').toContain('不凭印象估')
    expect(appendix, '应含世界复杂度五问').toContain('世界复杂度五问')
    expect(appendix, '本书自报优先').toContain('以本书自报为准')
  })
})

describe('章级判据下沉：红线不进标尺，改由消费件内联', () => {
  const read = (...parts: string[]): string => fs.readFileSync(path.join(SKILLS, ...parts), 'utf8')
  const preWrite = read('novel-outline', 'agents', '写前十查.md')
  const spec = read('novel-outline', 'templates', '章细纲固定小节规格.md')
  const reviewSkill = read('novel-review', 'SKILL.md')
  const fullReview = read('novel-review', 'agents', '全量审读.md')
  const chapterReview = read('novel-review', 'agents', '章节结构审读.md')
  const pacingReview = read('novel-review', 'agents', '节奏与张力审读.md')
  const mineList = read('novel-design', 'references', '雷点清单.md')

  it('写前十查⑩内联钩型红线与配比区间，不再指路标尺', () => {
    expect(preWrite, '应内联危机钩红线').toContain('≤5 章')
    expect(preWrite, '应内联泄压钩居位').toContain('泄压钩只居高潮余波位')
    expect(preWrite, '应内联张力档配比').toContain('60–80%')
    expect(preWrite, '应内联情感档配比').toContain('25–40%')
    expect(preWrite, '应写明配比只对 ≥50 章窗口').toContain('仅 ≥50 章窗口适用')
    expect(preWrite, '应内联章末未闭合项功能').toContain('章末必须留一个未闭合项')
    expect(preWrite, '不得再指路标尺章末钩型配比行').not.toContain('参考标尺.md 章节与卷节奏参照「章末钩型配比」行')
  })

  it('写前十查⑥内联兑现密度与连续无兑现上限', () => {
    expect(preWrite, '应内联每 1–2 章一次价值变化').toContain('每 1–2 章一次价值变化')
    expect(preWrite, '应内联连续无兑现上限').toContain('连续无兑现 **≤5 章**')
    expect(preWrite, '应内联慢热/悬疑放宽').toContain('≤7 章')
    expect(preWrite, '本书基线优先').toContain('本书基线已建时以本书值为先')
  })

  it('写前十查雷点快扫行内联憋屈上限，不再指路标尺', () => {
    expect(preWrite, '应内联憋屈三章上限').toContain('纯憋屈 **不超 3 章**')
    expect(preWrite, '应内联强虐向放宽').toContain('5 章**但须有平行小爽线补偿')
    expect(preWrite, '不得再指路标尺憋屈行').not.toContain('参考标尺.md 憋屈剧情上限行')
  })

  it('章细纲固定小节规格的章末双钩节内联兑现红线', () => {
    expect(spec, '应内联危机钩红线').toContain('危机钩（即时威胁型）兑现章号距钩章 ≤5 章')
    expect(spec, '应内联泄压钩居位').toContain('泄压钩只居高潮余波位')
    expect(spec, '红线细则应指到写前十查').toContain('写前十查](../agents/写前十查.md) 第 10 条')
    expect(spec, '不得再指路标尺章末钩型配比行').not.toContain('参考标尺.md 章节与卷节奏参照「章末钩型配比」行')
  })

  it('审读派发固定件：章级红线单源在 novel-review/SKILL，标明不摘标尺', () => {
    expect(reviewSkill, '应有章级执行红线固定件').toContain('- 章级执行红线（单源在本 SKILL，不进参考标尺）')
    for (const pin of ['≤5 章', '每 1–2 章一次价值变化', '纯憋屈 **≤3 章**', '未闭合项']) {
      expect(reviewSkill, `红线件应含「${pin}」`).toContain(pin)
    }
    expect(reviewSkill, '应说明章级红线不从标尺摘').toContain('章级红线不再取参考标尺')
    expect(reviewSkill, '应说明标尺止于幕纲').toContain('标尺止于幕纲')
    expect(reviewSkill, '摘录行不再点章级行 ID').not.toContain('L1-01／L1-02 章级兑现密度')
  })

  it('审读三份底本与雷点清单各自内联红线，无悬空指路', () => {
    expect(fullReview, '全量审读维度 1 应指到红线件').toContain('照派发材料的章级执行红线件')
    expect(chapterReview, '章节结构审读应内联兑现红线').toContain('危机钩兑现章号距钩章 **≤5 章**')
    expect(pacingReview, '节奏与张力审读应内联兑现密度').toContain('连续无兑现 **≤5 章**')
    expect(pacingReview, '节奏与张力审读应内联泄压占比').toContain('泄压章占比')
    // 憋屈上限数值单源在审读 SKILL 第二部分；雷点清单只记现象并指回单源，不再重述数值（否则三方互指）
    expect(mineList, '雷点清单应指回憋屈上限单源').toContain('单源在《全面审读》第二部分章级执行红线')
    expect(mineList, '雷点清单不得再重述憋屈数值').not.toMatch(/纯憋屈\*\*不超 3 章\*\*/)
    expect(mineList, '雷点清单不得再指路标尺憋屈行').not.toContain('还手时限照《参考标尺》憋屈剧情上限行')
  })
})

describe('两份自证型台账退役（证据台账、标尺使用日志）', () => {
  const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
  const fixedDocs = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'scripts', 'benchmarks', 'fixed-docs.mjs'),
    'utf8',
  )

  it('两个文件已删除，artifact-contract 不再登记', () => {
    for (const name of ['证据台账.md', '标尺使用日志.md']) {
      expect(fs.existsSync(path.join(SKILLS, 'novel-design', 'references', name)), `${name} 应已删除`).toBe(false)
      expect(contract, `artifact-contract 不应再登记 ${name}`).not.toContain(name)
    }
    expect(contract, '参考标尺仍应登记').toContain("'skills/novel-design/references/参考标尺.md'")
    expect(contract, '节奏基线仍应登记').toContain("'skills/novel-design/references/本书节奏基线.md'")
    expect(fixedDocs, '新 reference 不进 fixed-docs 预算').not.toContain('证据台账')
  })

  it('skills 与 docs 无残留指针', () => {
    const walk = (dir: string): string[] => {
      const out: string[] = []
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          out.push(...walk(abs))
          continue
        }
        if (entry.name.endsWith('.md')) out.push(abs)
      }
      return out
    }
    const offenders: string[] = []
    for (const file of walk(SKILLS)) {
      const body = fs.readFileSync(file, 'utf8')
      for (const term of ['证据台账', '标尺使用日志']) {
        if (body.includes(term)) offenders.push(`${path.relative(SKILLS, file)}:${term}`)
      }
    }
    expect(offenders, `skills 文档不得再指已退役件：${offenders.join('、')}`).toEqual([])

    const docs = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', '产品', '怎么走.md'), 'utf8')
    expect(docs, '产品文档不得再提证据台账').not.toContain('证据台账')
  })
})

describe('本书节奏基线：三项化', () => {
  const baselinePath = path.join(SKILLS, 'novel-design', 'references', '本书节奏基线.md')
  const baseline = fs.readFileSync(baselinePath, 'utf8')

  it('工件路径与属性不变：书房资产、非真源、不入书仓 git', () => {
    expect(baseline).toContain('`<工作范围>/书房/开书/<书名>/节奏基线.md`')
    expect(baseline).toContain('书房资产')
    expect(baseline).toContain('非真源')
    expect(baseline).toContain('不入书仓 git')
    expect(baseline).toContain('不产生 `design:` 提交')
  })

  it('只留三项，不再写八项汇总', () => {
    for (const item of ['章长中位与波动', '卷长与末卷倍率', '卷内高潮位']) {
      expect(baseline, `应保留「${item}」`).toContain(item)
    }
    expect(baseline, '应写明不建件的五项').toContain('钩型配比、兑现间隔、POV 数、场景数、对话密度')
    expect(baseline, '应说明不建件的理由').toContain('用时现算')
    expect(baseline, '不得再有八项汇总表头').not.toContain('| 项 | 记什么 | 取数口径 | 样本门槛 | 覆盖的通用行 |')
  })

  it('样本门槛与冷启动保留，不伪造稳定基线', () => {
    expect(baseline).toContain('样本不足')
    expect(baseline).toContain('不伪造稳定基线')
    expect(baseline).toContain('| 样本量 | 状态 | 能写什么 |')
    expect(baseline).toContain('合法状态')
    expect(baseline).toContain('≥10 章')
    expect(baseline).toContain('≥1 卷完结')
  })

  it('卷末更新协议保留，但去掉版本记录之外的膨胀', () => {
    expect(baseline).toContain('卷末三件')
    expect(baseline).toContain('不逐章更新')
    for (const field of ['版本', '样本量', '变化', '作者确认']) {
      expect(baseline, `更新记录应含「${field}」`).toContain(field)
    }
    expect(baseline).toContain('只增不改')
    expect(baseline).toContain('口径变更')
  })

  it('先本书基线再通用标尺，偏离先解释、标尺只做离群预警', () => {
    expect(baseline).toContain('先本书基线')
    expect(baseline).toContain('再通用参考标尺')
    expect(baseline).toContain('先解释')
    expect(baseline).toContain('离群预警')
    expect(baseline).toContain('不拦卡')
  })

  it('自报覆盖简化为一表，L0 与硬红线不可覆盖', () => {
    expect(baseline).toContain('本书不适用或已调整的通用行')
    expect(baseline).toContain('L0 不变量与硬红线**不可**登记为不适用')
    expect(baseline, '不得再引用已退役的 L3 行').not.toMatch(/L3-0[1-8]/)
  })

  it('审读携带摘要为三项，不再八项', () => {
    expect(baseline).toContain('本书节奏基线 v<N>')
    expect(baseline).toContain('- 章长：中位 x 字')
    expect(baseline).toContain('- 卷长：常态卷 x 章')
    expect(baseline).toContain('- 卷内高潮位：第 x 章位')
    expect(baseline, '不得再带八项摘要').not.toContain('钩型：张力 x%')
  })

  it('design/arcplan 指针同步为三项口径', () => {
    const design = fs.readFileSync(path.join(SKILLS, 'novel-design', 'SKILL.md'), 'utf8')
    const arcplan = fs.readFileSync(path.join(SKILLS, 'novel-arcplan', 'SKILL.md'), 'utf8')
    expect(design, '工件契约应写三项汇总').toContain('三项汇总')
    expect(arcplan, '卷末更新应只汇总三项').toContain('只汇总**三项**')
    expect(arcplan, '应写明五项不建件').toContain('**不建件**')
    expect(design, '工件表不应再登记标尺使用日志').not.toContain('| 标尺使用日志 |')
    expect(arcplan, '工件表不应再登记标尺使用日志').not.toContain('| 标尺使用日志 |')
  })
})

describe('拆书三接口接线：报告定位、登记承载、回看落点', () => {
  const skillsRoot = path.join(__dirname, '..', 'skills')
  const read = (rel: string) => fs.readFileSync(path.join(skillsRoot, rel), 'utf8')

  it('机制使用登记有真实承载体（候选细纲可选增补行）', () => {
    // 历史问题：机制与灵感要求登记写进「可选增补行」，但可选增补行规格里没有这一项，
    // 且规则自陈「缺了不拦、写了不校」——登记无处可写，等于拆书用完不留痕。
    const spec = read('novel-outline/templates/章细纲固定小节规格.md')
    const start = spec.indexOf('## 可选增补行')
    expect(start, '可选增补行小节应存在').toBeGreaterThanOrEqual(0)
    const section = spec.slice(start, spec.indexOf('\n## ', start + 10))
    expect(section, '机制使用登记必须在可选增补行小节内').toContain('机制使用登记')
    for (const field of ['机制卡', '借什么原理', '不借什么', '用在哪单元']) {
      expect(section, `登记行应含「${field}」`).toContain(field)
    }
  })

  it('消费回看有真实接收位（卷对账的机制消费行）', () => {
    // 历史问题：机制与灵感承诺「结论写进卷末结算」，但技能层根本没有「卷末结算」这个段，
    // 幕末结算六步与幕纲六段都无机制项——反馈环在最后一环断开。
    expect(read('novel-analyze/references/机制与灵感.md'), '机制侧指向卷对账').toContain('卷对账')
    const arcplan = read('novel-arcplan/SKILL.md')
    expect(arcplan, '卷对账必须展开成可执行的行').toContain('卷对账四行')
    expect(arcplan, '卷对账须含机制消费一行').toContain('机制消费')
  })

  it('拆书报告明确标注为作者成品，不得被当作下游判据', () => {
    // 历史问题：报告.md 与 观察/*.md 零消费者，却被阶段地图列为开书主要工件。
    const analyze = read('novel-analyze/SKILL.md')
    expect(analyze).toContain('给作者读的成品')
    expect(analyze).toContain('不是下游判据')
    const map = read('novel-director/references/阶段地图.md')
    expect(map, '阶段地图不得把拆书报告列为阶段交付物').toContain('不是阶段交付物')
  })

  it('卷对账不再只有一句话，四行都可核对', () => {
    const arcplan = read('novel-arcplan/SKILL.md')
    for (const row of ['伏笔账', '承诺账', '信息释放台账', '机制消费']) {
      expect(arcplan, `卷对账应含「${row}」`).toContain(row)
    }
  })
})

describe('标尺引用一致性：行名与列名不得指向已不存在的东西', () => {
  const skillsRoot = path.join(__dirname, '..', 'skills')
  const markdownFiles = (function walk(dir: string, acc: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) { if (entry.name !== 'assets') walk(abs, acc) }
      else if (entry.name.endsWith('.md')) acc.push(abs)
    }
    return acc
  })(skillsRoot)

  const scaleNames = rows.map((r) => r.cells[1]?.trim() ?? '')
  const scaleIds = new Set(rows.map((r) => r.id))

  it('提到「标尺」并引用「X」行时，X 必须是真实行名或行 ID', () => {
    // 判据：同一行里出现「标尺」且出现「…」行，则引号内必须是标尺真实行名（或含行 ID）。
    // 泛指（该项/上述/该行/本行/各行）跳过——它们不是具体行名。
    // 反例（历史上真出现过三次）：「章末钩型配比」行已删仍被卷纲规格引用；
    // 「小爽点间隔」行 v3 改名为「大爽点间隔」；「L2-A4-05 幕」行已删。
    const vague = /^(该项|上述|该|本|各|相关|前|后|此|其)/
    const failures: string[] = []
    for (const abs of markdownFiles) {
      const rel = path.relative(skillsRoot, abs).replace(/\\/g, '/')
      if (rel === 'novel-design/references/参考标尺.md') continue
      const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/)
      for (const [index, line] of lines.entries()) {
        if (!line.includes('标尺')) continue
        for (const match of line.matchAll(/「([^」]{2,30})」行/g)) {
          const name = match[1]!
          if (/L[0-9]-/.test(name) || vague.test(name)) continue
          const known = scaleNames.some((n) => n === name || n.includes(name) || name.includes(n))
          if (!known) failures.push(`${rel}:${index + 1} 引用了标尺里不存在的行「${name}」`)
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('标尺只有 id｜项｜参考｜口径／说明｜强度 五列', () => {
    expect(text).toContain('| id | 项 | 参考 | 口径／说明 | 强度 |')
    for (const gone of ['status', 'gate', 'confidence', 'stability', 'legacy', 'consumer', '打破条件']) {
      // 表头不得再出现旧列；正文里提到「已删」的说明性文字不算
      expect(text, `标尺不应再有 ${gone} 列`).not.toContain(`| ${gone} |`)
    }
  })

  it('所有引用标尺行 ID 的地方，ID 都在表里', () => {
    const failures: string[] = []
    for (const abs of markdownFiles) {
      const rel = path.relative(skillsRoot, abs).replace(/\\/g, '/')
      if (rel === 'novel-design/references/参考标尺.md') continue
      const body = fs.readFileSync(abs, 'utf8')
      if (!body.includes('标尺')) continue
      for (const match of body.matchAll(/\bL[0-9]-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g)) {
        if (/^L[0-9]-L[0-9]$/.test(match[0])) continue // L0-L4 是变更级区间
        if (!scaleIds.has(match[0])) failures.push(`${rel} 引用不存在的行 ID ${match[0]}`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})

describe('v3 删列后不得残留旧列名', () => {
  const skillsRoot = path.join(__dirname, '..', 'skills')
  // v2 的 11 列：status / gate / confidence / stability / legacy / 打破条件 / consumer，
  // 以及已退役的匿名样本编号 S1–S5 与证据台账编号 EV-。
  // v3 只留 id｜项｜参考｜口径／说明｜强度 五列。任何文件再要求「标 status/gate」或
  // 「摘录打破条件列」，都是指向不存在的列——模型照读只会编造出一列不存在的判据。
  const staleColumns: ReadonlyArray<{ name: string; re: RegExp }> = [
    { name: 'status/gate 两列已删，改用强度档', re: /status\s*\/\s*gate|status\/gate/ },
    { name: 'gate 列已删，改用强度档', re: /gate:\s*(true|false)/ },
    { name: '「打破条件」列已删，并入「口径／说明」', re: /打破条件[」\]]?列|「打破条件」/ },
    { name: 'confidence/stability/legacy/partial 已删', re: /partial|confidence\s*列|stability\s*列|legacy\s*列/ },
    { name: 'consumer 列已删', re: /consumer\s*列|consumer\s*:/ },
    { name: '匿名样本编号已退役', re: /样本\s*S[1-5]|S[1-5]\s*型/ },
    { name: '证据台账编号已退役', re: /EV-\d/ },
  ]
  const consumers = [
    'novel-review/SKILL.md',
    'novel-review/agents/节奏与张力审读.md',
    'novel-design/SKILL.md',
    'novel-design/agents/作家评审.md',
    'novel-design/agents/读者评审.md',
    'novel-design/references/本书节奏基线.md',
  ]

  it('消费标尺的文件不得要求不存在的列', () => {
    for (const rel of consumers) {
      const body = fs.readFileSync(path.join(skillsRoot, rel), 'utf8')
      for (const { name, re } of staleColumns) {
        const hit = body.match(re)
        expect(hit, `${rel}: ${name}（命中：${hit?.[0] ?? ''}）`).toBeNull()
      }
    }
  })

  it('消费标尺的文件引用的每个行 ID 都真实存在', () => {
    const ids = new Set(rows.map((r) => r.id))
    for (const rel of consumers) {
      const body = fs.readFileSync(path.join(skillsRoot, rel), 'utf8')
      // L0-L4 是变更级区间不是标尺行 ID，排除；其余 L 开头编号必须能在表里找到
      for (const match of body.matchAll(/\bL[0-9]-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g)) {
        if (/^L[0-9]-L[0-9]$/.test(match[0])) continue
        expect(ids, `${rel} 引用了不存在的行 ID ${match[0]}`).toContain(match[0])
      }
    }
  })
})

describe('幕纲十一项检查接线：L2-ACT 每行都有消费位', () => {
  const skills = path.join(__dirname, '..', 'skills')
  const read = (rel: string) => fs.readFileSync(path.join(skills, rel), 'utf8')
  const actIds = rows.map((r) => r.id).filter((id) => id.startsWith('L2-ACT'))

  it('L2-ACT 行齐全：族入口＋两级幕长＋九项幕内检查', () => {
    expect(actIds).toEqual([
      'L2-ACT-01', 'L2-ACT-01A', 'L2-ACT-01B',
      'L2-ACT-02', 'L2-ACT-03', 'L2-ACT-04', 'L2-ACT-05', 'L2-ACT-06',
      'L2-ACT-07', 'L2-ACT-08', 'L2-ACT-09', 'L2-ACT-10', 'L2-ACT-11',
    ])
  })

  it('幕纲固定段规格是一切幕级判据的唯一接线点，逐行点名', () => {
    const memo = read('novel-arcplan/templates/幕纲固定段规格.md')
    // 01 是族入口、01A 是卷/部级单位，产品口径只取 01B；
    // 02~11 必须在幕纲规格内被逐项点名，否则就是「写进标尺但没人查」。
    for (const id of actIds.filter((id) => !['L2-ACT-01', 'L2-ACT-01A'].includes(id))) {
      expect(memo, `幕纲规格应点名 ${id}`).toContain(id)
    }
    expect(memo, '说明取 01B 不取 01A').toContain('取 01B 不取 01A')
  })

  it('幕长单源：标尺只有 L2-ACT-01B，不再有并行的「幕」行', () => {
    // L2-A4-05 曾与 ACT-01B 同指幕长且数值更窄（10–30 章 vs 中位 25/13–50），已删。
    expect(rows.map((r) => r.id), '不得再有重复的幕长行').not.toContain('L2-A4-05')
    expect(text, '幕长数值只留 ACT-01B 一处').not.toContain('一幕约 10–30 章')
  })

  it('评审侧与 arcplan 侧不再指向已删行', () => {
    for (const rel of [
      'novel-arcplan/SKILL.md',
      'novel-design/agents/作家评审.md',
      'novel-arcplan/templates/卷纲固定段规格.md',
      'novel-design/templates/步骤卡-分卷.md',
    ]) {
      const body = read(rel)
      expect(body, `${rel} 不应指向已删的 L2-A4-05`).not.toContain('L2-A4-05')
      expect(body, `${rel} 不应指向已删的章末钩型配比行`).not.toContain('「章末钩型配比」行')
    }
  })
})

describe('fixed-docs 预算', () => {
  it('计入文件合计不超过绝对上限', async () => {
    const module = await import('../../../scripts/benchmarks/fixed-docs.mjs')
    const measured = module.measureFixedDocs()
    // 0.0.87 起口径改为绝对上限：原「相对历史峰值降 20%」已用尽，余额只剩个位数，
    // 导致每次改动都要先删有效判据才能塞新内容。上限仍是硬约束，只是不再随基数漂移。
    expect(measured.cap, '脚本应导出绝对上限 cap').toBeTypeOf('number')
    expect(measured.total, `fixed-docs 合计 ${measured.total} 应 ≤ ${measured.cap}`).toBeLessThanOrEqual(measured.cap)
    expect(measured.ok, 'fixed-docs 预算应达标').toBe(true)
    expect(measured.reduction, '降幅应仍 ≥15%（不得退回历史峰值）').toBeGreaterThanOrEqual(0.15)
  })
})
