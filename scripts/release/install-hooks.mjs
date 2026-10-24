// 把版本化的 .githooks/ 接到本地仓库。
//
// 为什么需要这一步：git 不会自动使用仓内的 hooks 目录，必须设 core.hooksPath。
// 不装的话，.githooks/pre-push 只是一份躺在仓库里的文件，推代码时不会有任何拦截——
// 那正是这份治理方案要消除的形态：「规则存在但不会被执行」。
//
// 幂等：重复跑无副作用。core.hooksPath 已被改成别处时报错退出，不静默覆盖。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..', '..')
const hooksDir = path.join(root, '.githooks')

const git = args =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

if (!fs.existsSync(hooksDir)) {
  console.error(`✗ 找不到 ${hooksDir}`)
  process.exit(1)
}

if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') {
  console.error('✗ 当前目录不是 git 工作树')
  process.exit(1)
}

const current = (() => {
  try { return git(['config', '--get', 'core.hooksPath']) } catch { return '' }
})()

if (current && current !== '.githooks') {
  console.error(`✗ core.hooksPath 已指向 ${current}，不覆盖。`)
  console.error('  如确认改用本仓 hooks：git config core.hooksPath .githooks')
  process.exit(1)
}

if (current === '.githooks') {
  console.log('✓ core.hooksPath 已是 .githooks，无需改动')
} else {
  git(['config', 'core.hooksPath', '.githooks'])
  console.log('✓ 已设置 core.hooksPath = .githooks')
}

// hooks 必须有可执行位，否则 git 会静默跳过它（Windows 上不生效，靠 sh 解释器兜底）。
const hooks = fs.readdirSync(hooksDir).filter(f => !f.startsWith('.') && !f.endsWith('.md'))
for (const name of hooks) {
  const file = path.join(hooksDir, name)
  try {
    fs.chmodSync(file, 0o755)
  } catch {
    // Windows 上 chmod 基本无意义，忽略。
  }
}

console.log(`✓ 已启用 ${hooks.length} 个 hook：${hooks.join('、')}`)
console.log('  推送前会跑 check:public；绕过用 git push --no-verify')
