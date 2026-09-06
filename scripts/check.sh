#!/usr/bin/env bash
# 一键检查（宪法 §0）：六壳 skill 格式校验 + Markdown 体检 + 引用闭合 + 加粗密度 + TOC
# 用法：bash scripts/check.sh [--staged]
#   --staged  仅检查 git 暂存区涉及的 .md 文件（增量模式，日常快速反馈）
#   默认全量（六壳 validate + 全仓 markdownlint + 引用闭合 + 加粗密度 + TOC）
set -u
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
    npx --no-install markdownlint-cli2 $STAGED_FILES || fail=1
  else
    echo "  无暂存 .md，跳过"
  fi
else
  npx --no-install markdownlint-cli2 || fail=1
fi

echo "[3] 引用闭合 + 加粗密度 + TOC..."
python scripts/check_content.py || fail=1

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
