#!/usr/bin/env node
/**
 * validate.mjs — Stage 1b 批次定稿门禁（批次缓存合规检查）
 *
 * 用法：node validate.mjs <原文.txt> <批次缓存.md> [audit.json] [章节索引.csv]
 *
 * 本文件承担三项（五项门禁的分工——泄漏检查已按 2026-10-03 版权裁定移除）：
 *   ① 缓存四节齐——批次缓存含"跨批状态/逐章事实/跨章观察/自查"四节＋末行完整 cache-end 标记
 *   ② 范围 hash（有 audit＋csv 时）——缓存章集合按行号段对原文重算 sha，与 audit 记录及 CSV sha 列双比对（不一致=原文漂移或 CSV 被改→该批失效）
 *   ③ 字数容差——索引行摘要 50-100 字、深读深卡 200-400 字，均 ±5（按扫描工任务书行格式解析）
 *   其余两项别处承担：字段计数＝扫描工缓存"自查"节 Grep 计数；CSV 写后校验＝index.mjs verify
 */

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parseCsvLine } from './index.mjs'

function sha256 (text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12)
}

const CACHE_SECTIONS = ['跨批状态', '逐章事实', '跨章观察', '自查']

// ===== 检查 ①：缓存四节齐＋末行 cache-end 完整形态 =====
function checkCacheSections (cacheText) {
  const errors = []
  for (const sec of CACHE_SECTIONS) {
    if (!cacheText.includes(`### ${sec}`)) {
      errors.push(`缺缓存节"### ${sec}"`)
    }
  }
  const lastLine = cacheText.trimEnd().split('\n').pop().trim()
  if (!/^<!--\s*teardown:cache-end:.+\s*-->$/.test(lastLine)) {
    errors.push(`末行须为完整 cache-end 标记（<!-- teardown:cache-end:{批次ID} -->），实际末行：${lastLine.slice(0, 30)}`)
  }
  return errors
}

// ===== 检查 ③：字数容差（按扫描工任务书行格式分则检查）=====
// 轻扫索引行：第{N}章|{章名}|摘要|{50-100字}|…（要点行 `- 要点|N|k|…` 不命中此模式）
// 深读深卡行：- 深卡|{200-400字}
function checkWordCount (cacheText) {
  const errors = []
  const warnings = []
  let summaries = 0
  let deepCards = 0
  for (const m of cacheText.matchAll(/(第[0-9零一二三四五六七八九十百千万]+章)\|[^|\n]*\|摘要\|([^|\n]+)/g)) {
    const len = m[2].trim().length
    summaries++
    if (len < 45) errors.push(`${m[1]} 索引行摘要 ${len} 字（下限 45）`)
    else if (len > 105) warnings.push(`${m[1]} 索引行摘要 ${len} 字（上限 105）`)
  }
  for (const m of cacheText.matchAll(/^- 深卡\|([^|\n]+)/gm)) {
    const len = m[1].trim().length
    deepCards++
    if (len < 195) errors.push(`深卡 ${len} 字（下限 195）`)
    else if (len > 405) warnings.push(`深卡 ${len} 字（上限 405）`)
  }
  return { errors, warnings, checked: summaries + deepCards, summaries, deepCards }
}

// ===== 检查 ②：范围 hash（有 audit＋可选 csv 时）——缓存章集合重算 sha，对 audit 与 CSV 双比对 =====
// 索引行/要点行的 {N}＝全局章序（audit 的 index＝CSV 全局章序列，协议钉死——非章题原文编号；
// 卷内编号书按 chNum 找会错章，此处一律按下标定位）
function checkScopeHash (cacheText, originalLines, audit, csvPath) {
  const errors = []
  const ids = []
  for (const m of cacheText.matchAll(/第(\d+)章\|/g)) {
    const n = parseInt(m[1], 10)
    if (!ids.includes(n)) ids.push(n)
  }
  if (ids.length === 0) return { errors, checked: 0, mismatches: 0 }
  const csvSha = new Map()
  if (csvPath) {
    const rows = readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(l => l.trim())
    for (const line of rows.slice(1)) {
      const cells = parseCsvLine(line)
      if (cells.length >= 9 && /^\d+$/.test(cells[0])) csvSha.set(parseInt(cells[0]), cells[8])
    }
  }
  let mismatches = 0
  for (const id of ids) {
    const ch = audit.chapters[id - 1]
    if (!ch || ch.index !== id) {
      errors.push(`第${id}章 超出 audit 章数（共 ${audit.chapters.length}）——缓存 {N} 应为全局章序而非章题编号`)
      continue
    }
    const recomputed = sha256(originalLines.slice(ch.lineStart - 1, ch.lineEnd).join(''))
    if (recomputed !== ch.sha) {
      mismatches++
      if (mismatches <= 3) errors.push(`全局第${id}章 sha 与 audit 不一致（原文可能漂移）`)
    }
    const csv = csvSha.get(id)
    if (csv !== undefined && csv !== recomputed) {
      mismatches++
      if (mismatches <= 3) errors.push(`全局第${id}章 CSV sha 列与重算不一致（CSV 被改或 audit 重跑过）`)
    }
  }
  return { errors, checked: ids.length, mismatches }
}

// ===== 主逻辑 =====
export function validate (originalPath, cachePath, auditPath, csvPath) {
  let original = readFileSync(originalPath, 'utf8')
  if (original.charCodeAt(0) === 0xFEFF) original = original.slice(1)
  const originalLines = original.split(/\r?\n/)
  const cache = readFileSync(cachePath, 'utf8')
  const audit = auditPath ? JSON.parse(readFileSync(auditPath, 'utf8')) : null

  const results = {
    pass: true,
    checks: {},
    errors: [],
    warnings: []
  }

  // ① 缓存四节
  const secErrors = checkCacheSections(cache)
  results.checks.sections = secErrors.length === 0 ? '✅' : `🔴 ${secErrors.join('; ')}`
  results.errors.push(...secErrors)

  // ③ 字数容差（按扫描工行格式分则）
  const wc = checkWordCount(cache)
  results.checks.wordCount = wc.errors.length === 0
    ? `✅ 摘要 ${wc.summaries} 条＋深卡 ${wc.deepCards} 条`
    : `🔴 ${wc.errors.length} 条不达标`
  if (wc.checked === 0) {
    results.warnings.push('未检出索引行摘要或深卡行（追踪模式缓存正常；轻扫/深读批＝缓存格式与任务书不符的警示）')
  }
  results.errors.push(...wc.errors)
  results.warnings.push(...wc.warnings)

  // ② 范围 hash（有 audit 时真比对）
  if (audit) {
    const sh = checkScopeHash(cache, originalLines, audit, csvPath)
    results.checks.hash = sh.mismatches === 0 && sh.errors.length === 0
      ? `✅ ${sh.checked} 章重算一致`
      : `🔴 ${sh.mismatches} 处不一致`
    results.errors.push(...sh.errors)
  }

  results.pass = results.errors.length === 0
  return results
}

// ===== CLI =====
if (process.argv[1] && process.argv[1].endsWith('validate.mjs')) {
  const originalPath = process.argv[2]
  const cachePath = process.argv[3]
  const auditPath = process.argv[4]
  const csvPath = process.argv[5]
  if (!originalPath || !cachePath) {
    console.error('用法：node validate.mjs <原文.txt> <批次缓存.md> [audit.json] [章节索引.csv]')
    process.exit(1)
  }
  try {
    const r = validate(originalPath, cachePath, auditPath, csvPath)
    console.error('\n📋 批次定稿门禁检查（本文件三项）')
    console.error(`  ① 缓存四节齐：${r.checks.sections || '跳过'}`)
    console.error(`  ③ 字数容差：${r.checks.wordCount || '跳过'}`)
    if (r.checks.hash) console.error(`  ② 范围 hash：${r.checks.hash}`)
    console.error(`\n${r.pass ? '✅ 全部通过' : `❌ ${r.errors.length} 个错误`}`)
    for (const e of r.errors) console.error(`  🔴 ${e}`)
    for (const w of r.warnings) console.error(`  ⚠ ${w}`)
    process.exit(r.pass ? 0 : 1)
  } catch (e) {
    console.error(`❌ validate 失败：${e.message}`)
    process.exit(1)
  }
}
