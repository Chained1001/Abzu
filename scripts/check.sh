#!/usr/bin/env bash
# 一键检查（提交前必跑）。段序即维护入口——新增检查在此追加一段；本头注是段序的唯一真源，其他文档不复述列表。
# 用法：bash scripts/check.sh
# 依赖与前置：Node.js（[1] 段需 npx，未找到即置红）；Python 3（[4] 段需 python3／python／py，三级链均缺即置红）；命令行按 Git Bash 语义执行（Windows）。
#
# [0] skills 目录完整性（安装器 symlink 化检测）——目录未建时跳过
# [1] Markdown 体检（markdownlint）
# TODO: [2] skill 格式校验（agentskills validate）——待落首个 skill 壳后加入
# TODO: [3] 内容轨（引用闭合 + 加粗密度 + TOC + 行数 + 条目限长）——待建 scripts/check_content.py 后加入
# [4] 规格静态自检（断言自噬／计数重算／[A] 逐字／写作检查）——scripts/check_spec.py --static；非阻断（候选类只呈报，静态发现恒 0）
# TODO: [5] 脚本语法（node --check 逐域脚本）——待落 contracts 脚本后加入
set -u
fail=0

echo "[0] skills 目录完整性（安装器 symlink 化检测）..."
if [ -d skills ]; then
  if [ -L skills ]; then
    echo "x skills 是符号链接——安装器在源仓库内跑过？"
    fail=1
  else
    echo "  skills 为真目录"
  fi
elif [ -e skills ] || [ -L skills ]; then echo "x skills 存在但非目录（异常形态）"; fail=1
else
  echo "  skills 目录尚未建立，跳过"
fi

echo "[1] Markdown 体检（markdownlint）..."
if command -v npx >/dev/null 2>&1; then
  npx markdownlint-cli2 "**/*.md" || fail=1
else
  echo "x npx 未找到（本段需要 Node.js）"
  fail=1
fi

echo "[4] 规格静态自检（断言自噬／计数重算／[A] 逐字／写作检查）..."
# Python 三级链探测：python3 → python → py（口径见 docs/standards/运行环境标准.md §一.4；顺序不可换）
PY=""
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
elif command -v py >/dev/null 2>&1; then
  PY=py
fi
if [ -z "$PY" ]; then echo "x 未找到 Python（探测链 python3 → python → py 均不可用）——本段需要 Python 3"; fail=1
elif ! "$PY" -c 'import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)'; then echo "x $PY 非 Python 3（实测 $("$PY" -V 2>&1)）——本段需要 Python 3"; fail=1
else
  # 在制规格枚举口径：docs/specs/[0-9][0-9][0-9]-*.md——显式排除非规格件 docs/specs/施工机制.md
  # （其 §八 模板内嵌本节标题，扫之即假发现源）
  spec_files=()
  for f in docs/specs/[0-9][0-9][0-9]-*.md; do
    [ -e "$f" ] || continue
    spec_files+=("$f")
  done
  # 无在制规格属预期常态（规格验收通过后即归档）：由工具打印「无在制规格，跳过」——此处不重复打印，
  # 也不置红；静态发现恒 0（非阻断，候选类只呈报），故本段置红只可能来自 Python 缺失或工具参数错误
  "$PY" scripts/check_spec.py --static ${spec_files[@]+"${spec_files[@]}"} || fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
exit 0
