"""内容轨检查（宪法 §3.6 内容轨）：引用闭合 + 加粗密度 + TOC 存在性。
由 scripts/check.sh 调用，也可独立运行：python scripts/check_content.py
参数：无命令行参数，全量扫描（skill 资产 skills/abzu-*/ 全部 .md；治理文件 AGENTS.md、
README.md、docs/**/*.md）。
依赖：Python 3 标准库（re/glob/os/sys），零外部依赖。
退出码：0 = 全绿 / 1 = 有问题
维护入口（新增检查维度接入位置）：新增一段「扫描循环 + issues.append(...)」，与现有
引用闭合 / 加粗密度 / TOC / SKILL.md 行数 四段并列；扫描文件集合入口有二——skill 资产 glob
'skills/abzu-*/**/*.md' 与治理文件 gov_files 列表，扩范围时改这两处。
"""
import re, glob, os, sys

issues = []

# ═══ 引用闭合 ═══
# 扫描所有 skill .md 文件中的 skill 根相对路径引用（references/... 或 scripts/...），验证实存
for f in sorted(glob.glob('skills/abzu-*/**/*.md', recursive=True)):
    s = open(f, encoding='utf-8').read()
    # 提取 references/scan/xxx.md 或 scripts/xxx.js 等路径模式
    for m in re.finditer(r'(?:references|scripts)/[\w/-]+\.\w{2,4}', s):
        ref = m.group(0)
        # 从 skill 根解析实际文件路径
        skill_root = '/'.join(f.replace(os.sep, '/').split('/')[:2])
        full = os.path.join(skill_root, ref) if not ref.startswith('skills/') else ref
        if not os.path.isfile(full):
            issues.append(f'断链: {f} → {ref}')

# 治理文档相对链接须解析存在（016 扩围）；skill 根相对路径引用（references|scripts 前缀，
# 运行时按 SKILL_DIR 解析的另一种语义）按现有规则跳过
gov_files = ['AGENTS.md', 'README.md'] + glob.glob('docs/**/*.md', recursive=True)
for f in sorted(gov_files):
    s = open(f, encoding='utf-8').read()
    base = os.path.dirname(f)
    # 行内代码（`...`）内的链接形文本是示例/提及（对照 file-conventions §三），非真链接，不参与解析
    s = re.sub(r'`[^`]*`', '', s)
    for m in re.finditer(r'\[[^\]]*\]\(([^)\s]+)\)', s):
        target = m.group(1)
        if target.startswith(('http://', 'https://', '#')):
            continue
        if re.match(r'(?:references|scripts)/', target):
            continue
        path = target.split('#', 1)[0]
        if not path:
            continue
        if not os.path.isfile(os.path.join(base, path)):
            issues.append(f'断链: {f} → {target}')

# ═══ 加粗密度 ═══
for f in sorted(glob.glob('skills/abzu-*/**/*.md', recursive=True)):
    s = open(f, encoding='utf-8').read()
    # 清洗代码区后统计：fenced 代码块与行内代码中的 ** 非加粗语义，不计（021）
    s2 = re.sub(r'```.*?```', '', s, flags=re.S)
    s2 = re.sub(r'`[^`]*`', '', s2)
    b = len(re.findall(r'\*\*', s2))
    l = s.count('\n') + 1
    if b > l // 3:
        issues.append(f'加粗超限: {f} ({b} > {l//3})')

# ═══ TOC 存在性 ═══
for f in sorted(glob.glob('skills/abzu-*/references/**/*.md', recursive=True)):
    s = open(f, encoding='utf-8').read()
    lc = s.count('\n') + 1
    # 目录判定排除代码块内字样（021）
    sc = re.sub(r'```.*?```', '', s, flags=re.S)
    if lc > 100 and '## 目录' not in sc:
        issues.append(f'缺目录: {f} ({lc} 行)')

# ═══ SKILL.md 行数 ═══
# 六壳 SKILL.md < 500 行（Agent Skills 开放规范硬约束，宪法 §7）——官方硬约束用阻断口径
# （exit 1），不套 candidate 呈报语义（宪法 §2：candidate 辖不确定价值的候选发现）
for f in sorted(glob.glob('skills/abzu-*/SKILL.md')):
    lc = len(open(f, encoding='utf-8').read().splitlines())  # 边界精确（官方硬约束闸，不沿用 +1 惯例）
    if lc >= 500:
        issues.append(f'SKILL.md 超限: {f} ({lc} 行 ≥ 500)')

if issues:
    for i in issues:
        print(f'x {i}')
    sys.exit(1)
print('内容轨检查全绿')
