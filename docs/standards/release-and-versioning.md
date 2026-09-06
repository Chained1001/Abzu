# 版本与发布规范（含写作项目兼容）

> 版本：v0.3（沿革见 CHANGELOG 与 git 历史）
> 定位：版本号语义与流转、发布流程、写作项目（用户的书目录）schema 兼容规则的单点权威。
> 依据：SemVer 2.0.0、Keep a Changelog 1.1.0。
> 背景约束：Abzu 通过 skills.sh 或手动复制安装（无项目级物化），升级感知依赖版本号与 CHANGELOG。

## 一、版本语义（SemVer + skill 定制）

| 变更 | 版本动作 |
| --- | --- |
| 行为变化：新阶段、新产物文件、流程规则变更 | minor |
| 措辞修正、勘误、文档完善 | patch |
| 写作项目结构破坏性变更（老书目录不再直接可用） | major |

0.y.z 阶段照常执行上述语义（比 SemVer 默认的"0.y.z 任意可变"更严格，主动收紧）。

**边界示例**（易混场景判定）：

- references 内业务阈值/判定规则修改（如可行性样本阈值、卷均折算值）＝**行为变更 → minor**，与修改载体无关
- 纯错别字、排版、失效链接修复＝patch
- 新增可选产物字段＝minor；删除/改名既有产物字段＝major 候选（视兼容性）

## 二、版本三处一致（单一真源）

版本号出现在且仅出现在三处，禁止散落第四处：

1. 六壳（`skills/abzu-{域}/SKILL.md`）各自 `metadata.version`，套件统一节奏同批 bump
2. git tag `vX.Y.Z`（打在发布提交上）
3. `CHANGELOG.md` 版本段标题

**真源与时机**：发布时以"CHANGELOG 定稿"动作同步另两处（先定稿 CHANGELOG 版本段，再改 frontmatter，再打 tag）。发现第四处版本号 = 收口（宪法反模式 #4）。

## 三、发布流程（六步）

1. 评估场景全绿——自包含口径：lint 0 违例 + 各壳 validate 通过 + 评估场景无「已建设能力」的回归失败（建设期未建设能力的失败不计红，详见宪法 §1.4）
2. CHANGELOG 定稿：`Unreleased` 段移为 `[X.Y.Z] - YYYY-MM-DD` 版本段（ISO 日期），新开空 `Unreleased`；**涉及写作项目 schema 兼容的条目加 `[schema]` 前缀**，用户升级第一时间可见兼容影响
3. bump `SKILL.md` 的 `metadata.version` 并与 CHANGELOG 对齐
4. `git tag vX.Y.Z`（建立远程后：推送并确认）
5. 插件清单预检（可选）：本机装有 claude CLI 时执行 `claude plugin validate . --strict`（校验 `.claude-plugin/` 清单）；CLI 缺失则记录跳过，不阻塞发布
6. 安装实测：`npx skills add Chained1001/Abzu -y` 后在独立文件夹跑冒烟场景（场景 6）

## 四、写作项目 schema 兼容（核心：skill 的"数据库"在用户书目录里）

1. 写作项目的 `project.md` 头部必须带 `schema: N` 字段（阶段 1 定义初值 1）。
2. **兼容四原则**：新字段/新文件全部可选增量；老数据零丢失；迁移先备份；不兼容变更必须提供迁移说明（写入 CHANGELOG 版本条目）。
3. **升级判定**：skill 会话开始读项目 `schema` 版本——低于当前 → 提示迁移路径；高于当前 skill → 提示用户先升级 skill，禁止降级覆盖。
4. **迁移执行边界**：schema 迁移**默认只输出迁移说明**（改哪些文件/字段、如何操作），由作者确认后执行或自行手动执行——**自动改写用户书稿文件须单独立项裁定**（默认禁止，防 AI 静默修改用户书稿）。
5. schema 变更 = major 版本的最小触发条件（见 §一）。

## 五、预发布版本

- 命名：`vX.Y.Z-alpha.N`（功能试探）/ `vX.Y.Z-rc.N`（发布候选），N 递增
- 预发布**不触发 schema 迁移承诺**（schema 字段只在正式版变更）；冒烟可简化为安装实测，但安装实测本身不可省
- CHANGELOG 以正式条目记录预发布变更，条目尾标注预发布性质

## 六、回滚预案

- 已发布版本发现严重缺陷：**修复后 bump patch 重新发布**，不删除已发布 tag（行业惯例）
- 必要时在 CHANGELOG 该版本条目尾标注 `[YANKED]`（Keep a Changelog 撤回标注）
- 用户侧回滚 = 重新复制上一版本 skill 文件夹（建议用户保留旧版本文件夹，升级前不删）

## 七、发布渠道分层

- 当前：`npx skills add` 或手动复制到用户级 `~/.claude/skills/`。
- 发布前置（届时执行）：Claude 插件市场提交（`.claude-plugin/marketplace.json` 已于 2026-09-06 入库；提交动作届时执行，预检命令见 §三第 5 步）；`THIRD_PARTY_NOTICES.md`（引入第三方内容时）。

## 八、维护

- 本规范与 CHANGELOG 实际内容冲突时当次修正（版本纪律以本文件为准）。
- 远程仓库建立后，回写 §三第 4 步（补推送与 tag 推送）。
