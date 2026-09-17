#!/usr/bin/env bash
# 一键检查（提交前必跑）。段序即维护入口——新增检查在此追加一段；本头注是段序的唯一真源，其他文档不复述列表；段现状（已实现／待建）亦以本头注段行为准（`# [N]`＝已实现、`# TODO: [N]`＝待建——原《测试与验收标准》§1.1 现状表已随 2026-09-17 重构删除）。行内出现的批次号分三种——**状态型**（书写时一律状态无关）／**判据的事故出处**（provenance，保留原文）／**运行时措辞／示例串**（**不得按批次叙事改写**）。
# 用法：bash scripts/check.sh
# 依赖与前置：Node.js（[1] 段需 npx，未找到即置红）；Python 3（[3]／[4]／[5] 段需 python3／python／py，三级链均缺即置红）；命令行按 Git Bash 语义执行（Windows）。
#
# [0] skills 目录完整性（安装器 symlink 化检测）——目录未建时跳过
# [1] Markdown 体检（markdownlint）
# [2] skill 格式校验（本地断言：壳结构／frontmatter／目录形态）
# [3] 内容轨（引用闭合／TOC／行数与条目限长／「维护出处」标注／**热路径字数预算**／**用词**（候选；§8 产品领域词豁免））（**加粗密度不实现**——阈值未立法，见 `docs/specs/守卫缺口清单.md` G1）——scripts/check_content.py；分档＝可置红：行数与条目限长，余项候选只呈报（`施工机制` §四）
# [4] 规格静态自检（检查A 断言自噬／检查B 计数重算／检查C `[A]` 逐字／检查D 写作检查／检查E 三方对账／回写面对账／档位核对／检查F 禁改面禁词核对／检查G 自由度分布／检查H 核销表汇总核对／仍待项断链核对／检查I 锚点对源核对／检查J 审查记录核对／开放项台账归宿核对／§九 成本字段核对；检查A 的发现项含自噬预警／**零命中待复核**／**零命中核对未判**／**口径不可判**）——scripts/check_spec.py --static；非阻断（候选类只呈报，静态发现恒 0）
# [5] 脚本语法（node --check 逐域 .js／ast.parse 仓级 .py／bash -n 各 .sh）
# 段序区止于恰为「set -u」的行——_seg_summary 以该行为扫描终止哨兵；改此行须同步改其终止判据
set -u
fail=0
seg_note_rt=()              # 运行时跳过登记（段号→括注）：末尾收尾汇总按实况拼（078 批 F5，见 _seg_summary）

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
  # 跳过不静默（078 批 F5）：原因与手动路径两行**顶格**打印（段输出规范——跳过项要告诉作者手工怎么补跑；
  # 断言判据按行首锚定，缩进即假红）；段号登记给末尾收尾汇总（按实况拼，不写死机器状态）。
  echo "  skills 目录尚未建立，跳过"
  echo '手动路径：确认 `skills/` 为真实目录（`ls -ld skills`）且未被安装器符号链接化'
  seg_note_rt[0]="[0] skills 未建"
fi

echo "[1] Markdown 体检（markdownlint）..."
if command -v npx >/dev/null 2>&1; then
  npx markdownlint-cli2 "**/*.md" || fail=1
else
  echo "x npx 未找到（本段需要 Node.js）"
  fail=1
fi

echo "[2] skill 格式校验（本地断言：壳结构／frontmatter／目录形态）..."
# 纯本地断言、零外部依赖（外部校验器仅走查期可选——其白名单不含本仓硬约束键）：逐 skills/*/ 校**逐壳六项**——
# ①SKILL.md 存在 ②H1 形态 ③frontmatter 五键 ④四节名齐（整行匹配：H3 或带后缀的节名不算）⑤官方三条约束
# （name 与目录同名／name ≤64 字符／description 非空且 ≤1024 字符）⑥目录形态（一层子目录名限 references／assets／scripts；
# `{skill 名}` 同名子目录层与三层深度均违 §1 平铺——二级一并查）。另**段行一条**：⑦**头注段行校验由 `_seg_summary` 统一处理，不在本段逐壳判**（**段序与段状态按头注取**；本段已由头注改列 0 落地）。
# 计数口径：`${#}` 按**字符**计——段首显式 `export LC_ALL=C.UTF-8`（`运行环境标准` §一 未规定 locale；缺省 locale 为 C 时
# 按字节计，>341 汉字的 description 会误红挡提交）。
# 输出形态（087 批）：仅段标题行以 `[2] ` 起首，其余行按既有体例（`x ` 起首＝失败／两空格缩进＝信息）；
# 跳过不静默——未落域壳时打原因与「手动路径」行（理由同 [0] 段）。
export LC_ALL=C.UTF-8
skill_n=0
skill_bad=0
for _d in skills/*/; do
  [ -d "$_d" ] || continue
  _sk="${_d%/}"
  _nm="${_sk##*/}"
  skill_n=$((skill_n + 1))
  _md="$_sk/SKILL.md"
  if [ ! -f "$_md" ]; then echo "x $_sk：缺 SKILL.md"; skill_bad=$((skill_bad + 1)); continue; fi
  _bad=0
  # ②H1 形态：「{产品名} · {中文 skill 名}（{英文 skill 名}）」
  grep -qE '^# .+ · .+（.+）$' "$_md" || { echo "x $_sk：H1 不合「{产品名} · {中文 skill 名}（{英文 skill 名}）」"; _bad=1; }
  # ③frontmatter 五键
  for _k in name description license disable-model-invocation metadata; do
    grep -q "^${_k}:" "$_md" || { echo "x $_sk：frontmatter 缺键 ${_k}"; _bad=1; }
  done
  # ④四节名齐（节名固定，缺一即不合格；整行匹配——H3 或带后缀的节名不算）
  for _s in 入口判定 工作流 阶段确认点与交互原则 语言; do
    grep -qFx "## ${_s}" "$_md" || { echo "x $_sk：缺节「${_s}」"; _bad=1; }
  done
  # ⑤官方三条约束：name 与目录同名／name ≤64 字符／description 非空且 ≤1024 字符（字符口径见段首 locale 注）
  _fn="$(grep "^name:" "$_md" | head -1)"; _fn="${_fn#name:}"; _fn="${_fn// /}"
  if [ -z "$_fn" ]; then echo "x $_sk：frontmatter name 为空"; _bad=1
  elif [ "$_fn" != "$_nm" ]; then echo "x $_sk：name（${_fn}）与目录名不同"; _bad=1; fi
  [ "${#_fn}" -le 64 ] || { echo "x $_sk：name 超 64 字符（实测 ${#_fn}）"; _bad=1; }
  _ds="$(grep "^description:" "$_md" | head -1)"; _ds="${_ds#description:}"; _ds="${_ds# }"
  if [ -z "$_ds" ]; then echo "x $_sk：description 为空"; _bad=1
  elif [ "${#_ds}" -gt 1024 ]; then echo "x $_sk：description 超 1024 字符（实测 ${#_ds}）"; _bad=1; fi
  # ⑥目录形态（§1）：一层子目录名限 references／assets／scripts；`{skill 名}` 同名子目录层与三层深度均违平铺——
  # 二级一并查（references 内出现同名层即 086 §八 2 所指的平铺违例）
  for _sub in "$_sk"/*/; do
    [ -d "$_sub" ] || continue
    _sn="${_sub%/}"; _sn="${_sn##*/}"
    if [ "$_sn" = "$_nm" ]; then echo "x $_sk：出现与 skill 同名的子目录层 ${_sn}/"; _bad=1
    elif [ "$_sn" != references ] && [ "$_sn" != assets ] && [ "$_sn" != scripts ]; then
      echo "x $_sk：子目录 ${_sn}/ 不在 references／assets／scripts 三名单内"; _bad=1
    fi
  done
  for _sub2 in "$_sk"/*/*/; do
    [ -d "$_sub2" ] || continue
    _s2="${_sub2%/}"; _s2="${_s2##*/}"
    if [ "$_s2" = "$_nm" ]; then echo "x $_sk：二级出现与 skill 同名的子目录层 $_sub2（§1 平铺禁止）"; _bad=1
    else echo "x $_sk：目录 $_sub2 深于一层（§1 平铺禁止三层深度）"; _bad=1
    fi
  done
  [ "$_bad" -eq 0 ] && echo "  ${_nm}：逐壳六项通过"
  skill_bad=$((skill_bad + _bad))
done
if [ "$skill_n" -eq 0 ]; then
  echo "  skills/ 下未落域壳，跳过"
  echo '手动路径：在 skills/{skill 名}/SKILL.md 落域壳（形态见 docs/standards/skill资产标准.md §2／§3）'
  seg_note_rt[2]="[2] 无域壳"
elif [ "$skill_bad" -ne 0 ]; then
  echo "  不通过 $skill_bad 个（共 $skill_n 个域壳）"
  fail=1
else
  echo "  域壳 $skill_n 个，逐壳六项全过（⑦段行见头注）"
fi

# Python 三级链探测：python3 → python → py（口径见 docs/standards/运行环境标准.md §一.4；顺序不可换）
# 探测上移（093 批 F6①）：[3] 与 [4] 两段**共用**本处结果，各段不再自带第二份探测链
# （`运行环境标准` §一.4「逐脚本不重复实现」）。
PY=""
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
elif command -v py >/dev/null 2>&1; then
  PY=py
fi

echo "[3] 内容轨（引用闭合／TOC／行数与条目限长／「维护出处」标注／热路径字数预算／用词）..."
# 前置缺失时不静默跳过（体例同 [0]／[2] 段）：原因 ＋ 手动路径两行 ＋ seg_note_rt 登记。
# 输出体例沿用：段标题行以 [N] 起首、x 起首＝失败、两空格缩进＝信息。
# 置红接线（093 批 F6④）：工具置红（退出 1）与参数／环境错（退出 2）一并接到 fail。
if [ ! -f scripts/check_content.py ]; then
  echo "  内容轨检查器尚未建立，跳过"
  echo '手动路径：新建 scripts/check_content.py 后本段自动接入（命名与位置见 docs/standards/文字与命名标准.md §1）'
  seg_note_rt[3]="[3] 工具未建"
elif [ -z "$PY" ]; then
  echo "x 未找到 Python（探测链 python3 → python → py 均不可用）——本段需要 Python 3"
  fail=1
else
  "$PY" scripts/check_content.py --static || fail=1
fi

echo "[4] 规格静态自检（检查A 断言自噬／检查B 计数重算／检查C [A] 逐字／检查D 写作检查／检查E 三方对账／回写面对账／档位核对／检查F 禁改面禁词核对／检查G 自由度分布／检查H 核销表汇总核对／仍待项断链核对／检查I 锚点对源核对／检查J 审查记录核对／开放项台账归宿核对／§九 成本字段核对；检查A 的发现项含自噬预警／零命中待复核／零命中核对未判／口径不可判）..."
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

echo "[5] 脚本语法（node --check 逐域 .js／ast.parse 仓级 .py／bash -n 各 .sh）..."
# 三类目标件逐类跑：`skills/*/scripts/*.js`（node --check）／`scripts/*.py`（ast.parse——**不用
# `py_compile`**：后者落 `__pycache__`，守卫不得有写盘副作用）／各 `.sh`（`bash -n`，含
# `scripts/hooks/pre-commit`）。**零 `.js` 目标件**——**不探 Node**、只打一行信息；
# **仅当三类目标件全空时**才明示跳过并登记 seg_note_rt[5]（有 `.py`／`.sh` 即不跳过）。
# 置红接线（093 批 F6④）：语法错与前置缺失均接到 fail。
seg_js=0
for _f in skills/*/scripts/*.js; do
  [ -f "$_f" ] || continue
  seg_js=$((seg_js + 1))
  if command -v node >/dev/null 2>&1; then
    node --check "$_f" || { echo "x 语法错：$_f（node --check 未通过）"; fail=1; }
  else
    echo "x 未找到 node（本段需要 Node.js 跑 node --check）：$_f"
    fail=1
  fi
done
[ "$seg_js" -gt 0 ] || echo "  skills/ 下暂无 .js 目标件（本段不探 Node）"
seg_py=0
for _f in scripts/*.py; do
  [ -f "$_f" ] || continue
  seg_py=$((seg_py + 1))
  if [ -z "$PY" ]; then
    echo "x 未找到 Python（探测链 python3 → python → py 均不可用）——本段需要 Python 3 跑 ast.parse"
    fail=1
    break
  elif ! "$PY" -c 'import ast,sys; ast.parse(open(sys.argv[1], encoding="utf-8").read())' "$_f"; then
    echo "x 语法错：$_f（ast.parse 未通过）"
    fail=1
  fi
done
seg_sh=0
for _f in scripts/*.sh scripts/*/*.sh scripts/hooks/pre-commit; do
  [ -f "$_f" ] || continue
  seg_sh=$((seg_sh + 1))
  bash -n "$_f" || { echo "x 语法错：$_f（bash -n 未通过）"; fail=1; }
done
if [ "$seg_js" -eq 0 ] && [ "$seg_py" -eq 0 ] && [ "$seg_sh" -eq 0 ]; then
  echo "  三类脚本目标件均为空，跳过"
  echo '手动路径：落 scripts/*.py／scripts/*.sh 或 skills/{skill 名}/scripts/*.js 后本段自动接入'
  seg_note_rt[5]="[5] 零目标件"
fi

_seg_summary() {
  # 收尾汇总（078 批 F5）：跳过项的可见化落点 ＋ 手动路径指引——**顶格打印**（段输出规范：跳过不得静默；
  # 判据按行首 `^共 N 段` 锚定，缩进即假红）。段序与待建段按**头注**（段序唯一真源）实况取：`# [N] `
  # 行＝已实现段、`# TODO: [N] ` 行＝待建段；运行时跳过由各段登记给 seg_note_rt——均不得写死机器状态
  # （`skills/` 一旦建起，写死的「跳过」即变假陈述）。
  local _l _i _ran=0 _skip=0 _desc="" _self="${BASH_SOURCE[0]:-$0}"
  if [ ! -r "$_self" ]; then
    # 段序来源不可读（078 批 P-4）：只打显式标记——**不**打错误段数、**不**置红
    echo "段序来源不可读（${_self:-未取到路径}）：段数与跳过项未取到，手动路径见各段"
    return
  fi
  while IFS= read -r _l; do
    [ "$_l" = "set -u" ] && break     # 头注止于 `set -u` 行（078 批 P-3）：其后正文的列 0 注释不计成段
    case "$_l" in
      '# TODO: ['[0-9]*']'*) _i=${_l#'# TODO: ['}; _i=${_i%%]*}
        _skip=$((_skip + 1)); _desc="${_desc}[${_i}] 待建／" ;;
      '# ['[0-9]*']'*) _i=${_l#'# ['}; _i=${_i%%]*}
        if [ -n "${seg_note_rt[$_i]:-}" ]; then
          _skip=$((_skip + 1)); _desc="${_desc}${seg_note_rt[$_i]}／"
        else
          _ran=$((_ran + 1))
        fi ;;
    esac
  done < "$_self"
  [ -n "$_desc" ] || _desc="无"
  echo "共 $((_ran + _skip)) 段：已跑 ${_ran}｜跳过 ${_skip}（${_desc%／}）｜手动路径见各段"
}
_seg_summary

if [ "$fail" -ne 0 ]; then
  echo "== 检查未全绿，禁止提交 =="
  exit 1
fi
echo "== 检查全绿（已检：真目录／lint／skill 格式／内容轨／规格静态自检／脚本语法；候选类只呈报，见各段输出）=="
exit 0
