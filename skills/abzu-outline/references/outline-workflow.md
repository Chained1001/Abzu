# outline-workflow

> 作用：大纲域域级事务——Stage 路由、中断契约、副作用、文件总表。
> 备注：**按需读**——中断、跨域交接、查文件总表时才读本件；进域判定与首问在 skill 主文件「入口判定」节，各步执行在 `references/outline-stage1.md`，都不经过本件。本件不复制步骤细则与话术（单一出处：stage-spec）。

## 域角色

Abzu 大纲域——把作者的初步想法压成一页可执行的创作约束集，沿资料收集、草稿、打磨定稿长成全书大纲，管到定稿门为止。

## Stage 路由表

| Stage | 状态 | 细则在哪 |
| --- | --- | --- |
| 1 基本规格（开书准备／规格收集／信息核验／规格确认） | 已建 | `references/outline-stage1.md` |
| 2 资料收集 | 未建 | —— |
| 3 草稿 | 未建 | —— |
| 4 打磨定稿 | 未建 | —— |

## 中断契约

作者中途要求停止或表达其他域意图时，确认当前进度已写入文件后移交对应域——建议使用对应域命令（本套件三域：`/abzu-outline`／`/abzu-volume`／`/abzu-write`），不强行走完本域流程。中途暂停三级定义见 `references/outline-stage1.md`「流程概述」节。

## 副作用声明

本域写两处：作者书目录下的产物文件（`创作进度.md`／`基本规格.md`；其余随各自阶段批建齐）；**经作者认可的基调增词**会写 `references/outline-emotion-words.md` 对应轴的词列并把头部版本号 +1（见 stage-spec 1.1）。1.2 只读跑核验脚本，脚本不改任何文件。不调外部服务；无不可逆操作。

## 文件总表

| 文件 | 作用 | 何时读／跑 | 出处（维护信息集中地，运行时不必加载） |
| --- | --- | --- | --- |
| `SKILL.md`（skill 主文件） | 入口判定、建设状态行、首问、交互原则 | 触发即载（宿主自动） | 换模型重试前提——`测试与验收标准` §3；交互原则——`触发与交互标准` §2／§3；**建设状态行随各阶段批更新**（每建成一个阶段改 SKILL.md 该行） |
| `references/outline-stage1.md` | 大纲生成：流程概述＋1.0–1.3 细则与逐字话术 | 开新书确认后一次读入 | 内容源——`大纲域设计-规格与资料步` §一；链接改写——`命名标准` §5 |
| `references/outline-emotion-words.md` | 统一情绪词表与取值规则（基调映射基准） | 1.1 基调映射前（按需） | `大纲域设计-规格与资料步`（随迁） |
| `assets/outline-basic-spec-template.md` | 基本规格模板（三节＋约束的填空与枚举）；字段必填性／生产来源随括注与 stage-spec 各步承载 | 1.0 建空模板、1.2 核对（按需） | 内容源同 stage-spec |
| `assets/outline-reference-archive-template.md` | 参考作品**采风档**模板（2.2 主辅共用，当前**唯一路线**——13 节约 24 字段＋一页结论提炼层） | 2.2 建成后消费（暂无运行时消费方） | 内容源——`大纲域设计-规格与资料步` §二 2.2；字段设计借鉴 analyze-hit-novel（ciel-oliver，GitHub） |
| `assets/outline-reference-teardown-template.md` | 主参考**拆书档**模板——**已搁置**：Stage 2 先建采风单路线；拆书路线启用时复活本件（含锚定数据节供标尺直接取数） | 搁置中（不建、不消费） | 拆法与字段设计——analyze-hit-novel（ciel-oliver，GitHub） |
| `assets/outline-reference-ruler-template.md` | 参考标尺模板（2.3 合成：十二组，每格范围值＋依据强度＋来源；体量分档；含 2.4 核验结论写入位，跨阶段资产） | 2.3 建成后消费（暂无运行时消费方） | 内容源——`大纲域设计-规格与资料步` §二 2.3 |
| `创作进度.md`（产物，作者书目录） | 阶段值＋产物状态表——格式的单一出处＝stage-spec 1.0 第 1 小步 | 入口判定与各步落行时读写 | 内容源同 stage-spec |
| `基本规格.md`（产物，作者书目录） | 基本规格本体——按 `assets/outline-basic-spec-template.md` 模板正文生成 | 1.0–1.3 各步读写 | 内容源同 stage-spec |
| `scripts/check_basic_spec.py` | 基本规格机械核验（七项，只读零依赖） | 1.2 跑（只跑不读源码） | 内容源同 stage-spec（七项承其核验要求） |
| `scripts/`（五个 .mjs：check-deps／cdp-proxy／browser-discovery／find-url／match-site） | 联网取数三层调度的第三层（CDP 浏览器直取）——前置检查、CDP 代理、浏览器发现、书签/历史搜索、站点匹配 | 2.1 第三层取数时跑 `check-deps.mjs` 启动 | 需要 Node.js 22+（用原生 WebSocket） |
| `references/cdp-api.md` | CDP Proxy 的 HTTP API 用法（/navigate、/eval、/click、/screenshot 等） | 2.1 第三层取数时按需读 | 同上 |
| `references/web-scraper.md` | 联网采风 agent 的行为规则（三层调度＋站点允许清单＋采法纪律＋输出契约）——**分发源**：入口判定第 0 步从此复制到项目 `.claude/agents/web-scraper.md` | 入口判定部署时读；2.1 派发 agent 时由 Claude Code 从 `.claude/agents/` 加载 | 跨域共享（大纲／卷纲／正文均可用） |
| `references/outline-workflow.md`（本件） | 域级事务：路由／中断／副作用／总表 | 中断或交接时（按需） | 本域新建 |
