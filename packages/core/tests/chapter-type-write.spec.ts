import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  checkConfirmable,
  confirmOutline,
  parseOutline,
  seedMinDesign,
  writeCandidate,
} from '../src/index'
import { paths } from '../src/repo/paths'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-chtype-'))
  roots.push(dir)
  seedMinDesign(dir)
  return dir
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const

/** 满足全部硬门槛的最小正文（九节＋四小节＋来源引用＋约束分级）。 */
function fullBody(): string {
  return [
    '# 章细纲', '', '## 定位段', '',
    '### 来源窗口项及拆并关系', '开篇任务，单章承接', '',
    '### 章节功能', '建立开场冲突', '- 〔软〕节奏平稳', '',
    '### 视角与焦点', '主角视角', '',
    '### 时空锚定', '城门口，清晨', '',
    '### 起止边界', '从抵达城门到发现异状', '',
    '### 故事线与承诺分配', '推进主线承诺', '',
    '### 信息边界', '只披露主角所见', '',
    '### 情绪与节奏目标', '紧张后留钩子', '',
    '### 前置条件核对结果', '已核对来源与窗口，前置设定均非留白', '',
    '## 细纲段', '', '### 单元 1', '',
    '- 目标: 找到异常', '- 人物: 主角', '- 时空: 城门口',
    '- 行动/冲突: 盘问与发现', '- 信息披露: 异常线索', '- 状态变化: 从平静到警觉', '',
  ].join('\n')
}

const refs = ['作品契约/契约.md@1', '故事剧情/卷规划/卷01/卷纲.md@1']

describe('章型双轴：落盘与读回', () => {
  it('写候选时带章型 → frontmatter 有该字段，parseOutline 能读回', () => {
    const root = mkBook()
    const rel = writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 章型: '过渡·余波', body: fullBody(), 来源引用: refs })
    const text = fs.readFileSync(path.join(root, rel), 'utf-8')
    expect(text).toMatch(/章型:\s*过渡·余波/)
    const parsed = parseOutline(text)
    expect(parsed.章型).toEqual({ 承诺: '过渡', 情绪: '余波' })
  })

  it('不写章型 → 字段不出现，解析为 null（旧书兼容）', () => {
    const root = mkBook()
    const rel = writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', body: fullBody(), 来源引用: refs })
    const text = fs.readFileSync(path.join(root, rel), 'utf-8')
    expect(text).not.toMatch(/章型:/)
    expect(parseOutline(text).章型).toBeNull()
  })

  it('确认后章型随真源保留', () => {
    const root = mkBook()
    writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 章型: '关键·高潮', body: fullBody(), 来源引用: refs })
    expect(confirmOutline(root, key)).toEqual({ ok: true })
    const text = fs.readFileSync(path.join(root, paths.确认细纲(1, 1, '开篇任务')), 'utf-8')
    expect(text).toMatch(/章型:\s*关键·高潮/)
    expect(parseOutline(text).章型).toEqual({ 承诺: '关键', 情绪: '高潮' })
  })
})

describe('章型双轴：软校验', () => {
  it('缺失章型不拦确认，只在播报里提示', () => {
    const root = mkBook()
    writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', body: fullBody(), 来源引用: refs })
    const gate = checkConfirmable(root, key)
    expect(gate.ok, '缺章型不该拦住确认').toBe(true)
    expect(gate.播报?.some((b) => b.includes('章型未标'))).toBe(true)
  })

  it('填了合法章型 → 无播报', () => {
    const root = mkBook()
    writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 章型: '过渡·切换', body: fullBody(), 来源引用: refs })
    const gate = checkConfirmable(root, key)
    expect(gate.ok).toBe(true)
    expect(gate.播报?.some((b) => b.includes('章型未标')) ?? false).toBe(false)
  })

  it('填了非法章型 → 拒确认，且错误文案可操作', () => {
    const root = mkBook()
    writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 章型: '超级章', body: fullBody(), 来源引用: refs })
    const gate = checkConfirmable(root, key)
    expect(gate.ok).toBe(false)
    if (!gate.ok) {
      const hit = gate.gaps.find((g) => g.includes('章型字段无法识别'))
      expect(hit, gate.gaps.join('\n')).toBeDefined()
      // 文案要给出合法取值，否则模型无从修正
      expect(hit).toContain('关键')
      expect(hit).toContain('余波')
    }
    expect(confirmOutline(root, key).ok).toBe(false)
  })
})
