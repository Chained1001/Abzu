"""内容轨检查（宪法 §3.6 内容轨）：引用闭合 + 加粗密度 + TOC 存在性。
由 scripts/check.sh 调用，也可独立运行：python scripts/check_content.py
退出码：0 = 全绿 / 1 = 有问题
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
        full = os.path.join('skills', 'abzu-scan', ref) if not ref.startswith('skills/') else ref
        if not os.path.isfile(full):
            issues.append(f'断链: {f} → {ref}')

# ═══ 加粗密度 ═══
for f in sorted(glob.glob('skills/abzu-*/**/*.md', recursive=True)):
    s = open(f, encoding='utf-8').read()
    b = len(re.findall(r'\*\*', s))
    l = s.count('\n') + 1
    if b > l // 3:
        issues.append(f'加粗超限: {f} ({b} > {l//3})')

# ═══ TOC 存在性 ═══
for f in sorted(glob.glob('skills/abzu-*/references/**/*.md', recursive=True)):
    s = open(f, encoding='utf-8').read()
    lc = s.count('\n') + 1
    if lc > 100 and '## 目录' not in s:
        issues.append(f'缺目录: {f} ({lc} 行)')

if issues:
    for i in issues:
        print(f'x {i}')
    sys.exit(1)
print('内容轨检查全绿')
