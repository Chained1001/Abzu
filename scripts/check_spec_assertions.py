"""规格断言预验器（开发工具，按需运行，供规划方写规格时机械完成铁律④「断言写前实跑」）。

用途：从规格「验收标准」节提取命令断言（行内反引号与围栏整行命令），白名单只读执行，
输出每条命令的退出码与输出摘要——不做通过/失败判定（规格断言多系施工后状态，
本工具取的是当前树基线，供规划方对照规格内声称的基线/预验结论）。
静态自检阶段（`--static` 单独跑，或缺省时与动态阶段并跑）：不执行规格内任何命令，只做文件
读取与文本匹配——检查 A 报「自噬预警」（断言 token 被自家替换文本吞掉，呈报预测值与规格
「到位」列的差）；检查 B 重算规格内 `N 字符`／`N 行` 声称与实测的差（分成「计数不符」与
「基线漂移」两档）。两段退出契约分立：动态阶段照下句不变；静态阶段仅「计数不符」置退出 1，
「基线漂移」与「自噬预警」只呈报、不拦。
事故出身：020-025 六发断言自噬（断言吞自家 [A] 文本/对象错/计数错/恒真假绿）——
2026-09-07 作者裁定守卫化（宪法 §2 candidate 永不拦截：本工具退出码恒 0，仅呈报）。
用法：python scripts/check_spec_assertions.py [--static] <规格路径> [更多规格路径...]
依赖与前置：Python 3 标准库（re/subprocess/sys/os），零外部依赖；只读白名单命令，
越权命令（写操作/重定向/git 写子命令/非 -n 的 sed/会留缓存产物的 py_compile）跳过并标注 SKIP。子进程输出统一按 UTF-8 解码，并对不可解码字节容错——中文 Windows 下本地编码为 GBK，按本地编码解码会崩（2026-09-11 实测）。
维护入口：新增可执行命令形态扩 ALLOWED 白名单；提取规则（验收节定位/行内与围栏两种形态）
改 extract()；输出格式改 report()。静态阶段：节定位常量 SECTION（验收标准）与
CHANGE_SECTION（文件级改动清单），检查 A 改 check_swallow()、检查 B 改 check_counts()，
阶段编排与退出码改 static_report() 与 __main__。
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
CLAIM = re.compile(r'(\d[\d,]*)\s*(字符|行)')
# 限额标记：紧邻 N 之前的这类标记表明该数字是限额（如「条目 ≤ 400 字符」）而非实测尺寸，不计
LIMIT_MARKS = ('≤', '≥', '<', '>', '最多', '上限', '不少于', '以内', '以上',
               '至少', '至多', '不超过')
INLINE_CODE = re.compile(r'`([^`\n]+)`')
FENCE_CODE = re.compile(r'```[a-z]*\n(.*?)```', re.S)


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
    for c in re.findall(r'`([^`\n]+)`', section):
        c = c.strip()
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


def readonly(c):
    if MUTATING.search(c):
        return False
    if re.match(r'^(e?grep|fgrep|wc|head|tail|ls|find|cat|bash|sh|node)\b', c):
        return True
    if c.startswith(('sed',)) and ' -n' in c:
        return True
    if c.startswith('git') and re.match(r'git\s+(diff|status|log|show|grep)\b', c):
        return True
    if c.startswith(('python', 'py')) and ' -c ' in c:
        return True
    if c.startswith('npx') and '--no-install' in c:
        return True
    return False


def report(spec):
    text = open(spec, encoding='utf-8').read()
    cmds = extract(text)
    if not cmds:
        print('未提取到命令断言（无验收节或无白名单命令）')
        return
    ran = skipped = 0
    for i, (src, c) in enumerate(cmds, 1):
        if not readonly(c):
            print(f'[{i}] {src} SKIP（非只读白名单形态）: {c}')
            skipped += 1
            continue
        try:
            r = subprocess.run(c, shell=True, capture_output=True,
                               encoding='utf-8', errors='replace', timeout=120,
                               cwd=os.path.dirname(os.path.dirname(
                                   os.path.abspath(__file__))))
            out = ((r.stdout or '') + (r.stderr or '')).strip().splitlines()
            head = ' ⏎ '.join(out[:3]) if out else '(无输出)'
            print(f'[{i}] {src} exit={r.returncode}: {c}\n    {head[:200]}')
        except subprocess.TimeoutExpired:
            print(f'[{i}] {src} TIMEOUT: {c}')
        ran += 1
    print(f'== 共 {len(cmds)} 条：执行 {ran}｜跳过 {skipped}（基线呈报，不作通过判定）==')


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
    """检查 A：断言自噬预警（只呈报，不影响退出码）。返回输出行列表。"""
    subs = _subsections(text)
    lines = []
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
            lines.append(f'· 自噬预警（无命中）: {token} @ {target} '
                         f'—— 现行 {cur}｜替换文本内 0')
        else:
            lines.append(f'· 自噬预警: {token} @ {target} —— 现行 {cur}｜替换文本内 {n}'
                         f'｜近似预测 {cur + n}（未计删除，须人工核对到位期望）')
    return lines


def check_counts(text, root):
    """检查 B：计数实跑重算。返回 (输出行列表, 是否有「计数不符」)。"""
    listed = _section(text, CHANGE_SECTION)
    lines = []
    bad = False
    cache = {}
    for line in text.splitlines():
        targets = [t for t in (c.strip() for c in INLINE_CODE.findall(line))
                   if t and os.path.isfile(_abs(t, root))]
        if not targets:
            continue
        for target in targets:
            if target not in cache:
                with open(_abs(target, root), encoding='utf-8') as f:
                    content = f.read()
                cache[target] = (len(content), len(content.splitlines()))
            nchar, nline = cache[target]
            for m in CLAIM.finditer(line):
                num, unit = m.group(1), m.group(2)
                # 限额型数字不计：N 之前（允许中间隔空格）紧邻限额标记的，不视为对当前尺寸的声称
                if line[:m.start()].rstrip().endswith(LIMIT_MARKS):
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


def static_report(specs, root):
    """静态自检阶段编排：打印 == 静态自检 == 与逐项结果；返回 True 表示有「计数不符」。"""
    print('== 静态自检 ==')
    blocking = False
    drifted = False
    swallow = []
    for spec in specs:
        if len(specs) > 1:
            print(f'-- {spec}')
        with open(spec, encoding='utf-8') as f:
            text = f.read()
        count_lines, bad = check_counts(text, root)
        a_lines = check_swallow(text, root)
        swallow += a_lines
        for line in a_lines + count_lines:
            print(line)
        blocking = blocking or bad
        drifted = drifted or any(l.startswith('· 基线漂移') for l in count_lines)
    if blocking or drifted:
        pass
    elif swallow and all(l.startswith('· 跳过') for l in swallow):
        # 全部条目落「跳过」＝未命中任何可解析目标，与真阴性区分（假绿通道的可见化）
        print('· 全部跳过（未命中可解析目标——请核对调用位置与路径基准）')
    else:
        print('· 无发现')
    return blocking


if __name__ == '__main__':
    static_only = '--static' in sys.argv[1:]
    specs = [a for a in sys.argv[1:] if a != '--static']
    if not specs:
        print('用法: python scripts/check_spec_assertions.py [--static] '
              '<规格路径> [更多规格路径...]', file=sys.stderr)
        sys.exit(2)
    missing = [a for a in specs if not os.path.isfile(a)]
    if missing:
        for a in missing:
            print(f'x 文件不存在: {a}', file=sys.stderr)
        sys.exit(2)
    # 中文 Windows 下 stdout 默认 GBK，打印含 ⏎／中文的输出会 UnicodeEncodeError（2026-09-11 实测）
    sys.stdout.reconfigure(encoding='utf-8')
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
