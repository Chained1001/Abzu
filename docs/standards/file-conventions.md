# 文件规范（Abzu 仓库命名与格式总表）

> **版本**：v0.1（2026-09-04 立法）
> **定位**：仓库所有文件类型的命名规则与格式模板的**单点权威**。新增文件前先查本表；类型未覆盖 → 走 [AGENTS.md](../../AGENTS.md) §4 决策树，裁定结果**回写本表**。
> **与术语表分工**：[术语表](../glossary.md)管产品语言的叫法（面向使用者），本文件管文件系统的命名与格式（面向开发者）。

---

## 一、命名总表

| 文件类型 | 命名规则 | 示例 | 位置 |
|---|---|---|---|
| skill 壳 | `SKILL.md`（固定名） | — | `.claude/skills/abzu/` |
| 阶段方法论 | `stage-{阶段名}.md` | `stage-drafting.md` | `.claude/skills/abzu/references/` |
| 结构/规范类参考 | 描述性英文名 | `project-structure.md` | `.claude/skills/abzu/references/` |
| 模板 | `{产物名}-template.md` | `character-card-template.md` | `references/`（小型模板可直接内嵌） |
| 运行时脚本 | `{动词}-{对象}.{sh,py,js}` | `count-words.sh` | `.claude/skills/abzu/scripts/` |
| 开发守卫 | `check-{对象}.{sh,py,js}` | `check-frontmatter.py` | `scripts/`（仓库级） |
| 开发测试 | `test-{对象}.{sh,py,js}` | `test-check-frontmatter.py` | `scripts/`（仓库级） |
| 规格 | `YYYY-MM-DD-{主题}.md` | `2026-09-04-phase0-infra.md` | `docs/specs/`（完成即归档 `docs/specs/archive/`） |
| 工程规范 | 中文名 | `文件规范.md` | `docs/standards/` |
| 项目参照 | 中文名 | `术语表.md`、`评估场景.md` | `docs/` |

## 二、双语命名纪律

- **英文 kebab-case**：skill 目录、references、脚本、规格、守卫——开发者可见的一切。
- **中文名**：写作项目（用户的书目录）内的产物文件，如 `卷纲_第1卷.md`、`人物卡_林晚.md`——由 skill 运行时创建，**不进本仓库**；命名细则由 skill 的 project-structure 参考文件定义。
- 路径分隔符一律正斜杠（跨平台；反斜杠在 Unix 上失效）。

## 三、跨文件引用格式

| 场景 | 格式 | 示例 |
|---|---|---|
| 同目录文件 | Markdown 链接 | `[stage-drafting.md](stage-drafting.md)` |
| 跨目录文件 | 路径说明文字 | `docs/standards/ 文件规范` |
| 文件名提及（无需跳转） | 行内代码 | `` `SKILL.md` `` |
| 指定小节 | 文件名 + 「节名」 | `AGENTS.md`「红线」节 |

规则：只对**同目录**文件用 Markdown 链接；references 之间不互相链接（一层深纪律，见宪法 §7）。

## 四、SKILL.md frontmatter 格式

```yaml
---
name: abzu
description: <第三人称；写清做什么 + 何时用 + 触发关键词；不超过 1024 字符>
license: MIT
metadata:
  version: "0.1.0"
---
```

约束（Agent Skills 开放规范）：`name` 小写字母/数字/连字符，≤64 字符，须与目录同名；`description` 非空 ≤1024 字符。校验（pip 包 `skills-ref`，命令行入口为 `agentskills`）：`agentskills validate .claude/skills/abzu`。

## 五、本规范的维护

- **新增文件类型**：决策树裁定 → 回写本表（命名规则 + 示例 + 位置）。
- **修改命名规则**：先全仓 grep 涟漪面（改名/移动文件须同步更新全部引用）。
- **退役文件/概念**：从表中删除行，退役记录进 CHANGELOG。
