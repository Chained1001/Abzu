# T068 场景条件化人物决策逻辑—叙事记忆检索与特质冲突审计研究候选纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T068
- **候选ID：** QF-131
- **标准名称：** 场景条件化人物决策逻辑—叙事记忆检索与特质冲突审计研究候选纲领
- **英文名称：** Scene-Conditioned Character Decision Logic, Narrative-Memory Retrieval, and Trait-Conflict Audit Candidate Program
- **理论类型：** `validation_limited_scene_conditioned_character_decision_logic_and_memory_adverse_audit_candidate_program`
- **核心条件—行为来源：** Peng et al. 2026，*Deriving Character Logic from Storyline as Codified Decision Trees*（CDT）
- **独立决策点修正：** Xu et al. 2025，*Character is Destiny: Can Persona-assigned Language Models Make Personal Choices?*（LIFECHOICE）
- **独立一致性反证：** de Langis et al. 2026，*Mary, the Cheeseburger-Eating Vegetarian: Do LLMs Recognize Incoherence in Narratives?*
- **固定实现/数据审计：** CDT代码commit `89999e34f62e581df8aaca32949cfa3953910dcd`；Fandom数据commit `c2fd307cdd5b059679984b018ed5f19a803c9e8e`；Bandori数据commit `32829b2efeebeced30f12656acf93ebe2db47e5f`；Bandori Events数据commit `ff49a70f754dae51c672b25de80b41ab9384274b`；LIFECHOICE代码/数据commit `37266c38648cd56574b0cb2140857171a752cf38`
- **当前状态：** `provisional`

T068的净增量不是“人物要符合人设”这一常识，而是把人物行为描述拆为可检查的`scene condition -> action tendency`：先从按故事线排列的场景—行动对提出条件化假设，再用全节点数据筛选、拒绝或递归细化；推断时只取当前场景实际触发路径上的行为陈述。LIFECHOICE进一步表明，复现某一既有叙事选择时，全局人物描述和当前问题相关的具体记忆不是同一对象；de Langis等人的成对短叙事实验则表明，模型对故事内建立的人物特质冲突，比对可借预训练常识识别的场景冲突更不稳，而且内部敏感性不保证外显评价可靠。

该增量只能暂存。CDT离线构建且静态，关系扩展只看某人物行动后紧邻的回应；主要动作是LLM从Fandom叙述中拆出的，核心分数又由NLI/LLM judge产生。LIFECHOICE的正确答案是作者实际写出的选择，不是所有合乎人物逻辑的合理选择；固定开放提交只发布论文数据的一部分，并存在显著答案位置偏差。独立一致性论文只有25对人工控制短故事，且其声明的数据仓库在本轮审计时为空。因此T068不是人物随叙事演化的状态机，也不是跨卷多情节线、自然章卷结构或写作处方。

## B. 原始研究问题与对象

### B.1 CDT

CDT问：能否从既有故事线的`(scene, action)`对中，归纳可执行、可验证、可按场景触发的人物行为规则，并用故事线前半段预测后半段行动？核心对象是16个artifact中的85名主要人物、Fandom的20,778个主要人物场景—行动对和Bandori的7,866个对；另用Bandori event stories做跨故事检验。[QF131-P1, pp.12480-12492]

### B.2 LIFECHOICE

LIFECHOICE问：给定人物、决策情境、四个候选行动和决策点之前的长文本，模型能否复现小说中作者实际安排的选择？论文报告2,512个决策点、470本小说；人物画像分为全局描述和具体记忆，并比较摘要、专家描述、稀疏/稠密检索、直接拼接和CharMap。[QF131-V1, pp.15038-15045]

### B.3 成对叙事一致性

de Langis等人问：模型能否在几乎相同的成对短叙事中识别一个精确操纵的不一致事件，并区分故事内人物特质冲突与外部世界常识支持的场景冲突？对象为18对既有心理学材料加7对人机协作扩充材料，共25对/50篇短故事。[QF131-C1, pp.5958-5966]

### B.4 必须分开的四种对象

1. `conditioned_behavior_rule`：什么场景条件下观察到何种行动倾向；
2. `author_actual_choice`：原作在一个决策点实际选择了哪个行动；
3. `evolving_character_state`：人物目标、知识、资源、承诺、关系和长期意图怎样随事件改变；
4. `narrative_quality_or_reader_outcome`：读者是否认为作品好、是否追读、留存或付费。

前三者不能互相替代，前三者也都不能自动推出第四者。

## C. 核心机制与理论单元

1. **场景—行动序列：** 对目标人物每次行动，以此前10个动作作为场景窗口；Fandom原有叙述由LLM拆成带行动者的动作序列。[QF131-P1, pp.12483-12484]
2. **严格故事线半分：** 每人物按现有序列先半训练、后半测试；这比随机切分更接近“用过去预测未来”，但仍只是artifact内部外推。[QF131-P1, p.12484]
3. **条件化聚类：** 场景和动作被嵌入并聚类，目的是避免把同一集/表面相似但行为触发不同的材料混在一起。[QF131-P1, pp.12483-12484]
4. **`(q,h)`假设：** `q`是检查场景是否满足触发条件的问题，`h`是人物行为陈述；LLM从聚类提出候选，不直接视为真规则。[QF131-P1, pp.12482-12484]
5. **全节点验证：** 先检查`h`与当前节点全部动作的NLI关系；达到接受阈值的陈述进入节点，低于拒绝阈值的假设被废弃，中间区间才以`q`筛出的子集递归细化。[QF131-P1, pp.12482-12483]
6. **树路径触发：** 推断时从根开始，只访问当前场景通过`q`检查的子树；沿访问路径累计陈述，未触发分支不进入grounding。[QF131-P1, pp.12480-12483]
7. **静态行为逻辑而非动态状态：** 树描述从训练故事线归纳出的条件化行为；论文明确说它离线构建、保持静态，不能捕捉持续演化的叙事。[QF131-P1, p.12489]
8. **邻接关系特化：** 关系CDT只保留指定相关人物行动/发言后目标人物立即行动的样本；它是相邻回应条件，不是关系长期轨迹。[QF131-P1, pp.12488-12489]
9. **描述—记忆双部件：** LIFECHOICE把全局人物描述与决策情境相关的具体历史片段分开；直接拼接和CharMap都优于只用一方。[QF131-V1, pp.15042-15044]
10. **问题导向记忆检索：** CharMap先从全局描述定位与当前问题相关的经历，再用这些经历检索原文记忆；这是检索接口，不是人物状态账本。[QF131-V1, pp.15042-15043]
11. **作者选择目标：** LIFECHOICE的正确项是原小说实际行动，干扰项由GPT-4生成为“一般人也可能选择”的行动；准确率衡量复现，不证明唯一合理。[QF131-V1, pp.15040-15042]
12. **特质冲突与场景冲突分型：** 成对叙事把故事内建立的`trait-behavior`冲突与借助一般世界知识的`event-setting`冲突分开；两者不能合为一个“人设一致性”分数。[QF131-C1, pp.5960-5961]
13. **内部敏感性—外显判断分离：** 目标句困惑度和隐藏态探针可检测不一致，但到故事结尾敏感性衰减，外显连贯/质量评分区分又更弱。[QF131-C1, pp.5962-5965]

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T068-C001-C005 | CDT以聚类、`(q,h)`假设、全节点验证、递归细化和路径触发形成条件化行为树 | QF131-P1 pp.12480-12484 | 核心原始机制 | 规则由LLM提出和NLI验证，不是作者意图或人格真值 |
| T068-C006-C010 | Fandom/ Bandori对象、前半/后半切分、10动作窗口和NLI计分构成主要评测 | QF131-P1 pp.12483-12485, Table 6 | 原始任务与构念 | episode/action序列不是自然章卷或完整状态历史 |
| T068-C011 | 论文以每类200样本报告NLI/匹配与人工判断的一致率 | QF131-P1 p.12484 | 有限代理校准 | 未报告标注者人数、独立性、IAA或抽样细节 |
| T068-C012-C013 | CDT(-Lite)在Fandom和Bandori的平均NLI分数高于列出的基线 | QF131-P1 Table 2 | 原始结果 | 无显著性、置信区间或按故事独立重复 |
| T068-C014-C016 | 消融和数据缩放支持验证、聚类、深度和更多训练对的方向性作用 | QF131-P1 Fig.3, Table 3 | 方向性组件证据 | 多组件共用LLM/NLI管线，不能推出自然叙事因果 |
| T068-C017-C019 | event-story、关系特化和200起始场景开放域检验提供有限外推 | QF131-P1 §§6.5-6.6, App.D | 有界外推 | event处理链未完整固定；关系只邻接；人工协议不透明 |
| T068-C020-C023 | 静态限制、代码参数失配和固定数据复算限制完全复现 | QF131-P1 Limitations; QF131-D1-D4 | 论文限制与发布审计 | 可复核主数据不等于复现全部生成、judge和人工结果 |
| T068-C024-C025 | LIFECHOICE的选书、GPT辅助构造和十名学生筛选形成作者选择MCQ | QF131-V1 pp.15040-15041, App.B/D | 独立决策点对象 | 无逐题标注人数、IAA、保留率和裁决报告 |
| T068-C026-C027 | 描述+记忆和CharMap高于单一描述或单一记忆 | QF131-V1 Table 3, Fig.3 | 独立方法结果 | 受MCQ位置、泄漏、检索和模型版本共同影响 |
| T068-C028-C031 | 三人阅读、40人物时间切片、流行度泄漏和作者不合逻辑选择形成修正链 | QF131-V1 pp.15043-15046 | 独立有限验证与自报边界 | 小样本、无IAA/显著性，正确答案仍是实际选择 |
| T068-C032-C034 | 固定LIFECHOICE提交仅含1,576行/383本且答案位置高度偏斜，测试脚本与论文方法不完全一致 | QF131-D5 complete tree/data audit | 直接发布审计 | 只批评当前开放子集，不声称论文内部未发布数据同样分布 |
| T068-C035-C038 | 25对短叙事、冲突类型IAA、探针/评分差异和unexpectedness控制构成独立反证 | QF131-C1 pp.5960-5966 | 独立同行评审不利证据 | 手工短材料，不是长篇人物轨迹或生成复制 |
| T068-C039 | 论文声明的数据仓库在本轮审计时为GitHub空仓库 | QF131-D6 current repository audit | 发布可得性反证 | 未来仓库状态可能改变，需按日期复查 |
| T068-C040 | 三源只支持条件化行动逻辑、记忆接口和一致性反证，不支持动态人物状态、自然章卷或质量 | cross-source | 项目综合 | 不形成自动写作、续写、修复或评分规则 |

## E. 来源身份与实际读取深度

### QF131-P1

- **身份：** ACL 2026 Volume 1同行评审长文，DOI `10.18653/v1/2026.acl-long.568`，printed pp.12480-12509。
- **读取：** 全文；定义、算法、benchmarks、Table 1-13、消融、缩放、跨故事、关系、开放域、人类/NLI校准、限制、提示和附录均核对。
- **关键结果：** Fandom平均NLI：Vanilla 55.57、ETA 56.91、CDT 60.82、CDT-Lite 61.01、Human Profile 58.33；Bandori分别65.50、72.25、77.71、79.04、71.28。
- **关键不利：** 主要动作由LLM拆分；NLI仍是代理；人工协议缺少人数/IAA；无显著性和区间；离线静态；多人物联合与在线更新列为未来工作。
- **本地SHA-256：** `77C6E4E54F720BAD6483BD73A8DFE306E6D66DA6210EEA9974C8F857C2E8E624`。

### QF131-V1

- **身份：** Findings of EMNLP 2025同行评审论文，DOI `10.18653/v1/2025.findings-emnlp.813`。
- **读取：** 全文；数据构建、任务、Table 1-6、描述/记忆、CharMap、三人人工试验、泄漏、时间切片、生成评价、附录提示、人工筛选和限制均核对。
- **关键结果：** 论文报告直接拼接最高61.12%，CharMap最高65.28%；三名参与者在六本陌生小说上的原文/拼接/CharMap为92.01/66.83/72.17。
- **关键不利：** GPT-4构造决策点与MCQ；无标注IAA；作者实际选择不等于唯一合理；泄漏在高流行度书明显；开放提交不是完整论文数据。
- **本地SHA-256：** `A9554FC4FB29873B774C056F148D3A5F0589AF1942654A46D850903B54C2A6ED`。

### QF131-C1

- **身份：** EACL 2026 Volume 1同行评审长文，printed pp.5958-5970。
- **读取：** 全文；成对设计、分类、IAA、扩充、模型/提示、困惑度、探针、外显判断、人类阅读时、unexpectedness控制、限制和附录均核对。
- **关键结果：** 冲突类型由三位合作者独立标注，Krippendorff’s α=.835；目标句探针约80%或更高，但故事结尾下降；大多数外显评分差异小；模型对event-setting比trait-behavior更敏感，人类阅读时未显示同类差异。
- **关键不利：** 只有25对控制短故事；新7对有人机写作；探针预知目标位置；论文声明仓库当前为空。
- **本地SHA-256：** `D55B9CBA71A07092FCA3BE1956A359AB73EF4D945F7E72B0850806E22BE5AB22`。

### QF131-D1 至 D4

- **D1：** CDT官方GitHub固定commit ZIP，110个文件，MIT；README、LICENSE、三个主要脚本、shell参数、角色映射、已打包树、示例数据和目录全集检查。SHA-256 `A60DD3433BD07D7A8FE2217201FA1F8BD897D452F8C2AD57D6A1B0B6DE484C21`。
- **D2：** Fandom固定Parquet，43,239行、8 artifact、694 title；按官方45名主要人物复算为20,778对，和论文一致。SHA-256 `9470B6973B839472F08BC41B644E03BBCAF564ACE7395862C2AF73A483319EFB`。
- **D3：** Bandori固定Parquet，9,721行、8 artifact、186 title；按官方40名人物复算为7,866对，和论文一致。SHA-256 `41EC344F1F63AD93A2599F7DEBF1A2E748507FC82B4AE0637D84EF184E95F2C0`。
- **D4：** Bandori Events英文固定Parquet，114,835原始行、286 event、2,002个event-chapter键；当前README处理对象与论文77,182 action/1,498 episode不是直接同一表，故只作原始发布审计。SHA-256 `EBF814273131E8AC8C6D0A701CE87906F6C69C227F1193FE5B2BBCDB8ABB1FFD`。
- **实现失配：** 论文主设置`θaccept=.75, θreject=.50, θf=.75, max_depth=4`，固定仓库README/脚本默认`.8/.5/.8/max_depth=3`；benchmark加载HF时未钉revision；无完整环境锁、开放域原始人工标签和全部运行输出。

### QF131-D5

- **身份：** LIFECHOICE官方GitHub固定commit ZIP，Apache-2.0仓库，5个文件。
- **全量审计：** `data.json`外层392组，其中9空组；1,576行、383本、1,532个唯一人物名；有效四选一且答案为A-D的只有1,566行；论文宣称为2,512/470，因此固定提交是部分发布。
- **答案偏差：** 有效行A/B/C/D为48/837/618/63，单押B为53.45%；论文未报告多数位置基线。另有9个`N/A`和1个`Not applicable`，其options不是有效四项。
- **脚本失配：** README说只提供Expert-written Descriptions；测试脚本把人物名放进Description、把`input_text`放进Memory，并只用完整字符串等于A/B/C/D判分，不能直接复现论文全部画像/检索/CharMap实验。
- **本地SHA-256：** `21F9DC011BF67A598EF77C5CA110A4ABA9620EA27856D854A616C622A4B98D4F`。

### QF131-D6

- **身份：** de Langis等人论文声明的GitHub仓库`minnesotanlp/narrative-coherence`。
- **本轮状态：** GitHub API返回`Git Repository is empty`；没有固定数据或代码文件可下载。
- **边界：** 这是2026-07-17时点的可得性审计，不等于数据永远不存在，也不否定论文正文结果。

## F. 原义、独立修正、项目转译与不受支持项

- **theory_directly_supports：** 从按故事线排列的场景—行动对聚类和提出`(q,h)`，以全节点NLI筛选并递归细化，在新场景按路径检索行为陈述；前半/后半任务与论文所报有界NLI结果。
- **independent_validation_or_correction_supports：** 描述与具体记忆对复现既有选择各有增量；故事内人物特质冲突与世界常识支持的场景冲突不是同一难度；内部异常信号和外显质量/连贯判断可以分离。
- **release_audit_supports：** CDT两个主要Parquet精确复算论文行数；代码参数与论文主设置不一致；event原始表没有直接闭合论文处理结果；LIFECHOICE固定提交部分发布、答案位置偏斜且测试脚本不完整；一致性论文仓库为空。
- **project_translation：** 只有用户明确批准具体文本后，才可把“场景证据—候选条件—行为倾向—支持/反例—当前状态—实际选择—替代合理选择—记忆来源—冲突类型”作为人工诊断候选列，并必须同T035/T036/T060-T067对照。
- **project_hypothesis：** 条件化规则是否在中文多卷连载中比平面人设更稳定；把规则和带历史的目标/知识/资源状态结合是否提高跨卷召回；特质冲突专项反例是否减少judge漏报。这些均未实证。
- **not_supported：** 条件树就是人格真值；作者实际选择是唯一合理选择；NLI高分就是人物写得好；邻接回应就是关系轨迹；前半/后半就是跨卷泛化；静态树会自动适应成长；任何阈值都是写作常数；据此自动续写、修复、评分、分章或分卷；推出追读、留存、付费或文学质量。

## G. 主要批评、负面结果与内部冲突

1. **静态而非演化：** CDT论文明确承认离线静态，人物改变后旧规则如何撤回、分期或重估没有机制。
2. **输入不是人工事件金标：** Fandom动作由LLM从叙述拆分，错误会同时进入训练条件、测试reference和关系邻接。
3. **十动作窗口压缩：** 人物长期承诺、秘密、资源和早期创伤可能不在当前10动作内；树陈述只能补部分统计常规。
4. **NLI构念窄：** 与reference action蕴含/中性/矛盾不等于唯一的人物逻辑，更不等于情节功能、文体或作品质量。
5. **代理校准不透明：** 每类200样本的一致率没有标注人数、抽样方式、独立性、IAA和裁决，不能当充分人类验证。
6. **无推断统计：** Table 2没有置信区间、显著性或以artifact为随机效应；85人物也不是85个独立文化对象。
7. **人类画像基线不完备：** Fandom wiki画像是有限文本，不是作者完整决策逻辑；超过它不等于超过人类人物理解。
8. **关系仅邻接：** 指定人物刚刚行动后目标人物如何回应，不保存双方长期关系类型、阶段、方向和会合/分离。
9. **跨故事链未闭合：** 论文的77,182 action/1,498 episode不是D4原始英文表的直接统计，处理选择和100样本/人物固定集未在主仓库完整发布。
10. **开放域人工结果缺协议：** 200起始场景、10轮、39.0%对27.5%的偏好没有标注者数量、招募、任务分配、IAA或原始标签。
11. **论文—代码参数不一致：** 固定仓库默认`.8/.5/.8/3`，论文主实验`.75/.50/.75/4`；不能把当前一键运行当论文复制。
12. **LIFECHOICE人工合成链：** GPT-4选择决策点、写动机、定位章节并构造干扰项；十名学生只筛选，具体逐题协议和IAA缺失。
13. **作者实际选择不唯一：** 小说行动可能为反转、误判、强制情节或作者不合逻辑安排；论文自己承认此限制。
14. **开放子集位置偏差：** 1,566有效行中B为53.45%，高于随机25%，且接近专家描述多模型成绩；未报告多数类基线会夸大绝对准确率解释。
15. **开放子集不完整：** 1,576/383与论文2,512/470不同；不清楚缺失是否随机，不能用开放子集复算全部Table 3。
16. **三人人工比较太小：** 六本书、每人两本、无反平衡和IAA报告；92.01%不能推广为一般读者上界。
17. **训练污染仍存在：** 高于5,000评论的书表现显著上升；低热度代理控制不能证明无训练泄漏。
18. **特质冲突比场景冲突更脆：** 成对研究显示模型可能依赖预训练世界常识，而不是稳定维护文本内人物模型。
19. **内部信号不保证可用判断：** 目标位置探针表现较好，但到结尾衰减；质量/连贯评分仍难可靠区分。
20. **短实验不可外推长篇：** 25对心理学短故事隔离变量很好，却没有跨章跨卷记忆、人物成长或多线状态。
21. **发布缺口：** 一致性论文的数据仓库当前为空，无法复核50篇材料、扩写过程和运行输出。
22. **外部效度不足：** 核心材料是英语/日系英文转写的流行文化故事、商业学习指南材料和控制短文，不覆盖现代中文多卷网文。

## H. 冻结不等式与竞争解释

- `static_condition_action_tree != evolving_character_state`
- `next_action_NLI != unique_in_character_decision`
- `author_actual_choice != only_plausible_choice`
- `human_written_profile != exhaustive_behavioral_logic`
- `condition_specific_behavior != stable_personality_trait`
- `pair_adjacent_response != relationship_trajectory`
- `first_half_storyline_training != cross_work_or_cross_volume_generalization`
- `LLM_extracted_scene_action != human_gold_event`
- `NLI_match_score != narrative_quality`
- `offline_profile != stable_storyline_state_machine`
- `character_trait_violation != world_knowledge_violation`
- `target_hidden_state_probe != end_of_story_explicit_judgment`
- `expert_description_plus_memory != complete_state_history`
- `majority_answer_position != character_understanding`
- `paper_dataset_claim != released_subset`
- `decision_accuracy != reader_response_or_commercial_quality`

## I. 尺度覆盖与断裂

- **直接覆盖：** 单个动作、此前10动作场景、episode/title、人物、故事线前半/后半、artifact、邻接人物回应、决策点前长文本、专家人物描述、检索记忆、短篇目标句和故事结尾。
- **有界跨尺度链：** 动作序列 -> 场景条件聚类 -> 条件化行为陈述 -> 人物树 -> 后半故事线行动预测；长文本 -> 描述/记忆压缩 -> 决策点实际选择；短叙事先行特质/场景 -> 目标行动冲突 -> 内部/外显判断。
- **断裂：** 没有自然章节/卷完整fabula双端，没有稳定`storyline_id`，没有目标/知识/资源/承诺/关系/客观因果的带历史账本，没有多线会合/分离和全图recall，也没有中文网文、真实读者或商业结果。

## J. 可操作诊断入口（不自动执行）

只有用户明确批准具体文本试验后，才允许建立以下人工表：

1. `character_id / version / storyline_id_candidate`；
2. `scene_span / preceding_actions / earlier_memory_source`；
3. `condition_q / behavior_h / support / counterexample / confidence`；
4. `state_before / actual_action / state_after / state_history_reference`；
5. `author_actual_choice / alternative_plausible_choice / coercion_or_twist`；
6. `trait_conflict / event_setting_conflict / unexpected_but_explained`；
7. `relation_adjacent_only / trajectory_reference`；
8. `annotator / independent_label / adjudication / unresolved_reading`。

若缺少带历史状态、完整自然单位或可靠标注，必须分别报告`static_behavior_logic_only`、`natural_unit_unresolved`或`human_reliability_unverified`；不得自动改写用户文本。

## K. 成熟度裁决

维持`provisional`，不升`mature`。升级至少需要：

1. 开放且版本化的完整场景—行动生成/人工校正链；
2. 论文主参数、固定依赖、运行输出和原始人工标签可复现；
3. 多标注者独立判断、IAA、裁决和按作品/人物的不确定性；
4. 动态时间切片或在线更新，能处理人物成长、规则撤回和阶段变化；
5. 非邻接关系轨迹与稳定多人物`storyline_id`；
6. 自然章节/卷上的完整状态双端和端到端错误传播；
7. 中文长篇连载的独立保留集；
8. 若要形成质量或写作结论，另需人类内在评价与真实读者/行为结果，不得复用NLI。

## L. 准确续跑点

下一轮不应重复普通persona、next-action RP benchmark、静态树或MCQ角色选择。优先继续：

1. 自然章节/卷完整fabula双端并报告命名IAA/裁决；
2. 开放真实长篇中的稳定`storyline_id + goal/knowledge/resource/commitment/relation/objective-causal state + long-term intention + convergence/separation`，含中间/全图recall和端到端错误传播；
3. 自然卷/part内在人工评价、保留集验证和独立批评；
4. 若回访人物决策，只接受动态/阶段化规则、开放人工行动金标、位置平衡和跨作品复制。

