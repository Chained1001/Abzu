# Abzu · 网文写作工作台

> Abzu 0.0.70 配套 **DSH 0.2.1-rc.2**，单包集成工作台与检索增强。

DSH 插件 `abzu`，包含工作台、13 个写作技能、11 个脚本入口（artifact-contract thinScripts 为单源），以及检索增强（`abzu/embeddings`、`abzu/scenes`、`abzu/reranking`）三个可选入口。
要求 Node.js ^22.19.0 或 ^24.0.0，DSH 0.2.1-rc.2。许可证 GPL-3.0-only。

## 安装

在 DSH 0.2.1-rc.2 桌面端侧栏打开“插件 → 添加插件”，选择本地构建的 tgz（或输入 `abzu@0.0.70`），核对后安装并应用变更。桌面端自带运行时，不需要另外安装 Node/pnpm。检索增强随主包一起安装，默认关闭。

tarball 放在无空格目录，并核对 SHA256。首次下载宿主依赖仍可能需要网络。

以下是创建独立 Web profile 的方式，不用于桌面端保留的 `desktop` profile：

```powershell
dsh --profile abzu --from-default-profile web --dump-config
dsh plugin --profile abzu add C:/abzu-dist/abzu-0.0.70.tgz
dsh --profile abzu --host 127.0.0.1 --port 6104 --no-open
```

通过该进程输出的带 token 链接打开页面。随包技能自动发现，无需设置技能目录。
不要同时启用开发用 file patch 与正式安装入口。模型与凭据在宿主设置中配置。

> DSH 0.2.1 起，`--from-default-profile` 重建同名已有 profile 会替换其插件与设置；已有 `abzu` profile 不要重复执行该命令，升级直接用 `dsh plugin --profile abzu add <tgz>`。

## 更新与卸载

先停止指定 profile 的运行实例，再安装目标精确版本并重启（本版为 `C:/abzu-dist/abzu-0.0.70.tgz`）。
卸载命令如下；卸载插件不会删除作品书仓，之后可执行上面的安装命令重装：

```powershell
dsh plugin --profile abzu remove abzu
dsh --profile abzu --dump-config
```

## 文档与声明

当前版本 0.0.70。产品流程与技术说明见源码仓库的 `docs/产品文档.md` 与 `docs/技术文档.md`。

第三方组件的原始声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)，许可证文本随包放在 licenses/。

参考小说拆解：支持作者自备 TXT/EPUB，先预检和登记来源，再选择范围并核对配置模型服务的处理许可；渐进拆解、断点恢复与版本校验。参考原文不随包提供，不下载或处理 DRM。
