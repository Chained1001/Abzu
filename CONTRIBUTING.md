# 贡献指南

本仓库当前为私有自用开发，暂不接受外部贡献；**公开发布后欢迎 PR**，届时在此补充Issue 与 PR 入口。安全问题按 [安全政策](SECURITY.md) 私下报告。

## 本地开发

使用 Node 24.15.0、pnpm 11.27.1，按 [开发说明](docs/development.md) 安装依赖和运行检查。常规检查不需要模型密钥；测试与截图使用合成书仓，不要提交自己的 API key、启动 token、完整对话或私人小说。

## 提交规范

- 提交标题使用 conventional commits 类型：`fix:`、`feat:`、`docs:`、`chore:`、`refactor:`、`test:`，写清最终行为；中文说明可以。
- **一批一提交**：一次改动批次对应一个提交，不把无关改动混进同一提交；顺手修复必须同批声明，让下个会话可追溯。
- 公开发布后的 PR：一个 PR 解决一个可解释的问题，正文写清问题、最终行为、关联 Issue 与实际运行的检查；行为修复带有价值的回归测试，技能/提示词属于运行代码，说明流程和模型调用影响。

## 提交前检查

提交前按 [开发说明](docs/development.md) 跑完检查，全部通过再提交：

```text
pnpm lint
pnpm test
pnpm test:release
pnpm build
```

涉及发行链或公开文档的改动，另跑 `pnpm check:public`、`pnpm check:version` 与 `pnpm --filter abzu pack-check`。

## 合入与发行

公开发布后主线和发行 tag 不强推、不改写。发行流程见 [发行维护说明](docs/maintenance/releasing.md) 与 [发布检查单](docs/maintenance/发布检查单.md)。

所有贡献按本项目 GPL-3.0-only 接收；请确认你有权提交内容，并保留第三方许可声明（packages/*/licenses/ 与 THIRD_PARTY_NOTICES.md）。
