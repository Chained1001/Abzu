import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { computeExport, serializeDocument } from '@abzu/core'
import { exportCli } from '../src/scripts/export-cli'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach((root) => { try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } }) })

/** 三章两卷的定稿书仓（章号全书连续：1、2 在卷一，3 在卷二）。 */
function finalizedBook(): string {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-export-cli-'))
  roots.push(ws)
  const root = path.join(ws, '夜航船')
  const chapters: [string, string][] = [
    ['定稿/卷01/0001-夜渡.md', '正文一。'],
    ['定稿/卷01/0002-靠岸.md', '正文二。'],
    ['定稿/卷02/0003-远行.md', '正文三。'],
  ]
  for (const [rel, body] of chapters) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true })
    fs.writeFileSync(path.join(root, rel), serializeDocument({ 状态: '已定稿' }, body), 'utf-8')
  }
  return root
}

interface Run { code: number; data?: Record<string, unknown>; err: string }

function invoke(argv: string[]): Run {
  const out: string[] = []
  const errors: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => { out.push(String(msg)) })
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg?: unknown) => { errors.push(String(msg)) })
  try {
    const code = exportCli(argv)
    const text = out.join('\n')
    return { code, data: text === '' ? undefined : JSON.parse(text) as Record<string, unknown>, err: errors.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

describe('最小导出薄入口 CLI(任务13 只算不写)', () => {
  it('参数纪律:未知/重复/缺值选项、--校验 缺 --目标 或非 true、卷章非正整数均拒绝(退出码 1)', () => {
    const bad: string[][] = [
      [],
      ['--book'],
      ['--book', 'x', '--未知', 'y'],
      ['--book', 'a', '--book', 'b'],
      ['--book', '--x'],
      ['--book', 'x', '--校验', 'true'],
      ['--book', 'x', '--校验', 'false'],
      ['--book', 'x', '--卷', 'abc'],
      ['--book', 'x', '--卷', '0'],
      ['--book', 'x', '--起章', '-1'],
      ['--book', 'x', '--止章', '1.5'],
    ]
    for (const argv of bad) expect(invoke(argv).code, JSON.stringify(argv)).toBe(1)
    expect(invoke(['--book', 'x', '--未知', 'y']).err).toContain('未知或重复选项')
    expect(invoke(['--book', 'x', '--校验', 'true']).err).toContain('校验须传 --校验 true 和 --目标 目录')
    expect(invoke(['--book', 'x', '--卷', 'abc']).err).toContain('--卷 必须是正整数')
  })

  it('正常路径(全书):与 core 直调 computeExport 逐字段对账,文件载荷两份完整可落盘', () => {
    const root = finalizedBook()
    const argv = ['--book', root]
    const { code, data, err } = invoke(argv)
    expect(code, err).toBe(0)
    expect(data!.ok).toBe(true)
    expect(data!.书名).toBe('夜航船')
    expect(data!.范围).toBe('全书')
    expect(data!.章数).toBe(3)
    expect(data!.合计字数).toBe(12)
    expect(data!.合集文件).toBe('夜航船-定稿合集.md')
    expect(data!.清单文件).toBe('夜航船-来源清单.md')
    expect(data!.目标).toBeNull()
    expect(data!.校验).toBeNull()
    // 对账：CLI stdout 载荷与 core 直调同源同字节（章列表不含正文，正文在文件载荷里）
    const direct = computeExport(root)
    expect(direct.ok).toBe(true)
    expect(data!.合集哈希).toBe(direct.合集哈希)
    const 文件 = data!.文件 as { 名称: string; content: string }[]
    expect(文件.map((f) => f.名称)).toEqual(['夜航船-定稿合集.md', '夜航船-来源清单.md'])
    expect(文件[0]!.content).toBe(direct.合集)
    expect(文件[0]!.content).toContain('### 第0001章 夜渡')
    expect(文件[0]!.content).toContain('正文三。')
    expect(文件[1]!.content).toBe(direct.清单)
    expect(文件[1]!.content).toContain('定稿/卷02/0003-远行.md')
    expect(文件[1]!.content).toContain(`- 合集 SHA-256：${direct.合集哈希}`)
    // 只算不写：目录里除夹具三章外无任何新文件
    expect(fs.readdirSync(path.join(root, '定稿', '卷01'))).toHaveLength(2)
  })

  it('范围筛选:--卷 2 只取卷二;--起章/--止章 按全书连续章号截取;空选择拒绝', () => {
    const root = finalizedBook()
    const 卷二 = invoke(['--book', root, '--卷', '2'])
    expect(卷二.code).toBe(0)
    expect(卷二.data!.范围).toBe('卷02')
    expect(卷二.data!.章数).toBe(1)
    const 中段 = invoke(['--book', root, '--起章', '2', '--止章', '2'])
    expect(中段.code).toBe(0)
    expect(中段.data!.章数).toBe(1)
    expect((中段.data!.章列表 as { 章名: string }[])[0]!.章名).toBe('靠岸')
    const 空 = invoke(['--book', root, '--卷', '3'])
    expect(空.code).toBe(1)
    expect(空.err).toContain('最小导出未完成')
    expect(空.err).toContain('空选择')
  })

  it('--目标 只读检查:干净目录放行,已有同名文件不覆盖拒绝(退出码 1 且点名冲突件)', () => {
    const root = finalizedBook()
    const ws = path.dirname(root)
    const clean = path.join(ws, '导出位')
    fs.mkdirSync(clean, { recursive: true })
    const okRun = invoke(['--book', root, '--目标', clean])
    expect(okRun.code).toBe(0)
    expect(okRun.data!.目标).toMatchObject({ ok: true, 已存在: true, 冲突: [] })
    expect((okRun.data!.文件 as unknown[]).length, '校验未开启时给完整写盘载荷').toBe(2)

    const conflict = path.join(ws, '占位目录')
    fs.mkdirSync(conflict, { recursive: true })
    fs.writeFileSync(path.join(conflict, '夜航船-定稿合集.md'), '旧内容', 'utf-8')
    const bad = invoke(['--book', root, '--目标', conflict])
    expect(bad.code).toBe(1)
    expect(bad.err).toContain('导出目标不可用')
    expect(bad.err).toContain('不覆盖')
    expect(bad.err).toContain('夜航船-定稿合集.md')
    expect((bad.data!.目标 as { 冲突: string[] }).冲突).toEqual(['夜航船-定稿合集.md'])
    expect(bad.data!.文件).toEqual([])

    const inside = path.join(root, '定稿', '卷01')
    const polluted = invoke(['--book', root, '--目标', inside])
    expect(polluted.code).toBe(1)
    expect(polluted.err).toContain('导出目标不可用')
    expect(polluted.err).toContain('源定稿目录')
  })

  it('--校验 true:两件按载荷落盘后验收通过(退出码 0,载荷收敛);缺件或内容不一致拒绝', () => {
    const root = finalizedBook()
    const ws = path.dirname(root)
    const target = path.join(ws, '验收位')
    fs.mkdirSync(target, { recursive: true })
    const missing = invoke(['--book', root, '--目标', target, '--校验', 'true'])
    expect(missing.code).toBe(1)
    expect(missing.err).toContain('导出校验失败')
    expect(missing.data!.文件, '校验模式下不给写盘载荷').toEqual([])

    const planned = computeExport(root)
    fs.writeFileSync(path.join(target, planned.合集文件), planned.合集, 'utf-8')
    fs.writeFileSync(path.join(target, planned.清单文件), planned.清单, 'utf-8')
    const verified = invoke(['--book', root, '--目标', target, '--校验', 'true'])
    expect(verified.code).toBe(0)
    expect(verified.data!.校验).toMatchObject({ ok: true })
    expect((verified.data!.校验 as { 文件: { 一致: boolean }[] }).文件.every((f) => f.一致)).toBe(true)
    expect(verified.data!.文件).toEqual([])

    fs.writeFileSync(path.join(target, planned.合集文件), '被篡改的合集', 'utf-8')
    const tampered = invoke(['--book', root, '--目标', target, '--校验', 'true'])
    expect(tampered.code).toBe(1)
    expect(tampered.err).toContain('导出校验失败')
    expect(tampered.err).toContain('内容不一致')
  })
})

/**
 * 覆盖边界：实际写盘由主 Agent 经原生文件工具完成（目标常在书仓围栏外），本件按
 * 只算不写契约守 argv→stdout/退出码：参数面、全书/范围/空选择、目标只读检查三态
 * （干净/冲突/污染源）、校验三态（缺件/一致/篡改）。导出内容形态（frontmatter 契约、
 * 章号连续性报缺口）由 core 侧 export spec 另守。
 */
