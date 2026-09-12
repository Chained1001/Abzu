# Abzu

> 长篇网文 AI 辅助写作工作流 skill——从立项、世界观、分层大纲到逐章起草与修订，阶段门控式人机协同，文件化写作项目支持跨会话续写。

**状态**：扫榜调研与拆书分析两域可用（多技能骨架，其余四域占位待建——大纲推倒重设中）——套件版本见 [CHANGELOG](CHANGELOG.md) 版本段与已建壳 `metadata.version`。

## 安装

**前置**：Node.js 20+；宿主会话须具备命令执行（Bash）工具——扫榜域全依赖脚本执行，无命令执行能力的会话不可用。番茄/七猫/晋江走 CDP 采集另需 Chrome 与 `npm install -g agent-browser`（一次性）。

**推荐（[skills.sh](https://www.skills.sh/docs/cli) 包管理器）**——项目级安装：在**要使用的目标项目目录**里运行（安装器将技能 vendor 到该目录 `.agents/skills/` 并建 `.claude/skills/` 软链，生成 `skills-lock.json`）：

```bash
npx skills add Chained1001/Abzu -y
```

> ⚠️ **勿在本仓库内运行**——安装器会把本仓库 `skills/` 下的目录替换为符号链接（tracked 内容悬空，check.sh [0] 会拦截）。若已发生：删除 `skills/abzu-*` 链接条目后 `git restore skills/`。

**离线备选（手动复制到宿主用户级目录——宿主机制，随宿主版本可能变化）**：

```bash
cp -r skills/abzu-scan ~/.claude/skills/abzu-scan
```

**卸载**：删除目标项目内的 `.agents/`、`.claude/skills/`、`skills-lock.json`。

安装后新开会话即可使用：敲六域命令进入对应工作流（见下方命令清单）。

**六域命令**：`/abzu-scan`、`/abzu-analyze`（已建设可用）；`/abzu-outline`、`/abzu-volume`、`/abzu-write`、`/abzu-style`（待建，敲入即告知建设状态）。

**本仓库内开发**：skill 在根目录 `skills/` 下（产品源码位，Claude Code 打开本仓库不自动加载）；实测一律在独立的目标项目目录走上面的安装流程，**禁止在本仓库内运行安装器**（见上方警告）。

## 解决什么问题

| 写作失效模式 | 对应域 |
| --- | --- |
| 选题踩雷：跟风过热题材、写前对市场心中无数 | abzu-scan（已可用） |
| 拆书不得法：说不清好书为什么好，吸收不成方法 | abzu-analyze（已可用） |
| 结构崩塌：大纲失控、卷线断裂、伏笔失管 | abzu-outline（推倒重设中）/ abzu-volume |
| 断更卡文：进度失控、前后矛盾、续写断片 | abzu-write |
| 文风漂移：越写越不像自己、口径不一 | abzu-style |

其余四域占位待建（状态见下方仓库结构与 Roadmap）。

## 快速上手

（占位：待 skill 本体完成后补全——未来示例用显式命令形态）

## 仓库结构

```
Abzu/
├── skills/
│   ├── abzu-scan/               # 扫榜调研（已可用）
│   │   ├── SKILL.md             # 域壳：入口判定 + 门控
│   │   ├── references/scan/     # 10 份方法论与模板
│   │   └── scripts/             # 7 个脚本（抓取+提取+CDP）
│   ├── abzu-analyze/            # 拆书分析（已建设）
│   ├── abzu-outline/            # 大纲（占位壳——推倒重设中）
│   ├── abzu-volume/             # 卷纲（占位壳）
│   ├── abzu-write/              # 正文（占位壳）
│   └── abzu-style/              # 文风（占位壳）
├── docs/                        # 架构/规范/术语/评估/规格档案
├── AGENTS.md                    # 项目宪法
└── README.md / CHANGELOG.md / LICENSE
```

## 开发

见 [AGENTS.md](AGENTS.md)。修改 skill 后必须重跑 [docs/test-prompts.md](docs/test-prompts.md) 全部场景。

## Roadmap

> 本节未勾选项为**历史挂账源**；现行挂账以 [docs/specs/open-items.md](docs/specs/open-items.md) 为准——新增挂账一律登记入该件，本节不再新增（存量是否回填另行评估）。

- [x] 阶段 0：基础设施（宪法/规范/术语表/评估场景/架构落盘）
- [ ] 六域建设（每域：规格 → 开发 → 真测）：扫榜调研 ✅ ｜ 拆书 ✅ ｜ 大纲（2026-09-10 推倒重设中——036 批） ｜ 卷纲 ｜ 正文 ｜ 文风
- [ ] 评估：[test-prompts](docs/test-prompts.md) 八场景全绿
- [ ] v1.x：写作项目内 AGENTS.md 生成、示例项目
- [ ] 拆书域开工时：立法 skill 调用契约（输入校验/输出格式/失败返回三要素模板）
- [ ] 任一域引入外部依赖时：立法系统性依赖声明清单（Node 版本/pip 包/全局 CLI 逐项登记）
- [x] scan 首次真测后：立法每域最低测试要求（几个场景/什么断言/怎么算通过）——034 批立法（每域最低测试要求四条见 docs/test-prompts.md 头注）
- [x] 025 对齐批：存量文件对照 file-conventions.md §五 内容规范矩阵审计与 retrofit——六壳符合度核验（scan 壳 vs 域壳模板逐条；AGENTS/README 头注是否纳入三行式由立项时裁定）、七脚本文档头按 §五.1 四要素统一、治理文档头注按 §五.2 三行式对齐（glossary 版本行等偏离）、references 节序抽查
- [ ] 发布前置：marketplace.json 元数据（category/keywords/metadata.description）内容标准立法
- [ ] release-and-versioning §二「四处一致」补「辖套件发布版本」限定词（消解与治理文档头注 vX.Y 的字面张力——类目学批 R6 善后）
- [x] 内容挂账：产物模板三要素规范（字段定义/示例行/约束）——031 批随 outline 六模板立法（skill-writing §三 模板文件条）。
- [ ] 基建挂账：junction 链接免手动部署；多域上线后裁定域级命令分发方案（skills.sh 不携带 commands）——薄壳样式：`.claude/commands/abzu-{路由键}.md`，单行 `abzu skill {路由键}`
- [ ] 基建挂账：内容轨加粗密度检查扩展至治理文档——阈值须另行立法（治理文档闸门式加粗 ≠ skill 产物口径，016 外审立例：AGENTS.md 115 处——**该数为 016 时点实测值、非现值**，系立例依据，不随文件刷新）
- [ ] 书目录共享语言文件立法（术语/设定/不变量三段式；立项生成、写作回写——参考 mattpocock/skills CONTEXT-FORMAT；继续挂账，待 write 域真消费方检验）
- [ ] 正文域建设时：会话交接契约立法——当前进度/未决点/下一步/上下文指针落盘成交接文档，支撑跨会话续写（参考 mattpocock/skills handoff 模式）

发布前置（开源发布时执行，现不执行）：README 补"一句话 → 触发 → 产出"演示示例；可选最小 CI（只跑 `agentskills validate`）；Claude 插件市场提交（清单 `.claude-plugin/marketplace.json` 已入库，预检见 release-and-versioning §三）；域内同类项目（oh-story-claudecode 等）对比报告。

## License

MIT
