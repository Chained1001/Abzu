# 规格：宿主收敛为 Claude Code 唯一

## 现状

- skill 位于 `.agents/skills/abzu/`（跨工具中立路径）；AGENTS.md、README、文件规范均表述为"双宿主（ZCode + Claude Code）"。

## 决策

作者裁定（2026-09-05）：目标宿主改为 **Claude Code 唯一**，注意力集中化——收敛维护面，为后续深度适配单宿主能力（hooks、斜杠命令、插件打包等）留出空间。ZCode 仍作为本仓库的开发环境。

## 文件级改动清单

1. skill 目录迁移：`.agents/skills/abzu/` → `.claude/skills/abzu/`（git mv，保留历史）
2. `AGENTS.md`：头部定位改为 Claude Code 唯一；§6 不做清单宿主条目改为"多宿主适配——不做"
3. `docs/standards/file-conventions.md`：命名总表全部路径与校验命令指向新位置
4. `README.md`：安装说明（仅 Claude Code 两级路径）、仓库结构树
5. `.gitignore`：新增 `.claude/settings.local.json`（本地权限覆盖不入库；`.claude/skills/` 入库）；更新 `.zcode/` 注释
6. `CHANGELOG.md`：新增 Changed 条目

## 验收标准

- [x] `.claude/skills/abzu/SKILL.md` 存在，且 `agentskills validate .claude/skills/abzu` 通过
- [x] 全仓 grep 无 `.agents/` 残留引用（本规格与 CHANGELOG 的历史记录除外）
- [x] `.agents/` 目录已删除
- [x] AGENTS.md / README / 文件规范宿主表述一致（Claude Code 唯一）

> 验收完成：2026-09-05，全部通过。
