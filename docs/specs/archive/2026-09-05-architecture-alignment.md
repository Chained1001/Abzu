# 规格：批次 A · 架构对齐（单 skill 六域落盘）

## 现状

架构已裁定（2026-09-05 作者拍板：单 skill 六域；首建域扫榜），但文件层未反映：无架构决策文档；file-conventions 无域子目录/commands/架构文档类型；glossary 无扫榜域术语；test-prompts 无扫榜场景；`.claude/commands/` 不存在。

## 文件级改动清单

1. 新增 `docs/architecture.md`（架构决策记录 v1.0：裁定/理由/对照表/mo-shu 实测数据/落定结构/入口机制/部署实测循环/setup 触发条件/流程哲学）
2. `docs/standards/file-conventions.md`：命名总表补 references 域子目录约定（六域 + `common/`）、commands 薄壳行、架构文档行；版本升 v0.3
3. `AGENTS.md`：§0 必读文档表加 architecture.md 行
4. `docs/glossary.md`：补「扫榜调研」域术语节（扫榜、选题决策、样本校验、数据质量三行）
5. `docs/test-prompts.md`：补场景 6 · 扫榜调研（前置/命题/断言，含真抓起点榜的机检项）
6. 新增 `.claude/commands/abzu-scan.md`（薄壳，标识符风格）
7. `CHANGELOG.md`：记录

## 验收标准

- [x] architecture.md 存在且 ≤100 行，含裁定与 mo-shu 实测数据
- [x] file-conventions 含 common/、commands、架构文档行
- [x] AGENTS.md §0 表含 architecture.md 行，总行数 <120
- [x] glossary 含扫榜术语
- [x] test-prompts 含扫榜场景
- [x] `.claude/commands/abzu-scan.md` 存在
- [x] `npx markdownlint-cli2` 0 违例；`agentskills validate` 通过

> 验收完成：2026-09-05，全部通过。
