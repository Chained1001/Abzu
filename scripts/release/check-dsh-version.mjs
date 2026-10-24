/**
 * DSH 版本探针：比对三个来源，报告本仓是否落后或超前于运行环境。
 *
 * 三源：
 *   基线    packages/bundle/dsh-baseline.json 的 source.version —— 本仓验证过的版本
 *   上游    npm 上 @deepseek-ai/dsh-tools 的 next 通道 —— 官方最新预发布
 *   宿主    本机 DSH 桌面端的 runtime.json desktopVersion —— 实际运行 Abzu 的环境
 *
 * 只有「宿主比基线新」以非零码退出。那意味着当前环境上跑的东西从没被验证过，
 * 是真故障；「上游比基线新」只是待办，不该让检查变红——否则等于逼着跟 next 走。
 *
 * 本机没装 DSH（或读不到 runtime.json）时宿主源记为 unknown，不算失败：
 * CI 与别人的机器上本来就没有桌面端。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
export const BASELINE = 'packages/bundle/dsh-baseline.json'

/** 把 prerelease 版本拆成可比较的元组：0.2.1-rc.3 → [0,2,1,'rc',3]。 */
export function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/i.exec(String(value).trim())
  if (!match) return null
  const [, major, minor, patch, label, prerelease] = match
  return [Number(major), Number(minor), Number(patch), label ?? '', prerelease === undefined ? -1 : Number(prerelease)]
}

/** a<b 返回负数，a>b 返回正数，相等 0。预发布版低于同号正式版。 */
export function compareVersions(a, b) {
  const left = parseVersion(a), right = parseVersion(b)
  if (!left || !right) return null
  // 元组是 [major, minor, patch, label, prerelease] 五段，都要比到。
  for (let index = 0; index < 5; index++) {
    if (left[index] === right[index]) continue
    // label 段：'' 表示正式版，正式版高于任何同号预发布版——不能按字典序比。
    if (index === 3) {
      if (left[3] === '') return 1
      if (right[3] === '') return -1
      return left[3] < right[3] ? -1 : 1
    }
    return left[index] - right[index]
  }
  return 0
}

export function readBaseline(directory = root) {
  const file = path.join(directory, BASELINE)
  const baseline = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (typeof baseline.source?.version !== 'string') throw new Error(`${BASELINE} 缺少 source.version`)
  if (typeof baseline.source?.commit !== 'string') throw new Error(`${BASELINE} 缺少 source.commit`)
  return baseline
}

/** 从 DSH_HOME 下的 runtime.json 读桌面端版本；读不到返回 null。 */
export function readHostVersion(environment = process.env) {
  const home = environment.DSH_HOME
  if (!home) return null
  const file = path.join(home, 'dsh-runtimes', 'dsh-primary-runtime', 'runtime.json')
  if (!fs.existsSync(file)) return null
  try {
    const runtime = JSON.parse(fs.readFileSync(file, 'utf8'))
    return typeof runtime.desktopVersion === 'string' ? runtime.desktopVersion : null
  } catch { return null }
}

/** 查 npm next 通道；网络不可用时返回 null（不判失败）。 */
export async function readUpstreamVersion(pkg = '@deepseek-ai/dsh-tools', timeoutMs = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkg}`, { signal: controller.signal })
    if (!response.ok) return null
    const metadata = await response.json()
    const next = metadata['dist-tags']?.next
    return typeof next === 'string' ? next : null
  } catch { return null } finally { clearTimeout(timer) }
}

/**
 * 三源比对。`host` 与 `upstream` 为 null 时对应项记为 unknown。
 * @returns {{baseline: string, upstream: string|null, host: string|null, status: string, blocking: boolean, notes: string[]}}
 */
export function inspect({ baseline, upstream, host }) {
  const notes = []
  const newer = (a, b) => (a && b ? compareVersions(a, b) > 0 : false)
  const older = (a, b) => (a && b ? compareVersions(a, b) < 0 : false)
  let status = 'up-to-date'
  let blocking = false
  if (host === null) {
    notes.push('宿主版本未知（本机未装 DSH 或读不到 runtime.json），跳过比对')
  } else if (newer(host, baseline)) {
    // 唯一拦得住的真故障：环境比基线新，Abzu 没在这个版本上验证过。
    status = 'host-ahead'
    blocking = true
    notes.push(`宿主 ${host} 比基线 ${baseline} 新：当前环境未经验证，须先升基线再运行`)
  } else if (older(host, baseline)) {
    status = 'host-behind'
    notes.push(`宿主 ${host} 比基线 ${baseline} 旧：本机环境没跟上仓库基线`)
  }
  if (upstream === null) {
    notes.push('上游版本未知（网络不可用），跳过比对')
  } else if (newer(upstream, baseline)) {
    if (status === 'up-to-date') status = 'upstream-ahead'
    notes.push(`上游 ${upstream} 比基线 ${baseline} 新：待办，不是故障`)
  }
  return { baseline, upstream, host, status, blocking, notes }
}

export async function check({ directory = root, environment = process.env, offline = false } = {}) {
  const baseline = readBaseline(directory)
  const host = readHostVersion(environment)
  const upstream = offline ? null : await readUpstreamVersion()
  return inspect({ baseline: baseline.source.version, upstream, host })
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const offline = process.argv.includes('--offline')
  const result = await check({ offline })
  console.log(JSON.stringify(result, null, 2))
  if (result.blocking) process.exitCode = 1
}
