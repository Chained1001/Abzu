# 架构决策记录（Abzu）

> 版本：v1.6（沿革见 CHANGELOG 与 git 历史）
> 定位：架构选型与理由的**唯一权威**——后续所有施工批以本文件为架构依据；变更须修订本文件并记录理由。
> 配套：工程规范见 `docs/standards/`；术语见 [glossary.md](glossary.md)；验收见 [test-prompts.md](test-prompts.md)。

## 一、裁定记录

- **承载架构**（2026-09-06 修订）：**多技能骨架**——六域各一 skill（abzu-scan / abzu-analyze / abzu-outline / abzu-volume / abzu-write / abzu-style）+ 未来 abzu-setup（T1 触发）。当前 abzu-scan 与 abzu-analyze 建有内容（abzu-outline 曾建成、2026-09-10 推倒重设——036 批），其余四壳占位。
- 首建域：扫榜调研（scan），完成后真实实测，再开下一域。
- v1 范围：仅六域；导入 / 独立审查 / 抓取底座独立化均不做（抓取底座作为扫榜调研域内置脚本随行）。

## 二、选型理由（单 skill vs 多 skill）

**决定性判据：六域共享同一份可变状态（写作项目的 project.md / tracking / 手稿）**——共享资产的归属方式是两方案的分水岭。

| 维度 | ~~单 skill 六域~~（已由多技能骨架裁定取代，见 §一） | 多 skill 分立 |
| --- | --- | --- |
| 共享资产 | `references/common/` 一份正本，零机制 | 需同步机制（mo-shu 为此养 64 组字节对账 + 守卫）或内嵌副本（漂移风险） |
| 精准入口 | 6 个一行命令薄壳（一次性十分钟） | skill 本名即命令，免费 |
| 上下文 | SKILL.md 薄总控常载 + references 按需读，与多 skill 持平 | 只载命中域 |
| 版本/安装 | 一份版本号、一个目录、两条 cp | N 份 frontmatter 对齐（mo-shu 为此建四轨守卫） |
| 触发 | 一条 description 收敛（mo-shu 作者实测裁定方向） | 六域同属"写小说"，自然语言互抢，靠直呼纪律压制 |
| 反向迁移 | 拆出容易（先合后拆） | 合并极难（mo-shu 从未做成，税一直交） |

实测数据支撑（mo-shu v2.6.1）：六域合计 188 份 references / 约 26,000 行；跨 skill 同步副本 64 组。单 skill 形态下这 64 组塌缩为 `common/` 一份正本，总盘反而更小。规模躺在磁盘上而非上下文里——按需加载下，单次会话只进总控 + 当前域 workflow + 两三份方法论。

逃生舱：输入侧域（scan / analyze，不读写书目录）未来可低税拆出；产出侧四域深度耦合共享状态，不拆。

**成长路径与拆分触发器**（2026-09-06 补——项目预期发展为大体量开源项目，作者质询"长大了还单技能吗"）：

- 内容量增长（方法论/知识库/脚本扩充至数万行）**不构成**拆分理由——渐进披露下内容躺磁盘不进上下文；且共享约定随域增加而增值（单副本被更多域摊薄）
- **T1 拆分触发**：运行时组件物化需求出现（hooks/子代理进书项目，如正文域引入评审分身）→ 诞生 /abzu-setup，届时评估组件重载域是否独立（参考实现：ECC 的全家桶插件模式）
- **T2 拆分触发**：外部用户提出选择性安装或市场分发需求 → 先以单插件打包整体 skill，仍不足再拆输入侧（scan/analyze 与书目录解耦，拆分税最低）
- **T3 拆分触发**：某域与书目录状态彻底解耦且需独立演进 → 可拆
- 终态形态（可能含多 skill + setup）由 T1-T3 依真实需求推动到达，**不预先构建**

## 三、落定结构

```
skills/
├── abzu-scan/                # ① 扫榜调研（已建设）
│   ├── SKILL.md              # 域壳：入口判定（进度自查）+ 指向域工作流
│   ├── references/scan/      # workflow + 采集/分析/选题/读者/题材/运营/格式 + cdp-base
│   └── scripts/              # 四平台抓取器 + scan-analyze + CDP 启动器
├── abzu-analyze/             # ② 拆书分析（已建设）
│   ├── SKILL.md              # 域壳：入口判定（拆书目录自查）+ 指向域工作流
│   ├── references/analyze/   # workflow + 方法真源 + 六维/爆款/证据边界/黄金三章模板 + 结构块 CSV spec
│   └── scripts/              # build-chapter-index（机械章节索引）
├── abzu-outline/             # ③ 大纲（占位壳——推倒重设中）
├── abzu-volume/              # ④ 卷纲（占位壳）
├── abzu-write/               # ⑤ 正文（占位壳）
├── abzu-style/               # ⑥ 文风（占位壳）
└── （abzu-setup 于 T1 触发时诞生：物化 hooks/子代理/共享知识库进书项目）
```

共享知识库（题材卡等跨域方法论）安放方案：由 setup 物化进书项目（agent-references 模式）；书目录规范由立项域物化。

## 四、精准入口机制

多技能骨架下 **skill 本名即精准命令**：`/abzu-scan`、`/abzu-outline` 等由 Claude Code 斜杠菜单原生补全，无需命令薄壳（单技能时期的方案，随骨架切换退役）。域内细分操作按各域工作流的交互模态执行。

**调用双层**（2026-09-07 参考 mattpocock/skills invocation 单轴模型立法）：六域 skill 入口**唯一**——`/abzu-{域}` 显式调用（description 声明触发边界，自然语言提及不触发——2026-09-10 作者裁定，模糊触发不可控、入口确定性优先；mo-shu 自然语言互抢教训见 §二）。**层次收窄说明**：六域显式直呼与未来命令薄壳同属用户显式发起层——「双层」此后指「域 skill 直呼」与「薄壳编排」两级入口，模型自主匹配层退役；skill 之间**禁止互相调用**——跨域只经落盘文件衔接（§六「域是平行的门」）。未来预留的命令薄壳（file-conventions 预留行）若启用，属 **user-invoked 编排层**：只可调用域 skill，域 skill 永不反向调用薄壳或其他域 skill。

## 五、部署与实测循环

```
改 skill → bash scripts/check.sh → npx markdownlint-cli2
        → 在目标项目目录 npx skills add Chained1001/Abzu -y（项目级 vendor + 软链——仓库内禁跑，check.sh [0] 守卫；离线备选 cp -r skills/abzu-scan ~/.claude/skills/abzu-scan）
        → 新会话（新文件夹）敲 /abzu-scan 真测
```

v1 无部署器：没有 hooks / agents / 项目级 CLAUDE.md 需要物化，安装即全部部署；书项目脚手架由立项流程自建；升级检测走 `project.md` 的 `schema` 字段（release-and-versioning §四）。skills.sh 安装只携带 skill 文件夹（不含 `.claude/commands/` 薄壳）——六域 skill 本名即命令，多域已就位（四占位 + 两实建）；域级命令分发方案已裁定为 skill 本名（见 §四）。

**setup 等价物的触发条件**：将来引入需要物化进书项目的组件（hooks / 子代理 / 项目级模板）之日，才引入 `/abzu-setup`——此前不做（防未来会话重复纠结）。职责边界（2026-09-07 参考 mattpocock/skills ADR-0001）：setup 只处理**硬依赖**——物化组件落盘与依赖预检；题材偏好、平台选择等**软配置不进 setup**，由各域工作流首用交互自行采集。

**行业安装原型对照**（2026-09-06 调研：awesome-novel-agent / webnovel-writer / oh-story / ECC / anthropics 官方）：

| 原型 | 安装 | 初始化 | 适用 |
| --- | --- | --- | --- |
| ① 零初始化纯技能 | skills.sh / 插件市场 / 复制 | 无（技能自包含） | 纯知识/流程技能——**Abzu 当前形态** |
| ② 首用即初始化 | 同上 | 域技能首步工作流自动 init（新目录检测→建骨架） | 产物需落进书项目（网文技能类最主流） |
| ③ 独立 setup 技能 | 插件市场 + setup | 独立部署技能物化 hooks/agents/知识库 + 版本哨兵 | 常驻确定性组件（hooks/agents）出现时——**T1 之后的 Abzu 形态** |

Abzu 现状为原型①（标准、零摩擦）；「扫榜目录首用创建」已实现原型②的 init-on-first-use；T1 触发时按原型③立法 `/abzu-setup`（设计参考以 §七 T1 标杆为准）。安装预检（依赖版本前置报错）随脚本依赖复杂化挂账。

## 六、流程哲学

- **域是平行的门，不是管道**：跨域无顺序锁，大纲可反复打磨、随时回改；唯一依赖是文件账本律的产物检查（缺产物=提示，非门禁）。
- **生产者只落盘，消费者定义读取**（对应 Pipes and Filters 架构模式与数据耦合：每个 filter 只知输入输出，不知管道中其他 filter；域间只通过落盘文件通信，零调用、零预定义消费行为）：生产者的全部义务是把产物按共享约定落盘（文件名与落点归 common 层）；如何查找、读取与使用，由消费方在自己域内定义并自行告知用户。跨域导航由各域入口自查 + skill 本名命令承担，域工作流不含流程衔接内容。
- **阶段门控只管域内工序**（如单章：章纲确认后才写正文），跨域顺序由作者决定。
- **会话恢复**：SKILL.md 入口按文件证据（tracking 文件存在性与产物状态）定位续跑点，不凭对话记忆。

## 七、权威规范对齐（2026-09-06 调研落盘）

> 分级：T0 官方规范与文档 ｜ T1 官方实物与社区标杆 ｜ T2 目录评测。**外部参考纪律**：设计与规范条文只可引用本节 T0/T1/T2 权威源；前作 mo-shu 不作设计依据与参考——仅限沿革记录与教训出处（失败数据/事故），不得以「mo-shu 这么做」为任何设计立据。例外：**架构参照研读**——mo-shu 可作为架构优缺点、踩坑记录与好机制（一致性保障、步骤契约、文件字典、打磨循环等）的参照系研读；设计主体按本仓已商定理念独立推进，研读所获须标注来源，学了不照搬，不复制实现。

- T0 官方：Agent Skills 开放规范（agentskills.io）｜Skill authoring best practices（platform.claude.com）｜Claude Code skills 文档与 hooks 文档（code.claude.com，hooks=确定性执法依据）｜Anthropic 官方创建指南（claude.com/blog）
- T1 官方实物与社区标杆：anthropics/skills（157K+；document-skills 为生产级 SKILL 写作范本、skill-creator）｜obra/superpowers（243K；TDD 元规范与 RED-GREEN-REFACTOR）｜gstack（118K，Think→Build→Ship→Reflect 环）｜GSD（64K，每任务新鲜子代理）｜AWS Agent Toolkit（企业同格式）｜mattpocock/skills（调用双层模型、失效模式导览 README、setup 硬依赖指针、CONTEXT.md 共享语言——2026-09-07 专项研究，规格 015）
- T2 目录评测：travisvn/awesome-claude-skills（14K）｜skills.sh 生态｜taskade/firecrawl 评测

设计决策对照：多技能骨架 + menu approach（各域 workflow 独立文件按需加载）（官方 docx 同款）｜域间文件通信（Pipes and Filters + 数据耦合）｜阶段门控（BEA workflow + 12FA checkpoints）｜eval-first（superpowers TDD）｜宪法（AGENTS.md 标准 + spec-kit Constitution）｜术语表（DDD Ubiquitous Language）｜约束阶梯 L1-L4（Claude Code hooks 确定性控制 + OpenAI 护栏外部化）｜逐域建设（last responsible moment）

2026-09-06 调研采纳：description 补边界声明（官方 strong description 三要素）；test-prompts 补场景 7 域外休眠（官方测试矩阵 out-of-scope）。挂账：粒度五次法则（做过 5 次、将做 10 次才立能力）；季度评审节律；reflect 机制（扫描会话纠正自动提议 SKILL 更新）；精读 anthropics document-skills 作为未来域写作范本。

2026-09-07 调研采纳（mattpocock/skills 专项，规格 015）：调用双层原则入 §四；setup 硬依赖边界入 §五；插件清单预检入 release-and-versioning §三。已覆盖印证：skill 间 prose 引用＝引用一层深；code-review 双轴分身＝核验协议双轨＋独立审查分身；CONTEXT.md＝术语表同机制；其仓库无 tests/evals＝我方 test-prompts 评估闭环领先。拒绝项（跨宿主 openai.yaml/changesets 自动化/docs 镜像/ADR 目录/wizard 向导/工单流水线）留痕规格 015。

## 八、维护

- 架构变更：修订本文件 + CHANGELOG + 受影响规范同批同步。
- 新域准入：过宪法 §4 决策树 + 本文件 §二判据（是否与现有域共享书目录状态）。
