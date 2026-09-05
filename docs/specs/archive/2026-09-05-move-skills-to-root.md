# 规格：skill 目录迁移至根目录（架构裁定修订）

## 现状

skill 位于 `.claude/skills/abzu/`。裁定修订（作者 2026-09-05）：本仓库是**生产 skill 的仓库**（产品位），非使用 skill 的项目（配置位）——skill 应在根目录 `skills/abzu/`，与 mo-shu、anthropics/skills 官方仓结构对齐。原"仓库内免安装测试"的理由已被用户实测流程（cp 到用户级 + 新文件夹真测）取代。

## 文件级改动清单

1. `git mv .claude/skills/abzu skills/abzu`（历史保留）
2. 删除 `skills/abzu/references/.gitkeep`（references 已有内容）
3. 全仓 `.claude/skills/abzu` → `skills/abzu`（约 23 处：architecture.md、file-conventions、README、AGENTS.md、test-prompts 等；归档规格豁免）
4. README / AGENTS.md 安装与校验命令同步（`cp -r skills/abzu ~/.claude/skills/abzu`）
5. architecture.md §三落定结构图更新；CHANGELOG 记录

## 验收标准

- [x] `skills/abzu/SKILL.md` 存在，`.claude/` 下只剩 `commands/`
- [x] 全仓 grep 无 `.claude/skills` 残留（归档规格豁免）
- [x] `agentskills validate skills/abzu` 通过
- [x] `npx markdownlint-cli2` 0 违例；脚本 `node --check` 7/7 通过
- [x] CHANGELOG 有条目

> 验收完成：2026-09-05，全部通过（残留命中均在归档规格，历史豁免）。
