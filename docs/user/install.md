# 安装 Abzu 0.0.45

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
   成功时，`.tmp/release/0.0.45/` 下生成 `abzu-0.0.45.tgz`，以及 SHA256SUMS 与 release-manifest.json。

### 2. 安装

> [!CAUTION]
> 不要在应用变更时强行关闭程序。
> 先等安装完成。

桌面端保留自己的 desktop profile，优先在侧栏 **插件 → 添加插件** 安装本地构建的 tgz。以下是进阶用户创建独立 Web profile 的方式（与 [插件包说明](../../packages/bundle/README.md) 一致）：

```powershell
dsh --profile abzu --from-default-profile web --dump-config
dsh plugin --profile abzu add C:/abzu-dist/abzu-0.0.45.tgz
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

- **写作工作台**：包名正确，版本为 0.0.45。启用后可以打开书房。
- **检索增强**：可以找到嵌入、场景识别和重排配置。它们默认关闭。基础写作不必先填写这些项目。

设置中的内置插件列表只用来查看状态。安装和卸载都使用侧栏“插件”页面。

### 4. 配置模型，开始第一本书

1. 在 DSH 中配置聊天模型和凭据。
2. 选择一个用来存放作品的工作区。
   成功时，会话显示这个工作区。

书仓的版本记录需要可用的 Git。如果桌面端提示缺少工具，按它的提示补齐。

然后阅读 [新手教程](beginner.md)——安装到第一章再到日常写作的全流程都在这一篇。11 个写作技能随主插件提供。不需要另外安装技能。

## GitHub Release 下载（公开发布后）

公开发布后，可从 GitHub Release 下载对应版本的 tgz 发行件（`abzu-0.0.45.tgz` 式命名）与 SHA256SUMS，再按上面的安装与启用步骤操作。本节在公开发布时改为具体入口与链接。

## 为什么要固定 DSH 版本

插件只针对一个 DSH 版本验证。0.0.45 配套 **DSH 0.2.0-rc.2**。旧版 preview.6 / 提供方 0.0.8 对应 0.1.5-rc.2；0.1.0-preview.7 / 旧提供方 0.0.9 对应 0.1.7-rc.2。旧版资料留在相应的 Release，不要把一个版本的说明套到另一个 DSH 上。

DSH 接口会随版本变化。更高的 DSH 版本不代表已经兼容。

1. 安装或升级前，核对目标插件版本对应的 DSH。
2. 把插件和 DSH 一起更新。
   成功时，两边的版本与上面的对应关系一致。

## 从旧版升级

0.0.1 时代的 `abzu-retrieval`、`abzu-companion`、`abzu-full`，以及更早的 `webnovel-embedding-provider`、`@linfengqaqtat/dsh-whale-companion`，升级、卸载与备份的完整步骤统一见 [备份与升级](upgrade-backup.md)（含条目 id 沿革与 cordis.patch.yml 模块名更新）。不要让旧入口与新包同时启用。

## 平台与测试范围

| 平台 | 已有验证 |
| --- | --- |
| Windows | Node 22/24 全量测试、构建、类型检查，以及发行包安装验证 |
| Linux | CI 包含公开检查、发行脚本测试，以及 Ubuntu 上的构建和全量测试观察任务 |
| macOS | 暂无可用的测试环境，尚未验证；这不代表不支持 |

Linux 运行时测试目前是观察任务，失败不会阻塞发行。它与 Windows 的安装验证范围不同。具体配置见 [CI 验证说明](../maintenance/ci.md)。
