# Abzu

> 长篇网文 AI 辅助写作工作流 skill——从立项、世界观、分层大纲到逐章起草与修订，阶段门控式人机协同，文件化写作项目支持跨会话续写。

**状态**：v0.1 筹备期——基础设施已就位，skill 本体建设中。

## 安装

skill 位于 `.claude/skills/abzu/`（[Claude Code 项目级路径](https://code.claude.com/docs/en/skills)）。

**日常写作（用户级，所有项目可用）**：

```bash
cp -r .claude/skills/abzu ~/.claude/skills/abzu
```

**本仓库内开发/测试**：用 Claude Code 打开本仓库即可自动发现（项目级 `.claude/skills/`）。

## 快速上手

（占位：待 skill 本体完成后补全——"我想开一本新书" / "继续写下一章" 示例）

## 仓库结构

```
Abzu/
├── AGENTS.md                    # 项目宪法（红线/原则/流程/不做清单）
├── docs/
│   ├── glossary.md              # 术语表（产品语言权威）
│   ├── test-prompts.md          # 评估场景（skill 行为验收）
│   ├── standards/               # 工程规范
│   │   └── file-conventions.md  # 文件命名与格式总表
│   └── specs/                   # 轻量规格（完成即归档）
└── .claude/skills/abzu/         # skill 本体（Claude Code 项目级路径）
```

## 开发

见 [AGENTS.md](AGENTS.md)。修改 skill 后必须重跑 [docs/test-prompts.md](docs/test-prompts.md) 全部场景。

## Roadmap

- [x] 阶段 0：基础设施（宪法/规范/术语表/评估场景/架构落盘）
- [ ] 六域建设（每域：规格 → 开发 → 真测）：扫榜 ✅ ｜ 拆书 ｜ 大纲 ｜ 卷纲 ｜ 正文 ｜ 文风
- [ ] 评估：[test-prompts](docs/test-prompts.md) 六场景全绿
- [ ] v1.x：写作项目内 AGENTS.md 生成、示例项目
- [ ] 基建挂账：GitHub 私有仓远程备份；junction 链接免手动部署

发布前置（开源发布时执行，现不建）：README 补"一句话 → 触发 → 产出"演示示例；可选最小 CI（只跑 `agentskills validate`）；可选 Claude 插件市场打包（`.claude-plugin/marketplace.json`）；域内同类项目（oh-story-claudecode 等）对比报告。

## License

MIT
