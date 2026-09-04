# Changelog

本文件记录 Abzu 的显著变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

- 宪法增补：§1 增密钥红线、§3 增 main 单分支模型、§0 增 lint 体检命令与两行必读文档；CHANGELOG 移除"[0.1.0] - 未发布"空段（Keep a Changelog：发布时才建版本段）。
- 宪法增补：新增"会话起步"节（验证命令与必读文档导读）、§1.4 占位期基线豁免、§6 不做清单新增"多人协作治理件"条目（单人开发裁定固化）；README Roadmap 增发布前置（演示示例 + 可选最小 CI）。
- 目标宿主收敛为 Claude Code 唯一（原双宿主 ZCode + Claude Code）；skill 目录自 `.agents/skills/abzu/` 迁移至 `.claude/skills/abzu/`。

### Added

- 版本与发布规范（docs/standards/release-and-versioning.md）：版本三处一致、发布五步、写作项目 schema 兼容四原则与升级判定。
- Skill 写作规范（docs/standards/skill-writing.md）：description 触发器规则（禁工作流摘要）、指令形式匹配失效类型、Stage 命名、交互模态、话术零黑话、评估闭环。
- SKILL.md description 改写为纯触发条件（去工作流摘要——superpowers 实证：摘要会被 agent 当捷径跳过正文）；test-prompts 增评估闭环（RED-GREEN-REFACTOR）说明；README 发布前置增市场打包与同类项目对比备忘。
- Markdown 写作规范（docs/standards/markdown-style.md）：结构、中文排版、AI 友好、符号编码安全四域立法；`.gitattributes` 行尾统一 LF；`.markdownlint-cli2.jsonc` 体检配置与全仓基线清零；修正 file-conventions 命名总表两处示例与实际文件名不符。
- 阶段 0 基础设施：项目宪法（AGENTS.md）、文件规范、术语表、评估场景、README/LICENSE/CHANGELOG、abzu skill 占位骨架。
