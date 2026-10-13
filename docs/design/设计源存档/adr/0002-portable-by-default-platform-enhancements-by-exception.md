# 可移植性默认，平台增强例外

---
status: accepted
date: 2026-09-25
---

Abzu 的技能默认只使用 agentskills 开放规范的 6 个 frontmatter 字段（frontmatter：SKILL.md 开头以 `---` 包住的元数据区；规范字段为 name、description、license、compatibility、metadata、allowed-tools），保证跨工具（Claude Code、Codex、Cursor 等 40+ 客户端）可复用；仅当出现"规范无法实现的产品刚需"时，才允许引入 Claude Code 专有能力做增强，其他工具退回软性提示。

## 已批准的例外

- `disable-model-invocation: true`：产品要求技能**只能由用户显式 `/技能名` 调用**、禁止模型自然语言自动触发。目前仅 Claude Code 的此字段能硬性保证；description 中写明"仅供手动调用"作为其他工具的软降级。
- **横切子代理**（插件 `agents/` 组件，含任务书内 `model` 模型分层字段）：三评审、校对评审、采风、融合、顾问、查询等横切机制需要独立上下文（评审独立性、检索聚焦）与成本分层，开放规范无子代理概念。降级方案：任务书写成双模式——有子代理能力的宿主派独立 agent，没有的由宿主技能将同一文件作为流程内 persona 载入（模型分层失效，功能可用）。
- **自动化 hook**（插件 `hooks/` 组件）：写前门禁等机械阻断/提醒点。降级方案：SKILL.md 指令为基线（所有工具生效），hook 仅是 Claude Code 上的强化层。

## 后果

- 新增专有字段必须先对照本 ADR：确认是产品刚需且无规范层替代。
- 在不支持该字段的其他工具上，模型仍可能自动触发技能（软提示不保证）。
- 校验脚本需同时容忍规范字段与已批准的例外字段。
