import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 参考标尺通用四层（票 02）。
 *
 * 这组测试守的是分层契约，不是具体校准值：
 * 1. 标尺只服务中文长篇连载网文，L0/L1 只在该范围内称通用，不称“所有小说通用”；
 * 2. L0 全定性、无阿拉伯数字；
 * 3. 每行 schema 完整（id/行名/口径/consumer/status/confidence/stability/gate/legacy）；
 * 4. 全文无待补充占位：不出现【待校准】/unverified/experimental/low；
 * 5. L0 全 invariant；L1 口径稳定、n≥4、无冲突为 stable，partial/证据不足为 provisional；L2 默认 provisional，幕级仅下限/存在性可 stable；stable 不等于 gate:true；
 * 6. 旧行名在标尺内至少保留一个精确表格单元，消费点不断链；
 * 7. 标尺不出现具体书名/角色名。
 */

const SCALE_PATH = path.join(__dirname, '..', 'skills', 'novel-design', 'references', '参考标尺.md')
const STATUS = new Set(['hard', 'range', 'qualitative'])
const CONFIDENCE = new Set(['high', 'partial'])
const STABILITY = new Set(['stable', 'provisional', 'invariant'])
const GATE = new Set(['true', 'false'])
/** 幕级只有“下限／存在性”子句可 stable；同行区间仍 provisional（票 03）。 */
const STABLE_ACT = new Set(['L2-ACT-07', 'L2-ACT-10'])
const expectedStability = (id: string): string => (STABLE_ACT.has(id) ? 'stable' : 'provisional')

type Row = {
  readonly line: number
  readonly id: string
  readonly layer: 'L0' | 'L1' | 'L2' | 'L3'
  readonly cells: readonly string[]
  readonly status: string
  readonly confidence: string
  readonly stability: string
  readonly gate: string
  readonly legacy: string
}

function cellsOf(line: string): string[] {
  const parts = line.split('|')
  // 去掉首尾空段（表格行以 | 开头/结尾）
  return parts.slice(1, -1).map((s) => s.trim())
}

function parseRows(text: string): Row[] {
  const rows: Row[] = []
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    const id = /^\|\s*(L[0-3]-[A-Za-z0-9-]+)\s*\|/.exec(line)?.[1]
    if (id === undefined) continue
    const cells = cellsOf(line)
    const layer = id.slice(0, 2) as Row['layer']
    const isL0L1 = layer === 'L0' || layer === 'L1'
    const expected = isL0L1 ? 10 : 9
    // schema 完整性由此断言兜底：列数不对时给出行号，便于定位
    expect(cells.length, `第 ${i + 1} 行 ${id}: 表格列数应为 ${expected}`).toBe(expected)
    if (isL0L1) {
      rows.push({
        line: i + 1,
        id,
        layer,
        cells,
        status: cells[5]!,
        confidence: cells[6]!,
        stability: cells[7]!,
        gate: cells[8]!,
        legacy: cells[9]!,
      })
    } else {
      rows.push({
        line: i + 1,
        id,
        layer,
        cells,
        status: cells[4]!,
        confidence: cells[5]!,
        stability: cells[6]!,
        gate: cells[7]!,
        legacy: cells[8]!,
      })
    }
  }
  return rows
}

const text = fs.readFileSync(SCALE_PATH, 'utf8')
const rows = parseRows(text)

function layerRows(layer: Row['layer']): Row[] {
  return rows.filter((r) => r.layer === layer)
}

function rowById(id: string): Row {
  const row = rows.find((r) => r.id === id)
  expect(row, `缺少标尺行 ${id}`).toBeDefined()
  return row!
}

function hasExactCell(value: string): boolean {
  return text.split(/\r?\n/).some((line) => line.startsWith('|') && cellsOf(line).includes(value))
}

describe('参考标尺通用四层（票 02）', () => {
  it('四层行数与 schema 完整：L0 18 条、L1 22 条、L2 八轴＋幕级、L3 八项', () => {
    expect(layerRows('L0')).toHaveLength(18)
    expect(layerRows('L1')).toHaveLength(22)
    expect(layerRows('L3')).toHaveLength(8)
    expect(layerRows('L2')).toHaveLength(53)

    const axisRows = layerRows('L2').filter((r) => r.id.startsWith('L2-AX-'))
    expect(axisRows).toHaveLength(8)
    expect(axisRows.map((r) => r.cells[1]!.slice(0, 2))).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'])
    expect(layerRows('L2').filter((r) => !r.id.startsWith('L2-AX-')).length).toBeGreaterThan(0)

    const actRows = layerRows('L2').filter((r) => r.id.startsWith('L2-ACT-'))
    expect(actRows, '幕级标尺应为 11 项 13 行（幕长拆 A/B 两级）').toHaveLength(13)
    expect(actRows.map((r) => r.id)).toEqual([
      'L2-ACT-01', 'L2-ACT-01A', 'L2-ACT-01B',
      'L2-ACT-02', 'L2-ACT-03', 'L2-ACT-04', 'L2-ACT-05', 'L2-ACT-06',
      'L2-ACT-07', 'L2-ACT-08', 'L2-ACT-09', 'L2-ACT-10', 'L2-ACT-11',
    ])
    for (const row of actRows) {
      expect(row.cells[1], `${row.id}: 幕级行应标经验候选`).toContain('经验候选')
      expect(['range', 'qualitative'], `${row.id}: 幕级行只可用 range/qualitative`).toContain(row.status)
      expect(row.confidence, `${row.id}: 幕级行为经验候选，confidence 应为 partial`).toBe('partial')
      expect(row.stability, `${row.id}: 除 ACT-07/10 的下限/存在性外，幕级行 stability 应为 provisional`).toBe(expectedStability(row.id))
      expect(row.gate, `${row.id}: 幕级行不得 gate:true`).toBe('false')
    }

    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size, '行 id 不得重复').toBe(ids.length)

    for (const row of rows) {
      for (const [index, cell] of row.cells.entries()) {
        expect(cell.length, `${row.id} 第 ${index + 1} 列不得为空`).toBeGreaterThan(0)
      }
      expect(STATUS.has(row.status), `${row.id}: status「${row.status}」非法`).toBe(true)
      expect(CONFIDENCE.has(row.confidence), `${row.id}: confidence「${row.confidence}」非法`).toBe(true)
      expect(STABILITY.has(row.stability), `${row.id}: stability「${row.stability}」非法`).toBe(true)
      expect(GATE.has(row.gate), `${row.id}: gate「${row.gate}」非法`).toBe(true)
      expect(row.legacy.length, `${row.id}: legacy 不得为空（无旧行名写 —）`).toBeGreaterThan(0)
    }
  })

  it('stability 身份：L0 全 invariant、L1 按证据分 stable/provisional、L2 默认 provisional（幕级仅下限/存在性 stable）、L3 本书内 stable', () => {
    expect(text, 'schema 应写明 stability 字段').toContain('`stability`')
    for (const marker of ['`invariant`', '`stable`', '`provisional`']) {
      expect(text, `schema 应解释 ${marker}`).toContain(marker)
    }

    for (const row of layerRows('L0')) {
      expect(row.stability, `${row.id}: L0 行必须是 invariant`).toBe('invariant')
    }

    const stableL1 = new Set([
      'L1-01', 'L1-02', 'L1-04', 'L1-06', 'L1-06A', 'L1-06B', 'L1-07', 'L1-12',
    ])
    for (const row of layerRows('L1')) {
      const expected = stableL1.has(row.id) ? 'stable' : 'provisional'
      expect(row.stability, `${row.id}: L1 应按 n≥4/无冲突标 stable，partial/证据不足标 provisional`).toBe(expected)
      if (row.stability === 'provisional') {
        expect(row.confidence, `${row.id}: provisional 行不应伪装高置信`).toBe('partial')
      }
    }

    for (const row of layerRows('L2')) {
      expect(row.stability, `${row.id}: L2 默认 provisional；仅 ACT-07/10 的下限/存在性可 stable`).toBe(expectedStability(row.id))
    }
    for (const row of layerRows('L3')) {
      expect(row.stability, `${row.id}: L3 本书覆盖为本书内稳定基线`).toBe('stable')
    }
  })

  it('L1-06 拆为三行：主线数、支线数、成长弧段数，旧复合别名与旧 ID 保留', () => {
    const main = rowById('L1-06')
    const sub = rowById('L1-06A')
    const growth = rowById('L1-06B')

    expect(main.cells[1], 'L1-06 应为主线数').toContain('主线')
    expect(main.cells[2], '主线数应保留 1–2 条').toContain('1–2')
    expect(sub.cells[1], 'L1-06A 应为支线数').toContain('支线')
    expect(sub.cells[2], '支线数应保留 3–8 条').toContain('3–8')
    expect(growth.cells[1], 'L1-06B 应为成长弧段数').toContain('成长弧')
    expect(growth.cells[2], '成长弧应保留 3–6 段').toContain('3–6')

    for (const row of [main, sub, growth]) {
      expect(row.stability, `${row.id}: 拆行后各自为 stable`).toBe('stable')
      expect(row.confidence, `${row.id}: 拆行后各自为 high`).toBe('high')
      expect(row.gate, `${row.id}: 拆行后各自保留 gate:true`).toBe('true')
      expect(row.cells.join(''), `${row.id}: 拆行后不得再含复合区间`).not.toMatch(/1–2 主线＋3–8 线/)
    }

    // 旧复合行名与三个旧行名都留在索引，旧 ID 仍指向主线数
    expect(text, '旧复合行名应保留在旧行名索引').toContain('| 主线／支线／成长弧 |')
    expect(text, '旧行名→新 ID 映射应写明').toContain('旧行名→新 ID')
    expect(text, '旧 ID 兼容说明应保留').toContain('旧 ID L1-06 继续指向主线数')
    expect(text, '支线口径说明不得在拆行中丢失').toContain('4＝在用支线口径，含 1 弃线则 5-6')
    expect(text, '情感线计第二主线的口径不得丢失').toContain('情感线可计第二主线')
  })

  it('L1-12 与 L2-A2-01 去重：方向在 L1，倍率数值单源在 L2', () => {
    const direction = rowById('L1-12')
    const multiplier = rowById('L2-A2-01')

    expect(direction.cells.join(''), 'L1-12 不得再含具体倍率数值').not.toMatch(/[0-9]+(?:\.[0-9]+)?\s*倍/)
    expect(direction.cells.join(''), 'L1-12 应指到倍率单源行').toContain('L2-A2-01')
    expect(direction.cells.join(''), 'L1-12 应写明单源').toContain('单源')
    expect(direction.stability, 'L1-12 方向口径稳定').toBe('stable')
    expect(direction.gate, 'L1-12 只判方向、无统一倍率，不 gate').toBe('false')

    expect(multiplier.cells.join(''), 'L2-A2-01 应保留倍率数值').toContain('3.5 倍')
    expect(multiplier.cells.join(''), 'L2-A2-01 应保留峰值区间').toContain('2-5 倍')
    expect(multiplier.cells.join(''), 'L2-A2-01 应声明倍率数值单源').toContain('倍率数值单源在本行')
    expect(multiplier.gate, 'L2 仍不 gate').toBe('false')
  })

  it('L1-03 的 S6 反例有明确处理：降 partial 且不 gate，不伪装通用高置信', () => {
    const row = rowById('L1-03')
    expect(row.confidence, 'L1-03 应明确降为 partial').toBe('partial')
    expect(row.stability, 'L1-03 应为 provisional').toBe('provisional')
    expect(row.gate, 'L1-03 不得继续保持 gate:true').toBe('false')
    expect(row.cells.join(''), 'L1-03 应点名 S6 反例').toContain('S6')
    expect(row.cells.join(''), 'L1-03 应给出 S6 抽样数值').toContain('63%')
    expect(row.cells.join(''), 'L1-03 应把功能不变量指回 L0-02').toContain('L0-02')
  })

  it('L2-A8-07 弱密度：删掉密度区间、降 provisional，不得像稳定密度', () => {
    const row = rowById('L2-A8-07')
    expect(row.stability, 'L2-A8-07 应为 provisional').toBe('provisional')
    expect(row.confidence, 'L2-A8-07 应保持 partial').toBe('partial')
    expect(row.gate, 'L2-A8-07 不得 gate').toBe('false')
    const joined = row.cells.join('|')
    expect(joined, 'L2-A8-07 不得保留 6–21/百万 的密度区间').not.toMatch(/[0-9]+\s*[-–~]\s*[0-9]+\s*\/\s*百万/)
    expect(joined, 'L2-A8-07 不得保留旧区间').not.toContain('6–21')
    expect(joined, 'L2-A8-07 不得保留旧区间（半角）').not.toContain('6-21')
    expect(joined, 'L2-A8-07 应明确不得当稳定密度').toContain('不得当稳定密度')
    expect(joined, 'L2-A8-07 应指回功能矩阵').toContain('功能矩阵')
  })

  it('定位：标题与适用范围为中文长篇连载网文，不称所有小说通用', () => {
    expect(text).toMatch(/^# 网文结构参考标尺$/m)
    expect(text).toContain('中文长篇连载网文')
    expect(text).toContain('章回体、连载更新、类型叙事')
    expect(text).toContain('不宣称“所有小说通用”')
    expect(text).toContain('本适用范围内')
    expect(text).toContain('短篇／中篇')
    expect(text).toContain('纯文学')
  })

  it('去外挂包：无题材包／题材修正表与题材数值修正，长度换算参考只留 L3 粗算', () => {
    for (const banned of ['题材包', '题材修正', '玄幻', '都市', '女频', '打脸频率', '旧取数速查']) {
      expect(text, `参考标尺不应保留外挂包标记「${banned}」`).not.toContain(banned)
    }
    for (const banned of ['100 万字·默认', '200 万字·默认', '300 万字·默认', '500 万字·默认', '200 万字·玄幻', '200 万字·都市', '100 万字·都市']) {
      expect(text, `参考标尺不应保留旧速查算例「${banned}」`).not.toContain(banned)
    }
    expect(text).not.toMatch(/[+＋]\s*1\s*层|[-－]\s*1\s*层/)
    expect(text).not.toMatch(/地图\s*[×x]\s*1\.\d|打脸频率\s*[×x]/)
    expect(text, '衰减系数如保留只能叫长度换算参考').toContain('长度换算参考（L3，不 gate）')
    expect(text).not.toContain('题材修正系数')
  })

  it('无待补充占位：不出现【待校准】/unverified/experimental/low', () => {
    for (const marker of ['【待校准】', 'unverified', 'experimental', '【未验证】', '【低置信】', '待参考标尺校准流程定']) {
      expect(text, `参考标尺不应残留待补充占位「${marker}」`).not.toContain(marker)
    }
    expect(rows.every((row) => STATUS.has(row.status))).toBe(true)
    expect(rows.every((row) => CONFIDENCE.has(row.confidence))).toBe(true)
  })

  it('幕纲六段到幕级行的映射在位，检查表不写成硬性配额', () => {
    expect(text).toContain('幕纲六段')
    expect(text).toContain('| 幕纲六段 | 对应幕级行 | 检查什么 |')
    for (const segment of ['本幕故事', '线与伏笔', '出场人物', '查证清单', '章组排布', '幕末结算']) {
      expect(text, `幕纲六段映射应含「${segment}」`).toContain(segment)
    }
    for (let n = 1; n <= 11; n += 1) {
      expect(text, `幕纲六段映射应引用 L2-ACT-${String(n).padStart(2, '0')}`).toContain(`L2-ACT-${String(n).padStart(2, '0')}`)
    }
    expect(text, '幕纲的幕长取产品单位 B 行').toContain('| 本幕故事 | L2-ACT-01B')
    expect(text, '章组排布取产品单位 B 行').toContain('| 章组排布 | L2-ACT-01B')
    expect(text, '卷/部宏观幕只进卷纲/分卷对照').toContain('L2-ACT-01A 只进卷纲')
    expect(text).toContain('不写成硬性配额')
    expect(text).toContain('章纲层不写死字数')
    expect(text).toContain('章长仍归契约／起草／审读')
  })

  it('幕级标尺有样本区间/明确不可统计：幕长拆两级，ACT-07/10 仅下限/存在性 stable', () => {
    const family = rowById('L2-ACT-01')
    const macro = rowById('L2-ACT-01A')
    const unit = rowById('L2-ACT-01B')

    expect(family.cells.join(''), '族入口应指向宏观幕行').toContain('L2-ACT-01A')
    expect(family.cells.join(''), '族入口应指向产品幕行').toContain('L2-ACT-01B')
    expect(macro.cells.join(''), '卷/部级幕不是幕纲产品单位').toContain('不是幕纲产品单位')
    for (const pinned of ['n=28', '159', '62.7 万', '115–230', '34.6–76.8']) {
      expect(macro.cells.join(''), `宏观幕区间应含「${pinned}」`).toContain(pinned)
    }
    expect(unit.cells.join(''), '卷内单元幕是幕纲产品单位').toContain('幕纲产品单位取本行')
    for (const pinned of ['n=14', '25', '18–29', '13–50', '6.1 万', '4.6–11.0']) {
      expect(unit.cells.join(''), `单元幕区间应含「${pinned}」`).toContain(pinned)
    }
    for (const row of [macro, unit]) {
      expect(row.stability, `${row.id}: 样本量/单编码者不足，不标 stable`).toBe('provisional')
      expect(row.gate, `${row.id}: 幕级不 gate`).toBe('false')
    }

    const act02 = rowById('L2-ACT-02')
    expect(act02.cells.join(''), '结构阶段不是章组配额').toContain('不作章组配额')
    expect(act02.cells.join(''), '不得写成稳定章组数').toContain('不得写成稳定章组数')
    const act03 = rowById('L2-ACT-03')
    expect(act03.cells.join(''), '转折数量区间 1–3').toContain('1–3')
    expect(act03.cells.join(''), '至少一次转折 27/27').toContain('27/27')
    const act04 = rowById('L2-ACT-04')
    expect(act04.cells.join(''), '单元幕高潮位区间').toContain('0.63–0.89')
    expect(act04.cells.join(''), '高潮位中位 0.69').toContain('0.69')
    expect(act04.cells.join(''), '章长峰值不等于高潮位').toContain('章长峰值≠高潮位')
    const act05 = rowById('L2-ACT-05')
    expect(act05.cells.join(''), '承诺/兑现只算主链级').toContain('主链级')
    expect(act05.cells.join(''), '承诺/兑现样本 n=23').toContain('n=23')
    const act06 = rowById('L2-ACT-06')
    expect(act06.cells.join(''), '不强制每幕大揭示').toContain('不强制大揭示')
    const act07 = rowById('L2-ACT-07')
    expect(act07.stability, '压力源仅下限 stable').toBe('stable')
    expect(act07.cells.join(''), '压力源 stable 下限 ≥2 类').toContain('至少两类')
    expect(act07.cells.join(''), '压力源参考区间 4–6').toContain('4–6')
    const act08 = rowById('L2-ACT-08')
    expect(act08.cells.join(''), '关系/状态变化下限 15/15').toContain('15/15')
    expect(act08.cells.join(''), '关系/状态变化数量 2–4').toContain('2–4')
    const act09 = rowById('L2-ACT-09')
    expect(act09.cells.join(''), '“两类”子句不可统计').toContain('该子句不可统计')
    const act10 = rowById('L2-ACT-10')
    expect(act10.stability, '幕末钩仅存在性 stable').toBe('stable')
    expect(act10.cells.join(''), '幕末接口 28/28').toContain('28/28')
    expect(act10.cells.join(''), '钩型配比不可统计').toContain('不可统计')
    const act11 = rowById('L2-ACT-11')
    expect(act11.stability, '相邻幕重复不可统计，不标 stable').toBe('provisional')
    expect(act11.cells.join(''), '不得写成零重复率').toContain('不能写成零重复率')
    expect(act11.cells.join(''), '相邻幕重复只作人工检查').toContain('只作人工检查')
  })

  it('L0 全定性：不变量正文不含阿拉伯数字（ID 除外）', () => {
    for (const row of layerRows('L0')) {
      const definition = row.cells[2]!
      expect(definition, `${row.id}: L0 判定口径不得出现阿拉伯数字`).not.toMatch(/[0-9０-９]/)
    }
  })

  it('门禁规则：L0 全 true；L1 仅高置信稳定行 true；L2 全 false；L3 本书基线 true', () => {
    for (const row of layerRows('L0')) {
      expect(row.gate, `${row.id}: L0 应可 gate:true`).toBe('true')
      expect(row.stability, `${row.id}: L0 身份为 invariant`).toBe('invariant')
    }
    for (const row of layerRows('L1')) {
      if (row.gate === 'true') {
        expect(row.status, `${row.id}: gate:true 的 L1 应为 range/hard`).toMatch(/^(range|hard)$/)
        expect(row.confidence, `${row.id}: gate:true 的 L1 应为高置信`).toBe('high')
        expect(row.stability, `${row.id}: gate:true 的 L1 应为 stable`).toBe('stable')
        expect(row.cells.join(''), `${row.id}: gate:true 的 L1 不得含待校准`).not.toContain('待校准')
      }
      if (row.stability === 'provisional') {
        expect(row.gate, `${row.id}: provisional 行不得 gate:true`).toBe('false')
      }
    }
    for (const row of layerRows('L2')) {
      expect(row.gate, `${row.id}: L2 默认只作对照，不得 gate:true`).toBe('false')
      expect(row.stability, `${row.id}: L2 默认 provisional；仅 ACT-07/10 的下限/存在性可 stable`).toBe(expectedStability(row.id))
    }
    for (const row of layerRows('L3')) {
      expect(row.gate, `${row.id}: L3 本书基线应 gate:true`).toBe('true')
    }
  })

  it('证据纪律：无实验状态／低置信状态，L1 gate:true 行必须高置信且不含待校准', () => {
    expect(rows.some((row) => row.status === 'experimental'), '不应再有 experimental 行').toBe(false)
    expect(rows.some((row) => row.confidence === 'low' || row.confidence === 'unverified'), '不应再有低置信/未验证占位行').toBe(false)
    for (const row of rows) {
      const all = row.cells.join('')
      expect(all, `${row.id}: 行内不得残留待校准`).not.toContain('待校准')
    }
  })

  it('L2 每个值行都带轴键（A1=… 至 A8=…）', () => {
    for (const row of layerRows('L2')) {
      if (row.id.startsWith('L2-AX-')) continue
      expect(row.cells[1], `${row.id}: L2 值行须带轴=值键`).toMatch(/A[1-8]=/)
    }
  })

  it('legacy 覆盖已知旧行名（一旧名一精确表格单元，消费点不断链）', () => {
    const legacyNames = [
      '小爽点间隔', '大爽点间隔', '憋屈剧情上限', '卷内防疲劳', '单元故事体量',
      '单元循环节拍', '前传章型·篇幅曲线', '单卷体量', '终卷通胀律', '第一个大高潮位置',
      '每章字数', '续航线容量参考', '反派层级', '反派层级↔存活周期映射', '金手指台阶',
      '主线', '主角成长弧', '主线／支线／成长弧', '主要人物', '升级点', '幕', '小反派', '中反派', '大地图',
      '支线', '关键事件', '伏笔密度', '势力与组织', '核心谜团与悬念线', '章末钩子',
      '章末钩型配比', '爽点铺垫', '伏笔债务', '换图前 10 章', '换图 SOP', '升级间隔',
      '三线断档红线', '幕内分批出细纲', '信息释放分级', '伏笔三段保温（原伏笔债务）',
      '取数速查表', '衰减系数',
      '幕长', '幕内章组', '幕内转折', '幕内高潮位', '幕内承诺兑现', '幕内大揭示',
      '幕内压力源', '幕内状态变化', '幕内场域变化', '幕末钩', '相邻幕重复',
    ]
    const missing = legacyNames.filter((name) => !hasExactCell(name))
    expect(missing, `以下旧行名在参考标尺中无精确表格单元：${missing.join('、')}`).toEqual([])
  })

  it('L3 说明写明本书基线优先与通用行只做离群预警', () => {
    expect(text).toContain('本书基线')
    expect(text).toContain('离群预警')
    expect(text).toContain('以本书自报为先')
  })

  it('世界复杂度层：压力源七类、社会接口、空间移动、背景事件、善后均有 L0–L2 定位', () => {
    const byId = new Map(rows.map((r) => [r.id, r]))
    const definition = (id: string): string => {
      const row = byId.get(id)
      expect(row, `缺少世界复杂度行 ${id}`).toBeDefined()
      return row!.cells[2]!
    }

    const pressure = definition('L0-03')
    for (const source of ['人', '制度', '资源', '自然', '时间', '关系', '自我']) {
      expect(pressure, `L0-03 应含压力源「${source}」`).toContain(source)
    }
    expect(pressure).toContain('不以反派数量代替')

    const interfaces = definition('L0-15')
    for (const iface of ['市井', '官府', '军队', '宗门', '商队', '教会', '家族', '江湖']) {
      expect(interfaces, `L0-15 应含社会接口「${iface}」`).toContain(iface)
    }

    const movement = definition('L0-16')
    expect(movement, '物理移动不是通用必需，接口／压力源变化才是').toContain('物理移动不是通用必需')
    for (const mode of ['驻地变化', '赶路', '逃亡', '远征', '换图']) {
      expect(movement, `L0-16 应含移动形态「${mode}」`).toContain(mode)
    }

    const background = definition('L0-17')
    for (const event of ['战争', '灾荒', '政变', '节日', '瘟疫', '物价', '门派内斗']) {
      expect(background, `L0-17 应含背景事件「${event}」`).toContain(event)
    }

    const aftermath = definition('L0-18')
    for (const question of ['谁看见', '谁传开', '谁追责', '谁收尸', '谁得利']) {
      expect(aftermath, `L0-18 应含善后五问「${question}」`).toContain(question)
    }

    for (const id of ['L1-18', 'L1-19', 'L1-20']) {
      expect(byId.has(id), `缺少世界复杂度 L1 行 ${id}`).toBe(true)
    }
    const worldRows = layerRows('L2').filter((r) => r.id.startsWith('L2-WC-'))
    expect(worldRows, 'L2 世界复杂度形态档应有五条').toHaveLength(5)
    for (const row of worldRows) expect(row.cells[1], `${row.id}: 须带轴=值键`).toMatch(/A[1-8]=/)

    for (const id of ['L0-03', 'L0-15', 'L0-16', 'L0-17', 'L0-18']) {
      expect(byId.get(id)!.gate, `${id}: 世界复杂度 L0 应可 gate:true`).toBe('true')
    }
    for (const row of [...layerRows('L1').filter((r) => ['L1-18', 'L1-19', 'L1-20'].includes(r.id)), ...worldRows]) {
      expect(row.gate, `${row.id}: 未校准的世界复杂度行不得 gate:true`).toBe('false')
    }
  })

  it('世界复杂度可被设计/卷规划消费：骨架、分卷、体量对账与压力升级段均有短指针', () => {
    const skillRoot = path.join(__dirname, '..', 'skills')
    const design = fs.readFileSync(path.join(skillRoot, 'novel-design', 'SKILL.md'), 'utf8')
    const arcplan = fs.readFileSync(path.join(skillRoot, 'novel-arcplan', 'SKILL.md'), 'utf8')
    const volumeSpec = fs.readFileSync(
      path.join(skillRoot, 'novel-arcplan', 'templates', '卷纲固定段规格.md'),
      'utf8',
    )

    for (const text of [design, arcplan, volumeSpec]) {
      expect(text, '设计/卷规划消费点应点名「世界复杂度」').toContain('世界复杂度')
      expect(text, '消费点应写明不只数反派与地图').toContain('不只数反派与地图')
    }
    for (const question of ['谁看见', '谁传开', '谁追责', '谁收尸', '谁得利']) {
      expect(volumeSpec, `压力升级段应含善后五问「${question}」`).toContain(question)
    }
  })

  it('标尺链路零具体书名/角色名，样本只用匿名编号', () => {
    const blacklist = [
      '大奉打更人', '大奉',
      '诡秘之主', '诡秘',
      '我真没想重生啊', '重生啊',
      '绍宋', '十日终焉', '十日',
      '斗破苍穹', '斗破',
      '道诡异仙', '道诡',
      '魏渊', '罗塞尔', '徐芷溪',
    ]
    for (const name of blacklist) {
      expect(text, `参考标尺不应出现具体书名/角色名「${name}」`).not.toContain(name)
    }
    expect(text).toContain('匿名样本组 S1–S5')
  })
})

/**
 * 功能矩阵与反填充检查（票 04）。
 *
 * 守的是结构判据：
 * 1. 反派/地图场域/事件支线三张矩阵列齐，功能枚举齐；
 * 2. 同层单位在功能/手段/关系/代价中至少两项不同，否则合并/改功能/删；
 * 3. 数量够但功能重复＝结构问题，不为凑标尺加换皮单位；
 * 4. 设计（骨架/分卷/体量对账）、卷幕（卷规划/卷末回看）、作家评审（骨架/分卷/卷纲）均有指针；
 * 5. artifact-contract 登记新 reference；
 * 6. 矩阵件不出现具体书名/角色名。
 */
describe('功能矩阵与反填充检查（票 04）', () => {
  const skillRoot = path.join(__dirname, '..', 'skills')
  const matrixPath = path.join(skillRoot, 'novel-design', 'references', '功能矩阵.md')
  const matrix = fs.readFileSync(matrixPath, 'utf8')

  it('三张矩阵齐全：反派/地图场域/事件支线的列与功能枚举在位', () => {
    expect(fs.existsSync(matrixPath), 'novel-design/references/功能矩阵.md 应存在').toBe(true)

    expect(matrix, '反派矩阵列应齐').toContain('| 层级 | 功能 | 与主角关系 | 出牌手段 | 退场方式 | 不能和谁重复 |')
    for (const fn of ['压迫', '诱惑', '制度', '镜像', '资源', '自然', '时间', '关系', '自我']) {
      expect(matrix, `反派功能枚举应含「${fn}」`).toContain(fn)
    }

    expect(matrix, '场域矩阵列应齐').toContain('| 地图／场域 | 功能 | 进入代价 | 离开后果 | 不能和谁重复 |')
    for (const fn of ['新资源', '新规则', '新社会接口', '新压力源']) {
      expect(matrix, `场域功能枚举应含「${fn}」`).toContain(fn)
    }

    expect(matrix, '事件支线矩阵列应齐').toContain('| 事件／支线 | 功能 | 不可逆结果 | 与主线接口 | 不能和谁重复 |')
    for (const fn of ['升级', '揭示', '关系变化', '资源变化', '世界变化']) {
      expect(matrix, `事件功能枚举应含「${fn}」`).toContain(fn)
    }
  })

  it('同层去重：功能/手段/关系/代价至少两项不同，重复按合并/改功能/删处理', () => {
    expect(matrix).toContain('功能、手段、关系、代价')
    expect(matrix).toContain('至少两项不同')
    expect(matrix, '应写明只换名字/数值/外观不算不同').toContain('只换名字、只换数值、只换外观不算不同')
    for (const action of ['合并', '改功能', '删']) {
      expect(matrix, `重复处理应含「${action}」`).toContain(action)
    }
    expect(matrix, '应写明层可合并不等于功能可省').toContain('层可合并，功能不可缺')
  })

  it('反填充：数量够但功能重复＝结构问题，不为凑标尺加换皮单位', () => {
    expect(matrix).toContain('数量够但功能重复')
    expect(matrix).toContain('结构问题')
    expect(matrix).toContain('反填充')
    expect(matrix).toContain('换皮')
    expect(matrix, '应明确不为凑参考标尺的数量加换皮单位').toContain('不为凑参考标尺的数量加换皮单位')
    expect(matrix, '应写明数量达标不等于结构通过').toContain('数量达标')
  })

  it('设计消费点：骨架/分卷/体量对账各有一处功能矩阵短指针', () => {
    const design = fs.readFileSync(path.join(skillRoot, 'novel-design', 'SKILL.md'), 'utf8')
    expect(design, '骨架段应有功能矩阵指针').toContain('对手梯队、场域与支线再按 [功能矩阵](references/功能矩阵.md)')
    expect(design, '分卷段应有功能矩阵指针').toContain('分卷新增的主战层级、场域与支线按 [功能矩阵](references/功能矩阵.md)')
    expect(design, '体量对账应有功能矩阵指针').toContain('数量达标后再过一道 [功能矩阵](references/功能矩阵.md)')
    const pointers = design.match(/\[功能矩阵\]\(references\/功能矩阵\.md\)/g) ?? []
    expect(pointers.length, 'design 至少三处功能矩阵指针').toBeGreaterThanOrEqual(3)
  })

  it('卷幕消费点：卷规划「功能矩阵核一遍」＋卷末回看', () => {
    const arcplan = fs.readFileSync(path.join(skillRoot, 'novel-arcplan', 'SKILL.md'), 'utf8')
    expect(arcplan).toContain('**功能矩阵核一遍')
    expect(arcplan).toContain('references/功能矩阵.md')
    expect(arcplan, '卷末应能回看单位是否真的带来变化').toContain('卷末回看（功能矩阵）')
    expect(arcplan).toContain('不可逆结果兑现没有')
  })

  it('评审消费点：作家评审骨架/分卷/卷纲各加同层功能重复检查', () => {
    const writer = fs.readFileSync(path.join(skillRoot, 'novel-design', 'agents', '作家评审.md'), 'utf8')
    expect(writer).toContain('`功能矩阵.md`')
    expect(writer, '骨架清单应查同层功能重复').toContain('同层功能重复：对手梯队各层代表对手')
    expect(writer, '分卷清单应查同层功能重复').toContain('逐卷新增主战层级/场域/支线按《功能矩阵》')
    expect(writer, '卷纲清单应查同层功能重复').toContain('同层功能重复（《功能矩阵》；叙事结构×弧线）')
    expect(writer).toContain('数量够不是通过理由')
  })

  it('artifact-contract 登记功能矩阵 reference', () => {
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'skills/novel-design/references/功能矩阵.md'")
  })

  it('矩阵件零具体书名/角色名', () => {
    const blacklist = [
      '大奉打更人', '大奉',
      '诡秘之主', '诡秘',
      '我真没想重生啊', '重生啊',
      '绍宋', '十日终焉', '十日',
      '斗破苍穹', '斗破',
      '道诡异仙', '道诡',
      '魏渊', '罗塞尔', '徐芷溪',
    ]
    for (const name of blacklist) {
      expect(matrix, `功能矩阵不应出现具体书名/角色名「${name}」`).not.toContain(name)
    }
  })
})

/**
 * 本书节奏基线（票 05）。
 *
 * 守的是「外部先验 vs 本书实测」的分工，不是具体数值：
 * 1. 工件属书房资产、非真源、不入书仓 git，路径固定；
 * 2. 八项汇总齐全，每项都写取数口径（定稿章/章摘要/细纲怎么取）；
 * 3. 冷启动前 1–10 章标「样本不足」，不伪造稳定基线；
 * 4. 卷末三件后更新，记样本量/版本/变化/作者确认；
 * 5. 先本书基线再通用标尺：偏离本书基线先解释，偏离标尺只做离群预警；
 * 6. 自报覆盖写覆盖了哪条通用行、理由与作者确认；
 * 7. design/arcplan 各带短指针；审读侧经材料包/任务包带基线摘要，不改 novel-review；
 * 8. artifact-contract 登记新 reference；基线件零具体书名/角色名。
 */
describe('本书节奏基线（票 05）', () => {
  const skillRoot = path.join(__dirname, '..', 'skills')
  const baselinePath = path.join(skillRoot, 'novel-design', 'references', '本书节奏基线.md')
  const baseline = fs.readFileSync(baselinePath, 'utf8')
  const ITEMS = ['章长中位/波动', '钩型配比', '兑现间隔', 'POV 数', '场景数/章', '对话密度', '卷长', '卷内高潮位']

  it('工件路径固定：书房资产、非真源、不入书仓 git', () => {
    expect(fs.existsSync(baselinePath), 'novel-design/references/本书节奏基线.md 应存在').toBe(true)
    expect(baseline, '工件路径应写全').toContain('`<工作范围>/书房/开书/<书名>/节奏基线.md`')
    expect(baseline).toContain('书房资产')
    expect(baseline).toContain('非真源')
    expect(baseline).toContain('不入书仓 git')
    expect(baseline, '写入通道用通用写工具（种子底子先例）').toContain('通用写工具')
    expect(baseline, '书房资产不入真源，不经确认工具、不产生 design: 提交').toContain('不产生 `design:` 提交')
  })

  it('八项汇总齐全，每项都有取数口径与样本门槛', () => {
    expect(baseline, '汇总表应列「项｜记什么｜取数口径｜样本门槛｜覆盖的通用行」').toContain(
      '| 项 | 记什么 | 取数口径 | 样本门槛 | 覆盖的通用行 |',
    )
    const rows = baseline
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line) => ITEMS.some((item) => line.startsWith(`| ${item} |`)))
    expect(rows, `八项汇总行应各有一行：缺 ${ITEMS.length - rows.length} 项`).toHaveLength(ITEMS.length)
    for (const [index, row] of rows.entries()) {
      expect(row.split('|').length, `${ITEMS[index]}: 汇总行列数不得少`).toBeGreaterThanOrEqual(6)
      expect(row, `${ITEMS[index]}: 应带样本门槛（≥）`).toContain('≥')
    }
    const joined = rows.join('\n')
    for (const ref of ['L3-02', 'L3-03', 'L3-04', 'L3-05']) {
      expect(joined, `汇总项应回指《参考标尺》${ref}`).toContain(ref)
    }
    for (const source of ['定稿/卷', '章摘要', '章细纲', '章末双钩', '账本/承诺.md']) {
      expect(baseline, `取数口径应点名来源「${source}」`).toContain(source)
    }
    expect(baseline, '写清分母口径（章数还是钩数）').toContain('分母')
  })

  it('冷启动：前 1–10 章标「样本不足」，不伪造稳定基线', () => {
    expect(baseline).toContain('前 1–10 章')
    expect(baseline).toContain('样本不足')
    expect(baseline).toContain('不伪造稳定基线')
    expect(baseline, '1–9 章应有明确状态').toContain('1–9 章')
    expect(baseline, '样本不足是合法状态，不阻断流程').toContain('合法状态')
    expect(baseline, '样本门槛表应列「能写什么」').toContain('| 样本量 | 状态 | 能写什么 |')
  })

  it('卷末更新：卷末三件后更新，记录样本量/版本/变化', () => {
    expect(baseline).toContain('卷末三件')
    expect(baseline).toContain('不逐章更新')
    for (const field of ['样本量', '版本', '变化', '作者确认']) {
      expect(baseline, `更新记录应含「${field}」`).toContain(field)
    }
    expect(baseline).toContain('变更记录')
    expect(baseline, '只增不改：旧版本行保留').toContain('只增不改')
    expect(baseline, '口径变更须标明，不跨口径比数').toContain('口径变更')
  })

  it('本书优先：先本书基线再通用标尺，偏离先解释、标尺只做离群预警', () => {
    expect(baseline).toContain('先本书基线')
    expect(baseline).toContain('再通用参考标尺')
    expect(baseline).toContain('先解释')
    expect(baseline).toContain('离群预警')
    expect(baseline, '离群预警不拦卡').toContain('不拦卡')
    for (const consumer of ['设计', '卷幕', '细纲', '审读']) {
      expect(baseline, `消费位应覆盖「${consumer}」`).toContain(consumer)
    }
  })

  it('自报覆盖：写清覆盖了哪条通用行、理由与作者确认，L0 与硬红线不覆盖', () => {
    expect(baseline).toContain('自报覆盖')
    expect(baseline).toContain('理由')
    expect(baseline).toContain('作者确认')
    expect(baseline).toContain('L3-07')
    expect(baseline).toContain('L3-08')
    expect(baseline).toContain('硬红线')
    expect(baseline, 'L0 通用不变量一律不覆盖').toContain('L0 通用不变量一律不覆盖')
    expect(baseline, '覆盖记录表列式应在位').toContain('| 覆盖项 | 覆盖的通用行 | 本书基线值（含样本量） | 理由 | 作者确认 | 状态 |')
  })

  it('消费接线：design/arcplan 短指针；审读侧经材料包/任务包带摘要，不改 novel-review', () => {
    const design = fs.readFileSync(path.join(skillRoot, 'novel-design', 'SKILL.md'), 'utf8')
    expect(design, 'design 应有新 reference 短指针').toContain('[本书节奏基线](references/本书节奏基线.md)')
    expect(design, 'design 应写清先本书基线再通用标尺').toContain('先对本书基线')
    expect(design, 'design 工件契约应登记节奏基线工件').toContain('| 节奏基线 |')
    expect(design).toContain('`<工作范围>/书房/开书/<书名>/节奏基线.md`')
    expect(design, '工件契约应写明卷末三件后更新').toContain('卷末三件后更新')

    const arcplan = fs.readFileSync(path.join(skillRoot, 'novel-arcplan', 'SKILL.md'), 'utf8')
    expect(arcplan, 'arcplan 卷末应指到基线件').toContain('references/本书节奏基线.md')
    expect(arcplan, 'arcplan 应写清卷末三件后更新').toContain('本书节奏基线更新')
    expect(arcplan, '审读侧经派发材料携带基线摘要').toContain('本书基线摘要')
    expect(arcplan).toContain('材料包/任务包')
    expect(arcplan, '审读底本与派发模板不动').toContain('不改审读底本')

    const review = fs.readFileSync(path.join(skillRoot, 'novel-review', 'SKILL.md'), 'utf8')
    expect(review, '审读侧不经派发模板内联（fixed-docs 计入文件不改）').not.toContain('本书节奏基线')
    expect(review, '审读派发材料口径保持原样').toContain('分档参考区间动态摘录')

    const fixedDocs = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'scripts', 'benchmarks', 'fixed-docs.mjs'),
      'utf8',
    )
    expect(fixedDocs, '新 reference 不进 fixed-docs 预算').not.toContain('本书节奏基线')
  })

  it('artifact-contract 登记本书节奏基线 reference', () => {
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'skills/novel-design/references/本书节奏基线.md'")
  })

  it('基线件零具体书名/角色名，书名一律用 <书名> 占位', () => {
    const blacklist = [
      '大奉打更人', '大奉',
      '诡秘之主', '诡秘',
      '我真没想重生啊', '重生啊',
      '绍宋', '十日终焉', '十日',
      '斗破苍穹', '斗破',
      '道诡异仙', '道诡',
      '魏渊', '罗塞尔', '徐芷溪',
    ]
    for (const name of blacklist) {
      expect(baseline, `本书节奏基线不应出现具体书名/角色名「${name}」`).not.toContain(name)
    }
    expect(baseline).toContain('<书名>')
  })
})

/**
 * 直接消费点接线（票 06）。
 *
 * 守的是「行 ID＋状态」消费契约，不是具体数值：
 * 1. 标尺内旧行名→新 ID 映射在位，映射与旧行名均可检索；
 * 2. 设计/卷幕/细纲/审读/作家评审只引用存在的行 ID，无悬空引用；
 * 3. 消费点不内联章数/字数/间隔等标尺数值，改按行 ID 取数（示例行与对象实况白名单）；
 * 4. 旧行名保留兼容，本书契约/作者自报优先口径仍在；
 * 5. fixed-docs 计入文件合计不超预算线。
 */
describe('参考标尺直接消费点接线（票 06）', () => {
  const skillRoot = path.join(__dirname, '..', 'skills')
  const CONSUMERS = [
    { rel: 'novel-design/SKILL.md', role: '设计' },
    { rel: 'novel-arcplan/SKILL.md', role: '卷幕' },
    { rel: 'novel-outline/SKILL.md', role: '细纲' },
    { rel: 'novel-review/SKILL.md', role: '审读' },
    { rel: 'novel-design/agents/作家评审.md', role: '作家评审' },
  ] as const
  const consumerText = new Map(
    CONSUMERS.map((consumer) => [consumer.rel, fs.readFileSync(path.join(skillRoot, consumer.rel), 'utf8')]),
  )
  const byId = new Map(rows.map((row) => [row.id, row]))
  const ID_ANY = /L[0-3]-(?=[0-9A])[A-Za-z0-9-]+/
  const ID_ALL = /L[0-3]-(?=[0-9A])[A-Za-z0-9-]+/g

  const legacySection = text.slice(text.indexOf('## 六、旧行名索引'))
  const legacyIndex = new Map<string, readonly string[]>()
  for (const line of legacySection.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue
    const cells = cellsOf(line)
    if (cells.length < 3 || cells[0] === '旧行名' || cells[0]!.startsWith('---')) continue
    const ids = [...cells[2]!.matchAll(/L[0-3]-[A-Za-z0-9-]+/g)].map((match) => match[0]!)
    legacyIndex.set(cells[0]!, ids)
  }

  it('旧行名→新 ID 映射在位：索引覆盖关键旧行名，映射 ID 全部存在', () => {
    expect(legacyIndex.size, '旧行名索引应至少 40 行').toBeGreaterThanOrEqual(40)
    expect(text, '索引应写明旧行名→新 ID 映射').toContain('旧行名→新 ID')
    for (const [name, ids] of legacyIndex) {
      expect(hasExactCell(name), `旧行名「${name}」应在标尺表格中可精确检索`).toBe(true)
      if (ids.length === 0) continue
      for (const id of ids) {
        expect(byId.has(id), `旧行名「${name}」映射到不存在的行 ID「${id}」`).toBe(true)
      }
    }
    for (const name of [
      '每章字数', '单卷体量', '大爽点间隔', '小爽点间隔', '章末钩型配比', '幕',
      '三线断档红线', '幕内分批出细纲', '卷内防疲劳', '反派层级', '反派层级↔存活周期映射',
      '换图 SOP', '第一个大高潮位置', '信息释放分级',
    ]) {
      expect(legacyIndex.has(name), `旧行名索引应含「${name}」`).toBe(true)
      expect(legacyIndex.get(name)!.length, `旧行名「${name}」应映射到至少一个行 ID`).toBeGreaterThan(0)
    }
  })

  it('L1-06 拆行后旧别名仍可检索：主线→L1-06、支线→L1-06A、成长弧→L1-06B，复合名映射三行', () => {
    expect(legacyIndex.get('主线'), '旧行名「主线」应仍映射到 L1-06').toContain('L1-06')
    expect(legacyIndex.get('支线'), '旧行名「支线」应映射到 L1-06A').toContain('L1-06A')
    expect(legacyIndex.get('主角成长弧'), '旧行名「主角成长弧」应映射到 L1-06B').toContain('L1-06B')
    expect(legacyIndex.get('主线／支线／成长弧'), '旧复合行名应同时映射三行').toEqual(
      expect.arrayContaining(['L1-06', 'L1-06A', 'L1-06B']),
    )
  })

  it('行内 legacy 旧名全部可回索引：无孤立旧名', () => {
    const indexNames = [...legacyIndex.keys()]
    const orphan: string[] = []
    for (const row of rows) {
      if (row.legacy === '—') continue
      for (const part of row.legacy.split(/[、，]/)) {
        const base = part.replace(/（[^）]*）/g, '')
        const covered =
          legacyIndex.has(part) ||
          legacyIndex.has(base) ||
          indexNames.some((candidate) => candidate.startsWith(`${base}（`))
        if (!covered) orphan.push(`${row.id}:${part}`)
      }
    }
    expect(orphan, `以下 legacy 旧名在旧行名索引中查不到：${orphan.join('、')}`).toEqual([])
  })

  it('消费文档引用无悬空行 ID，且五个直接消费点都已接线', () => {
    for (const { rel, role } of CONSUMERS) {
      const body = consumerText.get(rel)!
      const refs = [...new Set([...body.matchAll(ID_ALL)].map((match) => match[0]!))]
      expect(refs.length, `${role}（${rel}）应至少引用一个标尺行 ID`).toBeGreaterThan(0)
      const dangling = refs.filter((id) => !byId.has(id))
      expect(dangling, `${role}（${rel}）引用了不存在的行 ID：${dangling.join('、')}`).toEqual([])
    }
  })

  it('消费点不内联标尺数值：取数行只写行 ID＋旧行名（示例行白名单）', () => {
    const VALUE_PATTERN = /(?:[0-9]+(?:\.[0-9]+)?\s*(?:[-–~]\s*[0-9]+)?\s*(?:章|字|万字|万))|(?:每\s*[0-9]+\s*章)/g
    const WHITELIST = [
      // 参考标尺对照表的示例行：卷03 预算 18 万字是对象实况，不是标尺值
      '| L2-A3-01 单卷体量 | 卷03 预算 18 万字 | ✅ | — |',
    ]
    const violations: string[] = []
    for (const { rel, role } of CONSUMERS) {
      for (const [index, line] of consumerText.get(rel)!.split(/\r?\n/).entries()) {
        if (!line.includes('参考标尺') && !ID_ANY.test(line)) continue
        if (WHITELIST.some((allowed) => line.includes(allowed))) continue
        const hits = line.replace(ID_ALL, '').match(VALUE_PATTERN)
        if (hits !== null) violations.push(`${role} ${rel}:${index + 1}「${hits.join('、')}」`)
      }
    }
    expect(violations, `消费点不得内联章数/字数/间隔数值（改行 ID 取数）：${violations.join('；')}`).toEqual([])
  })

  it('消费点引用格式＝行 ID＋旧行名，旧行名仍可查，本书契约自报优先口径保留', () => {
    const pins: Array<readonly [string, string]> = [
      ['novel-design/SKILL.md', '「L2-A4-01 每章字数」行'],
      ['novel-design/SKILL.md', 'L2-A3-01／L1-11 单卷体量'],
      ['novel-arcplan/SKILL.md', '「L2-A5-01 三线断档红线」行'],
      ['novel-arcplan/SKILL.md', '「L2-A5-04 换图 SOP」行'],
      ['novel-arcplan/SKILL.md', '「L2-A4-05／L1-13 幕」行'],
      ['novel-outline/SKILL.md', '「L2-A4-06 幕内分批出细纲」行'],
      ['novel-review/SKILL.md', 'L2-A4-01 每章字数'],
      ['novel-review/SKILL.md', 'L1-01／L1-02 章级兑现密度与连续无兑现上限'],
      ['novel-review/SKILL.md', 'L2-A1-03／L1-04 章末钩型配比'],
      ['novel-design/agents/作家评审.md', '「L2-A3-01 单卷体量」行'],
      ['novel-design/agents/作家评审.md', '「L2-A5-06 卷内防疲劳」行'],
    ]
    for (const [rel, pin] of pins) {
      expect(consumerText.get(rel), `${rel} 应含消费格式「${pin}」`).toContain(pin)
    }
    for (const name of ['每章字数', '单卷体量', '三线断档红线', '换图 SOP', '幕', '章末钩型配比', '卷内防疲劳', '幕内分批出细纲']) {
      expect(legacyIndex.has(name), `旧行名「${name}」仍应在索引中可查`).toBe(true)
    }
    for (const { rel, role } of CONSUMERS) {
      expect(consumerText.get(rel), `${role} 应保留本书契约/作者自报优先口径`).toMatch(
        /本书自报|契约自报|作者自报|本书契约|本书基线/,
      )
    }
    expect(consumerText.get('novel-review/SKILL.md')).toContain('status/gate')
    expect(consumerText.get('novel-design/agents/作家评审.md')).toContain('status/gate')
  })

  it('fixed-docs 通过：计入文件合计不超过基线 80% 预算线', async () => {
    const module = await import('../../../scripts/benchmarks/fixed-docs.mjs')
    const measured = module.measureFixedDocs()
    const budget = Math.floor(measured.baseline * measured.target)
    expect(measured.total, `fixed-docs 合计 ${measured.total} 应 ≤ ${budget}`).toBeLessThanOrEqual(budget)
    expect(measured.ok, 'fixed-docs 预算应达标').toBe(true)
  })
})

/**
 * 标尺使用日志（票 07）。
 *
 * 守的是「显式决定留痕」的契约，不是每章流水：
 * 1. 工件属书房资产、非真源、不入书仓 git，路径固定；
 * 2. 八个字段齐：日期/卷章、引用行 ID、本书基线值/样本量、决定、理由、作者确认、结果、是否升级变更包；
 * 3. 使用时机覆盖设计/卷幕/细纲/审读，卷末汇总；
 * 4. 只记显式决定/偏离/覆盖/不适用，不记正常按基线写作的每章流水；
 * 5. 与本书节奏基线、L3 自报覆盖、变更包衔接，且本件不改标尺数字；
 * 6. design/arcplan 短指针、artifact-contract 登记、零具体书名。
 */
describe('标尺使用日志（票 07）', () => {
  const skillRoot = path.join(__dirname, '..', 'skills')
  const logPath = path.join(skillRoot, 'novel-design', 'references', '标尺使用日志.md')
  const log = fs.readFileSync(logPath, 'utf8')

  it('工件路径固定：书房资产、非真源、不入书仓 git', () => {
    expect(fs.existsSync(logPath), 'novel-design/references/标尺使用日志.md 应存在').toBe(true)
    expect(log, '工件路径应写全').toContain('`<工作范围>/书房/开书/<书名>/标尺使用日志.md`')
    expect(log).toContain('书房资产')
    expect(log).toContain('非真源')
    expect(log).toContain('不入书仓 git')
    expect(log, '写入通道用通用写工具').toContain('通用写工具')
    expect(log, '书房资产不经确认工具、不产生 design: 提交').toContain('不产生 `design:` 提交')
  })

  it('八字段齐全，决定与结果枚举完整', () => {
    expect(log, '主表字段应按约定顺序齐全').toContain(
      '| 日期/卷章 | 引用的行 ID | 本书基线值/样本量 | 决定 | 理由 | 作者确认 | 结果 | 是否升级为变更包 |',
    )
    for (const decision of ['采用', '偏离', '自报覆盖', '不适用']) {
      expect(log, `决定枚举应含「${decision}」`).toContain(decision)
    }
    expect(log, '决定应写四选一，避免模糊值').toContain('四选一')
    for (const result of ['待观察', '有效', '无效', '反例']) {
      expect(log, `结果枚举应含「${result}」`).toContain(result)
    }
    expect(log, '结果应写四选一').toContain('`待观察`／`有效`／`无效`／`反例`')
    for (const field of ['日期/卷章', '引用的行 ID', '本书基线值/样本量', '作者确认', '理由', '是否升级为变更包']) {
      expect(log, `字段说明应含「${field}」`).toContain(`| ${field} |`)
    }
  })

  it('使用时机覆盖设计/卷幕/细纲/审读，并在卷末汇总', () => {
    expect(log, '触发规则应写明每次显式引用参考标尺就记').toContain('每出现一次显式引用参考标尺的决定，就记一行')
    for (const consumer of ['设计（契约／世界书体量／骨架／分卷／体量对账／确认前审查）', '卷幕（卷规划／分卷核对／幕纲／卷末三件／卷末设定审计）', '细纲（章细纲／写前十查）', '审读（材料包／任务包／报告／复评）']) {
      expect(log, `使用时机应覆盖「${consumer}」`).toContain(consumer)
    }
    expect(log, '卷末应有汇总').toContain('卷末汇总')
    expect(log, '汇总时点应在卷末三件与基线更新之后').toContain('卷末三件落盘、本书节奏基线更新之后')
    expect(log, '汇总表应含计数列').toContain('| 卷 | 采用 | 偏离 | 自报覆盖 | 不适用 |')
  })

  it('不记每章流水：只记显式决定/偏离/覆盖/不适用', () => {
    expect(log).toContain('不记正常按基线写作的每章流水')
    expect(log, '应说明空行不记').toContain('没有显式决定就不写')
    expect(log, '应说明不逐章重抄数值').toContain('不逐章重抄参考标尺数值或本书基线八项')
    expect(log, '应说明复用不重复造行').toContain('复用')
    expect(log, '日志膨胀是明确要防的失败').toContain('日志膨胀')
  })

  it('与本书节奏基线、自报覆盖、变更包衔接，且不改标尺数字', () => {
    expect(log).toContain('本书节奏基线')
    expect(log).toContain('L3-07')
    expect(log).toContain('L3-08')
    expect(log, '覆盖须写样本量').toContain('本书基线值＋样本量')
    expect(log, '变更包应按 L0–L4 定级').toContain('L0–L4')
    expect(log).toContain('是否升级为变更包')
    expect(log, '升级变更包要带编号与主级').toContain('是（变更包 <编号>，主级 Lx）')
    expect(log, '本件不改标尺数字').toContain('不在日志里改《参考标尺》数字')
    expect(log, '日志只留痕不拦卡').toContain('只留痕')
  })

  it('消费接线：design/arcplan 短指针，卷末汇总接在基线更新之后', () => {
    const design = fs.readFileSync(path.join(skillRoot, 'novel-design', 'SKILL.md'), 'utf8')
    const pointers = design.match(/\[标尺使用日志\]\(references\/标尺使用日志\.md\)/g) ?? []
    expect(pointers.length, 'design 至少两处标尺使用日志指针').toBeGreaterThanOrEqual(2)
    expect(design, 'design 应写清只记显式决定、不记流水').toContain('不记正常按基线的每章流水')
    expect(design, 'design 工件契约应登记日志工件').toContain('| 标尺使用日志 |')
    expect(design).toContain('`<工作范围>/书房/开书/<书名>/标尺使用日志.md`')

    const arcplan = fs.readFileSync(path.join(skillRoot, 'novel-arcplan', 'SKILL.md'), 'utf8')
    expect(arcplan, 'arcplan 应指到日志件').toContain('references/标尺使用日志.md')
    expect(arcplan, 'arcplan 卷规划应有使用留痕').toContain('参考标尺使用留痕')
    expect(arcplan, 'arcplan 卷末应有汇总').toContain('参考标尺使用汇总')
    expect(arcplan, 'arcplan 汇总须在基线更新之后').toContain('基线更新之后')
    expect(arcplan, 'arcplan 工件契约应登记日志工件').toContain('| 标尺使用日志 |')

    const fixedDocs = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'scripts', 'benchmarks', 'fixed-docs.mjs'),
      'utf8',
    )
    expect(fixedDocs, '新 reference 不进 fixed-docs 预算').not.toContain('标尺使用日志')
  })

  it('artifact-contract 登记标尺使用日志 reference', () => {
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'skills/novel-design/references/标尺使用日志.md'")
  })

  it('日志件零具体书名/角色名，书名一律用 <书名> 占位', () => {
    const blacklist = [
      '大奉打更人', '大奉',
      '诡秘之主', '诡秘',
      '我真没想重生啊', '重生啊',
      '绍宋', '十日终焉', '十日',
      '斗破苍穹', '斗破',
      '道诡异仙', '道诡',
      '魏渊', '罗塞尔', '徐芷溪',
    ]
    for (const name of blacklist) {
      expect(log, `标尺使用日志不应出现具体书名/角色名「${name}」`).not.toContain(name)
    }
    expect(log).toContain('<书名>')
  })
})
