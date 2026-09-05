# 文件规范（Abzu 仓库命名与格式总表）

> **版本**：v0.3（2026-09-05 增补：域子目录/命令薄壳/架构文档行）｜v0.2（2026-09-05 修订：§三 引用规则按资产域分区 + §一 补根目录文件行）｜v0.1（2026-09-04 立法）
> **定位**：仓库所有文件类型的命名规则与格式模板的**单点权威**。新增文件前先查本表；类型未覆盖 → 走 [AGENTS.md](../../AGENTS.md) §4 决策树，裁定结果**回写本表**。
> **与术语表分工**：[术语表](../glossary.md)管产品语言的叫法（面向使用者），本文件管文件系统的命名与格式（面向开发者）。

---

## 一、命名总表

| 文件类型 | 命名规则 | 示例 | 位置 |
| --- | --- | --- | --- |
| skill 壳 | `SKILL.md`（固定名） | — | `skills/abzu/` |
| references 域子目录 | 六域 kebab-case + `common/`（公共层正本） | `references/write/`、`references/common/` | `references/` |
| 域工作流 | `{域}-workflow.md` | `scan-workflow.md` | `references/{域}/` |
| 阶段方法论 | `{域}-stage-{阶段名}.md` | `write-stage-drafting.md` | `references/{域}/` |
| 域内参考文件 | `{域}-{主题}.md`，主题描述性命名 | `scan-cdp-base.md`、`scan-genre-trends.md` | `references/{域}/` |
| 模板 | `{产物名}-template.md` | `character-card-template.md` | `references/`（小型模板可直接内嵌） |
| 运行时脚本 | `{动词}-{对象}.{sh,py,js}` | `count-words.sh` | `skills/abzu/scripts/` |
| 开发守卫 | `check-{对象}.{sh,py,js}` | `check-frontmatter.py` | `scripts/`（仓库级） |
| 开发测试 | `test-{对象}.{sh,py,js}` | `test-check-frontmatter.py` | `scripts/`（仓库级） |
| 规格 | `YYYY-MM-DD-{主题}.md` | `2026-09-04-phase0-infra.md` | `docs/specs/`（完成即归档 `docs/specs/archive/`） |
| 工程规范 | 英文 kebab-case | `file-conventions.md`、`markdown-style.md` | `docs/standards/` |
| 项目参照 | 英文 kebab-case | `glossary.md`、`test-prompts.md` | `docs/` |
| 根目录治理文件 | 固定名（生态惯例） | `AGENTS.md`、`README.md`、`CHANGELOG.md`、`LICENSE` | 仓库根 |
| 根目录工程配置 | 固定名（工具惯例） | `.gitignore`、`.gitattributes`、`.markdownlint-cli2.jsonc` | 仓库根 |
| 命令薄壳（预留） | `abzu-{路由键}.md`，单行内容 `abzu skill {路由键}`；多域上线、分发方案裁定后启用 | — | `.claude/commands/`（现无实例） |
| 架构决策记录 | `architecture.md`（固定名，长期文档） | — | `docs/` |

> **域前缀适用判据**：`{域}-` 前缀适用于**主题名域相对、需消歧**的文件（skill 资产——装入用户机器、被路由键检索，如 `scan-genre-trends.md`）；名字已全局自描述的治理文档（`docs/` 下全部文件，如 `markdown-style.md`）不加前缀——位置由文件夹表达，名字表达内容。未来 `common/` 公共层文件命名同用此判据。

## 二、双语命名纪律

- **英文 kebab-case**：skill 目录、references、脚本、规格、守卫——开发者可见的一切。
- **中文名**：写作项目（用户的书目录）内的产物文件，如 `卷纲_第1卷.md`、`人物卡_林晚.md`——由 skill 运行时创建，**不进本仓库**；命名细则由 skill 的 project-structure 参考文件定义。
- 路径分隔符一律正斜杠（跨平台；反斜杠在 Unix 上失效）。

## 三、跨文件引用格式

| 场景 | 格式 | 示例 |
| --- | --- | --- |
| 同目录文件（仓库治理文档） | Markdown 链接 | `[file-conventions.md](file-conventions.md)` |
| 跨目录文件（仓库治理文档） | Markdown 链接（含相对路径） | `[file-conventions.md](docs/standards/file-conventions.md)` |
| skill 资产内引用（无论同目录跨目录） | 禁链接与裸文件名，用 skill 根相对路径文字 +「节名」 | `references/scan/analysis-guide.md`「扫榜报告模板」节 |
| 文件名提及（无需跳转） | 行内代码 | `` `SKILL.md` `` |
| 指定小节（治理文档） | 文件名 + 「节名」 | `AGENTS.md`「红线」节 |

规则（按资产域分区）：**skill 运行时资产**（`references/`、`scripts/`）禁跨目录链接——部署副本会断链，必须自包含（此规则出身 mo-shu，仅适用于运行时资产）；**仓库治理文档**（根目录、`docs/`）允许跨目录 Markdown 链接——它们在编辑器与 GitHub 中阅读，链接是可用性加分。references 之间不互相链接（一层深纪律，见宪法 §7）。

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

约束（Agent Skills 开放规范）：`name` 小写字母/数字/连字符，≤64 字符，须与目录同名；`description` 非空 ≤1024 字符。校验（pip 包 `skills-ref`，命令行入口为 `agentskills`）：`agentskills validate skills/abzu`。

## 五、本规范的维护

- **新增文件类型**：决策树裁定 → 回写本表（命名规则 + 示例 + 位置）。
- **修改命名规则**：先全仓 grep 涟漪面（改名/移动文件须同步更新全部引用）。
- **退役文件/概念**：从表中删除行，退役记录进 CHANGELOG。
