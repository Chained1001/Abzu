#!/usr/bin/env bash
# 一键检查（宪法 §0）：skill 格式校验 + Markdown 体检
# 用法：bash scripts/check.sh
set -u
cd "$(dirname "$0")/.." || exit 1
fail=0

# 1) skill 格式校验（agentskills 可能不在 PATH，探测链见宪法 §0）
AS=""
command -v agentskills >/dev/null 2>&1 && AS=agentskills
if [ -z "$AS" ]; then
  AS=$(ls "$LOCALAPPDATA/Programs/Python/"*/Scripts/agentskills.exe 2>/dev/null | head -1)
fi
if [ -z "$AS" ]; then
  echo "x agentskills 未找到（pip install skills-ref）"
  fail=1
else
  "$AS" validate skills/abzu || fail=1
fi

# 2) Markdown 体检（扫描范围与豁免见 .markdownlint-cli2.jsonc）
npx -y markdownlint-cli2 || fail=1

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
