/**
 * 无 git 身份环境下的提交回归。
 *
 * 背景：`commitWithIsolatedIndex` 原先把 commit 直接交给继承的 `process.env`，
 * 假设机器上配过 `git config --global user.*`。开发机通常配过，所以本地全绿；
 * CI 的 Windows runner 与**新装机用户**都没有，于是提交失败：
 *   `Author identity unknown ... fatal: unable to auto-detect email address`
 *
 * 这里把 GIT_CONFIG_GLOBAL / GIT_CONFIG_SYSTEM 指向空文件，确定性地剥掉身份，
 * 再要求提交成功。不依赖「运行这台机器的人恰好没配」这种运气。
 */
import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'
import { commitWithIsolatedIndex } from '../src/commit/git'

function git(cwd: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, env: { ...process.env, ...env } })
}

describe('无 git 身份时的提交', () => {
  it('没有 user.name/user.email 时 commitWithIsolatedIndex 仍能提交', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-noident-'))
    // 空配置：全局与系统配置都不提供身份，等价于 CI runner 与新装机用户
    const emptyConfig = path.join(root, 'empty-gitconfig')
    fs.writeFileSync(emptyConfig, '')
    const isolated: NodeJS.ProcessEnv = {
      GIT_CONFIG_GLOBAL: emptyConfig,
      GIT_CONFIG_SYSTEM: emptyConfig,
      // 清掉可能从父进程继承的身份，确保「真的没有身份」
      GIT_AUTHOR_NAME: '',
      GIT_AUTHOR_EMAIL: '',
      GIT_COMMITTER_NAME: '',
      GIT_COMMITTER_EMAIL: '',
    }
    const prev = { ...process.env }
    try {
      git(root, ['init', '--quiet'], isolated)
      // 前提校验：这个环境下裸 commit 必须失败，否则本测试没有证明力
      fs.writeFileSync(path.join(root, 'a.md'), '正文')
      git(root, ['add', '-A'], isolated)
      const bare = git(root, ['commit', '-m', 'probe'], isolated)
      expect(bare.status, '构造的环境必须真的没有 git 身份').not.toBe(0)
      // 不同 git 版本措辞不同：`Author identity unknown` 或 `empty ident name`。
      // 断言「因身份而失败」这一点，不锁死某一版文案。
      expect(bare.stderr).toMatch(/identity|empty ident|tell me who you are/i)

      // 进入被测环境：把剥掉身份的配置注入 process.env，让被测代码继承
      for (const key of Object.keys(process.env)) {
        if (key.startsWith('GIT_')) delete process.env[key]
      }
      Object.assign(process.env, { GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_SYSTEM: emptyConfig })

      fs.writeFileSync(path.join(root, 'b.md'), '新内容')
      const result = commitWithIsolatedIndex(root, ['b.md'], '写入 b.md')
      expect(result.status, `提交失败: ${result.stderr}`).toBe(0)

      const log = git(root, ['log', '--format=%s', '-1'], isolated)
      expect(log.stdout.trim()).toBe('写入 b.md')
    } finally {
      for (const key of Object.keys(process.env)) {
        if (key.startsWith('GIT_')) delete process.env[key]
      }
      Object.assign(process.env, prev)
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})
