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
import { classifyRelPath, gateFileAccess, resolveInsideBook, resolveInsideBookOrNull } from '../src/gate/paths'
import { prepareActOutline } from '../src/design/volume'
import { writeFileAtomic } from '../src/repo/atomic'

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
describe('幕纲门禁归类(0.0.52 幕纲批)', () => {
  it('大纲/卷规划/卷01/幕纲/幕01-X.md 被自动归类为真源：文件工具直写被拒', () => {
    const root = mkDir('abzu-gate-memo-')
    fs.mkdirSync(path.join(root, '大纲/卷规划/卷01/幕纲'), { recursive: true })
    const rel = '大纲/卷规划/卷01/幕纲/幕01-渡口疑云.md'
    expect(classifyRelPath(rel)).toBe('真源')
    expect(classifyRelPath('大纲/卷规划/卷01/幕纲')).toBe('真源')
    const denied = gateFileAccess(root, path.join(root, rel))
    expect(denied.allow).toBe(false)
    expect(denied.zone).toBe('真源')
    expect(denied.allow === false ? denied.reason : '').toContain('真源区仅书仓写入器可写')
    // 草稿区/定稿区归类不因幕纲受扰（对照组）
    expect(classifyRelPath('草稿区/章细纲/卷01-开篇.md')).toBe('草稿区')
    expect(classifyRelPath('定稿/卷01/0001-开篇.md')).toBe('定稿')
  })

  it('经写入器（prepareActOutline + writeFileAtomic）落幕纲成功，文件工具仍拒', () => {
    const root = mkDir('abzu-gate-memo-')
    const op = prepareActOutline(1, 1, '渡口疑云', '# 幕纲\n\n## 本幕故事\n\nx\n')
    expect(op.relPath).toBe('大纲/卷规划/卷01/幕纲/幕01-渡口疑云.md')
    writeFileAtomic(root, op.relPath, op.content)
    expect(fs.existsSync(path.join(root, op.relPath))).toBe(true)
    expect(gateFileAccess(root, path.join(root, op.relPath)).allow).toBe(false)
  })
})
})
