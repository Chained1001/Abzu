import { afterAll, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { analyzeImpactCli } from '../src/scripts/impact-cli'

const roots: string[] = []
function mkDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-impact-cli-'))
  roots.push(dir)
  return dir
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

function captureRun(argv: string[]): { code: number; out: string } {
  const lines: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => { lines.push(String(msg)) })
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg?: unknown) => { lines.push(String(msg)) })
  try {
    const code = analyzeImpactCli(argv)
    return { code, out: lines.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

describe('影响分析薄入口前置校验(0.0.20 批 bug5:错路径不得空闭包 exit 0 形似成功)', () => {
  it('书仓不存在 → stderr 指名＋exit 1', () => {
    const missing = path.join(mkDir(), '不存在的书仓')
    const run = captureRun(['--book', missing, '--变更路径', '大纲/故事骨架.md'])
    expect(run.code).toBe(1)
    expect(run.out).toContain('书仓不存在')
    expect(run.out).toContain(missing)
  })

  it('书仓在而变更路径不存在 → stderr 指名＋exit 1', () => {
    const book = mkDir()
    const run = captureRun(['--book', book, '--变更路径', '大纲/不存在的文件.md'])
    expect(run.code).toBe(1)
    expect(run.out).toContain('变更路径不存在')
    expect(run.out).toContain(path.join(book, '大纲', '不存在的文件.md'))
  })

  it('路径俱在 → 正常出报告 exit 0(校验不误伤)', () => {
    const book = mkDir()
    fs.mkdirSync(path.join(book, '大纲'), { recursive: true })
    fs.writeFileSync(path.join(book, '大纲/故事骨架.md'), '# 故事骨架\n\n正文。', 'utf-8')
    const run = captureRun(['--book', book, '--变更路径', '大纲/故事骨架.md'])
    expect(run.code).toBe(0)
    expect(JSON.parse(run.out).changed).toBe('大纲/故事骨架.md')
  })

  it('Y4 变更路径越界（../穿越与绝对路径）→ stderr 点名收到值＋exit 1', () => {
    const book = mkDir()
    fs.mkdirSync(path.join(book, '大纲'), { recursive: true })
    fs.writeFileSync(path.join(book, '大纲/故事骨架.md'), '# 故事骨架\n\n正文。', 'utf-8')
    fs.writeFileSync(path.join(book, '..', '仓外文件.md'), 'x', 'utf-8')
    const escape = captureRun(['--book', book, '--变更路径', '../仓外文件.md'])
    expect(escape.code).toBe(1)
    expect(escape.out).toContain('书仓内相对路径')
    expect(escape.out).toContain('../仓外文件.md')
    const abs = captureRun(['--book', book, '--变更路径', path.join(book, '大纲/故事骨架.md')])
    expect(abs.code).toBe(1)
    expect(abs.out).toContain('书仓内相对路径')
    // 合法子路径不受影响（嵌套目录、含 .. 的文件名不误伤）
    fs.mkdirSync(path.join(book, '世界书/人物'), { recursive: true })
    fs.writeFileSync(path.join(book, '世界书/人物/甲..乙.md'), 'x', 'utf-8')
    const fine = captureRun(['--book', book, '--变更路径', '世界书/人物/甲..乙.md'])
    expect(fine.code).toBe(0)
  })
})
