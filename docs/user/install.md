# 安装 Abzu 0.0.21

本版配套 **DSH 0.2.0-rc.2**。先安装这个桌面端，再安装插件。

> [!NOTE]
> 桌面端自带运行时。
> 为了安装插件，不需要另装 Node.js 或 pnpm；只有从源码构建 tgz 时才需要。

## 当前安装方式：本地构建 tgz

私有自用阶段没有公开的包仓库，安装分四步：**构建 → 打包 → 安装 → 启用**。

### 1. 构建并打包

1. 按 [从源码构建](../development.md) 准备 Node 24.15.0 与 pnpm 11.27.1，取得本仓库源码。
2. 在仓库根执行 `pnpm install --frozen-lockfile`，然后依次运行 `pnpm lint`、`pnpm test`、`pnpm test:release`。
   成功时，全部检查通过。
3. 执行 `pnpm release:build`。
   成功时，`.tmp/release/0.0.21/` 下生成 `abzu-0.0.21.tgz`，以及 SHA256SUMS 与 release-manifest.json。

### 2. 安装

> [!CAUTION]
> 不要在应用变更时强行关闭程序。
> 先等安装完成。

桌面端保留自己的 desktop profile，优先在侧栏 **插件 → 添加插件** 安装本地构建的 tgz。以下是进阶用户创建独立 Web profile 的方式（与 [插件包说明](../../packages/bundle/README.md) 一致）：

```powershell
dsh --profile abzu --from-default-profile web --dump-config
dsh plugin --profile abzu add C:/abzu-dist/abzu-0.0.21.tgz
dsh --profile abzu --host 127.0.0.1 --port 6104 --no-open
```

tarball 放在无空格目录；安装后按 SHA256SUMS 核对校验和。通过进程输出的带 token 链接打开页面。

检索增强（嵌入、场景识别、重排）随主包一起安装，默认关闭，不影响基础写作；需要时在设置中逐项启用，见 [配置教程](configuration.md)。不想使用某项能力时，在设置里保持对应条目停用即可，不需要卸载或另装。

### 3. 应用变更并启用

> [!NOTE]
> Windows 标题栏的关闭按钮可能只把程序藏进托盘。
> 需要重启时，从应用菜单完全退出，然后再打开。

1. 按插件管理器的提示启用插件。
2. 应用变更。如果页面要求重启，按上面的方式完全退出后再打开。
   成功时，已安装列表符合下面的结果。

- **写作工作台**：包名正确，版本为 0.0.21。启用后可以打开书房。
- **检索增强**：可以找到嵌入、场景识别和重排配置。它们默认关闭。基础写作不必先填写这些项目。

设置中的内置插件列表只用来查看状态。安装和卸载都使用侧栏“插件”页面。

### 4. 配置模型，开始第一本书

1. 在 DSH 中配置聊天模型和凭据。
2. 选择一个用来存放作品的工作区。
   成功时，会话显示这个工作区。

书仓的版本记录需要可用的 Git。如果桌面端提示缺少工具，按它的提示补齐。

然后阅读 [新手教程](beginner.md) 和 [第一本书与第一章](first-book.md)。11 个写作技能随主插件提供。不需要另外安装技能。

## GitHub Release 下载（公开发布后）

公开发布后，可从 GitHub Release 下载对应版本的 tgz 发行件（`abzu-0.0.21.tgz` 式命名）与 SHA256SUMS，再按上面的安装与启用步骤操作。本节在公开发布时改为具体入口与链接。

## 为什么要固定 DSH 版本

插件只针对一个 DSH 版本验证。0.0.21 配套 **DSH 0.2.0-rc.2**。旧版 preview.6 / 提供方 0.0.8 对应 0.1.5-rc.2。

DSH 接口会随版本变化。更高的 DSH 版本不代表已经兼容。

1. 安装或升级前，核对目标插件版本对应的 DSH。
2. 把插件和 DSH 一起更新。
   成功时，两边的版本与上面的对应关系一致。

## 从 0.0.1 四包安装升级为单包

0.0.1 时代的 `abzu-retrieval`、`abzu-companion`、`abzu-full` 不再发布。书仓与配置留在原来的 profile，不随包名搬迁；五条功能入口的条目 id 在 0.0.2 曾保持 `webnovel`、`webnovel-embeddings`、`webnovel-scenes`、`webnovel-reranking`、`whale-companion` 不变，0.0.3 起统一换为 `abzu`、`abzu-embeddings`、`abzu-scenes`、`abzu-reranking`、`abzu-companion`，设置、凭据引用和停用状态按新 id 重新配置；0.0.4 起鲸鱼娘桌宠移除，只剩前四条。

1. 停用正在使用的会话。
2. 卸载旧入口：单独安装过 `abzu-retrieval`、`abzu-companion` 或 `abzu-full` 的，逐个移除。
3. 安装 `abzu@0.0.21`（已安装 `abzu` 的直接更新）。
4. 应用变更并按提示重启。
   成功时，已安装列表只剩 `abzu` 一个入口。
5. 如果自定义 profile 覆盖（cordis.patch.yml）里写有旧模块名或旧条目 id，按 [维护者命令行安装](../maintenance/cli-install.md) 更新为 `abzu/*` 子路径与 abzu 系条目 id；凭据引用名称一并换成 `ABZU_` 前缀。

## 从旧包升级

先阅读 [备份与升级](upgrade-backup.md)。旧检索包是 `webnovel-embedding-provider`。旧桌宠包是 `@linfengqaqtat/dsh-whale-companion`。

> [!WARNING]
> 不要让旧包名和新包名同时启用。

1. 备份工作区和当前 DSH profile。
2. 保存配置和凭据引用。
3. 停止正在运行的会话。
   成功时，没有会话还在写入作品。
4. 在插件管理页卸载旧检索包、旧桌宠或旧 full 入口。
5. 按提示重启。保留备份，不要删除作品。
6. 安装 `abzu@0.0.21`。
7. 核对原有配置和启用状态。
   如果自定义 profile 覆盖里仍写着旧模块名称，按维护文档更新模块引用与条目 id 为 0.0.21 现行值；凭据引用名称一并换成 `ABZU_` 前缀。
8. 确认只剩 `abzu` 一个有效入口，然后再继续写作。
   书稿不会因为改了包名就自动搬迁。

0.1.0-preview.7 / 旧提供方 0.0.9 对应 DSH 0.1.7-rc.2。0.0.21 对应 DSH 0.2.0-rc.2。旧版资料留在相应的 Release。不要把一个版本的说明套到另一个 DSH 上。

[配置教程](configuration.md) · [故障排查](troubleshooting.md) · [维护者命令行安装](../maintenance/cli-install.md)

## 平台与测试范围

| 平台 | 已有验证 |
| --- | --- |
| Windows | Node 22/24 全量测试、构建、类型检查，以及发行包安装验证 |
| Linux | CI 包含公开检查、发行脚本测试，以及 Ubuntu 上的构建和全量测试观察任务 |
| macOS | 暂无可用的测试环境，尚未验证；这不代表不支持 |

Linux 运行时测试目前是观察任务，失败不会阻塞发行。它与 Windows 的安装验证范围不同。具体配置见 [CI 验证说明](../maintenance/ci.md)。
