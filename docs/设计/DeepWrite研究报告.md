# DeepWrite 研究：结论与可借鉴项

> 状态：**研究结论，非实施计划**。
> 起因：2026-10-20 评估「Abzu 是否改做桌面应用」。

---

## 一、结论先行

**不做桌面。保持现状（DSH 插件形态）。**

决定性理由不是工程量，而是：**DSH 本身就是 Electron 桌面应用**，Abzu 已经运行在桌面壳里。

本机实测（`D:\DeepSeek Harness`）：

| 证据 | 值 |
|---|---|
| 主程序 | `DeepSeek Harness.exe`，246 MB |
| 应用包 | `resources/app.asar`，182 MB |
| Electron 版本 | **44.7.0**（`version` 文件 + `LICENSE.electron.txt`） |
| Chromium 资产 | `chrome_100_percent.pak`、`icudtl.dat`、`v8_context_snapshot.bin`、`ffmpeg.dll` |
| 插件安装位置 | `resources/app.asar.unpacked/dsh/` |

所谓「改成桌面应用」的真实含义，是**放弃 DSH 这个外壳，自建一个**。代价是重新实现：

- Electron 运行时与打包、签名、更新链
- Agent 循环（工具调用、重试、超时、中止、上下文压缩）
- 工具协议与 JSON Schema 校验
- 会话持久化、子代理派生与调度
- 权限模型与作者提问通道
- 现有 Web GUI

Abzu 自己的客户端只有 **49 文件 / 5,506 行**（`packages/bundle/src/client/`），绝大部分能力由 DSH 提供。自建外壳等于把 5,506 行之外的基础设施全部重做。

**参照系**：DeepWrite 走了「自己造全套」这条路，代价是 37.3 万行源码、16 个 open issue、31 个超千行文件（最大 7,012 行）。

---

## 二、DeepWrite 是什么

2026-10-20 核实（v1.7.1，`swjybky/deepwrite`）：

| 指标 | 数值 |
|---|---|
| 源码 | 2,457 文件 / 372,841 行 |
| 测试 | 953 文件 / 176,224 行（占 47%） |
| Star / Fork | 657 / 90 |
| Open issues | 16 |
| 技术栈 | Electron 42 + Vue 3 + TypeScript + Zod + pnpm workspace |
| 活跃度 | 当日仍在推送 |

代码纪律很好——全库扫描标记：`TODO` / `FIXME` / `HACK` / `XXX` / `@ts-ignore` / `@ts-expect-error` / `as any` / `eslint-disable` **全部为 0**。

### 许可证：源码可用，非开源

**2026-10-18（commit `7d1ec85`）从 Apache 2.0 改为 PolyForm Perimeter 1.0.1。**

- 禁止「以竞争产品形式提供给他人」，且明确写明**换界面、换平台、换语言、免费提供都不构成规避**
- 项目 README 自述「不符合 OSI 开源定义，因此对外表述为『源码可用』」
- **v1.6.5 及更早仍是 Apache 2.0**（`NOTICE` 载明历史授权不撤销）

作者本人自用不受限。若将来要对外分发，只有两条路：只借设计不搬代码，或以 v1.6.5 为基点 fork。

### open issue 概况（16 条，无致命 bug）

- **性能 8 条**（#28/29/30/32/34/36/39/46，同一贡献者系统性压测）：上千章时导航卡死渲染器、拆书 O(N²)、来源上限 50,000,000 与任务 schema 上限 20,000,000 不一致、1 MiB catalog 上限、每节点 3 个全局监听器
- **安全 1 条（最严重）**：#16 官方安装包明文写死阿里云 OSS 密钥，各平台同一构建产物；成因是 Vite 把 `.env` 内联进 `out/main/index.js`。至今 open
- **兼容性**：#26 接入硅基流动必现 400（`resolveOpenAICompletionsCompat()` 只特判火山/通义/智谱，硅基流动落到默认 OpenAI 形状，发出了 `store`／`developer` 角色／`max_completion_tokens`／`reasoning_effort`）

---

## 三、两套架构的对照

| 维度 | DeepWrite | Abzu |
|---|---|---|
| 形态 | 自建 Electron 壳 + 自有 Agent 运行时 | DSH 插件（peer 依赖 `@deepseek-ai/dsh-*` 0.2.1-rc.2 + Cordis 4.0.5） |
| Agent 内核 | 自研 `pi-runtime-adapter/kernel/`（21 文件 3,067 行） | 复用 DSH |
| 工具面 | **9 件基础工具**（list/read/create/edit/delete + query_linked_material_entries + load_skill + propose_continuity_commit + ask_user_question） | **33 件领域工具** |
| 磁盘布局 | `long/chapters/<sha256前32位>/body.md`（ID 哈希，路径不可读） | `定稿/卷01/0001-章名.md`（人类可读、Git 友好） |
| 流程定义 | `AGENTS.md` 文本（随作品保存、用户可编辑、上限 10,000 字） | 13 个 skill + 门禁 + 软校验 |
| 阶段约束 | **无状态机、无阶段门**（全库搜无阶段门代码，`LONG_WORKSPACE_ROOTS` 只是字符串枚举） | 阶段可判定、门禁在代码里、状态从文件推导 |
| 并发策略 | 长篇主动 last-write-wins（`io.ts:73-88` 剥掉 `expectedSha256`） | 书锁 + 事务 + 收据重放 |

**唯一顺序硬约束**（DeepWrite）：首次写作不能跨过空白前章（`write-chapter.ts:44-49`）、连续性记录只建在已写完未提交的章上（`commit-chapter.ts:35-40`）。

**关键判断**：运行时与存储哲学互斥，Abzu 的方法论层（纯 Markdown + 纯函数）可以搬，但把 Abzu「移植进」DeepWrite 等于丢掉 Abzu 最值钱的两样东西——可判定门禁与 Git 真源。

---

## 四、值得偷的四个设计（纯逻辑，与运行时无关）

这几条 Abzu 目前都没有，且都是真问题。按价值排序：

### 4.1 提案回执层（最值得做）

`write-approval.ts:38-58` + `prompts.ts:246-259`

把上一轮提案的写入结果——**已保存 / 被拒 / 冲突 / 失败 / 撤销**——渲染成【上一轮修改的处理结果】，拼进下一轮用户消息。

规则三句：已保存别重提；被拒别原样重提；冲突或失败先重读再提交。

**解决的问题**：模型不知道上一轮到底写没写成，于是反复重提同一处，或以为存了其实没存。这是「不静默覆盖」真正闭环的地方。

**Abzu 现状**：`novel_import_draft` 有 `followup` 回执，但只覆盖导入这一个动作，没有跨动作的统一回执。

### 4.2 读凭证（没读过的不许改）

`context.ts:66-73` + `tool-edit.ts:49-74`

- 没被**完整读过**的文档/记录不允许编辑
- 上下文压缩把读过的内容压掉后，凭证**自动清空**
- replace 片段不唯一直接失败

**解决的问题**：模型凭记忆改一段它没看过的文字。

**Abzu 现状**：改稿走「发现项 → 处置」流程，有映射字段（0.0.87 新增 `改动映射`），但没有「必须先读过原文」的机械约束。

### 4.3 破坏性按「模拟结果」判定，不按命令名

`impact-policy.ts:12-26`

只要模拟结果显示有删除实体/关系/文件或账本编辑，就必须带精确 `expectedImpact`——**跟命令叫什么名字无关**。

**解决的问题**：「更新型命令偷偷删东西」——命令名叫 `update` 也可能删内容。

**Abzu 现状**：校验多按字段名/小节名（四固定小节、章型、九节完整），是「按名字」而非「按后果」。

### 4.4 工具面收敛：稳定 id + 前缀决定类型

`entity-registry.ts:3-70`

9 件工具覆盖所有实体种类；新增实体种类只需在 `entity-registry.ts` 加一行映射，**工具签名永不变**。容器结构（分类、类型）被排除在可创建/可删除集合外——AI 只能改内容，不能重排用户的目录。

**与 Abzu 的取舍**：Abzu 的 33 件领域工具在「每个动作有明确语义、便于门禁」上更优；DeepWrite 的做法在「扩展性、降低模型选择负担」上更优。**不建议改 Abzu 的工具面**，但「容器归用户独占」这条纪律值得检查 Abzu 是否有对应保护（比如 AI 能否自行增删世界书分类）。

---

## 五、DeepWrite 已有的、Abzu 不需要学的

- **提案 → 差异 → 接受** 三层落盘：Abzu 已有「作者审批 + 原子写 + 收据重放」，粒度更细（`novel_settle_chapter` 要宿主提问通道批准）
- **事务 + 只前滚恢复**：Abzu 有 `writeBatchAtomic` + 事务恢复
- **子代理调度/抽卡**：Abzu 的子代理是「主控组装任务包」，模型不同，不构成优劣
- **上下文渐进披露**：Abzu 用技能按需加载 + 软预算，思路一致

---

## 六、如果将来要做，先看这个

以下情形才值得重新考虑自建外壳：

1. DSH 插件 API 出现硬限制（无法自定义窗口/菜单/快捷键，或无法控制某个必需行为）
2. 需要离线分发且不能依赖 DSH 安装
3. 需要上架应用商店

**目前都不成立**：已知问题（门禁、流程、跨章统计）都落在插件的业务层，与外壳无关。

---

## 附：研究资料位置

研究材料按工程规范 §6「仓外沙盘产物不入项目」放仓外，不随仓库分发：

- 原始克隆：仓外目录 `deepwrite-study/`（只读研究，未安装依赖、未构建）
- 架构流程报告：仓外目录 `deepwrite-study-notes/01-架构与流程.md`（408 行）
- 规模统计：同一目录下 `inventory.csv`、`markers.json`、`teststats.csv`

复现方式：把 `github.com/swjybky/deepwrite` 浅克隆到任意仓外目录即可，本报告的全部数字都能从该克隆重新量出。

**报告未验证项（如实转述）**：全部结论来自静态阅读，未运行验证；`folder-catalog-store.ts`（7,012 行）与 `folder-catalog-store/` 目录的迁移完成度未审计；`long-book-decomposition/`（50 文件 6,926 行）只读了入口；Renderer 1,288 文件只抽查了提案/生命周期/传输相关部分。
