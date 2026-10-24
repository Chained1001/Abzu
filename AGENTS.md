# AGENTS.md

Abzu 是 **DSH 插件**（不是独立应用），面向长篇中文网络小说创作。TypeScript 单仓，pnpm workspace。
Windows 为主开发环境。许可证 GPL-3.0-only。

## 开工前

改了下列任一**契约信号**，先写 `docs/设计/` 下的设计文档，再动代码：

| 信号 | 判据 |
| --- | --- |
| 工具名集合变了 | `packages/bundle/src/tool-spec.ts` 的 `TOOL_SPECS` 增删行 |
| 书仓文件格式或路径变了 | `packages/core/src/repo/paths.ts` |
| 包的公共导出面变了 | 各包 `src/index.ts` 的具名导出增删 |
| 读侧 `Result` 形状变了 | `packages/core/src/repo/{read,frontmatter}.ts` |

其余直接改：修 bug、改文案与提示词、内部重构、性能优化、补测试、升依赖。取舍值得记档就写进提交说明。

设计文档最低四段：**要解决的问题**（不写方案）、**关键取舍与不选什么**、**验收标准**、**待确认**。开头一行 `> 状态：…`。写完在 [docs/README.md](docs/README.md) 登记。

细节见 [工程规范 §5](docs/标准/工程规范.md)。

## 必读（按任务触发）

| 你要做的事 | 读这份 |
| --- | --- |
| 改任何代码 | [标准/工程规范](docs/标准/工程规范.md) —— 提交、版本、测试、错误处理契约、导出面纪律 |
| 碰到偶发失败 / 超时 / 并发问题 | 同上 §9「偶发失败诊断」—— 分清慢与错、隔离变量、瞬时错误与重试预算 |
| 改书仓格式、状态推导、读写路径 | [标准/书仓格式](docs/标准/书仓格式.md) |
| 改运行时技能、判据件、任务包 | [标准/技能编写规范](docs/标准/技能编写规范.md) |
| 改架构、发版、找开发命令 | [技术文档](docs/技术文档.md) |
| 改创作流程、术语、作者确认点 | [产品文档](docs/产品文档.md) |

## 硬约束（违反会直接出问题）

1. **不自行提交、推送、打 tag**。提交与推送只由作者执行或批准。做完改动就停下等确认。
2. **不提交个人绝对路径、API key、会话内容、真实作品**。`check:public` 扫描全部历史并拒绝。文档里不写安装版本号，用 `<version>` 占位。
3. **测试用合成书仓**，不用真实作品、不需要 API key。改变行为必须带回归测试。
4. **错误处理分域**（详见工程规范 §7）：写侧不变量违反用 `throw`（中文、点名收到的值）；读侧返回 `{ok:false, reason}` 不 `throw`；工具层 `execute` 单点捕获转成结构化失败，模型永远不接收裸异常。
5. **必填字段 trim 后为空要拒绝**，不落盘占位记录。
6. **不新增 `export *`**，逐名书写。

## 常用命令

```powershell
pnpm test                       # 全量测试，无需预设环境变量
pnpm lint                       # eslint
pnpm build                      # esbuild 构建
pnpm check:docs                 # 文档索引完整性 + 契约耦合
pnpm check:dsh                  # DSH 版本三源比对（基线 / 上游 next / 本机宿主）
pnpm check:public               # 公开内容扫描（含全部历史）
pnpm check:version              # 版本一致性
```

按改了什么决定额外跑哪些：

| 改了什么 | 加跑 |
| --- | --- |
| 契约信号（见「开工前」）或任何 `docs/` 文件 | `check:docs` |
| 发行链（`package.json`、构建脚本、打包清单） | `check:version` |
| 公开文档、`README`、`CHANGELOG` | `check:public` |
| 动了 `dsh-baseline.json`，或怀疑宿主升级过 | `check:dsh` |

## 本仓特有的事实

- **状态从文件推导**，不单独存状态。Markdown + Git 是真源。
- **测试临时目录**：普通测试用系统 `%TEMP%`；依赖 esbuild 落盘的五个文件自动建在仓内 `.tmp/`（沙箱只放行工作区，esbuild 写工作区外会被拒）。用 `testScratchDir()`，不要用 `os.tmpdir()` 建 esbuild 产物目录。
- **`.tmp/` 与 `.scratch/` 已 gitignore**，不是交付物。
- **仓库没有 git hooks**，检查靠人跑命令。
- 文档描述现状；历史进 CHANGELOG，不在文档里写演变过程。

## Agent skills

### Issue tracker

Issue 与规格记在 GitHub Issues（`Chained1001/Abzu`），用 `gh` CLI 操作；PR 不作为请求面。见 [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md)。

### Triage labels

沿用默认五角色词表：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。见 [docs/agents/triage-labels.md](docs/agents/triage-labels.md)。

### Domain docs

单上下文：根目录 `GLOSSARY.md` ＋ `docs/adr/`。术语以 `GLOSSARY.md` 为准，全量词条在产品文档 §9；ADR 只在「难以逆转 + 无背景会意外 + 真有权衡」三条同时成立时新建。见 [docs/agents/domain.md](docs/agents/domain.md)。

