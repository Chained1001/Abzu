#!/usr/bin/env bash
# 一键检查（宪法 §0）：skills 目录完整性（符号链接化检测）+ 六壳 skill 格式校验 + Markdown 体检 + 引用闭合 + 加粗密度 + TOC + 规格静态自检 + 脚本语法检查
# 用法：bash scripts/check.sh [--staged]
#   --staged  仅 [2] markdownlint 收窄为「暂存区涉及的 .md」（其余段仍全量；增量模式，日常快速反馈）
#   默认全量（六壳 validate + 全仓 markdownlint + 引用闭合 + 加粗密度 + TOC + 规格静态自检 + 脚本语法检查）
#
# 依赖与前置：
#   [1] agentskills —— pip 包 skills-ref；探测链 PATH → LOCALAPPDATA Python Scripts →
#       ~/.local/bin（详见 AGENTS.md §0）。缺失提示去向：本脚本 stdout 输出
#       「x agentskills 未找到（pip install skills-ref）」并置 fail=1
#   [2] markdownlint-cli2 —— npx --no-install 本地调用；未安装时该段输出提示，先执行一次
#       npx -y markdownlint-cli2 --version 拉取（提示去向：段内 echo）
#   [3] Python 3 —— 按 §0 探测链定位（python3 → python → py）跑 scripts/check_content.py
#   [4] 规格静态自检 —— 由 scripts/check_spec_assertions.py --static 提供；对象为 docs/specs/ 根下
#       在制规格（两份台账除外），依赖同 [3] 的 Python 3
#   [5] node —— 脚本语法检查（node --check）；缺失时该段输出 x 提示并置 fail=1
#   任一依赖缺失不静默跳过：对应段输出 x 提示并置 fail=1，末尾统一「检查未全绿，禁止提交」exit 1
#
# 维护入口（新增检查项接入位置）：
#   新增检查项 = 仿 [1][2][3][4][5] 段式追加一段「echo "[N] 标题…"; 命令 || fail=1」（编号顺延）；
#   增量口径自行决定是否参考 [2] 的 $STAGED 分支；内容类新维度先进
#   scripts/check_content.py 再由 [3] 段带入（避免本文件膨胀）
set -u -o pipefail
export PYTHONIOENCODING=utf-8
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || PY=py
cd "$(dirname "$0")/.." || exit 1
fail=0
STAGED=false
[[ "${1:-}" == "--staged" ]] && STAGED=true

echo "[0] skills 目录完整性（安装器 symlink 化检测）..."
for d in skills/abzu-*; do
  if [ -L "$d" ]; then
    echo "x $d 是符号链接——skills 目录被安装器 symlink 化（本仓库内运行了 npx skills add；恢复：删链接条目后 git restore skills/；参见 README 安装节警告与宪法反模式 #10）"
    fail=1
  fi
done
if [ -e .agents/skills ] || [ -f skills-lock.json ]; then
  echo "x 检测到 .agents/skills 或 skills-lock.json——安装器曾在本仓库内运行（vendor 副产品）；清理后重查"
  fail=1
fi

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
"$PY" scripts/check_content.py || fail=1

echo "[4] 规格静态自检（在制规格）..."
SPECS=$(ls docs/specs/*.md 2>/dev/null | grep -v -E "/(collab-log|open-items)\.md$" || true)
if [ -n "$SPECS" ]; then
  "$PY" scripts/check_spec_assertions.py --static $SPECS || fail=1
else
  echo "  无在制规格，跳过"
fi

echo "[5] 脚本语法检查（node --check）..."
NODE_BIN=""
command -v node >/dev/null 2>&1 && NODE_BIN=node
if [ -z "$NODE_BIN" ]; then
  echo "x node 未找到（脚本语法检查需要 Node.js）"
  fail=1
else
  for f in skills/abzu-*/scripts/*.js; do
    [ -e "$f" ] || continue
    "$NODE_BIN" --check "$f" || fail=1
  done
fi

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
