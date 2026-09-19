# -*- coding: utf-8 -*-
"""check_basic_spec（基本规格核验·机械件）

用法：python check_basic_spec.py <基本规格.md 的路径>
只读不写、零依赖、不联网。逐项打印 ✓／✗，末行汇总「核验 N／总 M 项过」；
全过退出 0，任一不过退出 1，文件读不到退出 2。

核验项（只核机器可判定的形态与完备）：
  1 节齐——基础参数／基调风格／参考偏好／约束 四节齐
  2 基础参数必填无空——题材／平台／读者定位／体量／作者绝对不写五项已填
  3 基调——已填且 2-6 词（按「、」切词；补充句可空不核）
  4 参考——主要参考只能有一本且已填；次要参考 0-3 本已填
  5 核验结论——约束节「本次核验结论」行已写且非占位
  6 无模板外行——基础参数／基调风格／参考偏好三节的行标签都在模板允许集内（防自创字段）
  7 题材干净——题材值不含 ／ 或 、 等分隔符（复合格须归到一个类目）
形态依据：assets/outline-basic-spec-template.md（模板正文）。
"""
import io
import re
import sys

ALLOWED_LABELS_1 = {'题材', '平台', '读者定位', '体量', '作者绝对不写'}
ALLOWED_LABELS_2 = {'基调'}
ALLOWED_LABELS_3 = {'主要参考', '次要参考'}
REQUIRED_1 = ['题材', '平台', '读者定位', '体量', '作者绝对不写']
PLACEHOLDER = '{'


def _stdout_utf8():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def _sections(text):
    """把全文按 ### 标题切节：{节名: [行]}。"""
    secs = {}
    cur = None
    for line in text.split('\n'):
        m = re.match(r'^###\s+(.*)$', line.strip())
        if m:
            cur = m.group(1).strip()
            secs[cur] = []
        elif cur is not None:
            secs[cur].append(line)
    return secs


def _bullets(lines):
    """形如「- 标签：反引号包值」的行 → [(标签, 值)]；无反引号值的取冒号后全文。"""
    out = []
    for line in lines:
        s = line.strip()
        if not s.startswith('- '):
            continue
        body = s[2:]
        if '：' not in body:
            continue
        label = body.split('：', 1)[0].strip()
        rest = body.split('：', 1)[1]
        m = re.search(r'`([^`]*)`', rest)
        value = m.group(1) if m else rest.strip()
        out.append((label, value))
    return out


def main(argv):
    _stdout_utf8()
    if len(argv) != 2:
        print('用法：python check_basic_spec.py <基本规格.md 路径>')
        return 2
    try:
        with io.open(argv[1], encoding='utf-8', errors='replace') as f:
            text = f.read()
    except OSError as e:
        print('✗ 读不到文件：%s（%s）' % (argv[1], e))
        return 2

    secs = _sections(text)
    results = []

    def ok(name):
        results.append((True, name))

    def bad(name, why):
        results.append((False, name + '——' + why))

    # 1 节齐
    want = ['基础参数', '基调风格', '参考偏好']
    missing_sec = [s for s in want if s not in secs]
    has_constraint = any(k.startswith('约束') for k in secs)
    if not missing_sec and has_constraint:
        ok('三节＋约束齐')
    else:
        why = []
        if missing_sec:
            why.append('缺节 ' + '、'.join(missing_sec))
        if not has_constraint:
            why.append('缺约束节')
        bad('节齐', '；'.join(why))

    b1 = _bullets(secs.get('基础参数', []))
    b2 = _bullets(secs.get('基调风格', []))
    b3 = _bullets(secs.get('参考偏好', []))
    labels1 = {l for l, _ in b1}

    # 2 基础参数必填无空
    empty = [l for l, v in b1 if l in REQUIRED_1 and (not v or PLACEHOLDER in v)]
    absent = [l for l in REQUIRED_1 if l not in labels1]
    if not empty and not absent:
        ok('必填五项全填')
    else:
        why = []
        if absent:
            why.append('缺行 ' + '、'.join(absent))
        if empty:
            why.append('未填 ' + '、'.join(empty))
        bad('必填无空', '；'.join(why))

    # 3 基调 2-6 词
    tone = next((v for l, v in b2 if l == '基调'), None)
    if tone and PLACEHOLDER not in tone:
        words = [w for w in re.split(r'[、，,]', tone) if w.strip()]
        if 2 <= len(words) <= 6:
            ok('基调 %d 词（2-6 合格）' % len(words))
        else:
            bad('基调', '现在是 %d 词——须 2-6 词（词序即主次）' % len(words))
    else:
        bad('基调', '基调未填或仍是占位')

    # 4 参考
    mains = [v for l, v in b3 if l == '主要参考' and v and PLACEHOLDER not in v]
    aux = [v for l, v in b3 if l == '次要参考' and v and PLACEHOLDER not in v]
    if len(mains) == 1 and len(aux) <= 3:
        ok('主要参考一本、次要参考 %d 本（0-3 合格）' % len(aux))
    else:
        bad('参考', '主要参考现在 %d 本（只能有一本）、次要参考 %d 本（须 0-3 本）' % (len(mains), len(aux)))

    # 5 核验结论
    concl = [x for x in text.split('\n') if x.strip().startswith('- 本次核验结论')]
    if concl:
        m = re.search(r'`([^`]*)`', concl[-1])
        val = m.group(1) if m else ''
        if val and PLACEHOLDER not in val:
            ok('核验结论已写')
        else:
            bad('核验结论', '「本次核验结论」行还是占位——须写入 1.2 的结论一行')
    else:
        bad('核验结论', '约束节缺「本次核验结论」行')

    # 6 无模板外行（前三节行标签都在允许集）
    outside = sorted(
        (labels1 | {l for l, _ in b2} | {l for l, _ in b3})
        - ALLOWED_LABELS_1 - ALLOWED_LABELS_2 - ALLOWED_LABELS_3)
    if not outside:
        ok('无模板外行（前三节行标签都在模板集内）')
    else:
        bad('无模板外行', '出现模板没有的行：' + '、'.join(outside))

    # 7 题材干净（不含分隔符——复合格须归到一个类目；下游按它定设定框架）
    subj = next((v for l, v in b1 if l == '题材'), '')
    if not subj or PLACEHOLDER in subj:
        bad('题材干净', '题材未填或仍是占位')
    elif re.search(r'[／/、，,]|或', subj):
        bad('题材干净', '题材「%s」含分隔符——须归到**一个**类目（如「东方奇幻」这种词组可以）' % subj)
    else:
        ok('题材干净（一个词组，无分隔符）')

    for good, name in results:
        print(('✓ ' if good else '✗ ') + name)
    passed = sum(1 for g, _ in results if g)
    print('核验 %d／总 %d 项过' % (passed, len(results)))
    return 0 if passed == len(results) else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
