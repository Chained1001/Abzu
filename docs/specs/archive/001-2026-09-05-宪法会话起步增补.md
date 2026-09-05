# 规格：宪法增补（会话起步节 + 死锁豁免 + 单人裁定固化）

## 现状

- AGENTS.md 无验证命令入口（`agentskills validate` 藏在 file-conventions.md 的 frontmatter 章节内）；四份文档的阅读时机散落各章节，无集中导读。
- §1.4"禁带病开工"与占位 skill 现状死锁：5 个评估场景必然全红，按字面执行则一切工作无法合法开工。
- 项目定位裁定未成文：单人开发（作者 2026-09-05 裁定），此前讨论中出现的多人治理件建议（CONTRIBUTING/CODE_OF_CONDUCT/OWNERS）应被宪法显式拒绝。

## 文件级改动清单

1. `AGENTS.md`：新增 `## 0. 会话起步`（验证命令 2 条 + 必读文档表 4 行）
2. `AGENTS.md` §1.4：补基线定义句（占位期豁免）
3. `AGENTS.md` §6 v0 追加：多人协作治理件条目
4. `README.md` Roadmap：发布前置缩水版（演示示例 + 可选最小 CI；不含治理件）
5. `CHANGELOG.md`：Changed 条目

## 验收标准

- [x] AGENTS.md 含"会话起步"节（验证命令 + 必读文档表），位于红线之前
- [x] §1.4 含基线定义句
- [x] §6 含多人治理件条目
- [x] README Roadmap 含发布前行且不含 CONTRIBUTING/CODE_OF_CONDUCT/OWNERS 待办
- [x] 全仓不存在 CONTRIBUTING.md / CODE_OF_CONDUCT.md / OWNERS 文件实体
- [x] AGENTS.md 总行数 < 120（实测 95 行，远低于 300 上限）

> 验收完成：2026-09-05，全部通过。
