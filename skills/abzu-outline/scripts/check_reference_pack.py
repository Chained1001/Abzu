# -*- coding: utf-8 -*-
"""check_reference_pack（参考资料包核验·机械件）

用法：python check_reference_pack.py <档案.md 或 资料/ 目录> [模板.md 路径]
只读不写、零依赖、不联网。逐份逐项打印 ✓／✗，末行汇总「档案核验：M／N 份过」；
全部过退出 0，任一不过退出 1，参数或文件读不到退出 2。
模板路径缺省＝本脚本同域上一级的 assets/outline-reference-archive-template.md。

核验项（只核机器可判定的形态与完备；内容真假归 2.2 作者审）：
  1 首行形态——首行是「# 参考作品档案：{非空名}」
  2 十三节齐且序对——产物 ### 标题与模板 ### 标题逐字一致（含顺序；另报 ## 级误用）
  3 核心五节非空——基本信息／内核定标／主线结构／人物档案／来源标注各有内容行
  4 无花括号——产物不出现 { }（占位符残留）
  5 无反引号——产物不出现 `（模板旧占位符教出的坏习惯）
  6 无提示词回显——模板花括号内的提示词串不得在产物出现（报至多 3 处行号）
  7 状态合法——基本信息「状态」∈ 采集中／档完
  8 来源两栏非空——来源标注「LLM 记忆」「联网核实」两行都在且非空
形态依据：assets/outline-reference-archive-template.md（提示词提取与节名都从该件现读，
改模板即改本脚本判定面，无须同步改码）。
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

    passed_files = 0
    for p in paths:
        print('◆ %s' % os.path.basename(p))
        text = _read(p)
        got, total = _check_one(os.path.basename(p), text, want_heads, bans)
        print('  核验 %d／总 %d 项过' % (got, total))
        if got == total:
            passed_files += 1
    print('档案核验：%d／%d 份过' % (passed_files, len(paths)))
    return 0 if passed_files == len(paths) else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
