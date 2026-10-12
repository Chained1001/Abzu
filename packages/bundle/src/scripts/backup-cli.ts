/**
 * 一键备份脚本的 CLI 逻辑(数据保护三件套 #3)。
 *
 * 把书仓(含真源 git＋草稿区独立 git)、书房(含 git)与 profiles 全量复制到
 * `备份/{书名}-{YYYYMMDD-HHmmss}/` 目录,manifest.json(逐文件 SHA-256)最后落盘并回读复验。
 * 只新增目录不覆盖;只读复制,不改书仓、书房与任何 git。argv 进、退出码出,模块顶层零副作用。
 */

import { backupBook } from '@abzu/core'

function argValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}

export function backupCli(argv: readonly string[]): number {
  const allowed = new Set(['--book', '--书房', '--目标'])
  const seen = new Set<string>()
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]!
    const value = argv[i + 1]
    if (!allowed.has(flag) || seen.has(flag) || value === undefined || !value.trim() || value.startsWith('--')) {
      console.error(`前置参数错误：未知或重复选项，或选项缺值：${flag}`)
      return 1
    }
    seen.add(flag)
  }
  const book = argValue(argv, 'book')?.trim()
  if (book === undefined) {
    console.error('前置参数错误：必须传 --book 书仓路径')
    return 1
  }
  try {
    const report = backupBook(book, {
      ...(argValue(argv, '书房') !== undefined ? { 书房: argValue(argv, '书房')!.trim() } : {}),
      ...(argValue(argv, '目标') !== undefined ? { 目标: argValue(argv, '目标')!.trim() } : {}),
    })
    if (report.ok) {
      console.log(JSON.stringify({
        ok: true,
        书名: report.书名,
        输出目录: report.输出目录,
        含书房: report.含书房,
        含profiles: report.含profiles,
        文件数: report.文件数,
        合计字节: report.合计字节,
        校验: report.校验,
        口径: '逐文件原始字节 SHA-256,与最小导出清单同口径；manifest.json 最后落盘并已回读复验。',
      }, null, 2))
      return 0
    }
    console.error(`备份未完成：${report.problems.join('；')}`)
    return 1
  } catch (err) {
    console.error(`一键备份异常：${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}
