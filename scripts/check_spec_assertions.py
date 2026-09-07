"""规格断言预验器（开发工具，按需运行，供规划方写规格时机械完成铁律④「断言写前实跑」）。

用途：从规格「验收标准」节提取命令断言（行内反引号与围栏整行命令），白名单只读执行，
输出每条命令的退出码与输出摘要——不做通过/失败判定（规格断言多系施工后状态，
本工具取的是当前树基线，供规划方对照规格内声称的基线/预验结论）。
事故出身：020-025 六发断言自噬（断言吞自家 [A] 文本/对象错/计数错/恒真假绿）——
2026-09-07 作者裁定守卫化（宪法 §2 candidate 永不拦截：本工具退出码恒 0，仅呈报）。
用法：python scripts/check_spec_assertions.py docs/specs/0XX-*.md
依赖与前置：Python 3 标准库（re/subprocess/sys/os），零外部依赖；只读白名单命令，
越权命令（写操作/重定向/git 写子命令/非 -n 的 sed/会留缓存产物的 py_compile）跳过并标注 SKIP。
维护入口：新增可执行命令形态扩 ALLOWED 白名单；提取规则（验收节定位/行内与围栏两种形态）
改 extract()；输出格式改 report()。
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
                               text=True, timeout=120,
                               cwd=os.path.dirname(os.path.dirname(
                                   os.path.abspath(__file__))))
            out = (r.stdout + r.stderr).strip().splitlines()
            head = ' ⏎ '.join(out[:3]) if out else '(无输出)'
            print(f'[{i}] {src} exit={r.returncode}: {c}\n    {head[:200]}')
        except subprocess.TimeoutExpired:
            print(f'[{i}] {src} TIMEOUT: {c}')
        ran += 1
    print(f'== 共 {len(cmds)} 条：执行 {ran}｜跳过 {skipped}（基线呈报，不作通过判定）==')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('用法: python scripts/check_spec_assertions.py <规格路径>',
              file=sys.stderr)
        sys.exit(2)
    if not os.path.isfile(sys.argv[1]):
        print(f'x 文件不存在: {sys.argv[1]}', file=sys.stderr)
        sys.exit(2)
    report(sys.argv[1])
    sys.exit(0)
