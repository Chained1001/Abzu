# 维护与发行规范

## 分支与提交

提交标题使用 fix/feat/docs/chore 等类型，写清最终行为。公开发布后只接受基于公开历史的主题 PR；私有开发阶段的内部记录不进入公开历史。不得覆盖未知贡献、强推公开主线或用 `push --all`、`--mirror`、批量标签推送发布。本仓未启用任何 git hooks。

## 版本

主包 `packages/bundle/package.json` 是安装包版本真源，根 workspace 同步该版本。`pnpm check:version` 核对 CHANGELOG；发行时 `RELEASE_TAG` 必须等于 `abzu-v<version>`。

- 兼容修复递增 patch；0.x 的新增能力/不兼容变化递增 minor，并说明迁移影响。
- 1.x 后按 SemVer 承诺：破坏兼容递增 major，兼容功能 minor，修复 patch。
- 纯文档修改不必发包。内部 workspace 包不独立发版。0.0.2 起四包合一：`abzu` 是唯一安装包，工作台与检索增强随它同版发行（0.0.4 起桌宠移除），不再有可选组件组合与"四包同版"约束。
- 0.0.1 及更早的四包同版机制（abzu / abzu-retrieval / abzu-companion / abzu-full）已废止；若将来拆回组件发版，须同时修改 version/build、manifest 与兼容安装矩阵，不能只改版本号或文案。

tag、CHANGELOG、包版本和附件必须对应。不得替换已发布同版本的字节；有错误就发布新版本。源码/打包位级可复现未作保证，验收和上传必须使用同一份生成的 tgz。

## 发版前

1. 发布提交更新版本、锁文件、CHANGELOG、支持矩阵和必要教程。
2. 公共内容扫描和依赖许可证核对通过。
3. 在干净 checkout 执行完整测试、构建和实际 tarball 校验。根测试覆盖所有包的测试，发行只跑一次完整测试；工作流回归检查覆盖清单，避免遗漏或重复执行。
4. 确认没有尚未说明的格式迁移、数据恢复或真实模型限制。

## 生成与验收

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm test:release
pnpm release:build
```

`release:build` 拒绝脏源码、非公开文件和非空输出目录；构建后核对声明，pack 一次并实包检查主包，生成对应源码包、公开版本清单（release-manifest.json）与 SHA256SUMS。输出默认在 `.tmp/release/<version>/`。

标签创建后只修复发行工具时，可从已审阅的新公共工具 checkout 运行 `pnpm release:build -- --source <干净的原标签目录> --out <新空目录>`，并设置 `RELEASE_TAG`。源码 HEAD 必须等于该标签，版本与 manifest.publicCommit 仍来自原源码。若前次打包已完成、仅源码附件收集失败，额外传 `--packages <原包目录>` 复用原主包 tgz，重新执行实包检查；禁止用它替换已发布附件或绕过源码/安装验收。

对生成的同一主包执行实包核对：`pnpm --filter abzu pack-check -- <main.tgz>`（manifest/技能/许可清单/内嵌媒体哈希逐项断言）。报告不能冒充真实模型创作验收。

人工再核对浏览器入口、配置与合成首章教程。模型服务的调用费用单独记录；不以程序回归替代模型质量判断。

## GitHub 发布流程（将来）

私有阶段只做本地构建与自用安装；公开发布时按以下骨架执行，详细操作清单见 [发布检查单](发布检查单.md)。

1. 建公开 remote（GitHub 仓库），确认 `pnpm check:public` 全史扫描已绿后首推全部历史。
2. 推送后确认 CI（.github/workflows/v8-ci.yml）在新仓库自动激活并通过。
3. 从已接受的公开提交创建唯一 tag `abzu-vX.Y.Z`，显式推送该 tag；不得移动或重写已发布 tag。
4. `gh release create` 附 `.tmp/release/X.Y.Z/` 下的主包 tgz、源码包、SHA256SUMS、release-manifest.json 与 release-notes，核对 SHA256 与版本一致后发布。
5. 把 [README](../../README.md) 与 [安装教程](../user/install.md) 的安装口径切换为 GitHub Release 下载。

## 失败与恢复

失败保留检查记录和产物，不宣布发布成功。需要改源码时用新提交与新版本；不能重写已发布的 tag，分支上的发布器修复不会自动进入旧 tag 的产物。发布后的问题以修复版和已知问题说明处理。代码回退不能自动还原已迁移的书仓，应提供备份恢复边界。

## 社区与依赖

外部贡献由维护者审核；单维护者不设置无法满足的第二人必审。保护必要的检查、已解决讨论和禁强推/禁删除规则。Actions 使用固定 commit、最小权限，fork PR 不获得秘密或发版权限。

依赖变更审查 lockfile、实际内联清单和原始许可；高风险漏洞需修复或给出可核对的范围/处置记录。

CI 的分片、诊断与历史失败分析见 [CI 维护说明](ci.md)。用户通过侧栏插件页安装，进阶命令见 [CLI 维护说明](cli-install.md)。
