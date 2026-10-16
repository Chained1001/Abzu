import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { spawnSync } from 'node:child_process'
import { ensureDraftGit, ensureStudyGit, snapshotDraft, snapshotStudy } from '../src/repo/draft-git'

const roots: string[] = []
function mkRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-draft-git-'))
  roots.push(dir)
  return dir
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

function git(cwd: string, args: readonly string[]): { status: number | null; stdout: string } {
  const r = spawnSync('git', args, { cwd, encoding: 'utf-8', windowsHide: true })
  return { status: r.status, stdout: r.stdout ?? '' }
}

function bookFixture(ws: string): string {
  const book = path.join(ws, '夜航船')
  fs.mkdirSync(path.join(book, '草稿区', '草稿', '卷01-夜渡'), { recursive: true })
  fs.writeFileSync(path.join(book, '草稿区', '草稿', '卷01-夜渡', '稿1.md'), '---\n角色: 草稿\n---\n他走进雨里。\n', 'utf-8')
  return book
}

describe('草稿区/书房独立仓版本化(数据保护三件套 #2)', () => {
  it('ensureDraftGit 初始化独立仓＋首提交;幂等(已存在不再初始化)', () => {
    const ws = mkRoot()
    const book = bookFixture(ws)
    const first = ensureDraftGit(book)
    expect(first.ok).toBe(true)
    expect(first.initialized).toBe(true)
    expect(fs.existsSync(path.join(book, '草稿区', '.git'))).toBe(true)
    expect(git(path.join(book, '草稿区'), ['log', '--oneline']).status).toBe(0)
    const again = ensureDraftGit(book)
    expect(again.ok).toBe(true)
    expect(again.initialized).toBe(false)
    // 独立仓在书仓 gitignore 语义之外:草稿区本身不因初始化多出任何非 git 文件
    expect(fs.readdirSync(path.join(book, '草稿区')).includes('草稿')).toBe(true)
  })

  it('snapshotDraft 有变化提交、无变化幂等不提交;.abzu 运行态不入快照', () => {
    const ws = mkRoot()
    const book = bookFixture(ws)
    expect(ensureDraftGit(book).ok).toBe(true)
    const draftDir = path.join(book, '草稿区')
    const count = (): number => Number(git(draftDir, ['rev-list', '--count', 'HEAD']).stdout.trim() || 0)
    const base = count()

    const none = snapshotDraft(book, '无变化快照')
    expect(none.ok).toBe(true)
    expect(none.committed).toBe(false)
    expect(count()).toBe(base)

    fs.writeFileSync(path.join(draftDir, '草稿', '卷01-夜渡', '稿2.md'), '第二稿。\n', 'utf-8')
    fs.mkdirSync(path.join(draftDir, '.abzu', 'transactions'), { recursive: true })
    fs.writeFileSync(path.join(draftDir, '.abzu', 'transactions', 'junk.json'), '{}', 'utf-8')
    const changed = snapshotDraft(book, '加第二稿')
    expect(changed.ok).toBe(true)
    expect(changed.committed).toBe(true)
    expect(count()).toBe(base + 1)
    // core.quotepath=false:中文文件名不转八进制转义,断言按原文比对
    const tracked = git(draftDir, ['-c', 'core.quotepath=false', 'ls-files']).stdout.split('\n')
    expect(tracked.some((f) => f.includes('稿2.md'))).toBe(true)
    expect(tracked.some((f) => f.includes('.abzu'))).toBe(false)
  })

  it('草稿区不存在时如实失败;存在但无文件也可初始化(空仓)', () => {
    const ws = mkRoot()
    const missing = snapshotDraft(path.join(ws, '无此书'), '空')
    expect(missing.ok).toBe(false)
    expect(missing.reason).toContain('快照区不存在')
    const book = path.join(ws, '空草稿书')
    fs.mkdirSync(path.join(book, '草稿区'), { recursive: true })
    const empty = ensureDraftGit(book)
    expect(empty.ok).toBe(true)
    expect(empty.initialized).toBe(true)
    const again = snapshotDraft(book, '仍为空')
    expect(again.ok).toBe(true)
    expect(again.committed).toBe(false)
  })

  it('书房同口径:初始化＋快照＋幂等(书房侧写入场景)', () => {
    const ws = mkRoot()
    const study = path.join(ws, '书房', '灵感池')
    fs.mkdirSync(study, { recursive: true })
    fs.writeFileSync(path.join(study, '守则.md'), '---\n名称: 守则\n---\n夜航船不夜行。\n', 'utf-8')
    const first = ensureStudyGit(ws)
    expect(first.ok).toBe(true)
    expect(first.initialized).toBe(true)
    const none = snapshotStudy(ws, '无变化')
    expect(none.committed).toBe(false)
    fs.writeFileSync(path.join(study, '守则.md'), '---\n名称: 守则\n---\n夜航船不夜行。改。\n', 'utf-8')
    const changed = snapshotStudy(ws, '改守则')
    expect(changed.ok).toBe(true)
    expect(changed.committed).toBe(true)
    expect(fs.existsSync(path.join(ws, '书房', '.git'))).toBe(true)
  })
})
