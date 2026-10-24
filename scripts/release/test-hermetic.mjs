/**
 * 用「干净机器的 git 环境」跑全量测试。
 *
 * 存在理由（真实缺陷，两次各修一遍）：本仓测试会在临时书仓里 `git commit`、
 * 用 `git ls-files` 读中文路径。这两件事都受**跑测试那台机器的 git 配置**影响：
 *
 *   1. `user.name`/`user.email` —— 开发机配过，CI runner 与新装机用户没配，
 *      commit 直接以 128 失败（`Author identity unknown`）。
 *   2. `core.quotepath` —— 开发机常设成 false，默认却是 true，
 *      于是中文路径被转义成 `"\345\256\232..."`，与中文断言对不上。
 *
 * 后果是「本地全绿、CI 全红」，而且 CI 红了很久没人发现（2026-10-21 至 10-24）。
 * 这个脚本把 CI 的 git 环境在本地复现出来，让同类问题在推送前就暴露：
 * 把全局与系统 git 配置指向空文件，身份与 quotepath 一起回到出厂状态。
 *
 * 用法：pnpm test:hermetic [-- 额外 vitest 参数]
 */
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const empty = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-hermetic-')), 'empty-gitconfig')
fs.writeFileSync(empty, '')

// 先把继承下来的身份清掉：父进程若已导出 GIT_AUTHOR_*,子进程会优先用它,
// 光指向空配置文件不足以还原「新装机」状态。
const env = { ...process.env, GIT_CONFIG_GLOBAL: empty, GIT_CONFIG_SYSTEM: empty }
for (const key of ['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_NAME', 'GIT_COMMITTER_EMAIL']) delete env[key]

const extra = process.argv.slice(2).filter((arg) => arg !== '--')
console.log(`[hermetic] git 身份与 core.quotepath 已还原出厂状态（配置：${empty}）`)
// 直接调 vitest 而不经 pnpm：pnpm 不一定在 PATH 上(本仓开发机即如此),
// 而 node_modules/.bin 里的入口总是存在。
const vitest = path.join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs')
const result = spawnSync(process.execPath, [vitest, 'run', ...extra], { env, stdio: 'inherit' })
fs.rmSync(path.dirname(empty), { recursive: true, force: true })
process.exit(result.status ?? 1)
