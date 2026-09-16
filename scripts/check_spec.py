"""规格静态自检器（开发工具，按需运行；供规划方在规格送审前机械检出十类规格缺陷）。

事故出身与历次裁定：见 `CHANGELOG.md` 对应条目与 `docs/specs/archive/` 各批规格。行内出现的批次号分三种——**状态型**（书写时一律状态无关）／**判据的事故出处**（provenance，保留原文）／**运行时措辞／示例串**（**不得按批次叙事改写**）。

用途：对规格做**静态**检查（不执行规格内任何命令，只读规格、磁盘与白名单内的只读 git 子命令）——检查 A 断言
自噬预警（断言 token 被自家 [A]／[B] 行的目标文本吞掉，呈报预测值与规格「到位」列的差；另有「零命中
待复核」——期望 ≥N（N≥1）而当前命中 0 时呈报，与「零命中核对未判」——期望子句多值、取数无法与
命令对齐时呈报同名候选行）、检查 B 计数实跑
重算（规格内「整件尺寸」声称与实测的差）、检查 C [A] 项**目标文本**的逐字落实核对、检查 D 规格写作
机械检查四项（嵌套反引号／代码跨度边缘空格／加粗引导行紧跟列表／规格内可解析相对链接）／检查 E 三方对账（改动面 ↔ 禁改面 ↔ 断言排除集）／检查 F 禁改面禁词核对（禁改面「不得把 … 搬进／写入 skill 资产」述谓句内的顿号词组 ↔ 改动清单各行的**目标侧引号块**；词面判据与 E 判一的目录前缀判据互补不重叠）／检查 G 自由度分布对账（头注「自由度分布」↔ 改动清单自由度列；两侧均为可数结构，不一致即出候选）／检查 H 核销表汇总核对（§七 汇总行 ↔ 表体状态列）／检查 I 锚点对源核对（§一 现状锚点 ↔ 目标件实况）／检查 J 审查记录核对（§九 审查记录节 ↔ 节内 findings 共 N 的各档位之和；判据改 check_archive_record()／ARCHIVE_RECORD_SECTION／RECORD_FINDINGS／RECORD_PLACEHOLDER／RECORD_TIER）——十类一律
非阻断。无 `--static` 时的默认跑法另含动态阶段：从规格「验收断言」节提取命令断言（行内反引号与围栏
整行命令），依**执行面白名单**只读执行，三态呈报（可审计／不可审计／未跑成）——不做通过/失败判定
（规格断言多系施工后状态，本工具取的是当前树基线，供规划方对照规格内声称的基线／预验结论）。
**执行面白名单（修后实况）**：可执行族仅 `e?grep`／`fgrep`／`wc`／`head`／`tail`／`ls`／`cat`
与 git 的 `diff`／`status`／`log`／`show`／`grep`（git 族另按「子命令 ＋ 参数白名单」判，见
`GIT_READONLY_OPTS`）；`find`／`sed` **在提取面、不在执行面**（仍被提取，仍以「跳过（非只读白名单
形态）」呈报——二者参数面含写盘与命令执行）。口径＝**宁可漏审不可误执行**。
**不可审计类（六类，枚举的唯一落点＝本节；判据实现见 `unauditable()`，正则族 `^(python3?|py)\\b`
——② 另接 `.*\\s-c`、③ 另接 `\\s*$`）**：
① shell 解释器／包执行器族（`bash`／`sh`／`node`／`npx`）；② 解释器任意代码入口（`python3 -c`／
`python -c`／`py -c`，`-c` 后不要求空白）；③ 裸解释器（`python3`／`python`／`py` 单命令）；④ 展开符
`$` 与反引号——**不论引号内外**一律判不可审计（引号内不是壳层保护）；⑤ 引号**外** shell 元字符
（`|`／`;`／`&`／`<`／`>`）；⑥ `sed` 非 `-n`（`sed` 已移出执行面，本项只作提前呈报）。
**子进程与宿主语义**：两处子进程（动态阶段 `report()`／核验模式 `_git_changes()`）经
`shell=True` 调用，宿主语义为「POSIX→`/bin/sh`、Windows→`cmd.exe`」（本机为后者，动态阶段历批实证
可用）；`$`／反引号／引号外元字符一律判不可审计后，两宿主的**可达命令面已是同一批简单 argv 形态**、
差异面已关闭——故不改调用方式（显式 `executable='bash'` 须另解「bash 在哪」，Windows 下
`shutil.which('bash')` 未必命中且可能是 WSL 语义）。解冻触发＝作者要求守卫行为跨宿主可复现时。
用法与参数：`python scripts/check_spec.py [--static|--verify] <规格路径> [更多规格路径...]`
  · `--static`：只跑静态检查（`check.sh` [4] 段的调用形态）；**零位置参数时打印「无在制规格，跳过」
    并退出 0**（提交时在制规格通常为 0，明示跳过属预期常态）。
  · `--verify`：核验比对（改动面声明集 ↔ `git status`、过程产物两项）；与 `--static` 互斥；
    **不进 `check.sh` 门禁**（门禁运行点在制规格尚未归档，过程产物检查必然不符）。
  · 两者都不给：先跑动态阶段，再跑静态阶段。
依赖与前置：Python 3 标准库（re／subprocess／sys／os），零外部依赖；不联网、不装依赖、不跑 LLM。
  **本工具不写任何文件**（只读规格、磁盘与白名单内的只读 git 子命令；**两处 git 子进程**——动态阶段
  `report()` 与核验模式 `_git_changes()`——统一经 `_child_env()` 置 `GIT_OPTIONAL_LOCKS=0` 并剔除 git
  注入变量，消掉 `git status`／`diff` 刷新 `.git/` 下 index 的默认写盘副作用）；语法自检用 `ast.parse`，
  不用 `py_compile`（后者会留缓存产物）。子进程输出与目标件读取统一按 UTF-8 解码并对不可解码字节容错
  （`errors='replace'`；中文 Windows 本地编码为 GBK）。
维护入口：新增断言载体形态扩 ASSERT_CMD 与 _assert_ok()；token 提取与后处理（含 token 反转义）改 _assert_refs()；检查 A 判据改 check_swallow()（**候选待办**：`_row_target_text()` 的反转义口径未统一——若规格表格与断言命令两处转义写法不一致会失配，触发＝出现实例时同口径补反转义）；检查 B 的
  对象口径词表与判据改 check_counts()／_whole_size()／WHOLE_MARKS；检查 C 判据、表头别名与方向标记
  改 check_pairs()／_change_rows()／_target_blocks()／HDR_* 与 DIR_MARKS 常量；检查 D 改
  check_writing()；新增检查 E 的判据改 check_reconcile()／BAN_SECTION／BAN_PREFIX／
  BAN_EXCUSE_MARKS／BAN_LANDING／BAN_CLAUSE_SPLIT／EXCLUDE_TOKEN；新增检查 F 的判据改
  check_ban_words()／_ban_words()／BAN_WORD_CLAUSE／BAN_WORD_RUN（**顶层第六类「检查 F」**——
  与规格正文内的子判据标签 `（F1）`／`（F2）` **不同族**：后者是某条改动的自由度子项，勿混读）；
  新增检查 G 的判据改 check_freedom()／FREEDOM_HEAD／FREEDOM_COUNT／FREEDOM_MIXED／FREEDOM_TOTAL；
  新增检查 H 的判据改 check_nuclear()／NUCLEAR_SECTION／NUCLEAR_STATES／NUCLEAR_TALLY；
  新增检查 I 的判据改 check_anchor()／ANCHOR_SECTION／ANCHOR_FILELINE／ANCHOR_FILEONLY／
  ANCHOR_BARELINE／ANCHOR_QUOTE／_anchor_probe()／_anchor_norm()；
  格数校验（F8）改 _cells()／_CELL_SPLIT／_change_rows()／_CELL_MISMATCH／_cell_mismatch_reset()；
  阶段编排、呈报前缀、空转明示与
  末尾三态判据改 static_report()；核验比对改
  verify_report()；模式分派与退出契约改 __main__；**动态阶段的执行面（族门／git 子命令参数白名单／
  展开符判据／子进程 env）改 readonly()／_git_readonly()／unauditable()／GIT_READONLY_OPTS／MUTATING／
  INJECT_ENV_***。
事故出身：见 `docs/specs/archive/065-2026-09-12-规格静态自检器搬回.md`（事故四型：020–025 六发断言自噬——
  断言吞自家 [A] 文本／对象错／计数错／恒真假绿；2026-09-07 作者裁定守卫化）；本工具由旧仓
  `scripts/check_spec_assertions.py` 移植重建为本仓形态（表格改动清单、
  `grep -c "TOKEN" FILE` 载体）。
退出契约（**须带限定词**）：**静态发现恒 0**——检查 A／B／C／D／E／F／G／H／I／J 十类无论报出多少条发现，一律只呈报、
  不影响退出码（`AGENTS.md` §五.2 候选永不拦截）。区分：`--verify` 模式的**过程产物缺失**可置退出 1
  （该模式不进 `check.sh` 门禁）；**参数错误／文件不存在 → 退出 2**；零位置参数 → 明示跳过 ＋ 退出 0。
  呈报前缀约定：非阻断发现一律 `·` 起首；`x` 起首只留给参数错误类（故源件的 `x 计数不符` 改为
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
呈报守恒：末尾三态判据计入 A／B／C／D／E／F／G／H／I／J 十类全部输出（含 B 的计数行与 **E／F／G／H／I／J** 的候选行；**E／F／G／H／I／J 的汇总行
  不计入**），「· 无发现」只在十类全空时打印。
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
    # 纵深防御（075 批 F1 ③）：git 系的写盘选项与 find／sed 的写型参数——find／sed 已移出可执行面
    # （见 readonly()），此处仍显式记名，防将来白名单误放；`--output` 与 find 的写型谓词成稿审查实证过
    r'|git\s+[^\n]*\s--output([=\s]|$)'
    r'|(^|\s)(-delete|-exec|-execdir|-fprint|-fprint0|-fprintf|-fls|-ok|-okdir)(\s|$)'
    r'|sed\s+[^\n]*-i(\s|$|[.;&|])'
)
# git 族可执行参数白名单（075 批 F1 ①）：**子命令 ＋ 参数白名单**——以 `-` 起首的实参（剥去外层引号后）
# 须落在该子命令的允许集内，否则判非只读。不用黑名单枚举：黑名单天然不完备（成稿审查实证四条通路
# 被放行并执行——`git grep -O` 走 pager 执行任意命令、`--textconv`、`git diff --ext-diff`、
# `git diff --output=FILE` 写盘 14202B）。形态：exact＝逐字命中集；prefix＝带值形态的前缀集
# （`-U<n>`／`--pretty=<fmt>`／`--untracked-files=<mode>`／`-u<mode>`）；**`-e`／`--regexp` 已移出
# `grep` 允许集**（076 批 F3 ①——取值型选项会把紧随的「`--`」当成它的**值**吃掉、其后实参仍按选项解析，
# 故 `git grep -F -e -- -O <pager> f` 原会被放行并重开 pager 面）：**允许集内已无取值型选项，故 `--`
# 必为真分隔符**，`_git_readonly()` 遇 `--` 即跳出、其后实参一律放行（076 批 F3 ②）。
_GIT_DIFF_LIKE = (('-p', '--stat', '--numstat', '--shortstat', '--name-only', '--name-status',
                   '--word-diff', '--no-index', '--oneline', '--no-color'),
                  ('-U', '--pretty='))
GIT_READONLY_OPTS = {
    'grep': (('-F', '-c', '-n', '-i', '-w', '-l', '-L', '-E', '-G', '-P',
              '--fixed-strings', '--count', '--line-number', '--ignore-case', '--word-regexp',
              '--files-with-matches', '--files-without-match', '--extended-regexp',
              '--basic-regexp', '--perl-regexp'), ()),
    'diff': _GIT_DIFF_LIKE,
    'log': _GIT_DIFF_LIKE,
    'show': _GIT_DIFF_LIKE,
    'status': (('-s', '-b', '--porcelain', '--short', '--branch', '--ignored', '--no-color'),
               ('-u', '--untracked-files=')),
}
# 子进程 env 收严的剔除面（075 批 F1 ④）：前三项拉起外部程序，后七项经窄域复核实证可注入 git 配置
# （仅置 `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=diff.external GIT_CONFIG_VALUE_0=…` 即拉起外部程序）；
# 带序号的 `GIT_CONFIG_KEY_<n>`／`GIT_CONFIG_VALUE_<n>` 按前缀剔除。
INJECT_ENV_EXACT = ('GIT_EXTERNAL_DIFF', 'GIT_PAGER', 'PAGER', 'GIT_CONFIG_COUNT',
                    'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_GLOBAL', 'GIT_CONFIG_SYSTEM',
                    'GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE')
INJECT_ENV_PREFIX = ('GIT_CONFIG_KEY_', 'GIT_CONFIG_VALUE_')


def _child_env():
    """子进程 env 收严（075 批 F1 ④）：置 `GIT_OPTIONAL_LOCKS=0`（消掉 `git status`／`diff` 刷新
    `.git/` 下 index 的默认写盘副作用）并剔除 git 注入面（`INJECT_ENV_*`——后七项可注入
    `diff.external` 之类的配置从而拉起外部程序）。**两处 git 子进程共用**：动态阶段 `report()` 与
    核验模式 `_git_changes()`（后者同样跑 `git status`，不收严则「本工具不写任何文件」在核验模式下不成立）。"""
    env = {k: v for k, v in os.environ.items()
           if k not in INJECT_ENV_EXACT and not k.startswith(INJECT_ENV_PREFIX)}
    env['GIT_OPTIONAL_LOCKS'] = '0'
    return env

# 断言节定位：**只认节名、不带位次**（位次随批次变，三／四均有）；节名容「验收断言」与旧称「验收标准」
SECTION = re.compile(r'^##[^#\n]*验收(?:标准|断言).*$', re.M)

# 静态检查阶段的节定位与识别口径（--static；只读，不执行规格内任何命令）
# 改动清单节：容错「首轮落地改动清单」等变体（061／065 实测变体）
CHANGE_SECTION = re.compile(r'^##[^#\n]*(?:首轮)?(?:落地)?文件级改动清单.*$', re.M)
# 检查 E（三方对账：改动面 ↔ 禁改面 ↔ 断言排除集；077 批 F1）的取集常量——
# 检索面 S＝`## …禁止事项…` 的**节全文**（`_section()` 取到下一个行首 `##` 止）。**不限 `- 禁止`
# 起首行**：豁免句常写在标题不含「禁止」的兄弟条目里，只取 `- 禁止` 行会漏读并产假阳性。
BAN_SECTION = re.compile(r'^##[^#\n]*禁止事项.*$', re.M)
# 判一的 P 取集：S 内**字面以斜杠结尾的独立目录 token**——两侧不得紧邻路径字符，防从
# `scripts/check.sh` 这类文件名反推出目录（实测有件因此被误判为「该目录被禁」）；
# 命中者还须 `os.path.isdir` 为真（判据见 check_reconcile()）。
NUCLEAR_SECTION = re.compile(r'^##[^#\n]*本批核销.*$', re.M)
# 检查 H（2026-09-16 加）的两侧可数结构：汇总行五档计数 ＋ 表体状态列档词。档词表即 `施工机制` §七
# 「状态取五档之一」的五值——**顺序即汇总行的书写序**（已履行｜作废｜本批处置｜仍待｜待作者）。
NUCLEAR_STATES = ('已履行', '作废', '本批处置', '仍待', '待作者')
NUCLEAR_TALLY = re.compile(
    r'已履行\s*(\d+)｜作废\s*(\d+)｜本批处置\s*(\d+)｜仍待\s*(\d+)｜待作者\s*(\d+)\s*＝\s*(\d+)')
# 检查 I（2026-09-16 加）——§一「现状锚点」节 文件:行号 ↔ 目标件实况。引文归一化见 _anchor_norm()。
ANCHOR_SECTION = re.compile(r'^##[^#\n]*现状锚点.*$', re.M)
ANCHOR_FILELINE = re.compile(r'`([^`:\s]+\.md):(\d+)`')
ANCHOR_FILEONLY = re.compile(r'`([^`:\s]+\.md)`')
ANCHOR_BARELINE = re.compile(r'`:(\d+)`')
ANCHOR_QUOTE = re.compile(r'「([^」]{6,200})」')
BAN_PREFIX = re.compile(r'(?<![\w./\-])[\w.\-]+(?:/[\w.\-]+)*/(?![\w.\-])')
# 判一的豁免判据＝**子句级双条件**（豁免词 ＋ 落点同子句）：「豁免词出现即放行」已实证在立法对象上
# 恒空转（整句含「除」即被放行），故两条件须落同一子句。
BAN_EXCUSE_MARKS = ('除', '除外', '例外', '不在禁改之列', '不在此列',
                    '只许改', '只改', '只允许', '只在', '点名')
BAN_LANDING = re.compile(r'§[一二三四五六七八九十百\d]|F\d|\[\d+\]')
# 子句切分以；，、：为界——**不含圆括号**（括号会把授权语与其落点切到两个子句里，漏读豁免）
BAN_CLAUSE_SPLIT = re.compile(r'[；，、：]')
# 判二的 E 取集：验收断言节内 `':!<path>'` 形态（本仓补集式命令的既有写法，不猜其它写法）；
# 归一化（去首尾空白与尾随斜杠）与「E 为空即跳过」见 check_reconcile()。
EXCLUDE_TOKEN = re.compile(r"':!([^']+)'")
# 检查 F（禁改面禁词 ↔ 改动清单目标文本的词面命中；089 批 F8）的取集常量——
# 述谓句形态：禁改面节内「不得把 … 搬进 skill 资产」／「不得把 … 写入 skill 资产」；**无该类句即禁词表为空**
# （此时本检查完全静默——不打汇总行、不打空转明示、输出不含「禁改面词」字样）。
# 取 `.{0,200}?` 限长非贪婪：防跨句吞并（句干只到述谓动词为止）。
BAN_WORD_CLAUSE = re.compile(r'不得把(.{0,200}?)(?:搬进|写入)\s*skill\s*资产')
# 反引号包裹的 token（路径／命令）在抽词前整体抹去：路径出现在目标文本里属**正当引用**，
# 不是「搬进禁语」——不抹去会把 `scripts/check.sh` 这类路径词当禁词报（088 成稿审查 F-02 根因）。
BAN_WORD_TICK = re.compile(r'`[^`\n]*`')
# 词组成员＝中文连串（顿号分隔组的成员）。**只认紧邻顿号者**：句干里的分类语（如「…）类的设计语言」）
# 与修饰语不紧邻顿号，不入表——过宽即噪声（判据收窄，见 089 规格 F8）。
BAN_WORD_RUN = re.compile(r'[\u4e00-\u9fff]+')
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
WHOLE_CLAIM = re.compile(r'共[\s\d,]*$')
# `wc -l` 类命令：与尺寸声称同段（同行）时，视为整件口径（命令自身不可解析为路径，故按行检测）
WC_CMD = re.compile(r'\bwc\b[^\n]{0,40}?\s-[A-Za-z]*l')
INLINE_CODE = re.compile(r'`([^`\n]+)`')
# 行首内容判据（动态阶段）：行内命令名只在「剥去列表标记／复选框后居于行首」时才视为断言抽取对象，
# 散文句中提及的命令名不抽取（形态：`- [ ] `cmd``／`1. `cmd``／裸行首跨度）
LINE_LEAD = re.compile(r'^\s*(?:[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+|\[[ xX]\]\s*)*')
# 检查 A／C 共用的表格形态判据：改动清单为 Markdown 表格，列角色按表头别名定位
TABLE_ROW = re.compile(r'^\s*\|.*\|\s*$')
TABLE_SEP = re.compile(r'^\s*\|[\s:|\-]+\|\s*$')
# 表格单元格切分（093 批 F7）：分隔符＝**未转义**竖线——负向后视排除 `\|`（转义竖线是单元格内容）
_CELL_SPLIT = re.compile(r'(?<!\\)\|')
HDR_PATH_ALIASES = ('文件', '新产品文档')
HDR_FREEDOM_ALIAS = '自由度'
HDR_CHANGE_ALIAS = '改动'
# 引号块：逐字目标文本的载体（「…」／『…』）——检查 A 的目标文本与检查 C 的核对串都取自它
QUOTE_BLOCK = re.compile(r'「([^「」\n]*)」|『([^『』\n]*)』')
# 检查 C 的**方向标记**（§二 C 行 ③，产物审查 P0-1）：单元格内出现这些标记时，逐字核对面＝
# **最后一个标记之后**的引号块（标记之前的是「现文」，改后已被移除，核之必假阳性）
DIR_MARKS = ('→', '改述为', '改为', '改作', '替换为', '换为')
FENCE_BLOCK = re.compile(r'^\s*(```|~~~)[a-zA-Z]*\s*$')
# 围栏双认（077 批 F2）：开／合围栏同认三反引号与 `~~~`——本常量（检查 D 的围栏感知）与
# `extract()` 内的 fenced 块模式（动态阶段的命令提取）**两处须同口径**；只改一处即留漏面。
# **开合须按标记字符配对**（组 1＝标记，`check_writing()` 按它开合）：写成 `(?:```|~~~)` 这类两个
# 独立分支即出错——「``` 块内一行孤立 `~~~`」会提前翻转围栏态，令其后（配对未复原时直到文件末）
# 的检查 D 预警全部失效、`extract()` 静默丢弃该块内命令（077 批曾引入的假阴性，产物审查 P1-2）。
# 检查 D：① ② 的 CommonMark 定界规则、③ 加粗引导行＋列表标记起首、④ 规格内可解析相对链接
BACKTICK_RUN = re.compile(r'`+')
BOLD_LEAD = re.compile(r'^\s*\*\*[^*\n]+\*\*\s*[：:]\s*$')
LIST_LEAD = re.compile(r'^\s*(?:[-*+]|\d+[.)])\s')
# 带 title 的链接（078 批 F2）：目标＝非空且不含空白／`)`，其后可跟**一个**由空白分隔的**引号包裹**
# title 段（只认 CommonMark 的 `"…"`／`'…'` 两种，**不得**扩认全角括号等形态）——`[x](p "t")` 形态
# 照常计数并查断链。**不得**放宽为「`)` 前可有空白」：那会把 `[x](a b)` 这类**非法**形态静默吞入
# （现形式下整条不匹配，正是该判据要拦的假阴性；本仓语料带 title 链接 0 条，故现形式下零差异）。
MD_LINK = re.compile(r'''\[[^\]\n]*\]\(([^)\s]+?)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\)''')
# 检查 D ④ 的适用面：该类判据隐含「该件会被归档」，故对**从不归档**的件不判——即 check.sh [4] 段
# 扫描集排除的那份台账（docs/specs/collab-log.md）；**历史形态保留**（该台账机制已废、文件不存在，
# 常量留作「未来同类件」的显式登记位）
NEVER_ARCHIVED = ('collab-log.md',)
# 静态检查的扫描面排除项：`施工机制.md` **不是规格**，其 §八 模板内嵌本节标题（扫之即假发现源）；
# `check.sh` [4] 段的枚举口径已排除，此处再兜一道（工具被直接喂入时亦跳过并明示）
NEVER_SCANNED = ('施工机制.md',)
# 检查 G（093 批 F22）：规格头注「自由度分布」的三种可数结构 ＋ 表头行的定位词。
# 头注形态（各批实测）：`[A]×15 [B]×6 ＋ **混合×2**（…），共 **23 行**`／`[A]×4 [B]×8（F1／…）`
FREEDOM_HEAD = re.compile(r'自由度分布')
FREEDOM_COUNT = re.compile(r'\[([ABC])\]\s*[×xX*]\s*(\d+)')
FREEDOM_MIXED = re.compile(r'混合\s*[×xX*]\s*(\d+)')
FREEDOM_TOTAL = re.compile(r'共\s*\**\s*(\d+)\s*\**\s*行')


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
    # 围栏块：开合按**同一标记字符**配对（反向引用闭合，组 1＝标记、组 2＝块内容）——写成
    # `(?:```|~~~)` 两个独立分支即出错：「``` 块内一行孤立 `~~~`」会把块从中截断，
    # 该块内的命令断言被静默丢弃（077 批 F2；产物审查 P1-2 夹具实证）
    for _marker, block in re.findall(r'(```|~~~)[a-zA-Z]*\n(.*?)\1', section, re.S):
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
    （本仓规格的断言 token 常含 `|`）。不做转义处理（够用即可）。
    **只供「引号内惰性」的元字符使用**（`|`／`;`／`&`／`<`／`>`）：壳层在引号内**仍会展开**的 `$` 与
    反引号由 `unauditable()` 直接查整条命令原文、**不经本函数**——「引号内」对二者不是壳层保护
    （075 批 F1 ② 的安全核心；写成「引号外才查」即等于没修）。"""
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
    3 裸解释器；4 **展开符 `$` 与反引号——不论引号内外一律拦**（「引号内」对二者不是壳层保护：
    `"$(cmd)"` 与引号内反引号都会被壳层展开；判据施于**整条命令原文**，不经 `_outside_quotes()`）；
    5 引号**外**的 shell 元字符 `|`／`;`／`&`／`<`／`>`（引号内确惰性，保持现口径——一律拦会把本仓
    规格里含 `|` 与括号的既有断言 token 全部降为「不可审计」而丢覆盖）；
    6 sed 非 -n（既有行为保留；`sed` 已移出执行面，故本项只作提前呈报，见 `readonly()`）。"""
    m = re.match(r'^(bash|sh|node|npx)\b', c)
    if m:
        return f'shell 解释器／包执行器 {m.group(1)}'
    if re.match(r'^(python3?|py)\b.*\s-c', c):
        return '解释器任意代码入口（-c）'
    if re.match(r'^(python3?|py)\s*$', c):
        return '裸解释器'
    if '$' in c:
        return '展开符 $（引号内外一律不可审计）'
    if '`' in c:
        return '展开符 `（引号内外一律不可审计）'
    outside = _outside_quotes(c)
    for ch in ('|', ';', '&', '<', '>'):
        if ch in outside:
            return f'引号外 shell 元字符 {ch}'
    if c.startswith('sed') and ' -n' not in c:
        return 'sed 非 -n'
    return None


def _git_readonly(c):
    """git 族：**子命令 ＋ 参数白名单**（075 批 F1 ①）。返回 False＝非只读（含未知子命令、
    集外选项、聚合短选项如 `-sb` 或 `-nO`——逐字匹配天然拒之，宁可漏审不可误执行）。
    每个以 `-` 起首的实参（**剥去外层引号后**判——`git diff "--output=F"` 经壳层剥离引号后即为选项，
    不剥即漏）须落在该子命令的允许集内；遇 `--` 即跳出循环——**`--` 之后一律放行**（其后的实参按通用
    语义是路径／模式，不是选项）。**不变量**：允许集内已无取值型选项（`-e`／`--regexp` 已移出，076 批
    F3 ①），故 `--` 必为真分隔符；若将来往允许集里加回任何**消耗实参**的选项，此「跳出」即失效（该
    选项会把 `--` 当值吃掉、其后实参仍按选项解析），届时须同步收严本判据。"""
    parts = c.split()
    if len(parts) < 2:
        return False
    spec_opts = GIT_READONLY_OPTS.get(parts[1])
    if spec_opts is None:
        return False
    exact, prefix = spec_opts
    for a in parts[2:]:
        t = a.lstrip('"\'')
        if t == '--':
            break
        if not t.startswith('-'):
            continue
        if t in exact or any(t.startswith(p) for p in prefix):
            continue
        return False
    return True


def readonly(c):
    """只读判据＝**执行面白名单**（075 批 F1 ①）。放行面＝参数面确定无副作用的族：
    `e?grep`／`fgrep`／`wc`／`head`／`tail`／`ls`／`cat` ＋ git 的 `diff`／`status`／`log`／`show`／`grep`
    （git 族按「子命令 ＋ 参数白名单」判，见 `_git_readonly()`／`GIT_READONLY_OPTS`）。
    **`find`／`sed` 不在执行面**：二者参数面含写盘与命令执行（`find` 的 `-delete`／`-exec`／`-fprint*`；
    `sed` 的脚本命令 `w`／`W`／`r`／`e` 与 `-i`），黑名单枚举天然不完备（成稿审查实证四通路）——二者
    仍在**提取面**，由本函数判否后以「跳过（非只读白名单形态）」呈报。`MUTATING` 先行拦一道（纵深防御），
    随后是族门与 git 参数门。"""
    if MUTATING.search(c):
        return False
    if re.match(r'^(e?grep|fgrep|wc|head|tail|ls|cat)\b', c):
        return True
    if c.startswith('git'):
        return _git_readonly(c)
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
    env = _child_env()      # 子进程 env 收严（F1 ④）：置 GIT_OPTIONAL_LOCKS=0 ＋ 剔除 git 注入面
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
                               env=env,
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
    """Markdown 表格行 → 单元格文本列表（去首尾竖线与每格空白）。
    **认转义竖线**（093 批 F7）：按**未转义**竖线切分（`_CELL_SPLIT` 的负向后视形态），并把切出的
    单元格内的转义竖线**还原为竖线字符**——朴素按字符切分（`s.split('|')`）会把含 `\\|` 的行切出
    多于表头的格数、令 `[A]` 落到错列，进而被 `check_pairs()` 的
    `if '[A]' not in row['freedom']: continue` **静默跳过**（091 批加粗漂移即由此漏网；盲区根因与
    补登记见 `092` §七）。收尾竖线的剥除同认转义：束尾者恰为 `\\|` 时它是**内容**、不剥。"""
    s = line.strip()
    if s.startswith('|'):
        s = s[1:]
    if s.endswith('|') and not s.endswith('\\|'):
        s = s[:-1]
    return [c.strip().replace('\\|', '|') for c in _CELL_SPLIT.split(s)]


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


# 格数校验的暂存（093 批 F8）：`_change_rows()` 判出的「格数与表头不符」行。**模块级暂存**的理由是
# 该函数的 **5 处调用点**（`:631` 附近／`:851` 附近／`:1004` 附近／`:1091` 附近／`:1240` 附近的原始
# 行序）签名与既有行为不得变更——不能增第三个返回值；**件名与行号由调用方补**（`static_report()`
# 持有规格路径，在打印周期内取 `_cell_mismatch()`）。每次 `_change_rows()` 调用起始处重置；
# `static_report()` 逐件循环起始处亦重置（无改动清单节的件不得沿用上一件的残留）。
_CELL_MISMATCH = []


def _cell_mismatch_reset():
    """清空格数校验暂存（`_change_rows()` 每次调用起始处 ＋ `static_report()` 逐件起始处调用）。"""
    del _CELL_MISMATCH[:]


def _cell_mismatch():
    """取最近一次解析周期的格数不符记录：`[(行原文, 实测格数, 表头格数)]`（只读，不清空）。"""
    return list(_CELL_MISMATCH)


def _change_rows(text):
    """解析「文件级改动清单」节内的**表格**，返回 (行列表, 跳过表数)。
    行＝{'path','change','freedom','raw'}（各自为单元格文本，缺列时为空串）。列角色按**表头别名**定位：
    路径列＝表头含「文件」或「新产品文档」者（059 的路径列在第 1 列且表头为「新产品文档」）；自由度列＝
    表头含「自由度」者（无则取末列——059／`施工机制` §八 模板形态）；改动列＝表头含「改动」者（无则取
    整行原文）。**无任何别名可识别的表整表跳过并计数**（由调用方明示），不猜列角色。
    **格数校验**（093 批 F8）：表体行的格数与表头不符者（疑似转义竖线或列数错）记入模块级
    `_CELL_MISMATCH`（**认不出也不静默**的第二道防线；件名与行号由调用方补，见该常量处的说明）。"""
    _cell_mismatch_reset()
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
            if len(cells) != len(header):
                # 格数校验（093 批 F8）：疑似转义竖线或列数错——记入暂存，件名与行号由调用方补
                _CELL_MISMATCH.append((line, len(cells), len(header)))
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
    """**检测**单元格内的**方向标记**（本函数不做切分）：返回 (是否含标记, 最后一个标记的结束位置)。无标记返回 (False, 0)。
    标记判定在**整格原文**上做（标记可能落在引号块内部——如 059 D2 的 `→`，此时其后无引号块，
    正是「不核逐字」分支要的形态）。**计数语义已在 078 批删除**（F3）：调用方（`_target_blocks()`）
    只把首元作布尔用（旧 `n` 的真假 ≡ `n ≥ 1`），故返回布尔——行为等价，逐例可核。"""
    pos, hit = 0, False
    for mark in DIR_MARKS:
        i = (cell or '').rfind(mark)
        if i != -1:
            hit = True
            pos = max(pos, i + len(mark))
    return hit, pos


def _target_blocks(cell):
    """检查 C 的逐字核对面（§二 C 行 ③）：**有方向标记**的单元格取最后一个标记**之后**的引号块
    （标记之前的是「现文」，改后已被移除，核之必假阳性）；**无方向标记**者取全部引号块（维持原口径）。
    **空引号对（`「」`）不进核验面**：取块内容按「组是否参与匹配」判定——`or` 会把空串判假后回落到
    `None`（另一分支未参与匹配），下游 `_strip_wrap()` 随即崩（066 批实跑触发）；故空块滤除、非空块照核。
    返回 (核验块列表, 标记后无引号块)；后者为真＝该行不核逐字、降为候选呈报。"""
    cell = cell or ''
    has_mark, pos = _dir_split(cell)
    blocks = [(m.start(), m.group(1) if m.group(1) is not None else m.group(2))
              for m in QUOTE_BLOCK.finditer(cell)]
    blocks = [(s, b) for s, b in blocks if b]
    if not has_mark:
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
    """载体门：两形态都认——`git grep` 须带 `-F`（或其长选项 `--fixed-strings`）与 `-c`，裸 `grep` 须带
    `-c`（计数形态）。长选项形态同认：`letters` 取法对 `--fixed-strings` 只得 `fixedstrings`，含不了 `F`，
    故另按选项串判长选项本字（075 批 F5——否则该载体被静默跳过）。"""
    opts = m.group('opts').split()
    letters = ''.join(o.lstrip('-') for o in opts)
    if 'c' not in letters:
        return False
    if m.group('cmd').startswith('git') and 'F' not in letters and '--fixed-strings' not in opts:
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
        # token 反转义（083）：规格表格／围栏内的 markdown 转义（`` \` ``／`\[`／`\]`）进入命令原文，不还原则永不命中（081 断言 12／082 断言 4 两例）；**不**反转义 `\.`／`\|`——grep BRE 中二者反转义会改语义（`\|`＝OR 操作符，裸 `|` 才是字面；`\.`＝字面点，裸 `.` 是任意符）；`\[`／`\]` 反转义前后均为字面，故安全
        refs.append((m.group('token').replace('\\`', '`').replace('\\[', '[').replace('\\]', ']'), args[-1].strip('\'"`')))
    return refs


def _read_target(path):
    """**目标件读取口径的唯一落点**（076 批 F2）：UTF-8 解码 ＋ 对不可解码字节容错（`errors` 取
    `replace`——遇二进制／非 UTF-8 件不抛 `UnicodeDecodeError`），返回该件**文本**。三处调用点共用——
    `check_swallow()`（按行计数）、`check_pairs()`（逐字命中）、`check_counts()`（字符数／行数／加粗
    标记数）：口径漂移即出自三处各写一遍（075 批只改了 `check_counts()` 一处，另两处同型崩溃面留存）。
    **行数口径＝换行符出现次数**（与 `wc -l` 一致）：调用方切行须**以 `'\\n'` 为唯一分隔**
    （`text.split('\\n')`）——**禁**用 `splitlines()`（后者额外在垂直制表符／换页符／NEL／行分隔符处
    切行，同一件会多算行）。"""
    with open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def check_swallow(text, root):
    """检查 A：断言自噬预警（只呈报，不影响退出码）。返回 (输出行列表, 提取断言数, 命中条数)。
    **hit 门**＝「该断言的目标件出现在某条 [A]／[B] 行」（表格形态判据；源件的「改动清单节内有 `###`
    子节声明目标路径」在本仓真规格上 `###` 计数恒 0 → 恒空转，故改此判据）：[A]／[B] 行的目标文本＝
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
            content = _read_target(path)
            # 行计数＝换行符出现次数（`'\n'` 为唯一分隔符，与 `wc -l` 同口径；**禁** `splitlines()`，
            # 它会在垂直制表符／换页符等处额外切行——076 批 F2 把读法收进 `_read_target()`）
            cur = sum(1 for line in content.split('\n') if token in line)
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
    做法，标记须前置，否则同一紧邻段里**另一条**声称的「全文」会把本声称误判为整件口径）、或**紧邻段
    左界**含「共 … 行」式声称（`WHOLE_CLAIM` 为**左界形**——「共」起首、其间容空白与数字与千分位逗号、
    至行尾止；仍施于 `head`：「共 100 行」的 `head` 止于「共 」即命中，而同一紧邻段里**另一条**声称的
    「共」不在其 `head` 末尾则不命中，左界纪律不破）、
    或量词为「字符」（字符量词本身即整件口径）、或该行与 `wc -l` 类命令同段。
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
    **对象口径**（改写自源件的词形黑名单——实测仅抑制 1／7 条假阳性）：只改判据层——「用件」
    判据（本批改动清单节内提及者记「基线漂移」、否则记「计数不符」）与源件同；尺寸声称的识别由词形
    黑名单改为**对象口径**（仅当该数字之前的紧邻文本显式指向整件尺寸时才判，见 _whole_size()），其余
    降为候选——只计数、不逐条呈报（四类已知假阳性：表行数／diff 增量／零命中数／引用行号）。两类输出
    皆只呈报、不置退出码。
    **实测值口径**（075 批）：目标件读取按 UTF-8 ＋ `errors='replace'`（遇二进制／非 UTF-8 件不抛
    `UnicodeDecodeError`，与模块头注的容错口径一致，本批 F12）；行数＝该件 `'\\n'` 出现次数（与
    `wc -l` 同口径：末行无换行者不多算 1，本批 F3）；`char`／`line`／**加粗标记数**三项一次读入缓存，
    「处」的实测值取缓存第三项（不再按目标件另读一次，本批 F11 收敛 073-1 的遗留）。"""
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
                # 容错读（076 批 F2）：二进制／非 UTF-8 件不抛 UnicodeDecodeError（目标件可能是任意
                # 被引用件）；读口径统一在 `_read_target()`（本处原为就地容错读，075 批 F12）
                content = _read_target(_abs(target, root))
                # 三元组＝（字符数／行数／加粗标记数）：行数与 `wc -l` 同口径（`'\n'` 计数，F3）；
                # 加粗标记数一次读入即缓存，「处」的实测值取第三项（F11，收敛 073-1 的「另读一次」）
                cache[target] = (len(content), content.count('\n'), content.count('**'))
            nchar, nline, nbold = cache[target]
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
                    # 值取缓存第三项（加粗标记数，随字符数／行数一次读入即算，不再按目标件另读一次——
                    # F11 收敛 073-1 的遗留：原二元组只存字符数与行数，故另读一次取标记计数）
                    actual = nbold
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
    实文里是裸反引号——不归一则这类条目在已完工件上恒报假阳性（050 批五处实测）。另剥加粗标记（规格 A 级行惯以加粗标改动词、实文不含，不剥即恒报未落实假阳性——101 批 F1 行实例）。"""
    s = s.strip().replace('\\`', '`')
    # 剥加粗标记（规格 A 级行的 `**` 系强调记法、非目标文本；不剥即恒报「未落实」，101 批 F1 行实例）
    s = s.replace('**', '')
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
            # 容错读（076 批 F2）：本处原为裸读（容错解码参数缺位），引用二进制目标件时同型
            # `UnicodeDecodeError` 残留；读口径统一在 `_read_target()`
            cache[path] = _read_target(path)
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
    围栏块内的行一律不判（块内不是行内代码，也不是链接）；**围栏开合按标记字符配对**（三反引号与
    `~~~` 各自成对，见 FENCE_BLOCK）——「``` 块内一行孤立 `~~~`」不得提前翻转围栏态，否则该件
    其余预警连带失效（077 批 F2；产物审查 P1-2 夹具实证）。"""
    src = text.splitlines()
    spec_dir = os.path.dirname(os.path.abspath(spec))
    arch_dir = os.path.join(root, 'docs/specs/archive')
    archivable = os.path.basename(spec) not in NEVER_ARCHIVED
    lines = []
    in_fence = None     # 当前围栏标记字符（None＝不在围栏内）；开合按**同一标记字符**配对
    for i, line in enumerate(src, 1):
        fm = FENCE_BLOCK.match(line)
        if fm:
            mark = fm.group(1)[0]       # 标记字符（` 或 ~）；只按字符配对，不按长度
            if in_fence is None:
                in_fence = mark
            elif in_fence == mark:
                in_fence = None
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


def check_nuclear(text, root):
    """检查 H（2026-09-16 加）：规格 §七「本批核销」表的**汇总行 ↔ 表体状态列**逐格对账。
    返回 **(候选行列表, 汇总行列表)**——口径同检查 E／F／G：候选行由调用方并入末尾三态判据、汇总行只进
    逐件打印串（**不计入**）；**候选非阻断、恒不置红**。

    **判据**：两侧都是**可数结构**。表体侧＝该节表格每行「状态」列内的档词（五档：已履行／作废／本批处置／
    仍待／待作者）；汇总侧＝`NUCLEAR_TALLY` 命中的五个计数与总数。逐档比对，不符即出候选。
    **另判「五档外状态词」**：状态列既不含五档任一者即出候选（该格是档位错写／自由措辞——本仓实例：
    规划方曾写「不适用」，而 `施工机制` §七 明定「状态取五档之一」）。
    **静默条件（硬）**：无 §七 核销节、或节内无数出状态列的表格 ⇒ **完全不输出**（连汇总行都不打——
    防误报的判据落在字面上）。表体有行而汇总行缺失 ⇒ 出候选（有表无账属真不自洽）。
    事故出身：2026-09-16 规划方在 `099` 两轮审查与 `100` 首轮**三次同型**写错该汇总行（表体改了而汇总
    未跟着重算／档位计错），三次都靠审查方逐行点数才发现——本条把它机械化。本检查不读写磁盘。"""
    sec = _section(text, NUCLEAR_SECTION)
    if not sec:
        return [], []
    tally = None
    t_lines = sec.split('\n')
    for ln in t_lines:
        m = NUCLEAR_TALLY.search(ln)
        if m:
            tally = [int(x) for x in m.groups()]
            break
    rows = []
    for ln in t_lines:
        if not ln.lstrip().startswith('|'):
            continue
        cells = _cells(ln)
        if len(cells) < 3:
            continue
        rows.append(cells)
    if tally is None and not rows:
        return [], []
    counts = {k: 0 for k in NUCLEAR_STATES}
    outside = []
    for cells in rows:
        if all(c.strip(' -*') == '' for c in cells):
            continue
        head = cells[0].strip()
        st = cells[2].replace('*', '').strip()
        if head.startswith('来源') or set(st) <= set('-: '):
            continue                      # 表头行与分隔行
        hit = next((k for k in NUCLEAR_STATES if k in st), None)
        if hit is None:
            outside.append(f'· 检查 H 五档外状态词: {st[:30]}（表头行「{head[:20]}」）')
        else:
            counts[hit] += 1
    diffs = []
    if tally is None:
        diffs.append('汇总行缺失')
        declared = None
    else:
        declared = dict(zip(NUCLEAR_STATES, tally[:5]))
        for k in NUCLEAR_STATES:
            if declared[k] != counts[k]:
                diffs.append(f'{k} 汇总 {declared[k]} ≠ 表体 {counts[k]}')
        if tally[5] != len(rows) - _nuclear_nonbody(rows):
            diffs.append(f'总数 汇总 {tally[5]} ≠ 表体 {len(rows) - _nuclear_nonbody(rows)}')
    def fmt(d):
        return '｜'.join(f'{k} {d[k] if d else "缺"}' for k in NUCLEAR_STATES)
    cands = list(outside)
    if diffs:
        cands.append('· 检查 H 核销表汇总与表体不符: '
                     + ('汇总行缺失；' if tally is None else f'汇总 {fmt(declared)}；')
                     + f'表体 {fmt(counts)}（' + '；'.join(diffs) + '）')
    summary = (f'· 检查 H 汇总: 汇总行 {fmt(declared)}｜表体 {fmt(counts)}｜'
               f'五档外 {len(outside)} 项｜不符 {len(diffs)} 项')
    return cands, [summary]


def _nuclear_nonbody(rows):
    """核销表里**非数据行**的条数（表头 + 分隔行）——总数据仅比数据行。"""
    n = 0
    for cells in rows:
        head = cells[0].strip()
        st = cells[2].replace('*', '').strip() if len(cells) > 2 else ''
        if head.startswith('来源') or (st and set(st) <= set('-: ')):
            n += 1
    return n


def _anchor_norm(s):
    """锚点比对用的归一化：剥 markdown 定界（反引号与 *）与空白——规格引文常带 ** 强调标记
    而目标件正文没有，逐字比对会假阳性（100 批审查实证）。"""
    return re.sub(r'[`*\s]', '', s)


def _anchor_probe(path, ln, quotes, root, seen, cands):
    """单点核验一处 `path:ln`：行号实存、非空行、且该行±3 内含规格引文（「…」）。
    引文不在附近时**全件搜索定位真行**——产出「实际在第 X 行」的可操作候选；全件无命中则报
    「未在目标件出现」（§一 按定义只述现状，不该引目标文本）。路径不实存者静默跳过（示例串
    不产噪声）。"""
    full = os.path.normpath(os.path.join(root, path))
    if not os.path.isfile(full):
        return
    key = (path, ln)
    with open(full, encoding='utf-8', errors='replace') as f:
        lines = f.read().split('\n')
    if ln > len(lines):
        if key not in seen:
            seen.add(key)
            cands.append(f'· 检查 I 锚点行号超出文件: {path}:{ln}（该件实有 {len(lines)} 行）')
        return
    if not lines[ln - 1].strip() and key not in seen:
        seen.add(key)
        cands.append(f'· 检查 I 锚点指向空行: {path}:{ln}')
    norm_lines = [_anchor_norm(x) for x in lines]
    for q in quotes:
        nq = _anchor_norm(q)
        # 省略号分段：规格引文常用「…」缩略（如「卷数按标尺派生区间回填——…」）——按 … 切段，
        # 每段（≥6 字）须同现于该行才算命中；无 ≥6 字段者按整串处理。
        parts = [p for p in nq.split('…') if len(p) >= 6] or [nq]
        if len(nq) < 6:
            continue
        if all(any(p in x for x in norm_lines[max(0, ln - 4):ln + 3]) for p in parts):
            continue
        hit = next((k + 1 for k, v in enumerate(norm_lines)
                    if all(p in v for p in parts)), None)
        if hit is not None:
            cands.append(f'· 检查 I 锚点漂移: {path}:{ln} 的引文实际在第 {hit} 行——「{q[:24]}」')
        else:
            cands.append(f'· 检查 I 引文未在目标件出现: {path}:{ln}——「{q[:24]}」（§一 应只述现状）')


def check_anchor(text, root):
    """检查 I（2026-09-16 加）：§一「现状锚点」节的 文件:行号 引用 ↔ 目标件实况核对。
    返回 **(候选行列表, 汇总行列表)**——口径同 E／F／G／H：候选并入 `extra`（非阻断、恒不置红），
    汇总行只打印。

    **只扫 §一**：该节按定义只述**现状**（现行原文），引文可与磁盘逐字比对；§二 F 行引述
    混合现状与目标文本，不在此核（扩展位＝出现 F 行锚点过时的事故后再议）。
    **判据**：① 行号超出目标件实有行数 ② 行号指向空行 ③ 该行±3 内不含规格引文——引文在
    全件他处命中时报**实际行号**（可直接改规格），全件无命中时报「未在目标件出现」。
    引文取「…」形、归一化剥 ` 与 * 后比对（见 `_anchor_norm`）；不足 6 字者跳过（过短易伪命中）。
    同行先出现的完整 `路径.md` 为其后裸 `:行号` 建立文件上下文；围栏块内不判。
    无 §一 节 ⇒ **完全静默**（连汇总行都不打——不误报的判据落在字面上）。
    事故出身：`098`／`099`／`100` 三批成稿审查的锚点 P0 族——`100`-P0-1 为**全表行号系前批
    落地前旧号**（直接引发规格整体重写＋再一轮窄域复核，两轮 subagent 合计约 3.4M token）；
    `099`-P0-4／`098`-P0-4 同型单点。本检查把该族从「独立上下文重测发现」前移到「送审前机器候选」。"""
    sec = _section(text, ANCHOR_SECTION)
    if not sec:
        return [], []
    cands, seen, refs = [], set(), 0
    in_fence = False
    for raw in sec.split('\n'):
        if FENCE_BLOCK.match(raw):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        quotes = ANCHOR_QUOTE.findall(raw)
        ctx = None
        for m in ANCHOR_FILELINE.finditer(raw):
            refs += 1
            ctx = m.group(1)
            _anchor_probe(ctx, int(m.group(2)), quotes, root, seen, cands)
        if ctx is None:
            mo = ANCHOR_FILEONLY.search(raw)
            if mo:
                ctx = mo.group(1)
        if ctx:
            for mb in ANCHOR_BARELINE.finditer(raw):
                refs += 1
                _anchor_probe(ctx, int(mb.group(1)), quotes, root, seen, cands)
    true_n = len(cands)     # 截断前的真实异常数（外审现场实测抓的潜伏缺陷：截断后再取 len 恒为 16）
    if len(cands) > 15:
        cands = cands[:15] + [f'· 检查 I 另有 {true_n - 15} 条（截断显示）']
    return cands, [f'· 检查 I 汇总: 锚点引用 {refs} 处｜异常 {true_n} 项']


# 检查 J（2026-09-16 加）——在制规格的「九、审查记录」节**存在性**与 findings 条目**N 对账**。
# 节定位判据与检查 I 同口径：取「标题行以两个井号起、正文含『审查记录』」的节——**节号是否＝「九」交人判**。
ARCHIVE_RECORD_SECTION = re.compile(r'^##[^#\n]*审查记录.*$', re.M)
# 「findings 共 N」的载体形态：**容加粗**（归档实测有「共」与数字间插 `**` 的写法，如 `共**11**`）；
# N 位取「数字串（容千分位逗号）」或「花括号变量」（后者＝非数字占位，另判）。
RECORD_FINDINGS = re.compile(r'findings\s*(?:\*\*)?\s*共\s*(?:\*\*)?\s*(\{[^}\n]{0,20}\}|\d[\d,]{0,6})')
RECORD_PLACEHOLDER = re.compile(r'findings|共')
# 档位计数：`P0`／`P1`／`P2` 与紧随的**首个**数字（中间容 `:`／空白／加粗标记等非数字字符）；
# 窗口＝本条「findings 共 N」之后至该行行末（**禁整节求和**——在制规格常有多条审查记录）。
RECORD_TIER = re.compile(r'(P0|P1|P2)[^\d\n]{0,6}(\d+)')


def check_archive_record(text, root):
    """检查 J（2026-09-16 加）：在制规格的「审查记录」节**存在性**与 findings 条目**N 对账**。
    返回 **(候选行列表, 汇总行列表)**——口径同 E／F／G／H／I：候选行由调用方并入 `extra`（⇒ 计入末尾
    三态 `findings`）、汇总行只进逐件打印串（**不计入**）；**候选非阻断、恒不置红**。

    **判据**：节定位＝「标题行以两个井号起、正文含『审查记录』」的节（`ARCHIVE_RECORD_SECTION`）；
    **机检只判该节存在性与 N 对账，节号是否＝「九」交人判**。① 无该节 → 报候选；② 节内无
    `findings` 与「共」的匹配 → 报候选「留占位符」（**容加粗形态**）；③ 数字位为花括号变量
    （非数字占位）→ 报候选「非数字占位」；④ **逐条对账**：逐「findings 共 N」匹配各自取 N，与其后
    **窗口内**各档位计数之和比对（**禁整节求和**——在制规格常有多条审查记录），N ≠ 各档位之和 → 报候选。
    **窗口口径**：本条命中处至该行行末（档位数取各档位**首个**数字——「P0-1／P1-2」类条目号不二次计数；
    故一条记录内同一档位写两个数字时只认首个——**宁漏报不误报**，多档位写法（P0:2 P1:5 P2:4）不受影响）。

    **静默条件（硬）**：无该节者**完全静默**（连汇总行都不打——不误报的判据落在字面上）。
    事故出身：`091`／`095`／`096`／`097` 四件审查记录节**实质未填**（节内无任何「findings 共 ＋
    数字」），此前无机械面可查；`施工机制` §三 过程产物两项已立「审查记录须同批落」（本批 F5）。
    本检查不读写磁盘（核对面取自规格文本本身，`root` 只作签名一致）。"""
    sec = _section(text, ARCHIVE_RECORD_SECTION)
    if not sec:
        return [], []
    cands, hits = [], list(RECORD_FINDINGS.finditer(sec))
    if not hits:
        if RECORD_PLACEHOLDER.search(sec):
            cands.append('· 检查 J 审查记录留占位符: 节内无「findings 共 N」数字行（占位符未填）')
        else:
            cands.append('· 检查 J 审查记录留占位符: 节内无 findings 计数行（节存在而无内容）')
    labels, diffs = [], 0
    for m in hits:
        raw = m.group(1)
        line_end = sec.find('\n', m.start())
        win = sec[m.end():line_end if line_end != -1 else len(sec)]
        got = {k: None for k in ('P0', 'P1', 'P2')}
        for k, v in RECORD_TIER.findall(win):
            if got[k] is None:
                got[k] = int(v)
        if raw.startswith('{'):
            cands.append(f'· 检查 J 非数字占位: findings 共 {raw}（规格模板形态？模板以花括号变量记位）')
            labels.append(raw)
            diffs += 1
            continue
        n = int(raw.replace(',', ''))
        s = sum(v for v in got.values() if v is not None)
        labels.append(f'{n}：' + ' '.join(f'{k}:{got[k] if got[k] is not None else "-"}'
                                        for k in ('P0', 'P1', 'P2')))
        if n != s:
            diffs += 1
            cands.append(f'· 检查 J 审查记录 N 与档位不符: findings 共 {n} ≠ 各档位之和 {s}'
                         f'（P0:{got["P0"]} P1:{got["P1"]} P2:{got["P2"]}）')
    summary = (f'· 检查 J 汇总: 条目 {len(hits)} 条｜N 与档位不符 {diffs} 条｜'
               f'声明 {"、".join(labels) if labels else "无"}')
    return cands, [summary]



def check_reconcile(text, root):
    """检查 E：三方对账（改动面 ↔ 禁改面 ↔ 断言排除集；只呈报，不影响退出码）。
    返回 **(候选行列表, 汇总行列表)**——候选行由调用方并入末尾三态判据（`findings`），
    汇总行**只进逐件打印串、不计入**（角色同「· B：判定 …」明示行）。

    **发射面**（078 批 F1 收口）：对「含文件级改动清单节**且** C ≠ ∅」的件产 候选行 ＋ 汇总行；
    对「有该节**且有改动行**、而 C ＝ ∅」的件产**一行空转明示**（同候选行计入 `findings`——观测缺口
    的可见化）；无该节的件 候选／汇总／空转**皆不输出**（完全静默——「跳过」的可见化落点由汇总行与
    空转明示承担，不逐件另打明示行——实测 16／19 件无补集式断言，逐件明示即 51 行噪声）。

    **C（改动面）取集**：全部改动行的路径单元格内**逐个**路径 token 判实存，取实存者为改动件。
    **不复用 `_row_target_file()`**——后者只返回首个 token，而实测有 3 行的路径列含 ≥2 个实存
    token（066／074／076 各一行），复用即漏判。

    **判一（禁改面未豁免）**：检索面 S＝`BAN_SECTION` 所定的**全节文本**（不限 `- 禁止` 起首行）；
    P＝S 内字面以斜杠结尾的独立目录 token（`BAN_PREFIX`，不认从文件名反推的目录）且实存为目录者；
    对**命中前缀**（`x` 以某 `p` ＋斜杠起首）的每件 `x`，**按子句**（`BAN_CLAUSE_SPLIT` 切分 S，
    不含圆括号）判豁免——存在一个子句同时含 ① 豁免词（`BAN_EXCUSE_MARKS`）与 ② 落点（该件全路径
    或基名／`§N`／`FN`／`[N]`）→ 已豁免；否则出候选行。P 为空或无 S 时不产候选行（适用面不成立）。
    **在册的漏报方向**：写出「除…外」而实质无点名者本判不报（宁可漏报，见规格 §八 3）。

    **判二（断言排除集缺）**：E＝验收断言节内 `':!<path>'` 形态（`EXCLUDE_TOKEN`）的路径集
    （归一化＝去首尾空白与尾随斜杠）；**E 为空即跳过**（实测 19 件有验收节的语料中仅 3 件有此
    形态，逐件报即纯噪声。**取舍为有意**——信号由汇总行「跳过：无补集式断言」字段逐件承载（人据此判不需要或忘写），不另产候选行）；否则对每件 `x ∈ C`，无 `e ∈ E` 使 `x == e` 或以 `e` ＋斜杠起首者
    → 出候选行（列缺项件名）；汇总行记其**缺项件数**（字段名 `判二缺`——078 批 F1 由旧名
    `判二命中` 改名，**取值不变**）。"""
    rows, _skipped = _change_rows(text)
    targets = []
    for row in rows:
        for t in PATH_TOKEN.findall(row['path'] or ''):
            if t not in targets and os.path.isfile(_abs(t, root)):
                targets.append(t)
    targets.sort()
    if not targets:
        # 空转明示（078 批 F1）：只对「有改动清单节**且有改动行**、而 C ＝ ∅」的件产一行（该行同候选行
        # **计入** `findings`）；无该节者仍**完全静默**——逐件明示即刷屏（见函数头注「发射面」）。
        if rows:
            return [f'· 对账① 空转: 有改动行 {len(rows)} 行而无可解析实存件——对账未判'], []
        return [], []       # 无改动清单节：候选与汇总皆不输出（完全静默）
    cands = []
    ban = _section(text, BAN_SECTION)
    no_ban = 1 if not ban.strip() else 0
    applicable = 0      # 判一**命中前缀**的件数（无论是否豁免；078 批 F1）
    if not no_ban:
        prefixes = {m.rstrip('/') for m in BAN_PREFIX.findall(ban)
                    if os.path.isdir(_abs(m.rstrip('/'), root))}
        clauses = BAN_CLAUSE_SPLIT.split(ban)
        for x in targets:
            if not any(x.startswith(p + '/') for p in prefixes):
                continue
            applicable += 1
            excused = any(any(w in c for w in BAN_EXCUSE_MARKS)
                          and (x in c or os.path.basename(x) in c or BAN_LANDING.search(c))
                          for c in clauses)
            if not excused:
                cands.append(f'· 对账① 禁改面未豁免: {x}')
    excludes = {e.strip().rstrip('/')
                for e in EXCLUDE_TOKEN.findall(_section(text, SECTION))}
    excludes = {e for e in excludes if e}
    no_exc = 1 if not excludes else 0
    missing = []
    if excludes:
        missing = [x for x in targets
                   if not any(x == e or x.startswith(e + '/') for e in excludes)]
        if missing:
            cands.append(f'· 对账① 断言排除集缺 {len(missing)} 件: ' + '、'.join(missing))
    # 汇总行四项计数（078 批 F1 口径收口）：改动行＝该件改动清单**表体行数** M（非路径 token 数——
    # 059 实测 33 行而可解析仅 3 件）；可解析＝C 的件数 N；判一适用＝**命中禁改面前缀**的件数 K
    # （无论是否豁免；**出候选**的件数不另计——即本判「禁改面未豁免」候选行的条数）；
    # 判二缺＝断言排除集**缺项**件数 P（旧字段 `判二命中` 之值，**只改名不改值**，不得读作「已覆盖」）。
    summary = (f'· 对账① 汇总: 改动行 {len(rows)} 行｜可解析 {len(targets)} 件｜'
               f'判一适用 {applicable} 件｜判二缺 {len(missing)} 件｜'
               f'跳过：无禁改面句 {no_ban}｜无补集式断言 {no_exc}')
    return cands, [summary]


def _ban_words(ban):
    """检查 F 的禁词表：禁改面节内「不得把 … 搬进／写入 skill 资产」述谓句中的**顿号分隔中文词组**各成员。
    三步取法：① 抹去反引号包裹的 token（路径／命令，BAN_WORD_TICK）；② 在句干内取中文连串；
    ③ 只留**紧邻顿号**者（顿号分隔组的成员判据——分类语与修饰语不紧邻顿号，不入表）。
    无该类句返回空表（调用方据此**完全静默**）。"""
    words = []
    for m in BAN_WORD_CLAUSE.finditer(BAN_WORD_TICK.sub(' ', ban)):
        span = m.group(1)
        runs = [(r.start(), r.end(), r.group(0)) for r in BAN_WORD_RUN.finditer(span)]
        for i, (s, e, w) in enumerate(runs):
            before = span[runs[i - 1][1]:s] if i else span[:s]
            after = span[e:runs[i + 1][0]] if i + 1 < len(runs) else span[e:]
            if ('、' in before or '、' in after) and w not in words:
                words.append(w)
    return words


def check_ban_words(text, root):
    """检查 F：禁改面禁词 ↔ 改动清单**目标侧引号块**的词面命中（候选非阻断；089 批 F8）。
    返回 **(候选行列表, 汇总行列表)**——口径同检查 E（`check_reconcile()`）：候选行由调用方并入末尾
    三态判据，汇总行只进逐件打印串、**不计入**。

    **判据**：禁词表 W＝`BAN_SECTION` 节内的顿号分隔中文词组（`_ban_words()`）；核对面＝§二 改动清单
    各行的**目标侧引号块**（`_target_blocks()`——**不读整行**：位置列含路径，读整行必误报）。
    命中即呈报候选行「禁改面词 {w} 出现在改动行 {N}」（N＝清单表体行的 1 起序）。
    **分工**：与检查 E 的判一（按**目录前缀**判禁改面未豁免）互补不重叠——本条按**词面**，判的是
    「该词被搬进目标文本」，非「该件落在禁改目录下」。
    **本检查＝顶层第六类「检查 F」**，与规格正文内的子判据标签 `（F1）`／`（F2）` **不同族**（后者是
    某条改动的自由度子项），勿混读。
    **静默条件（硬）**：W ＝ ∅ ⇒ **完全不输出**（不打汇总行、不打空转明示，屏面不含「禁改面词」字样
    ——不误报的判据落在字面上，多打一行即假红）。
    返回值恒为候选／汇总行：静态发现一律只呈报、不影响退出码（`root` 只作仓根基准，本检查不读写磁盘
    ——核对面取自规格文本本身）。"""
    ban = _section(text, BAN_SECTION)
    words = _ban_words(ban) if ban.strip() else []
    if not words:
        return [], []
    rows, _skipped = _change_rows(text)
    checked = 0
    cands = []
    for i, row in enumerate(rows, 1):
        blocks, _no_block = _target_blocks(row['change'])
        if not blocks:
            continue    # 无目标侧引号块的行不进核对面（读整行必误报，见头注「判据」）
        checked += 1
        blob = '\n'.join(blocks)
        for w in words:
            if w in blob:
                cands.append(f'· 检查 F 禁改面词 {w} 出现在改动行 {i}')
    summary = (f'· 检查 F 汇总: 禁改面词 {len(words)} 个｜核对改动行 {checked} 行｜'
               f'命中 {len(cands)} 条')
    return cands, [summary]


def check_freedom(text, root):
    """检查 G（093 批 F22）：规格头注「自由度分布」↔ §二 改动清单**自由度列**的逐行统计。
    返回 **(候选行列表, 汇总行列表)**——口径同检查 E／F：候选行由调用方并入末尾三态判据、汇总行只进
    逐件打印串（**不计入**）；**候选非阻断、恒不置红**（`AGENTS.md` §五.2），退出契约不受影响。

    **判据**：两侧都是**可数结构**。头注侧＝`FREEDOM_HEAD` 所在行内的 `[A]×n`／`[B]×m`／`混合×k`／
    `共 N 行` 四种结构（`FREEDOM_*` 常量；`共 N 行` 与清单**表体行数**比对，缺写者标 `未写` 并**只比
    已给出的项**）；清单侧＝§二 各表体行自由度单元格内 `[A]`／`[B]` 的**并存**情形——两者皆含者计入
    「混合」，只含其一者计入该侧，两者皆无者只进总行数（`[C]` 行不属 A／B 两侧，故由 `共 N 行` 兜住）。
    **混合×k 缺写＝按 0 比**：只声明 `[A]×n [B]×m` 而清单内实有 `[A]／[B]` 并存行者即出候选——该族
    缺陷本仓第五次复发才机械化（`测试与验收标准` §4 G22）。
    **静默条件（硬）**：头注无「自由度分布」行 ⇒ **完全不输出**（连汇总行都不打——防误报的判据落在
    字面上）；有改动清单节而**一行表体行都解析不出**者仍出候选（两侧无法对账，属真不自洽）。
    本检查不读写磁盘（核对面取自规格文本本身，`root` 只作签名一致）。"""
    head = next((l for l in text.split('\n') if FREEDOM_HEAD.search(l)), '')
    if not head:
        return [], []
    declared = {k: int(v) for k, v in FREEDOM_COUNT.findall(head)}
    m_mixed = FREEDOM_MIXED.search(head)
    m_total = FREEDOM_TOTAL.search(head)
    d_mixed = int(m_mixed.group(1)) if m_mixed else None
    d_total = int(m_total.group(1)) if m_total else None
    rows, _skipped = _change_rows(text)
    c_a = c_b = c_mixed = 0
    for row in rows:
        cell = row['freedom'] or ''
        has_a, has_b = '[A]' in cell, '[B]' in cell
        if has_a and has_b:
            c_mixed += 1
        elif has_a:
            c_a += 1
        elif has_b:
            c_b += 1

    def fmt(a, b, k, t):
        return f'[A]×{a} [B]×{b} 混合×{k} 共 {t} 行'

    def show(v):
        return v if v is not None else '未写'

    head_s = fmt(declared.get('A', '未写'), declared.get('B', '未写'), show(d_mixed), show(d_total))
    list_s = fmt(c_a, c_b, c_mixed, len(rows))
    diffs = []
    for name, d, c in (('[A]', declared.get('A'), c_a), ('[B]', declared.get('B'), c_b),
                       ('混合', d_mixed if d_mixed is not None else 0, c_mixed),
                       ('共 N 行', d_total, len(rows))):
        if d is not None and d != c:
            diffs.append(f'{name} 头注 {d} ≠ 清单 {c}')
    cands = []
    if diffs:
        cands.append(f'· 检查 G 头注「自由度分布」与改动清单不符: 头注 {head_s}；清单 {list_s}'
                     f'（' + '；'.join(diffs) + '）')
    summary = (f'· 检查 G 汇总: 头注 {head_s}｜清单 {list_s}｜'
               f'不符 {len(diffs)} 项')
    return cands, [summary]


def static_report(specs, root):
    """静态检查阶段编排：打印 == 静态自检 == 与逐项结果。
    **返回值恒为 False**：静态发现（A／B／C／D／E／F／G／H／I／J 十类）一律只呈报、不置退出码（差异⑤：源件对
    「计数不符」置 1，本仓改为恒 0——`AGENTS.md` §五.2 候选永不拦截）。
    末尾三态判据**须计入 A／B／C／D／E／F／G／H／I／J 十类全部输出**（含 B 的计数行、C 的候选行与 E／F／G 的
    候选行、F8 的格数不符行、**J 的审查记录核对**候选行；**E／F／G／H／I／J 的汇总行不计入**——其角色同明示行）：「· 无发现」只在十类
    全空时打印——漏计 B 即假绿（产物审查 P0-2：B 单源时「计数不符」与「无发现」同屏）。
    空转明示：A 在「提取 N＞0 而命中 0」时打印明示行（并抑制「· 无发现」，两者不同屏）；B 在无可判定
    声称时打印明示行；C 在存在「有核对面但路径未解析」的行时打印计数行。"""
    print('== 静态自检 ==')
    swallow = []
    extra = []      # 检查 C／D／E／F／G／H／I／J 候选与 F8 格数不符输出（非阻断；末尾三态判据须计入，不得被「无发现」掩盖）
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
        _cell_mismatch_reset()    # 格数校验暂存（093 批 F8）：逐件起始处清空，不沿用上一件残留
        a_lines, extracted, hits = check_swallow(text, root)
        count_lines, judged, cand = check_counts(text, root)
        c_lines = check_pairs(text, root)
        d_lines = check_writing(text, spec, root)
        # 检查 E（077 批 F1）：两列表分岔——候选行并入 `extra`（⇒ 计入末尾三态 `findings`），
        # 汇总行只进下方的逐件打印串（**不计入**——漏计则三态少计，多计则计数行多于屏上明细）。
        e_lines, e_summary = check_reconcile(text, root)
        # 检查 F（089 批 F8）：口径同 E（候选并入 `extra`、汇总只打印）；禁词表为空时**两表皆空**，
        # 该件在屏上完全静默（不打汇总、不打空转明示）——这是「不误报」判据的落点。
        f_lines, f_summary = check_ban_words(text, root)
        # 检查 G（093 批 F22）：口径同 E／F（候选并入 `extra`、汇总只打印）；头注无「自由度分布」行时
        # **两表皆空**，该件在屏上完全静默（不误报的判据落在字面上）。
        g_lines, g_summary = check_freedom(text, root)
        # 检查 H（2026-09-16 加）：口径同 E／F／G（候选并入 `extra`、汇总只打印）；无 §七 核销节、
        # 或节内数不出状态列时**两表皆空**，该件对该项完全静默（不误报的判据落在字面上）。
        h_lines, h_summary = check_nuclear(text, root)
        # 检查 I（2026-09-16 加）：口径同 H（候选并入 `extra`、汇总只打印）；无 §一 现状锚点节时
        # 两表皆空，该件对该项完全静默（不误报的判据落在字面上）。
        i_lines, i_summary = check_anchor(text, root)
        # 检查 J（2026-09-16 加）：口径同 H／I（候选并入 `extra`、汇总只打印）；无「审查记录」节时
        # 两表皆空，该件对该项完全静默（不误报的判据落在字面上）。
        j_lines, j_summary = check_archive_record(text, root)
        swallow += a_lines
        extra += c_lines + d_lines + e_lines + f_lines + g_lines + h_lines + i_lines + j_lines
        counts += count_lines
        a_extract += extracted
        a_hit += hits
        b_judged += judged
        b_cand += cand
        for line in (a_lines + c_lines + d_lines + count_lines + e_lines + e_summary
                      + f_lines + f_summary + g_lines + g_summary + h_lines + h_summary
                      + i_lines + i_summary + j_lines + j_summary):
            print(line)
        # 格数校验（093 批 F8）：`_change_rows()` 判出的「格数与表头不符」行——**件名与行号在此补**
        # （该函数只入参 text、无件名上下文，且 5 处调用点的签名与既有行为不得变更）；行号按行原文在
        # 本件文本内的**首个**出现位置取（表内重复行取首现，仍是可检索的定位符）。
        # 101 批 F26：行收集进 `cell_lines` 并并入 `extra`（计数入末尾三态）——修前系裸 print，
        # 漏计则「· 有预警 N 条」少计、屏上发现行多于计数行（与本循环上方 `extra = []` 起始处
        # 的既有注释相悖的潜伏缺陷，本批订正）。
        txt_lines = text.splitlines()
        cell_lines = []
        for raw, n_cells, n_head in _cell_mismatch():
            ln = txt_lines.index(raw) + 1 if raw in txt_lines else 0
            cell_lines.append(f'· 格数与表头不符（疑似转义竖线或列数错）: {spec}:{ln} 实测 {n_cells} 格／'
                              f'表头 {n_head} 格 | {raw.strip()[:60]}')
        extra += cell_lines
        for _line in cell_lines:
            print(_line)
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
        # 中性汇总行（哨兵型／归零型不可区分态）与检查 B／C／D／E 输出同为发现项：计入本行，不落「无发现」
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
    """中文 Windows 下 stdout／stderr 默认 GBK，打印含 ⏎／中文的输出会 UnicodeEncodeError（2026-09-11
    实测；`x` 起首的参数错误类输出走 stderr，只重配 stdout 则其中文仍可能崩）。两流各自 try／except：
    某流不可 reconfigure（如已被替换为无该方法的对象）不影响另一流。"""
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass


def _git_changes(root):
    """`git status --porcelain` 的实际改动集（只读子命令）；返回 [(状态码, 正斜杠相对路径)]，
    重命名形态「旧 -> 新」取新路径。以 `-c core.quotepath=false` 调用：默认 quotepath 会把含
    非 ASCII 的路径按 C 风格转义并加引号（本仓规格文件名含中文），不关掉则路径无法归一比对。
    子进程 env 同 `report()` 收严（见 `_child_env()`，F1 ④——`git status` 默认会刷新 `.git/` 下 index）。"""
    r = subprocess.run('git -c core.quotepath=false status --porcelain', shell=True,
                       capture_output=True, encoding='utf-8', errors='replace',
                       env=_child_env(),
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
