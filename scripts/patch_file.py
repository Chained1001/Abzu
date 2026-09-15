"""修订工具（仓级开发工具，按需运行；把「修订类脚本三段式」固化为机制）。

事故出身与历次裁定：见 `CHANGELOG.md` 对应条目与 `docs/specs/archive/` 各批规格（091 批：089–090
三次同型中止——089 内该汇总串命中 2 行、090 两次「凭记忆写的匹配键」count=0；中止信息只有计数，
须再猜一轮才能取到真值）。行内出现的批次号分三种——**状态型**（书写时一律状态无关）／**判据的事故出处**（provenance，保留原文）／**运行时措辞／示例串**（**不得按批次叙事改写**）。

用途：对仓内文本做**锚点由磁盘校验**的定点修订——三种定点用法（行内片段替换／锚行后追加／锚行前插）
＋ 一种批量用法（JSON）。**三段式**为硬要求：① 全量校验（锚片段须唯一命中；命中 0 或 >1 一律中止，
打印**实际命中行及其行号**，命中 0 时另打印**最接近的一行**供取真值）② 统一写盘（全过才写；不过＝
**零写盘**）③ 回读核验（新文本在位，且 `--set` 时锚串不再在该行出现；批内同槽位被后条重写时，
前条记录改判该槽位的**终态**——其自身产出被后条消费，不可能仍在位）。反模式 #12／#18／#20 的
机制化落点。

用法与参数：`python scripts/patch_file.py [--at 锚片段] (--set|--append|--insert-before) 新文本 目标件`
  · `--at <锚片段>`：**行内片段**（非整行）——含该片段的行即锚行；该片段在目标件内**须唯一命中**。
  · `--set <新文本>`：把锚行内的锚片段**整片段**替换为新文本（同一行内出现多处＝命中不唯一、中止）；新文本**可含换行**。
  · `--append <新文本>`：在**锚行之后**插入（新文本可含换行，按 `\\n` 切分后逐行插入）。
  · `--insert-before <新文本>`：在**锚行之前**前插（同上）。
  · `--batch <edits.json>`：批量，JSON 形如 `[{"path":…,"at":…,"set"|"append"|"insert-before":…}, …]`；
    **同件多编辑按逐条应用后的文本判唯一性**（前条的结果是后条的锚点面），全部通过才写盘；**同件多编辑须以同一路径写法给出**——不同写法指向同一物理件（大小写 alias／8.3 短名／符号链接）即**参数错**（退出 2、零写盘）。
  · **目标文件以位置参数传入（末位）**；批量模式下不给位置参数（路径写在 JSON 内）。
  · 新文本**尾随一个 `\\n` 不表意**（书写习惯，去掉一次）：`--insert-before "行\\n\\n"`＝插「行 ＋ 一张空行」。
  · `--at` 为空串＝**参数错（退出 2）**。
编码与行尾（硬要求）：读写一律 `newline=''`（不作换行翻译）、**保持目标件原有行尾**（新插入行沿用该件
  行尾）、UTF-8 无 BOM（目标件已带 BOM 即拒绝改动——不静默改写其编码形态）。
输出：逐处「`文件:行` 改前 → 改后」＋ 汇总（`N 处／M 件`）；错误行 `x` 起首、明细行两空格缩进。
退出码：0 全成功／2 参数错或校验失败（三段式任一段不过即中止，**不半写**）。
依赖与前置：Python 3 标准库（argparse／json／os／re／sys），**零外部依赖**；不联网、不跑 LLM。
  **只读写命令行点名的目标件**：写盘经**同目录临时件 ＋ 整体替换**（异常路径删除临时件）；不读规格、
  不跑 git、不写其它文件。
维护入口：新增用法扩 `_apply()` 与 `build_parser()`；命中判据与「最接近的一行」改 `_hits()`／`_nearest()`；
  写盘与回读改 `_write()`／`_readback()`；行尾与切行改 `_split_lines()`／`_eol()`／`_split_text()`；
  批量解析改 `_load_batch()`；`--batch` 同件 alias 判据改 `_ident()`。
"""
import argparse
import json
import os
import re
import sys


class Fail(Exception):
    """校验失败（三段式第一段／第三段的统一出口）：异常值＝消息行列表，首行由调用方加 `x ` 前缀。"""


def _stdout_utf8():
    """中文 Windows 下 stdout／stderr 默认 GBK，打印 `→`／中文会 UnicodeEncodeError（2026-09-11 实测）；
    两流各自 try／except——某流不可 reconfigure 不影响另一流。"""
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass


def _split_lines(raw):
    """整件文本 → [(行内容, 行尾串), …]（行尾串含末行的空串）。**逐行各存自己的行尾**：
    文件混用行尾时不改写既有行——「保持目标件原有行尾」的落点（不按行尾切分整件即无从保证）。"""
    parts = re.split(r'(\r\n|\n|\r)', raw)
    lines = []
    i = 0
    while i + 1 < len(parts):
        lines.append((parts[i], parts[i + 1]))
        i += 2
    if parts[-1] != '':                 # 末行无行尾（原文件不以换行收束）时保留为空行尾
        lines.append((parts[-1], ''))
    return lines


def _eol(lines):
    """该件行尾（新插入行沿用）：取**首个**非空行尾；空件／无行尾件取 `\\n`。"""
    for _c, term in lines:
        if term:
            return term
    return '\n'


def _norm_text(text):
    """新文本的换行归一（`\\r\\n`／`\\r` → `\\n`）；写盘时再按目标件行尾落盘。"""
    return text.replace('\r\n', '\n').replace('\r', '\n')


def _split_text(text):
    """新文本 → 行列表：按 `\\n` 切分；**尾随一个 `\\n` 不表意**（书写习惯，去掉一次）。
    故 `行\\n\\n`＝「行 ＋ 一张空行」；`\\n` 与空串均＝一张空行（语义由用法定：`--set` 空串＝删除锚片段，
    `--append`／`--insert-before` 空串＝插一张空行）。"""
    t = _norm_text(text)
    if t.endswith('\n'):
        t = t[:-1]
    return t.split('\n')


def _disp(s, limit=60):
    """单行显示串：换行转义为 `\\n`／`\\r`（保住「一行一处」的输出形态）、超长截断。"""
    d = _norm_text(s).replace('\n', '\\n')
    return d if len(d) <= limit else d[:limit] + '…'


def _hits(lines, at):
    """锚片段的行内命中：返回 ([(行号 1 起, 行内容), …], 片段出现次数总和)。
    计数口径＝**片段出现次数**（同一行内出现两处即 2 处、被 >1 分支拒）——行级与片段级同判：
    故 `--set` 的替换面对**恒为单处**（`str.replace` 与单处替换等价），无「同行多处」形态。"""
    hits, n = [], 0
    for i, (content, _term) in enumerate(lines, 1):
        k = content.count(at)
        if k:
            hits.append((i, content))
            n += k
    return hits, n


def _sim(a, b):
    """廉价相似度（零依赖、O(len)）：最长公共前缀 ＋ 最长公共后缀 ＋ 字符多重集交集长度。
    不用 `difflib`（不在标准库白名单内的既用集合）；不对全件做编辑距离（大件上过重）。"""
    n = min(len(a), len(b))
    pre = 0
    while pre < n and a[pre] == b[pre]:
        pre += 1
    suf = 0
    while suf < n - pre and a[-1 - suf] == b[-1 - suf]:
        suf += 1
    pool = {}
    for ch in a:
        pool[ch] = pool.get(ch, 0) + 1
    shared = 0
    for ch in b:
        if pool.get(ch, 0) > 0:
            pool[ch] -= 1
            shared += 1
    return pre + suf + shared


def _nearest(lines, at):
    """命中 0 时供取真值：取相似度最高的一行（并列取行号在前者）；空件返回 None。
    返回 (行号, 行内容)——行内容**原样**打印（判据须据全量取证，不截断）。"""
    best = None
    for i, (content, _term) in enumerate(lines, 1):
        score = _sim(at, content)
        if best is None or score > best[0]:
            best = (score, i, content)
    return (best[1], best[2]) if best else None


def _shift(recs, at, k):
    """在**下标 at 之前**插入 k 行：其后（含 at）的回读记录下标随动（回读按最终下标定位）。"""
    if k <= 0:
        return
    for rec in recs:
        if rec['idx'] >= at:
            rec['idx'] += k


def _ident(path):
    """物理件标识（`--batch` 同件判定的 alias 面）：优先 `os.stat` 的 `(st_dev, st_ino)`——Windows 下即
    卷序列号 ＋ 文件索引，可识**大小写 alias／8.3 短名／符号链接／硬链接**；不可得（`st_ino` 为 0 或
    stat 失败）时退 `normcase(realpath(...))`。**只读**（只 stat，不打开、不改动该件）。"""
    try:
        st = os.stat(path)
        if st.st_ino:
            return (st.st_dev, st.st_ino)
    except OSError:
        pass
    return ('path', os.path.normcase(os.path.realpath(path)))

def _load(path):
    """读目标件（`newline=''` 不作换行翻译）→ 文档态：行列表 ＋ 该件行尾 ＋ 回读记录表。"""
    if not os.path.isfile(path):
        raise Fail([f'目标件不存在: {path}'])
    with open(path, 'r', encoding='utf-8', newline='') as f:
        raw = f.read()
    if raw.startswith('\ufeff'):
        raise Fail([f'目标件带 BOM（本工具只写 UTF-8 无 BOM，拒绝静默改写其编码形态）: {path}'])
    lines = _split_lines(raw)
    return {'lines': lines, 'eol': _eol(lines), 'recs': []}


def _apply(doc, path, at, mode, text):
    """三段式第一段（全量校验）＋第二段的内存部分：在 doc['lines'] 上应用一条编辑，返回显示行。
    命中 0 或 >1 即抛 Fail（0 命中另给「最接近的一行」）——**调用方尚未写盘，故中止＝零写盘**。"""
    lines = doc['lines']
    hits, n = _hits(lines, at)
    if n == 0:
        msg = [f'未命中：锚片段「{_disp(at)}」在 {path} 中 0 处（须唯一命中）——本次全部编辑未写盘']
        near = _nearest(lines, at)
        if near:
            msg.append(f'  最接近的一行（第 {near[0]} 行）: {near[1]}')
        raise Fail(msg)
    if n > 1:
        msg = [f'命中不唯一：锚片段「{_disp(at)}」在 {path} 中 {n} 处（须唯一）——本次全部编辑未写盘']
        for i, content in hits:
            msg.append(f'  第 {i} 行: {content}')
        raise Fail(msg)
    idx = hits[0][0] - 1
    eol = doc['eol']
    if mode == 'set':
        content, term = lines[idx]
        # 行内片段替换：新文本可含换行——先按该件行尾落地，再切回「行 ＋ 行尾」形态
        newc = content.replace(at, _norm_text(text).replace('\n', eol))
        pieces = newc.split(eol)
        repl = [(p, eol) for p in pieces[:-1]] + [(pieces[-1], term)]
        # 同槽位被后条编辑重写（`--batch` 逐条应用）：先前记录改判「槽位终态」——其自身的产出文本已
        # 被后条消费、不可能仍在位（「逐条确认新文本在位」在该形态下不可满足）；该记录的 `expect`
        # 改记为槽位最终内容、并免去锚串子项（后条的新文本可合法地重新引入早先的锚串）。
        for rec in doc['recs']:
            if rec['idx'] == idx:
                rec['expect'] = [p for p, _t in repl]
                rec['superseded'] = True
        _shift(doc['recs'], idx + 1, len(repl) - 1)
        lines[idx:idx + 1] = repl
        rec = {'idx': idx, 'expect': [p for p, _t in repl], 'superseded': False,
               'anchor': at, 'new': _norm_text(text), 'mode': mode, 'lineno': idx + 1}
        before, after = at, text
    else:
        ins = [(p, eol) for p in _split_text(text)]
        if mode == 'append':
            if not lines[idx][1]:
                lines[idx] = (lines[idx][0], eol)   # 末行无行尾：先补齐，免与插入行黏连
            pos = idx + 1
        else:
            pos = idx
        _shift(doc['recs'], pos, len(ins))
        lines[pos:pos] = ins
        rec = {'idx': pos, 'expect': [p for p, _t in ins], 'superseded': False,
               'anchor': at, 'new': _norm_text(text), 'mode': mode, 'lineno': pos + 1}
        before, after = f'（新增行，锚行 {idx + 1}）', text
    doc['recs'].append(rec)
    return f'{path}:{rec["lineno"]} 改前「{_disp(before)}」 → 改后「{_disp(after)}」'


def _write(doc, path):
    """三段式第二段：统一写盘（全量校验已过）——同目录临时件 ＋ 整体替换；异常路径删临时件。
    返回写入的整件文本（回读段据此比对）。"""
    text = ''.join(content + term for content, term in doc['lines'])
    tmp = os.path.join(os.path.dirname(os.path.abspath(path)),
                       '.' + os.path.basename(path) + '.patch-tmp')
    try:
        with open(tmp, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)          # 异常路径删除临时件（不留残件、不半写）
        raise
    return text


def _readback(doc, path, text):
    """三段式第三段：回读核验——重读磁盘（`newline=''`），① 整件逐字相符（行尾／编码未被翻译）
    ② 逐条确认记录的槽位内容与 `--set` 新文本在位 ③ `--set` 时锚串不再在该行出现。两处放宽（同为
    记录项、非静默）：· 新文本自身含锚串时该子项不适用（「锚串不再出现」与其字面自相矛盾）；
    · `superseded`（批内同槽位被后条重写）记录改判槽位终态、免锚串子项（见 `_apply()`）。"""
    with open(path, 'r', encoding='utf-8', newline='') as f:
        raw = f.read()
    if raw != text:
        raise Fail([f'回读不符：{path} 重新读入的内容与写盘内容不一致（行尾或编码被翻译？）'])
    lines = _split_lines(raw)
    bad = []
    for rec in doc['recs']:
        got = [c for c, _t in lines[rec['idx']:rec['idx'] + len(rec['expect'])]]
        if got != rec['expect']:
            bad.append(f'  第 {rec["lineno"]} 行回读不符：「{_disp("／".join(got), 120)}」'
                       f'（期望「{_disp("／".join(rec["expect"]), 120)}」）')
            continue
        if (not rec['superseded'] and rec['mode'] == 'set' and rec['new'] != rec['anchor']
                and rec['anchor'] not in rec['new']
                and any(rec['anchor'] in c for c in got)):
            bad.append(f'  第 {rec["lineno"]} 行回读不符：锚串「{_disp(rec["anchor"])}」仍在该行')
    if bad:
        raise Fail([f'回读核验未过（新文本未在位）: {path}'] + bad)


def _load_batch(path):
    """批量 JSON → 编辑列表 [(path, at, mode, text), …]（形态错一律抛 Fail＝参数错）。"""
    if not os.path.isfile(path):
        raise Fail([f'参数错：批量文件不存在: {path}'])
    with open(path, 'r', encoding='utf-8', newline='') as f:
        try:
            data = json.load(f)
        except ValueError as e:
            raise Fail([f'参数错：批量文件不是合法 JSON: {path}（{e}）'])
    if not isinstance(data, list) or not data:
        raise Fail(['参数错：批量文件须是非空数组（形如 [{"path":…,"at":…,"set":…}, …]）'])
    out = []
    for i, item in enumerate(data, 1):
        if not isinstance(item, dict):
            raise Fail([f'参数错：批量第 {i} 条不是对象'])
        target, at = item.get('path'), item.get('at')
        if not isinstance(target, str) or not target:
            raise Fail([f'参数错：批量第 {i} 条缺 path'])
        if not isinstance(at, str) or at == '':
            raise Fail([f'参数错：批量第 {i} 条的 at 须为非空字符串（空串即参数错）'])
        ops = [(m, item[m]) for m in ('set', 'append', 'insert-before') if m in item]
        if len(ops) != 1:
            raise Fail([f'参数错：批量第 {i} 条须给出 set／append／insert-before 之一（且只给一个）'])
        mode, text = ops[0]
        if not isinstance(text, str):
            raise Fail([f'参数错：批量第 {i} 条的 {mode} 须为字符串（可为空串）'])
        out.append((target, at, mode.replace('-', '_'), text))
    return out


def parse_edits(args):
    """命令行 → 编辑列表 [(path, at, mode, text), …]；参数错一律抛 Fail（退出 2）。"""
    if args.batch is not None:
        if (args.target is not None or args.at is not None or args.set is not None
                or args.append is not None or args.insert_before is not None):
            raise Fail(['参数错：--batch 不得与 --at／--set／--append／--insert-before／位置参数同用'])
        return _load_batch(args.batch)
    if args.target is None:
        raise Fail(['参数错：缺目标文件（末位位置参数）'])
    if args.at is None:
        raise Fail(['参数错：缺 --at（锚片段）'])
    if args.at == '':
        raise Fail(['参数错：--at 为空串（锚片段不得为空）'])
    ops = [(m, getattr(args, m)) for m in ('set', 'append', 'insert_before')
           if getattr(args, m) is not None]
    if len(ops) != 1:
        raise Fail(['参数错：--set／--append／--insert-before 须给出且只给一个'])
    mode, text = ops[0]
    return [(args.target, args.at, mode, text)]


def _fail(e):
    """失败收口：首行 `x` 起首、明细行按两空格缩进原样打印；返回退出码 2。"""
    msgs = e.args[0]
    print(f'x {msgs[0]}', file=sys.stderr)
    for m in msgs[1:]:
        print(m, file=sys.stderr)
    return 2


def build_parser():
    """命令行形态（`--help` 可用；缺／多参数由 argparse 或 parse_edits() 以退出 2 收口）。"""
    p = argparse.ArgumentParser(
        prog='patch_file.py',
        description='修订工具：锚点由磁盘校验的定点文本修订'
                    '（三段式：全量校验 → 统一写盘 → 回读核验）。',
        epilog='用法示例：python scripts/patch_file.py --at "锚片段" --set "新文本" 目标件.md'
               '（批量：--batch edits.json）')
    p.add_argument('--at', metavar='锚片段', help='行内片段（非整行）；须在目标件内唯一命中')
    p.add_argument('--set', metavar='新文本', help='替换锚行内的锚片段（新文本可含换行）')
    p.add_argument('--append', metavar='新文本', help='在锚行之后插入新行')
    p.add_argument('--insert-before', metavar='新文本', help='在锚行之前前插新行')
    p.add_argument('--batch', metavar='edits.json', help='批量编辑（JSON 数组，见模块头注）')
    p.add_argument('target', nargs='?', metavar='目标文件', help='目标文件（末位位置参数）')
    return p


def main(argv):
    _stdout_utf8()
    args = build_parser().parse_args(argv)
    try:
        edits = parse_edits(args)
    except Fail as e:
        return _fail(e)
    docs, idents, shown = {}, {}, []
    try:
        for target, at, mode, text in edits:
            key = os.path.normpath(os.path.abspath(target))
            if key not in docs:
                ident = _ident(target)
                prior = idents.get(ident)
                if prior is not None and prior != key:
                    raise Fail([f'参数错：同件被多个路径写法引用——{prior} 与 {target} 指向同一物理件'
                                f'（--batch 同件多编辑须用同一路径写法）；本次全部编辑未写盘'])
                idents[ident] = key
                docs[key] = _load(target)
                docs[key]['path'] = target      # 显示沿用调用者给的路径
            shown.append(_apply(docs[key], target, at, mode, text))
        written = [(key, _write(docs[key], docs[key]['path'])) for key in docs]
        for key, text in written:
            _readback(docs[key], docs[key]['path'], text)
    except Fail as e:
        return _fail(e)
    for line in shown:
        print(line)
    print(f'· 汇总：{len(edits)} 处／{len(docs)} 件——全部通过（三段式：校验 → 写盘 → 回读核验）')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
