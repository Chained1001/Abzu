/**
 * 影响分析脚本的 CLI 逻辑（R21：novel_analyze_impact 只算，整个出去做技能脚本）。
 *
 * 本模块经 bundle 入口导出，各技能 scripts 目录下的薄入口动态引 lib 调用。
 * 只读不写：analyzeImpact 是纯读反向闭包；argv 进、退出码出，模块顶层零副作用。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { analyzeImpact, resolveInsideBook } from '@abzu/core'

function argValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  if (i === -1) return undefined
  const value = argv[i + 1]
  // Y7(批F):后随值以 -- 开头＝本参数缺值(值位被下一选项占住)——按缺失处理,由调用方点名报参数缺失
  return value === undefined || value.startsWith('--') ? undefined : value
}

export function analyzeImpactCli(argv: readonly string[]): number {
  const book = argValue(argv, 'book')?.trim()
  const 变更路径 = argValue(argv, '变更路径')?.trim()
  if (!book) {
    console.error('前置参数错误：必须传 --book 书仓路径')
    return 1
  }
  if (!变更路径) {
    console.error('前置参数错误：必须传 --变更路径 书仓内相对路径')
    return 1
  }
  // 修复(0.0.20 批 bug5):书仓/变更路径不存在时 analyzeImpact 空闭包静默 exit 0 形似成功——
  // 前置校验指名报错＋exit 1,式样对齐确定性检查(deterministic-checks.ts)。
  if (!fs.existsSync(book) || !fs.statSync(book).isDirectory()) {
    console.error(`书仓不存在：${path.resolve(book)}`)
    return 1
  }
  // Y4:变更路径须是书仓内相对路径——拒绝对路径与 `..` 穿越,防把分析闭包打到仓外。
  // 选型:core 的 resolveInsideBookOrNull 未从入口导出,改用同判已导出的 resolveInsideBook。
  const inside = path.isAbsolute(变更路径) ? undefined : resolveInsideBook(book, 变更路径)
  if (inside === undefined || !inside.ok) {
    console.error(`变更路径必须是书仓内相对路径（收到：${变更路径}）`)
    return 1
  }
  if (!fs.existsSync(path.join(book, 变更路径))) {
    console.error(`变更路径不存在：${path.resolve(book, 变更路径)}`)
    return 1
  }
  try {
    const report = analyzeImpact(book, 变更路径, {
      最大跳数: argValue(argv, '最大跳数') === undefined ? undefined : Number(argValue(argv, '最大跳数')),
      止于: argValue(argv, '止于已定稿') === undefined ? undefined : argValue(argv, '止于已定稿') === 'false' ? null : '已定稿',
    })
    console.log(JSON.stringify(report, null, 2))
    return 0
  } catch (err) {
    console.error(`影响分析异常：${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}
