/**
 * 草稿区/书房版本化(数据保护三件套 #2):各落一个独立 git 仓做快照,不进真源提交面。
 *
 * 真源 git 只含已确认内容——书仓 `.gitignore` 排除 `草稿区/`,提交路径校验(commit/paths.ts)
 * 拒收草稿区;书房作者层资产本就不在书仓内。未确认草稿与书房资产原先零版本,误删误改不可
 * 恢复。本模块在 `草稿区/.git`、`书房/.git` 各初始化独立仓:嵌套仓被书仓 .gitignore 挡住,
 * 版本史与真源完全隔离。快照=add-all+commit,无变化不提交(幂等);`.abzu/` 运行态不入快照。
 * git 不可用或仓损坏时如实返回失败由调用方播报,绝不抛出中断写作主流程。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'

export interface ZoneGitState {
  readonly ok: boolean
  /** 本次调用是否新初始化了仓(已存在时 false)。 */
  readonly initialized: boolean
  readonly reason?: string
}

export interface ZoneSnapshot {
  readonly ok: boolean
  /** 是否产生了新提交(无变化时 false,幂等)。 */
  readonly committed: boolean
  readonly reason?: string
}

function runGit(zoneRoot: string, args: readonly string[]): { status: number; stderr: string; stdout: string; error?: string } {
  const r = spawnSync('git', args, { cwd: zoneRoot, encoding: 'utf-8', windowsHide: true })
  if (r.error) return { status: 1, stderr: r.error.message, stdout: '', error: r.error.message }
  return { status: r.status ?? 1, stderr: r.stderr ?? '', stdout: r.stdout ?? '' }
}

/** 目录存在且是目录才可做快照区;不存在视为「无可版本内容」交调用方决定。 */
function zoneDir(zoneRoot: string): { ok: true; dir: string } | { ok: false; reason: string } {
  try {
    const stat = fs.statSync(zoneRoot)
    if (!stat.isDirectory()) return { ok: false, reason: `快照区不是目录:${zoneRoot}` }
    return { ok: true, dir: zoneRoot }
  } catch {
    return { ok: false, reason: `快照区不存在:${zoneRoot}` }
  }
}

/** 幂等初始化独立仓:已存在不动;新建时配本仓身份(与书仓同口径)并提交首快照。 */
export function ensureZoneGit(zoneRoot: string): ZoneGitState {
  const dir = zoneDir(zoneRoot)
  if (!dir.ok) return { ok: false, initialized: false, reason: dir.reason }
  if (fs.existsSync(path.join(dir.dir, '.git'))) return { ok: true, initialized: false }
  const init = runGit(dir.dir, ['init'])
  if (init.status !== 0) return { ok: false, initialized: false, reason: `git init 失败:${init.stderr.trim() || (init.error ?? '非零退出')}` }
  runGit(dir.dir, ['config', 'user.email', 'abzu@local'])
  runGit(dir.dir, ['config', 'user.name', 'abzu'])
  runGit(dir.dir, ['config', 'commit.gpgsign', 'false'])
  const snap = snapshotZone(dir.dir, '快照区初始化')
  if (!snap.ok) return { ok: false, initialized: false, reason: snap.reason }
  return { ok: true, initialized: true }
}

/** 全量快照:add-all(排除 .abzu/)后 commit;无变化不提交。失败如实返回,不抛出。 */
export function snapshotZone(zoneRoot: string, message: string): ZoneSnapshot {
  const dir = zoneDir(zoneRoot)
  if (!dir.ok) return { ok: false, committed: false, reason: dir.reason }
  try {
    if (!fs.existsSync(path.join(dir.dir, '.git'))) {
      const ensured = ensureZoneGit(dir.dir)
      if (!ensured.ok) return { ok: false, committed: false, reason: ensured.reason }
    }
    // 不加 --literal-pathspecs:此处要的是 pathspec 排除魔法(:(exclude)),literal 模式会把它当文件名
    const add = runGit(dir.dir, ['add', '-A', '--', '.', ':(exclude).abzu', ':(exclude).abzu/**'])
    if (add.status !== 0) return { ok: false, committed: false, reason: `git add 失败:${add.stderr.trim() || (add.error ?? '非零退出')}` }
    const staged = runGit(dir.dir, ['diff', '--cached', '--quiet'])
    if (staged.status === 0) return { ok: true, committed: false }
    const commit = runGit(dir.dir, ['commit', '-m', message])
    if (commit.status !== 0) return { ok: false, committed: false, reason: `git commit 失败:${commit.stderr.trim() || (commit.error ?? '非零退出')}` }
    return { ok: true, committed: true }
  } catch (err) {
    return { ok: false, committed: false, reason: `快照异常:${err instanceof Error ? err.message : String(err)}` }
  }
}

/** 草稿区独立仓(bookRoot/草稿区/.git):幂等初始化＋首提交。 */
export function ensureDraftGit(bookRoot: string): ZoneGitState {
  return ensureZoneGit(path.join(bookRoot, '草稿区'))
}

/** 草稿区快照:稿落盘/导入后调用;无变化不提交。 */
export function snapshotDraft(bookRoot: string, message: string): ZoneSnapshot {
  return snapshotZone(path.join(bookRoot, '草稿区'), message)
}

/** 书房独立仓(workspaceRoot/书房/.git):幂等初始化＋首提交。 */
export function ensureStudyGit(workspaceRoot: string): ZoneGitState {
  return ensureZoneGit(path.join(workspaceRoot, '书房'))
}

/** 书房快照:作者层记忆等写入后调用;无变化不提交。 */
export function snapshotStudy(workspaceRoot: string, message: string): ZoneSnapshot {
  return snapshotZone(path.join(workspaceRoot, '书房'), message)
}
