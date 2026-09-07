#!/usr/bin/env bash
# 一键检查（宪法 §0）：六壳 skill 格式校验 + Markdown 体检 + 引用闭合 + 加粗密度 + TOC
# 用法：bash scripts/check.sh [--staged]
#   --staged  仅检查 git 暂存区涉及的 .md 文件（增量模式，日常快速反馈）
#   默认全量（六壳 validate + 全仓 markdownlint + 引用闭合 + 加粗密度 + TOC）
#
# 依赖与前置：
#   [1] agentskills —— pip 包 skills-ref；探测链 PATH → LOCALAPPDATA Python Scripts →
#       ~/.local/bin（详见 AGENTS.md §0）。缺失提示去向：本脚本 stdout 输出
#       「x agentskills 未找到（pip install skills-ref）」并置 fail=1
#   [2] markdownlint-cli2 —— npx --no-install 本地调用；未安装时该段输出提示，先执行一次
#       npx -y markdownlint-cli2 --version 拉取（提示去向：段内 echo）
#   [3] Python 3 —— 调用 python 命令跑 scripts/check_content.py（探测链约定见 AGENTS.md §0）
#   任一依赖缺失不静默跳过：对应段输出 x 提示并置 fail=1，末尾统一「检查未全绿，禁止提交」exit 1
#
# 维护入口（新增检查项接入位置）：
#   新增检查项 = 仿 [1][2][3] 段式追加一段「echo "[N] 标题…"; 命令 || fail=1」（编号顺延）；
#   增量口径自行决定是否参考 [2] 的 $STAGED 分支；内容类新维度先进
#   scripts/check_content.py 再由 [3] 段带入（避免本文件膨胀）
set -u -o pipefail
cd "$(dirname "$0")/.." || exit 1
fail=0
STAGED=false
[[ "${1:-}" == "--staged" ]] && STAGED=true

echo "[1] agentskills 六壳 validate..."
AS=""
command -v agentskills >/dev/null 2>&1 && AS=agentskills
if [ -z "$AS" ]; then
  AS=$(ls "${LOCALAPPDATA:-}/Programs/Python/"*/Scripts/agentskills.exe 2>/dev/null | head -1)
fi
if [ -z "$AS" ]; then
  AS=$(ls "$HOME/.local/bin/agentskills" 2>/dev/null | head -1)
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

echo "[2] markdownlint..."
if $STAGED; then
  STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.md' 2>/dev/null)
  if [ -n "$STAGED_FILES" ]; then
    npx --no-install markdownlint-cli2 $STAGED_FILES || { echo "  x markdownlint 失败——若因未安装，先执行一次: npx -y markdownlint-cli2 --version"; fail=1; }
  else
    echo "  无暂存 .md，跳过"
  fi
else
  npx --no-install markdownlint-cli2 || { echo "  x markdownlint 失败——若因未安装，先执行一次: npx -y markdownlint-cli2 --version"; fail=1; }
fi

echo "[3] 引用闭合 + 加粗密度 + TOC..."
python scripts/check_content.py || fail=1

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
