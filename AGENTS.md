# Abzu 项目宪法（AGENTS.md）

> **本仓库是什么**：Abzu = 面向长篇网文创作的 AI 辅助写作工作流 skill（名为 `abzu`），目标宿主 Claude Code（唯一）。skill 本体在 `.claude/skills/abzu/`。
> **本文件定位**：仓库唯一宪法——红线、分工原则、开发节奏、决策流程、不做清单。工程细则见 [docs/standards/ 文件规范](docs/standards/file-conventions.md)；产品语言叫法以 [docs/术语表](docs/glossary.md) 为权威。
> **沿革纪律**：治理变更的来龙去脉记在 CHANGELOG 与 git 历史，本文件只保留当前有效状态，不写沿革史。

---

## 0. 会话起步：验证命令与必读文档

**验证与常用命令**：

- skill 格式校验：`agentskills validate .claude/skills/abzu`（pip 包 `skills-ref`，命令行入口为 `agentskills`）
- 行为验收：按 [docs/test-prompts.md](docs/test-prompts.md) 逐场景走查（修改 skill 后必跑）

**必读文档**：

| 文档 | 管什么 | 何时必读 |
| --- | --- | --- |
| [docs/standards/file-conventions.md](docs/standards/file-conventions.md) | 文件命名与格式 | 新增任何文件前 |
| [docs/standards/markdown-style.md](docs/standards/markdown-style.md) | Markdown 正文写法 | 写/改任何 .md 前 |
| [docs/glossary.md](docs/glossary.md) | 术语叫法 | 写 skill 正文 / 产品文案前 |
| [docs/test-prompts.md](docs/test-prompts.md) | 行为验收基准 | 修改 skill 后 |
| `docs/specs/` | 轻量规格与历史样例 | 非平凡改动开工前 |

## 1. 红线（违反即停）

1. **git 默认只读**：commit / push / reset / stash 等一切 git 写操作，每次单独取得用户明确确认；用户对其他操作（删文件、写文件等）的授权**不外延**到 git 提交推送。
2. **临时产物不入库**：临时验证脚本与输出一律放 `.tmp/<任务>/`，用完即删；不以 `test_*` 前缀伪装正式测试。
3. **外部参考只读**：引用的外部项目与参考目录绝对只读，不在其中安装依赖、跑构建、跑联网命令。
4. **禁带病开工**：动工前先确认评估场景（[docs/test-prompts.md](docs/test-prompts.md)）当前无已知失败；有红先呈报裁决，不在红基线上叠改动。**基线定义**：skill 建设期，因能力尚未建设而失败的场景不计入红基线；已建设能力出现的回归才算红。
5. **失败先判因**：任何测试/校验失败，先定位原因再改；**禁止改断言、改数字、删检查来变绿**。

## 2. 三条分工原则

- **脚本做确定性、AI 做语义、作者做品味**：新增能力先问该哪层做——算术/结构断言/文件操作上脚本，方法论/生成留 AI，停靠裁决与提交确认留作者。
- **candidate 永不拦截**：机检的候选类发现（可能有价值但不确定）只呈报作者，永不阻断流程、永不影响退出码。
- **文件账本律**：工作流每一步必须落盘或修改某个文件；没有文件落点的步骤不存在。状态判定来自文件系统证据，不凭对话记忆。

## 3. 开发节奏（Explore → Plan → Code → Commit）

1. **非平凡改动**（新增文件、跨文件改动、架构性变更）：先探索现状 → 写轻量规格存 `docs/specs/YYYY-MM-DD-<主题>.md`（三要素：现状事实、文件级改动清单、验收标准）→ 用户确认 → 实施 → 验收 → 请求提交。
2. **平凡改动**：直接做，commit 消息写清动机。
3. **小步提交**，Conventional Commits 格式：`feat(skill): ...` / `fix(skill): ...` / `docs: ...` / `chore: ...` / `test: ...`。
4. **提交前自检**：改动是否越出规格范围；验收标准是否全绿；术语是否与术语表一致；新增文件是否符合[文件规范](docs/standards/file-conventions.md)。

## 4. 新增能力决策树

新增任何文件 / 脚本 / 机制前，按序自问：

1. 能否**不新增**（既有文件已覆盖或近似覆盖）？→ 用既有的。
2. 能否**并入现有文件**（某个 reference 的既有章节、某份规范的既有条目）？→ 并入。
3. 必须新增时：**验收标准**是什么？**索引**（`docs/` 内相关文档或 `scripts/README.md`）是否同步更新？→ 缺一不合并。
4. 是否触碰 §6 不做清单？→ 触碰即停，先修订清单并经作者确认。

## 5. 反模式清单（事故回填）

> 格式：「错误做法 → 正确方式 + 事故出处」。初始为继承自 mo-shu 的通则（出处标注"继承"）；本项目事故发生后按此格式回填，并同步评估是否值得引入对应守卫（引入时登记事故出身）。

| # | 错误做法 | 正确方式 | 事故出处 |
| --- | --- | --- | --- |
| 1 | 为过检改断言/改守卫数字 | 先判因；文档数字与实测对齐 | 继承（mo-shu） |
| 2 | 删改机制留文档残留（或反之） | 当次全仓 grep 清理全部引用 | 继承（mo-shu） |
| 3 | 模板/文档写"格式同上、参照上文"式互引 | 显式内嵌完整内容或指向真实路径 | 继承（mo-shu） |
| 4 | 同一规范复制多份维护 | 单一真源 + 引用，发现第二来源即收口 | 继承（mo-shu） |
| 5 | CI/守卫里跑 LLM 或联网 | 场景走查人工判断 + 脚本断言；守卫零外部依赖 | 继承（mo-shu） |
| 6 | 验收命令的退出码经管道被吞（`cmd \| tail` 后取 `$?` 是 tail 的） | 退出码不经管道直接取；必须接管道时取 `PIPESTATUS[0]` | 2026-09-05 lint 体检首轮误判违例数 |

## 6. 明确不做（每条带理由；勿静默引入）

**继承自 mo-shu（多源验证过）**：

- RAG / 向量检索 —— 复杂度与收益不成比例
- 数据库后端（任何形式）—— 文件即真相已够用
- 常驻服务 / Dashboard 产品化 —— 无真实需求
- 多宿主适配 —— 唯一宿主 Claude Code；不做第二宿主通用化，宿主相关内容只出现在 README 安装说明
- CI 里跑 LLM 或联网 —— 守卫零外部依赖
- 拦截式 hook —— hook 只提醒，不拦截

**Abzu v0 追加（事故驱动再评估）**：

- 平行台账（施工日志 / 审核记录）—— spec 文件 + git 历史即台账
- 注册表类守卫（行为契约 / 能力接线 / 引用闭包）—— 引入任何机制须在 §5 登记事故出身
- shared-assets 多副本同步 —— 用单一真源 + 引用从根源避免副本
- CI workflow —— 单人阶段，本地校验脚本够用
- doc-budget 脚本 —— 先用 §7 体积条款约束
- 多人协作治理件（CONTRIBUTING / CODE_OF_CONDUCT / OWNERS）—— 单人开发，作者裁定；意外收到外部 PR 时再评估

## 7. 体积纪律

- `SKILL.md` < 500 行（Agent Skills 开放规范硬约束）；references 单文件建议 < 300 行，超了拆分或下沉。
- **本文件上限 300 行**：超限先压缩；内容确实放不下时下沉到 `docs/standards/` 并在此留一行链接。
- **引用一层深**：SKILL.md → references 为止；references 之间不做深层引用链（同层互引时读者可能看不到对方）。

## 8. 命名与引用速记

总表与细则见 [docs/standards/file-conventions.md](docs/standards/file-conventions.md)（单点权威）。速记：skill 与脚本英文 kebab-case；写作项目（书目录）内产物用中文名；路径一律正斜杠；术语叫法以 [docs/glossary.md](docs/glossary.md) 为准。
