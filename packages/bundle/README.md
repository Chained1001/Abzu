# Abzu · 网文写作工作台

> Abzu 0.0.33 正式版配套 **DSH 0.2.0-rc.2**，单包集成工作台与检索增强。旧版升级先备份，参阅安装与升级说明。

DSH 插件 `abzu`，包含工作台、11 个写作技能、七个脚本入口，以及检索增强（`abzu/embeddings`、`abzu/scenes`、`abzu/reranking`）三个可选入口。
要求 Node.js ^22.19.0 或 ^24.0.0，DSH 0.2.0-rc.2。许可证 GPL-3.0-only。

## 安装正式版

在 DSH 0.2.0-rc.2 桌面端侧栏打开“插件 → 添加插件”，输入 `abzu@0.0.33`，核对后安装并应用变更。桌面端自带运行时，不需要另外安装 Node/pnpm。检索增强随主包一起安装，默认关闭，不需要再装任何可选包。

以下是进阶用户创建独立 Web profile 的方式，不用于桌面端保留的 `desktop` profile：

```powershell
dsh --profile abzu --from-default-profile web --dump-config
dsh plugin --profile abzu add C:/abzu-dist/abzu-0.0.33.tgz
dsh --profile abzu --host 127.0.0.1 --port 6104 --no-open
```

通过该进程输出的带 token 链接打开页面。随包技能自动发现，无需设置技能目录。
不要同时启用旧开发 file patch 与正式安装入口。模型与凭据在宿主设置中配置。
检索增强已并入本包：设置中的嵌入/场景/重排配置默认关闭；不需要再安装 `abzu-retrieval`、`abzu-companion` 或 `abzu-full`（0.0.4 起鲸鱼娘桌宠移除）。

## 更新与卸载

先停止指定 profile 的运行实例，再安装目标精确版本并重启（本版为 `C:/abzu-dist/abzu-0.0.33.tgz`）。
卸载后可执行上面的安装命令重装：

```powershell
dsh plugin --profile abzu remove abzu
dsh --profile abzu --dump-config
```

卸载插件不会删除作品书仓。安装不需要源码、安装时构建或 npm 账号。tarball 放在无空格目录，并核对对应 Release 提供的 SHA256。首次下载宿主依赖仍可能需要网络。

## 0.0.2 单包合一与旧项目升级

0.0.2 把 0.0.1 时代的 `abzu-retrieval`、`abzu-companion`、`abzu-full` 并入本包；0.0.3 起五条功能入口的条目 id 统一为 abzu 系（`abzu`、`abzu-embeddings`、`abzu-scenes`、`abzu-reranking`、`abzu-companion`；0.0.2 及更早为 `webnovel`、`webnovel-embeddings`、`webnovel-scenes`、`webnovel-reranking`、`whale-companion`），设置、凭据引用与停用状态按新 id 重新配置；0.0.4 移除鲸鱼娘桌宠，`abzu-companion` 条目随之消失。迁移步骤见 [安装教程](../../docs/user/install.md)。

0.0.1 引入的书稿编辑器支持选区/右键改写、续写、审读批注及行内采纳，采纳后还需保存。教程见 [新编辑器图文说明](../../docs/user/editor.md)。

**旧项目升级后请补充并确认作品契约的章节篇幅**：保留“阅读体验与情绪承诺”原内容，追加目标汉字数与宽松上下限，经原契约工具保存确认。未配置仍可使用，但不启用范围核对。脚本按实际正文汉字数检查，越界沿原文本规范发现项处置，不增加审批步骤。见 [升级与备份](../../docs/user/upgrade-backup.md)。

## 公开文档

当前版本 0.0.33。完整的安装、配置、首章和备份教程见 [使用文档](../../docs/user)。

第三方组件的原始声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)，许可证文本随包放在 licenses/。源码及校验和由对应的 GitHub Release 提供。

参考小说拆解：支持作者自备 TXT/EPUB，先预检和登记来源，再选择范围并核对配置模型服务的处理许可；渐进拆解、断点恢复与版本校验。机制留在参考库，新点子通过固定版本引用进入灵感池，旧条目兼容。参考原文不随包提供，不下载或处理 DRM。
