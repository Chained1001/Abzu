/**
 * 草稿清理脚本的 CLI 逻辑(批8,0.0.57 存量清理)。
 *
 * 0.0.57 起定稿入档即清本章草稿区五处(草稿/材料包/审核记录/待定稿包/候选细纲);本脚本收拾
 * **存量书**——列出「已定稿但草稿区残留」的章键与将删路径计数,默认只算不写;`--执行 true`
 * 时逐章调 archiveDraftChapter＋snapshotDraft 留痕。argv 进、退出码出,模块顶层零副作用。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { archiveDraftChapter, draftChapterResidue, listChapters, paths, snapshotDraft } from '@abzu/core'

function argValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}

export function draftCleanupCli(argv: readonly string[]): number {
  const allowed = new Set(['--book', '--卷', '--执行'])
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
  const 卷Raw = argValue(argv, '卷')
  let 卷: number | undefined
  if (卷Raw !== undefined) {
    卷 = Number(卷Raw)
    if (!Number.isInteger(卷) || 卷 < 1) {
      console.error('前置参数错误：--卷 须为正整数')
      return 1
    }
  }
  const 执行 = argValue(argv, '执行')?.trim() === 'true'
  try {
    if (!fs.existsSync(book) || !fs.statSync(book).isDirectory()) {
      console.error(`书仓不存在：${path.resolve(book)}`)
      return 1
    }
    // 已定稿但草稿区残留:定稿章在盘,且五处候选路径至少一处仍在
    const finalized = listChapters(book)
      .filter((key) => key.章 > 0)
      .filter((key) => 卷 === undefined || key.卷 === 卷)
      .filter((key) => fs.existsSync(path.join(book, paths.定稿章(key.卷, key.章, key.章名))))
      .map((key) => ({ key, residue: draftChapterResidue(book, key) }))
      .filter((item) => item.residue.length > 0)
    const 将删路径数 = finalized.reduce((sum, item) => sum + item.residue.length, 0)
    if (!执行) {
      console.log(JSON.stringify({
        ok: true,
        模式: '预览（只算不写；--执行 true 逐章清理＋快照）',
        残留章数: finalized.length,
        将删路径数,
        章: finalized.map((item) => ({
          键: `卷${String(item.key.卷).padStart(2, '0')}-第${String(item.key.章).padStart(4, '0')}章-${item.key.章名}`,
          残留路径: item.residue,
        })),
        说明: '只删草稿区五处工件（草稿/材料包/审核记录/待定稿包/候选细纲），不碰真源与定稿。',
      }, null, 2))
      return 0
    }
    const results: Array<Record<string, unknown>> = []
    let failures = 0
    for (const item of finalized) {
      try {
        const cleanup = archiveDraftChapter(book, item.key)
        const snap = snapshotDraft(book, `定稿后清理:卷${String(item.key.卷).padStart(2, '0')}-${item.key.章名}`)
        results.push({ 键: `卷${String(item.key.卷).padStart(2, '0')}-第${String(item.key.章).padStart(4, '0')}章-${item.key.章名}`, 已删: cleanup.removed.length, 快照: snap.committed ? '已提交' : '无变化' })
      } catch (err) {
        failures += 1
        results.push({ 键: `卷${String(item.key.卷).padStart(2, '0')}-第${String(item.key.章).padStart(4, '0')}章-${item.key.章名}`, 失败: err instanceof Error ? err.message : String(err) })
      }
    }
    console.log(JSON.stringify({ ok: failures === 0, 模式: '执行', 清理章数: results.length, 失败章数: failures, 章: results }, null, 2))
    return failures === 0 ? 0 : 1
  } catch (err) {
    console.error(`草稿清理异常：${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}
