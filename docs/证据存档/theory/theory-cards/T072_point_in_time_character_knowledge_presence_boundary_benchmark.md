# T072 角色时点知识—在场边界基准与发布偏差审计研究候选纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T072
- **候选ID：** QF-136
- **标准名称：** 角色时点知识—在场边界基准与发布偏差审计研究候选纲领
- **英文名称：** Point-in-Time Character Knowledge, Presence-Boundary Benchmark, and Release-Drift Audit Candidate Program
- **核心作者：** Jaewoo Ahn；Taehyun Lee；Junyoung Lim；Jin-Hwa Kim；Sangdoo Yun；Hwaran Lee；Gunhee Kim；Nafis Irtiza Tripto；Saranya Venkatraman；Dominic Utz；Farhana Ferdousi Liza；Morteza Ziyadi；Farhad Masrour；Peyman Rohanian；Siyu Ren；Nima Monath；Nikos Vlassis；Alborz Geramifard；Paul A. Crook
- **理论类型：** `point_in_time_character_knowledge_presence_boundary_and_release_drift_audit_candidate`
- **学科来源：** natural language processing；role-playing agents；computational narratology；temporal consistency evaluation
- **当前状态：** `provisional`

T072保存一个窄而真实的净增量：把人物放在故事中的明确时点，分别检查其是否泄露未来、是否误称参与过未在场的既往事件、是否忘记亲历事件，以及是否能在不依赖直接参与时回答既往知识；同时把论文规模、固定代码、实际发布数据和人工核验覆盖分栏审计。

它不是完整人物状态或稳定情节线理论。TimeChara只有四个英语系列、14个人物和219个时点，10,895条实例主要由GPT-4管线构造，完整数据又需人工接受非商业门禁；SGR的知识事件和任务主要由GPT-3.5/GPT-4生成，公开ZIP与论文表1在storyline、事件和任务规模上直接不一致，且数据包没有独立许可证。两者都没有完整目标、资源、承诺、关系、客观因果历史、长期意图、线路会合/分离、全图召回或自然错误端到端传播。

## B. 原始研究问题与对象

TimeChara问的是：角色扮演模型处于故事中间时，能否只使用该人物在该时点应当知道的叙事信息，并区分未来事件、过去未在场、过去在场和一般既往知识。[QF136-P1, pp.1-8]

SGR/RoleFact问的是：能否从大量电影/电视剧剧本构造带时间戳的角色知识事件和四类访谈/补全任务，并通过检索与事实核验减少虚构人物回复中的事实性和时间性幻觉。[QF136-P2, pp.1-5]

对象并不相同：TimeChara以四个系列小说的14个主要人物为中心，构造219个`{character, time point}`；SGR把公开剧本人工分组为storyline，再用模型切场景、识别人名和生成知识事件，任务只覆盖公开数据中944个分组对象的一个子集。二者只能在“机器角色回复的时点知识/在场边界”上合并，不能在人物心理、完整人物弧或自然多线路真值上合并。

## C. 核心机制与理论单位

1. **人物—时点对。** 最小身份不是抽象人物，而是`character_id + story_version + time_point`。同一人物在不同章、卷或事件后可知内容不同。[QF136-P1, pp.2-3,23-27]
2. **未来边界。** 若问题事件晚于人物时点，合格回复不得泄露该未来事件；这检查知识可及性，不判断人物聪明、善良或写得好。[QF136-P1, pp.3-6]
3. **过去在场。** 若人物参与了既往事件，回复应能承认亲历或见证；失败可能是检索、记忆或参与者标注错误。[QF136-P1, pp.3-6]
4. **过去缺席。** 若人物未参与既往事件，回复不得把间接知识伪装成亲历；是否可通过他人得知仍需独立来源证据。[QF136-P1, pp.3-6]
5. **一般既往知识。** `past-only`检查人物对过去关系、事件或虚假前提的知识，不要求本人在场，因而必须与presence分栏。[QF136-P1, pp.3-7]
6. **结构化与自由问答。** 结构化模板直接组合事件摘要和参与者，自由问答及fake-based问题由GPT-4生成；模板覆盖与语言多样性不是同一质量。[QF136-P1, pp.5-7,14-22]
7. **人工过滤不等于全量双标gold。** 作者人工过滤生成实例；独立质量HIT只抽100条、每条两标注者。全量10,895条没有两人独立中间层标注。[QF136-P1, pp.21-23]
8. **时间化知识事件。** SGR把剧本切为speech/non-speech knowledge event并加`timestep`；DC/SGI只给人物当前场景之前的事件，ADV/OEI则允许访问整部story知识。[QF136-P2, p.4]
9. **论文规模与发布规模分栏。** SGR论文写1,152 story-lines、2.4M knowledge、72K interviews；固定公开ZIP实测为944个知识JSON、2,207,847条事件和87,855条任务。[QF136-P2, p.4; QF136-D3]
10. **代码、数据和结果分离。** TimeChara与RoleFact代码仓库都有许可证，但前者完整数据另受gated CC BY-NC条款，后者外部数据ZIP无独立许可证且代码仓库不含论文完整实验管线。[QF136-D1; QF136-D2; QF136-D3]
11. **时点一致不等于状态完备。** 回答未来/在场问题正确，只证明某个问答边界被满足，不证明目标、资源、承诺、关系、客观因果或长期意图被完整保存。
12. **机器角色基准不等于人物理论。** 测量对象是模型回复对构造问题的表现，不是作者如何创作人物，也不是读者怎样形成角色心智模型。

## D. 命题—证据主干

完整命题见`05_CLAIM_EVIDENCE_MATRIX.csv`。裁决主干如下：

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T072-C001 | point-in-time角色应只使用其当前时点可及知识 | QF136-P1 pp.1-3 | 核心定义 | 不是人物心理真值 |
| T072-C003 | TimeChara区分future/past-absence/past-presence/past-only | QF136-P1 pp.3-7 | 直接任务类型 | 四类不是完整状态本体 |
| T072-C004 | 14人物、219时点、10,895实例 | QF136-P1 pp.6-8,23-27 | 直接规模 | 四个英语系列且自动构造 |
| T072-C008 | 独立质量HIT只覆盖100条、每条两标注者 | QF136-P1 pp.22-23 | 人工抽样验证 | 不是全量gold/IAA |
| T072-C010 | Hugging Face数据需登录接受非商业门禁 | QF136-D3 | 发布访问边界 | 本轮未代表用户接受 |
| T072-C014 | SGR论文写1,152线路、2.4M事件、72K任务 | QF136-P2 p.4 | 论文规模 | 不能替代固定发布实测 |
| T072-C018 | SGR公开ZIP有944知识JSON、2,207,847事件 | QF136-D3 | 固定发布审计 | 与论文数字不一致 |
| T072-C019 | SGR公开四任务合计87,855，SGI为33,152 | QF136-D3 | 固定发布审计 | 论文写四类各18K |
| T072-C020 | ADV/OEI全部时间端点为空，DC/SGI才有端点 | QF136-D3 | 字段级审计 | 不能称四任务均时点化 |
| T072-C024 | SGR知识事件主要由GPT-3.5生成 | QF136-P2 p.4 | 构建边界 | 人工分组不等于事件人工gold |
| T072-C026 | SGR人工评价只覆盖500条THR分析和200条回复评分 | QF136-P2 p.5 | 有界人工验证 | 不是2.2M事件或87K任务IAA |
| T072-C029 | 两项目共同支持窄时点知识/在场边界候选 | cross-source | 有界综合 | 不形成完整storyline state |
| T072-C032 | 相对T062的净增量是显式未来/缺席/在场四分任务 | cross-source | 项目比较 | T062的人物弧与完整剧本资产不能被覆盖 |
| T072-C034 | 当前证据只允许provisional | cross-source | 最终裁决 | 不形成写作、质量或商业规则 |

## E. 来源身份与读取深度

### QF136-P1

- Ahn等，2024，*TimeChara: Evaluating Point-in-Time Character Hallucination of Role-Playing Large Language Models*，Findings of ACL，DOI `10.18653/v1/2024.findings-acl.197`。
- 35页全文读取；pp.1-10主文、pp.14-23构建/过滤/质量、pp.23-27人物时点、pp.30-35人工评价和距离实验；关键构建与质量页已渲染目检。
- SHA-256：`7FF99F0FCB42CA1B6A7AF809B4BCD409C439A864E724FA8F8874A610042D4773`。
- 边界：同行评审论文；数据自动构造、英语系列版权文本、完整发布需非商业门禁。

### QF136-P2

- Sadeq等，2024，*Mitigating Hallucination in Fictional Character Role-Play*，Findings of EMNLP，DOI `10.18653/v1/2024.findings-emnlp.846`。
- 13页全文读取；pp.1-5方法、SGR规模、任务、实验与人工子集，附录案例和任务输出同步回读；表1和表2已渲染目检。
- SHA-256：`E8548A6384F094D08FE8758B37448A7CB76E79CC9C6C940426E4875E1B1A9632`。
- 边界：同行评审论文；知识事件和问题主要由模型构建，数据发布与论文统计漂移。

### QF136-D1 / D2

- TimeChara固定代码commit `c0032b88a869b163035c71cb602ef5e5bb8c00d0`，35文件，MIT；快照SHA-256 `C3432378D37A2FEB7073491FD8FB88F692CC1154E11995B380DBFA86CAD1463C`。
- RoleFact固定代码commit `e17dd57ee6e96a91a57e9e4eed328c7a6f05c5c4`，5文件，Apache-2.0；快照SHA-256 `286CBAE81B2BB893B1B4F1490688122EB503313587F908126C55C33EFA2DC453`。
- 两份代码均只读审计，未执行。前者不含完整数据，后者不含外部SGR数据和完整实验管线。

### QF136-D3

- 根线程固定发布范围审计，记录Hugging Face revision、401门禁、Google Drive文件ID、ZIP哈希/CRC、JSON结构、任务/事件实测及许可证缺口。
- SHA-256：`AD6DD1208AEE5E5181BB8151843ED31FCF0D60432F9E3A5C03FAC27F97583D1C`。
- 该记录只证明发布范围与差异，不是独立学术验证。

## F. 原义、发布审计与项目转译分离

- **TimeChara原义：** 评价机器角色回复在明确人物时点是否泄露未来、误报在场或忘记/误认过去。
- **SGR/RoleFact原义：** 构建剧本知识事件和访谈/补全任务，以检索与事实核验降低角色回复幻觉。
- **发布审计：** QF136-D1-D3只说明固定版本实际含有什么、缺什么、能否合法读取以及论文/发布是否一致。
- **项目转译：** 未来仅在用户批准文本试验后，可建立人物—时点—事件—参与—来源账本；它是人工诊断接口，不是自动写作法。
- **未支持假设：** 时点问答正确会改善人物弧、作品质量、追读、留存或付费；人物知识边界等于真实心理；四类标签足以覆盖完整长篇人物状态。

## G. 主要批评与负面边界

1. TimeChara的10,895条不是全量双人gold，独立质量HIT只覆盖100条。
2. TimeChara完整数据需要用户登录并接受非商业条款，本轮不能复核真实行、字段和重复项。
3. TimeChara问题、事件摘要、标签描述和gold response大部分由GPT-4管线构造；人工过滤不能消除共同模型偏差。
4. 14个人物和219时点来自四个英语商业系列，不能外推现代中文多卷网文。
5. SGR人工分组storyline，但事件切分、人物识别和问题生成主要由GPT-3.5/GPT-4完成。
6. SGR固定ZIP与论文在storyline、knowledge event和四任务数量上明显不一致。
7. SGR的ADV/OEI没有start/end time；只有DC/SGI以当前场景切断知识，四类任务不能统一写成时点基准。
8. SGR任务覆盖241个story ID，DC/SGI只覆盖12/8个，不能称944个发布故事都经过四任务验证。
9. SGR数据ZIP没有LICENSE、README或NOTICE；代码Apache许可证不自动覆盖版权剧本派生数据。
10. 论文人工子集评价回复，不提供2.2M知识事件的precision/recall、IAA或全图召回。
11. TimeChara与SGR的“角色知道什么”是任务构造，不是人物真实心智或读者心智模型。
12. future/presence边界不包含目标、资源、承诺、关系、客观因果、长期意图或线路会合/分离。
13. PERSO-NET的读者特质印象、MovieGraphs的clip图、T061的行动者语义和T062的人物弧不能被静默合并为一个通用状态本体。
14. 没有读者、文学质量、自动写作或平台商业因果证据。

## H. 冻结不等式

```text
character_at_time_point != complete_character_state
future_cutoff != full_knowledge_history
event_presence != source_of_knowledge
past_absence != ignorance
past_presence != accurate_memory
past_only_question != complete_relationship_or_goal_state
manual_filtering != full_double_annotation
100_item_quality_HIT != 10895_item_human_gold
paper_dataset_count != fixed_release_count
manual_storyline_grouping != human_knowledge_event_annotation
timestamped_knowledge_event != stable_cross_character_storyline
code_license != external_dataset_license
roleplay_response_accuracy != reader_comprehension_or_character_quality
benchmark_improvement != writing_prescription
```

## I. 有限项目转译

只有用户另行批准具体文本试验后，才可建立：

`version_id | character_id | character_time_point | time_point_source | question_event_id | event_time | participant_ids | direct_presence | indirect_knowledge_source | expected_boundary | future_or_past | answer_claim | answer_source | contradiction | uncertainty | alternate_interpretation | annotator_1 | annotator_2 | adjudication | release_version`

顺序固定为：

1. 先冻结文本版本、人物身份和时点来源，不让模型自行生成“当前进度”。
2. 分开event time、人物presence和知识来源；缺席不自动等于不知道。
3. 只对可定位命题判future/past-absence/past-presence/past-only，保留不确定和竞争解释。
4. 与T061目标/信念/计划、T062人物弧、T035关系轨迹、T059严格presence和T060读者事件模型分栏。
5. 没有全量标注时报告覆盖率和未审区域，不把未检出写成无错误。
6. 不自动改写人物回复、章节、情节线或生产文本。

## J. 实际诊断价值

在不分析用户文本的当前阶段，T072只提供五个未来审计问题：

1. 这个人物在当前文本时点是否被赋予了尚未发生的信息？
2. 回复把亲历、旁听、推断和完全未知混成了一种“知道”吗？
3. 事件参与者、事件时间和人物时点是否都可回到原文或可靠标注？
4. 当前错误究竟来自知识库存、presence标注、检索、问题前提还是回复生成？
5. 论文规模、代码范围和实际发布数据是否一致，许可证是否允许保留与复核？

这些问题可审计机器角色回复的时点一致性，不能判断人物是否立体、作品是否优秀，更不能生成创作处方。

## K. 与现有理论的关系

- **T035：** T035处理人物对关系状态轨迹；T072只检查某人物在某时点的知识/在场边界，没有关系演化账本。
- **T036：** T036要求稳定多情节线状态和协调；T072不提供storyline会合、分离或依赖。
- **T043/T051：** 时间关系和fabula/syuzhet双端可校验人物/问题先后；T072只用离散时点或场景端点，不提供自然章卷完整时间图。
- **T053：** 模态/替代世界可解释fake premise；T072没有严格世界身份或可及性语义。
- **T059：** T059以闭区间和meeting严格表示presence；T072的presence多为问题构造或场景参与者标签，粒度较粗。
- **T060：** T060研究人类读者事件更新和记忆；T072评价机器角色回复，不能反推读者心理。
- **T061：** T061区分目标、信念、计划、尝试和结果；T072只补充时点知识/在场门槛，不能替代行动者语义。
- **T062：** T062覆盖完整剧本人物时间线/弧、知识边界和抽样验证；T072的净增量是多卷小说的显式future/absence/presence/past-only任务及更大剧本任务发布审计，但验证更弱，不能覆盖T062。
- **T067：** T067在生成循环中更新共享状态；T072可检测部分未来泄露和presence错置，却不验证目标刷新、关系历史或承诺保持。
- **T068：** T068检查场景条件化行动；T072检查行动前可知信息，二者只能互补。
- **T069：** T069保留整书E/S/C分句层；T072没有完整原文覆盖或自然章功能。
- **T071：** T071自动构造Episode/Storyline检索层；T072提供时点问答候选测试，但没有足够gold去验证T071全图。

以上关系均为`emergent_provisional_structure`。

## L. 最终状态与重审条件

**当前状态：`provisional`。**

正面证据包括两篇同行评审全文、TimeChara的明确四类任务和人工质量子集、SGR的规模化时间知识任务、两个许可明确的固定代码提交，以及对外部数据门禁、固定ZIP、JSON schema、计数和论文—发布漂移的只读审计。

不成熟原因包括：TimeChara数据受人工门禁且未复核；两项目中间层主要由LLM构造；人类验证只覆盖小子集；SGR固定发布与论文统计冲突；SGR数据包无独立许可证；没有全图召回、自然错误端到端传播、稳定跨人物线路状态或独立中文长篇复制。

升级至少需要：合法可复核的TimeChara固定数据版本；SGR发布版本说明和明确数据许可证；论文数字与固定数据对齐；事件、参与、知识来源和角色时点的独立双标gold、IAA、分歧和裁决；自然错误precision/recall与端到端传播；完整长篇上的稳定人物/线路状态接口；至少一个现代中文长篇复制。即使满足，也仍需另证读者和质量结果，不能自动变成写作规则。

本轮没有分析用户小说文本、调用子Agent、使用Hook或执行第三方代码。长期目标保持`active`。
