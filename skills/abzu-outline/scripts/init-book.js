#!/usr/bin/env node
/**
 * init-book.js — 书项目脚手架（大纲域，确定性工作归脚本）
 *
 * 用途：在当前目录创建写作项目骨架——五目录（设定/大纲/追踪/采风/文风）＋五份产物
 *   初稿（project.md、大纲/总纲.md、设定/设定集.md、文风/文风指南.md、大纲/打磨报告.md）
 *   ＋初始化 创作进度.md（当前阶段＝未开始）。人物卡模板不落位（Stage 2 按角色实例化）；
 *   追踪/、采风/ 只建目录不落文件。产物初稿正文取自 references/outline/ 各 template 文件
 *   的「模板正文」节围栏（单一真源，本脚本只搬运不存副本）。
 *
 * 用法与参数：
 *   node init-book.js [--dry-run]
 *   --dry-run  只输出创建计划与现状检查，不落盘
 *   幂等：已存在的文件与目录跳过并报告，不覆盖不重建。
 *
 * 依赖与前置：Node.js 20+，零外部依赖（仅 fs/path），无网络访问；模板文件随 skill
 *   安装分发（脚本按 __dirname 相对定位 references/outline/），缺失或无「模板正文」
 *   围栏即环境错误（退出 2）。当前目录不可写时报环境错误（退出 2）。
 *
 * 维护入口：
 *   - 目录与落位映射 → DIRS / FILES 两个常量
 *   - 模板正文提取口径（「模板正文」节下第一个围栏）→ extractBody()
 *   - 创作进度初始文本 → progressInit()
 *
 * 退出码：0 成功（含全部已存在跳过）；1 结构冲突（目录位被同名文件占用等，
 *   冲突时不落任何盘）；2 参数或环境错误（未知参数、模板缺失或无围栏、目录不可写）。
 */
const fs = require("fs");
const path = require("path");

// ── 参数解析 ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== "--dry-run");
if (unknown.length > 0) {
  console.error("未知参数：" + unknown.join(" ") + "——用法：node init-book.js [--dry-run]");
  process.exit(2);
}
const DRY = args.includes("--dry-run");

// ── 目录与落位映射（维护入口）───────────────────────────────────────────
const REF_DIR = path.join(__dirname, "..", "references", "outline");
const DIRS = ["设定", "大纲", "追踪", "采风", "文风"];
const FILES = [
  { dest: "project.md", template: "outline-project-template.md" },
  { dest: path.join("大纲", "总纲.md"), template: "outline-master-outline-template.md" },
  { dest: path.join("设定", "设定集.md"), template: "outline-settings-template.md" },
  { dest: path.join("文风", "文风指南.md"), template: "outline-style-guide-template.md" },
  { dest: path.join("大纲", "打磨报告.md"), template: "outline-polish-report-template.md" },
];

// 从模板文件提取「模板正文」节下的第一个围栏内容（维护入口：口径变更改这里）
function extractBody(templateFile) {
  const full = path.join(REF_DIR, templateFile);
  if (!fs.existsSync(full)) {
    return { err: "模板文件缺失：" + full + "（skill 安装不完整）" };
  }
  const text = fs.readFileSync(full, "utf-8");
  const head = text.match(/^## 模板正文\s*$/m);
  if (!head) {
    return { err: "模板无「模板正文」节：" + templateFile };
  }
  const after = text.slice(head.index + head[0].length);
  const fence = after.match(/^```[^\n]*\n([\s\S]*?)\n?^```\s*$/m);
  if (!fence) {
    return { err: "「模板正文」节下无围栏：" + templateFile };
  }
  return { body: fence[1].replace(/\s+$/, "") + "\n" };
}

// 创作进度初始文本（维护入口：字段口径见 references/outline/outline-schemas.md「创作进度」节）
function progressInit() {
  const now = new Date().toISOString().slice(0, 19);
  return [
    "# 创作进度",
    "",
    "- 当前阶段：未开始",
    "- 上一阶段：—",
    "- 当前焦点：书项目脚手架已建立",
    "- 最新更新时间：" + now,
    "- 风格路径：（volume→write 过渡时写入，本阶段留空）",
    "",
    "## 产物状态表",
    "",
    "| 时间 | 产物 | 状态 |",
    "| --- | --- | --- |",
    "| " + now + " | 书项目脚手架 | 已创建（init-book.js） |",
    "",
  ].join("\n");
}

// ── 第一阶段：提取模板＋收集计划与冲突（冲突时不落任何盘）────────────────
const contents = new Map();
for (const f of FILES) {
  const r = extractBody(f.template);
  if (r.err) {
    console.error(r.err);
    process.exit(2);
  }
  contents.set(f.dest, r.body);
}

const mkDirs = []; // 待创建目录
const mkFiles = []; // 待写入文件 { dest, kind }
const skipped = []; // 已存在跳过项
const conflicts = []; // 结构冲突项

for (const d of DIRS) {
  if (fs.existsSync(d)) {
    if (fs.statSync(d).isDirectory()) {
      skipped.push(d + "/");
    } else {
      conflicts.push("目录位被同名文件占用：" + d + "（是文件不是目录）");
    }
  } else {
    mkDirs.push(d);
  }
}

const allFiles = FILES.map((f) => ({ dest: f.dest, kind: "模板初稿" })).concat([
  { dest: "创作进度.md", kind: "状态机初始化" },
]);
for (const f of allFiles) {
  if (fs.existsSync(f.dest)) {
    skipped.push(f.dest);
  } else {
    mkFiles.push(f);
  }
}

if (conflicts.length > 0) {
  for (const c of conflicts) console.error("结构冲突：" + c);
  console.error("存在结构冲突，未落任何盘——处理后重跑（幂等）");
  process.exit(1);
}

// ── 第二阶段：落盘（或 dry-run 只输出计划）──────────────────────────────
if (DRY) {
  console.log("[dry-run] 创建计划（不落盘）：");
  for (const d of mkDirs) console.log("  + 目录 " + d + "/");
  for (const f of mkFiles) console.log("  + 文件 " + f.dest + "（" + f.kind + "）");
  for (const s of skipped) console.log("  = 已存在跳过 " + s);
  console.log("[dry-run] 共 " + (mkDirs.length + mkFiles.length) + " 项待创建，" + skipped.length + " 项跳过");
  process.exit(0);
}

for (const d of mkDirs) {
  fs.mkdirSync(d);
  console.log("+ 目录 " + d + "/");
}
for (const f of mkFiles) {
  const body = f.dest === "创作进度.md" ? progressInit() : contents.get(f.dest);
  try {
    fs.writeFileSync(f.dest, body, "utf-8");
  } catch (e) {
    console.error("写入失败：" + f.dest + "——" + e.message);
    process.exit(2);
  }
  console.log("+ 文件 " + f.dest + "（" + f.kind + "）");
}
for (const s of skipped) console.log("= 已存在跳过 " + s);

console.log("书项目脚手架就绪：新建 " + (mkDirs.length + mkFiles.length) + " 项，跳过 " + skipped.length + " 项；创作进度初始状态＝未开始");
