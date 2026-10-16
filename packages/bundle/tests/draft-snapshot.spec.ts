import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'
import { attachDraftSnapshotToAgent } from '../src/gates'

const roots: string[] = []
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

function makeWorkspace(): { ws: string; bookRoot: string } {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-draft-snap-'))
  roots.push(ws)
  const bookRoot = path.join(ws, '星辰')
  fs.mkdirSync(path.join(bookRoot, '草稿区', '草稿', '卷01-第一章'), { recursive: true })
  fs.mkdirSync(path.join(bookRoot, '定稿'), { recursive: true })
  fs.mkdirSync(path.join(ws, '书房', '灵感池'), { recursive: true })
  fs.mkdirSync(path.join(ws, '书房', '参考书', '.analysis'), { recursive: true })
  return { ws, bookRoot }
}

function hook(ws: string, bookRoot: string): { emit: (name: string, args: Record<string, unknown>, result: unknown) => void } {
  const listeners: Array<(exec: unknown, result: unknown) => void> = []
  const off = attachDraftSnapshotToAgent({
    on: (event: string, listener: (...args: never[]) => unknown) => {
      if (event === 'tools/result') listeners.push(listener as (exec: unknown, result: unknown) => void)
      return () => listeners.splice(0)
    },
  }, {
    bookRootForAbs: (abs) => {
      const rel = path.relative(bookRoot, abs)
      return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel) ? bookRoot : undefined
    },
    workspaceRoot: () => ws,
  })
  expect(off).toBeTypeOf('function')
  return { emit: (name, args, result) => { for (const l of [...listeners]) l({ name, arguments: args }, result) } }
}

function commitCount(cwd: string): number {
  const r = spawnSync('git', ['rev-list', '--count', 'HEAD'], { cwd, encoding: 'utf-8', windowsHide: true })
  return r.status === 0 ? Number((r.stdout ?? '').trim() || 0) : -1
}

describe('文件工具写后自动快照(数据保护批 #2,tools/result 观察者)', () => {
  it('write 落草稿区 → 草稿区独立仓出快照;写书房 → 书房独立仓出快照', () => {
    const { ws, bookRoot } = makeWorkspace()
    const h = hook(ws, bookRoot)
    const draft = path.join(bookRoot, '草稿区', '草稿', '卷01-第一章', '稿1.md')
    fs.writeFileSync(draft, '第一稿。\n', 'utf-8')
    h.emit('write', { file_path: draft }, { isError: false })
    expect(fs.existsSync(path.join(bookRoot, '草稿区', '.git'))).toBe(true)
    expect(commitCount(path.join(bookRoot, '草稿区'))).toBe(1)

    const memory = path.join(ws, '书房', '灵感池', '守则.md')
    fs.writeFileSync(memory, '守则正文。\n', 'utf-8')
    h.emit('write', { file_path: memory }, {})
    expect(fs.existsSync(path.join(ws, '书房', '.git'))).toBe(true)
    expect(commitCount(path.join(ws, '书房'))).toBe(1)
  })

  it('非草稿区/书房目标不建仓;失败写(isError)不入快照;只读工具无关', () => {
    const { ws, bookRoot } = makeWorkspace()
    const h = hook(ws, bookRoot)
    const finalized = path.join(bookRoot, '定稿', '0001-第一章.md')
    fs.writeFileSync(finalized, '正文。\n', 'utf-8')
    h.emit('write', { file_path: finalized }, {})
    expect(fs.existsSync(path.join(bookRoot, '草稿区', '.git'))).toBe(false)

    const draft = path.join(bookRoot, '草稿区', '草稿', '卷01-第一章', '稿2.md')
    fs.writeFileSync(draft, '失败稿。\n', 'utf-8')
    h.emit('write', { file_path: draft }, { isError: true })
    expect(fs.existsSync(path.join(bookRoot, '草稿区', '.git'))).toBe(false)

    h.emit('read', { file_path: draft }, {})
    expect(fs.existsSync(path.join(bookRoot, '草稿区', '.git'))).toBe(false)
  })

  it('书房参考书(拆书机器状态)不触发书房快照;同一写重复发事件幂等(无变化不提交)', () => {
    const { ws, bookRoot } = makeWorkspace()
    const h = hook(ws, bookRoot)
    const analysis = path.join(ws, '书房', '参考书', '.analysis', '章卡.json')
    fs.writeFileSync(analysis, '{}', 'utf-8')
    h.emit('write', { file_path: analysis }, {})
    expect(fs.existsSync(path.join(ws, '书房', '.git'))).toBe(false)

    const draft = path.join(bookRoot, '草稿区', '草稿', '卷01-第一章', '稿1.md')
    fs.writeFileSync(draft, '第一稿。\n', 'utf-8')
    h.emit('write', { file_path: draft }, {})
    const before = commitCount(path.join(bookRoot, '草稿区'))
    h.emit('write', { file_path: draft }, {})
    expect(commitCount(path.join(bookRoot, '草稿区'))).toBe(before)
  })

  it('观察者零外溢:畸形事件/异常参数不抛出', () => {
    const { ws, bookRoot } = makeWorkspace()
    const h = hook(ws, bookRoot)
    expect(() => h.emit('write', null, undefined)).not.toThrow()
    expect(() => h.emit('write', { file_path: 123 }, {})).not.toThrow()
    expect(() => h.emit('edit', { file_path: path.join(bookRoot, '草稿区', '草稿', '卷01-第一章') }, 'not-an-object-result' as never)).not.toThrow()
  })
})
