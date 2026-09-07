#!/usr/bin/env node
/**
 * build-chapter-index.js — 拆书域机械章节索引器（五列 CSV，只定位不承载语义）
 *
 * 用途：从参考书原文生成章节索引 `章节索引.csv`（拆书分析域 Stage 2 产物）——
 *   供后续一切结构块定点扩读按 source_locator 回原文，替代模型手工翻页数章。
 *
 * 用法与参数：
 *   node build-chapter-index.js --source {原文txt路径} --output {csv输出路径}
 *   --source  必填；参考书原文文本（UTF-8 编码，允许 BOM）
 *   --output  必填；输出的 CSV 路径（不存在则创建父目录）
 *   识别规则：`第N章/节/回`、`Chapter N` 为章界；`第N卷/卷N/Volume N` 为卷界（多卷重编全局章号）；
 *   序章/楔子/番外等特殊章入索引但不参与编号连续性校验；开头连续排布的目录条目块自动剔除。
 *
 * 依赖与前置：Node.js 20+，零外部依赖（仅 fs/path）；无网络访问。
 *   原文非 UTF-8（如 GBK）时拒绝处理并提示转码——不做静默乱码索引。
 *
 * 维护入口（识别规则变更时改哪里）：
 *   - 章/卷/特殊章标题的识别口径 → CHAPTER_RE / VOLUME_RE / SPECIAL_RE
 *   - 目录块剔除判定（连续条目阈值、断簇条件）→ TOC_MIN 与 detectTocRanges()
 *   - 中文数字解析（生僻数字写法报错时）→ cnNum()
 *   - 边界连续性校验口径（同卷步长 1）→ validateContinuity()
 *
 * 退出码：0 成功；1 数据违规（识别 0 章、章节编号跳变/回退）；2 参数或环境错误（缺参、
 *   文件不存在、疑似非 UTF-8 编码）。
 */
const fs = require("fs");
const path = require("path");

function getArg(args, key) {
  const i = args.indexOf(key);
  return i >= 0 ? args[i + 1] : undefined;
}

// 章界：行首（允许前导空白与 markdown #）「第N章/节/回」或「Chapter N」
const CHAPTER_RE = /^\s*#{0,4}\s*(?:第\s*([0-9一二三四五六七八九十百千两零]+)\s*[章回节]|chapter\s+(\d+))(?:\s*[::：、．.\-]|\s+)\s*(.*)$/i;
// 卷界：「第N卷」「卷N」「Volume N」
const VOLUME_RE = /^\s*#{0,4}\s*(?:第\s*([0-9一二三四五六七八九十百千两零]+)\s*卷|卷\s*([0-9一二三四五六七八九十百千两零]+)|volume\s+(\d+))\s*(.*)$/i;
// 特殊章：序章/楔子/番外等——入索引、不参与编号校验
const SPECIAL_RE = /^\s*#{0,4}\s*(序章|楔子|引子|序言|前言|序|尾声|终章|番外|后记|interlude|prologue|epilogue)\s*(.*)$/i;
// 目录块判定：连续章标题行（中间仅空行、卷行透明）且原始章号持续递增，≥ TOC_MIN 条即判为目录
const TOC_MIN = 3;

// 中文数字 → 数值；无法解析返回 null（该章跳过编号校验，不阻断索引）
function cnNum(s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const digit = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const unit = { 十: 10, 百: 100, 千: 1000 };
  let total = 0;
  let num = 0;
  for (const ch of s) {
    if (ch in digit) {
      num = digit[ch];
    } else if (ch in unit) {
      if (num === 0) num = 1; // 「十」起头＝10
      total += num * unit[ch];
      num = 0;
    } else {
      return null;
    }
  }
  return total + num;
}

function csvCell(v) {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function readSource(file) {
  let text = fs.readFileSync(file, "utf-8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const bad = (text.match(/\uFFFD/g) || []).length;
  if (text.length > 0 && bad / text.length > 0.01) return null; // 疑似非 UTF-8（如 GBK 直读）
  return text;
}

// 标记每行的界别：chapter / volume / special / text
function classify(lines) {
  // 卷标题行不含句读标点——正文叙述行（如「第二卷第1章的正文内容。」）不得误判为卷界
  const SENTENCE_PUNCT = /[。？！，；]/;
  const kinds = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (SPECIAL_RE.test(line) && !VOLUME_RE.test(line) && !CHAPTER_RE.test(line)) {
      kinds.push({ kind: "special", line });
    } else if (VOLUME_RE.test(line) && !SENTENCE_PUNCT.test(line)) {
      kinds.push({ kind: "volume", line });
    } else {
      const m = line.match(CHAPTER_RE);
      if (m) {
        const rawNo = m[1] !== undefined ? cnNum(m[1]) : m[2] !== undefined ? parseInt(m[2], 10) : null;
        const title = (m[3] || "").trim();
        kinds.push({ kind: "chapter", rawNo, title: title || m[0].trim(), line });
      } else if (line.trim() === "") {
        kinds.push({ kind: "blank", line });
      } else {
        kinds.push({ kind: "text", line });
      }
    }
  }
  return kinds;
}

// 目录块剔除：章标题行成簇（中间仅空行、卷行透明）且簇内原始章号单调递增、簇 ≥ TOC_MIN → 目录区间
function detectTocRanges(kinds) {
  const chIdx = kinds.map((k, i) => (k.kind === "chapter" ? i : -1)).filter((i) => i >= 0);
  const ranges = [];
  let cluster = [];
  const flush = () => {
    if (cluster.length >= TOC_MIN) ranges.push([cluster[0], cluster[cluster.length - 1]]);
    cluster = [];
  };
  let prevNo = null;
  for (let a = 0; a < chIdx.length; a++) {
    const i = chIdx[a];
    const k = kinds[i];
    if (cluster.length === 0) {
      cluster = [i];
      prevNo = typeof k.rawNo === "number" ? k.rawNo : null;
      continue;
    }
    // 与上一标题行之间：不允许正文行（blank/volume/special 透明）
    let hasText = false;
    for (let j = cluster[cluster.length - 1] + 1; j < i; j++) {
      if (kinds[j].kind === "text") {
        hasText = true;
        break;
      }
    }
    const asc = typeof k.rawNo === "number" && prevNo !== null && k.rawNo === prevNo + 1;
    if (hasText || !asc) {
      flush();
      cluster = [i];
    } else {
      cluster.push(i);
    }
    prevNo = typeof k.rawNo === "number" ? k.rawNo : null;
  }
  flush();
  return ranges;
}

// 边界连续性校验：同卷内可解析的相邻原始章号步长必须为 1（跨卷重置允许）
function validateContinuity(kinds, tocRanges) {
  const inToc = (i) => tocRanges.some(([a, b]) => i >= a && i <= b);
  const errors = [];
  let prev = null; // { no, line }
  for (let i = 0; i < kinds.length; i++) {
    const k = kinds[i];
    if (inToc(i)) continue;
    if (k.kind === "volume") {
      prev = null; // 卷界重置
      continue;
    }
    if (k.kind !== "chapter" || typeof k.rawNo !== "number") continue;
    if (prev !== null && k.rawNo !== prev.no + 1) {
      errors.push(`第 ${prev.no} 章之后出现「${(k.title || k.line).slice(0, 24)}」（第 ${k.rawNo} 章，第 ${i + 1} 行）——编号跳变或回退`);
    }
    prev = { no: k.rawNo, line: k.line };
  }
  return errors;
}

function buildIndex(kinds, tocRanges) {
  const inToc = (i) => tocRanges.some(([a, b]) => i >= a && i <= b);
  const bounds = [];
  for (let i = 0; i < kinds.length; i++) {
    if (inToc(i)) continue;
    const k = kinds[i];
    if (k.kind === "chapter" || k.kind === "special") bounds.push(i);
  }
  return bounds.map((start, n) => {
    const nextBound = bounds.find((b) => b > start);
    const end = (nextBound !== undefined ? nextBound : kinds.length) - 1;
    let chars = 0;
    for (let j = start + 1; j <= end; j++) chars += kinds[j].line.replace(/\s/g, "").length;
    return {
      chapter: n + 1,
      title: kinds[start].title || kinds[start].line.trim(),
      source_locator: `L${start + 1}-L${end + 1}`,
      char_count: chars,
      status: chars === 0 ? "empty" : "ok",
    };
  });
}

function main() {
  const SOURCE = getArg(process.argv, "--source");
  const OUTPUT = getArg(process.argv, "--output");
  if (!SOURCE || !OUTPUT) {
    console.error("用法: node build-chapter-index.js --source {原文txt路径} --output {csv输出路径}");
    console.error("  --source  参考书原文文本（UTF-8）");
    console.error("  --output  输出的章节索引 CSV 路径");
    process.exit(2);
  }
  if (!fs.existsSync(SOURCE) || !fs.statSync(SOURCE).isFile()) {
    console.error(`[错误] 原文文件不存在: ${SOURCE}`);
    process.exit(2);
  }
  const text = readSource(SOURCE);
  if (text === null) {
    console.error(`[错误] ${SOURCE} 疑似非 UTF-8 编码（解码出现大量替换符）——请先转码为 UTF-8 再索引`);
    process.exit(2);
  }
  const lines = text.split(/\r?\n/);
  const kinds = classify(lines);
  const tocRanges = detectTocRanges(kinds);
  const tocCount = tocRanges.reduce((n, [a, b]) => n + kinds.slice(a, b + 1).filter((k) => k.kind === "chapter").length, 0);

  const errors = validateContinuity(kinds, tocRanges);
  if (errors.length > 0) {
    console.error(`[错误] 章节边界连续性校验未通过（${errors.length} 处），索引不落盘：`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("  排查：确认原文是否缺章/重章，或章节标题写法超出识别口径（第N章/Chapter N）。");
    process.exit(1);
  }

  const rows = buildIndex(kinds, tocRanges);
  if (rows.length === 0) {
    console.error("[错误] 未识别到任何章节——原文需含「第N章/节/回」或「Chapter N」式章节标题行");
    process.exit(1);
  }

  const outDir = path.dirname(path.resolve(OUTPUT));
  fs.mkdirSync(outDir, { recursive: true });
  const csv = ["chapter,title,source_locator,char_count,status", ...rows.map((r) => [r.chapter, csvCell(r.title), r.source_locator, r.char_count, r.status].join(","))].join("\n") + "\n";
  fs.writeFileSync(OUTPUT, csv, "utf-8");

  const volumes = kinds.filter((k, i) => k.kind === "volume" && !tocRanges.some(([a, b]) => i >= a && i <= b)).length;
  console.log(`章节索引完成：共 ${rows.length} 章（${volumes} 卷界），剔除目录条目 ${tocCount} 条`);
  console.log(`输出: ${OUTPUT}`);
}

if (require.main === module) main();

module.exports = { cnNum, classify, detectTocRanges, validateContinuity, buildIndex, main };
