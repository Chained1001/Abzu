# Changelog

本文件记录 Abzu 的显著变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

- 020 号检查脚本外审修正（check.sh 双轨评审 12 项裁定：3 采纳/8 拒绝/1 已覆盖；python -m 方案实测否决附 F1/F4）——探测链补 Unix 用户安装路径、npx 失败补安装提示、set -o pipefail（呼应反模式 #6）；拒绝增量/并行/nullglob 类各附理由（约 50 文件实测 4.2s 秒级 + 守卫简单性优先）。
- 断言预验立法（宪法 §3.8 铁律④ + collab-log 第八件套四查③，作者裁定豁免批直落）：验收断言写进规格前逐条实际跑一遍并核对与自家 [A] 文本不互斥，无法预验标注「未预验」交审查分身重点核验；清单末对照过程产物三件（CHANGELOG/collab-log 登记/归档）防验收互斥。立例：020/021/022 三批断言自噬连击（吞替换文本/对象计数错/零命中吞立例句），015/017/020 验收漏过程文件同根。
- 018 号前作引用降级裁定落盘——四份 standards 依据行去 mo-shu、release §四 兼容四原则句撤销 mo-shu 背书、architecture 调研列表/设计参考句清理、§七 外部参考纪律立法（只引 T0/T1/T2；mo-shu 限沿革与教训出处）、file-conventions 惯例句清理；沿革类引用（AGENTS.md 出处标注、architecture §二 失败数据、题材卡内容资产移植）保留。
- 019 号宪法重构（宪法外审 12 项发现逐条裁定：4 采纳/2 已覆盖/6 拒绝留痕）：§3.8 重构为总起句 + 四子弹点子列表结构——「大型」门槛退役（改按 §3.1 判定表划线）、施工分身为默认形态（外部窗口双开降备选）、协议细则下沉 collab-log 去重（016 挂账销账）、模板件数枚举去除（collab-log 定位行为唯一真源）；§3.6 补 D1/D2/D3 内联定义（孤儿术语成文，对齐 collab-log 审计结论模板字段）；头部内联定义声明扩展（术语首次出现处内联定义或指向单点权威文件）；拒绝项亮线留存（<5 行门槛/预热/锚点索引/决策流等各附理由）。
- 017 号协作流程外审修正（三份外审 20 项发现合并裁定：9 采纳/6 已覆盖/5 拒绝）：collab-log 施工与施工分身两模板合并为一（分身为默认形态、外部窗口降备选形态，协作模板八件套→七件套，件套序号词退役改用模板名指称，宪法 §3.8 两处同步）；findings 处置表增「实例」列（P0/P1/P2 各内联一真实例）并修正「规划分方」笔误；核验协议第一步补副作用文件口径（.gitignore 忽略产物不计 P0）；施工记录表注统一「自由度分布」统计口径 + 行 3 瘦身；独立审查默认工序补 agent-design 判据摘要句、平凡豁免改触发线补集定义（<5 项且全 [A] 免审）、增初稿质量门槛（审查 findings 中 P0 ≥2 修订后须重审再交作者确认）；审查报告与核验请求模板增首行摘要要求；纪律行补「每满 10 条施工记录 P1 成因聚类回顾」。
- 016 号治理外审修正与复盘追认：015 复盘固化三件随本批入库并追认为合法豁免批次（宪法 §3.1 外部参考研究条款 + §3.8 协作模板七件套同步、glossary 增「调用双层」、collab-log 参考研究裁定表第七件套 + 行 4 施工记录）；宪法 §3.1 判定表增豁免行（复盘驱动的治理微调 ≤3 文件/作者会话内逐项确认/CHANGELOG 留痕 → 免规格直接做）；外审 7 P1/5 P2 逐条裁定落地——skill-writing 维护节改「十」（双「## 九」修复）、file-conventions 断链示例补相对路径 + 校验句更新（check.sh 一键入口 + 单壳直调）、agent-design 版本行统一「沿革见 CHANGELOG」句式、AGENTS.md §0 探测链指向 check.sh + §3.6 段落分隔、collab-log 核验协议补批次扩展句 + 行 4 终态 + 「全绿≠没问题」边界声明、012/014 归档规格补验收尾注、README 增 2 挂账（加粗密度扩展治理文档须另行立法/§3.8 下沉评审）；「独立审查分身」由可选增强改立为规格成稿默认工序（非平凡规格必须 fresh 分身先审，013/015 事故立例）+ collab-log 新增独立审查分身提示词（第八件套）；check.sh npx -y 改 --no-install（014 D4 真正闭环，守卫此后零联网）；check_content.py 引用闭合扫描扩至治理文档（AGENTS/README/docs 相对链接须解析存在）。
- 015 号参考研究施工（mattpocock/skills 专项，20 项发现全裁定，首次模板派生 spawn 分身闭环）：architecture 增调用双层原则（六域 skill 一律 model-invoked、skill 间禁互调、预留薄壳若启用即 user-invoked 编排层）+ setup 硬依赖/软配置职责边界 + §七 T1 收录与调研采纳行；README 增「解决什么问题」失效模式导览（5 类写作失效→六域映射，仅 scan 标可用）+ Roadmap 2 挂账（大纲域书目录共享语言/正文域会话交接契约）；release-and-versioning 发布五步改六步（增插件清单预检可选步 claude plugin validate）+ §七 marketplace.json 表述对齐实况（已入库待提交）+ 版本 v0.3。已覆盖 7 项（双轴分身/术语表/引用一层深等）与拒绝 8 项（跨宿主 openai.yaml/changesets/docs 镜像/ADR 目录/wizard/工单流水线等）留痕规格 015。
- 014 分身首跑复盘三纪律入宪法 §3.8：①规格现状锚点必须现场 grep/read 确认，禁沿用对话记忆（014 号 3 处锚点过时立例）②施工提示词一律从 collab-log 模板派生，核验请求须单代码块包裹 ③规格确认后规划方主动 spawn 施工分身，不退回作者粘贴中转；collab-log 补 014 施工记录行（补记 ec17cce 提交信息声称但漏记的入库项，反模式 #8 又一实例）；014 号规格核验通过归档（同 012/013 例）。
- 014 号检查管线优化施工完成（首次施工分身闭环）：check.sh 支持 --staged 增量模式；core.hooksPath = scripts/hooks（免手动安装 hook，入库即生效）；.claude-plugin/marketplace.json 确认合规；清理旧手动安装 hook 副本。核验三步全绿（独立分身首跑闭环：spawn 施工→返回核验请求→规划方核验通过）。
- check.sh 升级：引用闭合/加粗密度/TOC 检查从对话中的临时脚本固化为 scripts/check_content.py（独立可复用），check.sh 调用之；修复路径错误（skills/ → scripts/）；修复 TOC 检查变量遮蔽 bug（content 列表被二次 split）。
- §3.8 增补施工分身模式（作者提议）：规划方可 spawn 施工分身替代外部窗口施工——作者从"中转"升级为"纯裁决"；collab-log 新增施工分身提示词模板（第六件套→协作模板六项），宪法引用同步。
- 治理文档全面同步（013 骨架切换遗留清理）：architecture §二 选型表标注已被多技能裁定取代/§六 中央路由句改为各壳入口自查/§五 安装命令更新/§七 对照表改多技能口径；file-conventions 六处位置列更新为多技能路径 + 命令薄壳标注退役 + 断链示例与旧文件名修正 + 校验命令更新；release-and-versioning 版本三处一致重立法为六壳各自 version 同批 bump + 安装路径更新；skill-writing workflow 命名对齐 {域}-workflow；README 安装命令/结构树/开发节全面更新。
- agent-design v0.2（外审骨架可补四条全采纳）：§二 补反模式清单（严禁 spawn 场景：简单文本/短阅读/简单判断/单命令解读→主线程直接做）；§四 补嵌套禁令（agent 内禁止再 spawn，调试难度指数上升）与调用方责任（前置校验+spawn 溯源）；§三 补纪律段填写伪示例；§一 tools 白名单补禁继承主会话全量工具集；头部加骨架立法注释；T1 待办统一 [T1-TODO] 标记。
- 核验协议七维矩阵成文（作者质询"胡言乱语谁审"触发）：维度③ 拆为 ③a 内容残留（grep 可查）与 ③b 内容质量（语义通顺/逻辑自洽/数字一致——仅 LLM 可审，不可机械自动化）；维度⑥ 规范健康度仅 fresh 分身可做（规划方有确认偏袒）；维度④ 跨文件一致/⑤ 完整性成节。
- 审计与验收体系三补（作者三问触发）：①宪法 §3.9 立法与修订质量（条目须附实例，无实例标预立法；架构修订涟漪须 grep 旧概念词——理念层过时非路径 grep 可捕获）；②test-prompts 对齐 v0.3.0 现实（场景 6 重写为模板 v2 十七字段断言、场景 7 扩展六壳休眠、1-5 标注待启用契约、前置改六壳安装）；③collab-log 核验协议增补「独立审查分身」可选增强（fresh context 内容轨审查，审查隔离判据依据 agent-design §二；开发工具链用法不属 T1 物化）。
- skill-writing v0.3（外审七处全采纳）：§三 SKILL.md 模板更新为域壳形态（总控退役对齐）+ workflow 中断契约标准句式；§四 失效类型表补两类（步骤跳跃→落盘产物绑定/越权操作→域职责写死）；§五.2 交互模态语义为主工具名括注；§五.6 skill 正文禁时间敏感断言；§六.1 scripts 引用约定（路径即可/函数名形式）；§七.3 REFACTOR 后回归全场景；§八.1 力度词唯一约束。
- markdown-style v0.3 重写（外审自指矛盾七处全采纳）：补示例对照块（行内定义/引号/箭头/加粗正反例——履约自家示例优先条款）；标题规则合并（H1–H3/逐级递进）；版本行沿革外移（§三.6 自指修正，四份规范版本行统一清洗）；引号三分明确弯引号形态；互引边界澄清（禁模糊指代非禁锚点）；MD040 理由改写（选择性标注）；补齐基础约定（目录格式/拆分指引/嵌套缩进/段落空行/HTML 禁用/表格对齐/代码邻接/🚧 语义）；检查工具两条技术要求入维护节。
- release-and-versioning v0.2（外审七处全采纳）：§一 边界示例（阈值变更=minor与载体无关）；§三 步骤1自包含化+schema条目[schema]前缀；§四 迁移执行边界立法（默认只输出说明，自动改写用户书稿须单独立项）；§五 预发布版本规则；§六 回滚预案（不删tag/YANKED/用户侧回滚）。
- file-conventions 外审七处修订（全部采纳）：spec 归档细化（验收通过后移动不留副本）/预留类型启用前禁令/模板行数按源码计/脚本头部样板要求/引用守卫未来待办/工程结构类术语入 glossary/悬空指向落位（立项域 project-structure 规范）。
- Agent 设计规范骨架立法（作者质询"agent 设计无规范"触发）：docs/standards/agent-design.md v0.1 占位蓝图——命名/启用四判据/结构模板/协作协议（上下文隔离/文件回传/失败语义/权限最小化）/T1 填充清单；T1 触发前禁止创建实体 agent；file-conventions 回写 agent 规范行与 agent 文件预留行。
- 依赖与门禁审计三补：①口径修正——abzu-scan 并非零依赖，番茄/七猫/晋江 CDP 采集依赖全局 agent-browser（README 安装节补前置：Node 20+/Chrome/agent-browser，起点榜仅需 Node）；②check.sh 边界加固（LOCALAPPDATA 未设时的 set -u 崩溃风险）；③architecture T1 触发器补 ECC 参考锚（全家桶插件模式参考实现）。
- 脚本契约审计（文档↔代码参数一致性，③ 契约层首次执行）：工作流承诺参数全部实存 ✓；反向补录 3 个未文档化参数（qidian --detail / --port ×4 / scan-analyze --dist）入采集指南。
- 规格命名规则修订（作者要求）：主题部分英文改中文（作者面向的治理记录），全部 13 份规格更名（001 宪法会话起步增补 …… 013 多技能骨架切换）；collab-log 引用同步；双语纪律相应修订。
- architecture §五 补行业安装原型对照（三原型：零初始化/首用即初始化/独立 setup——调研 awesome-novel-agent、webnovel-writer、oh-story、ECC 等实证）；确认 Abzu 当前为原型①标准形态，T1 触发时按原型③立法 /abzu-setup；安装预检挂账。
- architecture §二 补成长路径与拆分触发器（作者质询"发展成大项目还单技能吗"）：内容增长不构成拆分理由；T1 运行时组件物化/T2 选择性安装需求/T3 域状态解耦三个触发器成文，终态由真实需求推动不预建。
- 012 号规格施工核验通过并归档（首次分工协作闭环）：规划方核验三步全绿，施工方报告与独立测量吻合；开放点 D2/D4 裁定为保持统一句式与接受术语近似；collab-log 首行转正并修正模板（核验请求须单代码块包裹便于回传）。
- §3.6 增审计深度分级（作者质询"逐字还是大概"触发）：核验深度映射自由度（[A]逐字/[B]通读/[C]验收标准），存量文件底线 D3 扫描；扫描只能证伪不能证真，扫出问题即升级深度。
- 012 号规格施工实现（爬虫补强）：四抓取脚本增「平台改版维护入口」注释块与「选择器失效」显性报错，scan-collection-guide 增采集礼仪节——追溯核验通过（断言全绿、无交叉污染、无逻辑改动）。事故记录：该实现曾被规划方 `git add -A` 误扫入核验协议提交（标签不符），反模式 #8 已入册。
- scan-workflow 外审六处修订（9 条发现：1 条旧版已修、2 条已有覆盖、6 条采纳）：新增变量约定/中断与跨域契约/CDP 依赖提醒与降级/数据不合格分支（有效条目 <5 不进分析，abzu 自定）/脚本非零退出不吞码/素材匹配释义；skill-writing workflow 模板同步（Stage 含异常分支、域工作流须含中断契约）。
- SKILL.md 外审五处修订（8 条建议采纳 5 拒 3）：会话恢复收紧（仅查当前目录+产物枚举，防跨项目污染）；门控增「不粘会话」原则；状态声明一行；边界声明加固混合场景；「弹窗」UI 词汇全链统一为 AskUserQuestion 选项（SKILL/workflow/skill-writing 三处）。拒绝：description 简化（语义触发靠关键词密度）、未建设域占位死链（引用闭合审计会误报）、红线摘抄进运行时（破坏自包含）。
- 宪法可读性五处修订（外部评审采纳）：定位行加流程术语内联说明；§1.4 措辞简化；§6 doc-budget 阈值补〔abzu 自定〕来源标注；§3.8 标注仅大型非平凡改动适用；§3.1 补平凡/非平凡判定示例。拒绝：新人导读（外部贡献触发再评估）。
- 规格编号机制（作者提议）：全部规格按立项顺序编号 NNN 前缀（001-012，永不复用），命名总表同步——便于口头引用（如"012 号施工回顾"）。附带修复：scan-output-format 故障排查段升 H3（上轮自审锚点修复的静默失配补课）。
- §3.8 按作者审定版重写（三角色职责/自由度标记 A-B-C/偏差 P0-P1 分级/能力式 git 限制表述/铁律/核验三步三态）；新增 docs/specs/collab-log.md（模板四件套：施工/核验请求/整改/裁决 + 施工记录表）；爬虫补强规格补自由度标记与偏差分级；file-conventions 回写协作日志行。
- §3.8 补铁律：施工规格写完必须自审（锚点一致/清单完备/验收可判定/无矛盾）通过后才出提示词——首份爬虫规格自审即抓到 2 处（礼仪上限与脚本默认冲突、锚点不逐字）并已修正。
- 宪法 §3.8 分工协作成文（作者裁定）：规划方（规格/提示词/核验）/施工方（按规格施工，禁 git 写与扩范围）/作者（中转与裁决）三角色；核验三步与结论三态；两个提示词模板要点。
- 术语变更（作者裁定）：「对标」全仓统一为「参考」——字段名参考候选、模板与选题四步描述、SKILL analyze 触发词、glossary 立项定义、场景 1 断言共 9 处同步（与下游基本设定③参考偏好词汇对齐）。
- 模板标准化 + 字段覆盖补全（作者提出消费驱动：大纲域将读选题决策.md 填基本设定表）：对照 mo-shu core-setting-template 全字段矩阵后新增「题材雷区」「对标候选」两字段、篇幅/平台增卷数估算；选题决策模板独立成 scan-topic-decision-template.md（定位注记/字段定义表/模板正文/填写示例四段，方法文件只留方法）；skill-writing §三 模板规格升级（默认独立/四段结构）；file-conventions 模板行同步。
- 字段生产路由补全（作者点破"加字段没写 INSERT"教训）：选题四步每步标注产出字段与生产源挂接（reader-profiling→代偿心理、publishing-guide→验证指标、genre-trends→内容风险）；scan-analysis-guide 通用维度补第 8 维「开篇钩子模式」；skill-writing §五.6 立法「模板字段与生产策略同批」——无生产策略的字段禁止入模板。
- 选题决策.md 模板 v2（作者征引外部反馈 + 裁定）：新增读者代偿心理/开篇钩子公式/长期追读动力/内容风险点四字段；失败风险拆为技术难点+市场风险；验证动作绑定平台指标；数据来源改四选枚举。拒绝仿写优先级独立段（与可行性排序重复）与模板内平台框架提示（已有速查表与维度表覆盖）。version 0.2.0→0.3.0（产物结构变更=minor）。
- 权威规范对齐调研落盘（作者要求：外部权威为准，mo-shu 仅为同域参考）：architecture.md 新增 §七 权威对齐节（T0 官方/T1 实物标杆/T2 目录三级清单 + 设计决策对照）；description 补边界声明（官方 strong description 三要素）；test-prompts 补场景 7 域外休眠（官方测试矩阵）；挂账粒度五次法则/季度评审/reflect 机制/精读 document-skills 范本。
- 检查体系升档（L1 纪律→L2+L3，作者裁定 A 方案）：新增 scripts/check.sh 一键检查（validate+lint）与 git pre-commit 提交门禁（拦截式，本地）；§0 验证命令更新；§6 拦截式 hook 条目细化——宿主 PreToolUse 拦 AI 操作只提醒（负向流程守卫例外），git 提交门禁不在此列。研读 mo-shu 宿主 hook 体系（SessionStart 上下文注入/PreToolUse 流程守卫/PostToolUse 机检/Pre-PostCompact 压缩续存）——运行时 hook 留待物化触发条件。
- 体积纪律强化（研读 mo-shu doc-budget 机制后裁定）：§7 增超限处理序（压缩→下沉→最后调上限）；§6 doc-budget 条目改有条件缓建并写明解冻触发条件（热路径连续两批触限或单文件字符 >2 万，届时以字符实测立法）。
- 目录补齐（作者质询 scan-analysis-guide 触发）：5 份超 100 行的 references 文件补节目录（§一.4 系统性漏网——此前结构审计未查目录存在性）；markdown-style §三.10 增趋势枚举 ↑/→/↓ 例外（→ 表示持平非流程箭头）。
- 宪法 §3 增两条工作纪律（作者 2026-09-05 裁定）：审计双轨（结构与内容同步审计，缺一不可）；修复后自核验（落实/遗漏/衍生三查）。各附当日立例事故。
- 逐文件内容审计（9 份全通读）：修复 13 处——mo-shu 语境残留清零（题材卡索引/agent-references/B71×2、数字标注里 mo-shu 字样）、旧路径引用 bug（references/genre-trends.md，改名漏网形态）、模板注释消费方预设、输出目录约定指向过时、编号游离段转 H3、双空格与前缀不一致等。
- 域解耦批（作者设计理念重申：每步看似关联、内部独立，对应 Pipes and Filters/数据耦合）：scan 域 11 处跨域耦合清零（含漏网的"3 层查找规则"producer 越位、流程衔接表、拆文引导话术、待拆文验证字段、下游预设导语）；skill-writing §三 workflow 模板去流程衔接表（导航归 SKILL.md 中央路由）；architecture §六 原则补权威锚点。
- 内容主张规范立法（skill-writing §八）：情态三级（必须/禁止·默认/优先·建议/可以，禁未分级力度词）、数字断言标来源（〔书证〕〔实测〕〔abzu 自定〕）、占位符语法（系统变量大写英文/业务变量中文/枚举斜杠/日期格式）；scan 域存量对齐（硬性要求→必须、不许→禁止、{outdir}→{扫榜目录}、数字阈值总标注）；产物模板三要素挂账 Roadmap。
- 结构审计修正（作者质疑触发）：skill 资产 H1 统一为纯语义标题（9 个，含 cdp-base 旧名残留）；清零编号标题 3 处（含本仓自引入的 2 处）；markdown-style 规则收窄——移植豁免仅限微排版，结构性规范（序号/标题/引号/行内定义）不豁免；引号分工细化为「逐字复现三类」。
- 命名规范：域前缀适用判据成文（主题名域相对需消歧→加前缀；名字已全局自描述→不加，docs/ 治理文档维持现名）。
- 域名裁定：scan 域定名「扫榜调研」（作者 2026-09-05）；全仓 14 处同步（references 头注/H1、architecture、test-prompts、README、路由关键词、术语表登记域名术语）。
- 删除 `.claude/commands/abzu-scan.md` 薄壳：三重失效（skills.sh 不携带 / 仓库内 skill 不加载 / 唯一域期 /abzu 直达）；模式样式记入 Roadmap 挂账，命名总表改"预留"。`.claude/` 目录随之移除。
- 引用纪律立法（skill-writing §六 / file-conventions §三）：skill 资产内引用一律用 skill 根相对路径 +「节名」（运行时按 SKILL_DIR 零推断），禁裸文件名与深层互链；scan 域 30 处引用全量路径化。
- skill-writing v0.2：新增 §三文件结构模板（SKILL/workflow/方法论/模板四类节序）与 §五.3 交互标注纪律（问句必标模态、混合问题拆两问）；来源声明改两行；workflow-scan Stage 1/5 按新规标注（弹窗/对话式）。
- description 补触发方式（/abzu 与自然语言）；skill 运行时文件 moshu 出处清零（移植出处保留在仓库 CHANGELOG/归档规格，不随安装分发）。
- 安装方式升级：主推 `npx skills add Chained1001/Abzu -y`（skills.sh 安装器，实测对同结构仓库识别良好），cp 降为离线备选；README/architecture §五 同步。GitHub 远程（Chained1001/Abzu 公开仓）建立并推送，远程备份挂账销账。
- 架构修订：skill 目录自 `.claude/skills/abzu/` 迁至根目录 `skills/abzu/`——本仓库定位为 skill 生产仓库（产品源码位），与 anthropics/skills、mo-shu 结构对齐；`.claude/` 仅保留 commands 薄壳（宿主集成位）；安装命令改为 `cp -r skills/abzu ~/.claude/skills/abzu`。
- 合规修缮：workflow-scan 加粗密度达标；7 份移植方法论补「消费点/边界」头注（对齐 skill-writing 五.2）；glossary 登记"扫榜报告"；markdown-style 增移植文件排版豁免条款。
- 扫榜域移植（批次 B）：自 mo-shu v2.6.1 移植 moshu-scan 与 moshu-cdp 全部资产——7 份 references（references/scan/）与 7 个运行时脚本（scripts/，含 4 平台抓取器、scan-analyze 确定性提取、CDP 启动器，脚本保留原名保依赖）；新写 workflow-scan.md 域工作流与 cdp-base.md 底座文档（杀 Chrome 同意流程原文保留）；SKILL.md 正文首版（会话恢复协议 + 域路由表，version 0.2.0，description 补扫榜触发词）。
- 架构落盘（批次 A）：architecture.md v1.0（单 skill 六域裁定 + 理由 + mo-shu 实测数据 + 部署实测循环 + setup 触发条件）；file-conventions v0.3（域子目录/命令薄壳/架构文档行）；AGENTS.md 必读表加架构行；glossary 补扫榜调研术语节；test-prompts 补场景 6（扫榜）；新增首个命令薄壳 `.claude/commands/abzu-scan.md`。
- 文件规范 v0.2 自审计修正：§三 引用规则按资产域分区（skill 运行时资产禁跨目录链接保部署自包含；治理文档放开链接）、§一 补根目录治理文件与工程配置两行、清理两处"文件规范"旧中文名残留（file-conventions §三 示例、AGENTS.md 头部链接文字）。
- 宪法 §0 增 Windows 环境约定（Git Bash 语义与路径、Python 探测链与 GBK 编码、pip CLI 入口、目录先行、npx glob 与退出码纪律——源自本会话四起实操事故与 mo-shu 教训）。
- 宪法增补：§1 增密钥红线、§3 增 main 单分支模型、§0 增 lint 体检命令与两行必读文档；CHANGELOG 移除"[0.1.0] - 未发布"空段（Keep a Changelog：发布时才建版本段）。
- 宪法增补：新增"会话起步"节（验证命令与必读文档导读）、§1.4 占位期基线豁免、§6 不做清单新增"多人协作治理件"条目（单人开发裁定固化）；README Roadmap 增发布前置（演示示例 + 可选最小 CI）。
- 目标宿主收敛为 Claude Code 唯一（原双宿主 ZCode + Claude Code）；skill 目录自 `.agents/skills/abzu/` 迁移至 `.claude/skills/abzu/`。

### Added

- 版本与发布规范（docs/standards/release-and-versioning.md）：版本三处一致、发布五步、写作项目 schema 兼容四原则与升级判定。
- Skill 写作规范（docs/standards/skill-writing.md）：description 触发器规则（禁工作流摘要）、指令形式匹配失效类型、Stage 命名、交互模态、话术零黑话、评估闭环。
- SKILL.md description 改写为纯触发条件（去工作流摘要——superpowers 实证：摘要会被 agent 当捷径跳过正文）；test-prompts 增评估闭环（RED-GREEN-REFACTOR）说明；README 发布前置增市场打包与同类项目对比备忘。
- Markdown 写作规范（docs/standards/markdown-style.md）：结构、中文排版、AI 友好、符号编码安全四域立法；`.gitattributes` 行尾统一 LF；`.markdownlint-cli2.jsonc` 体检配置与全仓基线清零；修正 file-conventions 命名总表两处示例与实际文件名不符。
- 阶段 0 基础设施：项目宪法（AGENTS.md）、文件规范、术语表、评估场景、README/LICENSE/CHANGELOG、abzu skill 占位骨架。
