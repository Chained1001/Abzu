# 从公开源码开发

使用公开 v8 分支，推荐 Node 24.15.0、pnpm 11.27.1（源码构建与宿主插件管理统一为该版本）。无需私人任务文件或原书。

```text
git clone --branch v8 --single-branch <本仓库地址>
cd <仓库目录>
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm test:release
pnpm build
pnpm --filter abzu typecheck
pnpm --filter abzu dump-config-check
pnpm --filter abzu pack-check
pnpm check:public
```

常规检查使用合成夹具与固定响应，无需 API key。`SCALE_BENCH=1` 的容量测试和真实模型评测单独运行，不是普通 PR 的前提。大规模容量报告写入 `.tmp/scale-benchmark/`。

## 本地跑测（DSH 宿主内）

在 DSH 宿主里跑全量 `pnpm test` 前，先把临时目录指到工作区内，再跑测试：

```powershell
$env:TEMP = "$PWD\.tmp\dsh-temp"; $env:TMP = $env:TEMP
pnpm test
```

原因：宿主只允许未签名的 `esbuild.exe` 写工作区内部，而 `%TEMP%` 在工作区外，所以它写 `os.tmpdir()` 被拒（`Access is denied`）。直接吃 esbuild 的 4 个 spec 因此整块失败或跳过：`transaction-process`、`retrieval/settings`、`retcon-retry-receipt`、`host-loader`。这与测试代码无关，CI runner 不受影响；在 DSH 之外的普通终端里跑不需要这一步。

## 目录

| 目录 | 职责 |
| --- | --- |
| packages/core | 书仓、状态推导、规划、账本、记忆、检索、导出与安全写入 |
| packages/bundle | 宿主接线、原生客户端、随包技能和打包；内含 retrieval（嵌入/场景/重排）子树 |
| packages/drafting、review、polish | 写稿、审读和修改相关实现 |
| scripts/release | 公开源码检查、版本、许可证、发行与安装验收 |

阅读 [书仓契约](book-format.md) 后修改涉及数据的代码。变更行为带回归测试，文件写入复用现有事务、路径和作者授权通道。

安装已构建的 DSH 后，可使用 `packages/bundle/scripts/start-local.mjs`，传入该 CLI 的实际 `lib/bin.js` 路径；启动器动态生成本机 patch，不需要仓库里的绝对路径文件。开发用 patch 与正式安装入口不要同时启用。

发行构建只内联项目实现和普通依赖，Cordis/DSH/React 等宿主共享模块保留 peer 身份。构建生成原始第三方声明，并通过实际 tarball 检查证明随包内容。

## 提交规范

- 提交标题使用 conventional commits 类型：`fix:`、`feat:`、`docs:`、`chore:`、`refactor:`、`test:`，写清最终行为；中文说明可以。
- **一批一提交**：一次改动批次对应一个提交，不把无关改动混进同一提交；顺手修复必须同批声明，让下个会话可追溯。
- 上述命令全部通过再提交；涉及发行链或公开文档的改动，另跑 `pnpm check:public`、`pnpm check:version` 与 `pnpm --filter abzu pack-check`。
- 测试与截图使用合成书仓，不要提交自己的 API key、启动 token、完整对话或私人小说。

本仓库当前为私有自用开发，暂不接受外部贡献；**公开发布后欢迎 PR**：一个 PR 解决一个可解释的问题，正文写清问题、最终行为、关联 Issue 与实际运行的检查；行为修复带有价值的回归测试，技能/提示词属于运行代码，说明流程和模型调用影响。主线和发行 tag 不强推、不改写；发行流程见 [发行说明](maintenance/releasing.md) 与 [发布检查单](maintenance/发布检查单.md)。所有贡献按本项目 GPL-3.0-only 接收；请确认你有权提交内容，并保留第三方许可声明（packages/*/licenses/ 与 THIRD_PARTY_NOTICES.md）。
