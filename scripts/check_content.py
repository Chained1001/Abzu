"""内容轨检查器（仓级开发守卫，`scripts/check.sh` [3] 段调用）。

事故出身与历次裁定：见 `docs/specs/093-2026-09-15-守卫面建设批.md`（`[3]` 段待建一件 ＋
`check_spec.py` 的 `\\|` 静默盲区一件，两件同批处置）。行内出现的批次号分三种——**状态型**（书写时一律状态无关）／**判据的事故出处**（provenance，保留原文）／**运行时措辞／示例串**（**不得按批次叙事改写**）。

用途：扫全仓 Markdown（治理文档 ＋ skill 资产）的**五项内容轨检查**——① 引用闭合（治理文档的相对
  Markdown 链接须实存——**行内代码跨度与围栏块内不计**〔101 批 F21〕；skill 资产内 `references/`／`assets/`／`scripts/` 路径引用须实存）② TOC
  存在性（常驻文档 >100 行须有 `## 目录` 且条目与 H2 逐字一致；**规格与归档件不适用**）③ `SKILL.md`
  ≤500 行 ＋ 单 reference <300 行 ④ `CHANGELOG` 条目 ≤400 字符 ⑤ 「维护出处」标注（skill 资产行内
  出现「**见／按／引／依照／据** ＋ 反引号治理件名」形态而无标注者）。

  **加粗密度不实现**——阈值未立法且仓内零**适用**目标件（见 `docs/standards/测试与验收标准.md` §4 G1 与 `文档写作标准` §一.3.8）。
用法与参数：`python scripts/check_content.py [--static]`
  · `--static` 与**无参数同义**（保留该写法只因 `[4]` 段既有调用惯例）；两者均**扫全仓**——本工具
    **无「本批改动面」概念**，五项检查一律扫全仓。
    仍为全仓 `docs/`＋根 `*.md`（含归档、排本批在制规格）。
  · 参数非法（含未知选项）＝用法说明 ＋ 退出 `2`。
  · 输出体例（沿用 `check.sh` 段输出规范）：候选行＝`·` ＋ 空格起首；置红行＝`x` ＋ 空格起首；
    信息行＝两空格缩进。
  · 退出码：`0` 无置红项（**候选不影响退出码**）／`1` 有置红项／`2` 参数或环境错。
  · **分档**：可置红＝③④（阈值无歧义、现状全绿）；候选只呈报＝①②⑤（存量债面宽、判据含近似）。
依赖与前置：Python 3 标准库（argparse／os／re／subprocess／sys），零外部依赖；不联网、不跑 LLM。
  前置＝git 仓库内（件清单取 `git ls-files -z` ＋ `--others --exclude-standard`，覆盖未跟踪但未忽略者；
  `-z` 亦回避 `core.quotepath` 对中文路径的引号化）。
只读不写盘**任何**文件：不跑 git 写命令、不跑目标件内任何命令；语法自检用 `ast.parse` 而**非**
  `py_compile`（后者会落 `__pycache__`——守卫不得有写盘副作用）。读文件一律显式 `encoding='utf-8'`。
维护入口：新增检查在 `_checks()` 挂新 `_check_*`（返回 `(候选行, 置红行)`）；三体例改 `_cand()`／
  `_red()`／`_info()`；件清单改 `_repo_files()`；行数口径改 `_lines()`；TOC 判据改 `_toc_state()`；
  ⑤ 的形态正则改 `GOV_MENTION`；① 链接扫描的跨度／围栏跳过判据改 `_span_ranges()`／`FENCE_LINE`；
"""
import argparse
import io
import os
import re
import subprocess
import sys

# 仓根＝本件所在目录的上一级（不依赖调用者 cwd；`check.sh` 亦在仓根调起）
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOC_HEAD = re.compile(r'^##\s*目录\s*$', re.M)
H2 = re.compile(r'^##\s+(.*?)\s*$', re.M)
TOC_ITEM = re.compile(r'^[-*+]\s+(.*?)\s*$', re.M)
MD_LINK = re.compile(r'''\[[^\]\n]*\]\(([^)\s]+?)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\)''')
# 围栏块开合行判定（101 批 F21）：整行仅由 ``` 或 ~~~ 构成（可带语言名）——围栏内的行不参与 ①；
# 开合按标记字符配对（形态照 check_spec 的 FENCE_BLOCK，不跨件 import）
FENCE_LINE = re.compile(r'^\s*(```|~~~)[a-zA-Z]*\s*$')
# skill 资产内的路径引用（skill 根相对；`命名标准` §5 表：禁裸文件名、用根相对路径文字）
ASSET_REF = re.compile(r'`((?:references|assets|scripts)/[A-Za-z0-9._/\-]+)`')
# ⑤ 的形态：「见／按／引／依照／据 ＋ 可选空格与左括号 ＋ 反引号治理件名」
GOV_MENTION = re.compile(r'(?:见|按|引|依照|据)[ \t（]*`([^`\n]+)`')
MAINT_MARK = '维护出处'
CHANGELOG = 'CHANGELOG.md'
SKILL_LINE_MAX = 500          # `skill形态标准` §5.1：`SKILL.md` 硬上限（超限＝置红）
REF_LINE_MAX = 300            # `skill形态标准` §5.1：单 reference <300 行（≥300＝置红）
ENTRY_CHAR_MAX = 400          # `版本与分发标准` §3 第 2 步：`CHANGELOG` 条目 ≤400 字符（超限＝置红）
TOC_LINE_MIN = 100            # `文档写作标准` §一.1.3：超 100 行文件头部放节目录
SPECS_PREFIX = 'docs/specs/'  # 规格与归档件不适用 TOC 存在性


def _stdout_utf8():
    """中文 Windows 下 stdout／stderr 默认 GBK，打印 `·`／`x`／中文会 UnicodeEncodeError；两流各自
    try／except——某流不可 reconfigure（如已被替换为无该方法的对象）不影响另一流（`check_spec.py` 同口径）。"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8')
        except Exception:
            pass


def _cand(text):
    """候选行（只呈报；`AGENTS.md` §五.2 候选永不拦截）。"""
    return '· ' + text


def _red(text):
    """置红行（计入退出码 1）。"""
    return 'x ' + text


def _info(text):
    """信息行（两空格缩进；沿用 `check.sh` 段输出体例）。"""
    return '  ' + text


def _read(path):
    """容错读（显式 UTF-8；`运行环境标准` §3.2）。"""
    with io.open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def _lines(text):
    """行数口径＝**换行符出现次数**（与 `wc -l` 一致；`规格写作标准` §5.3——禁 `splitlines()`）。"""
    return text.count('\n')


def _repo_files():
    """仓内件清单（tracked ＋ untracked 但未忽略）：`git ls-files -z` 两取（`运行环境标准` §2.7）。
    取不到（非 git 仓库／git 不可用）返回 None——由调用方按环境错退出 2。"""
    names = []
    for extra in ([], ['--others', '--exclude-standard']):
        r = subprocess.run(['git', 'ls-files', '-z'] + extra, cwd=ROOT,
                           capture_output=True)
        if r.returncode != 0:
            return None
        names += r.stdout.decode('utf-8', 'replace').split('\0')
    return sorted({n for n in names if n and os.path.isfile(os.path.join(ROOT, n))})


def _gov_names(files):
    """治理件名集合（用于 ⑤ 的「反引号治理件名」判据）：非 `skills/` 下 `.md` 的**仓根相对路径**
    与**基名**两种写法都收（`命名标准` §5：资产内指向治理文档写 `{件名}`，如 `书目录契约`）。"""
    names = set()
    for f in files:
        if not f.endswith('.md') or f.startswith('skills/'):
            continue
        names.add(f)
        names.add(os.path.basename(f))
        names.add(os.path.basename(f)[:-3])
    return names


def _norm_link_target(path, url):
    """治理文档相对链接的目标路径（去锚点、去查询串；以该件所在目录为基准）。"""
    target = url.split('#')[0].split('?')[0]
    if not target:
        return ''
    if target.startswith('/'):
        return target[1:]
    return os.path.normpath(os.path.join(os.path.dirname(path), target)).replace(os.sep, '/')


def _span_ranges(line):
    """行内代码跨度的区间（**含定界反引号**）：[(起, 止)]——区间内文本不参与 ① 的链接判定
    （101 批 F21）。算法形态照 check_spec 的 `_inline_spans`（不跨件 import）：n 个反引号开启、
    同长 n 个反引号闭合；转义反引号（反斜杠后随）是字面文本、不作定界符。"""
    runs = [(m.start(), m.end()) for m in re.finditer(r'`+', line)
            if m.start() == 0 or line[m.start() - 1] != '\\']
    spans = []
    i = 0
    while i < len(runs):
        s, e = runs[i]
        j = next((k for k in range(i + 1, len(runs))
                  if runs[k][1] - runs[k][0] == e - s), None)
        if j is None:
            i += 1
            continue
        spans.append((s, runs[j][1]))
        i = j + 1
    return spans


def _check_refs(gov, assets):
    """① 引用闭合（候选）：① 治理文档的相对 Markdown 链接目标须实存
    ② skill 资产内的 `references/`／`assets/`／`scripts/` 路径引用须实存（基准＝skill 根）。
    **候选类**：存量债面宽（`测试与验收标准` §1.2 分档）。① 的链接扫描**跳过行内代码跨度与
    围栏块**（跨度内与围栏内的示例串不是链接——101 批 F21；判据见 `_span_ranges()`／`FENCE_LINE`）。"""
    cands = []
    for path in gov:
        in_fence = None          # 围栏标记字符（None＝不在围栏内）；开合按同一标记字符配对
        for i, line in enumerate(_read(os.path.join(ROOT, path)).split('\n'), 1):
            fm = FENCE_LINE.match(line)
            if fm:
                mark = fm.group(1)[0]
                if in_fence is None:
                    in_fence = mark
                elif in_fence == mark:
                    in_fence = None
                continue
            if in_fence:
                continue          # 围栏块内的行不是链接（口径同 check_spec.check_writing）
            outside = list(line)
            for s, e in _span_ranges(line):   # 行内代码跨度内的 `[..](url)` 不是链接（同上口径）
                for k in range(s, e):
                    outside[k] = ' '
            for url in MD_LINK.findall(''.join(outside)):
                if url.startswith(('http', '#', 'mailto')):
                    continue
                target = _norm_link_target(path, url)
                if target and not os.path.exists(os.path.join(ROOT, target)):
                    cands.append(_cand(f'断链: {path}:{i} → {url}'))
    for path in assets:
        skill_root = '/'.join(path.split('/')[:2])            # skills/{skill 名}（引用基准＝skill 根）
        for i, line in enumerate(_read(os.path.join(ROOT, path)).split('\n'), 1):
            for ref in ASSET_REF.findall(line):
                if not os.path.exists(os.path.join(ROOT, skill_root, ref)):
                    cands.append(_cand(f'资产路径引用不实存: {path}:{i} → {ref}'))
    return cands, []


def _toc_state(text):
    """TOC 状态：返回 (有无 `## 目录`, TOC 节内顶层条目列表, 全部 H2 标题列表)。"""
    sec = ''
    m = TOC_HEAD.search(text)
    if m:
        rest = text[m.end():]
        nxt = re.search(r'^##\s', rest, re.M)
        sec = rest[:nxt.start()] if nxt else rest
    items = []
    for it in TOC_ITEM.findall(sec):
        link = re.fullmatch(r'\[(.*?)\]\([^)]*\)', it)
        items.append((link.group(1) if link else it).strip())
    heads = [h.strip() for h in H2.findall(text) if h.strip() != '目录']
    return bool(m), items, heads


def _check_toc(guards):
    """② TOC 存在性（候选）：常驻文档（非 `docs/specs/**`）超 100 行者须有 `## 目录`，且条目与
    H2 **逐字一致**（判据真源＝`文档写作标准` §一.1.3；规格与归档件不适用——其节序由规格形态承载）。"""
    cands = []
    for path in guards:
        if path.startswith(SPECS_PREFIX):
            continue
        text = _read(os.path.join(ROOT, path))
        n = _lines(text)
        if n <= TOC_LINE_MIN:
            continue
        has_toc, items, heads = _toc_state(text)
        if not has_toc:
            cands.append(_cand(f'TOC 缺失: {path}（{n} 行 > {TOC_LINE_MIN}）'))
            continue
        missing = [h for h in heads if h not in items]
        extra = [i for i in items if i not in heads]
        if missing or extra:
            detail = []
            if missing:
                detail.append('缺条目 ' + '、'.join(missing))
            if extra:
                detail.append('多条目 ' + '、'.join(extra))
            cands.append(_cand(f'TOC 与 H2 不一致: {path}（' + '；'.join(detail) + '）'))
    return cands, []


def _check_lines(files):
    """③ 行数（**可置红**）：`skills/*/SKILL.md` ≤500 行、单 reference <300 行
    （阈值真源＝`skill形态标准` §5.1；`assets/` 不计行数预算，同条）。"""
    reds = []
    for path in files:
        parts = path.split('/')
        if len(parts) == 3 and parts[0] == 'skills' and parts[2] == 'SKILL.md':
            n = _lines(_read(os.path.join(ROOT, path)))
            if n > SKILL_LINE_MAX:
                reds.append(_red(f'{path}: {n} 行 > {SKILL_LINE_MAX}（`skill形态标准` §5.1）'))
        elif (len(parts) == 4 and parts[0] == 'skills' and parts[2] == 'references'
                and path.endswith('.md')):
            n = _lines(_read(os.path.join(ROOT, path)))
            if n >= REF_LINE_MAX:
                reds.append(_red(f'{path}: {n} 行 ≥ {REF_LINE_MAX}（`skill形态标准` §5.1）'))
    return [], reds


def _check_changelog():
    """④ `CHANGELOG` 条目限长（**可置红**）：列 0 起首的 `- ` 条目行长 ≤400 字符
    （阈值真源＝`版本与分发标准` §3 第 2 步；口径＝整行字符数，含列表标记）。"""
    path = os.path.join(ROOT, CHANGELOG)
    if not os.path.isfile(path):
        return [], []
    reds = []
    for i, line in enumerate(_read(path).split('\n'), 1):
        if not line.startswith('- '):
            continue
        if len(line) > ENTRY_CHAR_MAX:
            reds.append(_red(f'{CHANGELOG}:{i} 条目 {len(line)} 字符 > {ENTRY_CHAR_MAX}'))
    return [], reds


def _check_maint(gov_names, files):
    """⑤ 「维护出处」标注（候选）：skill 资产行内出现「见／按／引／依照／据 ＋ 反引号治理件名」形态而该行
    **无标注**者（判据真源＝`命名标准` §5「运行时资产引用治理文档」；写法与正例同节 §5 表末行）。
    **候选类**：判据含近似（无标注的等价写法会漏报——`测试与验收标准` §4 G23）。"""
    cands = []
    for path in files:
        if not path.startswith('skills/') or not path.endswith('.md'):
            continue
        for i, line in enumerate(_read(os.path.join(ROOT, path)).split('\n'), 1):
            if MAINT_MARK in line:
                continue
            for name in GOV_MENTION.findall(line):
                token = name.strip()
                if token in gov_names or token + '.md' in gov_names:
                    cands.append(_cand(f'引用治理文档无「{MAINT_MARK}」标注: {path}:{i} → {token}'))
    return cands, []


def _checks(files):
    """阶段编排：返回 [(候选行列表, 置红行列表), …]（顺序＝检查 ①–⑤）。"""
    gov = [f for f in files if f.endswith('.md') and not f.startswith('skills/')]
    assets = [f for f in files if f.endswith('.md') and f.startswith('skills/')]
    return [
        _check_refs(gov, assets),
        _check_toc(gov),
        _check_lines(files),
        _check_changelog(),
        _check_maint(_gov_names(files), files),
    ]


def main(argv=None):
    _stdout_utf8()
    ap = argparse.ArgumentParser(
        prog='check_content.py',
        description='内容轨检查器（只读；扫全仓 Markdown 五项检查。分档见 docs/standards/测试与验收标准.md §1.2）')
    ap.add_argument('--static', action='store_true',
                    help='与无参数同义：扫全仓（本工具无「在制」概念）')
    args = ap.parse_args(argv)

    files = _repo_files()
    if files is None:
        print('x 取不到件清单（`git ls-files` 失败）——本工具须在 git 仓库内运行', file=sys.stderr)
        return 2

    gov = [f for f in files if f.endswith('.md') and not f.startswith('skills/')]
    results = _checks(files)
    cands = [l for c, _ in results for l in c]
    reds = [l for _, r in results for l in r]
    gov_n = len([f for f in files if f.endswith('.md') and not f.startswith('skills/')])
    asset_n = len([f for f in files if f.endswith('.md') and f.startswith('skills/')])
    print(_info(f'扫描 {gov_n + asset_n} 件 Markdown（治理文档 {gov_n}／skill 资产 {asset_n}）；'
                f'加粗密度未实现（见 测试与验收标准 §4 G1）'))
    for c, r in results:
        for line in c + r:
            print(line)
    print(_info(f'候选 {len(cands)} 条（只呈报）｜置红 {len(reds)} 条'))
    return 1 if reds else 0


if __name__ == '__main__':
    sys.exit(main())
