/**
 * 测试用临时目录：**落在仓内 `.tmp/`，不是系统 `%TEMP%`**。
 *
 * ## 真因（2026-10-20 实测，已推翻此前两次误判）
 *
 * esbuild 把产物写到**工作区外**会失败，工作区内任何位置都成功：
 *
 *   esbuild buildSync → 仓内 .tmp/        成功
 *   esbuild buildSync → 仓内 packages/    成功
 *   esbuild buildSync → 系统 %TEMP%       失败 Access is denied
 *   esbuild buildSync → C:\abzu-probe     失败 Access is denied
 *   esbuild buildSync → D:\abzu-probe     失败 Access is denied
 *   Node 自己 writeFileSync → 系统 %TEMP% 成功   ← 只有 esbuild 落盘被拦
 *
 * 也就是说拦截的是 **esbuild 独立进程写工作区外**，不是系统 %TEMP% 的 ACL
 * （早前 vitest.config.ts 与本文件的注释都写成 ACL，那是错的）。宿主是 DSH 的文件沙箱，
 * 只放行工作区。
 *
 * 受影响的是五个用 esbuild 落盘的用例：archive-receipt / transaction-process /
 * retcon-retry-receipt / host-loader / retrieval-settings。它们此前靠手工设置
 * `ABZU_TEST_TEMP` 指向仓内才跑得起来——「记得设就对」，忘设整份失败。
 *
 * ## 为什么不用 os.tmpdir() 兜底
 *
 * 早前这里 `catch {}` 静默退回 `os.tmpdir()`。那是错的：兜底目录里 esbuild **必然**再失败一次，
 * 于是故障从「路径不对」变成「有时能跑有时不能」，真因还被藏进兜底目录。
 * 现在仓内建不出来就直接 throw 并点名路径——宁可明确失败，不要伪装成偶发。
 *
 * ## 关于 `.tmp/` 位于 git 工作树内
 *
 * `.tmp/` 在仓内，`git -C <dir>` 会向上命中外层仓库。仓库里已有为此设的守卫
 * （见 `packages/core/tests/commit.spec.ts` 的 `insideGitWorktree`），不要删。
 * 使用本助手的用例若依赖「不在 git 仓内」的前提，需自行处理（例如自建 `.git` 或在
 * workspace 里落 `.git` 标记，`host-loader.mjs` 就是这么做的）。
 *
 * ## 残留
 *
 * 每个进程一个 `mkdtemp` 子目录；正常退出时由各用例的 `afterAll` 删除。
 * 被信号杀掉的进程会留下目录，由 `sweepStaleScratch()` 在下次建目录时顺手清扫（默认 6 小时）。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 仓库根：从本文件（packages/core/tests/helpers/scratch.ts）上溯四层。 */
const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)))

/** 仓内临时目录根。 */
export const SCRATCH_ROOT = path.join(repoRoot, '.tmp')

/** 陈旧目录判定：超过这个时长没被改动就清扫。被杀进程留下的目录不会还在写。 */
const STALE_MS = 6 * 60 * 60_000

/**
 * 建一个测试用临时目录并返回其路径。
 *
 * 建不出来就 throw（不静默退回 `os.tmpdir()`）——见文件头说明。
 */
export function testScratchDir(prefix: string): string {
  const name = sanitize(prefix)
  try {
    fs.mkdirSync(SCRATCH_ROOT, { recursive: true })
    sweepStaleScratch()
    return fs.mkdtempSync(path.join(SCRATCH_ROOT, `${name}-`))
  } catch (error) {
    throw new Error(
      `测试临时目录建不出来：${SCRATCH_ROOT}（${error instanceof Error ? error.message : String(error)}）。`
      + '不要退回系统 %TEMP%——esbuild 写工作区外会被沙箱拒绝，那样只会把明确故障变成偶发。',
      { cause: error },
    )
  }
}

/**
 * 清掉陈旧残留目录（被信号杀掉、来不及跑 afterAll 的进程留下的）。
 *
 * 只删「够旧」且**名字像本助手产物**的目录，尽力而为：任何失败都忽略，
 * 残留不影响正确性，只是占盘。
 */
export function sweepStaleScratch(now = Date.now()): void {
  let names: string[]
  try {
    names = fs.readdirSync(SCRATCH_ROOT)
  } catch {
    return
  }
  const threshold = now - STALE_MS
  for (const name of names) {
    const target = path.join(SCRATCH_ROOT, name)
    try {
      const stat = fs.statSync(target)
      if (!stat.isDirectory() || stat.mtimeMs >= threshold) continue
      fs.rmSync(target, { recursive: true, force: true })
    } catch {
      /* 正被别的进程使用或已消失：跳过，不影响正确性。 */
    }
  }
}

/** 目录名只允许安全字符，避免前缀里的路径分隔符改变位置。 */
function sanitize(prefix: string): string {
  const cleaned = prefix.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned === '' ? 'abzu-test' : cleaned
}
