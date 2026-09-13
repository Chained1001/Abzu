"""规格静态自检器（开发工具，按需运行；供规划方在规格送审前机械检出四类规格缺陷）。

用途：对规格做**静态**检查（不执行规格内任何命令，只读规格、磁盘与只读 git 子命令）——检查 A 断言
自噬预警（断言 token 被自家 [A]／[B] 行的目标文本吞掉，呈报预测值与规格「到位」列的差；另有「零命中
待复核」——期望 ≥N（N≥1）而当前命中 0 时呈报，与「零命中核对未判」——期望子句多值、取数无法与
命令对齐时呈报同名候选行）、检查 B 计数实跑
重算（规格内「整件尺寸」声称与实测的差）、检查 C [A] 项**目标文本**的逐字落实核对、检查 D 规格写作
机械检查四类（嵌套反引号／代码跨度边缘空格／加粗引导行紧跟列表／规格内可解析相对链接）——四类一律
非阻断。无 `--static` 时的默认跑法另含动态阶段：从规格「验收断言」节提取命令断言（行内反引号与围栏
整行命令），白名单只读执行，三态呈报（可审计／不可审计／未跑成）——不做通过/失败判定（规格断言多系
施工后状态，本工具取的是当前树基线，供规划方对照规格内声称的基线／预验结论）。
用法与参数：`python scripts/check_spec.py [--static|--verify] <规格路径> [更多规格路径...]`
  · `--static`：只跑静态检查（`check.sh` [4] 段的调用形态）；**零位置参数时打印「无在制规格，跳过」
    并退出 0**（提交时在制规格通常为 0，明示跳过属预期常态）。
  · `--verify`：核验比对（改动面声明集 ↔ `git status`、过程产物两项）；与 `--static` 互斥；
    **不进 `check.sh` 门禁**（门禁运行点在制规格尚未归档，过程产物检查必然不符）。
  · 两者都不给：先跑动态阶段，再跑静态阶段。
依赖与前置：Python 3 标准库（re／subprocess／sys／os），零外部依赖；不联网、不装依赖、不跑 LLM。
  **本工具不写任何文件**（只读规格、磁盘与只读 git 子命令）；语法自检用 `ast.parse`，不用 `py_compile`
  （后者会留缓存产物）。子进程输出统一按 UTF-8 解码并对不可解码字节容错（中文 Windows 本地编码为 GBK）。
维护入口：新增断言载体形态扩 ASSERT_CMD 与 _assert_ok()；检查 A 判据改 check_swallow()；检查 B 的
  对象口径词表与判据改 check_counts()／_whole_size()／WHOLE_MARKS；检查 C 判据、表头别名与方向标记
  改 check_pairs()／_change_rows()／_target_blocks()／HDR_* 与 DIR_MARKS 常量；检查 D 改
  check_writing()；阶段编排、呈报前缀、空转明示与末尾三态判据改 static_report()；核验比对改
  verify_report()；模式分派与退出契约改 __main__。
事故出身：020–025 六发断言自噬（断言吞自家 [A] 文本／对象错／计数错／恒真假绿）——2026-09-07 作者裁定
  守卫化。本批（065）由旧仓 `main:scripts/check_spec_assertions.py` 移植重建为本仓形态（表格改动清单、
  `grep -c "TOKEN" FILE` 载体）。
退出契约（**须带限定词**）：**静态发现恒 0**——检查 A／B／C／D 四类无论报出多少条发现，一律只呈报、
  不影响退出码（`AGENTS.md` §五.2 候选永不拦截）。区分：`--verify` 模式的**过程产物缺失**可置退出 1
  （该模式不进 `check.sh` 门禁）；**参数错误／文件不存在 → 退出 2**；零位置参数 → 明示跳过 ＋ 退出 0。
  呈报前缀约定：非阻断发现一律 `·` 起首；`x` 起首只留给参数错误类（故源件的 `x 计数不符` 本批改为
  `· 计数不符`）。
载体形态说明：① 断言载体**两种形态都认**——`git grep -F -c -- "TOKEN" FILE` 与 `grep -c "TOKEN" FILE`
  （token 取引号内、目标取末参）；② 改动清单为**表格**形态，列角色按**表头别名**定位（路径列＝表头含
  「文件」或「新产品文档」；自由度列＝表头含「自由度」、无则取末列；改动列＝表头含「改动」），无别名可
  识别者整表跳过并明示；③ 检查 B 用**对象口径**判据（仅当该数字之前的紧邻文本显式指向整件尺寸、或与
  `wc -l` 类命令同段时才判，其余降为候选只计数不呈报；量词为「处」者口径另定，见 `_whole_size()`：
  仅当**整个紧邻段**含「加粗」且数字前紧邻文本不以「加」／「增」收尾时判为整件口径，实测值取加粗标记
  出现次数）；④ 检查 C 的逐字判据只对**含引号块**的 `[A]` 行
  生效，且单元格内有**方向标记**（`→`／`改述为`／`改为`／`改作`／`替换为`／`换为`）时只核**最后一个标记
  之后**的引号块（标记之前是「现文」＝改后已移除的旧文，核之必假阳性）；标记之后无引号块者该行不核、
  降为候选呈报（见 DIR_MARKS／_target_blocks()）。
呈报守恒：末尾三态判据计入 A／B／C／D 四类全部输出（含 B 的计数行），「· 无发现」只在四类全空时打印。
"""
import os
import re
import subprocess
import sys

ALLOWED = re.compile(
    r'^(grep|egrep|fgrep|wc|head|tail|ls|find|sed|cat|git|bash|sh|node|python|py|npx)\b'
)
MUTATING = re.compile(
    r'(^|\s)(rm|rmdir|mv|cp|mkdir|touch|chmod)(\s|$)'
    r'|git\s+(add|commit|push|pull|reset|checkout|merge|rebase|stash|mv|clean|tag)\b'
    r'|>>|npx\s+-y\b|py_compile'
)
# 断言节定位：**只认节名、不带位次**（位次随批次变，三／四均有）；节名容「验收断言」与旧称「验收标准」
SECTION = re.compile(r'^##[^#\n]*验收(?:标准|断言).*$', re.M)

# 静态检查阶段的节定位与识别口径（--static；只读，不执行规格内任何命令）
# 改动清单节：容错「首轮落地改动清单」等变体（061／065 实测变体）
CHANGE_SECTION = re.compile(r'^##[^#\n]*(?:首轮)?(?:落地)?文件级改动清单.*$', re.M)
# 断言载体两形态：`git grep -F -c -- "TOKEN" FILE` 与 `grep -c "TOKEN" FILE`
# （token 取引号内、目标取末参；选项顺序容错）
ASSERT_CMD = re.compile(
    r'''(?<![\w-])(?P<cmd>git\s+grep|grep)\b(?P<opts>(?:\s+-{1,2}[^\s"']+)*)'''
    r'''(?:\s+--)?\s+(?P<q>["'])(?P<token>.*?)(?P=q)\s+(?P<args>[^\n]*)'''
)
# 路径样 token 判据：形如 [\w./-]+\.(md|js|sh|py|json|jsonc) 的裸串，且作为仓根相对路径存在于磁盘
# （不以「含 /」为必要条件——否则 AGENTS.md／README.md／CHANGELOG.md 等根级文件永不被命中）
PATH_TOKEN = re.compile(r'[\w./-]+\.(?:md|js|sh|py|json|jsonc)')
# 计数声称：N 容错千分位逗号；量词覆盖「字符」与「行」＋「处」（072 按类扩，对象口径限死为**加粗标记
# 计数**，见 _whole_size()）；「条」／「项」／「个」不扩（对象随文件类型而异，口径不唯一，
# 见 `测试与验收标准` §4 G2）
# 左界否定环视：数字前紧邻字母/数字者不视为尺寸声称（如「MD034 行」「G1 行」的编号被读成行数）
CLAIM = re.compile(r'(?<![A-Za-z0-9])(\d[\d,]*)\s*(字符|行|处)')
# 限额标记：紧邻 N 之前的这类标记表明该数字是限额（如「条目 ≤ 400 字符」）而非实测尺寸，不计
LIMIT_MARKS = ('≤', '≥', '<', '>', '最多', '上限', '不少于', '以内', '以上',
               '至少', '至多', '不超过')
# 检查 B 的对象口径词表（仅当紧邻段显式指向整件尺寸时才判；「实件」为语料真阳性用词，须入表）：
# 全文／本件／实件／总行数／共 N 行／N 字符（字符量词由 CLAIM 的 unit 直接判为整件口径）
WHOLE_MARKS = ('全文', '本件', '实件', '总行数')
WHOLE_CLAIM = re.compile(r'共\s*[\d,]+\s*行')
# `wc -l` 类命令：与尺寸声称同段（同行）时，视为整件口径（命令自身不可解析为路径，故按行检测）
WC_CMD = re.compile(r'\bwc\b[^\n]{0,40}?\s-[A-Za-z]*l')
INLINE_CODE = re.compile(r'`([^`\n]+)`')
# 行首内容判据（动态阶段）：行内命令名只在「剥去列表标记／复选框后居于行首」时才视为断言抽取对象，
# 散文句中提及的命令名不抽取（形态：`- [ ] `cmd``／`1. `cmd``／裸行首跨度）
LINE_LEAD = re.compile(r'^\s*(?:[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+|\[[ xX]\]\s*)*')
# 检查 A／C 共用的表格形态判据：改动清单为 Markdown 表格，列角色按表头别名定位
TABLE_ROW = re.compile(r'^\s*\|.*\|\s*$')
TABLE_SEP = re.compile(r'^\s*\|[\s:|\-]+\|\s*$')
HDR_PATH_ALIASES = ('文件', '新产品文档')
HDR_FREEDOM_ALIAS = '自由度'
HDR_CHANGE_ALIAS = '改动'
# 引号块：逐字目标文本的载体（「…」／『…』）——检查 A 的目标文本与检查 C 的核对串都取自它
QUOTE_BLOCK = re.compile(r'「([^「」\n]*)」|『([^『』\n]*)』')
# 检查 C 的**方向标记**（§二 C 行 ③，产物审查 P0-1）：单元格内出现这些标记时，逐字核对面＝
# **最后一个标记之后**的引号块（标记之前的是「现文」，改后已被移除，核之必假阳性）
DIR_MARKS = ('→', '改述为', '改为', '改作', '替换为', '换为')
FENCE_BLOCK = re.compile(r'^\s*```[a-zA-Z]*\s*$')
# 检查 D：① ② 的 CommonMark 定界规则、③ 加粗引导行＋列表标记起首、④ 规格内可解析相对链接
BACKTICK_RUN = re.compile(r'`+')
BOLD_LEAD = re.compile(r'^\s*\*\*[^*\n]+\*\*\s*[：:]\s*$')
LIST_LEAD = re.compile(r'^\s*(?:[-*+]|\d+[.)])\s')
MD_LINK = re.compile(r'\[[^\]\n]*\]\(([^)\s]+?)\)')
# 检查 D ④ 的适用面：该类判据隐含「该件会被归档」，故对**从不归档**的件不判——即 check.sh [4] 段
# 扫描集排除的那份台账（docs/specs/collab-log.md）；**历史形态保留**（该台账机制已废、文件不存在，
# 常量留作「未来同类件」的显式登记位）
NEVER_ARCHIVED = ('collab-log.md',)
# 静态检查的扫描面排除项：`施工机制.md` **不是规格**，其 §八 模板内嵌本节标题（扫之即假发现源）；
# `check.sh` [4] 段的枚举口径已排除，此处再兜一道（工具被直接喂入时亦跳过并明示）
NEVER_SCANNED = ('施工机制.md',)


def extract(text):
    m = SECTION.search(text)
    if not m:
        return []
    section = text[m.end():]
    nxt = re.search(r'^##\s', section, re.M)
    if nxt:
        section = section[:nxt.start()]
    cmds = []
    seen = set()
    # 行内抽取只认「行首跨度」（剥去列表标记／复选框后以该跨度起首）——散文句中提及的命令名不抽取
    for line in section.splitlines():
        m = re.match(r'`([^`\n]+)`', LINE_LEAD.sub('', line))
        if not m:
            continue
        c = m.group(1).strip()
        if ALLOWED.match(c) and c not in seen:
            cmds.append(('行内', c))
            seen.add(c)
    for block in re.findall(r'```[a-z]*\n(.*?)```', section, re.S):
        for line in block.splitlines():
            c = line.strip()
            if (c and ALLOWED.match(c) and not c.startswith('#')
                    and c not in seen):
                cmds.append(('围栏', c))
                seen.add(c)
    return cmds


def _outside_quotes(c):
    """返回整行中「引号之外」的区间（单／双引号内的区间一概剔除）——引号内的元字符不计，
    否则 `git grep -F -c -- "a|b" file` 这类合法且安全的固定串断言会被误判为不可审计而漏审
    （本仓规格的断言 token 常含 `|`）。不做转义处理（够用即可）。"""
    out, quote = [], None
    for ch in c:
        if quote:
            if ch == quote:
                quote = None
            continue
        if ch in ('"', "'"):
            quote = ch
            continue
        out.append(ch)
    return ''.join(out)


def unauditable(c):
    """不可审计判据（顺序在放行判据之前）：命中返回判据说明（含命中的元字符，便于判因），否则 None。
    1 shell 解释器／包执行器整族；2 解释器任意代码入口（`-c` 后不要求空白，`-c"x"` 一并拦下）；
    3 裸解释器；4 引号外的 shell 元字符；5 sed 非 -n（既有行为保留）。"""
    m = re.match(r'^(bash|sh|node|npx)\b', c)
    if m:
        return f'shell 解释器／包执行器 {m.group(1)}'
    if re.match(r'^(python3?|py)\b.*\s-c', c):
        return '解释器任意代码入口（-c）'
    if re.match(r'^(python3?|py)\s*$', c):
        return '裸解释器'
    outside = _outside_quotes(c)
    for ch in ('|', ';', '&', '<', '>', '`'):
        if ch in outside:
            return f'引号外 shell 元字符 {ch}'
    if c.startswith('sed') and ' -n' not in c:
        return 'sed 非 -n'
    return None


def readonly(c):
    if MUTATING.search(c):
        return False
    if re.match(r'^(e?grep|fgrep|wc|head|tail|ls|find|cat)\b', c):
        return True
    if c.startswith(('sed',)) and ' -n' in c:
        return True
    if c.startswith('git') and re.match(r'git\s+(diff|status|log|show|grep)\b', c):
        return True
    # 不可达死码（保留以明示任意代码入口）：`python -c` 形态已被 unauditable() 判据 2 先行拦下
    if c.startswith(('python', 'py')) and ' -c ' in c:
        return True
    return False


def _emit(line):
    """打印一行；编码侧兜底——stdout 若非 UTF-8（中文 Windows 默认 GBK）则 UnicodeEncodeError，
    降级 ASCII 重打。返回 False 表示发生了编码崩溃（归入崩溃桶）。"""
    try:
        print(line)
        return True
    except UnicodeEncodeError:
        print(line.encode('ascii', 'backslashreplace').decode('ascii'))
        return False


def report(spec):
    text = open(spec, encoding='utf-8').read()
    cmds = extract(text)
    if not cmds:
        print('未提取到命令断言（无验收节或无白名单命令）')
        return
    ran = skipped = crashes = 0
    for i, (src, c) in enumerate(cmds, 1):
        reason = unauditable(c)
        if reason:
            _emit(f'[{i}] {src} SKIP（不可审计形态：{reason}）: {c}')
            skipped += 1
            continue
        if not readonly(c):
            _emit(f'[{i}] {src} SKIP（非只读白名单形态）: {c}')
            skipped += 1
            continue
        try:
            r = subprocess.run(c, shell=True, capture_output=True,
                               encoding='utf-8', errors='replace', timeout=120,
                               cwd=os.path.dirname(os.path.dirname(
                                   os.path.abspath(__file__))))
            if r.stdout is None or r.stderr is None:
                raise UnicodeError('解码侧未取到输出（stdout/stderr 为 None）')
            out = ((r.stdout or '') + (r.stderr or '')).strip().splitlines()
            head = ' ⏎ '.join(out[:3]) if out else '(无输出)'
            note = '（命令不可用）' if r.returncode in (126, 127) else ''
            if not _emit(f'[{i}] {src} exit={r.returncode}{note}: {c}\n    {head[:200]}'):
                raise UnicodeError('打印时编码失败（已降级 ASCII）')
            ran += 1
        except subprocess.TimeoutExpired:
            _emit(f'[{i}] {src} CRASH（未跑成）: {c}')
            crashes += 1
        except Exception:
            _emit(f'[{i}] {src} CRASH（未跑成）: {c}')
            crashes += 1
    print(f'== 共 {len(cmds)} 条：执行 {ran}｜跳过 {skipped}｜崩溃 {crashes} ==')
    if crashes:
        print('! 有断言未跑成——预验证据不完整')


def repo_root():
    """静态阶段的路径解析基准：脚本所在仓库根（循 report() 的 __file__ 推导做法）；定位失败返回 None。"""
    try:
        here = os.path.abspath(__file__)
    except NameError:
        return None
    root = os.path.dirname(os.path.dirname(here))
    return root if os.path.isdir(os.path.join(root, 'scripts')) else None


def _abs(target, root):
    """规格内声明的相对路径（检查 A 的目标文件、检查 B 的待测文件）一律按仓库根解析，不依赖调用者 cwd。"""
    return target if os.path.isabs(target) else os.path.join(root, target)


def _section(text, pattern):
    """截取 H2 节全文（下一个行首 ## 止；无则到文末）。pattern 为节标题正则。"""
    m = pattern.search(text)
    if not m:
        return ''
    rest = text[m.end():]
    nxt = re.search(r'^##\s', rest, re.M)
    return rest[:nxt.start()] if nxt else rest


def _cells(line):
    """Markdown 表格行 → 单元格文本列表（去首尾竖线与每格空白）。"""
    s = line.strip()
    if s.startswith('|'):
        s = s[1:]
    if s.endswith('|'):
        s = s[:-1]
    return [c.strip() for c in s.split('|')]


def _tables(text):
    """把文本切成连续的表格块（每块＝行列表，首行为表头）。"""
    tables, cur = [], []
    for line in text.splitlines():
        if TABLE_ROW.match(line):
            cur.append(line)
        else:
            if len(cur) >= 2:
                tables.append(cur)
            cur = []
    if len(cur) >= 2:
        tables.append(cur)
    return tables


def _change_rows(text):
    """解析「文件级改动清单」节内的**表格**，返回 (行列表, 跳过表数)。
    行＝{'path','change','freedom','raw'}（各自为单元格文本，缺列时为空串）。列角色按**表头别名**定位：
    路径列＝表头含「文件」或「新产品文档」者（059 的路径列在第 1 列且表头为「新产品文档」）；自由度列＝
    表头含「自由度」者（无则取末列——059／`施工机制` §八 模板形态）；改动列＝表头含「改动」者（无则取
    整行原文）。**无任何别名可识别的表整表跳过并计数**（由调用方明示），不猜列角色。"""
    rows, skipped = [], 0
    for table in _tables(_section(text, CHANGE_SECTION)):
        header = _cells(table[0])
        path_i = next((i for i, c in enumerate(header)
                       if any(a in c for a in HDR_PATH_ALIASES)), None)
        free_i = next((i for i, c in enumerate(header)
                       if HDR_FREEDOM_ALIAS in c), None)
        change_i = next((i for i, c in enumerate(header)
                         if HDR_CHANGE_ALIAS in c), None)
        if path_i is None and free_i is None:
            skipped += 1
            continue
        for line in table[1:]:
            if TABLE_SEP.match(line):
                continue
            cells = _cells(line)
            path = cells[path_i] if path_i is not None and path_i < len(cells) else ''
            if free_i is None:
                free = cells[-1] if cells else ''
            else:
                free = cells[free_i] if free_i < len(cells) else ''
            if change_i is None:
                change = line.strip()
            else:
                change = cells[change_i] if change_i < len(cells) else ''
            rows.append({'path': path, 'change': change,
                         'freedom': free, 'raw': line})
    return rows, skipped


def _quoted_blocks(cell):
    """单元格内的引号块内容列表（「…」／『…』，按出现顺序）；无引号块返回空列表。
    引号块＝逐字目标文本的载体：检查 C 只对含引号块的行做逐字核对，检查 A 的目标文本亦优先取它。
    **空引号对（`「」`）不计入**：`findall` 对未参与匹配的组给空串，`a if a else b` 会把空串换成 `None`
    而让 `_row_target_text()` 误以空串为「有目标文本」的列表——不再回落改动单元格、真实预警被吞
    （066 批产物审查 F-02／F-05）。故取值按「组是否参与匹配」并滤除空块，与 `_target_blocks()` 同口径。"""
    blocks = [m.group(1) if m.group(1) is not None else m.group(2)
              for m in QUOTE_BLOCK.finditer(cell or '')]
    return [b for b in blocks if b]


def _dir_split(cell):
    """按**方向标记**切分单元格：返回 (标记数, 最后一个标记的结束位置)。无标记返回 (0, 0)。
    标记判定在**整格原文**上做（标记可能落在引号块内部——如 059 D2 的 `→`，此时其后无引号块，
    正是「不核逐字」分支要的形态）。"""
    pos, n = 0, 0
    for mark in DIR_MARKS:
        i = (cell or '').rfind(mark)
        if i != -1:
            n += 1
            pos = max(pos, i + len(mark))
    return n, pos


def _target_blocks(cell):
    """检查 C 的逐字核对面（§二 C 行 ③）：**有方向标记**的单元格取最后一个标记**之后**的引号块
    （标记之前的是「现文」，改后已被移除，核之必假阳性）；**无方向标记**者取全部引号块（维持原口径）。
    **空引号对（`「」`）不进核验面**：取块内容按「组是否参与匹配」判定——`or` 会把空串判假后回落到
    `None`（另一分支未参与匹配），下游 `_strip_wrap()` 随即崩（066 批实跑触发）；故空块滤除、非空块照核。
    返回 (核验块列表, 标记后无引号块)；后者为真＝该行不核逐字、降为候选呈报。"""
    cell = cell or ''
    n, pos = _dir_split(cell)
    blocks = [(m.start(), m.group(1) if m.group(1) is not None else m.group(2))
              for m in QUOTE_BLOCK.finditer(cell)]
    blocks = [(s, b) for s, b in blocks if b]
    if not n:
        return [b for _, b in blocks], False
    after = [b for s, b in blocks if s >= pos]
    return after, not after


def _row_target_text(row):
    """检查 A 的「目标文本」：该行引号块内容优先（拼接），**缺则取「改动」单元格全文**。"""
    blocks = _quoted_blocks(row['change'])
    return '\n'.join(blocks) if blocks else row['change']


def _row_target_file(row, root):
    """该行的目标件（路径列内第一个可解析的路径 token）；不可解析返回 ''（不猜）。"""
    for t in PATH_TOKEN.findall(row['path'] or ''):
        if os.path.isfile(_abs(t, root)):
            return t
    return ''


def _row_mentions(row, target):
    """断言的目标件是否**出现在该行**（路径列命中；路径列缺列时退回整行原文）。
    目标件按全路径或基名双向命中（059 的路径列写裸文件名，而断言写全仓相对路径）。"""
    cell = row['path'] or row['raw']
    return target in cell or os.path.basename(target) in cell


def _assert_ok(m):
    """载体门：两形态都认——`git grep` 须带 `-F` 与 `-c`，裸 `grep` 须带 `-c`（计数形态）。"""
    letters = ''.join(o.lstrip('-') for o in m.group('opts').split())
    if 'c' not in letters:
        return False
    if m.group('cmd').startswith('git') and 'F' not in letters:
        return False
    return True


def _assert_refs(text):
    """从断言节提取断言（token, 目标件）列表；载体两形态都认：`git grep -F -c -- "TOKEN" FILE`
    与 `grep -c "TOKEN" FILE`（token 取引号内、目标取末参）。"""
    refs = []
    for m in ASSERT_CMD.finditer(_section(text, SECTION)):
        if not _assert_ok(m):
            continue
        args = m.group('args').strip().split('|')[0].split()
        if not args:
            continue
        refs.append((m.group('token'), args[-1].strip('\'"`')))
    return refs


def check_swallow(text, root):
    """检查 A：断言自噬预警（只呈报，不影响退出码）。返回 (输出行列表, 提取断言数, 命中条数)。
    **hit 门**＝「该断言的目标件出现在某条 [A]／[B] 行」（表格形态判据；源件的「改动清单节内有 `###`
    子节声明目标路径」在本仓真规格上 `###` 计数恒 0 → 恒空转，故本批重做）：[A]／[B] 行的目标文本＝
    该行引号块内容优先、缺则取「改动」单元格全文（见 _row_target_text()）——**`[B]` 行的「目标文本内」含
    改动说明文字，故近似预测为上限**；n＝目标文本内 token 出现次数，cur＝目标件当前含 token 的行数。
    提取数＞0 而命中 0 时，由 static_report() 打印空转明示行（与「· 无发现」不得同屏）。
    **零命中待复核**（F2）：对**通过 hit 门**且**目标件实存**（os.path.isfile）的断言，在其命令所在行起
    （**含本行**）其后 4 行的窗口内解析「期望 ≥N」（正则容 `各`／`依次`／`均` 前缀与 `**` 星号修饰，故
    `期望各 ≥1`／`期望依次 ≥1` 一并认）——N ≥ 1 而 cur == 0 时报候选行。两个前提缺一不可：
    hit 门不过或目标件不存在者 cur 恒 0，会把「目标件被解析成垃圾」的断言误报成永久候选；N == 0 不报
    （「期望 0」型零命中即达成）。**判据只认「字面 token」**：cur 系字面子串计数（`token in line`），而
    载体允许 `grep -c -E "…"` 形态——token 带正则元字符时 cur 恒 0，属假阳性，故仅当 token 的字符**全部
    落在字面集**（字母／数字／汉字／`_`／`-`／`/`／`／`／空格）内才判，含字面集外字符（`.`／`|`／`^` 等）
    者一律跳过该判、不报（保守方向：宁可漏报不可误报）。**取数面＝「期望」子句，按下列先后取数**
    （顺序即口径，不得颠倒）：① 取子句内数字**有序列表** `nums`（自首个「期望」出现处起，止于 `；`／
    `。`／`（预验`／行尾——尾数不计；**不得用 `set`**）；② `len(nums)` 等于本规格提取到的断言总数 `M`
    ＝`len(refs)` 时，取 `nums[i]`（`i`＝该断言在 `refs` 中的序号，**0 基**）——该形态要求**每个数字各对
    一条命令**，故不做「全同」要求、也不按分配型词面跳过；③ `len(nums) != M` 且该行是**分配型句**
    （命令序数分配 `第一命令`／`第二、三命令`／「各命令」／「分别」）→ **不判**；④ `len(nums) != M` 且
    子句数字**全同** → 取该值；⑤ 其余（`len(nums) != M` 且不全同）→ **不再静默**，产
    「· 零命中核对未判（期望子句多值 …，与命令无法对齐）」候选行（`nums` 按出现顺序列举）。
    故 `期望 ≥1；预验基线 0。` 判得 1（尾数不计）；`期望：**≥1**／**0**／**0**` 为 K≠M 且不全同 →
    走 ⑤ 产未判候选行；`第一命令期望 ≥1（…）；第二、三命令期望 0` 为分配型 →
    走 ③ 不判（数字无法与命令对齐；`062`:123 那类「分配型＋全同」的既有假阳性不得复活）。配对支路依赖「数字序＝命令序」
    ——**写反即静默误配**（缓解＝`规格写作标准` §5.9）。「零命中待复核」与「零命中核对未判」两行
    均须计入 static_report() 的末尾三态判据（findings）。
    n == 0 的两种情形均不锁定单义（(cur, n) 二元分辨不出「哨兵型保留／[A]／[B] 项目标文本漏写」与
    「归零型已达成」）：cur > 0 者计入一行中性汇总；cur == 0 者打中性行。预测行（cur + n 加法预测）
    只在 cur > 0 且 n > 0 时输出：cur == 0 时不存在既有命中可被替换吞掉，加法预测无对象。"""
    a_rows = [r for r in _change_rows(text)[0]
              if '[A]' in r['freedom'] or '[B]' in r['freedom']]
    refs = _assert_refs(text)
    # 零命中待复核的行位置数据不在 _assert_refs() 的既有返回面内（不动其返回语义）：本函数内以
    # ASSERT_CMD 复扫取行号——过滤判据与 _assert_refs() 同源，两份列表逐项对齐。
    sec = _section(text, SECTION)
    sec_lines = sec.splitlines()
    located = []
    for m in ASSERT_CMD.finditer(sec):
        if not _assert_ok(m):
            continue
        args = m.group('args').strip().split('|')[0].split()
        if not args:
            continue
        located.append(sec.count('\n', 0, m.start()) + 1)
    expect_re = re.compile(r'期望[：:]?\s*(?:各|依次|均)?\s*\*{0,2}\s*(?:≥|>)?\s*(\d+)')
    # 取数面＝「期望」子句（P1-6）：命令序数分配（第一命令／第二、三命令）或「各命令」「分别」→ 该判跳过；
    # 子句终点＝；／。／（预验／行尾——本仓期望行普遍带「；预验基线 N」尾，按整行取数会把尾数计入而静默
    distrib_re = re.compile(r'第[一二三四五六七八九十百\d]+'
                            r'(?:\s*[、，,／/]\s*[一二三四五六七八九十百\d]+)*\s*命令')
    expect_stops = ('；', '。', '（预验')
    # 字面 token 判据（见 docstring）：\w 即字母／数字／汉字／下划线，另容 - 与两种斜杠、空格
    literal_token = re.compile(r'^[\w/\uFF0F\- ]+$')
    lines = []
    neutral = 0
    hits = 0
    for i, ((token, target), line_no) in enumerate(zip(refs, located)):
        path = _abs(target, root)
        exists = os.path.isfile(path)
        cur = 0
        if exists:
            with open(path, encoding='utf-8') as f:
                cur = sum(1 for line in f if token in line)
        hit = [r for r in a_rows if _row_mentions(r, target)]
        if not hit:
            lines.append(f'· 跳过（目标件不出现在任何改动行）: {token} @ {target}')
            continue
        hits += 1
        n = sum(_row_target_text(r).count(token) for r in hit)
        if n == 0:
            if cur > 0:
                # 哨兵型 token（到位＝现状，目标文本本不必提及）与归零型已达成同形：计入中性汇总，不单义锁定
                neutral += 1
            else:
                lines.append(f'· 目标文本未提及且现行为 0: {token} @ {target}'
                             f'（可能是 [A]／[B] 项目标文本漏写，也可能是归零型已达成）')
        elif cur > 0:
            lines.append(f'· 自噬预警: {token} @ {target} —— 现行 {cur}｜目标文本内 {n}'
                         f'｜近似预测 {cur + n}（未计删除，须人工核对到位期望）')
        # 零命中待复核（F2）：窗口＝命令所在行起（含本行）其后 4 行；只在 hit 门通过、目标件实存、
        # 且 token 属字面集（无正则元字符——否则 cur 恒 0 必假阳性）时判
        if exists and cur == 0 and literal_token.match(token):
            # 取数行＝窗口内首个命中「期望」（＝正则口径的解析门）的那一行；**取数面＝「期望」子句**，
            # 按 docstring 的五步先后取数（顺序即口径）：① 取有序数字列表 nums；② K＝M 按命令序号（0 基）
            # 配对取值——每数字各对一条命令，不要求全同、不看分配型；③ K≠M 且分配型句 → 不判；
            # ④ K≠M 且数字全同 → 取该值；⑤ 其余 → 产「未判」候选行（不再静默，见 072 与 G15）
            exp = None
            undecided = None
            for w in sec_lines[line_no - 1:line_no + 4]:
                mm = expect_re.search(w)
                if not mm:
                    continue
                tail = w[mm.start():]
                cuts = [j for j in (tail.find(s) for s in expect_stops) if j != -1]
                if cuts:
                    tail = tail[:min(cuts)]
                nums = [int(x) for x in re.findall(r'\d+', tail)]
                if len(nums) == len(refs):
                    exp = nums[i]       # ② K＝M：按序配对（i 与 refs 序号对齐，从 0 起）
                elif (distrib_re.search(w) or '各命令' in w or '分别' in w):
                    pass                # ③ 分配型句不判——先于「全同取值」，既有假阳性不得复活
                elif len(set(nums)) == 1:
                    exp = nums[0]       # ④ K≠M 且全同：取该值
                else:
                    undecided = nums    # ⑤ K≠M 且不全同：产未判候选行（不再静默）
                break
            if undecided is not None:
                lines.append(f'· 零命中核对未判（期望子句多值 {undecided}，'
                             f'与命令无法对齐）: {token} @ {target}')
            elif exp is not None and exp >= 1:
                lines.append(f'· 零命中待复核: {token} @ {target} —— 期望 ≥{exp} 而当前命中 0'
                             f'（施工前属预期；施工后仍零即口径已变或断言失效）')
    if neutral:
        lines.append(f'· 现行有值／目标文本未提及: {neutral} 个'
                     f'（请对照到位列核对——可能是哨兵型保留，也可能是归零型已达成）')
    return lines, len(refs), hits


def _segments(line):
    """行内代码 span 的「紧邻段」切分（检查 B 配对判据）：返回 [(span 内容, 紧邻段)]——
    紧邻段＝自该 span 的反引号结束处起、至下一个反引号或行尾止的片段。计数声称只在紧邻段内
    识别，故不再与行内他处的数字发生关系（中间隔着反引号时才成立）。残留面：紧邻段内指代
    他物的数字仍会配对，彻底消除需语义解析——本函数只收窄、不自称根治。
    嵌套反引号（``x``）形态下配对同样不成立：取码 span 退化为内层 token——包路径时即路径本身、
    包数字时即纯数字；其紧邻段被紧随的残余反引号即刻截断为空，故路径不落入任何紧邻段（不构成
    「路径 + 其后紧邻段」的有效配对单元）。"""
    spans = list(INLINE_CODE.finditer(line))
    out = []
    for m in spans:
        nxt = line.find('`', m.end())
        out.append((m.group(1).strip(), line[m.end():nxt if nxt != -1 else len(line)]))
    return out


def _whole_size(seg, start, unit, line):
    """检查 B 的**对象口径**判据：该尺寸声称是否指向**整件尺寸**。
    是＝**该数字之前的紧邻文本内**含整件标记（全文／本件／实件／总行数——照 `LIMIT_MARKS` 的左界
    做法，标记须前置，否则同一紧邻段里**另一条**声称的「全文」会把本声称误判为整件口径）、或含
    「共 N 行」式声称、或量词为「字符」（字符量词本身即整件口径）、或该行与 `wc -l` 类命令同段。
    否＝降为候选（只计数、不逐条呈报）。
    量词「处」（072 按类扩、口径收紧）：对象口径**限死为加粗标记计数**——仅当**整个紧邻段 `seg`**
    含「加粗」（不看「加粗」在数字之前还是之后），且**数字之前**紧邻文本（`seg[:start]` 去尾空白后）
    **不以「加」／「增」收尾**（增量式如「本批给该件加 16 处加粗」不判）时判为整件口径；否则降为候选。
    不收窄即生假阳性（宽松闸在归档语料上 7 条判定 6 条报到，其中 3 条为假阳性，实测见 072 §一⑦）；「条」／「项」／
    「个」不扩（对象随文件类型而异，无法确定实测对象）。"""
    if unit == '字符':
        return True
    head = seg[:start]
    if unit == '处':
        return '加粗' in seg and not head.rstrip().endswith(('加', '增'))
    if any(mark in head for mark in WHOLE_MARKS):
        return True
    if WHOLE_CLAIM.search(head):
        return True
    return bool(WC_CMD.search(line))


def check_counts(text, root):
    """检查 B：计数实跑重算（只呈报，不影响退出码）。返回 (输出行列表, 判定条数, 候选条数)。
    配对判据＝路径紧邻段（见 _segments()）：一条计数声称只计入其所在紧邻段对应的路径。
    **对象口径**（本批改写；源件为词形黑名单——实测仅抑制 1／7 条假阳性）：本批只改判据层——「用件」
    判据（本批改动清单节内提及者记「基线漂移」、否则记「计数不符」）与源件同；尺寸声称的识别由词形
    黑名单改为**对象口径**（仅当该数字之前的紧邻文本显式指向整件尺寸时才判，见 _whole_size()），其余
    降为候选——只计数、不逐条呈报（四类已知假阳性：表行数／diff 增量／零命中数／引用行号）。两类输出
    皆只呈报、不置退出码。"""
    listed = _section(text, CHANGE_SECTION)
    lines = []
    judged = cand = 0
    cache = {}
    for line in text.splitlines():
        targets = [(t, seg) for t, seg in _segments(line)
                   if t and os.path.isfile(_abs(t, root))]
        if not targets:
            continue
        for target, seg in targets:
            if target not in cache:
                with open(_abs(target, root), encoding='utf-8') as f:
                    content = f.read()
                cache[target] = (len(content), len(content.splitlines()))
            nchar, nline = cache[target]
            for m in CLAIM.finditer(seg):
                num, unit = m.group(1), m.group(2)
                # 限额型数字不计：N 之前（允许中间隔空格）紧邻限额标记的，不视为对当前尺寸的声称
                if seg[:m.start()].rstrip().endswith(LIMIT_MARKS):
                    continue
                if not _whole_size(seg, m.start(), unit, line):
                    cand += 1
                    continue
                judged += 1
                if unit == '处':
                    # 「处」的实测值＝加粗标记出现次数（`**` 的 count，口径同 `文档写作标准` §一.3.8）；
                    # 缓存只存字符数与行数两项，故此处按目标件另读一次取标记计数
                    with open(_abs(target, root), encoding='utf-8') as f:
                        actual = f.read().count('**')
                else:
                    actual = nchar if unit == '字符' else nline
                if int(num.replace(',', '')) == actual:
                    continue
                head = f'{target} 称「{num} {unit}」实测 {actual}'
                if target in listed:
                    lines.append(f'· 基线漂移（本批改动件，不阻断）: {head}')
                else:
                    lines.append(f'· 计数不符: {head}')
    return lines, judged, cand


def _strip_wrap(s):
    """剥去逐字核验串的外层包裹（「」／单双反引号／表格管道），得纯文本。
    只在首尾成对时剥一层：形如「`0` 成功 / …」的串（首字符恰为反引号）不会被误剥。
    另做转义归一：规格要在代码跨度内嵌反引号，写作 `\\``（反斜杠是 Markdown 转义符、非内容），
    实文里是裸反引号——不归一则这类条目在已完工件上恒报假阳性（050 批五处实测）。"""
    s = s.strip().replace('\\`', '`')
    if len(s) >= 2 and s.startswith('「') and s.endswith('」'):
        s = s[1:-1].strip()
    if len(s) >= 4 and s.startswith('``') and s.endswith('``'):
        s = s[2:-2].strip()
    elif len(s) >= 2 and s.startswith('`') and s.endswith('`'):
        s = s[1:-1].strip()
    if len(s) >= 2 and s.startswith('|') and s.endswith('|'):
        s = s[1:-1].strip()
    return s


def check_pairs(text, root):
    """检查 C：[A] 项**目标文本**的逐字落实核对（只呈报，不影响退出码）。返回输出行列表。
    ① 列角色按表头别名定位（见 _change_rows()）：路径列＝表头含「文件」或「新产品文档」；自由度列＝
    含「自由度」（无则取末列，**单元格内含 `[A]` 者视同 `[A]` 行**——059 有「[A]＋[C]」写法）；
    无任何别名可识别的表整表跳过并明示。
    ② **逐字判据只对「目标文本来自引号块」的行生效**（我方规格的 `[A]` 行多为描述性散文，逐字核对会成
    片假阳性）：含引号块的行，其每块（≥8 字符）须在目标件内逐字命中，未命中即报「未落实或已漂移」；
    **无引号块的行降为候选呈报**（提示补引号块）——此做法使「目标文本用引号块书写」成为可机械鼓励的写法。
    ③ **方向标记切分**（§二 C 行 ③，产物审查 P0-1）：单元格内有方向标记（见 DIR_MARKS）时，核对面＝
    **最后一个标记之后**的引号块（标记之前的是「现文」＝改后已移除的旧文，核之必假阳性）；标记之后无
    引号块者该行**不核逐字**、降为候选呈报（见 _target_blocks()）。
    目标件不可解析的行不核（不猜）并计数明示（见末尾汇总行）；前缀一律 `·`（非 `x`——`x` 前缀语义只
    留给参数错误类）。"""
    if not CHANGE_SECTION.search(text):
        return []
    rows, skipped = _change_rows(text)
    lines = []
    if skipped:
        lines.append(f'· 跳过整表 {skipped} 张（表头无可识别的路径列／自由度列）')
    cache = {}
    no_face = 0
    for row in rows:
        if '[A]' not in row['freedom']:
            continue
        if not _quoted_blocks(row['change']):
            lines.append(f'· 该 `[A]` 行无逐字目标文本，建议补引号块: {row["raw"].strip()[:60]}')
            continue
        blocks, mark_no_block = _target_blocks(row['change'])
        if mark_no_block:
            lines.append(f'· 该 `[A]` 行方向标记后无引号块（不核逐字）: {row["raw"].strip()[:60]}')
            continue
        target = _row_target_file(row, root)
        if not target:
            no_face += 1      # 有核对面但路径列未解析到仓根路径：只计数，末尾汇总明示
            continue
        path = _abs(target, root)
        if path not in cache:
            with open(path, encoding='utf-8') as f:
                cache[path] = f.read()
        content = cache[path]
        for block in blocks:
            # 多行串按行切片，逐行要求命中（避免整段因一处空格差异而误判）；单行过短者跳过（噪声防护）
            for piece in _strip_wrap(block).splitlines():
                piece = piece.strip()
                if len(piece) < 8:
                    continue
                if piece not in content:
                    lines.append(f'· [A] 未落实或已漂移: {piece[:60]} @ {target}')
    if no_face:
        lines.append(f'· C：{no_face} 行无核对面（路径列未解析到仓根路径）')
    return lines


def _inline_spans(line):
    """按 CommonMark 定界规则切分行内代码跨度：n 个反引号开启、同长 n 个反引号闭合。
    返回 [(内容, 开启段起, 开启段止, 闭合段止)]——跨度内文本不参与 ① ② 判定。
    转义反引号（`\\``）是字面文本、不作定界符（否则形如 `…\\`x\\`…` 的合法跨度被切碎而误报）。"""
    spans = []
    runs = [(m.start(), m.end()) for m in BACKTICK_RUN.finditer(line)
            if m.start() == 0 or line[m.start() - 1] != '\\']
    i = 0
    while i < len(runs):
        s, e = runs[i]
        n = e - s
        j = next((k for k in range(i + 1, len(runs))
                  if runs[k][1] - runs[k][0] == n), None)
        if j is None:
            i += 1
            continue
        cs, ce = runs[j]
        spans.append((line[e:cs], s, e, ce))
        i = j + 1
    return spans


def _edge_space(content):
    """CommonMark 补齐规则：内容首尾皆为空格且不全为空格者，各剥一层。返回剥后仍存的
    边缘空格方向 (首, 尾)——仍存即为 MD038 违例（剥后无边缘空格者合法，如 `` ` x ` ``；
    全为空格的跨度不入本规则，实测 MD038 亦不报）。"""
    c = content
    if not c.strip(' '):
        return False, False
    if c.startswith(' ') and c.endswith(' '):
        c = c[1:-1]
    return c.startswith(' '), c.endswith(' ')


def check_writing(text, spec, root):
    """检查 D：规格写作机械检查（四类，只呈报，不影响退出码）。返回输出行列表。
    ① 嵌套反引号／② 代码跨度边缘空格——先按 CommonMark 定界规则切分跨度、跨度内文本不判，
    否则合法的双反引号补齐形态（如 `` `<path>` ``）会被朴素正则误报；
    归类判据：边缘空格且**跨度内含反引号**者为 ①（真嵌套、仅双反引号定界形态下可能），
    其余边缘空格者为 ②（含中文正文里「反引号紧贴文字」的常见误写）——「报不报」只由 _edge_space()
    定，与 markdownlint MD038 一致（`` `a ` ``／`` ` c` `` 报；`` ` x ` `` 与全空格跨度不报）；
    ③ 加粗引导行紧跟列表（`**…**：` 行 + 下一行列表标记起首）→ MD032；
    ④ 规格内可解析相对链接（按规格所在目录解析存在、按归档目录解析不存在 → 归档后必断链），
    该类的适用面限于会归档的件（NEVER_ARCHIVED 的件不判）。
    围栏块内的行一律不判（块内不是行内代码，也不是链接）。"""
    src = text.splitlines()
    spec_dir = os.path.dirname(os.path.abspath(spec))
    arch_dir = os.path.join(root, 'docs/specs/archive')
    archivable = os.path.basename(spec) not in NEVER_ARCHIVED
    lines = []
    in_fence = False
    for i, line in enumerate(src, 1):
        if FENCE_BLOCK.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for content, _s, _e, _ce in _inline_spans(line):
            head, tail = _edge_space(content)
            if not (head or tail):
                continue
            kind = '嵌套反引号' if '`' in content else '代码跨度边缘空格'
            lines.append(f'· 规格写作预警（{kind}）: {i} {line.strip()[:60]}')
        if BOLD_LEAD.match(line) and i < len(src) and LIST_LEAD.match(src[i]):
            lines.append(f'· 规格写作预警（加粗引导行紧跟列表）: {i} {line.strip()[:60]}')
        if not archivable:
            continue
        outside = list(line)
        for _c, s, _e, ce in _inline_spans(line):
            for k in range(s, ce):     # 跳过代码跨度内的文本（跨度内的 `[..](path)` 不是链接）
                outside[k] = ' '
        for m in MD_LINK.finditer(''.join(outside)):
            t = m.group(1)
            if t.startswith(('#', 'http://', 'https://', 'mailto:')) or os.path.isabs(t):
                continue
            if (os.path.exists(os.path.normpath(os.path.join(spec_dir, t)))
                    and not os.path.exists(os.path.normpath(os.path.join(arch_dir, t)))):
                lines.append(f'· 规格写作预警（规格内可解析相对链接）: {i} {line.strip()[:60]}')
    return lines


def static_report(specs, root):
    """静态检查阶段编排：打印 == 静态自检 == 与逐项结果。
    **返回值恒为 False**：静态发现（A／B／C／D 四类）一律只呈报、不置退出码（差异⑤：源件对「计数不符」
    置 1，本仓改为恒 0——`AGENTS.md` §五.2 候选永不拦截）。
    末尾三态判据**须计入 A／B／C／D 四类全部输出**（含 B 的计数行与 C 的候选行）：「· 无发现」只在四类
    全空时打印——漏计 B 即假绿（产物审查 P0-2：B 单源时「计数不符」与「无发现」同屏）。
    空转明示：A 在「提取 N＞0 而命中 0」时打印明示行（并抑制「· 无发现」，两者不同屏）；B 在无可判定
    声称时打印明示行；C 在存在「有核对面但路径未解析」的行时打印计数行。"""
    print('== 静态自检 ==')
    swallow = []
    extra = []      # 检查 C／D 输出（同为非阻断；末尾三态判据须计入，不得被「无发现」掩盖）
    counts = []     # 检查 B 的计数输出（同上：P0-2 修复前漏计，导致 B 单源时与「· 无发现」同屏）
    a_extract = a_hit = 0
    b_judged = b_cand = 0
    for spec in specs:
        if os.path.basename(spec) in NEVER_SCANNED:
            print(f'· 跳过（非规格件，模板内嵌本节标题）: {spec}')
            continue
        if len(specs) > 1:
            print(f'-- {spec}')
        with open(spec, encoding='utf-8') as f:
            text = f.read()
        a_lines, extracted, hits = check_swallow(text, root)
        count_lines, judged, cand = check_counts(text, root)
        c_lines = check_pairs(text, root)
        d_lines = check_writing(text, spec, root)
        swallow += a_lines
        extra += c_lines + d_lines
        counts += count_lines
        a_extract += extracted
        a_hit += hits
        b_judged += judged
        b_cand += cand
        for line in a_lines + c_lines + d_lines + count_lines:
            print(line)
    # 检查 A 空转明示：触发点＝「提取 N＞0 而命中 0」（源件的「提取数＝0」在本仓真规格上不可达）
    if a_extract and not a_hit:
        print(f'· A：提取 {a_extract} 条断言、命中 0 条——判据未适配本仓形态？')
    # 检查 B 空转明示：候选配对数为 0 时明示；有可判定声称时给命中计数行
    if b_judged:
        print(f'· B：判定 {b_judged} 条整件尺寸声称'
              + (f'（另有 {b_cand} 条非整件口径声称未判）' if b_cand else ''))
    elif b_cand:
        print(f'· B：未提取到可判定的尺寸声称（{b_cand} 条非整件口径声称未判）')
    else:
        print('· B：未提取到可判定的尺寸声称')
    warn = [l for l in swallow if l.startswith('· 自噬预警')]
    # 中性行（哨兵型汇总行与「目标文本未提及且现行为 0」行）同为发现项：计入末尾三态计数
    sentinel = [l for l in swallow
                if l.startswith(('· 现行有值／目标文本未提及', '· 目标文本未提及且现行为 0'))]
    # 零命中待复核（F2）同属检查 A 的发现项：漏计则「· 有预警 N 条」少计、屏上发现行多于计数行
    zero = [l for l in swallow if l.startswith('· 零命中待复核')]
    # 零命中核对未判（072 F1）：期望子句多值且与命令无法对齐——同为检查 A 的发现项，同理须计入
    # （否则新支路的产出在汇总里隐形，与「修缺口」的立法目的相悖）
    undecided = [l for l in swallow if l.startswith('· 零命中核对未判')]
    findings = warn + zero + undecided + sentinel + extra + counts
    if findings:
        # 中性汇总行（哨兵型／归零型不可区分态）与检查 B／C／D 输出同为发现项：计入本行，不落「无发现」
        print(f'· 有预警 {len(findings)} 条'
              f'（非阻断，请人工核对预测与到位期望）')
    elif a_extract and not a_hit:
        # 提取＞0 而命中 0：每个断言都落「跳过」（＝未命中任何可解析目标），与真阴性区分（假绿通道的
        # 可见化）；同时抑制「· 无发现」——两者不得同屏（空转明示行已在上方打印）
        print('· 全部跳过（未命中可解析目标——请核对调用位置与路径基准）')
    else:
        print('· 无发现')
    return False


def _stdout_utf8():
    """中文 Windows 下 stdout 默认 GBK，打印含 ⏎／中文的输出会 UnicodeEncodeError（2026-09-11 实测）。"""
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def _git_changes(root):
    """`git status --porcelain` 的实际改动集（只读子命令）；返回 [(状态码, 正斜杠相对路径)]，
    重命名形态「旧 -> 新」取新路径。以 `-c core.quotepath=false` 调用：默认 quotepath 会把含
    非 ASCII 的路径按 C 风格转义并加引号（本仓规格文件名含中文），不关掉则路径无法归一比对。"""
    r = subprocess.run('git -c core.quotepath=false status --porcelain', shell=True,
                       capture_output=True, encoding='utf-8', errors='replace',
                       cwd=root)
    changes = []
    for line in (r.stdout or '').splitlines():
        if len(line) < 4:
            continue
        path = line[3:]
        if ' -> ' in path:
            path = path.split(' -> ')[-1]
        changes.append((line[:2].strip(), path.strip().strip('"').replace('\\', '/')))
    return changes


def _archive_equiv(p):
    """归档移动等价（--verify 豁免①）：docs/specs/*.md ↔ docs/specs/archive/*.md 视为同一文件。"""
    return p.replace('docs/specs/archive/', 'docs/specs/')


def verify_report(spec, root):
    """核验比对模式（--verify）：两项比对，返回 True 表示有阻断项。只读规格、磁盘与 git status
    （只读子命令），不执行规格内任何命令、不写任何文件。
    1) 改动面比对——规格改 动清单节内的路径声明集 ↔ `git status` 实际改动集（双向差集；非阻断提示）；
    2) 过程产物两项——`CHANGELOG` 条目（含规格号）与归档件（`docs/specs/archive/` 内），缺任一即阻断。
    **旧仓的台账式表结构检查已整块删除**（`collab-log` 与登记表机制已废，见 `施工机制` §三／§七——现不建任何平行台账）；
    `--verify` 不进 `check.sh` 门禁（门禁运行点在制规格尚未归档，过程产物检查必然不符）。"""
    path = os.path.abspath(spec)
    name = os.path.basename(path)
    rel = os.path.relpath(path, root).replace('\\', '/')
    with open(path, encoding='utf-8') as f:
        text = f.read()
    m = re.match(r'(\d{3})', name)
    spec_no = m.group(1) if m else name
    blocking = False

    # 1) 改动面比对（非阻断提示）
    declared = {_archive_equiv(t) for r in _change_rows(text)[0]
                for t in PATH_TOKEN.findall(r['path'])}
    actual = {_archive_equiv(p) for _, p in _git_changes(root)
              if p != rel}   # 豁免②：待验规格自身恒在改动集内（判阻断即常驻红）
    print('· 改动面比对（声明集 ↔ 实际改动集；非阻断提示）')
    for p in sorted(declared - actual):
        print(f'  · 声明但未动: {p}')
    for p in sorted(actual - declared):
        print(f'  · 动了但未声明: {p}')
    if declared == actual:
        print('· 改动面一致')

    # 2) 过程产物两项（阻断）——未落过程产物即核验未完成
    print('· 过程产物两项')
    cl_path = os.path.join(root, 'CHANGELOG.md')
    hits = []
    if os.path.isfile(cl_path):
        with open(cl_path, encoding='utf-8') as f:
            # 条目行判据与内容轨的限长守卫统一：列表符起首
            hits = [l for l in f.read().splitlines()
                    if re.match(r'^\s*[-*+]\s', l) and spec_no in l]
    if hits:
        print(f'· CHANGELOG 条目: 命中 {len(hits)} 条（规格号 {spec_no}）')
    else:
        print(f'x 核验不符: CHANGELOG.md 无规格号 {spec_no} 的条目行')
        blocking = True
    if os.path.isfile(os.path.join(root, 'docs/specs/archive', name)):
        print(f'· 已归档: docs/specs/archive/{name}')
    else:
        print(f'x 核验不符: 规格未归档（docs/specs/archive/{name} 缺席）')
        blocking = True
    return blocking


if __name__ == '__main__':
    args = sys.argv[1:]
    static_only = '--static' in args
    verify_only = '--verify' in args
    if static_only and verify_only:
        print('x --static 与 --verify 互斥，请择一（参数错误）', file=sys.stderr)
        sys.exit(2)
    specs = [a for a in args if a not in ('--static', '--verify')]
    if not specs:
        # 零位置参数＝无在制规格（提交时规格已在验收后归档，属预期常态）：明示跳过、退出 0
        _stdout_utf8()
        print('无在制规格，跳过')
        sys.exit(0)
    missing = [a for a in specs if not os.path.isfile(a)]
    if missing:
        for a in missing:
            print(f'x 文件不存在: {a}', file=sys.stderr)
        sys.exit(2)
    _stdout_utf8()
    if verify_only:
        root = repo_root()
        if root is None:
            print('x 无法定位仓库根（核验比对基准不可用）', file=sys.stderr)
            sys.exit(2)
        blocking = False
        for spec in specs:
            if len(specs) > 1:
                print(f'-- {spec}')
            blocking = verify_report(spec, root) or blocking
        sys.exit(1 if blocking else 0)
    if not static_only:
        for spec in specs:
            report(spec)
    root = repo_root()
    if root is None:
        print('x 无法定位仓库根（静态检查路径解析基准不可用）', file=sys.stderr)
        sys.exit(2)
    static_report(specs, root)
    sys.exit(0)     # 静态发现恒 0（仅呈报；退出 1 只属 --verify 的过程产物缺失）
