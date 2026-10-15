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

私有阶段只做本地构建与自用安装；公开发布时按以下骨架执行，详细操作清单见 [当天检查单](#当天检查单)。

1. 建公开 remote（GitHub 仓库），确认 `pnpm check:public` 全史扫描已绿后首推全部历史。
2. 推送后确认 CI（.github/workflows/v8-ci.yml）在新仓库自动激活并通过。
3. 从已接受的公开提交创建唯一 tag `abzu-vX.Y.Z`，显式推送该 tag；不得移动或重写已发布 tag。
4. `gh release create` 附 `.tmp/release/X.Y.Z/` 下的主包 tgz、源码包、SHA256SUMS、release-manifest.json 与 release-notes，核对 SHA256 与版本一致后发布。
5. 把 [README](../../README.md) 与 [安装教程](../user/install.md) 的安装口径切换为 GitHub Release 下载。

## 当天检查单

公开发布当天的操作清单，承接上文发布流程骨架。逐项执行，每项完成后核对「成功时」结果再进入下一项。

### 一、建仓与首推

1. 在 GitHub 创建公开空仓库（不初始化 README、不添加 .gitignore）。
   成功时，拿到空仓库地址。
2. `git remote add origin <仓库地址>`。
   成功时，`git remote -v` 只显示这一个 origin。
3. 运行 `pnpm check:public`（带全史扫描）。
   成功时，输出 `{"ok":true,...}`。
4. `git push -u origin HEAD`。
   成功时，远端分支与本地一致，历史完整。

### 二、CI 激活确认

1. 打开仓库 Actions 页，确认 v8-ci.yml 工作流在首推后自动触发。
   成功时，工作流开始运行。
2. 等待运行结束。
   成功时，全部分支检查为绿。

### 三、文档切口径

1. [README 安全小节](../../README.md#安全) 把「公开发布后在此补充漏洞报告渠道」替换为实际报告渠道。
2. [README.md](../../README.md) 安装节的「公开发布后」口径改为 GitHub Release 入口，删除本地构建为主的表述或降为开发小节。
3. [安装教程](../user/install.md) 把「GitHub Release 下载（公开发布后）」一节改为实际下载入口与步骤。
   成功时，三处文档不再出现「将来」「公开发布后」的占位说法。

### 四、验收

1. 按 [开发说明](../development.md) 在干净 checkout 完整跑一遍：`pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm test`、`pnpm test:release`、`pnpm build`、`pnpm --filter abzu typecheck`、`pnpm --filter abzu dump-config-check`、`pnpm --filter abzu pack-check`。
   成功时，全部命令退出码为 0。
2. 运行 `node scripts/release/check-public-tree.mjs`（含全史扫描，比 CI 的 --no-history 更严）。
   成功时，输出 `{"ok":true,...}`。
3. 运行 `node scripts/release/version.mjs --check`。
   成功时，README、教程与包内示例的版本号均为当前版本。
4. 推送前本地跑 `node packages/bundle/scripts/kb-extract.mjs --source <KB源目录> --check`（CI 无 KB 源、此闸仅本地有效）。
   成功时，KB 提取物与仓内一致，无漂移。
5. 本机 npm 源为镜像时 `pnpm audit` 报端点不存在，用 `pnpm audit --audit-level=high --registry=https://registry.npmjs.org/`（npmmirror 无 audit 端点，2026-10-14 实测；等价快捷方式 `pnpm audit:public`）。
   成功时，无 high 及以上级别的漏洞告警。

### 五、打 tag 与发布

1. `git tag abzu-v<version>`（版本与 packages/bundle/package.json 一致）。
   成功时，`git tag -l` 显示该 tag。
2. `git push origin abzu-v<version>`（只推这一个 tag）。
   成功时，远端 tag 与本地一致。
3. `gh release create abzu-v<version> .tmp/release/<version>/abzu-<version>.tgz .tmp/release/<version>/abzu-<version>-source.tar.gz .tmp/release/<version>/SHA256SUMS .tmp/release/<version>/release-manifest.json .tmp/release/<version>/release-notes.md --title "Abzu v<version>" --notes-file .tmp/release/<version>/release-notes.md`。
   成功时，Release 页显示全部附件。
4. 核对 Release 页的 tag、版本、附件数与 SHA256SUMS 一致。
   成功时，下载 tgz 并复算校验和相符。

### 六、发布后核对

1. 按 [安装教程](../user/install.md) 的 Release 口径从零安装一次。
   成功时，插件可启用、书房可打开。
2. 核对 CHANGELOG 首节版本与 Release 标题一致、README 无过期版本号。
   成功时，三处（CHANGELOG、README、Release）版本完全一致。

### 七、升版必改四处（每次升版先做，先于上面各节）

版本改动四处同批完成，漏一处不是 `check:version` 红就是 spec 红。

1. `package.json` 与 `packages/bundle/package.json` 的 `version` 同时改为新版本（两者必须相等）。
   成功时，`node scripts/release/version.mjs --check` 不报「Workspace and main release version must agree」。
2. `CHANGELOG.md` 顶部新增 `## [<version>]` 节。
   成功时，同一命令不报「Missing versioned changelog entry」。
3. 文档面版本串：根 `README.md`、`packages/bundle/README.md`、`docs/user/*.md`、`docs/maintenance/*.md` 中的 `abzu-<version>.tgz`、`releases/tag/abzu-v<version>`、`abzu@<version>` 全换新版本；`version.mjs` 只扫这四处，`docs/来源声明.md`、`docs/CONTEXT.md`、`docs/design/` 不在扫描面内，须人工核对。DSH 配套口径已单源到 `docs/user/install.md`（其余文档为「见安装教程」指针）；本版不换 DSH 时该处不动。
   成功时，`node scripts/release/version.mjs --check` 退出码 0。
4. spec 版本钉位：`packages/bundle/tests/skills-batches.spec.ts` 版本纪律组——两根 `package.json` 的版本值、CHANGELOG 条目、两份 README 的当前版本，以及 `docs/user`＋`docs/maintenance`「上一版零残留」断言，全部随版本改。
   成功时，该断言组在 `pnpm test` 中通过。

## 失败与恢复

失败保留检查记录和产物，不宣布发布成功。需要改源码时用新提交与新版本；不能重写已发布的 tag，分支上的发布器修复不会自动进入旧 tag 的产物。发布后的问题以修复版和已知问题说明处理。代码回退不能自动还原已迁移的书仓，应提供备份恢复边界。

## 社区与依赖

外部贡献由维护者审核；单维护者不设置无法满足的第二人必审。保护必要的检查、已解决讨论和禁强推/禁删除规则。Actions 使用固定 commit、最小权限，fork PR 不获得秘密或发版权限。

依赖变更审查 lockfile、实际内联清单和原始许可；高风险漏洞需修复或给出可核对的范围/处置记录。

CI 的分片、诊断与历史失败分析见 [CI 维护说明](ci.md)。用户通过侧栏插件页安装，维护者的命令行安装与旧包迁移见 [升级与备份](../user/upgrade-backup.md#维护者命令行安装与包名迁移)。
