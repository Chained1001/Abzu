# AGENTS.md

Abzu 是 **DSH 插件**（不是独立应用），面向长篇中文网络小说创作。TypeScript 单仓，pnpm workspace。
Windows 为主开发环境。许可证 GPL-3.0-only。

## 开工前

改了下列任一**契约信号**，先写 `docs/设计/` 下的设计文档，再动代码；其余直接改（修 bug、改文案、重构、补测试、升依赖），取舍值得记档就写进提交说明。

| 信号 | 判据 |
| --- | --- |
| 工具名集合变了 | `packages/bundle/src/tool-spec.ts` 的 `TOOL_SPECS` 增删行 |
| 书仓格式或路径变了 | `packages/core/src/repo/paths.ts` |
| 包的公共导出面变了 | 各包 `src/index.ts` 的具名导出增删 |
| 读侧 `Result` 形状变了 | `packages/core/src/repo/{read,frontmatter}.ts` |

设计文档最低四段：**要解决的问题**、**关键取舍与不选什么**、**验收标准**、**待确认**。开头 `> 状态：<枚举值>`，写完在 [docs/README.md](docs/README.md) 登记。细节见[工程规范 §5](docs/标准/工程规范.md)。

## 读哪份

| 你要做的事 | 读这份 |
| --- | --- |
| 改任何代码 | [标准/工程规范](docs/标准/工程规范.md) —— 提交、版本、测试、错误处理、导出面 |
| 偶发失败 / 超时 / 并发 | 同上 §9「偶发失败诊断」 |
| 改书仓格式、状态推导、读写路径 | [标准/书仓格式](docs/标准/书仓格式.md) |
| 改运行时技能、判据件、任务包 | [标准/技能编写规范](docs/标准/技能编写规范.md) |
| 改架构、发版、找开发命令 | [技术/现状](docs/技术/现状.md)、[已知问题](docs/技术/已知问题.md) |
| 改创作流程、作者确认点 | [产品/怎么走](docs/产品/怎么走.md)、[是什么](docs/产品/是什么.md) |
| 用词拿不准 | [GLOSSARY](GLOSSARY.md)（工程域）、[产品/术语](docs/产品/术语.md)（创作域） |

## 硬约束

1. **不自行提交、推送、打 tag**。提交与推送只由作者执行或批准。做完改动就停下等确认。
2. **不提交个人绝对路径、API key、会话内容、真实作品**。`check:public` 扫描全部历史并拒绝。文档里不写安装版本号，用 `<version>` 占位。
3. **测试用合成书仓**，不用真实作品、不需要 API key。改变行为必须带回归测试。
4. **错误处理分域**（详见工程规范 §7）：写侧不变量违反用 `throw`（中文、点名收到的值）；读侧返回 `{ok:false, reason}` 不 `throw`；工具层 `execute` 单点捕获转成结构化失败。
5. **必填字段 trim 后为空要拒绝**，不落盘占位记录。
6. **不新增 `export *`**，逐名书写。

## 命令

```powershell
pnpm test          # 全量测试，无需预设环境变量
pnpm test:hermetic # 剥掉本机 git 配置后跑全量（复现 CI 环境）
pnpm lint          # eslint
pnpm build         # esbuild 构建
pnpm check:docs    # 文档索引 + 契约耦合 + 状态机 + 计数
pnpm check:public  # 公开内容扫描（含全部历史）
pnpm check:version # 版本一致性
pnpm check:dsh     # DSH 版本三源比对
```

改了 `docs/` 或契约信号加跑 `check:docs`；动了发行链加跑 `check:version`；改公开文档加跑 `check:public`；动了 `dsh-baseline.json` 或怀疑宿主升级过加跑 `check:dsh`。

## 本仓特有

- **状态从文件推导**，不单独存状态。Markdown + Git 是真源。
- **测试临时目录**：普通测试用系统 `%TEMP%`；依赖 esbuild 落盘的五个文件用 `testScratchDir()` 建在仓内 `.tmp/`（沙箱只放行工作区）。不要用 `os.tmpdir()` 建 esbuild 产物目录。
- **`.tmp/` 与 `.scratch/` 已 gitignore**，不是交付物。
- **git hooks 已版本化**（`.githooks/`，一个 `pre-push` 跑 `check:public`）。克隆后跑一次 `pnpm hooks:install` 才生效。
- 文档描述现状；历史进 CHANGELOG，不在文档里写演变过程。

## 协作文档

Issue 记在 GitHub（`Chained1001/Abzu`），用 `gh` 操作，PR 不作为请求面；五个 triage 标签沿用默认词表；领域文档单上下文（`GLOSSARY.md` + `docs/adr/`，ADR 只在「难以逆转 + 无背景会意外 + 真有权衡」三条同时成立时新建）。

细节见 [issue-tracker](docs/agents/issue-tracker.md)、[triage-labels](docs/agents/triage-labels.md)、[domain](docs/agents/domain.md)。
