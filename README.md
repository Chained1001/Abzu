# Abzu

> 长篇网文 AI 辅助写作工作流 skill——从立项、世界观、分层大纲到逐章起草与修订，阶段门控式人机协同，文件化写作项目支持跨会话续写。

**状态**：v0.1 筹备期——基础设施已就位，skill 本体建设中。

## 安装

skill 位于 `.agents/skills/abzu/`，两种安装方式：

**ZCode**（用户级，所有项目可用）：

```bash
cp -r .agents/skills/abzu ~/.agents/skills/abzu
```

**Claude Code**（用户级）：

```bash
cp -r .agents/skills/abzu ~/.claude/skills/abzu
```

本仓库内开发时无需安装：ZCode 会自动从 `.agents/skills/` 发现。

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
└── .agents/skills/abzu/         # skill 本体
```

## 开发

见 [AGENTS.md](AGENTS.md)。修改 skill 后必须重跑 [docs/test-prompts.md](docs/test-prompts.md) 全部场景。

## Roadmap

- [x] 阶段 0：基础设施（宪法/规范/术语表/评估场景）
- [ ] 阶段 1：skill 本体（SKILL.md + 各阶段 references）
- [ ] 阶段 2：评估迭代（跑通 5 个场景并修订）
- [ ] v1.x：写作项目内 AGENTS.md 生成、scripts/ 辅助脚本、示例项目

## License

MIT
