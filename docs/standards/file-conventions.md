# 文件规范（Abzu 仓库命名与格式总表）

> 版本：v0.15（沿革见 CHANGELOG 与 git 历史）
> 定位：仓库所有文件类型的命名规则与格式模板的**单点权威**。新增文件前先查本表；类型未覆盖 → 走 [AGENTS.md](../../AGENTS.md) §4 决策树，裁定结果**回写本表**。
> 与术语表分工：[术语表](../glossary.md)管产品语言的叫法（面向使用者），本文件管文件系统的命名与格式（面向开发者）。

---

## 一、命名总表

| 文件类型 | 命名规则 | 示例 | 位置 |
| --- | --- | --- | --- |
| skill 壳 | `SKILL.md`（固定名，每域一壳） | — | `skills/abzu-{域}/` |
| references 域子目录 | 六域 kebab-case（共享知识库由 setup 物化进书项目，不放仓库 references/） | `skills/abzu-scan/references/scan/`、`skills/abzu-analyze/references/analyze/` | `skills/abzu-{域}/references/` |
| 域工作流 | `{域}-workflow.md` | `scan-workflow.md`、`analyze-workflow.md` | `skills/abzu-{域}/references/{域}/` |
| 阶段方法论 | `{域}-stage-{阶段名}.md` | `write-stage-drafting.md` | `skills/abzu-{域}/references/{域}/` |
| 域内参考文件 | `{域}-{主题}.md`，主题描述性命名 | `scan-cdp-base.md`、`analyze-method.md`、`analyze-structure-blocks-spec.md` | `skills/abzu-{域}/references/{域}/` |
| 模板 | `{域}-{产物名}-template.md`，默认独立成文件（内嵌仅限 ≤10 行微型模板，**按 markdown 源码行数计**） | `scan-topic-decision-template.md`、`analyze-six-dimensions-template.md` | `skills/abzu-{域}/references/{域}/` |
| 运行时脚本 | `{动词}-{对象}.{sh,py,js}` | `qidian-rank-scraper.js`、`build-chapter-index.js` | `skills/abzu-{域}/scripts/` |
| 共享库 | `{名词}-utils`（扩展名随表注口径：js/sh 连字符、py 下划线），被同域脚本 require，不直接执行 | `cdp-utils.js` | `skills/abzu-{域}/scripts/` |
| 用户产物（拆书） | `拆书/{书名}/` 目录，产物中文命名（双语纪律 §二） | `拆书/{书名}/六维拆书_{书名}.md` | 用户工作目录（不进仓库） |
| 拆书 CSV | 固定中文名 | `章节索引.csv`（五列，脚本产物）、`结构块.csv` | `拆书/{书名}/` |
| 用户产物（扫榜） | `扫榜/{平台}{方向}_{YYYYMMDD}/` 目录，产物中文命名（双语纪律 §二） | `扫榜/起点都市高武_20260901/选题决策.md` | 用户工作目录（不进仓库） |
| 开发守卫 | `check-{对象}.{sh,py,js}` | `check-frontmatter.py` | `scripts/`（仓库级） |
| 开发测试 | `test-{对象}.{sh,py,js}` | （**无实例，预留类目**：`scripts/` 下暂无 `test-*` 实例；**预立法，随首批实例校准**） | `scripts/`（仓库级） |
| 规格 | `{序号NNN}-{YYYY-MM-DD}-{中文主题}.md`，序号按立项顺序三位递增、永不复用；主题用中文（作者面向的治理记录）；**同批附件**（随主规格产出的并列文档）沿用主规格序号、以语义后缀区分（如 `030-…-mo-shu架构评估报告.md`），不另编序号 | `013-2026-09-06-多技能骨架切换.md` | `docs/specs/`；**实施验收全部通过后移动至** `docs/specs/archive/`（移动不留副本）；**作废批**（规格前提失效未施工）同移入 archive，文件名追加 `-已作废` 后缀并在正文头注标废（正例：`archive/046-2026-09-11-机制闸先行批-已作废.md`） |
| 工程规范 | 英文 kebab-case | `file-conventions.md`、`markdown-style.md` | `docs/standards/` |
| 项目参照 | 英文 kebab-case | `glossary.md`、`test-prompts.md` | `docs/` |
| 根目录治理文件 | 固定名（生态惯例） | `AGENTS.md`、`README.md`、`CHANGELOG.md`、`LICENSE` | 仓库根 |
| 根目录工程配置 | 固定名（工具惯例） | `.gitignore`、`.gitattributes`、`.markdownlint-cli2.jsonc` | 仓库根 |
| 设计文档 | 中文命名，按产品线/阶段立件 | —（现有《大纲阶段设计文档》与《大纲阶段追踪档》两件） | `docs/product/` |
| 命令薄壳（预留） | `abzu-{路由键}.md`，单行内容 `abzu skill {路由键}`；多域上线、分发方案裁定后启用——**启用前不得新增实例** | — | `.claude/commands/`（现无实例） |
| 架构决策记录 | `architecture.md`（固定名，长期文档） | — | `docs/` |
| agent 设计规范 | `agent-design.md`（固定名，长期文档） | — | `docs/standards/` |
| agent 文件（预留） | `abzu-{角色名}.md`，YAML frontmatter（name/description/tools/model）；T1 触发后启用——**启用前不得新增实例** | — | `.claude/agents/`（物化目标，仓库内源码位待 T1 定） |
| 协作日志 | `collab-log.md`（固定名，逐次登记规格施工记录与协作模板） | — | `docs/specs/` |
| 挂账台账 | `open-items.md`（固定名，活账本） | — | `docs/specs/` |

> 表注（扩展名口径）：`.py` 文件用 snake_case（下划线，Python 惯例），`.sh` / `.js` 用 kebab-case（连字符）——上表运行时脚本/开发守卫/开发测试三行规则列之 `.py` 后缀以本表注为准（`{动词}-{对象}` 连字符式仅适用于 sh/js；立法时虚拟示例 `check-frontmatter.py` 未与实件对齐，实件对照为 `check_content.py`）。

### 脚本编写规范（运行时脚本必守）

| 规则 | 内容 |
| --- | --- |
| 退出码 | `0` 成功 / `1` 违规 / `2` 参数或环境错误（三分类，缺/空/坏各明示） |
| 错误输出 | 错误写 `stderr`（`console.error`），数据写 `stdout`（`console.log`），不混流 |
| 输入校验 | 命令行参数缺失或非法时输出用法说明并退出 2，不静默使用默认值 |
| 输出格式 | 结构化数据用 Markdown（对照 scan-output-format），日志用纯文本，禁 JSON 散落 stdout |
| 降级声明 | 脚本头部或域文档声明依赖缺失时的降级行为（如 CDP 不可用→降级 SSR） |
| 编码 | 读写文件显式指定 encoding（如 `gb18030` / `utf-8`），不依赖系统默认 |
| 限速 | 对外部网站的请求间隔 ≥ 2 秒，失败退避重试 ≤ 3 次（2s/4s/8s） |

> **域前缀适用判据**：`{域}-` 前缀适用于**主题名域相对、需消歧**的文件（skill 资产——装入用户机器、被路由键检索，如 `scan-genre-trends.md`）；名字已全局自描述的治理文档（`docs/` 下全部文件，如 `markdown-style.md`）不加前缀——位置由文件夹表达，名字表达内容。未来 `common/` 公共层文件命名同用此判据。

## 二、双语命名纪律

- **英文 kebab-case**：skill 目录、references、脚本、守卫——开发者可见的一切；规格主题部分用中文（作者阅读的治理记录）。
- **中文名**：写作项目（用户的书目录）内的产物文件，如 `卷纲_第1卷.md`、`人物卡_林晚.md`——由 skill 运行时创建，**不进本仓库**；命名细则将由立项域（outline）的 project-structure 规范定义（未建，安放方案见 architecture.md §三）；例外：`docs/product/` 设计文档中文命名（作者面向的产品文档类目）。
- 路径分隔符一律正斜杠（跨平台；反斜杠在 Unix 上失效）。

## 三、跨文件引用格式

| 场景 | 格式 | 示例 |
| --- | --- | --- |
| 同目录文件（仓库治理文档） | Markdown 链接 | `[file-conventions.md](file-conventions.md)` |
| 跨目录文件（仓库治理文档） | Markdown 链接（含相对路径） | `[架构对齐](../specs/archive/007-2026-09-05-架构对齐.md)` |
| skill 资产内引用（无论同目录跨目录） | 禁链接与裸文件名，用 skill 根相对路径文字 +「节名」 | `references/scan/scan-analysis-guide.md`「扫榜报告模板」节 |
| 文件名提及（无需跳转） | 行内代码 | `` `SKILL.md` `` |
| 指定小节（治理文档） | 文件名 + 「节名」 | `AGENTS.md`「红线」节 |

规则（按资产域分区）：**skill 运行时资产**（`references/`、`scripts/`）禁跨目录链接——部署副本会断链，必须自包含（此规则出身 mo-shu，仅适用于运行时资产）；**仓库治理文档**（根目录、`docs/`）允许跨目录 Markdown 链接——它们在编辑器与 GitHub 中阅读，链接是可用性加分。references 之间不互相链接（一层深纪律，见宪法 §7）。未来守卫待办：check.sh 可增「扫描 references 内相对 .md 链接」检查项。

## 四、SKILL.md frontmatter 格式

```yaml
---
name: abzu-scan
description: <第三人称；能力名词化句 + 触发句（仅显式调用）+ 边界句，三段式见 skill-writing §一；不超过 1024 字符>
license: MIT
metadata:
  version: "0.1.0"
---
```

约束（Agent Skills 开放规范）：`name` 小写字母/数字/连字符，≤64 字符，不以连字符开头或结尾，须与目录同名；`description` 非空 ≤1024 字符（须含做什么与何时使用）。校验（pip 包 `skills-ref`，命令行入口为 `agentskills`）：一键入口 `bash scripts/check.sh`（[0] skills 真目录守卫 + [1] 六壳 validate + [2] markdownlint + [3] 内容轨 + [4] 规格静态自检）；单壳直调 `agentskills validate skills/abzu-{域}`。

## 五、内容规范矩阵（按文件类别——同类文件同类内容）

> 定位：矩阵是路由层——每类文件的完整模板与细则在「结构真源」列所指处，本表管分类全覆盖与速查；**具体行优先于泛类行**（如 collab-log 归台账类行，不从治理文档行）——新增文件类别时回写本表（§六维护条款同辖）。风格依据如实分三类标注：architecture §七 权威层（T0/T1/T2）、语言业界权威（PEP、Google Shell Style Guide——语言生态官方/通行规范）、仓库内部规范（markdown-style 等）——不虚标分级。

| 文件类别 | 结构/内容真源 | 头部规范 | 风格依据 | 机检 |
| --- | --- | --- | --- | --- |
| SKILL.md 域壳（已建域） | skill-writing.md §三「域壳模板」 | frontmatter 四键（name/description/license/metadata.version） | T0 Agent Skills 开放规范；skill-writing §一 | agentskills validate（check.sh [1]） |
| SKILL.md 域壳（占位域） | skill-writing.md §三「占位壳模板」 | 同上（version 起始 0.1.0；description 含未建设四要素） | 同上 | 同上 |
| 域工作流 {域}-workflow.md | skill-writing §三 workflow 模板 | 头部两行声明（消费点/边界，skill-writing §六.3） | T1 superpowers 元规范；skill-writing §五 | check_content.py（TOC/加粗/引用闭合） |
| 方法论 {域}-{主题}.md | skill-writing §三 方法论底线与子类 | 同上 | 同上 | 同上 |
| 产物模板 {域}-{产物名}-template.md | skill-writing §三 模板四段式 | 同上 | 同上 | 同上 |
| 运行时脚本与共享库（skills/*/scripts/*.js） | 无统一正文模板（工具程序） | 脚本文档头四要素（§五.1；共享库的「用法」段为导出函数清单） | 仓库既有惯例（Node 工具脚本无单一业界权威，如实标注）＋§一「脚本编写规范」契约 | node --check + 契约对照（审查轨） |
| 开发守卫（scripts/ 下 .sh/.py） | 无统一正文模板 | 同四要素（# 注释块 / 模块 docstring，形态随语言） | .sh 参考 Google Shell Style Guide；.py 遵循 PEP 8 与 PEP 257 | check.sh 实跑即验 |
| 治理与门面文档（AGENTS/README/docs/**.md） | 各文档自身节序 | 头注三行式（§五.2；AGENTS 内容型头部与 README 门面文档豁免） | markdown-style ＋ 中文文案排版指北（语言业界权威） | markdownlint + 引用闭合（check_content 治理段） |
| 规格（docs/specs/**） | 三要素 + 规格自审记录（宪法 §3.1/§3.8） | 背景引言（自包含声明） | 宪法 §3；collab-log 协作模板 | 规格成稿审查（collab-log「独立审查分身」节）＋产物审查（触发线以上）＋静态自检（check.sh `[4]` 段） |
| 台账类（docs/specs/collab-log.md、docs/specs/open-items.md） | 各件自身节序（collab-log：协作模板 + 核验协议 + 施工记录；open-items：挂账清单七分组表） | 头注两行式（定位/纪律，裸键，不设版本行——细则与豁免清单见 §五.2） | 宪法 §2 文件账本律 + §3.8 协作协议 | 追加登记时规划方自核 |
| 工程配置（.jsonc/.gitignore/.gitattributes/.json） | 工具官方 schema | 顶部一行用途注释（纯 `.json` 语法无注释位，豁免——用途由字段自明） | 工具官方文档（T0 per tool） | — |

### §五.1 脚本文档头四要素（sh＝# 块 / py＝docstring / js＝JSDoc——要素相同，形态随语言）

1. **用途**：一行——做什么、给谁用（消费方）。
2. **用法与参数**：调用命令示例 + 参数表（含默认值）；与 §一「输入校验」行（缺参→用法说明+退出 2）呼应。
3. **依赖与前置**：外部依赖、环境要求、降级路径（对齐 §一「降级声明」行）。
4. **维护入口**：平台改版/字段变更时改哪里（选择器位置、解析函数名）——012 号「平台改版维护入口」注释块的成文化。

四要素为目标清单，**顺序不强制**（既有头部结构按补缺处理，不重排）。

≤10 行的微型守卫（如 `hooks/pre-commit`）四要素可合并为两行：用途一句 + 维护指向一句。

### §五.2 治理文档头注三行式（默认形态）

> 版本：vX.Y（沿革见 CHANGELOG 与 git 历史）
> 定位：……（角色一句话，含单点权威声明如适用）
> 依据：……（architecture §七 权威层 / 语言业界权威 / 仓库规范，如实标注）

（键名不加粗——在役治理文档统一裸键，归档件豁免；个别文档可加分工/配套类附加行（如本文件与术语表分工、architecture 配套行）；参照型文档第三行可用「用法」等变体行；治理文档 bump 语义：实质内容修订 minor、纯措辞 patch；两段制 minor 按数值递增（v0.9 → v0.10），不按字符串序比较。）

版本制分工：治理文档用两段 vX.Y（本节 bump 语义管辖）；skill 套件发布用三段 X.Y.Z（release-and-versioning §二「四处一致」辖套件发布版本，不含治理文档头注 vX.Y）——两制各管其域，互不换算。

**变体豁免**：活账本类文件（`collab-log.md`、`open-items.md`）用两行式头注（定位／纪律，裸键），**不设版本行**——逐次追加的账本无版本语义，与台账类豁免同源。

## 六、本规范的维护

- **新增文件类型**：决策树裁定 → 回写本表（命名规则 + 示例 + 位置）。
- **修改命名规则**：先全仓 grep 涟漪面（改名/移动文件须同步更新全部引用）。
- **退役文件/概念**：从表中删除行，退役记录进 CHANGELOG。
- **对齐类改动先审标准后审文件**：对齐批第一步核对标准条文自身的实文依据，再审文件符合度——2026-09-07 立例：命名总表虚拟 py 示例（023 抓出）、矩阵加粗键标杆系审查误报（025 抓出），两次均是标准错而非文件错。
