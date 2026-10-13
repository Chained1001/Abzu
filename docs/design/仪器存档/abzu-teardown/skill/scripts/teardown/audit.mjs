#!/usr/bin/env node
/**
 * audit.mjs — Stage 1a 结构审计（机械，零 LLM）
 *
 * 用法：node audit.mjs <原文.txt> [输出.json]
 *   不指定输出路径时，结果打到 stdout
 *
 * 功能：
 *   1. 章节切分（正则匹配"第N章"标题行）
 *   2. 每章字数统计（不含标题行）
 *   3. 章节号连续性检查（重复/缺失）
 *   4. 空章/疑似污染章检测
 *   5. 可用率计算
 *   6. 分卷统计（按"第N卷"或"(本卷终)"标记）
 *   7. 人名出现频次 TOP20（可选，需指定词表文件）
 *   8. 每章 sha256（供后续批次 hash 校验）
 *   9. 高潮块检测（滚动中位×倍率法——拆书方法论·节奏量化）
 *  10. 收口跳点检测（章长骤降>40%——拆书方法论·节奏量化）
 *  11. 平台标记（2合1/作者注等＝噪音；"(上)(下)"＝正常分章单列 isSplit——拆书方法论·结构标记识别）
 *  12. 作者附注检出（章尾 PS/作者的话/求票标记——只记章位与行数，不存文本；深读转述用）
 *  13. 每章正文行号（lineStart/lineEnd，1-based 与 grep -n 对齐——批次单 L起-L止 与断点③重算 sha 的地基）
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename } from 'node:path'

// ===== 常量 =====
const CH_RE = /^\s*(第[0-9零一两二三四五六七八九十百千万]+章[^\n]{0,60})/
const VOL_RE = /^\s*(第[0-9零一两二三四五六七八九十百千万]+卷[^\n]{0,40})/
const VOL_END_RE = /[(（]本卷终[)）]|本卷终！/
const NOISE_RE = /[(（](?:2合1|合1|作者注|求月票|求推荐票)[)）]/
const SPLIT_RE = /[(（](?:上|下)[)）]/ // (上)(下)＝正常分章非污染——单列 isSplit，不进噪音
const AUTHOR_NOTE_RE = /^(?:PS[:：]|P\.S\.?[:：]|ps[:：]|作者的话|作者按|作者说|求月票|求推荐票|求收藏|求鲜花|求评价票)/
const TAIL_LINES = 10 // 作者附注只在章尾扫
const HIGH_MULTIPLE = 1.8 // 高潮块倍率（滚动20章中位×1.8）
const CLIFF_DROP = 0.4 // 收口跳点（章长骤降>40%）
const CLIFF_MIN_CURR = 200 // 跳点绝对下限——空章/超短章的骤降不算结构性收口
const ROLLING_WINDOW = 20 // 滚动窗口
const SPECTRUM_SPLIT = 1.3 // 宽谱阈值（对齐 references/methods/pacing-metrics 章长倍率法适用前提 >1.3）
const PARSER_VERSION = '1.2.0' // 拆书进度.md meta 行"解析器版本"取此值

// ===== 工具函数 =====
// 中文数字→阿拉伯（分段累计：个位数暂存 sd，十百千乘入 section，万/亿结算 total）
// 覆盖：二十=20、一百零一=101、一千三百九十四=1394、两万零三=20003、第十章=10；混排（"2千3"）=NaN
export function cnToNum (s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  const digit = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
  const unit = { 十: 10, 百: 100, 千: 1000 }
  let section = 0; let sd = 0; let total = 0
  for (const ch of s) {
    if (ch in digit) {
      sd = digit[ch]
    } else if (ch in unit) {
      section += (sd || 1) * unit[ch]; sd = 0
    } else if (ch === '万' || ch === '亿') {
      total = (total + section + sd) * (ch === '万' ? 1e4 : 1e8); section = 0; sd = 0
    } else {
      return NaN
    }
  }
  return total + section + sd
}

function sha256 (text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12)
}

function median (arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// ===== 主逻辑 =====
export function audit (filePath) {
  let raw = readFileSync(filePath, 'utf8')
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1) // 剥 BOM
  const totalBytes = Buffer.byteLength(raw, 'utf8')
  const lines = raw.split(/\r?\n/) // CRLF/LF 皆容——字数与 sha 不受行尾影响

  // 章节切分＋卷标行收集（卷标收紧：整行 trim 后 ≤20 字才算卷题——防作者卷末总结段行首"第N卷"污染）
  // 两遍扫描；卷标语义按最近章题绑定：距上一章题近＝后置卷标（归所在章，如大奉式"题后几行"），
  // 距下一章题近＝题前卷标（归下一章，常规"上一卷末章尾部"布局）——两种布局都不误划前卷末章
  const titleLineIdxs = []
  const markerRaw = []
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (VOL_RE.test(trimmed) && trimmed.length <= 20) markerRaw.push(i)
    if (CH_RE.test(lines[i])) titleLineIdxs.push(i)
  }
  const volMarkerPos = markerRaw.map(m => {
    let above = -1; let below = Infinity
    for (const t of titleLineIdxs) {
      if (t <= m) { above = t } else { below = t; break }
    }
    if (above < 0) return m // 文件头卷标——绑定下一章
    return (m - above) <= (below - m) ? above : m
  })
  const chapters = []
  let curTitle = null; let curStart = 0
  for (let i = 0; i < lines.length; i++) {
    const chM = lines[i].match(CH_RE)
    if (chM) {
      if (curTitle !== null) {
        chapters.push({ title: curTitle, start: curStart, end: i })
      }
      curTitle = chM[1].trim(); curStart = i
    }
  }
  if (curTitle !== null) chapters.push({ title: curTitle, start: curStart, end: lines.length })

  // 每章统计
  let totalChars = 0
  const chData = chapters.map((ch, idx) => {
    const bodyLines = lines.slice(ch.start + 1, ch.end)
    const body = bodyLines.join('')
    const charCount = body.length
    totalChars += charCount
    const numMatch = ch.title.match(/第([0-9零一两二三四五六七八九十百万千]+)章/)
    const chNum = numMatch ? cnToNum(numMatch[1]) : NaN // CH_RE 保证命中；混排数字走 NaN 进 unparsed
    const vol = volMarkerPos.filter(p => p <= ch.start).length
    // 作者附注：章尾 TAIL_LINES 行内找首个标记行，行数＝标记行到章末（估计值，不存文本）
    const tail = bodyLines.slice(-TAIL_LINES)
    let noteStart = -1
    for (let t = 0; t < tail.length; t++) {
      if (AUTHOR_NOTE_RE.test(tail[t].trim())) { noteStart = t; break }
    }
    const authorNoteLines = noteStart >= 0 ? tail.length - noteStart : 0
    return {
      index: idx + 1,
      chNum,
      title: ch.title,
      vol: vol || null,
      charCount,
      sha: sha256(body),
      lineStart: ch.start + 2, // 1-based 正文首行（标题行=lineStart-1，与 grep -n 对齐；批次单 L起-L止 由此取）
      lineEnd: ch.end, // 1-based 正文末行
      isNoise: NOISE_RE.test(ch.title),
      isSplit: SPLIT_RE.test(ch.title), // (上)(下) 分章——正常章，不计噪音
      isVolEnd: VOL_END_RE.test(body.slice(-200)) || VOL_END_RE.test(ch.title),
      authorNoteLines
    }
  })

  // 连续性检查（卷内重编号感知：同卷内比对；无卷标且大量重复＝结构性重编号，不算错误）
  const unparsed = chData.filter(c => isNaN(c.chNum)).map(c => c.index)
  const dupes = []
  const seen = new Set()
  const byVol = new Map()
  for (const c of chData) {
    if (isNaN(c.chNum)) continue
    const key = (c.vol ?? 0) + '|' + c.chNum
    if (seen.has(key)) dupes.push(c.chNum)
    seen.add(key)
    const v = c.vol ?? 0
    if (!byVol.has(v)) byVol.set(v, new Set())
    byVol.get(v).add(c.chNum)
  }
  let gaps = []
  for (const nums of byVol.values()) {
    const sorted = [...nums].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1 && sorted[i - 1] > 0) {
        for (let g = sorted[i - 1] + 1; g < sorted[i]; g++) gaps.push(g)
      }
    }
  }
  // 编号重启检测（…86,1,2…式回落≥2 次＝卷内重编号书）——此类书的重复/缺口是结构性的，不算错误
  const parsedSeq = chData.filter(c => !isNaN(c.chNum))
  let restarts = 0
  for (let i = 1; i < parsedSeq.length; i++) {
    if (parsedSeq[i].chNum < parsedSeq[i - 1].chNum && parsedSeq[i].chNum <= 3) restarts++
  }
  let numbering = '全局编号'
  if (restarts >= 2 || (restarts >= 1 && dupes.length > chData.length * 0.3)) {
    const realVols = new Set(chData.map(c => c.vol).filter(v => v !== null && v !== undefined)).size
    numbering = realVols === 0 ? '卷内编号（无卷标）' : (restarts + 1 > realVols ? '卷内编号（卷标不全——分卷起止需人工定界）' : '卷内编号')
    dupes.length = 0
    gaps = []
  }

  // 空章与污染
  const emptyChs = chData.filter(c => c.charCount < 100).map(c => c.index)
  const noiseChs = chData.filter(c => c.isNoise).map(c => c.index)
  const usableCount = chData.filter(c => !c.isNoise && c.charCount >= 100).length
  const usableRate = chData.length ? (usableCount / chData.length * 100).toFixed(1) + '%' : 'N/A'

  // 章长统计
  const lengths = chData.filter(c => !c.isNoise).map(c => c.charCount)
  const sortedLens = [...lengths].sort((a, b) => a - b)
  const p25 = sortedLens[Math.floor(sortedLens.length * 0.25)] || 0
  const p50 = median(lengths)
  const p75 = sortedLens[Math.floor(sortedLens.length * 0.75)] || 0
  const avg = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0
  const p75p25 = p25 > 0 ? (p75 / p25).toFixed(2) : 'N/A'
  const spectrum = p75p25 !== 'N/A' ? (parseFloat(p75p25) > SPECTRUM_SPLIT ? '宽谱' : '窄谱') : 'N/A'

  // 高潮块检测（滚动中位×倍率；噪音章跳过——不启块也不断块，防单章污染把一块切两块）
  const blocks = []
  let blockStart = -1
  for (let i = 0; i < chData.length; i++) {
    if (chData[i].isNoise) continue
    const window = chData.slice(Math.max(0, i - ROLLING_WINDOW + 1), i + 1)
      .filter(c => !c.isNoise).map(c => c.charCount)
    const rm = median(window)
    const isHigh = chData[i].charCount > rm * HIGH_MULTIPLE
    if (isHigh && blockStart < 0) blockStart = i
    if (!isHigh && blockStart >= 0) {
      blocks.push({ start: blockStart + 1, end: i, count: i - blockStart })
      blockStart = -1
    }
  }
  if (blockStart >= 0) blocks.push({ start: blockStart + 1, end: chData.length, count: chData.length - blockStart })

  // 收口跳点（章长骤降>40% 且当前章 ≥200 字——空章骤降不算；前后章均须非噪音章——2合1 不造假跳点）
  const cliffs = []
  for (let i = 1; i < chData.length; i++) {
    const prev = chData[i - 1].charCount; const curr = chData[i].charCount
    if (prev > 0 && curr >= CLIFF_MIN_CURR && !chData[i].isNoise && !chData[i - 1].isNoise && (prev - curr) / prev > CLIFF_DROP) {
      cliffs.push({ after: i, drop: Math.round((prev - curr) / prev * 100) + '%' })
    }
  }

  // 分卷统计
  const vols = {}
  for (const c of chData) {
    const v = c.vol || '未标'
    if (!vols[v]) vols[v] = { start: c.index, end: c.index, count: 0, chars: 0 }
    vols[v].end = c.index; vols[v].count++; vols[v].chars += c.charCount
  }

  return {
    version: PARSER_VERSION,
    file: basename(filePath),
    totalBytes,
    totalChars,
    totalChapters: chData.length,
    usableCount,
    usableRate,
    spectrum,
    lengthStats: { p25, p50, p75, avg, p75p25 },
    chapters: chData,
    continuity: { numbering, duplicates: dupes, gaps, unparsed },
    emptyChapters: emptyChs,
    noiseChapters: noiseChs,
    splitChapters: chData.filter(c => c.isSplit).map(c => c.index),
    authorNotes: chData.filter(c => c.authorNoteLines > 0).map(c => ({ chNum: c.chNum, index: c.index, noteLines: c.authorNoteLines })),
    volumeSummary: vols,
    climaxBlocks: blocks,
    cliffPoints: cliffs,
    blockIntervals: (() => {
      if (blocks.length < 2) return { list: [], median: null } // 恒对象——消费方按 .list/.median 取值不炸
      const iv = []
      for (let i = 1; i < blocks.length; i++) iv.push(blocks[i].start - blocks[i - 1].end)
      return { list: iv, median: median(iv) }
    })()
  }
}

// ===== CLI =====
if (process.argv[1] && process.argv[1].endsWith('audit.mjs')) {
  const input = process.argv[2]
  const output = process.argv[3]
  if (!input) {
    console.error('用法：node audit.mjs <原文.txt> [输出.json]')
    process.exit(1)
  }
  try {
    const result = audit(input)
    const json = JSON.stringify(result, null, 1)
    if (result.totalChapters === 0) {
      if (output) writeFileSync(output, json, 'utf8') // 0 章也落 JSON——下游停问分支要读章数
      console.error('❌ 未识别到任何章题（第N章 格式）——检查文件格式；章题格式不同的书（序-章式标题）暂不支持')
      process.exit(1)
    }
    if (output) {
      writeFileSync(output, json, 'utf8')
      console.error(`✅ 结构审计完成：${result.totalChapters} 章，可用率 ${result.usableRate}，${result.spectrum}书（p75/p25=${result.lengthStats.p75p25}），高潮块 ${result.climaxBlocks.length} 个 → ${output}`)
    } else {
      console.log(json)
    }
  } catch (e) {
    console.error(`❌ 结构审计失败：${e.message}`)
    process.exit(1)
  }
}
