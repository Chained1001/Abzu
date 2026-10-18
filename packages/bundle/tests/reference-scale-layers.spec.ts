import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 参考标尺通用四层（票 02）。
 *
 * 这组测试守的是分层契约，不是具体校准值：
 * 1. L0 全定性、无阿拉伯数字；
 * 2. 每行 schema 完整（id/行名/口径/consumer/status/confidence/gate/legacy）；
 * 3. 低置信、待校准、未验证、experimental 不得 gate:true；
 * 4. L1 只有口径稳定、n≥4、无冲突的行可 gate:true；L2 默认 false；L3 本书基线 true；
 * 5. 旧行名在标尺内至少保留一个精确表格单元，消费点不断链；
 * 6. 标尺不出现具体书名/角色名。
 */

const SCALE_PATH = path.join(__dirname, '..', 'skills', 'novel-design', 'references', '参考标尺.md')
const STATUS = new Set(['hard', 'range', 'qualitative', 'experimental'])
const CONFIDENCE = new Set(['high', 'partial', 'low', 'unverified'])
const GATE = new Set(['true', 'false'])

type Row = {
  readonly line: number
  readonly id: string
  readonly layer: 'L0' | 'L1' | 'L2' | 'L3'
  readonly cells: readonly string[]
  readonly status: string
  readonly confidence: string
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
    const expected = isL0L1 ? 9 : 8
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
        gate: cells[7]!,
        legacy: cells[8]!,
      })
    } else {
      rows.push({
        line: i + 1,
        id,
        layer,
        cells,
        status: cells[4]!,
        confidence: cells[5]!,
        gate: cells[6]!,
        legacy: cells[7]!,
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

function hasExactCell(value: string): boolean {
  return text.split(/\r?\n/).some((line) => line.startsWith('|') && cellsOf(line).includes(value))
}

describe('参考标尺通用四层（票 02）', () => {
  it('四层行数与 schema 完整：L0 18 条、L1 20 条、L2 八轴、L3 八项', () => {
    expect(layerRows('L0')).toHaveLength(18)
    expect(layerRows('L1')).toHaveLength(20)
    expect(layerRows('L3')).toHaveLength(8)

    const axisRows = layerRows('L2').filter((r) => r.id.startsWith('L2-AX-'))
    expect(axisRows).toHaveLength(8)
    expect(axisRows.map((r) => r.cells[1]!.slice(0, 2))).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'])
    expect(layerRows('L2').filter((r) => !r.id.startsWith('L2-AX-')).length).toBeGreaterThan(0)

    const ids = rows.map((r) => r.id)
    expect(new Set(ids).size, '行 id 不得重复').toBe(ids.length)

    for (const row of rows) {
      for (const [index, cell] of row.cells.entries()) {
        expect(cell.length, `${row.id} 第 ${index + 1} 列不得为空`).toBeGreaterThan(0)
      }
      expect(STATUS.has(row.status), `${row.id}: status「${row.status}」非法`).toBe(true)
      expect(CONFIDENCE.has(row.confidence), `${row.id}: confidence「${row.confidence}」非法`).toBe(true)
      expect(GATE.has(row.gate), `${row.id}: gate「${row.gate}」非法`).toBe(true)
      expect(row.legacy.length, `${row.id}: legacy 不得为空（无旧行名写 —）`).toBeGreaterThan(0)
    }
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
    }
    for (const row of layerRows('L1')) {
      if (row.gate === 'true') {
        expect(row.status, `${row.id}: gate:true 的 L1 应为 range/hard`).toMatch(/^(range|hard)$/)
        expect(row.confidence, `${row.id}: gate:true 的 L1 应为高置信`).toBe('high')
        expect(row.cells.join(''), `${row.id}: gate:true 的 L1 不得含待校准`).not.toContain('待校准')
      }
    }
    for (const row of layerRows('L2')) {
      expect(row.gate, `${row.id}: L2 默认只作对照，不得 gate:true`).toBe('false')
    }
    for (const row of layerRows('L3')) {
      expect(row.gate, `${row.id}: L3 本书基线应 gate:true`).toBe('true')
    }
  })

  it('低置信/待校准/未验证/experimental 一律不得 gate:true', () => {
    for (const row of rows) {
      const all = row.cells.join('')
      if (row.status === 'experimental' || row.confidence === 'low' || row.confidence === 'unverified') {
        expect(row.gate, `${row.id}: status/confidence 为实验或低置信时不得 gate:true`).toBe('false')
      }
      if (all.includes('待校准')) {
        expect(row.gate, `${row.id}: 含待校准时不得 gate:true`).toBe('false')
      }
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
      '主线', '主角成长弧', '主要人物', '升级点', '幕', '小反派', '中反派', '大地图',
      '支线', '关键事件', '伏笔密度', '势力与组织', '核心谜团与悬念线', '章末钩子',
      '章末钩型配比', '爽点铺垫', '伏笔债务', '换图前 10 章', '换图 SOP', '升级间隔',
      '三线断档红线', '幕内分批出细纲', '信息释放分级', '都市情感（都市子档）',
      '历史（历史穿越）', '玄幻', '都市', '悬疑', '女频', '杂交题材合成规则',
      '未覆盖题材兜底', '取数速查表', '衰减系数', '100 万字·默认', '200 万字·默认',
      '300 万字·默认', '500 万字·默认', '200 万字·玄幻', '200 万字·都市', '100 万字·都市',
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

  const legacySection = text.slice(text.indexOf('## 八、旧行名索引'))
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
