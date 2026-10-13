#!/usr/bin/env node
/**
 * index.mjs — Stage 1b 章节索引生成与校验
 *
 * 三个子命令：
 *   generate — 从 audit.json 生成空索引 CSV（摘要列留空，AI 批量填）
 *   verify   — 校验已填的 CSV（行数/列数/sha/摘要长度/漏行）
 *   stats    — 统计填充进度
 *
 * 用法：
 *   node index.mjs generate <audit.json> [输出.csv]
 *   node index.mjs verify <audit.json> <已填.csv>
 *   node index.mjs stats <已填.csv>
 */

import { readFileSync, writeFileSync } from 'node:fs'

// CSV 表头（12 列——与拆书产物模板 §二 恒等）
const HEADER = '全局章序,卷号,卷内章号,章名,字数,参与人物,位置标记,一句话摘要,sha256,剧情强度,情绪类型,备注'

export function parseCsvLine (line) {
  const cells = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ } else if (ch === '"') { inQuote = false } else { cur += ch }
    } else {
      if (ch === '"') { inQuote = true } else if (ch === ',') { cells.push(cur); cur = '' } else { cur += ch }
    }
  }
  cells.push(cur)
  return cells
}

function escapeCsv (s) {
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

// 引号感知的记录切分：引号单元格内的换行不拆记录（引号数为偶数＝记录完整）
export function splitRecords (csv) {
  const records = []
  let buf = ''
  for (const ln of csv.split(/\r?\n/)) {
    buf = buf ? buf + '\n' + ln : ln
    if (((buf.match(/"/g) || []).length) % 2 === 0) { records.push(buf); buf = '' }
  }
  if (buf.trim()) records.push(buf)
  return records.filter(l => l.trim())
}

// ===== generate =====
export function generate (auditJsonPath, outputPath) {
  const audit = JSON.parse(readFileSync(auditJsonPath, 'utf8'))
  const rows = [HEADER]
  let volInner = 0
  let lastVol = null
  for (const ch of audit.chapters) {
    if (ch.vol !== lastVol) { volInner = 0; lastVol = ch.vol }
    volInner++
    const cells = [
      ch.index,
      ch.vol || '',
      volInner,
      escapeCsv(ch.title),
      ch.charCount,
      '', // 参与人物——AI 填
      '', // 位置标记——AI 填
      '', // 一句话摘要——AI 填
      ch.sha,
      '', // 剧情强度——AI 填（S3 可选）
      '', // 情绪类型——AI 填（S3 可选）
      '' // 备注
    ]
    rows.push(cells.join(','))
  }
  const csv = rows.join('\n') + '\n'
  if (outputPath) {
    writeFileSync(outputPath, csv, 'utf8')
    return { total: audit.chapters.length, output: outputPath }
  }
  return { total: audit.chapters.length, csv }
}

// ===== verify =====
export function verify (auditJsonPath, csvPath) {
  const audit = JSON.parse(readFileSync(auditJsonPath, 'utf8'))
  const csv = readFileSync(csvPath, 'utf8')
  const lines = splitRecords(csv)
  const errors = []
  const warnings = []

  // 检查 1：表头恒等
  if (lines[0] !== HEADER) {
    errors.push(`表头不匹配：期望 "${HEADER.slice(0, 50)}…"，实际 "${lines[0].slice(0, 50)}…"`)
  }

  // 检查 2：行数
  const dataLines = lines.slice(1)
  if (dataLines.length !== audit.chapters.length) {
    errors.push(`行数不匹配：期望 ${audit.chapters.length} 行，实际 ${dataLines.length} 行`)
  }

  // 检查 3：逐行校验
  let emptySummaries = 0
  let shortSummaries = 0
  let shaMismatches = 0
  const summaryRange = { min: Infinity, max: 0 }

  for (let i = 0; i < Math.min(dataLines.length, audit.chapters.length); i++) {
    const cells = parseCsvLine(dataLines[i])
    const ch = audit.chapters[i]

    // 列数
    if (cells.length !== 12) {
      errors.push(`第${i + 1}行列数=${cells.length}，期望 12`)
      continue
    }

    // 章序
    if (parseInt(cells[0]) !== ch.index) {
      errors.push(`第${i + 1}行章序=${cells[0]}，期望=${ch.index}`)
    }

    // sha256
    if (cells[8] !== ch.sha) {
      // sha 变了可能是原文被改——标 warning 不标 error（可能是 audit 重跑）
      shaMismatches++
      if (shaMismatches <= 3) warnings.push(`第${i + 1}行 sha 不匹配（原文可能被改过）`)
    }

    // 摘要
    const summary = cells[7].trim()
    if (!summary) {
      emptySummaries++
    } else {
      const len = summary.length
      summaryRange.min = Math.min(summaryRange.min, len)
      summaryRange.max = Math.max(summaryRange.max, len)
      if (len < 45) {
        shortSummaries++
        if (shortSummaries <= 3) warnings.push(`第${i + 1}行摘要过短（${len} 字，建议 50-100 字）`)
      }
      if (len > 105) {
        warnings.push(`第${i + 1}行摘要过长（${len} 字，建议 50-100 字）`)
      }
    }
  }

  if (emptySummaries > 0) warnings.push(`${emptySummaries} 行摘要为空（待 AI 填充或已遗漏）`)
  if (shaMismatches > 3) warnings.push(`共 ${shaMismatches} 行 sha 不匹配（原文可能被修改，建议重跑 audit）`)

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalRows: dataLines.length,
      expectedRows: audit.chapters.length,
      emptySummaries,
      shortSummaries,
      shaMismatches,
      summaryLengthRange: emptySummaries < dataLines.length
        ? `${summaryRange.min === Infinity ? 0 : summaryRange.min}-${summaryRange.max} 字`
        : 'N/A'
    }
  }
}

// ===== stats =====
export function stats (csvPath) {
  const csv = readFileSync(csvPath, 'utf8')
  const lines = splitRecords(csv)
  const dataLines = lines.slice(1)
  let filled = 0; let empty = 0; let withChars = 0; let withLoc = 0; let skipped = 0
  for (const line of dataLines) {
    const cells = parseCsvLine(line)
    if (cells.length < 12) { skipped++; continue }
    if (cells[7].trim()) filled++; else empty++
    if (cells[5].trim()) withChars++
    if (cells[6].trim()) withLoc++
  }
  return {
    total: dataLines.length,
    summaryFilled: filled,
    summaryEmpty: empty,
    fillRate: dataLines.length ? (filled / dataLines.length * 100).toFixed(1) + '%' : 'N/A',
    charactersFilled: withChars,
    locationFilled: withLoc,
    malformedRows: skipped
  }
}

// ===== CLI =====
if (process.argv[1] && process.argv[1].endsWith('index.mjs')) {
  const cmd = process.argv[2]
  if (!cmd || !['generate', 'verify', 'stats'].includes(cmd)) {
    console.error('用法：')
    console.error('  node index.mjs generate <audit.json> [输出.csv]  — 生成空索引 CSV')
    console.error('  node index.mjs verify <audit.json> <已填.csv>     — 校验已填 CSV')
    console.error('  node index.mjs stats <已填.csv>                   — 填充进度统计')
    process.exit(1)
  }
  try {
    if (cmd === 'generate') {
      const result = generate(process.argv[3], process.argv[4])
      if (result.output) {
        console.error(`✅ 索引生成：${result.total} 章 → ${result.output}`)
      } else {
        console.log(result.csv)
      }
    } else if (cmd === 'verify') {
      const result = verify(process.argv[3], process.argv[4])
      if (result.pass) {
        console.error(`✅ 校验通过：${result.stats.totalRows} 行`)
        for (const w of result.warnings) console.error(`  ⚠ ${w}`)
      } else {
        console.error(`❌ 校验失败：${result.errors.length} 个错误`)
        for (const e of result.errors.slice(0, 10)) console.error(`  🔴 ${e}`)
        if (result.errors.length > 10) console.error(`  …另有 ${result.errors.length - 10} 个错误`)
        for (const w of result.warnings) console.error(`  ⚠ ${w}`)
        process.exit(1)
      }
    } else if (cmd === 'stats') {
      const result = stats(process.argv[3])
      console.error(`📊 索引进度：${result.total} 章 | 摘要已填 ${result.summaryFilled}（${result.fillRate}）| 人物已填 ${result.charactersFilled} | 位置已填 ${result.locationFilled}`)
    }
  } catch (e) {
    console.error(`❌ ${cmd} 失败：${e.message}`)
    process.exit(1)
  }
}
