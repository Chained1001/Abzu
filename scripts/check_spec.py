"""规格静态自检器（开发工具，按需运行；供规划方在规格送审前机械检出十类规格缺陷）。

事故出身与历次裁定：见 `CHANGELOG.md` 对应条目与 `docs/specs/archive/` 各批规格。行内不写批号——事故与沿革记 `CHANGELOG` 与 git 历史，指认归档规格用全路径。

用途：对照模板核对格做**静态**检查（不执行规格内任何命令，只读规格与磁盘）——十类：

- **检查 A** 断言自我匹配预警：断言 token 被自家 `[A]`／`[B]` 行的目标文本吞掉；另有「零命中待复核」「零命中核对未判」「计算方式不可判」三种明示行。
- **检查 B** 计数实跑重算：规格内「整件尺寸」声称与实测的差。
- **检查 C** `[A]` 项目标文本的逐字落实核对：比对取「目标件原文 ∪ 去加粗视图」并集，未命中者追加「疑现状侧引文」成因诊断。
- **检查 D** 规格写作机械检查四项：嵌套反引号／代码跨度边缘空格／加粗引导行紧跟列表／规格内可解析相对链接。
- **检查 E** 三方核对（改动文件 ↔ 禁改文件 ↔ 断言排除集）＋需同步更新的文件核对＋模式判定核对——按改动清单实算简单／标准／全量并与头注比对（**声明高于实算＝作者升档、合法不报；低于实算才报**）。
- **检查 H** 逐条确认表汇总核对（§七 汇总行 ↔ 表体状态列）＋仍待项找不到对应核对。
- **检查 I** 位置对源核对：§一 现状位置 ↔ 目标件实况；另有 §二 改动清单**位置格**腿（格内 `路径:行号` 的越界与空行）。
- **检查 J** 审查记录核对（§九 审查记录节 ↔ 发现的问题各档之和）＋开放项清单归到哪条规则核对＋§九 成本字段核对。
- **检查 K** 规格模板节名 ↔ **有模板对应**的工具正则（防「模板改了工具没跟上」的静默失效；其余四个 `*_SECTION` 入白名单）。
- **检查 M** §四 规格自审**留痕表**核对：节在则核表形态、表头含「项」与「判定」、**每格非空非占位**（§四 节缺失→静默；**无汇总行**）。

十类一律非阻断（`AGENTS.md` §五.2 候选永不拦截）。

用法与参数：`python scripts/check_spec.py --static|--verify|--reconcile <规格路径> [更多规格路径...]`

  · `--static`：只跑静态检查（`check.sh` [4] 段的调用形态）；**零位置参数时打印「无在制规格，跳过」并退出 0**（提交时在制规格通常为 0，属预期常态）。
  · `--verify`：核验比对（改动文件声明集 ↔ 实盘改动、过程产物两项）；**不进 `check.sh`**。
  · `--reconcile`：实盘改动 ↔ 规格声明面（核验第 1 步的件级机械化）。
  · 三者互斥；都不给时按 `--static` 跑。

依赖与前置：Python 3 标准库（os／re／sys）；零外部依赖，不联网、不装依赖、不跑 LLM。**本工具不写任何文件**（只读规格与磁盘）；语法自检用 `ast.parse`，不用 `py_compile`（后者会留缓存产物）。目标件读取统一按 UTF-8 解码并对不可解码字节容错（`errors='replace'`）。

维护入口：新增断言载体形态扩 ASSERT_CMD 与 _assert_ok()；token 提取与后处理改 _assert_refs()；检查 A 改 check_swallow()；检查 B 改 check_counts()／_whole_size()／WHOLE_MARKS；检查 C 改 check_pairs()／_change_rows()／_target_blocks()／HDR_* 与 DIR_MARKS，其成因诊断改 _out_of_scope_texts()／_out_of_scope_hit()／_rel_key；检查 D 改 check_writing()；检查 E 改 check_reconcile()／BAN_SECTION／BAN_PREFIX／BAN_EXCUSE_MARKS／BAN_LANDING／BAN_CLAUSE_SPLIT／EXCLUDE_TOKEN；检查 H 改 check_nuclear()／NUCLEAR_*，仍待项与开放项两条改 _item_anchors()／_ledger_text()／OPEN_*／LEDGER_*；检查 I 改 check_anchor()／ANCHOR_*／_anchor_probe()／_anchor_norm()／CHANGE_POS／_change_position_probe()；检查 J 改 check_archive_record()／ARCHIVE_RECORD_SECTION／RECORD_*／_cost_field_cands()／COST_FIELDS；检查 M 改 check_audit()／AUDIT_SECTION／AUDIT_HEADERS；格数校验改 _cells()／_CELL_SPLIT／_change_rows()／_CELL_MISMATCH；阶段编排改 static_report()；核验比对改 verify_report()；模式分派与退出契约改 __main__。

退出契约（**须带限定词**）：**静态发现恒 0**——十类无论报出多少条发现，一律只呈报、不影响退出码。区分：`--verify` 的**过程产物缺失**或**git 不可用**（改动面未核）均可置退出 1（该模式不进 `check.sh`）；**参数错误／文件不存在 → 退出 2**；零位置参数 → 明示跳过 ＋ 退出 0。呈报前缀约定：非阻断发现一律 `·` 起首；`x` 起首只留给参数错误类。

载体形态说明：① 断言载体两种形态都认——`git grep -F -c -- "TOKEN" FILE` 与 `grep -c "TOKEN" FILE`（token 取引号内、目标取末参）；② 改动清单为**表格**形态，列角色按表头别名定位（路径列＝表头含「文件」或「新产品文档」；改动列＝表头含「改动」），无别名可识别者整表跳过并明示；③ 检查 B 用**对象计算方式**判定标准（仅当数字之前的紧邻文本显式指向整件尺寸、或与 `wc -l` 类命令同段时才判）；④ 检查 C 的逐字判定标准只对**含引号块**的 `[A]` 行生效，且单元格内有**方向标记**时只核**最后一个标记之后**的引号块。

呈报守恒：末尾三种结果判定标准计入十类全部输出（含 B 的计数行、**E／H／I／J／K／M 的候选行**与 §二 位置格候选行；**E／H／I／J／K 的汇总行不计入**——检查 M 无汇总行），「· 无发现」只在十类全空时打印。

已知限制（债跟主题走——不再另立缺口清单）：
  ① 检查 B（计数重算）在归档语料上误报偏高；若长期无真阳性，评估删除。
  ② 检查 D 的 ①②③ 与 `check.sh [1]` 段 markdownlint 默认集重复（仅 ④ 为独有面）。
  ③ `--verify`／`--reconcile` 未进 `check.sh`（是否纳入提交前自动检查另议）。
  ④ git 不可用时，`--verify` 已改为 stderr 明示 ＋ 置退出 1（残留：声明面不可核，仍需人工过）。
  ⑤ 相对路径按 cwd 归一：非仓根 cwd 调用时「本件」排除会失配。
  ⑥ 每条规格都全量读 `docs/specs`（O(N×1.9MB)）——文件数增长后需加缓存或收窄扫描面。
  ⑦ 各 `*_SECTION` 正则**硬编码节名**——换项目复用机架时须逐条改代码（本条为已知限制，非预立法）。
  ⑧ `skills/{skill 名}/scripts/*.py` 不在任何检查面内（`check.sh [5]` 与 `check_content` 皆不扫）。
  ⑨ 检查 I 的「引文未在目标件出现」不区分**预期陈旧**（目标件已被后续批改动）与真异常（现已在文案内提示，但仍需人判）。
  ⑩ 检查 K 是**单向核**——只核「模板有节名而工具不认」；模板**新增**节名而工具正则本就宽泛时不报。
  ⑪ 检查 M 只核留痕表「非空非占位」，**不核格内是否属实**（填假值仍会通过，由审查位独立实跑逮）；也不核「表行数 ↔ 标题条数」（须解析中文数字，且该形态无事故出身）。
  ⑫ 检查 I 的 §二 腿**只判越界与空行**，不核「行号所指处是否真是那句现状」（§二 现状侧多为描述性散文，逐字核成片误报）。
"""
import os
import re
import subprocess
import sys


# 断言节定位：**只认节名、不带位次**（位次随批次变，三／四均有）；节名容「验收断言」与旧称「验收标准」
SECTION = re.compile(r'^##[^#\n]*验收(?:标准|断言).*$', re.M)
# 静态检查阶段的节定位与识别计算方式（--static；只读，不执行规格内任何命令）
# 改动清单节：容错「首轮落地改动清单」等变体（061／065 实测变体）
CHANGE_SECTION = re.compile(r'^##[^#\n]*(?:首轮)?(?:落地)?(?:文件级)?改动清单.*$', re.M)
# 检查 E（三方核对：改动文件 ↔ 禁改文件 ↔ 断言排除集）的取集常量——
# 检索面 S＝`## …禁止事项…` 的**节全文**（`_section()` 取到下一个行首 `##` 止）。**不限 `- 禁止`
# 起首行**：豁免句常写在标题不含「禁止」的兄弟条目里，只取 `- 禁止` 行会漏读并产误报。
BAN_SECTION = re.compile(r'^##[^#\n]*禁止事项.*$', re.M)
# 判一的 P 取集：S 内**字面以斜杠结尾的独立目录 token**——两侧不得紧邻路径字符，防从
# `scripts/check.sh` 这类文件名反推出目录（实测有件因此被误判为「该目录被禁」）；
# 命中者还须 `os.path.isdir` 为真（判定标准见 check_reconcile()）。
NUCLEAR_SECTION = re.compile(r'^##[^#\n]*(?:本批核销|本批逐条确认).*$', re.M)
# 检查 H（2026-09-16 加）的两侧可数结构：汇总行五档计数 ＋ 表体状态列档词。档词表即 `施工机制` §七
# 「状态取五档之一」的五值——**顺序即汇总行的书写序**（已履行｜作废｜本批处置｜仍待｜待作者）。
NUCLEAR_STATES = ('已履行', '作废', '本批处置', '仍待', '待作者')
NUCLEAR_TALLY = re.compile(
    r'已履行\s*(\d+)｜作废\s*(\d+)｜本批处置\s*(\d+)｜仍待\s*(\d+)｜待作者\s*(\d+)\s*＝\s*(\d+)')
# 检查 I（2026-09-16 加）——§一「现状位置」节 文件:行号 ↔ 目标件实况。引文归一化见 _anchor_norm()。
ANCHOR_SECTION = re.compile(r'^##[^#\n]*(?:现状锚点|现状位置).*$', re.M)
ANCHOR_FILELINE = re.compile(r'`([^`:\s]+\.md):(\d+)`')
ANCHOR_FILEONLY = re.compile(r'`([^`:\s]+\.md)`')
ANCHOR_BARELINE = re.compile(r'`:(\d+)`')
ANCHOR_QUOTE = re.compile(r'「([^」]{6,200})」')
BAN_PREFIX = re.compile(r'(?<![\w./\-])[\w.\-]+(?:/[\w.\-]+)*/(?![\w.\-])')
# 判一的豁免判定标准＝**子句级双条件**（豁免词 ＋ 写入位置同子句）：「豁免词出现即放行」已实证在立法对象上
# 恒空跑（整句含「除」即被放行），故两条件须落同一子句。
BAN_EXCUSE_MARKS = ('除', '除外', '例外', '不在禁改之列', '不在此列',
                    '只许改', '只改', '只允许', '只在', '点名')
BAN_LANDING = re.compile(r'§[一二三四五六七八九十百\d]|F\d|\[\d+\]')
# 子句切分以；，、：为界——**不含圆括号**（括号会把授权语与其写入位置切到两个子句里，漏读豁免）
BAN_CLAUSE_SPLIT = re.compile(r'[；，、：]')
# 判二的 E 取集：验收断言节内 `':!<path>'` 形态（本仓补集式命令的既有写法，不猜其它写法）；
# 归一化（去首尾空白与尾随斜杠）与「E 为空即跳过」见 check_reconcile()。
EXCLUDE_TOKEN = re.compile(r"':!([^']+)'")
# 断言载体两形态：`git grep -F -c -- "TOKEN" FILE` 与 `grep -c "TOKEN" FILE`
# （token 取引号内、目标取末参；选项顺序容错）
ASSERT_CMD = re.compile(
    r'''(?<![\w-])(?P<cmd>git\s+grep|grep)\b(?P<opts>(?:\s+-{1,2}[^\s"']+)*)'''
    r'''(?:\s+--)?\s+(?P<q>["'])(?P<token>.*?)(?P=q)\s+(?P<args>[^\n]*)'''
)
# 路径样 token 判定标准：形如 [\w./-]+\.(md|js|sh|py|json|jsonc) 的裸串，且作为仓根相对路径存在于磁盘
# （不以「含 /」为必要条件——否则 AGENTS.md／README.md／CHANGELOG.md 等根级文件永不被命中）
PATH_TOKEN = re.compile(r'[\w./-]+\.(?:jsonc|json|md|js|sh|py)(?![\w])|scripts/hooks/[\w.-]+')
# 计数声称：N 容错千分位逗号；量词覆盖「字符」与「行」＋「处」（072 按类扩，对象计算方式限死为**加粗标记
# 计数**，见 _whole_size()）；「条」／「项」／「个」不扩（对象随文件类型而异，计算方式不唯一，
# 见 G2——已拆入脚本注释）
# 左界否定环视：数字前紧邻字母/数字者不视为尺寸声称（如「MD034 行」「G1 行」的编号被读成行数）
CLAIM = re.compile(r'(?<![A-Za-z0-9])(\d[\d,]*)\s*(字符|行|处)')
# 限额标记：紧邻 N 之前的这类标记表明该数字是限额（如「条目 ≤ 400 字符」）而非实测尺寸，不计
LIMIT_MARKS = ('≤', '≥', '<', '>', '最多', '上限', '不少于', '以内', '以上',
               '至少', '至多', '不超过')
# 检查 B 的对象计算方式词表（仅当紧邻段显式指向整件尺寸时才判；「实件」为语料真阳性用词，须入表）：
# 全文／本件／实件／总行数／共 N 行／N 字符（字符量词由 CLAIM 的 unit 直接判为整件计算方式）
WHOLE_MARKS = ('全文', '本件', '实件', '总行数')
WHOLE_CLAIM = re.compile(r'共[\s\d,]*$')
# `wc -l` 类命令：与尺寸声称同段（同行）时，视为整件计算方式（命令自身不可解析为路径，故按行检测）
WC_CMD = re.compile(r'\bwc\b[^\n]{0,40}?\s-[A-Za-z]*l')
INLINE_CODE = re.compile(r'`([^`\n]+)`')
# 检查 A／C 共用的表格形态判定标准：改动清单为 Markdown 表格，列角色按表头别名定位
TABLE_ROW = re.compile(r'^\s*\|.*\|\s*$')
TABLE_SEP = re.compile(r'^\s*\|[\s:|\-]+\|\s*$')
# 表格单元格切分（093 批 F7）：分隔符＝**未转义**竖线——负向后视排除 `\|`（转义竖线是单元格内容）
_CELL_SPLIT = re.compile(r'(?<!\\)\|')
HDR_PATH_ALIASES = ('文件', '新产品文档')
HDR_FREEDOM_ALIAS = ('可自定程度', '自由度')
HDR_CHANGE_ALIAS = '改动'
# 引号块：逐字目标文本的载体（「…」／『…』）——检查 A 的目标文本与检查 C 的核对串都取自它
QUOTE_BLOCK = re.compile(r'「([^「」\n]*)」|『([^『』\n]*)』')
# 检查 C 的**方向标记**（§二 C 行 ③，产物审查 P0-1）：单元格内出现这些标记时，逐字核对面＝
# **最后一个标记之后**的引号块（标记之前的是「现文」，改后已被移除，核之必误报）
DIR_MARKS = ('→', '改述为', '改为', '改作', '替换为', '换为')
FENCE_BLOCK = re.compile(r'^\s*(```|~~~)[a-zA-Z]*\s*$')
# 围栏双认：开／合围栏同认三反引号与 `~~~`（本常量服务检查 D 的围栏感知）。
# **开合须按标记字符配对**（组 1＝标记，`check_writing()` 与 `check_anchor()` 按它开合）：写成
# `(?:```|~~~)` 这类两个独立分支即出错——「``` 块内一行孤立 `~~~`」会提前翻转围栏态，令其后
# （配对未复原时直到文件末）的检查预警全部失效（曾引入的假阴性，产物审查 P1-2）。
# 检查 D：① ② 的 CommonMark 定界规则、③ 加粗引导行＋列表标记起首、④ 规格内可解析相对链接
BACKTICK_RUN = re.compile(r'`+')
BOLD_LEAD = re.compile(r'^\s*\*\*[^*\n]+\*\*\s*[：:]\s*$')
LIST_LEAD = re.compile(r'^\s*(?:[-*+]|\d+[.)])\s')
# 带 title 的链接（078 批 F2）：目标＝非空且不含空白／`)`，其后可跟**一个**由空白分隔的**引号包裹**
# title 段（只认 CommonMark 的 `"…"`／`'…'` 两种，**不得**扩认全角括号等形态）——`[x](p "t")` 形态
# 照常计数并查找不到对应。**不得**放宽为「`)` 前可有空白」：那会把 `[x](a b)` 这类**非法**形态静默吞入
# （现形式下整条不匹配，正是该判定标准要拦的假阴性；本仓语料带 title 链接 0 条，故现形式下零差异）。
MD_LINK = re.compile(r'''\[[^\]\n]*\]\(([^)\s]+?)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\)''')
# 检查 D ④ 的适用面：该类判定标准隐含「该件会被归档」，故对**从不归档**的件不判——即 check.sh [4] 段
# 扫描集排除的那份清单（docs/specs/collab-log.md）；**历史形态保留**（该清单机制已废、文件不存在，
# 常量留作「未来同类件」的显式登记位）
NEVER_ARCHIVED = ('collab-log.md',)
# 静态检查的扫描面排除项：`施工机制.md` **不是规格**，其 §八 模板内嵌本节标题（扫之即假发现源）；
# `check.sh` [4] 段的枚举计算方式已排除，此处再兜一道（工具被直接喂入时亦跳过并明示）
NEVER_SCANNED = ('施工机制.md',)


def repo_root():
    """静态阶段的路径解析基准：脚本所在仓库根（循本件 __file__ 推导）；定位失败返回 None。"""
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
    `if '[A]' not in row['freedom']: continue` **静默跳过**（091 批加粗不符即由此漏网；盲区根因与
    已在台账登记）。收尾竖线的剥除同认转义：束尾者恰为 `\\|` 时它是**内容**、不剥。"""
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
    路径列＝表头含「文件」或「新产品文档」者（早期规格的路径列在第 1 列且表头为「新产品文档」）；可自定程度列＝
    表头含「可自定程度」或旧称「自由度」者（**双读**——本字段供检查 A／C 判 `[A]`／`[B]` 行用；
    无该列时取末列）；改动列＝表头含「改动」者（无则取
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
                       if any(a in c for a in HDR_FREEDOM_ALIAS)), None)
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
    （066 批产物审查 F-02／F-05）。故取值按「组是否参与匹配」并滤除空块，与 `_target_blocks()` 同计算方式。"""
    blocks = [m.group(1) if m.group(1) is not None else m.group(2)
              for m in QUOTE_BLOCK.finditer(cell or '')]
    return [b for b in blocks if b]


def _dir_split(cell):
    """**检测**单元格内的**方向标记**（本函数不做切分）：返回 (是否含标记, 最后一个标记的结束位置)。无标记返回 (False, 0)。
    标记判定在**整格原文**上做（标记可能落在引号块内部——如首轮规格里的 `→`，此时其后无引号块，
    正是「不核逐字」分支要的形态）。**计数语义已删除**：调用方（`_target_blocks()`）
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
    （标记之前的是「现文」，改后已被移除，核之必误报）；**无方向标记**者取全部引号块（维持原计算方式）。
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
    """**目标件读取计算方式的唯一写入位置**：UTF-8 解码 ＋ 对不可解码字节容错（`errors` 取
    `replace`——遇二进制／非 UTF-8 件不抛 `UnicodeDecodeError`），返回该件**文本**。三处调用点共用——
    `check_swallow()`（按行计数）、`check_pairs()`（逐字命中）、`check_counts()`（字符数／行数／加粗
    标记数）：计算方式不符即出自三处各写一遍（075 批只改了 `check_counts()` 一处，另两处同型崩溃面留存）。
    **行数计算方式＝换行符出现次数**（与 `wc -l` 一致）：调用方切行须**以 `'\\n'` 为唯一分隔**
    （`text.split('\\n')`）——**禁**用 `splitlines()`（后者额外在垂直制表符／换页符／NEL／行分隔符处
    切行，同一件会多算行）。**目标件消失即跳过（G40 处置，2026-09-17 开发侧重构）**：件被删／不可读
    时返回空串、不抛栈（空串的计数为 0——相关断言只能报「现行为 0」类候选，由人工判断；抛栈则整段
    `[4]` 崩溃判为失败，比候选更糟）。事故出处：原 G40 三批旧账（该件已拆）＋重构批量删除标准件后
    「非真实场景」成为真实场景。"""
    try:
        with open(path, encoding='utf-8', errors='replace') as f:
            return f.read()
    except OSError:
        return ''


# 改动文件外件集的**去加粗视图**缓存：进程内一次建、跨行跨块复用（`read once` 计算方式见
# `check_pairs()` docstring ③）；键＝`(仓根, 本件相对路径)`——**排除面随本件而变**，故缓存键须含本件
# （同一进程内逐件扫描时，不把上一件的排除结果串给下一件）；值为 [(仓根相对路径, 去加粗文本), …]。
_OUT_SCOPE_CACHE = {}


def _out_of_scope_texts(root, spec=None):
    """**改动文件外件集**（`docs/specs/**/*.md` 中**非本件**者，含 `archive/`）的**去加粗**文本视图。

    用途：`check_pairs()` 对**未命中目标件**的引号块做**成因诊断**——命中本件集者标「疑现状侧引文」。
    实现计算方式：① 件集＝`docs/specs/**/*.md` **减去本件**（`spec` 传本件路径，按**仓根相对正斜杠形态**归一
    比对；未传＝不排除，供不关心本件的调用）；② 只读盘、不跑 git、不联网（守卫零外部依赖）；③ **一次读盘
    即缓存**（`_OUT_SCOPE_CACHE`，键＝`(仓根, 本件相对路径)`，进程内复用）；④ 逐件读用裸 `open` ＋ 宽
    except 兜住——读完即弃、异常件跳过，漏一个既有件只影响**诊断完备性**、不影响「未落实」这条事实面
    （故单件不可读时不得使全判定标准崩溃，`G40` 同族风险）。
    返回 [(仓根相对路径, 去加粗文本), …]。"""
    self_rel = _rel_key(spec, root) if spec else ''
    key = (root, self_rel)
    cached = _OUT_SCOPE_CACHE.get(key)
    if cached is not None:
        return cached
    spec_dir = os.path.join(root, 'docs', 'specs')
    out = []
    for dirpath, _dirnames, filenames in os.walk(spec_dir):
        for name in filenames:
            if not name.endswith('.md'):
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace('\\', '/')
            if self_rel and rel == self_rel:    # 非本件（明文：件集＝docs/specs/**/*.md 减本件）
                continue
            try:
                with open(full, encoding='utf-8', errors='replace') as f:
                    out.append((rel, f.read().replace('**', '')))
            except OSError:
                continue
    _OUT_SCOPE_CACHE[key] = out
    return out


def _rel_key(path, root):
    """路径 → **仓根相对、正斜杠**的比对键（件集排除判定标准）。空串入空串。
    规格路径可能是仓根相对（`docs/specs/…`）也可能是绝对（测试样例调用），故先按根归一；`os.walk` 给出的
    相对路径与本键**同计算方式**，两侧可直接 `==`（不按文件名或非 ASCII 正则比对——后者在中文 Windows 上
    会因 `os.walk()` 文件名的代理转义而静默失配）。"""
    if not path:
        return ''
    return os.path.relpath(path, root).replace('\\', '/')


def _out_of_scope_hit(piece, root, spec=None):
    """该引号块是否在**改动文件外件集**中命中（成因诊断判定标准）。命中 ⇒ True。
    `spec`＝本件路径（透传给 `_out_of_scope_texts()` 作**减本件**排除，F3 明文计算方式）。

    **措辞纪律**：命中只说明「同样的串在改动文件外的件里存在」，成因（现状侧旧文／巧合复用）**待判**——
    调用方文案取「疑现状侧引文…成因待判」，不得冒充确定结论（机械判定标准只报候选，`AGENTS.md` §五.2）。"""
    return any(piece in txt for _rel, txt in _out_of_scope_texts(root, spec))


def check_swallow(text, root):
    """检查 A：断言自我匹配预警（只呈报，不影响退出码）。返回 (输出行列表, 提取断言数, 命中条数)。
    **hit 门**＝「该断言的目标件出现在某条 [A]／[B] 行」（表格形态判定标准；源件的「改动清单节内有 `###`
    子节声明目标路径」在本仓真规格上 `###` 计数恒 0 → 恒空跑，故改此判定标准）：[A]／[B] 行的目标文本＝
    该行引号块内容优先、缺则取「改动」单元格全文（见 _row_target_text()）——**`[B]` 行的「目标文本内」含
    改动说明文字，故近似预测为上限**；n＝目标文本内 token 出现次数，cur＝目标件当前含 token 的行数。
    提取数＞0 而命中 0 时，由 static_report() 打印空跑明示行（与「· 无发现」不得同屏）。
    **零命中待复核**（F2）：对**通过 hit 门**且**目标件实存**（os.path.isfile）的断言，在其命令所在行起
    （**含本行**）其后 4 行的窗口内解析「期望 ≥N」（正则容 `各`／`依次`／`均` 前缀与 `**` 星号修饰，故
    `期望各 ≥1`／`期望依次 ≥1` 一并认）——N ≥ 1 而 cur == 0 时报候选行。两个前提缺一不可：
    hit 门不过或目标件不存在者 cur 恒 0，会把「目标件被解析成垃圾」的断言误报成永久候选；N == 0 不报
    （「期望 0」型零命中即达成）。**判定标准只认「字面 token」**：cur 系字面子串计数（`token in line`），而
    载体允许 `grep -c -E "…"` 形态——token 带正则元字符时 cur 恒 0，属误报，故仅当 token 的字符**全部
    落在字面集**（字母／数字／汉字／`_`／`-`／`/`／`／`／空格）内才判，含字面集外字符（`.`／`|`／`^` 等）
    者一律跳过该判、不报（保守方向：宁可漏报不可误报）。**三种结果取数（109 F2）**：上述字面计算方式对**含正则元
    字符的 token 恒得 0**，而原实现仍把它当「现行为 0」报出（该出口对这类 token 恒假阳）——现按 token 形态
    分三支：① **`^` 起首**者剥去该前导锚后按**行首字面**计数（`line.startswith(rest)`），该子集与 grep 的
    **BRE** 行为一致、可严格等价判定；② 剥锚后**仍含 BRE 真正特殊字符**（`. * [ \\ ^ $` 及其反斜杠形态
    `\\( \\) \\{ \\} \\| \\+ \\?`；**裸 `( ) + ? { }` 与裸竖线在 BRE 里是字面、归支③**——「竖线在 BRE 里是
    字面」正是否决「按 `re` 解释 token」的理由）者 ⇒ **不可判**：不进「目标文本未提及且现行为 0」出口，改出
    明示行 `· 计算方式不可判（token 含正则元字符，现行计数未测）: {token} @ {target}`（非候选语义的发现项，须计入
    末尾三种结果）；③ 其余维持字面计数（现状计算方式）。该谓词**不复用 `literal_token`**（其类目与全角括号相抵，
    `G14`／`G27` 同族）；「零命中待复核」门改用**归一后** token（即 `^` 已剥者按字面判）。**取数面＝「期望」子句，按下列先后取数**
    （顺序即计算方式，不得颠倒）：① 取子句内数字**有序列表** `nums`（自首个「期望」出现处起，止于 `；`／
    `。`／`（预验`／行尾——尾数不计；**不得用 `set`**）；② `len(nums)` 等于本规格提取到的断言总数 `M`
    ＝`len(refs)` 时，取 `nums[i]`（`i`＝该断言在 `refs` 中的序号，**0 基**）——该形态要求**每个数字各对
    一条命令**，故不做「全同」要求、也不按分配型词面跳过；③ `len(nums) != M` 且该行是**分配型句**
    （命令序数分配 `第一命令`／`第二、三命令`／「各命令」／「分别」）→ **不判**；④ `len(nums) != M` 且
    子句数字**全同** → 取该值；⑤ 其余（`len(nums) != M` 且不全同）→ **不再静默**，产
    「· 零命中核对未判（期望子句多值 …，与命令无法对齐）」候选行（`nums` 按出现顺序列举）。
    故 `期望 ≥1；预验起点 0。` 判得 1（尾数不计）；`期望：**≥1**／**0**／**0**` 为 K≠M 且不全同 →
    走 ⑤ 产未判候选行；`第一命令期望 ≥1（…）；第二、三命令期望 0` 为分配型 →
    走 ③ 不判（数字无法与命令对齐；「分配型＋全同」的既有误报不得复活）。配对支路依赖「数字序＝命令序」
    ——**写反即静默误配**（缓解＝断言写法第 9 条，见 `施工机制` §二 规格条）。「零命中待复核」与「零命中核对未判」两行
    均须计入 static_report() 的末尾三种结果判定标准（发现的问题）。
    n == 0 的两种情形均不锁定单义（(cur, n) 二元分辨不出「哨兵型保留／[A]／[B] 项目标文本漏写」与
    「归零型已达成」）：cur > 0 者计入一行中性汇总；cur == 0 者打中性行。预测行（cur + n 加法预测）
    只在 cur > 0 且 n > 0 时输出：cur == 0 时不存在既有命中可被替换吞掉，加法预测无对象。"""
    a_rows = [r for r in _change_rows(text)[0]
              if '[A]' in r['freedom'] or '[B]' in r['freedom']]
    refs = _assert_refs(text)
    # 零命中待复核的行位置数据不在 _assert_refs() 的既有返回面内（不动其返回语义）：本函数内以
    # ASSERT_CMD 复扫取行号——过滤判定标准与 _assert_refs() 同源，两份列表逐项对齐。
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
    # 子句终点＝；／。／（预验／行尾——本仓期望行普遍带「；预验起点 N」尾，按整行取数会把尾数计入而静默
    distrib_re = re.compile(r'第[一二三四五六七八九十百\d]+'
                            r'(?:\s*[、，,／/]\s*[一二三四五六七八九十百\d]+)*\s*命令')
    expect_stops = ('；', '。', '（预验')
    # 字面 token 判定标准（见 docstring）：\w 即字母／数字／汉字／下划线，另容 - 与两种斜杠、空格
    literal_token = re.compile(r'^[\w/\uFF0F\- ]+$')
    # BRE「不可判」谓词（109 F2）：**不复用 `literal_token`**——后者类目与全角括号相抵（「现存 48 件（…）」
    # 过不了该门，见 `G14`），且本谓词判的是「含 ASCII 正则元字符」而非「是否字面集内」。收窄到 **BRE 里
    # 真正特殊**的字符：`. * [ \ ^ $` 与反斜杠形态 `\(`／`\)`／`\{`／`\}`／`\|`／`\+`／`\?`——裸 `( ) + ? { }`
    # 与**裸竖线 `|`** 在 BRE 里是字面（`|` 尤须收窄：`^| G42 |` 剥锚后归字面计数分支，不得出「计算方式不可判」）。
    bre_meta = re.compile(r'[.*\[\\^$]|\\[(){}|+?]')
    lines = []
    neutral = 0
    hits = 0
    for i, ((token, target), line_no) in enumerate(zip(refs, located)):
        path = _abs(target, root)
        exists = os.path.isfile(path)
        # 归一化 token（109 F2）：`^` 前导锚剥一层后供按行首计数与「零命中待复核」门共用（避免两处各剥一次）
        norm = token[1:] if token.startswith('^') else token
        cur = 0
        countable = True
        if exists:
            content = _read_target(path)
            # 行计数＝换行符出现次数（`'\n'` 为唯一分隔符，与 `wc -l` 同计算方式；**禁** `splitlines()`，
            # 它会在垂直制表符／换页符等处额外切行——读法收进 `_read_target()`）
            if token.startswith('^'):
                # 分支①（109 F2）：`^` 起首者剥去该前导锚后**按行首字面计数**——该子集与 grep 的 BRE 行为
                # 一致，故可严格等价判定（`^` 之外的元字符仍走分支②）
                if bre_meta.search(norm):
                    countable = False
                else:
                    cur = sum(1 for line in content.split('\n') if line.startswith(norm))
            elif bre_meta.search(token):
                # 分支②（109 F2）：token 含 BRE 真正特殊的元字符 ⇒ 字面计数计算方式测不出「现行」值，
                # 标「不可判」、**不进**「目标文本未提及且现行为 0」出口（原出口对这类 token 恒假阳，
                # 位置③④；静默跳过又会让「未测」与「测了为 0」同形，见 §六 否决项）
                countable = False
            else:
                # 分支③：其余维持字面计数（现状计算方式，不改）
                cur = sum(1 for line in content.split('\n') if token in line)
        hit = [r for r in a_rows if _row_mentions(r, target)]
        if not hit:
            lines.append(f'· 跳过（目标件不出现在任何改动行）: {token} @ {target}')
            continue
        hits += 1
        n = sum(_row_target_text(r).count(token) for r in hit)
        if not countable:
            lines.append(f'· 计算方式不可判（token 含正则元字符，现行计数未测）: {token} @ {target}')
        elif n == 0:
            if cur > 0:
                # 哨兵型 token（到位＝现状，目标文本本不必提及）与归零型已达成同形：计入中性汇总，不单义锁定
                neutral += 1
            else:
                lines.append(f'· 目标文本未提及且现行为 0: {token} @ {target}'
                             f'（可能是 [A]／[B] 项目标文本漏写，也可能是归零型已达成）')
        elif cur > 0:
            lines.append(f'· 自我匹配预警: {token} @ {target} —— 现行 {cur}｜目标文本内 {n}'
                         f'｜近似预测 {cur + n}（未计删除，须人工核对到位期望）')
        # 零命中待复核（F2）：窗口＝命令所在行起（含本行）其后 4 行；只在 hit 门通过、目标件实存、
        # 且**归一后**的 token 属字面集（无正则元字符——否则 cur 恒 0 必误报）时判
        if exists and cur == 0 and literal_token.match(norm):
            # 取数行＝窗口内首个命中「期望」（＝正则计算方式的解析门）的那一行；**取数面＝「期望」子句**，
            # 按 docstring 的五步先后取数（顺序即计算方式）：① 取有序数字列表 nums；② K＝M 按命令序号（0 基）
            # 配对取值——每数字各对一条命令，不要求全同、不看分配型；③ K≠M 且分配型句 → 不判；
            # ④ K≠M 且数字全同 → 取该值；⑤ 其余 → 产「未判」候选行（不再静默）
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
                    pass                # ③ 分配型句不判——先于「全同取值」，既有误报不得复活
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
                             f'（施工前属预期；施工后仍零即计算方式已变或断言失效）')
    if neutral:
        lines.append(f'· 现行有值／目标文本未提及: {neutral} 个'
                     f'（请对照到位列核对——可能是哨兵型保留，也可能是归零型已达成）')
    return lines, len(refs), hits


def _segments(line):
    """行内代码 span 的「紧邻段」切分（检查 B 配对判定标准）：返回 [(span 内容, 紧邻段)]——
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
    """检查 B 的**对象计算方式**判定标准：该尺寸声称是否指向**整件尺寸**。
    是＝**该数字之前的紧邻文本内**含整件标记（全文／本件／实件／总行数——照 `LIMIT_MARKS` 的左界
    做法，标记须前置，否则同一紧邻段里**另一条**声称的「全文」会把本声称误判为整件计算方式）、或**紧邻段
    左界**含「共 … 行」式声称（`WHOLE_CLAIM` 为**左界形**——「共」起首、其间容空白与数字与千分位逗号、
    至行尾止；仍施于 `head`：「共 100 行」的 `head` 止于「共 」即命中，而同一紧邻段里**另一条**声称的
    「共」不在其 `head` 末尾则不命中，左界纪律不破）、
    或量词为「字符」（字符量词本身即整件计算方式）、或该行与 `wc -l` 类命令同段。
    否＝降为候选（只计数、不逐条呈报）。
    量词「处」（072 按类扩、计算方式收紧）：对象计算方式**限死为加粗标记计数**——仅当**整个紧邻段 `seg`**
    含「加粗」（不看「加粗」在数字之前还是之后），且**数字之前**紧邻文本（`seg[:start]` 去尾空白后）
    **不以「加」／「增」收尾**（增量式如「本批给该件加 16 处加粗」不判）时判为整件计算方式；否则降为候选。
    不收窄即生误报（宽松检查关在归档语料上 7 条判定 6 条报到，其中 3 条为误报，实测见归档规格）；「条」／「项」／
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
    配对判定标准＝路径紧邻段（见 _segments()）：一条计数声称只计入其所在紧邻段对应的路径。
    **对象计算方式**（改写自源件的词形禁止清单——实测仅抑制 1／7 条误报）：只改判定标准层——「用件」
    判定标准（本批改动清单节内提及者记「起点不符」、否则记「计数不符」）与源件同；尺寸声称的识别由词形
    禁止清单改为**对象计算方式**（仅当该数字之前的紧邻文本显式指向整件尺寸时才判，见 _whole_size()），其余
    降为候选——只计数、不逐条呈报（四类已知误报：表行数／diff 增量／零命中数／引用行号）。两类输出
    皆只呈报、不置退出码。
    **实测值计算方式**（075 批）：目标件读取按 UTF-8 ＋ `errors='replace'`（遇二进制／非 UTF-8 件不抛
    `UnicodeDecodeError`，与模块头注的容错计算方式一致，本批 F12）；行数＝该件 `'\\n'` 出现次数（与
    `wc -l` 同计算方式：末行无换行者不多算 1，本批 F3）；`char`／`line`／**加粗标记数**三项一次读入缓存，
    「处」的实测值取缓存第三项（不再按目标件另读一次，已收敛遗留的「另读一次」）。"""
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
                # 被引用件）；读计算方式统一在 `_read_target()`（本处原为就地容错读）
                content = _read_target(_abs(target, root))
                # 三元组＝（字符数／行数／加粗标记数）：行数与 `wc -l` 同计算方式（`'\n'` 计数，F3）；
                # 加粗标记数一次读入即缓存，「处」的实测值取第三项（已收敛「另读一次」）
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
                    # 「处」的实测值＝加粗标记出现次数（`**` 的 count，计算方式同 `文字与命名标准` §13 第 8 条）；
                    # 值取缓存第三项（加粗标记数，随字符数／行数一次读入即算，不再按目标件另读一次——
                    # 收敛遗留：原二元组只存字符数与行数，故另读一次取标记计数）
                    actual = nbold
                else:
                    actual = nchar if unit == '字符' else nline
                if int(num.replace(',', '')) == actual:
                    continue
                head = f'{target} 称「{num} {unit}」实测 {actual}'
                if target in listed:
                    lines.append(f'· 起点不符（本批改动件，不阻断）: {head}')
                else:
                    lines.append(f'· 计数不符: {head}')
    return lines, judged, cand


def _strip_wrap(s):
    """剥去逐字核验串的外层包裹（「」／单双反引号／表格管道），得纯文本。
    只在首尾成对时剥一层：形如「`0` 成功 / …」的串（首字符恰为反引号）不会被误剥。
    另做转义归一：规格要在代码跨度内嵌反引号，写作 `\\``（反斜杠是 Markdown 转义符、非内容），
    实文里是裸反引号——不归一则这类条目在已完工件上恒报误报（实测五处）。另剥加粗标记（规格 A 级行惯以加粗标改动词、实文不含，不剥即恒报未落实误报）。**目标侧亦须同等去加粗**（否则恒假阳——写入位置：`check_pairs()` 另取 `content.replace('**','')` 视图并取两视图并集）。"""
    s = s.strip().replace('\\`', '`')
    # 剥加粗标记（规格 A 级行的 `**` 系强调记法、非目标文本；不剥即恒报「未落实」）
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


def check_pairs(text, root, spec=None):
    """检查 C：[A] 项**目标文本**的逐字落实核对（只呈报，不影响退出码）。返回输出行列表。
    ① 列角色按表头别名定位（见 _change_rows()）：路径列＝表头含「文件」或「新产品文档」；可自定程度列＝
    含「可自定程度」（无则取末列，**单元格内含 `[A]` 者视同 `[A]` 行**——如「[A]＋[C]」写法）；
    无任何别名可识别的表整表跳过并明示。
    ② **逐字判定标准只对「目标文本来自引号块」的行生效**（我方规格的 `[A]` 行多为描述性散文，逐字核对会成
    片误报）：含引号块的行，其每块（≥8 字符）须在目标件内逐字命中，未命中即报「未落实或已不符」；
    **无引号块的行降为候选呈报**（提示补引号块）——此做法使「目标文本用引号块书写」成为可机械鼓励的写法。
    ③ **方向标记切分**（§二 C 行 ③，产物审查 P0-1）：单元格内有方向标记（见 DIR_MARKS）时，核对面＝
    **最后一个标记之后**的引号块（标记之前的是「现文」＝改后已移除的旧文，核之必误报）；标记之后无
    引号块者该行**不核逐字**、降为候选呈报（见 _target_blocks()）。
    ④ **成因诊断（事故记录族的机械判定标准）**：对**未命中目标件**的引号块，再到**改动文件外件集**
    （`docs/specs/**/*.md` 中**非本件**者，含 `archive/`；本件由 `spec` 参数排除，读盘一次缓存，见
    `_out_of_scope_texts()`）中检索同一去加粗视图——命中者在该行文案末尾**追加**成因括注「（**疑现状侧
    引文**：该串亦见于改动文件外件，**成因待判**）」。措辞取「**待判**」：机械判定标准只报候选、不冒充确定结论；
    **仍是一行、不新增候选行**，退出码不变（候选非阻断）。
    ⑤ **加粗归一对称化（109 F1）**：命中判定标准取「原文 ∪ 去加粗视图」并集（见下），只减假阳、不引入假阴。
    目标件不可解析的行不核（不猜）并计数明示（见末尾汇总行）；前缀一律 `·`（非 `x`——`x` 前缀语义只
    留给参数错误类）。"""
    if not CHANGE_SECTION.search(text):
        return []
    rows, skipped = _change_rows(text)
    lines = []
    if skipped:
        lines.append(f'· 跳过整表 {skipped} 张（表头无可识别的路径列／可自定程度列）')
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
            # `UnicodeDecodeError` 残留；读计算方式统一在 `_read_target()`
            cache[path] = _read_target(path)
        content = cache[path]
        # 加粗归一对称化（109 F1）：`_strip_wrap()` 已剥**规格侧**的 `**`，而目标件原文可能同样含 `**`
        # （规格 `[A]` 行惯以加粗标改动词，实文亦然）——只比原文即恒报「未落实或已不符」（`G37` 永久假阳）。
        # 故另取一份**去加粗视图**，命中判定标准取两视图的**并集**（析取）：失败集严格缩小，目标件内本就合法的
        # 字面 `**` 仍可在原文侧命中 ⇒ 只减假阳、不引入假阴。
        content_norm = content.replace('**', '')
        for block in blocks:
            # 多行串按行切片，逐行要求命中（避免整段因一处空格差异而误判）；单行过短者跳过（噪声防护）
            for piece in _strip_wrap(block).splitlines():
                piece = piece.strip()
                if len(piece) < 8:
                    continue
                if piece not in content and piece not in content_norm:
                    note = '（疑现状侧引文：该串亦见于改动文件外件，成因待判）' if _out_of_scope_hit(piece, root, spec) else ''
                    lines.append(f'· [A] 未落实或已不符: {piece[:60]} @ {target}{note}')
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
    归类判定标准：边缘空格且**跨度内含反引号**者为 ①（真嵌套、仅双反引号定界形态下可能），
    其余边缘空格者为 ②（含中文正文里「反引号紧贴文字」的常见误写）——「报不报」只由 _edge_space()
    定，与 markdownlint MD038 一致（`` `a ` ``／`` ` c` `` 报；`` ` x ` `` 与全空格跨度不报）；
    ③ 加粗引导行紧跟列表（`**…**：` 行 + 下一行列表标记起首）→ MD032；
    ④ 规格内可解析相对链接（按规格所在目录解析存在、按归档目录解析不存在 → 归档后必找不到对应），
    该类的适用面限于会归档的件（NEVER_ARCHIVED 的件不判）。
    围栏块内的行一律不判（块内不是行内代码，也不是链接）；**围栏开合按标记字符配对**（三反引号与
    `~~~` 各自成对，见 FENCE_BLOCK）——「``` 块内一行孤立 `~~~`」不得提前翻转围栏态，否则该件
    其余预警相关失效（077 批 F2；产物审查 P1-2 测试样例实证）。"""
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
    """检查 H（2026-09-16 加）：规格 §七「本批逐条确认」表的**汇总行 ↔ 表体状态列**逐格核对。
    返回 **(候选行列表, 汇总行列表)**——计算方式同检查 E：候选行由调用方并入末尾三种结果判定标准、汇总行只进
    逐件打印串（**不计入**）；**候选非阻断、恒不判为失败**。

    **判定标准**：两侧都是**可数结构**。表体侧＝该节表格每行「状态」列内的档词（五档：已履行／作废／本批处置／
    仍待／待作者）；汇总侧＝`NUCLEAR_TALLY` 命中的五个计数与总数。逐档比对，不符即出候选。
    **另判「五档外状态词」**：状态列既不含五档任一者即出候选（该格是流程错写／自由措辞——本仓实例：
    规划方曾写「不适用」，而 `施工机制` §七 明定「状态取五档之一」）。
    **另判「仍待项找不到对应」（2026-09-16 扩）**：表体行状态列 ∈ {仍待, 待作者} 者——该行是「欠账仍在」
    的声明——取其「条目」列位置（取法与检查 J 的「开放项清单归到哪条规则」**同款**，见 `_item_anchors()`：
    位置一＝首个非批次号反引号跨度、位置二＝首个 `§N`／`GN`／`#N`；两位置皆取不到亦出候选），
    该位置在**清单全集**全文零命中即出候选（文案以「仍待项已找不到对应」起——「条目」里写不出一个可查
    写入位置者，等于该欠账已找不到对应）。候选非阻断、恒不判为失败。
    **静默条件（硬）**：无 §七 逐条确认节、或节内无数出状态列的表格 ⇒ **完全不输出**（连汇总行都不打——
    防误报的判定标准落在字面上）。表体有行而汇总行缺失 ⇒ 出候选（有表无账属真不自洽）。
    事故出身：2026-09-16 规划方在两轮审查中**三次同型**写错该汇总行（表体改了而汇总
    未跟着重算／流程计错），三次都靠审查方逐行点数才发现——本条把它机械化。
    **除「仍待项找不到对应」一项外**本检查不读写磁盘（该项读清单全集全文，见 `_ledger_text()`）。"""
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
    # 「仍待项找不到对应」（2026-09-16 扩）：§七 表体行状态 ∈ {仍待, 待作者} 者，其「条目」列位置 ↔
    # 清单全集全文——位置零命中即报候选（取法与检查 J 的开放项判定标准同款，见 _item_anchors()）。
    # **单列一表**：不得并入 `outside`（后者是「五档外状态词」的计数面，汇总行按 len 取数）。
    ledger = _ledger_text(root)
    broken = []
    for cells in rows:
        head = cells[0].strip()
        st = cells[2].replace('*', '').strip()
        if head.startswith('来源') or set(st) <= set('-: '):
            continue
        if not any(k in st for k in ('仍待', '待作者')):
            continue
        item = cells[1] if len(cells) > 1 else ''
        anchors = _item_anchors(item)
        if not anchors:
            tail = '（两位置皆取不到）'
        elif not _anchors_hit(anchors, ledger):
            tail = '（位置 ' + '／'.join(anchors) + '）'
        else:
            continue
        broken.append(f'· 检查 H 仍待项已找不到对应: {item.strip()[:60]}{tail}')
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
    cands = list(outside) + broken
    if diffs:
        cands.append('· 检查 H 逐条确认表汇总与表体不符: '
                     + ('汇总行缺失；' if tally is None else f'汇总 {fmt(declared)}；')
                     + f'表体 {fmt(counts)}（' + '；'.join(diffs) + '）')
    summary = (f'· 检查 H 汇总: 汇总行 {fmt(declared)}｜表体 {fmt(counts)}｜'
               f'五档外 {len(outside)} 项｜不符 {len(diffs)} 项')
    return cands, [summary]


def _nuclear_nonbody(rows):
    """逐条确认表里**非数据行**的条数（表头 + 分隔行）——总数据仅比数据行。"""
    n = 0
    for cells in rows:
        head = cells[0].strip()
        st = cells[2].replace('*', '').strip() if len(cells) > 2 else ''
        if head.startswith('来源') or (st and set(st) <= set('-: ')):
            n += 1
    return n


def _anchor_norm(s):
    """位置比对用的归一化：剥 markdown 定界（反引号与 *）与空白——规格引文常带 ** 强调标记
    而目标件正文没有，逐字比对会误报（100 批审查实证）。"""
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
            cands.append(f'· 检查 I 位置行号超出文件: {path}:{ln}（该件实有 {len(lines)} 行）')
        return
    if not lines[ln - 1].strip() and key not in seen:
        seen.add(key)
        cands.append(f'· 检查 I 位置指向空行: {path}:{ln}')
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
            cands.append(f'· 检查 I 位置不符: {path}:{ln} 的引文实际在第 {hit} 行——「{q[:24]}」')
        else:
            cands.append(f'· 检查 I 引文未在目标件出现: {path}:{ln}——「{q[:24]}」'
                         f'（§一 应只述现状；**若目标件已被本批或后续批改动，属预期陈旧、非缺陷**）')


def _anchor_cut(lst, n=15):
    """候选截断（检查 I 用）。**分腿各截**——单腿占满截断位会使另一腿的发现整批隐形
    （产物审查 P2-⑦ 实测：§一 16 条占满 15 位、§二 8 条全不可见）。"""
    if len(lst) <= n:
        return list(lst)
    return lst[:n] + [f'· 检查 I 另有 {len(lst) - n} 条（截断显示）']


def check_anchor(text, root):
    """检查 I（2026-09-16 加）：§一「现状位置」节的 文件:行号 引用 ↔ 目标件实况核对。
    返回 **(候选行列表, 汇总行列表)**——计算方式同 E／H：候选并入 `extra`（非阻断、恒不判为失败），
    汇总行只打印。

    **射程＝§一 ＋ §二 位置格**：§一 按定义只述**现状**（现行原文），引文可与磁盘逐字比对；§二 的
    位置格按**格内**解析 `路径:行号` 判越界与空行（**不跨格、不跨行继承上下文**——实测跨行继承会成片
    假阳：098→338 条）。§二 的现状列引文与 ±3 引文核**未纳入**（描述性散文多，逐字核成片误报）。
    **判定标准**：① 行号超出目标件实有行数 ② 行号指向空行 ③ 该行±3 内不含规格引文——引文在
    全件他处命中时报**实际行号**（可直接改规格），全件无命中时报「未在目标件出现」。
    引文取「…」形、归一化剥 ` 与 * 后比对（见 `_anchor_norm`）；不足 6 字者跳过（过短易伪命中）。
    同行先出现的完整 `路径.md` 为其后裸 `:行号` 建立文件上下文；围栏块内不判。
    无 §一 节 ⇒ **完全静默**（连汇总行都不打——不误报的判定标准落在字面上）。
    事故出身：三批成稿审查的位置 P0 族——其中一批为**全表行号系前批
    落地前旧号**（直接引发规格整体重写＋再一轮窄域复核，两轮 subagent 合计约 3.4M token）；
    同型单点。本检查把该族从「独立上下文重测发现」前移到「送审前机器候选」。"""
    sec = _section(text, ANCHOR_SECTION)
    cands, seen, refs = [], set(), 0
    in_fence = None     # 当前围栏标记字符（None＝不在围栏内）；开合按**同一标记字符**配对
    for raw in (sec or '').split('\n'):
        _fm = FENCE_BLOCK.match(raw)
        if _fm:
            _mark = _fm.group(1)[0]
            if in_fence is None:
                in_fence = _mark
            elif in_fence == _mark:
                in_fence = None
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
    i_cands = list(cands)                                          # §一 腿候选（截断前）
    p2_cands = []                                                  # §二 腿候选（另存，见下的分腿截断）
    refs += _change_position_probe(text, root, seen, p2_cands)     # §二 位置格腿（2026-09-17 加）
    if not sec and not i_cands and not p2_cands:
        return [], []       # 无 §一 且 §二 腿无发现 ⇒ 完全静默（连汇总行都不打）
    true_n = len(i_cands) + len(p2_cands)   # 截断前的真实异常数（截断后再取 len 会失真）
    # **分腿截断**（产物审查 P2-⑦）：原为整表截断，§一 候选多时会占满 15 个截断位，使 §二 腿的
    # 发现**整批隐形**（098 实测：§一 16 条占满、§二 8 条全不可见）——两腿各截各的，保底可见。
    cands = _anchor_cut(i_cands) + _anchor_cut(p2_cands)
    return cands, [f'· 检查 I 汇总: 位置引用 {refs} 处｜异常 {true_n} 项']


# 检查 J（2026-09-16 加）——在制规格的「九、审查记录」节**存在性**与 发现的问题 条目**N 核对**。
# 节定位判定标准与检查 I 同计算方式：取「标题行以两个井号起、正文含『审查记录』」的节——**节号是否＝「九」交人工判断**。
ARCHIVE_RECORD_SECTION = re.compile(r'^##[^#\n]*审查记录.*$', re.M)
# 「发现的问题 共 N」的载体形态：**容加粗**（归档实测有「共」与数字间插 `**` 的写法，如 `共**11**`）；
# N 位取「数字串（容千分位逗号）」或「花括号变量」（后者＝非数字占位，另判）。
RECORD_FINDINGS = re.compile(r'发现的问题\s*(?:\*\*)?\s*共\s*(?:\*\*)?\s*(\{[^}\n]{0,20}\}|\d[\d,]{0,6})')
RECORD_PLACEHOLDER = re.compile(r'发现的问题|共')
# 流程计数：`P0`／`P1`／`P2` 与紧随的**首个**数字（中间容 `:`／空白／加粗标记等非数字字符）；
# 窗口＝本条「发现的问题 共 N」之后至该行行末（**禁整节求和**——在制规格常有多条审查记录）。
RECORD_TIER = re.compile(r'(P0|P1|P2)[^\d\n]{0,6}(\d+)')
# 检查 J 扩（2026-09-16 加）：§八「开放项」节——条目位置 ↔ **清单全集**全文，以及成本字段判定标准（§九）。
# 节定位模式**须含「八、」**（F3 ② 的定位写死条）：§七 标题「本批逐条确认（相关归档规格的开放项）」
# 含「开放项」字样而不含「八、」，据此不被它抢先命中。
OPEN_SECTION = re.compile(r'^##[^#\n]*八[、.]\s*开放项.*$', re.M)
# 条目起始符：`数字.` 与「连字符加空格」两种都认（F3 ①）。
OPEN_ITEM = re.compile(r'^\s*(?:\d+[.)]|[-*+])\s')
# 位置一＝条目内**首个非批次号**的反引号跨度：纯数字／批次号在清单全集中恒命中（如纯数字串），
# 不排除则本检查关一上线即**恒静默**（F3 ② 的保底做法条）。
OPEN_TICK = re.compile(r'`([^`\n]+)`')
BATCH_TOKEN = re.compile(r'^\d+$')
# 位置二＝条目内**首个** `§N`／`GN`／`#N` 编号（`§` 后认阿拉伯与中文数字——本仓节号两种写法并存）。
OPEN_NUM = re.compile(r'§\s*(?:\d+|[一二三四五六七八九十]+)|G\d+|#\d+')
# 该条已自带「已处置／已失效」判定者跳过（F3 ③）。
OPEN_SKIP = ('作废', '已履行', '本批处置')
# 清单全集（`施工机制.md` ＋ `docs/standards/*.md` 全部正文 ＋ `AGENTS.md`）——任一处命中即压制报告。
LEDGER_FILES = ('docs/specs/施工机制.md', 'AGENTS.md')
LEDGER_DIRS = ('docs/standards',)
# 成本字段判定标准（§九；F14）：改按「节」判后不再需要审查位词表；两字段名与占位值。
COST_FIELDS = ('工具往返数', '周期时长')
COST_PLACEHOLDER = ('待汇总', '待填', '待补', '待定', 'TODO', 'TBD')
# 清单全集全文的进程内缓存（同一进程内多规格共享，避免逐件重复读盘）。
_LEDGER_CACHE = {}


def _ledger_text(root):
    """清单全集**全文**（检查 H 的「仍待项找不到对应」与检查 J 的「开放项清单归到哪条规则」共用比对面）：
    `施工机制.md` ＋ `docs/standards/*.md`（全部标准件正文）＋ `AGENTS.md`，逐件读盘一次后缓存。
    缺件静默跳过（比对面不因缺件崩溃）；两判定标准的 ④ 计算方式＝「任一位置在此全文命中即算有归到哪条规则」。"""
    key = str(root)
    if key in _LEDGER_CACHE:
        return _LEDGER_CACHE[key]
    names = list(LEDGER_FILES)
    for d in LEDGER_DIRS:
        full = os.path.join(root, d)
        if os.path.isdir(full):
            names += [f'{d}/{n}' for n in sorted(os.listdir(full)) if n.endswith('.md')]
    parts = []
    for rel in names:
        try:
            with open(_abs(rel, root), encoding='utf-8', errors='replace') as f:
                parts.append(f.read())
        except OSError:
            continue
    _LEDGER_CACHE[key] = '\n'.join(parts)
    return _LEDGER_CACHE[key]


def _open_items(sec):
    """§八 节文本 → 条目列表：行首项起（起始符见 `OPEN_ITEM`）至下一个起始行止，续行并入本条
    （条目常跨行书写；不并则位置可能落在续行上而取不到）。"""
    items, cur = [], None
    for ln in sec.split('\n'):
        if OPEN_ITEM.match(ln):
            if cur is not None:
                items.append('\n'.join(cur))
            cur = [ln]
        elif cur is not None:
            cur.append(ln)
    if cur is not None:
        items.append('\n'.join(cur))
    return items


def _item_anchors(item):
    """条目 → 位置列表（检查 H「仍待项找不到对应」与检查 J「开放项清单归到哪条规则」**同款取法**）：
    位置一＝首个**非批次号**反引号跨度（首个跨度是纯数字／批次号时跳过它）；位置二＝首个
    `§N`／`GN`／`#N` 编号。两者**都取不到**时返回空表——调用方据此出「无位置」候选（**不跳过**：
    检查关门目的正是抓「写不出可查写入位置」的条目）。"""
    toks = [t for t in OPEN_TICK.findall(item) if not BATCH_TOKEN.match(t.strip())]
    out = [toks[0]] if toks else []
    m = OPEN_NUM.search(item)
    if m:
        out.append(m.group(0))
    return out


def _anchors_hit(anchors, ledger):
    """位置集在清单全文是否命中（任一命中即算有归到哪条规则）——两判定标准共用的 ④ 判定标准。"""
    return any(a in ledger for a in anchors)


def _open_item_cands(text, root):
    """检查 J 扩（2026-09-16 加）：§八「开放项」节条目位置 ↔ 清单全集全文。
    返回 **(候选行列表, 无位置条目数, 已判条目数)**；无 §八 开放项节 ⇒ 三者皆空／0（静默）。
    **候选非阻断、恒不判为失败**。"""
    sec = _section(text, OPEN_SECTION)
    if not sec:
        return [], 0, 0
    ledger = _ledger_text(root)
    cands, noanchor, total = [], 0, 0
    for item in _open_items(sec):
        if any(w in item for w in OPEN_SKIP):
            continue
        total += 1
        anchors = _item_anchors(item)
        if not anchors:
            noanchor += 1
            cands.append('· 检查 J 开放项无位置，无法核归到哪条规则: ' + item.strip()[:60])
        elif not _anchors_hit(anchors, ledger):
            cands.append('· 检查 J 开放项无清单归到哪条规则: ' + item.strip()[:60]
                         + '（位置 ' + '／'.join(anchors) + '）')
    return cands, noanchor, total


def _cost_placeholder(line, field):
    """§九 审查记录行内某字段的**值**是否缺失或占位：取字段名之后至该行下一个「｜」或行末的片段，
    剥 markdown 标记与空白；空值、花括号变量（如 `{R}`）与 `待汇总`／`待填` 类占位词均判占位
    （F14：字段名与字段值**同判**——写「待汇总」等于没填）。"""
    rest = line.split(field, 1)[1]
    for sep in ('｜', '|'):
        rest = rest.split(sep, 1)[0]
    val = rest.strip().strip('*`：: ')
    if not val:
        return True
    if re.fullmatch(r'\{[^}\n]{0,20}\}', val):
        return True
    return any(p in val for p in COST_PLACEHOLDER)


def _cost_field_cands(sec):
    """检查 J 扩（2026-09-16 加；同日**改按「节」判**）：§九 审查记录节内**任一行**同时含
    「工具往返数」与「周期时长」两字段、且两值均非占位值（`COST_PLACEHOLDER`）⇒ 该节**通过**；
    **整节都没有**这样的行 ⇒ 出**一条**候选（**候选文案的唯一出口＝本函数下方那一行**，全件只此
    一处含该串）。
    **为何按节不按行**：首稿按「行」判（审查位记录行＝整行含三词之一，缺字段即报），
    在四件在制规格上出 **13 条**候选，逐条复核 **0 条真阳**——全是「成本两字段单列一行」（成本记账
    段）的**等效写法**，按行判会把等效写法误判为缺字段，属**过报**；该实例已记 原 G19（其触发条件正是「上线后出现大批人工逐条判为预期」的候选）。按节判后现行四件归 **0 条**。
    候选非阻断、恒不判为失败。"""
    for ln in sec.split('\n'):
        if all(f in ln for f in COST_FIELDS) and not any(_cost_placeholder(ln, f) for f in COST_FIELDS):
            return []
    return ['· 检查 J `§九 含成本字段` —— §九 审查记录节内无任一行同时带「工具往返数」与「周期时长」'
            '且两值非占位（含「待汇总」「待填」等占位值者视同缺）']


def check_archive_record(text, root):
    """检查 J（2026-09-16 加）：在制规格的「审查记录」节**存在性**与 发现的问题 条目**N 核对**。
    返回 **(候选行列表, 汇总行列表)**——计算方式同 E／H／I：候选行由调用方并入 `extra`（⇒ 计入末尾
    三种结果 `发现的问题`）、汇总行只进逐件打印串（**不计入**）；**候选非阻断、恒不判为失败**。

    **判定标准**：节定位＝「标题行以两个井号起、正文含『审查记录』」的节（`ARCHIVE_RECORD_SECTION`）；
    **脚本检查只判该节存在性与 N 核对，节号是否＝「九」交人工判断**。① 无该节 → 报候选；② 节内无
    `发现的问题` 与「共」的匹配 → 报候选「留占位符」（**容加粗形态**）；③ 数字位为花括号变量
    （非数字占位）→ 报候选「非数字占位」；④ **逐条核对**：逐「发现的问题 共 N」匹配各自取 N，与其后
    **窗口内**各流程计数之和比对（**禁整节求和**——在制规格常有多条审查记录），N ≠ 各流程之和 → 报候选。
    **窗口计算方式**：本条命中处至该行行末（流程数取各流程**首个**数字——「P0-1／P1-2」类条目号不二次计数；
    故一条记录内同一流程写两个数字时只认首个——**宁漏报不误报**，多流程写法（P0:2 P1:5 P2:4）不受影响）。

    **本函数另含两条判定标准（2026-09-16 扩）**：⑤ **开放项清单归到哪条规则**——§八「开放项」节（定位模式
    `OPEN_SECTION` 写死含「八、」，故不被 §七 标题「本批逐条确认（相关归档规格的开放项）」抢先命中）
    每条取两个位置（取法与检查 H 的「仍待项找不到对应」**同款**，见 `_item_anchors()`），两位置在
    **清单全集**全文零命中即出候选（文案以「开放项无清单归到哪条规则」起）；**两个位置都取不到**者出候选、
    文案以「开放项无位置，无法核归到哪条规则」起（**不跳过**——检查关门目的正是抓「写不出可查写入位置」的条目），
    并在汇总行末加一格 `｜无位置条目 {n} 条`；该条含「作废」「已履行」「本批处置」任一者跳过。
    ⑥ **成本字段核对**（§九，见 `_cost_field_cands()`；**按节判**）——§九 节内**任一行**同时含
    「工具往返数」与「周期时长」且两值非占位即通过；整节皆无则出**一条**候选。两条均**候选非阻断、
    恒不判为失败**。

    **静默条件（硬）**：无「审查记录」节**且**各处候选皆空 ⇒ **完全静默**（连汇总行都不打——不误报
    的判定标准落在字面上）；**无「审查记录」节但 §八 开放项判定标准有候选时，仍照打汇总行**（汇总行的发射面
    由「有无候选」决定、不由「有无 §九 节」决定；`｜无位置条目 {n} 条` 是**运行期输出**，非规格内的
    预估数）。
    事故出身：四件审查记录节**实质未填**（节内无任何「发现的问题 共 ＋
    数字」），此前无机械面可查；`施工机制` §三 过程产物两项已立「审查记录须同批落」（本批 F5）。
    **除开放项清单归到哪条规则一项外不读写磁盘**（审查记录核对面取自规格文本本身；开放项清单归到哪条规则一项另读
    清单全集全文，见 `_ledger_text()`——`root` 为此而入参）。"""
    sec = _section(text, ARCHIVE_RECORD_SECTION)
    cands, labels, diffs, hits = [], [], 0, []
    if sec:
        hits = list(RECORD_FINDINGS.finditer(sec))
        if not hits:
            if RECORD_PLACEHOLDER.search(sec):
                cands.append('· 检查 J 审查记录留占位符: 节内无「发现的问题 共 N」数字行（占位符未填）')
            else:
                cands.append('· 检查 J 审查记录留占位符: 节内无 发现的问题 计数行（节存在而无内容）')
        for m in hits:
            raw = m.group(1)
            line_end = sec.find('\n', m.start())
            win = sec[m.end():line_end if line_end != -1 else len(sec)]
            got = {k: None for k in ('P0', 'P1', 'P2')}
            for k, v in RECORD_TIER.findall(win):
                if got[k] is None:
                    got[k] = int(v)
            if raw.startswith('{'):
                cands.append(f'· 检查 J 非数字占位: 发现的问题 共 {raw}（规格模板形态？模板以花括号变量记位）')
                labels.append(raw)
                diffs += 1
                continue
            n = int(raw.replace(',', ''))
            s = sum(v for v in got.values() if v is not None)
            labels.append(f'{n}：' + ' '.join(f'{k}:{got[k] if got[k] is not None else "-"}'
                                            for k in ('P0', 'P1', 'P2')))
            if n != s:
                diffs += 1
                cands.append(f'· 检查 J 审查记录 N 与流程不符: 发现的问题 共 {n} ≠ 各流程之和 {s}'
                             f'（P0:{got["P0"]} P1:{got["P1"]} P2:{got["P2"]}）')
        # ⑤ 成本字段判定标准（§九，2026-09-16 扩）：只对有审查记录节的件判（无该节即无处判成本行）。
        cands += _cost_field_cands(sec)
    # ⑥ 开放项清单归到哪条规则（2026-09-16 扩）：**不受 §九 存在性约束**——§八 是独立判定标准面，
    # 审查记录节缺失时该判定标准仍须生效（否则最该抓的「开放项写不出写入位置」在缺节件上整段失明）。
    open_cands, noanchor, _open_n = _open_item_cands(text, root)
    cands += open_cands
    if not sec and not cands:
        return [], []
    summary = (f'· 检查 J 汇总: 条目 {len(hits)} 条｜N 与流程不符 {diffs} 条｜'
               f'声明 {"、".join(labels) if labels else "无"}｜无位置条目 {noanchor} 条')
    return cands, [summary]



def check_reconcile(text, root):
    """检查 E：三方核对（改动文件 ↔ 禁改文件 ↔ 断言排除集；只呈报，不影响退出码）。
    返回 **(候选行列表, 汇总行列表)**——候选行由调用方并入末尾三种结果判定标准（`发现的问题`），
    汇总行**只进逐件打印串、不计入**（角色同「· B：判定 …」明示行）。

    **发射面**（078 批 F1 收尾）：对「含文件级改动清单节**且** C ≠ ∅」的件产 候选行 ＋ 汇总行；
    对「有该节**且有改动行**、而 C ＝ ∅」的件产**一行空跑明示**（同候选行计入 `发现的问题`——观测缺口
    的可见化）；无该节的件 候选／汇总／空跑**皆不输出**（完全静默——「跳过」的可见化写入位置由汇总行与
    空跑明示承担，不逐件另打明示行——实测 16／19 件无补集式断言，逐件明示即 51 行噪声）。

    **C（改动文件）取集**：全部改动行的路径单元格内**逐个**路径 token 判实存，取实存者为改动件。
    **不复用 `_row_target_file()`**——后者只返回首个 token，而实测有 3 行的路径列含 ≥2 个实存
    token（066／074／076 各一行），复用即漏判。

    **判一（禁改文件未豁免）**：检索面 S＝`BAN_SECTION` 所定的**全节文本**（不限 `- 禁止` 起首行）；
    P＝S 内字面以斜杠结尾的独立目录 token（`BAN_PREFIX`，不认从文件名反推的目录）且实存为目录者；
    对**命中前缀**（`x` 以某 `p` ＋斜杠起首）的每件 `x`，**按子句**（`BAN_CLAUSE_SPLIT` 切分 S，
    不含圆括号）判豁免——存在一个子句同时含 ① 豁免词（`BAN_EXCUSE_MARKS`）与 ② 写入位置（该件全路径
    或基名／`§N`／`FN`／`[N]`）→ 已豁免；否则出候选行。P 为空或无 S 时不产候选行（适用面不成立）。
    **在册的漏报方向**：写出「除…外」而实质无点名者本判不报（宁可漏报，见规格 §八 3）。

    **判二（断言排除集缺）**：E＝验收断言节内 `':!<path>'` 形态（`EXCLUDE_TOKEN`）的路径集
    （归一化＝去首尾空白与尾随斜杠）；**E 为空即跳过**（实测 19 件有验收节的语料中仅 3 件有此
    形态，逐件报即纯噪声。**取舍为有意**——信号由汇总行「跳过：无补集式断言」字段逐件承载（人据此判不需要或忘写），不另产候选行）；否则对每件 `x ∈ C`，无 `e ∈ E` 使 `x == e` 或以 `e` ＋斜杠起首者
    → 出候选行（列缺项件名）；汇总行记其**缺项件数**（字段名 `判二缺`——由旧名
    `判二命中` 改名，**取值不变**）。"""
    rows, _skipped = _change_rows(text)
    targets = []
    for row in rows:
        for t in PATH_TOKEN.findall(row['path'] or ''):
            if t not in targets and os.path.isfile(_abs(t, root)):
                targets.append(t)
    targets.sort()
    if not targets:
        # 空跑明示（078 批 F1）：只对「有改动清单节**且有改动行**、而 C ＝ ∅」的件产一行（该行同候选行
        # **计入** `发现的问题`）；无该节者仍**完全静默**——逐件明示即刷屏（见函数头注「发射面」）。
        if rows:
            return [f'· 核对① 空跑: 有改动行 {len(rows)} 行而无可解析实存件——核对未判'], []
        return [], []       # 无改动清单节：候选与汇总皆不输出（完全静默）
    cands = []
    ban = _section(text, BAN_SECTION)
    no_ban = 1 if not ban.strip() else 0
    applicable = 0      # 判一**命中前缀**的件数（无论是否豁免）
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
                cands.append(f'· 核对① 禁改文件未豁免: {x}')
    excludes = {e.strip().rstrip('/')
                for e in EXCLUDE_TOKEN.findall(_section(text, SECTION))}
    excludes = {e for e in excludes if e}
    no_exc = 1 if not excludes else 0
    missing = []
    if excludes:
        missing = [x for x in targets
                   if not any(x == e or x.startswith(e + '/') for e in excludes)]
        if missing:
            cands.append(f'· 核对① 断言排除集缺 {len(missing)} 件: ' + '、'.join(missing))
    # 汇总行四项计数（078 批 F1 计算方式收尾）：改动行＝该件改动清单**表体行数** M（非路径 token 数——
    # 实测 33 行而可解析仅 3 件）；可解析＝C 的件数 N；判一适用＝**命中禁改文件前缀**的件数 K
    # （无论是否豁免；**出候选**的件数不另计——即本判「禁改文件未豁免」候选行的条数）；
    # 判二缺＝断言排除集**缺项**件数 P（旧字段 `判二命中` 之值，**只改名不改值**，不得读作「已覆盖」）。
    # 同步更新文件核对（2026-09-17 机制成本研究加）：**「需同步更新的文件核对」表存在性**——本批若触「检查脚本」
    # （`scripts/check*.py`／`scripts/check.sh`），规格须含一张**需同步更新的文件核对**表（`施工机制` §四 五面
    # ＋缺口表，逐面给「已同步更新／无需（理由）」）。**只核该表是否写出，不核结论**——把既往两批的隐式义务（「哪一面不用同步更新」从未落字）变成显式一行；候选非阻断（`AGENTS.md` §五.2）。
    touch_check = [x for x in targets if re.match(r'scripts/check[^/]*\.(py|sh)$', x)]
    bw = 0
    # 用词迁移双读（2026-09-17 起）：旧表名「需同步更新的文件核对」与新表名「需同步更新的文件核对」并认，
    # 直到在制规格全部归档（`文字与命名标准` §7 双读窗口）。
    if touch_check and not any(k in text for k in ('回写面对账', '需同步更新的文件核对')):
        bw = len(touch_check)
        cands.append('· 核对③ 触检查脚本而无「需同步更新的文件核对」（旧称需同步更新的文件核对）表: ' + '、'.join(touch_check[:3])
                     + (f' 等 {len(touch_check)} 件' if len(touch_check) > 3 else ''))
    # 模式判定核对（2026-09-17 立；同日随三模式重设计）：按清单**实算模式**并与头注「模式」行比对。
    # 同日**单向化**：档位序见 `_MODE_RANK`——声明高于实算＝作者升档、不报；低于实算才报。
    # 判定标准（`施工机制` §二）：简单 ＝ 件数 ≤3 ∧ 不触规则面（`AGENTS.md`／`docs/standards/**`）
    # ∧ 不触检查脚本（`scripts/check*.py`／`check.sh`）；标准 ＝ 其余（件数 4–10 ∨ 触规则面 ∨ 触检查脚本）；
    # 全量 ＝ 件数 ＞10。**头注自述只作声明、不作依据**（「自述豁免失守」的机械化写入位置）。
    n_t = len(rows)      # 件数＝改动清单**条目数**（`施工机制` §二 定义：每行一项）——非去重文件数
    touch_check = any(re.match(r'scripts/check[^/]*\.(py|sh)$', x) for x in targets)
    touch_rule = any(x == 'AGENTS.md' or x.startswith('docs/standards/') for x in targets)
    if n_t <= 3 and not touch_check and not touch_rule:
        computed = '简单'
    elif n_t > 10:
        computed = '全量'
    else:
        computed = '标准'
    headzone2 = text.split('\n## ', 1)[0]
    pline2 = next((l for l in headzone2.split('\n') if '模式' in l), '')
    g4 = 0
    if not pline2:
        g4 = 1
        cands.append('· 模式判定核对 模式未写（检查 E）：头注缺「模式」行——模式不可核，照标准模式执行')
    else:
        declared = next((m for m in ('简单', '标准', '全量') if m in pline2), '')
        if not declared:
            g4 = 1
            cands.append('· 模式判定核对 取值不可判（检查 E）：头注「模式」行未写简单／标准／全量之一')
        elif _MODE_RANK.index(declared) < _MODE_RANK.index(computed):
            # **单向化**（2026-09-17）：声明**高于**实算＝作者升档（`施工机制` §二「作者可随时改模式」），
            # 合法、不报；只在**声明低于实算**（降档失守）时报——「自述豁免失守」的机械化写入位置。
            g4 = 1
            cands.append(f'· 模式判定核对 降档失守（检查 E）：头注自称「{declared}」而清单实算「{computed}」'
                         f'（件数 {n_t}｜触检查脚本 {int(touch_check)}｜触规则面 {int(touch_rule)}）')
    summary = (f'· 核对① 汇总: 改动行 {len(rows)} 行｜可解析 {len(targets)} 件｜'
               f'判一适用 {applicable} 件｜判二缺 {len(missing)} 件｜同步更新文件核对未表 {bw} 件｜模式判定核对不符 {g4} 件｜'
               f'跳过：无禁改文件句 {no_ban}｜无补集式断言 {no_exc}')
    return cands, [summary]


# 检查 K（2026-09-17 立）：规格模板节名 ↔ **有模板对应**的工具正则——防「模板改了工具没跟上」的静默失效。
# 只核三个有模板对应的正则；其余四个（BAN／NUCLEAR／ARCHIVE_RECORD／OPEN）**白名单**：模板无对应节，
# 属规格道可选节，不核（初稿核全部七个，而模板只有四节，必不命中——成稿审查 P0）。
CHECK_K_SPEC = 'docs/specs/施工机制.md'
CHECK_K_MODEL = re.compile(r'^##[^#\n]*模板.*$', re.M)
CHECK_K_WHITELIST = ('BAN_SECTION', 'NUCLEAR_SECTION', 'ARCHIVE_RECORD_SECTION', 'OPEN_SECTION')


def _template_section_names(root):
    """从 `施工机制` §九 的规格模板围栏块里取节名（`## ` 起首行）。读不到返回 None（调用方明示跳过）。"""
    path = os.path.join(root, CHECK_K_SPEC)
    if not os.path.isfile(path):
        return None
    m = CHECK_K_MODEL.search(_read_target(path))
    if not m:
        return None
    text = _read_target(path)[m.end():]
    # 只取 §九 的**第一个围栏块**（＝规格模板）——模板内的 `## 一、…` 节名就在块内，
    # 故**不得**「截到下一个 H2」（那会把模板正文截掉，实测得 None）
    names = []
    for _mark, block in re.findall(r'(```|~~~)[a-zA-Z]*\n(.*?)\1', text, re.S):
        names = [h for h in re.findall(r'^##\s+(.*?)\s*$', block, re.M)]
        break
    return names or None


def check_template_names(root):
    """检查 K：**直读** `施工机制` §九 模板原文取节名（不抄进工具——抄即比对自指），核
    `SECTION`／`CHANGE_SECTION`／`ANCHOR_SECTION` 三个正则是否仍命中。不命中即出候选。"""
    names = _template_section_names(root)
    if names is None:
        return [f'· 检查 K 跳过：读不到 {CHECK_K_SPEC} 的模板节（节名无从核）'], []
    cands = []
    for label, rx in (('SECTION', SECTION), ('CHANGE_SECTION', CHANGE_SECTION),
                      ('ANCHOR_SECTION', ANCHOR_SECTION), ('AUDIT_SECTION', AUDIT_SECTION)):
        if not any(rx.search('## ' + n) for n in names):   # 正则判据是整行（`^## `），故补前缀再测
            cands.append(f'· 检查 K 模板节名无对应正则: {label} 不命中模板任何节名——'
                         f'模板改了而工具没跟上？（白名单：' + '／'.join(CHECK_K_WHITELIST) + '）')
    return cands, []


# 三模式档位序（模式判定核对「单向化」用，2026-09-17）：声明**高于**实算＝作者升档、合法不报；
# **低于**实算＝降档失守、报。`施工机制` §二「作者可随时改模式」是升档合法性的条文出处。
_MODE_RANK = ('简单', '标准', '全量')


# 检查 M（2026-09-17 立）：§四 规格自审**留痕表**核对——把「自审五条」从散文承诺改为逐行留痕，
# 机器核「每格非空非占位」，即「核过」这件事必须留下可重跑的证据。**无汇总行**（同 A／B／C／D）。
AUDIT_SECTION = re.compile(r'^##[^#\n]*规格自审.*$', re.M)
# 表头须含的两列（缺即报——防「表在但列不对」）。
AUDIT_HEADERS = ('项', '判定')


def _audit_rows(sec):
    """§四 留痕表的数据行（含表头；去分隔行）：逐行按未转义竖线切格（复用 `_CELL_SPLIT`）。"""
    rows = []
    for ln in sec.split('\n'):
        s = ln.strip()
        if not s.startswith('|'):
            continue
        cells = [c.strip() for c in _CELL_SPLIT.split(s.strip('|'))]
        if all(re.fullmatch(r':?-{2,}:?', c) for c in cells if c):
            continue        # 分隔行（| --- | --- |）
        rows.append(cells)
    return rows


def check_audit(text):
    """检查 M：§四 规格自审**留痕表**核对。返回候选行列表（**无汇总行**——故只入候选面枚举）。

    **判定标准**：① §四 节缺失 → **完全静默**（连候选都不打，同检查 I 对缺 §一 的做法——不误报的
    判定标准落在字面上）；② 节在但**无表格** → 报「非留痕表形态」1 条；③ 表头缺「项」或「判定」
    → 报缺列；④ 表体每格**非空非占位**（空串、`{…}` 花括号变量、`待填`／`待汇总` 类占位词——复用
    `COST_PLACEHOLDER`）。

    **能力边界**（见模块「已知限制」⑪）：只核「非空非占位」，**不核格内是否属实**——填假值仍会通过，
    那由审查位独立实跑逮；也**不核「表行数 ↔ 标题声明的条数」**。

    事故出身：自审五条原为散文，`grep -c "规格自审" scripts/check_spec.py` 实测 0——五条填成什么样
    都无机器可见面，「没核」因此没有阻力（`AGENTS.md` §五.3 文件账本律）。"""
    sec = _section(text, AUDIT_SECTION)
    if not sec:
        return []
    rows = _audit_rows(sec)
    if not rows:
        return ['· 检查 M §四 非留痕表形态：节内无表格——自审五条须改写为留痕表'
                '（项｜核法与命令｜实测输出摘要｜判定）']
    hdr, body = rows[0], rows[1:]
    cands = [f'· 检查 M 表头缺列: {h}（留痕表须含「项」与「判定」两列）'
             for h in AUDIT_HEADERS if not any(h in c for c in hdr)]
    if not body:
        # 空表（仅表头 ＋ 分隔行）：无格可核 ⇒ 上面那条「每格非空非占位」永不触发——**该报不报**。
        # 判据出自模板原文「留痕表不能是空表」，故本支是执行既有条文、非新增门槛。
        cands.append('· 检查 M 留痕表无数据行（仅表头 ＋ 分隔行）——留痕表不能是空表')
    for i, r in enumerate(body, 1):
        for j, c in enumerate(r, 1):
            v = c.strip().strip('*`：: ')
            if not v or re.fullmatch(r'\{[^}\n]{0,40}\}', v) or any(p in v for p in COST_PLACEHOLDER):
                cands.append(f'· 检查 M 留痕表第 {i} 行第 {j} 格为空或占位: {c[:40]}')
    return cands


# 检查 I 的 §二 腿（2026-09-17 加）：改动清单**位置格**内的 `路径:行号`。
# **只按格解析**——路径与行号须在**同一格内相邻**（故本正则不带行首锚，逐格 finditer）；
# 实测「跨行继承路径上下文」的写法在本仓语料上成片假阳（098→338 条），故**不继承**。
CHANGE_POS = re.compile(r'`?([\w./\-]+\.(?:md|py|sh|js|jsonc|json))`?[:：](\d+)')


def _change_position_probe(text, root, seen, cands):
    """§二 改动清单**位置格**核：① 行号 ＞ 实有行数 ② 指向空行（两者皆**硬事实**，恒判）。
    路径不实存者静默跳过（示例串／未落地的新增件不产噪声）。返回**核过的引用处数**。

    事故出身：检查 I 的 docstring 原把本射程的扩展挂成**待触发条件**（等出现 F 行位置过时的事故才
    评估），而该条件实测已满足四次（098 P0-4／100 P0-1／108 P0-1／110 P2-2）——把触发条件写在注释里
    而无观察机制，等于没有条件。"""
    sec = _section(text, CHANGE_SECTION)
    if not sec:
        return 0
    refs = 0
    for raw in sec.split('\n'):
        s = raw.strip()
        if not s.startswith('|'):
            continue
        cells = [c.strip() for c in _CELL_SPLIT.split(s.strip('|'))]
        if all(re.fullmatch(r':?-{2,}:?', c) for c in cells if c):
            continue
        for cell in cells:
            for m in CHANGE_POS.finditer(cell):
                path, ln = m.group(1), int(m.group(2))
                full = os.path.normpath(os.path.join(root, path))
                if not os.path.isfile(full):
                    continue
                refs += 1
                key = ('§二', path, ln)     # 与 §一 腿的 (path, ln) 不撞
                if key in seen:
                    continue
                seen.add(key)
                try:
                    with open(full, encoding='utf-8', errors='replace') as f:
                        lines = f.read().split('\n')
                except OSError:
                    continue
                if ln > len(lines):
                    cands.append(f'· 检查 I §二 位置行号超出文件: {path}:{ln}（该件实有 {len(lines)} 行）')
                elif not lines[ln - 1].strip():
                    cands.append(f'· 检查 I §二 位置指向空行: {path}:{ln}')
    return refs


def static_report(specs, root):
    """静态检查阶段编排：打印 == 静态自检 == 与逐项结果。
    **返回值恒为 False**：静态发现（A／B／C／D／E／H／I／J／K／M 十类）一律只呈报、不置退出码（源件对
    「计数不符」置 1，本仓改为恒 0——`AGENTS.md` §五.2 候选永不拦截）。
    末尾三种结果判定标准**须计入 A／B／C／D／E／H／I／J／K／M 十类全部输出**（含 B 的计数行、C 的候选行与 E 的候选行、
    F8 的格数不符行、**J 的审查记录核对**候选行、**M 的留痕表**候选行；**E／H／I／J／K 的汇总行不计入**——其角色同明示行）：「· 无发现」只在十类
    全空时打印——漏计 B 即假绿（产物审查 P0-2：B 单源时「计数不符」与「无发现」同屏）。
    空跑明示：A 在「提取 N＞0 而命中 0」时打印明示行（并抑制「· 无发现」，两者不同屏）；B 在无可判定
    声称时打印明示行；C 在存在「有核对面但路径未解析」的行时打印计数行。"""
    print('== 静态自检 ==')
    swallow = []
    k_lines, _k_reds = check_template_names(root)   # 检查 K：全局一次（不逐件）
    for _l in k_lines:
        print(_l)
    extra = list(k_lines)   # 检查 C／D／E／H／I／J／K／M 候选与 F8 格数不符输出（非阻断；末尾三种结果判定标准须计入，不得被「无发现」掩盖）
    counts = []     # 检查 B 的计数输出（同上：P0-2 修复前漏计，导致 B 单源时与「· 无发现」同屏）
    a_extract = a_hit = 0
    b_judged = b_cand = 0
    for spec in specs:
        if os.path.basename(spec) in NEVER_SCANNED:
            print(f'· 跳过（非规格件，模板内嵌本节标题）: {spec}')
            continue
        if len(specs) > 1:
            print(f'-- {spec}')
        with open(spec, encoding='utf-8', errors='replace') as f:
            text = f.read()
        _cell_mismatch_reset()    # 格数校验暂存（093 批 F8）：逐件起始处清空，不沿用上一件残留
        a_lines, extracted, hits = check_swallow(text, root)
        count_lines, judged, cand = check_counts(text, root)
        c_lines = check_pairs(text, root, spec)
        d_lines = check_writing(text, spec, root)
        # 检查 E（077 批 F1）：两列表分岔——候选行并入 `extra`（⇒ 计入末尾三种结果 `发现的问题`），
        # 汇总行只进下方的逐件打印串（**不计入**——漏计则三种结果少计，多计则计数行多于屏上明细）。
        e_lines, e_summary = check_reconcile(text, root)
        # 检查 H：计算方式同 E（候选并入 `extra`、汇总只打印）；无 §七 逐条确认节、
        # 或节内数不出状态列时**两表皆空**，该件对该项完全静默（不误报的判定标准落在字面上）。
        h_lines, h_summary = check_nuclear(text, root)
        # 检查 I（2026-09-16 加）：计算方式同 H（候选并入 `extra`、汇总只打印）；无 §一 现状位置节时
        # 两表皆空，该件对该项完全静默（不误报的判定标准落在字面上）。
        i_lines, i_summary = check_anchor(text, root)
        # 检查 J（2026-09-16 加）：计算方式同 H／I（候选并入 `extra`、汇总只打印）；无「审查记录」节时
        # 两表皆空，该件对该项完全静默（不误报的判定标准落在字面上）。
        j_lines, j_summary = check_archive_record(text, root)
        # 检查 M（2026-09-17 立）：**只有候选、无汇总行**，故只并入 `extra`；无 §四 规格自审节时
        # 返回空表，该件对该项完全静默（不误报的判定标准落在字面上）。
        m_lines = check_audit(text)
        swallow += a_lines
        extra += c_lines + d_lines + e_lines + h_lines + i_lines + j_lines + m_lines
        counts += count_lines
        a_extract += extracted
        a_hit += hits
        b_judged += judged
        b_cand += cand
        for line in (a_lines + c_lines + d_lines + count_lines + e_lines + e_summary
                      + h_lines + h_summary + i_lines + i_summary + j_lines + j_summary + m_lines):
            print(line)
        # 格数校验（093 批 F8）：`_change_rows()` 判出的「格数与表头不符」行——**件名与行号在此补**
        # （该函数只入参 text、无件名上下文，且 5 处调用点的签名与既有行为不得变更）；行号按行原文在
        # 本件文本内的**首个**出现位置取（表内重复行取首现，仍是可检索的定位符）。
        # 行收集进 `cell_lines` 并并入 `extra`（计数入末尾三种结果）——修前系裸 print，
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
    # 检查 A 空跑明示：触发点＝「提取 N＞0 而命中 0」（源件的「提取数＝0」在本仓真规格上不可达）
    if a_extract and not a_hit:
        print(f'· A：提取 {a_extract} 条断言、命中 0 条——判定标准未适配本仓形态？')
    # 检查 B 空跑明示：候选配对数为 0 时明示；有可判定声称时给命中计数行
    if b_judged:
        print(f'· B：判定 {b_judged} 条整件尺寸声称'
              + (f'（另有 {b_cand} 条非整件计算方式声称未判）' if b_cand else ''))
    elif b_cand:
        print(f'· B：未提取到可判定的尺寸声称（{b_cand} 条非整件计算方式声称未判）')
    else:
        print('· B：未提取到可判定的尺寸声称')
    warn = [l for l in swallow if l.startswith('· 自我匹配预警')]
    # 中性行（哨兵型汇总行与「目标文本未提及且现行为 0」行）同为发现项：计入末尾三种结果计数
    sentinel = [l for l in swallow
                if l.startswith(('· 现行有值／目标文本未提及', '· 目标文本未提及且现行为 0'))]
    # 零命中待复核（F2）同属检查 A 的发现项：漏计则「· 有预警 N 条」少计、屏上发现行多于计数行
    zero = [l for l in swallow if l.startswith('· 零命中待复核')]
    # 零命中核对未判（072 F1）：期望子句多值且与命令无法对齐——同为检查 A 的发现项，同理须计入
    # （否则新支路的产出在汇总里隐形，与「修缺口」的立法目的相悖）
    undecided = [l for l in swallow if l.startswith('· 零命中核对未判')]
    # 计算方式不可判（109 F2）：token 含 BRE 真正特殊的元字符、字面计算方式测不出「现行」值——同为检查 A 的发现项，
    # 须并入 发现的问题（否则「屏上有行、汇总少计」同型）
    uncountable = [l for l in swallow if l.startswith('· 计算方式不可判')]
    发现的问题 = warn + zero + undecided + uncountable + sentinel + extra + counts
    if 发现的问题:
        # 中性汇总行（哨兵型／归零型不可区分态）与检查 B／C／D／E 输出同为发现项：计入本行，不落「无发现」
        _cls = [('自我匹配预警', warn), ('零命中待复核', zero), ('零命中核对未判', undecided),
                ('计算方式不可判', uncountable), ('中性/哨兵', sentinel)]
        # T5-3（2026-09-17）：分类计数**追加在既有汇总行末**（不新增行、不截断明细，零风险降噪）
        _tail = '｜分类：' + '｜'.join(f'{k} {len(v)}' for k, v in _cls if v) if 发现的问题 else ''
        print(f'· 有预警 {len(发现的问题)} 条'
              f'（非阻断，请人工核对预测与到位期望）{_tail}')
    elif a_extract and not a_hit:
        # 提取＞0 而命中 0：每个断言都落「跳过」（＝未命中任何可解析目标），与真阴性区分（假绿通道的
        # 可见化）；同时抑制「· 无发现」——两者不得同屏（空跑明示行已在上方打印）
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


def verify_report(spec, root):
    """核验比对模式（--verify）：两项比对，返回 True 表示有阻断项。只读规格、磁盘与 git status
    （只读子命令），不执行规格内任何命令、不写任何文件。
    1) 改动文件比对——规格改 动清单节内的路径声明集 ↔ `git status` 实际改动集（双向差集；非阻断提示）；
    2) 过程产物两项——`CHANGELOG` 条目（含规格号）与归档件（`docs/specs/archive/` 内），缺任一即阻断。
    **早期的清单式表结构检查已整块删除**（`collab-log` 与登记表机制已废，见 `施工机制` §三／§七——现不建任何平行清单）；
    `--verify` 不进 `check.sh` 提交前自动检查（提交前自动检查运行点在制规格尚未归档，过程产物检查必然不符）。"""
    path = os.path.abspath(spec)
    name = os.path.basename(path)
    rel = os.path.relpath(path, root).replace('\\', '/')
    with open(path, encoding='utf-8', errors='replace') as f:
        text = f.read()
    m = re.match(r'(\d{3})', name)
    spec_no = m.group(1) if m else name
    blocking = False

    # 1) 改动文件比对（非阻断提示）
    # 2026-09-17 T5：与 `--reconcile` 共用同一实现（单一出处；原为两处各写一遍）
    changed = _git_changed(root)
    if changed is None:
        print('x 改动面未核：git 不可用（本模式结论不可信）', file=sys.stderr)
        return True     # 环境缺失＝阻塞（与「空改动」区分：后者会给出「清单外 0 件」的假安心）
    declared = _declared_paths(text)
    actual = {p for p in changed if p != rel}   # 豁免②：待验规格自身恒在改动集内
    print('· 改动文件比对（声明集 ↔ 实际改动集；非阻断提示）')
    for p in sorted(declared - actual):
        print(f'  · 声明但未动: {p}')
    for p in sorted(actual - declared):
        print(f'  · 动了但未声明: {p}')
    if declared == actual:
        print('· 改动文件一致')

    # 2) 过程产物两项（阻断）——未落过程产物即核验未完成
    print('· 过程产物两项')
    cl_path = os.path.join(root, 'CHANGELOG.md')
    hits = []
    if os.path.isfile(cl_path):
        with open(cl_path, encoding='utf-8', errors='replace') as f:
            # 条目行判定标准与内容轨的限长守卫统一：列表符起首
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


def _git_changed(root):
    """实盘改动件（只读 git；`core.quotepath=false` 保证中文路径不被转义加引号）。
    返回排序后的仓根相对路径列表；git 不可用返回 None。`.tmp/` 不计（`AGENTS.md` 红线 2）。"""
    out = set()
    for cmd in (['diff', '--name-only', 'HEAD'], ['ls-files', '--others', '--exclude-standard']):
        r = subprocess.run(['git', '-c', 'core.quotepath=false'] + cmd, cwd=root, capture_output=True)
        if r.returncode != 0:
            return None
        out |= {n for n in r.stdout.decode('utf-8', 'replace').split('\n') if n.strip()}
    return sorted(x for x in out if not x.startswith('.tmp/'))


def _declared_paths(text):
    """**声明改动文件**＝§二 文件级改动清单各行「文件:位置」列里抽出的件级路径（两模式共用同一计算方式：
    `--reconcile` 的清单外判定与 `--verify` 第 1 项；**不取正文里的一切路径**——正文提及≠声明改动，
    取宽会把「声明但未动」刷成噪声，2026-09-17 T5 自审修）。"""
    return {m.rstrip('.,;:，。；：') for r in _change_rows(text)[0]
            for m in PATH_TOKEN.findall(r['path'] or '')}

def reconcile_report(specs, root):
    """**核验第 1 步机械化**（2026-09-17 T5 加）：实盘改动文件 ↔ 规格声明面核对（**候选非阻断**）。

    判定标准：取 `git diff --name-only HEAD` ∪ untracked（`.tmp/` 不计，`AGENTS.md` 红线 2），逐件核——
    该件是否在规格正文出现过（件级路径串）；**未出现者＝「清单外改动件」候选**。本件自身不计。
    用途＝把「核验第 1 步：`git status` 逐 hunk 对照规格清单」的一半（件级完整性）交给机器；
    hunk 级与语义面仍归人（行级机械化会被编辑位移搞脆，见实测）。
    **只读 git**：`diff --name-only`／`ls-files --others`，不写索引、不改仓库。"""
    changed = _git_changed(root)
    if changed is None:
        print('x --reconcile: 只读 git 子命令失败（须在 git 仓库内运行）', file=sys.stderr)
        return 2
    for spec in specs:
        with open(spec, encoding='utf-8', errors='replace') as f:
            text = f.read()
        rel = os.path.relpath(os.path.abspath(spec), root).replace('\\', '/')
        declared = _declared_paths(text)
        foreign = [f for f in changed if f != rel and f not in declared]
        print(f'· 核验① 实盘改动 {len(changed)} 件｜本件声明 {len(declared)} 件｜**清单外 {len(foreign)} 件** @ {rel}')
        for f in foreign:
            print(f'· 核验① 清单外改动件: {f} —— 未在规格正文出现（件级）；hunk 级与语义面仍须人工过')
    return 0


if __name__ == '__main__':
    args = sys.argv[1:]
    static_only = '--static' in args
    verify_only = '--verify' in args
    reconcile_only = '--reconcile' in args
    if sum((static_only, verify_only, reconcile_only)) > 1:
        print('x --static／--verify／--reconcile 互斥，请择一（参数错误）', file=sys.stderr)
        sys.exit(2)
    specs = [a for a in args if a not in ('--static', '--verify', '--reconcile')]
    if not specs:
        # 零位置参数＝无在制规格（提交时规格已在验收后归档，属预期常态）：明示跳过、退出 0
        _stdout_utf8()
        print('无在制规格，跳过')
        sys.exit(0)
    missing = [a for a in specs if not os.path.isfile(a)]
    if missing:
        for a in missing:
            if os.path.isdir(a):
                print(f'x 是目录不是文件: {a}（规格须是单个 .md 文件）', file=sys.stderr)
            else:
                print(f'x 文件不存在: {a}', file=sys.stderr)
        sys.exit(2)
    _stdout_utf8()
    if reconcile_only:
        root = repo_root()
        if root is None:
            print('x 无法定位仓库根（核对基准不可用）', file=sys.stderr)
            sys.exit(2)
        sys.exit(reconcile_report(specs, root))
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
    root = repo_root()
    if root is None:
        print('x 无法定位仓库根（静态检查路径解析基准不可用）', file=sys.stderr)
        sys.exit(2)
    static_report(specs, root)
    sys.exit(0)     # 静态发现恒 0（仅呈报；退出 1 只属 --verify 的过程产物缺失）
