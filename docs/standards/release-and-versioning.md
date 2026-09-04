# 版本与发布规范（含写作项目兼容）

> 版本：v0.1（2026-09-05 立法）
> 定位：版本号语义与流转、发布流程、写作项目（用户的书目录）schema 兼容规则的单点权威。
> 依据：SemVer 2.0.0、Keep a Changelog 1.1.0、mo-shu 四轨版本对齐教训（收窄为单轨）。
> 背景约束：Abzu 用户手工复制安装（无包管理器），升级感知完全依赖版本号与 CHANGELOG——版本纪律比 marketplace 分发的项目更关键。

## 一、版本语义（SemVer + skill 定制）

| 变更 | 版本动作 |
| --- | --- |
| 行为变化：新阶段、新产物文件、流程规则变更 | minor |
| 措辞修正、勘误、文档完善 | patch |
| 写作项目结构破坏性变更（老书目录不再直接可用） | major |

0.y.z 阶段照常执行上述语义（比 SemVer 默认的"0.y.z 任意可变"更严格，主动收紧）。

## 二、版本三处一致（单一真源）

版本号出现在且仅出现在三处，禁止散落第四处：

1. `.claude/skills/abzu/SKILL.md` 的 `metadata.version`
2. git tag `vX.Y.Z`（打在发布提交上）
3. `CHANGELOG.md` 版本段标题

**真源与时机**：发布时以"CHANGELOG 定稿"动作同步另两处（先定稿 CHANGELOG 版本段，再改 frontmatter，再打 tag）。发现第四处版本号 = 收口（宪法反模式 #4）。

## 三、发布流程（五步）

1. 评估场景全绿（基线定义见宪法 §1.4）
2. CHANGELOG 定稿：`Unreleased` 段移为 `[X.Y.Z] - YYYY-MM-DD` 版本段（ISO 日期），新开空 `Unreleased`
3. bump `SKILL.md` 的 `metadata.version` 并与 CHANGELOG 对齐
4. `git tag vX.Y.Z`（建立远程后：推送并确认）
5. 安装实测：复制到 `~/.claude/skills/abzu` 实测 + 跑冒烟场景（场景 1）

## 四、写作项目 schema 兼容（核心：skill 的"数据库"在用户书目录里）

1. 写作项目的 `project.md` 头部必须带 `schema: N` 字段（阶段 1 定义初值 1）。
2. **兼容四原则**（继承 mo-shu 验证过的立法）：新字段/新文件全部可选增量；老数据零丢失；迁移先备份；不兼容变更必须提供迁移说明（写入 CHANGELOG 版本条目）。
3. **升级判定**：skill 会话开始读项目 `schema` 版本——低于当前 → 提示迁移路径；高于当前 skill → 提示用户先升级 skill，禁止降级覆盖。
4. schema 变更 = major 版本的最小触发条件（见 §一）。

## 五、发布渠道分层

- 当前：README 复制安装（用户级 `~/.claude/skills/` / 项目级 `.claude/skills/`）。
- 发布前置（届时再建）：可选 Claude 插件市场打包（`.claude-plugin/marketplace.json`，对照官方文档实施）；`THIRD_PARTY_NOTICES.md`（引入第三方内容时）。

## 六、维护

- 本规范与 CHANGELOG 实际内容冲突时当次修正（版本纪律以本文件为准）。
- 远程仓库建立后，回写 §三第 4 步（补推送与 tag 推送）。
