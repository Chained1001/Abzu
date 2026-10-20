/**
 * A-2 步 1：`readBookText` 的错误口径。
 *
 * 本步零调用点改动，spec 只钉原语本身：ENOENT→missing、其余 errno→io（含目标是目录）、
 * BOM 剥除、`/` 与 `\` 两种相对写法等价、空文件是 `ok:true`。
 */
import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { readBookText } from '../src/repo/read'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-read-'))
  roots.push(dir)
  return dir
}
function put(root: string, rel: string, content: string | Buffer): void {
  fs.mkdirSync(path.dirname(path.join(root, ...rel.split('/'))), { recursive: true })
  fs.writeFileSync(path.join(root, ...rel.split('/')), content)
}
afterAll(() => {
  for (const root of roots) {
    try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟 */ }
  }
})

const IS_WIN = process.platform === 'win32'

describe('readBookText（A-2 步 1）', () => {
  it('正常文本：ok + 原文', () => {
    const root = mkBook()
    put(root, '作品契约/契约.md', '# 契约\n\n正文。\n')

    expect(readBookText(root, '作品契约/契约.md')).toEqual({ ok: true, text: '# 契约\n\n正文。\n' })
  })

  it('ENOENT → missing（detail 带路径）', () => {
    const root = mkBook()
    const result = readBookText(root, '故事剧情/不存在.md')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('missing')
      expect(result.detail).toContain('故事剧情/不存在.md')
    }
  })

  it('目标是目录 → io（不是 missing：路径在，读不成）', () => {
    const root = mkBook()
    fs.mkdirSync(path.join(root, '账本'), { recursive: true })

    const result = readBookText(root, '账本')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('io')
      expect(result.detail).toContain('账本')
      expect(result.detail).toMatch(/EISDIR|EPERM|EACCES|未知错误/)
    }
  })

  it.skipIf(IS_WIN)('无权限 → io（Windows 上 chmod 不生效，只在 POSIX 跑）', () => {
    const root = mkBook()
    put(root, '机密.md', '内容\n')
    fs.chmodSync(path.join(root, '机密.md'), 0o000)

    const result = readBookText(root, '机密.md')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('io')
      expect(result.detail).toMatch(/EACCES|EPERM/)
    }
  })

  it('剥首部 BOM（与 readMachineText 同口径）', () => {
    const root = mkBook()
    put(root, '本书记忆/索引.md', Buffer.from('\uFEFF# 索引\n', 'utf8'))

    expect(readBookText(root, '本书记忆/索引.md')).toEqual({ ok: true, text: '# 索引\n' })
  })

  it('rel 的 `/` 与 `\\` 两种写法等价（书仓相对，不是绝对路径）', () => {
    const root = mkBook()
    put(root, '草稿区/章细纲/卷01-初见.md', '细纲\n')

    const posix = readBookText(root, '草稿区/章细纲/卷01-初见.md')
    const win = readBookText(root, '草稿区\\章细纲\\卷01-初见.md')

    expect(posix).toEqual({ ok: true, text: '细纲\n' })
    expect(win).toEqual(posix)
  })

  it('空文件是 ok:true + 空串（判空归调用方，不是错误）', () => {
    const root = mkBook()
    put(root, '空.md', '')

    expect(readBookText(root, '空.md')).toEqual({ ok: true, text: '' })
  })
})
