# -*- coding: utf-8 -*-
"""check_reference_pack（采风资料核验·机械件）

用法：python check_reference_pack.py <产物.md 或 资料/ 目录> [档案模板路径]
只读不写、零依赖、不联网。按产物首行自动分面：`# 参考作品档案：` 走档案面、
`# 参考标尺` 走标尺面（其余首行报「认不出形态」）。逐份逐项打印 ✓／✗，末行汇总
「档案核验：M／N 份过」；全部过退出 0，任一不过退出 1，参数或文件读不到退出 2。
档案模板路径缺省＝本脚本同域上一级的 assets/outline-reference-archive-template.md；
标尺模板路径＝同域上一级的 assets/outline-reference-ruler-template.md（写死，不收参数）。

档案面核验项（只核机器可判定的形态与完备；内容真假归 2.2 作者审）：
  1 首行形态——首行是「# 参考作品档案：{非空名}」
  2 十三节齐且序对——产物 ### 标题与档案模板 ### 标题逐字一致（含顺序；另报 ## 级误用）
  3 核心五节非空——基本信息／内核定标／主线结构／人物档案／来源标注各有内容行
  4 无花括号——产物不出现 { }（占位符残留）
  5 无反引号——产物不出现 `（模板旧占位符教出的坏习惯）
  6 无提示词回显——档案模板花括号内的提示词串不得在产物出现（报至多 3 处行号）
  7 状态合法——基本信息「状态」∈ 采集中／档完
  8 来源两栏非空——来源标注「LLM 记忆」「联网核实」两行都在且非空

标尺面核验项（2.3 落成即核、2.4 进审前用；判定面随标尺模板与 stage2 2.3 现读）：
  1 首行形态——首行是「# 参考标尺」
  2 节齐且序对——产物 ### 标题与标尺模板 ### 标题逐字一致
  3 十二组齐——①至⑫组名＋派生体量都在（照标尺模板组名）
  4 每组三件——每组块内含强度词（锚定实测／多源统计／推演）且含「来源」
  5 无花括号
  6 无反引号
  7 无提示词回显——标尺模板花括号内的提示词串不得在产物出现
  8 合成结论已写——合成结论节非空且含「强度分布」
  9 喂料对照表在——喂料对照节含「主线支线比例」与「取数法」
形态依据：assets/outline-reference-archive-template.md 与
assets/outline-reference-ruler-template.md（节名与提示词都从模板现读，
改模板即改本脚本判定面，无须同步改码；喂料对照表本体住 stage2 2.3，产物照抄）。
"""
import io
import os
import re
import sys

CORE_FIVE = ['基本信息', '内核定标', '主线结构', '人物档案', '来源标注']
FIRST_LINE = re.compile(r'^# 参考作品档案：(.+)$')
PLACEHOLDER = '{'
# 提示词视为可断言子串的门槛：含特征标点（枚举／箭头／括注等），或长度达 10
DISTINCT_PUNCT = re.compile(r'[／→、，。；：（）()「」……·×＋⚠]')


def _stdout_utf8():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def _default_template():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, '..', 'assets',
                                         'outline-reference-archive-template.md'))


def _ruler_template():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, '..', 'assets',
                                         'outline-reference-ruler-template.md'))


def _read(path):
    with io.open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def _sections(text):
    """把全文按 ### 标题切节：[(节名, [行])]，保持出现顺序。"""
    secs = []
    cur = None
    for line in text.split('\n'):
        m = re.match(r'^###\s+(.*?)\s*$', line)
        if m:
            cur = (m.group(1), [])
            secs.append(cur)
        elif cur is not None and line.strip():
            cur[1].append(line)
    return secs


def _template_facts(tpl):
    """从模板现读判定面：(节名列表, 禁现提示词串列表)。"""
    heads = [name for name, _ in _sections(tpl)]
    bans = []
    for span in re.findall(r'\{([^{}]*)\}', tpl):
        prompt = span.split('：', 1)[1] if '：' in span else span
        prompt = prompt.strip().strip('_').strip()
        if not prompt:
            continue
        if DISTINCT_PUNCT.search(prompt) or len(prompt) >= 10:
            bans.append(prompt)
    # 去重且保持顺序；超短或无标点的（如「一句话」「哪些字段」）已滤除，避免误伤正文
    seen = set()
    return heads, [b for b in bans if not (b in seen or seen.add(b))]


GROUP_RE = re.compile(r'^-\s*((?:[①②③④⑤⑥⑦⑧⑨⑩⑪⑫])[^：:\s]*|派生体量)')
STRENGTH_WORDS = ('锚定实测', '多源统计', '推演')


def _ruler_facts(tpl):
    """从标尺模板现读判定面：(节名列表, 组名列表, 禁现提示词串列表)。"""
    heads = [name for name, _ in _sections(tpl)]
    groups = []
    for line in tpl.split('\n'):
        m = GROUP_RE.match(line.strip())
        if m:
            groups.append(m.group(1))
    _, bans = _template_facts(tpl)
    return heads, groups, bans


def _group_blocks(text):
    """把产物正文切成组块：[(组名, 该组起止行文本)]——组行起到下一组行/节标题止。"""
    blocks = []
    cur_name, cur_lines = None, []
    for line in text.split('\n'):
        s = line.strip()
        m = GROUP_RE.match(s)
        if m:
            if cur_name is not None:
                blocks.append((cur_name, '\n'.join(cur_lines)))
            cur_name, cur_lines = m.group(1), [s]
        elif s.startswith('###'):
            if cur_name is not None:
                blocks.append((cur_name, '\n'.join(cur_lines)))
            cur_name, cur_lines = None, []
        elif cur_name is not None:
            cur_lines.append(s)
    if cur_name is not None:
        blocks.append((cur_name, '\n'.join(cur_lines)))
    return blocks


def _check_ruler(text, want_heads, groups, bans):
    """标尺面逐项核验 → (通过数, 总项数)。逐行打印 ✓／✗。"""
    results = []

    def ok(msg):
        results.append(True)
        print('  ✓ ' + msg)

    def bad(msg):
        results.append(False)
        print('  ✗ ' + msg)

    lines = text.split('\n')
    body = [l for l in lines if l.strip()]
    secs = _sections(text)
    sec_names = [n for n, _ in secs]
    sec_map = dict(secs)

    # 1 首行形态
    if body and body[0].strip() == '# 参考标尺':
        ok('首行形态（# 参考标尺）')
    else:
        bad('首行形态——现在是「%s」，须是「# 参考标尺」' % (body[0].strip()[:30] if body else ''))

    # 2 节齐且序对（喂料对照节住 stage2、只进产物不进模板——预期序＝模板节序在
    #   「基本信息」后插入一个「喂料对照」前缀匹配位）
    expect = list(want_heads)
    base_idx = next((i for i, h in enumerate(expect) if h.startswith('基本信息')), None)
    if base_idx is not None:
        expect.insert(base_idx + 1, '喂料对照')

    def _head_match(got, want):
        return got == want or (want == '喂料对照' and got.startswith('喂料对照'))

    if len(sec_names) == len(expect) and all(
            _head_match(g, w) for g, w in zip(sec_names, expect)):
        ok('%d 节齐且序对（含产物侧喂料对照节）' % len(expect))
    else:
        why = []
        gi, wi = 0, 0
        while wi < len(expect) or gi < len(sec_names):
            if wi < len(expect) and gi < len(sec_names) \
                    and _head_match(sec_names[gi], expect[wi]):
                gi += 1
                wi += 1
                continue
            if wi < len(expect) and gi < len(sec_names) \
                    and expect[wi] == '喂料对照' and gi > (base_idx or 0):
                why.append('缺节 喂料对照（产物须照抄 stage2 的表）')
                wi += 1
                continue
            if gi < len(sec_names) and sec_names[gi] not in expect:
                why.append('多节 ' + sec_names[gi])
                gi += 1
                continue
            if wi < len(expect):
                why.append('缺节 ' + expect[wi])
                wi += 1
                continue
            gi += 1
        bad('节齐且序对——' + '；'.join(why))

    # 3 十二组齐
    blocks = dict(_group_blocks(text))
    missing_g = [g for g in groups if g not in blocks]
    if missing_g:
        bad('十二组齐——缺组：' + '、'.join(missing_g))
    else:
        ok('十二组齐（%d 组＋派生体量都在）' % (len(groups) - 1))

    # 4 每组三件（强度词＋来源）
    incomplete = []
    for g in groups:
        blk = blocks.get(g, '')
        has_strength = any(w in blk for w in STRENGTH_WORDS)
        if not has_strength or '来源' not in blk:
            incomplete.append(g)
    if incomplete:
        bad('每组三件——缺强度或来源：' + '、'.join(incomplete))
    else:
        ok('每组三件（强度＋来源）全')

    # 5 无花括号
    n_brace = text.count('{') + text.count('}')
    if n_brace:
        bad('无花括号——出现 { } 共 %d 个（占位符残留）' % n_brace)
    else:
        ok('无花括号')

    # 6 无反引号
    n_tick = text.count('`')
    if n_tick:
        bad('无反引号——出现 ` 共 %d 个' % n_tick)
    else:
        ok('无反引号')

    # 7 无提示词回显
    hits = []
    for b in bans:
        for i, line in enumerate(lines, 1):
            if b in line:
                hits.append((i, b))
                break
    if hits:
        shown = '；'.join('第 %d 行「%s…」' % (i, b[:24]) for i, b in hits[:3])
        bad('无提示词回显——%d 处：%s' % (len(hits), shown))
    else:
        ok('无提示词回显（%d 条模板提示词均未出现）' % len(bans))

    # 8 合成结论已写
    concl = sec_map.get([n for n in sec_names if n.startswith('合成结论')][0], []) \
        if any(n.startswith('合成结论') for n in sec_names) else []
    joined = '\n'.join(concl)
    if joined and '强度分布' in joined:
        ok('合成结论已写（含强度分布）')
    else:
        bad('合成结论已写——合成结论节为空或缺「强度分布」行')

    # 9 喂料对照表在
    feed = '\n'.join(sec_map.get(
        next((n for n in sec_names if n.startswith('喂料对照')), ''), []))
    if '主线支线比例' in feed and '取数法' in feed:
        ok('喂料对照表在（含主线支线比例行与取数法列）')
    else:
        bad('喂料对照表在——喂料对照节缺表（须照抄 stage2 2.3 的喂料对照表）')

    return sum(1 for g in results if g), len(results)


def _check_one(name, text, want_heads, bans):
    """逐项核一份档案 → (通过数, 总项数)。逐行打印 ✓／✗。"""
    results = []

    def ok(msg):
        results.append(True)
        print('  ✓ ' + msg)

    def bad(msg):
        results.append(False)
        print('  ✗ ' + msg)

    lines = text.split('\n')
    body = [l for l in lines if l.strip()]
    secs = _sections(text)
    sec_names = [n for n, _ in secs]
    sec_map = dict(secs)

    # 1 首行形态
    first = body[0] if body else ''
    m = FIRST_LINE.match(first)
    if m and m.group(1).strip():
        ok('首行形态（# 参考作品档案：…）')
    else:
        bad('首行形态——现在是「%s」，须是「# 参考作品档案：{作品名}」' % first[:40])

    # 2 十三节齐且序对
    if sec_names == want_heads:
        ok('%d 节齐且序对' % len(want_heads))
    else:
        why = []
        missing = [h for h in want_heads if h not in sec_names]
        extra = [h for h in sec_names if h not in want_heads]
        if missing:
            why.append('缺节 ' + '、'.join(missing))
        if extra:
            why.append('多节 ' + '、'.join(extra))
        if not missing and not extra:
            why.append('节序不对（同名不同序）')
        h2 = [l.strip() for l in lines if re.match(r'^##\s', l)]
        if h2:
            why.append('出现 ## 级标题 %d 处（节标题应一律 ###）' % len(h2))
        bad('十三节齐——' + '；'.join(why))

    # 3 核心五节非空（按前缀匹配节名——模板节名带括注）
    empty_five = [k for k in CORE_FIVE
                  if not any(n.startswith(k) and c for n, c in secs)]
    if not empty_five:
        ok('核心五节非空')
    else:
        bad('核心五节非空——空节：' + '、'.join(empty_five))

    # 4 无花括号
    n_brace = text.count('{') + text.count('}')
    if n_brace:
        bad('无花括号——出现 { } 共 %d 个（占位符残留）' % n_brace)
    else:
        ok('无花括号')

    # 5 无反引号
    n_tick = text.count('`')
    if n_tick:
        bad('无反引号——出现 ` 共 %d 个（值不须行内代码包裹）' % n_tick)
    else:
        ok('无反引号')

    # 6 无提示词回显
    hits = []
    for b in bans:
        for i, line in enumerate(lines, 1):
            if b in line:
                hits.append((i, b))
                break
    if hits:
        shown = '；'.join('第 %d 行「%s…」' % (i, b[:24]) for i, b in hits[:3])
        bad('无提示词回显——%d 处：%s' % (len(hits), shown))
    else:
        ok('无提示词回显（%d 条模板提示词均未出现）' % len(bans))

    # 7 状态合法
    status = ''
    for l in sec_map.get('基本信息', []):
        if l.strip().startswith('- 状态：'):
            status = l.strip()[len('- 状态：'):].strip()
            break
    if status in ('采集中', '档完'):
        ok('状态合法（%s）' % status)
    else:
        bad('状态合法——现在是「%s」，须是 采集中／档完 之一' % status[:20])

    # 8 来源两栏非空（值可在同行，也可在紧随的缩进子行——子列表是合法形态）
    src = sec_map.get('来源标注', [])
    sib_labels = ('- LLM 记忆：', '- 联网核实：', '- 抽查核对：')

    def _col_value(key):
        for idx, l in enumerate(src):
            s = l.strip()
            if not s.startswith(key):
                continue
            rest = s[len(key):].strip()
            if rest:
                return rest
            sub = []
            for l2 in src[idx + 1:]:
                if not l2.strip():
                    continue
                indented = len(l2) - len(l2.lstrip()) > 0
                if indented and l2.strip().startswith('- '):
                    sub.append(l2.strip())
                else:
                    break
            return ' '.join(sub)
        return ''

    cols = [(k.strip('- ：'), _col_value(k)) for k in sib_labels[:2]]
    empt = [k for k, v in cols if not v or PLACEHOLDER in v]
    if empt:
        bad('来源两栏非空——空栏：' + '、'.join(empt))
    else:
        ok('来源两栏非空（LLM 记忆／联网核实）')

    return sum(1 for g in results if g), len(results)


def main(argv):
    _stdout_utf8()
    if len(argv) not in (2, 3):
        print('用法：python check_reference_pack.py <档案.md 或 资料/ 目录> [模板.md 路径]')
        return 2
    target = argv[1]
    tpl_path = argv[2] if len(argv) == 3 else _default_template()

    if os.path.isdir(target):
        names = sorted(f for f in os.listdir(target)
                       if f.startswith('参考-') and f.endswith('.md'))
        if not names:
            print('✗ 目录里没有 参考-*.md 档案：%s' % target)
            return 2
        paths = [os.path.join(target, f) for f in names]
    elif os.path.isfile(target):
        paths = [target]
    else:
        print('✗ 读不到目标：%s（须是档案文件或目录）' % target)
        return 2

    try:
        tpl = _read(tpl_path)
    except OSError as e:
        print('✗ 读不到模板：%s（%s）' % (tpl_path, e))
        return 2
    want_heads, bans = _template_facts(tpl)
    if not want_heads:
        print('✗ 模板里读不到 ### 节：%s' % tpl_path)
        return 2

    try:
        rtpl = _read(_ruler_template())
    except OSError as e:
        print('✗ 读不到标尺模板：%s（%s）' % (_ruler_template(), e))
        return 2
    r_heads, r_groups, r_bans = _ruler_facts(rtpl)
    if not r_heads or not r_groups:
        print('✗ 标尺模板里读不到节或组：%s' % _ruler_template())
        return 2

    passed_files = 0
    for p in paths:
        print('◆ %s' % os.path.basename(p))
        text = _read(p)
        first = next((l.strip() for l in text.split('\n') if l.strip()), '')
        if first.startswith('# 参考作品档案：'):
            got, total = _check_one(os.path.basename(p), text, want_heads, bans)
        elif first == '# 参考标尺':
            got, total = _check_ruler(text, r_heads, r_groups, r_bans)
        else:
            print('  ✗ 认不出产物形态——首行须是「# 参考作品档案：…」或「# 参考标尺」，'
                  '现在是「%s」' % first[:30])
            got, total = 0, 1
        print('  核验 %d／总 %d 项过' % (got, total))
        if got == total:
            passed_files += 1
    print('档案核验：%d／%d 份过' % (passed_files, len(paths)))
    return 0 if passed_files == len(paths) else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
