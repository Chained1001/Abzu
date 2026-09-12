#!/usr/bin/env bash
# 一键检查（提交前必跑）。段序即维护入口——新增检查在此追加一段；本头注是段序的唯一真源，其他文档不复述列表。
# 用法：bash scripts/check.sh
#
# [0] skills 目录完整性（安装器 symlink 化检测）——目录未建时跳过
# [1] Markdown 体检（markdownlint）
# TODO: [2] skill 格式校验（agentskills validate）——待落首个 skill 壳后加入
# TODO: [3] 内容轨（引用闭合 + 加粗密度 + TOC + 行数 + 条目限长）——待建 scripts/check_content.py 后加入
# TODO: [4] 规格静态自检（断言自噬／计数重算／[A] 逐字／规格写作检查）——待建 scripts/check_spec_assertions.py 后加入
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

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿 =="
exit 0
