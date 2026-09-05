# 规格：013 · 多技能骨架切换（六域壳 + scan 迁入）

> 本规格自包含。施工前先读仓库根 AGENTS.md。施工方只动本规格「文件级改动清单」列出的文件；docs/ 下任何文件不得触碰（治理文档由规划方在核验提交时同步）。

## 背景与目标

作者拍板：Abzu 终态为多技能套件（六域各一 skill + 未来 abzu-setup），地基按终态提前铺设（十层楼地基论）。本批完成骨架切换：单壳 `skills/abzu/` 拆分为六域 skill 目录，scan 域全部内容迁入 `skills/abzu-scan/`，五域占位壳就位（如实告知未建设），中央路由退役（各壳自带入口判定），一键检查升级为六壳循环。

## 现状事实（2026-09-06 实测锚点）

- `skills/abzu/`：SKILL.md（43 行总控：会话恢复协议/域路由表/门控与交互/语言）+ references/scan/（10 份文件）+ scripts/（7 个脚本）
- scripts 内部引用均为 `{SKILL_DIR}/scripts/...` 与 `require("./cdp-utils")` 形态；references/scan 内部引用均为 `references/scan/scan-*.md` 形态——**保持子目录结构不变即可零路径修改**
- scan-collection-guide.md L32：「`{SKILL_DIR}` 指当前加载的 abzu skill 根目录」
- scan-workflow.md 中断契约：「……移交 SKILL.md 路由，不强行走完本域流程」（需微调为多技能口径）
- scripts/check.sh：单壳 validate（`agentskills validate skills/abzu`）

## 文件级改动清单

### 1. 目录迁移 [A]（git mv，零内容改动）

```bash
mkdir -p skills/abzu-scan/references
git mv skills/abzu/references/scan skills/abzu-scan/references/scan
git mv skills/abzu/scripts skills/abzu-scan/scripts
```

迁移后内部相对引用（`references/scan/scan-*.md`、`{SKILL_DIR}/scripts/*.js`、`require("./cdp-utils")`）全部保持有效——**文件内容一个字符都不改**。

### 2. 新建 `skills/abzu-scan/SKILL.md` [A]（逐字）

```markdown
---
name: abzu-scan
description: 扫榜调研——网文市场题材调研与选题决策。当用户想扫榜调研、看平台榜单、分析市场题材趋势、选题决策，或提到扫榜、榜单、市场题材时使用。触发方式：/abzu-scan 或上述任一话题的自然语言。边界：仅适用于网文市场调研与选题；写正文、列大纲等属 Abzu 其他域（/abzu-outline 等）。
license: MIT
metadata:
  version: "0.3.0"
---

# Abzu · 扫榜调研（scan）

基于榜单样本识别网文市场格局，产出题材候选、可行性评估与验证动作。

## 入口判定（每次会话开始）

1. 当前目录存在 `扫榜/` 目录 → 读取其中最新一次扫榜产物（报告与选题决策），汇报现状，问「继续扫榜还是看已有结论？」
2. 不存在 → 全新扫榜，进入 Stage 1。
3. 用户意图属于其他 Abzu 域（写正文、列大纲等）→ 告知对应域命令（/abzu-outline 等）及其建设状态，不在本域内执行。
4. 状态判定只看文件证据，不凭对话记忆。

## 工作流

按 references/scan/scan-workflow.md 的 Stage 1-5 执行；每步的停靠点、异常分支与交互方式以该文件为准。

## 门控与交互原则

- Stage 间停靠：关键产物（扫榜报告、选题决策）产出后经确认才推进；确认点一律明确问出。
- 产物检查是提示不是门禁：依赖产物缺失时提示用户，不擅自代建。
- 封闭选择用 AskUserQuestion 结构化选项（候选 ≤4），开放采集用对话，过程性动作默认执行且可跳过。
- 话术零黑话：不向用户暴露内部术语与文件机制。
- 不粘会话：用户转入与扫榜无关的任务时正常执行，不套用本域框架，也不询问是否退出。

## 语言

跟随用户的语言回复；中文遵循《中文文案排版指北》。
```

### 3. 新建五个占位壳 [A]（逐字，仅 {域名/定位句} 按下表替换）

占位壳模板（`skills/abzu-{键}/SKILL.md`）：

```markdown
---
name: abzu-{键}
description: {定位句}。**当前未建设**：触发后仅告知规划状态，不产出任何内容、不模拟、不用其他域顶替。触发方式：/abzu-{键}。
license: MIT
metadata:
  version: "0.1.0"
---

# Abzu · {中文名}（未建设）

本域属于 Abzu 网文写作六域之一，**当前尚未建设**。

- 被触发时：如实告知本域未上线与规划定位，不模拟、不用其他域顶替。
- 建设完成后，本文件将替换为该域的入口与工作流索引。

## 语言

跟随用户的语言回复。
```

五壳替换表：

| 键 | 中文名 | 定位句 |
| --- | --- | --- |
| analyze | 拆书分析 | 拆书分析——对标书拆解、套路结构分析、参考候选验证 |
| outline | 大纲 | 大纲——故事核心、世界观、人物与全书骨架设计 |
| volume | 卷纲 | 卷纲——单卷规划、卷内结构与收卷判断 |
| write | 正文 | 正文——章纲生成与章节撰写、修改润色 |
| style | 文风 | 文风——文风画像、语言风格调校与仿写 |

### 4. 删除 `skills/abzu/SKILL.md` [A]

旧总控退役：会话恢复协议分解为六壳「入口判定」；域路由表退役（skill 名即命令，六壳各自响应）；门控与语言条目已入各壳。
随后清理空目录：`rmdir skills/abzu/references skills/abzu`（**验收前提，否则"skills/abzu 不存在"不成立**）。

### 5. 更新 `scripts/check.sh` [A]（整文件替换为以下内容）

```bash
#!/usr/bin/env bash
# 一键检查（宪法 §0）：六壳 skill 格式校验 + Markdown 体检
# 用法：bash scripts/check.sh
set -u
cd "$(dirname "$0")/.." || exit 1
fail=0

AS=""
command -v agentskills >/dev/null 2>&1 && AS=agentskills
if [ -z "$AS" ]; then
  AS=$(ls "$LOCALAPPDATA/Programs/Python/"*/Scripts/agentskills.exe 2>/dev/null | head -1)
fi
if [ -z "$AS" ]; then
  echo "x agentskills 未找到（pip install skills-ref）"
  fail=1
fi

for d in skills/abzu-*/; do
  if [ -n "$AS" ]; then
    "$AS" validate "$d" || fail=1
  else
    fail=1
  fi
done

npx -y markdownlint-cli2 || fail=1

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
```

### 6. 微调两处文案 [B]（文案逐字，位置自定）

- `skills/abzu-scan/references/scan/scan-workflow.md`：中断契约句「移交 SKILL.md 路由」→「移交对应域（建议用户使用对应 /abzu-<域> 命令）」
- `skills/abzu-scan/references/scan/scan-collection-guide.md`：「指当前加载的 abzu skill 根目录」→「指当前加载的 abzu-scan skill 根目录」

## 禁止事项

- 禁止修改迁移文件的任何内容（§1 为纯 git mv，内容逐字节不变；§6 的两处文案替换为唯一例外）
- 禁止修改 docs/ 下任何文件、CHANGELOG.md、AGENTS.md
- 禁止创建 abzu-setup（T1 触发时才诞生）
- 禁止 git commit / push；禁止运行联网采集

## 验收标准（施工方自核验 + 规划方独立复跑）

- [ ] `skills/` 下恰有 6 个 skill 目录（abzu-scan + 五占位），`skills/abzu/` 不存在
- [ ] 六壳 `agentskills validate` 全过（name 与目录同名）
- [ ] 迁移零内容改动：references/scan 10 文件中 9 个 R 100%，scan-workflow.md 为 R 且仅含 §6 两处文案微调；scripts 7 脚本 R 100%
- [ ] `node --check` 7/7；grep 断言：四脚本「平台改版维护入口」各=1、「选择器失效」各≥1
- [ ] 五占位壳各含「当前尚未建设」；abzu-scan 含「入口判定」「不粘会话」
- [ ] `bash scripts/check.sh` 全绿；`npx markdownlint-cli2` 0 违例
- [ ] git status 仅含预期 rename/add/modify

## 提交

施工方不提交。完成后输出【核验请求】——整段包在单个代码块里（格式见 AGENTS.md §3.8 与 docs/specs/collab-log.md）。
治理文档同步（AGENTS.md/README/architecture/file-conventions/CHANGELOG）由**规划方**在核验提交时完成，施工方不得触碰。
