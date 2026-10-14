/**
 * A-01 路径判定收敛：assembly/outline 里两份本地副本已删，统一走 gate 的权威判定。
 *
 * 覆盖：`A..B.md` 这类含 `..` 字样的合法名字放行（不再按子串误挡）、按段规范化、
 * 书仓内 junction/symlink 指向仓外拒绝、空/Root 本身/`..`/绝对/设备前缀一律拒绝、
 * 与权威 `resolveInsideBook` 同判（`ok === false` ⟺ `null`）。
 */
import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { resolveInsideBook, resolveInsideBookOrNull } from '../src/gate/paths'

const roots: string[] = []
function mkDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  roots.push(dir)
  return dir
}
afterAll(() => {
  for (const root of roots) {
    try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟 */ }
  }
})

const IS_WIN = process.platform === 'win32'

describe('resolveInsideBookOrNull（收敛后的唯一入口）', () => {
  it('含 .. 字样的合法名字放行，不再按子串拒绝', () => {
    const root = mkDir('abzu-inside-')
    const resolved = resolveInsideBookOrNull(root, '备注..旧.md')
    expect(resolved, '备注..旧.md 应放行').not.toBeNull()
    expect(path.basename(resolved!)).toBe('备注..旧.md')
    expect(resolveInsideBook(root, '备注..旧.md').ok, '权威判定本来就放行，两边一致').toBe(true)
  })

  it('按段规范化：世界书/子/../模块声明.md 等价于 世界书/模块声明.md', () => {
    const root = mkDir('abzu-inside-')
    const viaDotDot = resolveInsideBookOrNull(root, '世界书/子/../模块声明.md')
    expect(viaDotDot).not.toBeNull()
    expect(viaDotDot).toBe(resolveInsideBookOrNull(root, '世界书/模块声明.md'))
  })

  it('书仓内 junction/symlink 指向仓外：拒绝', () => {
    const root = mkDir('abzu-inside-')
    const outside = mkDir('abzu-outside-')
    fs.writeFileSync(path.join(outside, 'secret.md'), '仓外内容\n', 'utf8')
    fs.symlinkSync(outside, path.join(root, '外链'), IS_WIN ? 'junction' : 'dir')
    expect(resolveInsideBookOrNull(root, '外链/secret.md'), '别名指向仓外应拒绝').toBeNull()
  })

  it('空路径、书仓根本身、.. 逃逸与绝对越界一律 null', () => {
    const root = mkDir('abzu-inside-')
    const rejected = ['', '..', '../x.md', path.join(root, '..', 'x.md'), path.join(root, 'a', '..', '..', 'x.md')]
    for (const target of rejected) expect(resolveInsideBookOrNull(root, target), target).toBeNull()
    if (IS_WIN) {
      // 根相对路径与 `\\?\` 设备前缀形态：win32 下都是绝对路径，落点必在书仓外
      for (const target of ['\\outside-abzu.md', '\\\\?\\C:\\outside-abzu.md']) {
        expect(resolveInsideBookOrNull(root, target), target).toBeNull()
      }
    }
  })

  it('与权威 resolveInsideBook 同判（ok===false ⟺ null）', () => {
    const root = mkDir('abzu-inside-')
    const targets = [
      '笔记.md', '备注..旧.md', '世界书/子/../模块声明.md',
      '', '..', '../x.md', '/etc/passwd', 'C:/x.md', path.join(root, '..', 'x.md'),
    ]
    for (const target of targets) {
      const authoritative = resolveInsideBook(root, target)
      expect(authoritative.ok, target).toBe(resolveInsideBookOrNull(root, target) !== null)
    }
  })
})
