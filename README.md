# Abzu

> 长篇网文 AI 辅助写作工作流 skill——从立项、世界观、分层大纲到逐章起草与修订，阶段门控式人机协同，文件化写作项目支持跨会话续写。

**状态**：v0.3.0——扫榜调研域已可用（多技能骨架，其余五域占位待建）。

## 安装

**推荐（[skills.sh](https://www.skills.sh/docs/cli) 包管理器，自动探测 Claude Code 并装入用户级）**：

```bash
npx skills add Chained1001/Abzu -y
```

**离线备选（手动复制）**：

```bash
cp -r skills/abzu-scan ~/.claude/skills/abzu-scan
```

前置：Node.js 20+（扫起点榜仅需此一项）；番茄/七猫/晋江走 CDP 采集另需 Chrome 与 `npm install -g agent-browser`（一次性）。

安装后新开会话即可使用：敲 `/abzu-scan` 或直接说"扫一下起点榜"。终端 Claude Code 与 VSCode 的 Claude Code 插件共用 `~/.claude/` 配置，本安装对两者同时生效；作者日常使用环境为 VSCode 插件（新对话即新会话）。

**本仓库内开发**：skill 在根目录 `skills/` 下（产品源码位，Claude Code 打开本仓库不自动加载）；实测走上面的安装流程到独立文件夹进行。

## 解决什么问题

| 写作失效模式 | 对应域 |
| --- | --- |
| 选题踩雷：跟风过热题材、写前对市场心中无数 | abzu-scan（已可用） |
| 拆书不得法：说不清好书为什么好，吸收不成方法 | abzu-analyze |
| 结构崩塌：大纲失控、卷线断裂、伏笔失管 | abzu-outline / abzu-volume |
| 断更卡文：进度失控、前后矛盾、续写断片 | abzu-write |
| 文风漂移：越写越不像自己、口径不一 | abzu-style |

其余五域占位待建（状态见下方仓库结构与 Roadmap）。

## 快速上手

（占位：待 skill 本体完成后补全——"我想开一本新书" / "继续写下一章" 示例）

## 仓库结构

```
Abzu/
├── skills/
│   ├── abzu-scan/               # 扫榜调研（已可用）
│   │   ├── SKILL.md             # 域壳：入口判定 + 门控
│   │   ├── references/scan/     # 10 份方法论与模板
│   │   └── scripts/             # 7 个脚本（抓取+提取+CDP）
│   ├── abzu-analyze/            # 拆书分析（占位壳）
│   ├── abzu-outline/            # 大纲（占位壳）
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

- [x] 阶段 0：基础设施（宪法/规范/术语表/评估场景/架构落盘）
- [ ] 六域建设（每域：规格 → 开发 → 真测）：扫榜调研 ✅ ｜ 拆书 ｜ 大纲 ｜ 卷纲 ｜ 正文 ｜ 文风
- [ ] 评估：[test-prompts](docs/test-prompts.md) 六场景全绿
- [ ] v1.x：写作项目内 AGENTS.md 生成、示例项目
- [ ] 大纲域建设时：移植 mo-shu 题材卡库（genre-prose-cards 约 19 卡 + genre-catalog 别名索引）入 references/common/——共性知识缓存 + 别名路由（采风前置查库收窄检索）；届时恢复扫榜选题决策的题材库覆盖字段
- [ ] 拆书域开工时：立法 skill 调用契约（输入校验/输出格式/失败返回三要素模板）
- [ ] 任一域引入外部依赖时：立法系统性依赖声明清单（Node 版本/pip 包/全局 CLI 逐项登记）
- [ ] scan 首次真测后：立法每域最低测试要求（几个场景/什么断言/怎么算通过）
- [ ] 内容挂账：产物模板三要素规范（字段定义/示例行/约束）——等首个原生模板（立项域 project.md）出现时立法。
- [ ] 基建挂账：junction 链接免手动部署；多域上线后裁定域级命令分发方案（skills.sh 不携带 commands）——薄壳样式：`.claude/commands/abzu-{域}.md`，单行 `abzu skill {域}`
- [ ] 基建挂账：内容轨加粗密度检查扩展至治理文档——阈值须另行立法（治理文档闸门式加粗 ≠ skill 产物口径，016 外审立例：AGENTS.md 115 处）
- [ ] 基建挂账：宪法 §3.8 下沉评审（与 collab-log 核验协议去重，反模式 #4 视角）
- [ ] 大纲域建设时：书目录共享语言文件立法（术语/设定/不变量三段式；立项生成、写作回写——参考 mattpocock/skills CONTEXT-FORMAT）
- [ ] 正文域建设时：会话交接契约立法——当前进度/未决点/下一步/上下文指针落盘成交接文档，支撑跨会话续写（参考 mattpocock/skills handoff 模式）

发布前置（开源发布时执行，现不执行）：README 补"一句话 → 触发 → 产出"演示示例；可选最小 CI（只跑 `agentskills validate`）；Claude 插件市场提交（清单 `.claude-plugin/marketplace.json` 已入库，预检见 release-and-versioning §三）；域内同类项目（oh-story-claudecode 等）对比报告。

## License

MIT
