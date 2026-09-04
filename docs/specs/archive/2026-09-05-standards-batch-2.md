# 规格：版本发布规范 + Skill 写作规范 + 宪法增补（第二批立法）

## 现状

- 版本号出现于 SKILL.md 与 CHANGELOG，但无单一真源、无 bump 语义、无 git tag 规范、无发布流程；用户手工复制安装，升级感知完全缺位。
- CHANGELOG 存在 `[0.1.0] - 未发布` 空段，违反 Keep a Changelog 惯例（发布时才建版本段）。
- 占位 SKILL.md 的 description 含工作流摘要——superpowers 实证：摘要会被 agent 当捷径导致跳过正文。
- skill 内容设计（description 规则、指令形式、Stage 命名、交互模态、话术纪律）无规范。
- 宪法缺三条：密钥红线、分支模型、工具链记录。
- 评估场景缺 RED（裸跑基线）步骤。

## 决策

- 立 `docs/standards/release-and-versioning.md`（版本+发布+写作项目 schema 兼容）。
- 立 `docs/standards/skill-writing.md`（skill 内容写作与设计，依据 superpowers 元规范+Anthropic 指南+mo-shu 教训）。
- 修正 SKILL.md description 为纯触发条件。
- 宪法增补三条；CHANGELOG 修空段；README 发布前置补市场打包；test-prompts 补评估闭环说明。

## 文件级改动清单

1. 新增 `docs/standards/release-and-versioning.md`
2. 新增 `docs/standards/skill-writing.md`
3. `.claude/skills/abzu/SKILL.md`：description 改写（去工作流摘要）
4. `AGENTS.md`：§1 增密钥红线（第 6 条）；§3 增分支模型（第 5 条）；§0 增工具链说明；§0 必读表增 skill-writing 行
5. `CHANGELOG.md`：移除 `[0.1.0] - 未发布` 空段；记录本批
6. `README.md`：发布前置增市场打包与竞品对比备忘
7. `docs/test-prompts.md`：头部增评估闭环（RED-GREEN-REFACTOR）说明
8. `docs/standards/file-conventions.md`：命名总表工程规范行示例补充（不列全，防清单过期）

## 验收标准

- [x] 两份新规范存在且各 ≤100 行（实测 51 / 54 行）
- [x] SKILL.md description 不含流程列举，`agentskills validate` 通过
- [x] AGENTS.md 含密钥红线、分支模型条款；行数 102 <300
- [x] CHANGELOG 无"未发布"版本空段（仅剩 Unreleased 段）
- [x] test-prompts 含 RED 步骤说明
- [x] `npx markdownlint-cli2` 全仓 0 违例（14 文件）
- [x] CHANGELOG 有本批条目

> 施工调整：改动清单第 8 项（file-conventions 示例补充）取消——示例非穷举清单、无过期风险，为改而改违反决策树第 1 问。
> 验收完成：2026-09-05，全部通过。
