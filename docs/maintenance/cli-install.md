# 维护者命令行安装与包名迁移

新手使用 [DSH 插件管理页面](../user/install.md)。本页供维护已有 Web profile 或离线包的用户使用，配套 DSH 0.2.0-rc.2。

```powershell
dsh --profile abzu --from-default-profile web --dump-config
dsh plugin --profile abzu add abzu@0.0.38
dsh --profile abzu
```

已有 profile 不再初始化。Desktop 使用自己的 desktop profile，不套用 Web 模板；优先在桌面插件页管理。

0.0.2 起检索增强与桌宠并入主包，`abzu` 是唯一的安装入口；不再有 `abzu-retrieval`、`abzu-companion`、`abzu-full`（0.0.4 起鲸鱼娘桌宠移除）。

## 旧包迁移

先停止实例，备份 profile 和作品。只卸载实际安装过的旧入口：webnovel-embedding-provider、@linfengqaqtat/dsh-whale-companion、0.0.1 的 abzu-retrieval / abzu-companion / abzu-full。再安装 `abzu@0.0.38`。不要在同一启用配置中保留旧包和新包。

如果 cordis.patch.yml 中有显式 name 覆盖，把模块引用更新为并入后的子路径：`abzu-retrieval` 换为 `abzu/embeddings`，`abzu-retrieval/scenes` 换为 `abzu/scenes`，`abzu-retrieval/reranking` 换为 `abzu/reranking`；桌宠模块 `abzu-companion` 已在 0.0.4 随功能移除，对应条目直接删除。条目 id 用 abzu 系：`abzu`、`abzu-embeddings`、`abzu-scenes`、`abzu-reranking`（0.0.2–0.0.3 还有 `abzu-companion`；0.0.2 及更早为 `webnovel`、`webnovel-embeddings`、`webnovel-scenes`、`webnovel-reranking`、`whale-companion`，0.0.3 起统一换新）；保留 config 和凭据引用。先核对 dump-config，再启动并验证设置。

Windows 替换已加载包可能遇到占用。使用应用菜单完全退出后重装同一发行原件，核对实际安装文件；不要删除 profile 或作品来解决缺包。
