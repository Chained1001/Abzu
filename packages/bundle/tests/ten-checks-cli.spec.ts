import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { removeSync } from '../../core/src/repo/remove'
import { tenChecksCli } from '../src/scripts/ten-checks-cli'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach(root => removeSync(root)) })

function outlineBody(shape: string, units: readonly string[]): string {
  return [
    '# 章细纲', '', '## 定位段', '',
    '### 冲突与爽点', '', '- 外部：反派刁难', '- 爽点位：当众对质打脸', '- 爽点位：绝境悟道新境界', '',
    '### 本章形状', '', shape, '',
    '## 细纲段', '', '### 单元 1', '',
    ...units, '',
  ].join('\n')
}

function fixture() {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ten-checks-cli-')); roots.push(ws)
  const book = path.join(ws, 'book')
  const write = (rel: string, text: string) => {
    fs.mkdirSync(path.join(book, ...rel.split('/').slice(0, -1)), { recursive: true })
    fs.writeFileSync(path.join(book, ...rel.split('/')), text)
  }
  // 候选＝第 5 章「第五章」；已埋承诺「当众对质」是第一个爽点位的铺垫源，第二个爽点位无铺垫
  write('草稿区/章细纲/卷01-第五章.md', `---\n状态: 候选\n---\n${outlineBody('反转揭半留半', ['- 目标: 摆平刁难', '- 行动/冲突: 当众对质，反转局面', '- 状态变化: 打脸成功'])}`)
  write('账本/承诺.md', [
    '# 承诺', '',
    '## 当众对质', '- 状态: 已埋', '第3章埋下当众对质的由头，占理已铺。', '',
    '## 旧账清账', '- 状态: 已兑现', '第2章已兑现的旧承诺，不应计入铺垫源。', '',
  ].join('\n'))
  // 上一章（第 4 章）章摘要——只呼应「当众对质」，不碰「绝境悟道」
  write('大纲/卷规划/卷01/章摘要/0004-第四章.md', '# 章摘要\n\n林昭夜行押镖，识破调包计，当众对质的局成了。')
  // 近四份确认细纲：0004 与候选同款章形＋同款转折；0001-0003 不同款；0005 同章号旧版（重入）应被排除
  const confirmed = [
    ['0001-第一章.md', '逐级升压', ['- 目标: 立规矩', '- 行动/冲突: 演武场立威', '- 状态变化: 声望起']],
    ['0002-第二章.md', '双线并行', ['- 目标: 接镖', '- 行动/冲突: 夜行识破调包', '- 状态变化: 镖银保住']],
    ['0003-第三章.md', '钝收定格', ['- 目标: 查内鬼', '- 行动/冲突: 账房对质未摊牌', '- 状态变化: 嫌疑收窄']],
    ['0004-第四章.md', '反转揭半留半（夜行版）', ['- 目标: 揭调包', '- 行动/冲突: 当众对质反转局面', '- 状态变化: 对家吃瘪']],
    ['0005-第五章.md', '反转揭半留半（旧版）', ['- 行动/冲突: 同章旧版', '- 状态变化: 旧版']],
  ] as const
  for (const [name, shape, units] of confirmed) {
    write(`大纲/卷规划/卷01/章细纲/${name}`, `---\n状态: 已确认\n---\n${outlineBody(shape, [...units])}`)
  }
  return { ws, book }
}

function invoke(args: string[]) {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {})
  const code = tenChecksCli(args)
  const text = output.mock.calls[0]?.[0]
  output.mockRestore()
  return { code, data: typeof text === 'string' ? JSON.parse(text) : undefined }
}

function snapshot(directory: string): Record<string, string> {
  const result: Record<string, string> = {}
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name)
      if (entry.isDirectory()) walk(file)
      else result[path.relative(directory, file)] = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    }
  }
  walk(directory)
  return result
}

describe('写前十查机械脚本（⑥爽点铺垫＋⑧近五章重复）', () => {
  it('⑥逐爽点位对账已埋承诺与上章摘要，⑧机械比对近五份确认细纲，全程零写盘', () => {
    const { book } = fixture()
    const before = snapshot(book)
    const { code, data } = invoke(['--book', book, '--卷', '1', '--章', '5', '--章名', '第五章'])
    expect(code).toBe(0)
    expect(data.ok).toBe(true)
    expect(data.候选).toBe('草稿区/章细纲/卷01-第五章.md')
    // ⑥：已埋条目计数不含已兑现；铺垫源含账本条目与上章摘要；无铺垫如实输出
    expect(data['⑥爽点铺垫']).toMatchObject({ 承诺账本: '已读', 已埋承诺条目: 1, 上一章摘要: '0004-第四章.md' })
    const payoffRows: string[] = data['⑥爽点铺垫'].行
    expect(payoffRows.some(row => row.startsWith('有候选铺垫：当众对质打脸') && row.includes('承诺「当众对质」') && row.includes('上章摘要(0004-第四章.md)'))).toBe(true)
    expect(payoffRows.some(row => row.startsWith('无铺垫：绝境悟道'))).toBe(true)
    // ⑧：同章号旧版（0005）被排除；章形同款＋转折同款命中 0004；0001-0003 无命中
    expect(data['⑧近五章重复'].比对序列).toEqual(['0004-第四章.md', '0003-第三章.md', '0002-第二章.md', '0001-第一章.md'])
    const repeatRows: string[] = data['⑧近五章重复'].行
    expect(repeatRows.some(row => row.startsWith('章形同款：0004-第四章.md'))).toBe(true)
    expect(repeatRows.some(row => row.startsWith('转折同款：反转｜0004-第四章.md'))).toBe(true)
    expect(repeatRows.filter(row => row.includes('0001') || row.includes('0002') || row.includes('0003'))).toHaveLength(0)
    expect(snapshot(book)).toEqual(before)
  })

  it('无账本与无确认细纲的新书如实报缺不编造，比对序列为空', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ten-checks-cli-')); roots.push(ws)
    const book = path.join(ws, 'book')
    fs.mkdirSync(path.join(book, '草稿区', '章细纲'), { recursive: true })
    fs.writeFileSync(path.join(book, '草稿区', '章细纲', '卷01-开篇.md'), `---\n状态: 候选\n---\n${outlineBody('危机开场', ['- 目标: 脱困', '- 行动/冲突: 雨夜逃生', '- 状态变化: 入城'])}`)
    const { code, data } = invoke(['--book', book, '--卷', '1', '--章', '1', '--章名', '开篇'])
    expect(code).toBe(0)
    expect(data['⑥爽点铺垫']).toMatchObject({ 承诺账本: '未建账', 已埋承诺条目: 0, 上一章摘要: null })
    expect(data['⑥爽点铺垫'].行.some(row => row.startsWith('无铺垫：'))).toBe(true)
    expect(data['⑧近五章重复'].比对序列).toEqual([])
    expect(data['⑧近五章重复'].行).toEqual(['本卷无确认细纲（首章或跨卷）——⑧无可比对'])
  })

  it('候选缺「冲突与爽点」「本章形状」节（旧格式候选）如实报缺不编造', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ten-checks-cli-')); roots.push(ws)
    const book = path.join(ws, 'book')
    fs.mkdirSync(path.join(book, '草稿区', '章细纲'), { recursive: true })
    fs.mkdirSync(path.join(book, '大纲', '卷规划', '卷01', '章细纲'), { recursive: true })
    fs.writeFileSync(path.join(book, '草稿区', '章细纲', '卷01-老格式.md'), [
      '---\n状态: 候选\n---', '# 章细纲', '', '## 定位段', '', '## 细纲段', '', '- 目标: 脱困', '- 行动/冲突: 雨夜逃生', '- 状态变化: 入城', '',
    ].join('\n'))
    fs.writeFileSync(path.join(book, '大纲', '卷规划', '卷01', '章细纲', '0001-第一章.md'), `---\n状态: 已确认\n---\n${outlineBody('逐级升压', ['- 目标: 立规矩', '- 行动/冲突: 演武场立威', '- 状态变化: 声望起'])}`)
    const { code, data } = invoke(['--book', book, '--卷', '1', '--章', '2', '--章名', '老格式'])
    expect(code).toBe(0)
    expect(data.ok).toBe(true)
    // ⑥：候选缺节不造爽点位行，也不误报账本状态
    expect(data['⑥爽点铺垫']).toMatchObject({ 承诺账本: '未读', 已埋承诺条目: 0 })
    expect(data['⑥爽点铺垫'].行).toEqual(['候选缺「### 冲突与爽点」节——⑥机械对账无爽点位可取，先落节再查'])
    // ⑧：候选缺「本章形状」节时跳过章形比对，只比单元行
    expect(data['⑧近五章重复'].比对序列).toEqual(['0001-第一章.md'])
    expect(data['⑧近五章重复'].行).toEqual(['无同款'])
  })

  it('承诺账本在、但读不了（EISDIR）→ 报「不可读」，不得说成「未建账」', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ten-checks-cli-')); roots.push(ws)
    const book = path.join(ws, 'book')
    fs.mkdirSync(path.join(book, '草稿区', '章细纲'), { recursive: true })
    fs.writeFileSync(path.join(book, '草稿区', '章细纲', '卷01-开篇.md'), `---\n状态: 候选\n---\n${outlineBody('危机开场', ['- 目标: 脱困', '- 行动/冲突: 雨夜逃生', '- 状态变化: 入城'])}`)
    // io 注入（A-2 步 3 的第三态）：把被读的那个文件换成同名目录 → EISDIR
    fs.mkdirSync(path.join(book, '账本', '承诺.md'), { recursive: true })
    const { code, data } = invoke(['--book', book, '--卷', '1', '--章', '1', '--章名', '开篇'])
    expect(code).toBe(0)
    expect(data['⑥爽点铺垫'].承诺账本).toBe('不可读')
    expect(data['⑥爽点铺垫'].承诺账本).not.toBe('未建账')
  })

  it('承诺账本真缺失 → 仍报「未建账」（与上一条配对，防一刀切）', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ten-checks-cli-')); roots.push(ws)
    const book = path.join(ws, 'book')
    fs.mkdirSync(path.join(book, '草稿区', '章细纲'), { recursive: true })
    fs.writeFileSync(path.join(book, '草稿区', '章细纲', '卷01-开篇.md'), `---\n状态: 候选\n---\n${outlineBody('危机开场', ['- 目标: 脱困', '- 行动/冲突: 雨夜逃生', '- 状态变化: 入城'])}`)
    const { code, data } = invoke(['--book', book, '--卷', '1', '--章', '1', '--章名', '开篇'])
    expect(code).toBe(0)
    expect(data['⑥爽点铺垫'].承诺账本).toBe('未建账')
    expect(data['⑥爽点铺垫'].承诺账本).not.toBe('不可读')
  })

  it('缺参、书仓缺失与候选缺失都退出 1，不产伪结果', () => {
    const { ws, book } = fixture()
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const args of [[], ['--book', book], ['--book', book, '--卷', '1'], ['--book', book, '--卷', '1', '--章', '5'], ['--book', path.join(ws, 'nope'), '--卷', '1', '--章', '5', '--章名', '第五章'], ['--book', book, '--卷', '1', '--章', '5', '--章名', '没落盘']]) {
      expect(tenChecksCli(args), JSON.stringify(args)).toBe(1)
    }
    expect(stderr).toHaveBeenCalled()
    stderr.mockRestore()
  })
})

describe('十查机械.mjs 薄入口 spawn 冒烟', () => {
  const entry = fileURLToPath(new URL('../skills/novel-outline/scripts/十查机械.mjs', import.meta.url))

  it('薄入口上溯三级动态引 lib 运行库，候选在则退出 0 产出同一报告', () => {
    const { book } = fixture()
    const r = spawnSync(process.execPath, [entry, '--book', book, '--卷', '1', '--章', '5', '--章名', '第五章'], { encoding: 'utf-8' })
    expect(r.status, r.stderr).toBe(0)
    const data = JSON.parse(r.stdout)
    expect(data.ok).toBe(true)
    expect(data.候选).toBe('草稿区/章细纲/卷01-第五章.md')
    expect(data['⑧近五章重复'].比对序列[0]).toBe('0004-第四章.md')
  })

  it('缺参经薄入口退出 1——退出码协议透传，不是加载崩溃（崩溃应为 3）', () => {
    const r = spawnSync(process.execPath, [entry], { encoding: 'utf-8' })
    expect(r.status, r.stderr).toBe(1)
  })
})
