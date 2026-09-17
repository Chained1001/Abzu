"""内容轨检查器（仓级开发守卫，`scripts/check.sh` [3] 段调用）。

事故出身与历次裁定：见 `docs/specs/093-2026-09-15-守卫面建设批.md`（`[3]` 段待建一件 ＋
`check_spec.py` 的 `\\|` 静默盲区一件，两件同批处置）。行内不写批号——事故与沿革记 `CHANGELOG` 与 git 历史，指认归档规格用全路径。

用途：扫全仓 Markdown（治理文档 ＋ skill 资产）的**七项内容轨检查**——① 引用闭合（治理文档的相对
  Markdown 链接须实存——**行内代码跨度与围栏块内不计**；skill 资产内 `references/`／`assets/`／`scripts/` 路径引用须实存）② TOC
  存在性（常驻文档 >100 行须有 `## 目录` 且条目与 H2 逐字一致；**规格与归档件不适用**）③ `SKILL.md`
  ≤500 行 ＋ 单 reference <300 行 ④ `CHANGELOG` 条目 ≤400 字符 ⑤ 「维护出处」标注（skill 资产行内
  出现「**见／按／引／依照／据** ＋ 反引号治理件名」形态而无标注者）。
  ⑥ 每批必读件字数预算（见 `HOT_BUDGET`）⑦ 用词（禁用清单见 `docs/standards/文字与命名标准.md` §6；
  守卫逐行读该件界标段）。

  **加粗密度不实现**——阈值未立法且仓内零**适用**目标件（见 `文字与命名标准` §13）。
用法与参数：`python scripts/check_content.py [--static]`
  · `--static` 与**无参数同义**（保留该写法只因 `[4]` 段既有调用惯例）；两者均**扫全仓**——本工具
    **无「本批改动文件」概念**，七项检查一律扫全仓。
    仍为全仓 `docs/`＋根 `*.md`（含归档、排本批在制规格）。
  · 参数非法（含未知选项）＝用法说明 ＋ 退出 `2`。
  · 输出体例（沿用 `check.sh` 段输出规范）：候选行＝`·` ＋ 空格起首；判为失败行＝`x` ＋ 空格起首；
    信息行＝两空格缩进。
  · 退出码：`0` 无判为失败项（**候选不影响退出码**）／`1` 有判为失败项／`2` 参数或环境错。
  · **分档**：可判为失败＝③④（阈值无歧义、现状全绿）；候选只呈报＝①②⑤⑥⑦（存量债面宽、判定标准含近似）。
依赖与前置：Python 3 标准库（argparse／os／re／subprocess／sys），零外部依赖；不联网、不跑 LLM。
  前置＝git 仓库内（件清单取 `git ls-files -z` ＋ `--others --exclude-standard`，覆盖未跟踪但未忽略者；
  `-z` 亦回避 `core.quotepath` 对中文路径的引号化）。
只读不写盘**任何**文件：不跑 git 写命令、不跑目标件内任何命令；语法自检用 `ast.parse` 而**非**
  `py_compile`（后者会落 `__pycache__`——守卫不得有写盘副作用）。读文件一律显式 `encoding='utf-8'`。
维护入口：新增检查在 `_checks()` 挂新 `_check_*`（返回 `(候选行, 判为失败行)`）；三体例改 `_cand()`／
  `_red()`／`_info()`；件清单改 `_repo_files()`；行数计算方式改 `_lines()`；每批必读件字数预算改 `_check_budget()`／`HOT_BUDGET`；⑦ 用词改 `_check_words()`／`_ban_list()`／`WORD_SRC`；TOC 判定标准改 `_toc_state()`；
  ⑤ 的形态正则改 `GOV_MENTION`；① 链接扫描的跨度／围栏跳过判定标准改 `_span_ranges()`／`FENCE_LINE`；
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
# skill 资产内的路径引用（skill 根相对；`文字与命名标准` §4 表：禁裸文件名、用根相对路径文字）
ASSET_REF = re.compile(r'`((?:references|assets|scripts)/[A-Za-z0-9._/\-]+)`')
# ⑤ 的形态：「见／按／引／依照／据 ＋ 可选空格与左括号 ＋ 反引号治理件名」
GOV_MENTION = re.compile(r'(?:见|按|引|依照|据)[ \t（]*`([^`\n]+)`')
MAINT_MARK = '维护出处'
CHANGELOG = 'CHANGELOG.md'
SKILL_LINE_MAX = 500          # `skill资产标准` §9：`SKILL.md` 硬上限（超限＝判为失败）
REF_LINE_MAX = 300            # `skill资产标准` §9：单 reference <300 行（≥300＝判为失败）
ENTRY_CHAR_MAX = 400          # `施工机制` §三：`CHANGELOG` 条目 ≤400 字符（超限＝判为失败）
TOC_LINE_MIN = 100            # `文字与命名标准` §10 第 3 条：超 100 行文件头部放节目录
SPECS_PREFIX = 'docs/specs/'  # 规格与归档件不适用 TOC 存在性


def _stdout_utf8():
    """中文 Windows 下 stdout／stderr 默认 GBK，打印 `·`／`x`／中文会 UnicodeEncodeError；两流各自
    try／except——某流不可 reconfigure（如已被替换为无该方法的对象）不影响另一流（`check_spec.py` 同计算方式）。"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8')
        except Exception:
            pass


def _cand(text):
    """候选行（只呈报；`AGENTS.md` §五.2 候选永不拦截）。"""
    return '· ' + text


def _red(text):
    """判为失败行（计入退出码 1）。"""
    return 'x ' + text


def _info(text):
    """信息行（两空格缩进；沿用 `check.sh` 段输出体例）。"""
    return '  ' + text


def _read(path):
    """容错读（显式 UTF-8；`运行环境标准` §3.2）。"""
    with io.open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def _lines(text):
    """行数计算方式＝**换行符出现次数**（与 `wc -l` 一致；`施工机制` §二 断言写法——禁 `splitlines()`）。"""
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
    """治理件名集合（用于 ⑤ 的「反引号治理件名」判定标准）：非 `skills/` 下 `.md` 的**仓根相对路径**
    与**基名**两种写法都收（`文字与命名标准` §4：资产内指向治理文档写 `{件名}`，如 `书目录契约`）。"""
    names = set()
    for f in files:
        if not f.endswith('.md') or f.startswith('skills/'):
            continue
        names.add(f)
        names.add(os.path.basename(f))
        names.add(os.path.basename(f)[:-3])
    return names


def _norm_link_target(path, url):
    """治理文档相对链接的目标路径（去片段、去查询串；以该件所在目录为基准）。"""
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
    **候选类**：存量债面宽（`施工机制` §四 分档）。① 的链接扫描**跳过行内代码跨度与
    围栏块**（跨度内与围栏内的示例串不是链接；判定标准见 `_span_ranges()`／`FENCE_LINE`）。"""
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
                continue          # 围栏块内的行不是链接（计算方式同 check_spec.check_writing）
            outside = list(line)
            for s, e in _span_ranges(line):   # 行内代码跨度内的 `[..](url)` 不是链接（同上计算方式）
                for k in range(s, e):
                    outside[k] = ' '
            for url in MD_LINK.findall(''.join(outside)):
                if url.startswith(('http', '#', 'mailto')):
                    continue
                target = _norm_link_target(path, url)
                if target and not os.path.exists(os.path.join(ROOT, target)):
                    cands.append(_cand(f'找不到对应: {path}:{i} → {url}'))
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
    H2 **逐字一致**（判定标准见`文字与命名标准` §10 第 3 条；规格与归档件不适用——其节序由规格形态承载）。"""
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
    """③ 行数（**可判为失败**）：`skills/*/SKILL.md` ≤500 行、单 reference <300 行
    （阈值见`skill资产标准` §9；`assets/` 不计行数预算，同条）。"""
    reds = []
    for path in files:
        parts = path.split('/')
        if len(parts) == 3 and parts[0] == 'skills' and parts[2] == 'SKILL.md':
            n = _lines(_read(os.path.join(ROOT, path)))
            if n > SKILL_LINE_MAX:
                reds.append(_red(f'{path}: {n} 行 > {SKILL_LINE_MAX}（`skill资产标准` §9）'))
        elif (len(parts) == 4 and parts[0] == 'skills' and parts[2] == 'references'
                and path.endswith('.md')):
            n = _lines(_read(os.path.join(ROOT, path)))
            if n >= REF_LINE_MAX:
                reds.append(_red(f'{path}: {n} 行 ≥ {REF_LINE_MAX}（`skill资产标准` §9）'))
    return [], reds


def _check_changelog():
    """④ `CHANGELOG` 条目限长（**可判为失败**）：列 0 起首的 `- ` 条目行长 ≤400 字符
    （阈值见`施工机制` §三；计算方式＝整行字符数，含列表标记）。"""
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
    **无标注**者（判定标准见`文字与命名标准` §4「运行时资产引用治理文档」；写法与正例同节 §5 表末行）。
    **候选类**：判定标准含近似（无标注的等价写法会漏报——本检查器自身注释）。"""
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


# ⑥ 每批必读件字数预算（2026-09-17 机制成本研究加）：每批必读件被**每个 subagent 实例**读入，
# 体量直接乘上批内实例数（109 实测：单批 5 个实例、开工说明点名面上限 ≈ 10.7 万字符/实例）。
# 阈值＝(仓根相对路径, 上限字符, 说明)；目录前缀以 `/` 结尾表**逐件判**。
# 依据＝`AGENTS.md` §四「doc-budget 字数预算」的解冻词「单文件 >2 万字符」——`施工机制` 2026-09-17
# 曾实测 23,883 字符、条件成立；**同日冷热分离后降至 11,988**，故上限线随之收紧至 13,000（只许缩不许涨）。
# **候选、恒不判为失败**（`AGENTS.md` §五.2）：预算用于防回涨，不用于拦截正确改动。
HOT_BUDGET = (
    ('AGENTS.md', 8000, '宪法入口'),
    ('docs/specs/施工机制.md', 13000, '协作规则主件（上限线，目标 ≤12000）'),
    ('docs/standards/', 15000, '标准件（逐件）'),
)


def _check_budget(files):
    """⑥ 每批必读件字数预算（**候选，恒不判为失败**）：逐件核 `HOT_BUDGET`，超限即报候选行。
    计算方式＝**字符数**（`len(_read(...))`，与 `施工机制` §二 断言写法一致，非字节）；件不存在则跳过（不猜）。"""
    cands = []
    for rel in files:
        cap = None
        for pat, lim, _why in HOT_BUDGET:
            if pat.endswith('/'):
                if rel.startswith(pat) and rel.endswith('.md'):
                    cap = lim
                    break
            elif rel == pat:
                cap = lim
                break
        if cap is None:
            continue
        try:
            n = len(_read(os.path.join(ROOT, rel)))
        except OSError:
            continue
        if n > cap:
            cands.append(f'· 每批必读件字数超预算: {rel} —— 实测 {n} 字符 ＞ 预算 {cap}')
    return cands, []


# ⑦ 用词（2026-09-17 用词规范与禁用清单批；同年开发侧重构随《用词标准》并入《文字与命名标准》）：禁用清单以 `docs/standards/文字与命名标准.md`
# §6 的界标段（守卫**逐行读本段**）；存量迁移分三批（该件 §7），迁移期**恒为新旧双读**。
# **候选、恒不判为失败**（存量逾千处，迁移分三批，做法见 `docs/standards/文字与命名标准.md` §7；
# 每次运行的实测值由末行报出，不在此写死）。
WORD_SRC = 'docs/standards/文字与命名标准.md'
WORD_BEGIN = '<!-- 用词禁用清单：'
WORD_END = '<!-- 用词禁用清单完 -->'
WORD_BATCH_SPEC = re.compile(r'^docs/specs/\d{3}-')
WORD_SKIP_PREFIX = ('docs/specs/archive/',)
WORD_SKIP_FILES = ('CHANGELOG.md',)


def _ban_list():
    """读禁用清单（以此为准）。返回 [(旧词, 新词)]（按旧词长度降序＝长词优先）；读不到返回 None。"""
    path = os.path.join(ROOT, WORD_SRC)
    if not os.path.isfile(path):
        return None
    text = _read(path)
    s = text.find(WORD_BEGIN)
    e = text.find(WORD_END, s + 1) if s >= 0 else -1
    if s < 0 or e < 0:
        return None
    out = []
    for line in text[s:e].split('\n'):
        line = line.strip()
        if not line or line.startswith(('#', '<!--', '```')):
            continue
        old, sep, new = line.partition('→')
        if not sep:
            continue
        old, new = old.strip(), new.strip()
        if old and new:
            out.append((old, new))
    if not out:
        return None
    return sorted(out, key=lambda kv: -len(kv[0]))


def _ok_words():
    """读 §8 可用项目词的**产品领域词**（与 WORD_SRC 同源）：取「产品领域词：」起、至句号止，
    按 ／ 切分并剥掉（…）括注——如「标尺（参考标尺）」取「标尺」。读不到返回空表（该段是本件
    固定条文，缺失属文件损坏——此时豁免面为空、只多报候选，方向安全）。"""
    try:
        text = _read(os.path.join(ROOT, WORD_SRC))
    except OSError:
        return []
    m = re.search(r'产品领域词：([^。]+)', text)
    if not m:
        return []
    seg = re.sub(r'（[^）]*）', '', m.group(1))
    return [w.strip() for w in seg.split('／') if w.strip()]


def _check_words(files):
    """⑦ 用词（**候选，恒不判为失败**；判定标准见`docs/standards/文字与命名标准.md` §6 的界标段，守卫逐行读该段）。
    逐件报「用词待改」一行（含命中词与次数，最多 4 词），末行报清单词数与命中件／处数。
    **跳过面**：`docs/specs/archive/`、在制批次规格（`docs/specs/NNN-*.md`）、`CHANGELOG.md`、清单件自身
    ——前三者是过程记录与历史证据，须逐字保留当时的旧词。**长词优先**：命中即以占位符遮盖，避免
    含子串的词对（如「脚本检查点」与「位置」）重复计数。**读不到清单**（缺件／无界标／清单为空）时报一行
    「用词检查未生效」——**不静默通过**（守卫失效须可见，`#31` 同族）。存量逾千处分三批迁移中
    （每次运行的实测值由末行报出，不在此写死）。"""
    bans = _ban_list()
    if bans is None:
        return [_cand('用词检查未生效：读不到 ' + WORD_SRC + ' 的禁用清单段（格式见该件 §6）')], []
    ok_words = _ok_words()
    cands = []
    hit_files = 0
    hits_total = 0
    for path in files:
        if not path.endswith('.md') or path == WORD_SRC or path in WORD_SKIP_FILES:
            continue
        if path.startswith(WORD_SKIP_PREFIX) or WORD_BATCH_SPEC.match(path):
            continue
        masked = _read(os.path.join(ROOT, path))
        for w in ok_words:   # §8 产品领域词豁免（产品专名先遮盖再计数——如 标尺／底盘／处方／定格）
            masked = masked.replace(w, '\u0000' * len(w))
        found = []
        for old, new in bans:
            n = masked.count(old)
            if not n:
                continue
            found.append((old, n, new))
            masked = masked.replace(old, '\u0000' * len(old))   # 长词优先：已计处不再重复计
        if not found:
            continue
        hit_files += 1
        n_file = sum(x[1] for x in found)
        hits_total += n_file
        found.sort(key=lambda t: -t[1])
        top = '、'.join('%s×%d→%s' % (o, n, w) for o, n, w in found[:4])
        more = '' if len(found) <= 4 else '（另 %d 词）' % (len(found) - 4)
        cands.append(_cand('用词待改: %s —— %d 处：%s%s' % (path, n_file, top, more)))
    cands.append(_cand('用词扫描：清单 %d 词｜命中 %d 件／%d 处——存量分批收尾（见 %s §7）'
                       % (len(bans), hit_files, hits_total, WORD_SRC)))
    return cands, []


def _checks(files):
    """阶段编排：返回 [(候选行列表, 判为失败行列表), …]（顺序＝检查 ①–⑦）。"""
    gov = [f for f in files if f.endswith('.md') and not f.startswith('skills/')]
    assets = [f for f in files if f.endswith('.md') and f.startswith('skills/')]
    return [
        _check_refs(gov, assets),
        _check_toc(gov),
        _check_lines(files),
        _check_changelog(),
        _check_maint(_gov_names(files), files),
        _check_budget(files),
        _check_words(files),
    ]


def main(argv=None):
    _stdout_utf8()
    ap = argparse.ArgumentParser(
        prog='check_content.py',
        description='内容轨检查器（只读；扫全仓 Markdown 七项检查。分档见 施工机制 §四）')
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
                f'加粗密度未实现（阈值未立法）'))
    for c, r in results:
        for line in c + r:
            print(line)
    print(_info(f'候选 {len(cands)} 条（只呈报）｜判为失败 {len(reds)} 条'))
    return 1 if reds else 0


if __name__ == '__main__':
    sys.exit(main())
