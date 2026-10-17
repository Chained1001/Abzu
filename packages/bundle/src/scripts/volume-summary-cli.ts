/**
 * 卷摘要候选脚本的 CLI 逻辑（任务21, 件一；R21：只算不写，薄入口经 lib 调用）。
 *
 * 读本卷已定稿章的章摘要全文、账本已收/已兑现/进行中线索、卷纲「卷末兑现」段，汇编候选；
 * argv 进、退出码出，顶层零副作用。
 */

import { computeVolumeSummaryCandidate } from '@abzu/core'

function argValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  if (i === -1) return undefined
  const value = argv[i + 1]
  // Y7(批F):后随值以 -- 开头＝本参数缺值(值位被下一选项占住)——按缺失处理,由调用方点名报参数缺失
  return value === undefined || value.startsWith('--') ? undefined : value
}

export function volumeSummaryCli(argv: readonly string[]): number {
  const book = argValue(argv, 'book')?.trim()
  const 卷 = Number(argValue(argv, '卷'))
  if (!book) {
    console.error('前置参数错误：必须传 --book 书仓路径')
    return 1
  }
  if (!Number.isSafeInteger(卷) || 卷 < 1) {
    console.error('前置参数错误：必须传 --卷 正整数（如 --卷 1）')
    return 1
  }
  try {
    const result = computeVolumeSummaryCandidate(book, 卷)
    // 统一 JSON 输出（候选在 候选 字段）。
    // 修复(0.0.20 批 bug6):原仅账本失败(账本失败===true)才 exit 1,缺章摘要/无定稿等 ok:false
    // 仍 exit 0 形似成功——统一为 !ok 一律 exit 1(全失败模式红),失败明细仍在 JSON 里如实呈报。
    console.log(JSON.stringify(result, null, 2))
    return result.ok ? 0 : 1
  } catch (err) {
    console.error(`卷摘要候选生成异常：${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}
