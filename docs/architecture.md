# 架构决策记录（Abzu）

> 版本：v1.0（2026-09-05 作者拍板）
> 定位：架构选型与理由的**唯一权威**——后续所有施工批以本文件为架构依据；变更须修订本文件并记录理由。
> 配套：工程规范见 `docs/standards/`；术语见 [glossary.md](glossary.md)；验收见 [test-prompts.md](test-prompts.md)。

## 一、裁定记录

- **承载架构**：单 skill（`abzu`）六域——scan / analyze / outline / volume / write / style。
- **首建域**：扫榜（scan），完成后真实实测，再开下一域。
- **v1 范围**：仅六域；导入 / 独立审查 / 抓取底座独立化均不做（抓取底座作为扫榜域内置脚本随行）。

## 二、选型理由（单 skill vs 多 skill）

**决定性判据：六域共享同一份可变状态（写作项目的 project.md / tracking / 手稿）**——共享资产的归属方式是两方案的分水岭。

| 维度 | 单 skill 六域（选定） | 多 skill 分立 |
| --- | --- | --- |
| 共享资产 | `references/common/` 一份正本，零机制 | 需同步机制（mo-shu 为此养 64 组字节对账 + 守卫）或内嵌副本（漂移风险） |
| 精准入口 | 6 个一行命令薄壳（一次性十分钟） | skill 本名即命令，免费 |
| 上下文 | SKILL.md 薄总控常载 + references 按需读，与多 skill 持平 | 只载命中域 |
| 版本/安装 | 一份版本号、一个目录、两条 cp | N 份 frontmatter 对齐（mo-shu 为此建四轨守卫） |
| 触发 | 一条 description 收敛（mo-shu 作者实测裁定方向） | 六域同属"写小说"，自然语言互抢，靠直呼纪律压制 |
| 反向迁移 | 拆出容易（先合后拆） | 合并极难（mo-shu 从未做成，税一直交） |

**实测数据支撑**（mo-shu v2.6.1）：六域合计 188 份 references / 约 26,000 行；跨 skill 同步副本 64 组。单 skill 形态下这 64 组塌缩为 `common/` 一份正本，总盘反而更小。规模躺在磁盘上而非上下文里——按需加载下，单次会话只进总控 + 当前域 workflow + 两三份方法论。

**逃生舱**：输入侧域（scan / analyze，不读写书目录）未来可低税拆出；产出侧四域深度耦合共享状态，不拆。

## 三、落定结构

```
skills/abzu/
├── SKILL.md                  # 薄总控（<300 行）：会话恢复协议 + 域路由表 + 门控原则
├── references/
│   ├── common/               # 公共层：project-structure / tracking-spec / 跨域方法论
│   ├── scan/                 # ① 扫榜调研（含 cdp-base.md 底座文档）
│   ├── analyze/              # ② 拆书分析
│   ├── outline/              # ③ 大纲
│   ├── volume/               # ④ 卷纲
│   ├── write/                # ⑤ 正文（章纲 + 撰写）
│   └── style/                # ⑥ 文风
└── scripts/                  # 运行时脚本一份，全域共用
```

## 四、精准入口机制

用户只使用精准斜杠命令，不用模糊自然语言。命令薄壳放 `.claude/commands/`，内容用标识符风格，与 SKILL.md 路由键一字不差：

```markdown
<!-- .claude/commands/abzu-scan.md -->
abzu skill scan
```

命令名（`/abzu-scan`）= 路由键（`scan`）= 域目录名，三者对齐。命令随域开发逐个补充。

## 五、部署与实测循环

```
改 skill → agentskills validate skills/abzu → npx markdownlint-cli2
        → npx skills add Chained1001/Abzu -y（skills.sh 安装器，自动装入用户级；离线备选 cp -r skills/abzu ~/.claude/skills/abzu）
        → 新会话（新文件夹）敲 /abzu 真测
```

v1 无部署器：没有 hooks / agents / 项目级 CLAUDE.md 需要物化，安装即全部部署；书项目脚手架由立项流程自建；升级检测走 `project.md` 的 `schema` 字段（release-and-versioning §四）。skills.sh 安装只携带 skill 文件夹（不含 `.claude/commands/` 薄壳）——v1 唯一功能为扫榜，`/abzu` 入口直达；域级命令分发方案留待多域上线时裁定（Roadmap 挂账）。

**setup 等价物的触发条件**：将来引入需要物化进书项目的组件（hooks / 子代理 / 项目级模板）之日，才引入 `/abzu-setup`——此前不做（防未来会话重复纠结）。

## 六、流程哲学

- **域是平行的门，不是管道**：跨域无顺序锁，大纲可反复打磨、随时回改；唯一依赖是文件账本律的产物检查（缺产物=提示，非门禁）。
- **生产者只落盘，消费者定义读取**：域间零调用、零预定义消费行为。生产者的全部义务是把产物按共享约定落盘（文件名与落点归 common 层）；如何查找、读取与使用，由消费方在自己域内定义并自行告知用户。
- **阶段门控只管域内工序**（如单章：章纲确认后才写正文），跨域顺序由作者决定。
- **会话恢复**：SKILL.md 入口按文件证据（tracking 文件存在性与产物状态）定位续跑点，不凭对话记忆。

## 七、维护

- 架构变更：修订本文件 + CHANGELOG + 受影响规范同批同步。
- 新域准入：过宪法 §4 决策树 + 本文件 §二判据（是否与现有域共享书目录状态）。
