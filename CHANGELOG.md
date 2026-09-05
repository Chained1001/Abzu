# Changelog

本文件记录 Abzu 的显著变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

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
