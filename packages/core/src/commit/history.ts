/**
 * 「某工件最近一次提交」查询(拍板 3:git log 双轨的专用工具主路;供进度卡消费)。
 * 类型级区分「从未提交」(never)与「查询失败」(error),不返回空成功(机制 B4)。
 * 章号解析:优先 Header Scope `design(chNNNN):`;次选提交变更文件里的定稿章路径;仍无则 null。
 */

import { spawnSync } from 'node:child_process'

export interface LastCommitChapter {
  /** 定稿章路径可得卷号;Scope 只有全书连续章号,卷未知为 null。 */
  readonly 卷: number | null
  readonly 章: number
}

export type LastCommitResult =
  | {
      readonly ok: true
      /** 原样保留 Header 首段,如 `design(ch0012)`、`ch`;展示用。 */
      readonly prefix: string
      readonly summary: string
      readonly hash: string
      readonly chapter: LastCommitChapter | null
    }
  | { readonly ok: false; readonly kind: 'never' | 'error'; readonly detail: string }

const SCOPE章 = /^design\(ch(\d+)\):/
const 定稿章 = /^定稿\/卷(\d+)\/(\d{4})-/

function runGit(bookRoot: string, args: readonly string[]): { readonly status: number; readonly stderr: string; readonly stdout: string } {
  // core.quotepath=false:中文路径不转义,否则章号解析与路径比对全部失配。
  const r = spawnSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: bookRoot, encoding: 'utf-8', windowsHide: true })
  if (r.error) return { status: 1, stderr: r.error.message, stdout: '' }
  return { status: r.status ?? 1, stderr: r.stderr ?? '', stdout: r.stdout ?? '' }
}

function chapterFrom(subject: string, files: readonly string[]): LastCommitChapter | null {
  const scope = SCOPE章.exec(subject)
  if (scope !== null) return { 卷: null, 章: Number(scope[1]) }
  for (const f of files) {
    const m = 定稿章.exec(f)
    if (m !== null) return { 卷: Number(m[1]), 章: Number(m[2]) }
  }
  return null
}

export function lastCommitOf(bookRoot: string, relPath: string): LastCommitResult {
  const log = runGit(bookRoot, ['log', '-1', '--format=%H%x1f%s', '--', relPath])
  if (log.status !== 0) {
    const stderr = log.stderr.trim()
    if (/does not have any commits yet|还没有任何提交/.test(stderr)) {
      return { ok: false, kind: 'never', detail: '书仓尚无任何提交' }
    }
    return { ok: false, kind: 'error', detail: stderr || 'git log 失败' }
  }
  const line = log.stdout.trim()
  if (line === '') return { ok: false, kind: 'never', detail: `「${relPath}」从未提交` }

  const [hash, subject] = line.split('\x1f')
  if (hash === undefined || subject === undefined) {
    return { ok: false, kind: 'error', detail: 'git log 输出无法解析' }
  }

  const show = runGit(bookRoot, ['show', '--name-only', '--pretty=format:', hash])
  const files = show.status === 0 ? show.stdout.split('\n').map((l) => l.trim()).filter((l) => l !== '') : []

  const head = subject.indexOf(': ')
  const prefix = head === -1 ? subject : subject.slice(0, head)
  const summary = head === -1 ? subject : subject.slice(head + 2)

  return { ok: true, prefix, summary, hash, chapter: chapterFrom(subject, files) }
}

/**
 * 批量版：一次 git 调用拿回多个路径各自的最近提交。
 *
 * 为什么要批量：`lastCommitOf` 每个路径要 spawn git **两次**（`log -1` 取提交、
 * `show --name-only` 取变更文件），实测单次 spawn 约 280–350ms（Windows）。
 * 进度卡一次要看 `3 + 3×卷数` 个路径，20 卷就是 63 个路径、126 次 spawn、30 秒以上
 * ——纯粹是进程启动开销，跟书有多大没关系。
 *
 * 这里改成两次 git 调用（与路径数无关）：
 * 1. `git log --format=… --name-only -- <全部路径>` 一次遍历，按输出顺序把每个路径
 *    第一次出现的提交记为「最近提交」；
 * 2. 只对命中的提交再批量取变更文件（也是同一条命令的输出，不必额外调用）。
 *
 * 语义与 `lastCommitOf` 对齐：从未提交 → `never`；查询失败 → `error`。
 * 单个路径查不到不影响其他路径。
 */
export function lastCommitsOf(bookRoot: string, relPaths: readonly string[]): Record<string, LastCommitResult> {
  const out: Record<string, LastCommitResult> = {}
  const 待查 = [...new Set(relPaths)]
  if (待查.length === 0) return out

  // 分隔符用 \x1e 起新记录、\x1f 分隔字段，避免提交信息里的换行打乱解析。
  const log = runGit(bookRoot, [
    'log', '--format=%x1e%H%x1f%s', '--name-only', '--', ...待查,
  ])
  if (log.status !== 0) {
    const stderr = log.stderr.trim()
    const 全都未提交 = /does not have any commits yet|还没有任何提交/.test(stderr)
    for (const p of 待查) {
      out[p] = 全都未提交
        ? { ok: false, kind: 'never', detail: '书仓尚无任何提交' }
        : { ok: false, kind: 'error', detail: stderr || 'git log 失败' }
    }
    return out
  }

  /** 每个路径 → 它第一次出现的那个提交（git log 是新到旧，第一次出现即最近一次）。 */
  const 命中 = new Map<string, { hash: string; subject: string; files: string[] }>()
  let current: { hash: string; subject: string; files: string[] } | undefined
  for (const raw of log.stdout.split('\x1e')) {
    if (raw === '') continue
    const 行们 = raw.split('\n')
    const [hash, subject] = (行们.shift() ?? '').split('\x1f')
    if (hash === undefined || subject === undefined) continue
    current = { hash, subject, files: 行们.map(l => l.trim()).filter(l => l !== '') }
    for (const f of current.files) {
      if (待查.includes(f) && !命中.has(f)) 命中.set(f, current)
    }
  }

  for (const p of 待查) {
    const hit = 命中.get(p)
    if (hit === undefined) {
      out[p] = { ok: false, kind: 'never', detail: `「${p}」从未提交` }
      continue
    }
    const head = hit.subject.indexOf(': ')
    out[p] = {
      ok: true,
      prefix: head === -1 ? hit.subject : hit.subject.slice(0, head),
      summary: head === -1 ? hit.subject : hit.subject.slice(head + 2),
      hash: hit.hash,
      chapter: chapterFrom(hit.subject, hit.files),
    }
  }
  return out
}
