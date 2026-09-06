#!/usr/bin/env bash
# 一键检查（宪法 §0）：六壳 skill 格式校验 + Markdown 体检 + 引用闭合 + 加粗密度 + TOC
# 用法：bash scripts/check.sh
set -u
cd "$(dirname "$0")/.." || exit 1
fail=0

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
npx -y markdownlint-cli2 || fail=1

echo "[3] 引用闭合 + 加粗密度 + TOC..."
python -c "
import re, glob, os, sys
issues = []

# 引用闭合
for f in glob.glob('skills/abzu-*/**/*.md', recursive=True):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'references/scan/([\w-]+\.md)', s):
        if not os.path.exists(os.path.join('skills/abzu-scan/references/scan', m.group(1))):
            issues.append(f'断链: {f} -> {m.group(0)}')

# 加粗密度
for f in glob.glob('skills/abzu-*/**/*.md', recursive=True):
    s = open(f, encoding='utf-8').read()
    b = len(re.findall(r'\*\*', s))
    l = len(s.split('\n'))
    if b > l // 3:
        issues.append(f'加粗超限: {f} ({b}>{l//3})')

# TOC：>100 行须有目录
for f in glob.glob('skills/abzu-*/references/**/*.md', recursive=True):
    content = open(f, encoding='utf-8').read()
    if content.count('\n') + 1 > 100 and '## 目录' not in content:
        issues.append(f'缺目录: {f} ({content.count(chr(10)) + 1} 行)')

if issues:
    for i in issues:
        print(f'x {i}')
    sys.exit(1)
" || fail=1

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
