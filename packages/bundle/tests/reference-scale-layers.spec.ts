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
  it('四层行数与 schema 完整：L0 14 条、L1 17 条、L2 八轴、L3 八项', () => {
    expect(layerRows('L0')).toHaveLength(14)
    expect(layerRows('L1')).toHaveLength(17)
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
