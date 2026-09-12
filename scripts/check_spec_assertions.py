"""规格断言预验器（开发工具，按需运行，供规划方写规格时机械完成铁律④「断言写前实跑」）。

用途：从规格「验收标准」节提取命令断言（行内反引号与围栏整行命令），白名单只读执行，
输出每条命令的退出码与输出摘要——不做通过/失败判定（规格断言多系施工后状态，
本工具取的是当前树基线，供规划方对照规格内声称的基线/预验结论）。动态阶段按三态呈报：
可审计（执行并打印退出码与输出摘要）／不可审计（命令形态本身无法只读审计，跳过并注明命中的
判据）／未跑成（取输出失败、打印时编码失败、超时——一律计入崩溃桶并追加证据不完整警示行）。
静态自检阶段（`--static` 单独跑，或缺省时与动态阶段并跑）：不执行规格内任何命令，只做文件
读取与文本匹配——检查 A 报「自噬预警」（断言 token 被自家替换文本吞掉，呈报预测值与规格
「到位」列的差）；检查 B 重算规格内 `N 字符`／`N 行` 声称与实测的差（分成「计数不符」与
「基线漂移」两档）；检查 C 核对 [A] 项「替换为」侧文本的逐字落实、检查 D 报规格写作四类机械
缺陷（嵌套反引号／代码跨度边缘空格／加粗引导行紧跟列表／规格内可解析相对链接）——二者亦非阻断、
不影响退出码。两段退出契约分立：动态阶段照下句不变；静态阶段仅「计数不符」置退出 1，
「基线漂移」与「自噬预警」只呈报、不拦。
核验比对模式（`--verify <规格路径>` 单独跑，与 `--static` 互斥）：供规划方核验收口做三项
比对——改动面（规格声明集 ↔ `git status` 实际改动集，两侧差集呈报，非阻断提示）／过程产物
三件（CHANGELOG 条目、collab-log 施工记录行、archive 归档，缺任一即阻断）／施工记录表结构
（序号连续无重复、各行竖线数一致、末列非空）。只读规格、磁盘与 `git status`（只读子命令），
不执行规格内任何命令、不写任何文件；该模式不进 `scripts/check.sh` 门禁（门禁运行点规格尚未
归档，过程产物检查必然不符）。
事故出身：020-025 六发断言自噬（断言吞自家 [A] 文本/对象错/计数错/恒真假绿）——
2026-09-07 作者裁定守卫化（宪法 §2 candidate 永不拦截：本工具退出码恒 0，仅呈报）。
用法：python scripts/check_spec_assertions.py [--static|--verify] <规格路径> [更多规格路径...]
依赖与前置：Python 3 标准库（re/subprocess/sys/os），零外部依赖；只读白名单命令，
越权命令（写操作/重定向/git 写子命令/非 -n 的 sed/会留缓存产物的 py_compile）跳过并标注 SKIP。子进程输出统一按 UTF-8 解码，并对不可解码字节容错——中文 Windows 下本地编码为 GBK，按本地编码解码会崩（2026-09-11 实测）。
维护入口：新增可执行命令形态扩 ALLOWED 白名单；提取规则（验收节定位/行内与围栏两种形态）
改 extract()；输出格式改 report()。动态阶段三态：不可审计判据改 unauditable()、放行面改
readonly()、三桶计数与摘要行改 report()。静态阶段：节定位常量 SECTION（验收标准）与
CHANGE_SECTION（文件级改动清单），检查 A 改 check_swallow()、检查 B 改 check_counts()
（配对判据＝路径紧邻段，段切分见 _segments()）、检查 C 改 check_pairs()（[A] 项「替换为」侧文本
的逐字落实核对，非阻断）、检查 D 改 check_writing()（规格写作机械检查四类，非阻断），阶段编排、
末尾三态判据与退出码改 static_report() 与 __main__。核验比对：三项比对改 verify_report()
（改动面取 _git_changes()、施工记录表定位与结构取 _find_table()／_table_findings()），
模式分派改 __main__。
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
SECTION = re.compile(r'^##[^#\n]*验收标准.*$', re.M)

# 静态自检阶段的节定位与识别口径（--static；只读，不执行规格内任何命令）
CHANGE_SECTION = re.compile(r'^##[^#\n]*文件级改动清单.*$', re.M)
# 断言形态：git grep [-F/-c 顺序容错] -- "TOKEN" FILE
ASSERT_CMD = re.compile(
    r'''git\s+grep\b(?P<opts>(?:\s+-{1,2}[^\s"']+)*)\s+--\s+(?P<q>["'])'''
    r'''(?P<token>.*?)(?P=q)\s+(?P<file>[^\s"']+)'''
)
# 路径样 token 判据：形如 [\w./-]+\.(md|js|sh|py|json|jsonc) 的裸串，且作为仓根相对路径存在于磁盘
# （不以「含 /」为必要条件——否则 AGENTS.md／README.md／CHANGELOG.md 等根级文件永不被命中）
PATH_TOKEN = re.compile(r'[\w./-]+\.(?:md|js|sh|py|json|jsonc)')
# 计数声称：N 容错千分位逗号；量词只覆盖「字符」与「行」（其余量词定义随文件类型而异，不实测）
# 左界否定环视：数字前紧邻字母/数字者不视为尺寸声称（如「MD034 行」「G1 行」的编号被读成行数）
CLAIM = re.compile(r'(?<![A-Za-z0-9])(\d[\d,]*)\s*(字符|行)')
# 限额标记：紧邻 N 之前的这类标记表明该数字是限额（如「条目 ≤ 400 字符」）而非实测尺寸，不计
LIMIT_MARKS = ('≤', '≥', '<', '>', '最多', '上限', '不少于', '以内', '以上',
               '至少', '至多', '不超过')
INLINE_CODE = re.compile(r'`([^`\n]+)`')
FENCE_CODE = re.compile(r'```[a-z]*\n(.*?)```', re.S)
# 行首内容判据（检查 N21）：行内命令名只在「剥去列表标记／复选框后居于行首」时才视为断言抽取对象，
# 散文句中提及的命令名不抽取（形态：`- [ ] `cmd``／`1. `cmd``／裸行首跨度）
LINE_LEAD = re.compile(r'^\s*(?:[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+|\[[ xX]\]\s*)*')
# 检查 C（[A] 替换文本逐字核对）：成对条目「现文」/「替换为」的行首标记（含（…）限定变体）
PAIR_NOW = re.compile(r'^\s*[-*+]\s+现文(?:（[^）]*）)?\s*[：:]')
PAIR_NEW = re.compile(r'^\s*[-*+]\s+替换为(?:（[^）]*）)?\s*[：:]')
# 检查 C：成对条目按「当前 ### 小标题声明的路径 token」定目标（跨小标题重置）
H3_HEAD = re.compile(r'^\s*###\s')
# 检查 C（多行形态）：`**Na. …**` 小标题行以「替换为：」收尾，替换内容续在其后的围栏／缩进块里
PAIR_NEW_HEAD = re.compile(r'^\s*\*\*[^*\n]+\*\*.*替换为\s*[：:]\s*$')
FENCE_BLOCK = re.compile(r'^\s*```[a-zA-Z]*\s*$')
# 检查 D：① ② 的 CommonMark 定界规则、③ 加粗引导行＋列表标记起首、④ 规格内可解析相对链接
BACKTICK_RUN = re.compile(r'`+')
BOLD_LEAD = re.compile(r'^\s*\*\*[^*\n]+\*\*\s*[：:]\s*$')
LIST_LEAD = re.compile(r'^\s*(?:[-*+]|\d+[.)])\s')
MD_LINK = re.compile(r'\[[^\]\n]*\]\(([^)\s]+?)\)')
# 检查 D ④ 的适用面：该类判据隐含「该件会被归档」，故对**从不归档**的件不判——即 check.sh [4] 段
# 扫描集排除的那份台账（docs/specs/collab-log.md）
NEVER_ARCHIVED = ('collab-log.md',)


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


def _subsections(text):
    """按 ### 切分「文件级改动清单」节，返回各子节全文（含标题行、正文、围栏与行内反引号）。"""
    subs = []
    cur = None
    for line in _section(text, CHANGE_SECTION).splitlines():
        if re.match(r'^###\s', line):
            if cur is not None:
                subs.append('\n'.join(cur))
            cur = [line]
        elif cur is not None:
            cur.append(line)
    if cur is not None:
        subs.append('\n'.join(cur))
    return subs


def _sub_paths(sub, root):
    """子节全文内的路径样 token 集合（形如 [\\w./-]+\\.(md|js|sh|py|json|jsonc) 且作为仓根相对路径存在于磁盘）。"""
    return {t for t in PATH_TOKEN.findall(sub) if os.path.isfile(_abs(t, root))}


def _assert_refs(text):
    """从验收节提取 `git grep -F -c -- "TOKEN" FILE` 形态断言，返回 (TOKEN, FILE) 列表。"""
    refs = []
    for m in ASSERT_CMD.finditer(_section(text, SECTION)):
        # -F 与 -c 各自以选项字母形态出现即可（-F／-c／-Fc 均认），顺序容错
        letters = [o.lstrip('-') for o in m.group('opts').split()]
        if any('F' in o for o in letters) and any('c' in o for o in letters):
            refs.append((m.group('token'), m.group('file')))
    return refs


def check_swallow(text, root):
    """检查 A：断言自噬预警（只呈报，不影响退出码）。返回输出行列表。
    n == 0 的两种情形均不锁定单义（(cur, n) 二元分辨不出「哨兵型保留／[A] 项替换文本漏写」与
    「归零型已达成」）：cur > 0 者计入一行中性汇总；cur == 0 者打中性行（既可能是替换文本漏写，
    也可能是归零型已达成——053 的「四分类」「不得据以仿写」即后者）。预测行（cur + n 加法预测）
    只在 cur > 0 且 n > 0 时输出：cur == 0 时不存在既有命中可被替换吞掉，加法预测无对象（N4 收窄）。"""
    subs = _subsections(text)
    lines = []
    neutral = 0
    for token, target in _assert_refs(text):
        path = _abs(target, root)
        cur = 0
        if os.path.isfile(path):
            with open(path, encoding='utf-8') as f:
                cur = sum(1 for line in f if token in line)
        hit = [s for s in subs if target in _sub_paths(s, root)]
        if not hit:
            lines.append(f'· 跳过（无对应替换文本，[B] 项或纯新增）: {token} @ {target}')
            continue
        n = 0
        for s in hit:
            for code in INLINE_CODE.findall(s):
                n += code.count(token)
            for block in FENCE_CODE.findall(s):
                n += block.count(token)
        if n == 0:
            if cur > 0:
                # 哨兵型 token（到位＝现状，替换侧本不必提及）与归零型已达成同形：计入中性汇总，不单义锁定
                neutral += 1
            else:
                lines.append(f'· 替换侧未提及且现行为 0: {token} @ {target}'
                             f'（可能是 [A] 项替换文本漏写，也可能是归零型已达成）')
        elif cur > 0:
            lines.append(f'· 自噬预警: {token} @ {target} —— 现行 {cur}｜替换文本内 {n}'
                         f'｜近似预测 {cur + n}（未计删除，须人工核对到位期望）')
    if neutral:
        lines.append(f'· 现行有值／替换侧未提及: {neutral} 个'
                     f'（请对照到位列核对——可能是哨兵型保留，也可能是归零型已达成）')
    return lines


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


def check_counts(text, root):
    """检查 B：计数实跑重算。返回 (输出行列表, 是否有「计数不符」)。
    配对判据＝路径紧邻段（见 _segments()）：一条计数声称只计入其所在紧邻段对应的路径。"""
    listed = _section(text, CHANGE_SECTION)
    lines = []
    bad = False
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
                actual = nchar if unit == '字符' else nline
                if int(num.replace(',', '')) == actual:
                    continue
                head = f'{target} 称「{num} {unit}」实测 {actual}'
                if target in listed:
                    lines.append(f'· 基线漂移（本批改动件，不阻断）: {head}')
                else:
                    lines.append(f'x 计数不符: {head}')
                    bad = True
    return lines, bad


def _strip_wrap(s):
    """剥去「替换为」侧文本的外层包裹（「」／单双反引号／表格管道），得逐字核验串。
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


def _collect_block(sec, j):
    """从 j 起收集「替换为」侧的多行正文：缩进续行，或紧随的围栏块（块内空行不视为终止）。
    返回 (行列表, 下一个未消费的行号)——被并入块的行不再参与目标路径声明。"""
    block = []
    k = j
    while k < len(sec):
        s = sec[k]
        if FENCE_BLOCK.match(s):
            if block:
                break                       # 已收集正文后又见围栏：不并入（保守）
            k += 1
            while k < len(sec) and not FENCE_BLOCK.match(sec[k]):
                block.append(sec[k])
                k += 1
            if k < len(sec):
                k += 1                      # 跳过收尾围栏
            continue
        if s.strip():
            if s[:1].isspace():
                block.append(s)
                k += 1
                continue
            break
        nxt = next((t for t in sec[k + 1:] if t.strip()), '')
        if nxt[:1].isspace() or FENCE_BLOCK.match(nxt):
            k += 1                          # 块内空行：跳过
            continue
        break
    return block, k


def _pair_bodies(sec, root):
    """在「文件级改动清单」节内识别 [A] 成对条目，返回 [(替换为侧正文行列表, 目标路径列表)]。
    形态①：`- 现文…` 与紧随其后的 `- 替换为…` bullet 成对（空行不断配对）；
    形态②：`**Na. …**` 小标题行以「替换为：」收尾（成对条目的多行形态），替换内容续在其后。
    两种形态的续行（缩进／围栏）并入正文，逐行切片核对。
    **目标口径**：以当前所处的 `###` 小标题行声明的路径 token 为准（跨小标题即重置，故不支持「声明
    在前、成对条目在后」的跨小节继承）；该小标题声明多个路径者全部保留，核对时任一命中即算落实。
    围栏正文与散文行里的 token 不取——它们常引述他文件，取之即误配（048／050 批实测）。
    内联载体（「整行替换为：」「…→ 替换为『…』」等）不覆盖——见规格 055 §二.1d 的载体分布缺口。"""
    pairs = []
    targets = []
    pending = False
    i = 0
    while i < len(sec):
        line = sec[i]
        if H3_HEAD.match(line):
            # 小标题重置目标集：本小节成对条目的目标＝本行声明的路径 token（已落盘者）
            targets = [t for t in PATH_TOKEN.findall(line) if os.path.isfile(_abs(t, root))]
            pending = False
            i += 1
            continue
        if PAIR_NEW_HEAD.match(line):
            block, j = _collect_block(sec, i + 1)
            pairs.append((block, targets))
            i = j
            continue
        m_new = PAIR_NEW.match(line)
        if m_new and pending:
            block, j = _collect_block(sec, i + 1)
            pairs.append(([line[m_new.end():]] + block, targets))
            pending = False
            i = j
            continue
        if line.strip():
            if PAIR_NOW.match(line):
                pending = True
            elif PAIR_NEW.match(line):
                # 未成对的「替换为」行：不核（须有「现文」成对），但其续行同样不参与目标声明
                pending = False
                _, j = _collect_block(sec, i + 1)
                i = j
                continue
        i += 1
    return pairs


def check_pairs(text, root):
    """检查 C：[A] 项「替换为」侧文本的逐字落实核对（只呈报，不影响退出码）。返回输出行列表。
    该串须在其 `###` 小标题声明的目标文件中逐字命中（声明多个者任一命中即算落实）；未命中即报
    「未落实或已漂移」——前缀用 `·`（非 `x`），本文件的 `x` 前缀语义即阻断，而规格层发现的裁决权
    在作者，机器只呈报。"""
    if not CHANGE_SECTION.search(text):
        return []
    pairs = _pair_bodies(_section(text, CHANGE_SECTION).splitlines(), root)
    lines = []
    cache = {}
    for bodies, targets in pairs:
        contents = []
        for target in targets:
            path = _abs(target, root)
            if path not in cache:
                with open(path, encoding='utf-8') as f:
                    cache[path] = f.read()
            contents.append(cache[path])
        if not contents:
            continue        # 小标题未声明可解析的路径 token：无核对面，不报（不猜）
        for body in bodies:
            # 多行串按行切片，逐行要求命中（避免整段因一处空格差异而误判）；单行过短者跳过（噪声防护）
            for piece in _strip_wrap(body).splitlines():
                piece = piece.strip()
                if len(piece) < 8:
                    continue
                if not any(piece in c for c in contents):
                    lines.append(f'· [A] 未落实或已漂移: {piece[:60]} @ {"、".join(targets)}')
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
    """静态自检阶段编排：打印 == 静态自检 == 与逐项结果；返回 True 表示有「计数不符」。"""
    print('== 静态自检 ==')
    blocking = False
    drifted = False
    swallow = []
    extra = []      # 检查 C／D 输出（同为非阻断；末尾三态判据须计入，不得被「无发现」掩盖）
    for spec in specs:
        if len(specs) > 1:
            print(f'-- {spec}')
        with open(spec, encoding='utf-8') as f:
            text = f.read()
        count_lines, bad = check_counts(text, root)
        a_lines = check_swallow(text, root)
        c_lines = check_pairs(text, root)
        d_lines = check_writing(text, spec, root)
        swallow += a_lines
        extra += c_lines + d_lines
        for line in a_lines + c_lines + d_lines + count_lines:
            print(line)
        blocking = blocking or bad
        drifted = drifted or any(l.startswith('· 基线漂移') for l in count_lines)
    warn = [l for l in swallow if l.startswith('· 自噬预警')]
    # 中性行（哨兵型汇总行与「替换侧未提及且现行为 0」行）同为发现项：计入末尾三态计数
    sentinel = [l for l in swallow
                if l.startswith(('· 现行有值／替换侧未提及', '· 替换侧未提及且现行为 0'))]
    if blocking or drifted:
        pass
    elif warn or sentinel or extra:
        # 中性汇总行（哨兵型／归零型不可区分态）与检查 C／D 输出同为发现项：计入本行，不落「无发现」
        print(f'· 有预警 {len(warn) + len(sentinel) + len(extra)} 条'
              f'（非阻断，请人工核对预测与到位期望）')
    elif swallow and all(l.startswith('· 跳过') for l in swallow):
        # 全部条目落「跳过」＝未命中任何可解析目标，与真阴性区分（假绿通道的可见化）
        print('· 全部跳过（未命中可解析目标——请核对调用位置与路径基准）')
    else:
        print('· 无发现')
    return blocking


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


def _find_table(text):
    """定位施工记录表：含「首格为整数」数据行的表格块（collab-log 其余表格首格为 F1／①／P0 等，
    不误判）；返回其行列表（含表头与分隔行），未定位到返回 None。"""
    blocks, cur = [], []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith('|') and s.endswith('|') and s != '|':
            cur.append(s)
        else:
            if cur:
                blocks.append(cur)
            cur = []
    if cur:
        blocks.append(cur)
    return next((b for b in blocks
                 if any(re.match(r'^\|\s*\d+\s*\|', r) for r in b)), None)


def _table_findings(rows):
    """施工记录表结构核对（--verify 第三项）：返回不符项列表（空＝一致）。
    核对序号 1..N 连续无重复、各行竖线数一致、末列非空。"""
    if rows is None:
        return ['未定位到施工记录表（无首格为整数的数据行）']
    bad = []
    nums = [int(re.match(r'^\|\s*(\d+)\s*\|', r).group(1))
            for r in rows if re.match(r'^\|\s*\d+\s*\|', r)]
    if nums != list(range(1, len(nums) + 1)):
        bad.append(f'序号非 1..{len(nums)} 连续无重复: {nums}')
    widths = sorted({r.count('|') for r in rows})
    if len(widths) > 1:
        bad.append(f'各行竖线数不一致: {widths}')
    empty = [i for i, r in enumerate(rows, 1) if not r.split('|')[-2].strip()]
    if empty:
        bad.append(f'末列为空（表内序位）: {empty}')
    return bad


def verify_report(spec, root):
    """核验比对模式（--verify）：三项比对，返回 True 表示有阻断项。只读规格、磁盘与 git status
    （只读子命令），不执行规格内任何命令、不写任何文件。三项比对见规格 049 §二.1.C。"""
    path = os.path.abspath(spec)
    name = os.path.basename(path)
    rel = os.path.relpath(path, root).replace('\\', '/')
    with open(path, encoding='utf-8') as f:
        text = f.read()
    m = re.match(r'(\d{3})', name)
    spec_no = m.group(1) if m else name
    blocking = False

    # 1) 改动面比对（非阻断提示）
    declared = {_archive_equiv(p) for p in _sub_paths(_section(text, CHANGE_SECTION), root)}
    actual = {_archive_equiv(p) for _, p in _git_changes(root)
              if p != rel}   # 豁免②：待验规格自身恒在改动集内（判阻断即常驻红）
    print('· 改动面比对（声明集 ↔ 实际改动集；非阻断提示）')
    for p in sorted(declared - actual):
        print(f'  · 声明但未动: {p}')
    for p in sorted(actual - declared):
        print(f'  · 动了但未声明: {p}')
    if declared == actual:
        print('· 改动面一致')

    # 2) 过程产物三件（阻断）——未落过程产物即核验未完成
    print('· 过程产物三件')
    cl_path = os.path.join(root, 'CHANGELOG.md')
    hits = []
    if os.path.isfile(cl_path):
        with open(cl_path, encoding='utf-8') as f:
            # 条目行判据与 check_content.py 的限长守卫统一：列表符起首
            hits = [l for l in f.read().splitlines()
                    if re.match(r'^\s*[-*+]\s', l) and spec_no in l]
    if hits:
        print(f'· CHANGELOG 条目: 命中 {len(hits)} 条（规格号 {spec_no}）')
    else:
        print(f'x 核验不符: CHANGELOG.md 无规格号 {spec_no} 的条目行')
        blocking = True
    log_path = os.path.join(root, 'docs/specs/collab-log.md')
    log = ''
    if os.path.isfile(log_path):
        with open(log_path, encoding='utf-8') as f:
            log = f.read()
    rows = _find_table(log)
    if rows is not None and any(name in r for r in rows):
        print(f'· 施工记录行: collab-log 施工记录表含 {name}')
    else:
        print(f'x 核验不符: collab-log 施工记录表无 {name}')
        blocking = True
    if os.path.isfile(os.path.join(root, 'docs/specs/archive', name)):
        print(f'· 已归档: docs/specs/archive/{name}')
    else:
        print(f'x 核验不符: 规格未归档（docs/specs/archive/{name} 缺席）')
        blocking = True

    # 3) 施工记录表结构（阻断）——表是协作台账，结构损坏即账目失真
    bad = _table_findings(rows)
    if bad:
        for b in bad:
            print(f'x 核验不符: 施工记录表 {b}')
        blocking = True
    else:
        print('· 施工记录表结构一致')
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
        print('用法: python scripts/check_spec_assertions.py [--static|--verify] '
              '<规格路径> [更多规格路径...]', file=sys.stderr)
        sys.exit(2)
    missing = [a for a in specs if not os.path.isfile(a)]
    if missing:
        for a in missing:
            print(f'x 文件不存在: {a}', file=sys.stderr)
        sys.exit(2)
    # 中文 Windows 下 stdout 默认 GBK，打印含 ⏎／中文的输出会 UnicodeEncodeError（2026-09-11 实测）
    sys.stdout.reconfigure(encoding='utf-8')
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
        print('x 无法定位仓库根（静态阶段路径解析基准不可用）', file=sys.stderr)
        sys.exit(2)
    if static_report(specs, root):
        sys.exit(1)
    sys.exit(0)
