# T069 整书层级化分句功能图谱与自动标注分歧审计研究候选纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T069
- **候选ID：** QF-133
- **标准名称：** 整书层级化分句功能图谱与自动标注分歧审计研究候选纲领
- **英文名称：** Whole-Book Hierarchical Clause-Function Atlas and Automatic-Annotation Disagreement Audit Candidate Program
- **理论类型：** `validation_limited_whole_book_hierarchical_clause_function_atlas_and_disagreement_audit_candidate_program`
- **核心来源：** Troiano与Vossen 2024，*CLAUSE-ATLAS*
- **原始理论谱系：** Berman 1997的eventive、attitudinal-evaluative、factual-informative三类叙事内容
- **同谱系经验修正：** Berman与Katzenberger 2004的叙事开篇背景功能、时间枢轴和结构单位—话语功能分离
- **独立相邻分类修正：** Saldias与Roy 2020的Labovian action、orientation、evaluation口述个人叙事语料
- **固定发布审计：** CLAUSE-ATLAS commit `859cbfe4381e46a0a8343aeeda1aff28b6c18ad8`；RTN仓库commit `925f8900d49dce4f79ce037c096539045d8e41d6`
- **当前状态：** `provisional`

T069的净增量不是“把句子分成三类”这么薄，而是把六部完整小说保存为`book -> declared chapter -> paragraph -> clause`层级，为每个分句提供三套提示标签、有限人工标签和主观体验者，再把整书构成、等分块动态和分句标签转移放在同一个可审计坐标系内。它相对摘要和局部事件语料的重要之处，是原文层级和每条标签都可回到具体分句，而不是只保留一份生成摘要或作品总分。

这个增量不能成熟化。全书三层标签全部来自同一个`gpt-3.5-turbo-16k`的三个提示；人工只覆盖三本书各第一章。固定数据重算显示992条三人完整人工标注外还有1条双人记录和1个缺失值；人工三人Fleiss κ仅`.3236`，P1对人工多数票原始一致率约`.496`、κ约`.349`。论文选择P1后研究整书结构，但明确说目标不是证明该读法正确。发布数据卡又把两种说明文件写反，字段名与类型也和实际Parquet不一致。因此T069是“整书分句功能候选图谱 + 分歧审计”，不是可靠的整书叙事理解、事件骨干或创作处方。

## B. 原始研究问题与对象

CLAUSE-ATLAS的两个原始问题是：ChatGPT是否能作为叙事构念的文学标注者；事件、主观体验和语境信息三类标注能否揭示小说结构。对象为六部十九至二十世纪英语小说：*Alice's Adventures in Wonderland*、*Peter Pan*、*The Adventures of Pinocchio*、*Pride and Prejudice*、*Frankenstein*和*The Great Gatsby*。[QF133-P1, pp.3283-3287]

原始理论对象不是这六本小说，而是叙事内容类别与结构成分的关系。Berman 1997把叙事内容分为：沿时间顺序推进情节的eventives、表现叙述者或人物主观解释的attitudinal-evaluative elements，以及不增加新情节事件的factual-informative elements。[QF133-O1, pp.235-244]

独立相邻对象是Roadtrip Nation的594篇口述职业/人生个人叙事、10,296个分句。它把action、orientation、evaluation及not story交给三名Mechanical Turkers标注，再以高一致样本训练分类器并用分句子集匹配故事。[QF133-C1, pp.78-86]

必须分开五种对象：

1. `narrative_content_function`：分句在叙事中主要提供哪类内容；
2. `grammatical_clause_segment`：被选作标注单位的文本跨度；
3. `formal_story_event/fabula_interval`：具有参与者、时间、结果和故事年代双端的事件；
4. `reader_interpretation/quality`：读者怎样理解、评价或行动；
5. `writing_prescription`：怎样生成、重写或修复文本。

T069只直接处理前两项及其层级分布；后三项不能由标签比例或转移概率推出。

## C. 核心机制与理论单位

1. **三分内容身份：** `E`标外部发生与情节推进，`S`标人物或叙述者内部的思想、感知、情绪、记忆、信念和动机，`C`标人物、世界、历史文化与事件关系的补充信息。[QF133-P1, Table 1]
2. **单分句单主标签：** 人工指南要求即便一个分句含多类信息，也选最重要的一类；这是一种强制主功能裁决，不是多标签真值。[QF133-D2, pp.1-3]
3. **上下文窗口：** 自动标签输入为一个段落内依次排列的分句；人工可考虑前后句或段。完整跨段依赖没有进入自动提示。[QF133-P1, §5; QF133-D2]
4. **分句切分链：** Gutenberg文本先清噪、分章段、由spaCy分句，再以`gpt-3.5-turbo-16k`逐句函数调用切为最小分句。[QF133-P1, §4, Appendix A]
5. **三提示视角：** P1只给定义，P2给定义与例，P3给更详细定义、例和输出格式；论文把它们视作三名自动标注者。[QF133-P1, §5.1]
6. **有限人工层：** 三名硕士生训练后独立标三本书第一章，约24小时、两周完成；不是六本全书人工gold。[QF133-P1, §5.1]
7. **层级地址：** 固定数据保存`book/chapter_id/paragraph_id/clause_number/text`；`clause_number`跨六本书全局连续，章和段保留书内地址。[QF133-D1]
8. **主观体验者：** 只有P1的S标签自动抽取体验者；名字来自手工Wikipedia角色表加Other，并没有统一实体消歧。[QF133-P1, §5.1-5.2]
9. **整书构成：** 论文按书比较三类相对频率；P1在六本中都把S判为最大类，但这首先是P1的读法，不是独立人工结论。[QF133-P1, §7; QF133-D1]
10. **等分块动态：** 每本书按分句数等分100块，以6块移动平均画标签频率或熵，并叠加自然章界。块不是自然章，灰线也不是章级功能gold。[QF133-P1, Figure 5]
11. **标签转移：** 把整书看作E/S/C序列，以一阶和二阶Markov条件概率观察标签聚集及事件到主观体验的转移。[QF133-P1, §7]
12. **分歧即对象：** 提示差、人工差、模型—人工差和分句切分误差都必须保存，不能只输出多数票后删除不确定性。

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T069-C001-C006 | Berman三类内容、形式—内容—功能分离和结构成分独立构成原始谱系 | QF133-O1 pp.235-244 | 原始概念理论 | 不是自动全书标注验证 |
| T069-C007-C009 | CLAUSE-ATLAS将三类映为E/S/C，以分句作单位且不形式化event | QF133-P1 pp.3284-3285 | 核心操作化 | factual happening不等于完整fabula事件 |
| T069-C010-C014 | 六书层级、模型切分、120条抽检及段内提示构成数据链 | QF133-P1 §§4-5, Appendix A | 原始方法与有限切分验证 | 抽检小、自动标签无跨段依赖 |
| T069-C015-C017 | 三人只标三本首章；全书有三提示标签；固定表为41715×15 | QF133-P1 §§5-6; QF133-D1 | 原始范围与直接发布审计 | human coverage不是whole corpus |
| T069-C018-C019 | 三提示κ=.567685，24649全同、15930多数、1136全异 | QF133-D1 all rows | 固定数据重算 | 同一模型三提示不是独立复制 |
| T069-C020-C023 | 人工完整992、另1条部分；人工κ=.323587；P1对多数票raw=.495968/κ=.348927；人工全同子集P1 raw=.64631 | QF133-D1 all human rows | 固定发布不利重算 | 条件化于容易项目会抬高一致率 |
| T069-C024-C026 | 540条低质量分歧含感知词、感叹、外显行为、层叠信息和切分错；论文选择P1但不验证读法正确 | QF133-P1 §§6.2-7 | 原始定性不利与声明边界 | worker score不是真值准确率 |
| T069-C027-C030 | P1整书构成、100等分块/6块平滑和标签转移形成描述性结构分析 | QF133-P1 §7 | 原始探索性结果 | 无独立章级或读者结果验证 |
| T069-C031-C034 | 体验者字符串碎片、层级键完整、数据卡错位和notebook复现缺口由固定发布审计确认 | QF133-D1-D3 | 直接发布审计 | 不否定全部数据，但阻止无条件部署 |
| T069-C035 | 固定发布为CC BY-NC-SA 4.0 | QF133-D1-D3 README/license | 许可边界 | 非商业且同方式共享，不是任意生产使用许可 |
| T069-C036-C040 | RTN提供相邻Labov分类，但含1062全异票；84.7只高一致测试，agreement>=2为68.31；orientation相似性只有48% | QF133-C1/D4 | 独立相邻支持与不利修正 | 口述个人叙事不复制文学全书标签 |
| T069-C041 | Berman 2004支持结构单位与功能开篇分离，但只分析160篇诱发书面文本开篇 | QF133-V1 pp.57-94 | 同谱系经验范围修正 | 不能替整书标签作gold |
| T069-C042 | 全链支持层级化分句功能图谱与分歧审计，不支持fabula双端、稳定线路、自然卷、质量或自动写作 | cross-source | 项目综合 | 不形成生成、修复、评分规则 |

## E. 来源身份与实际读取深度

### QF133-P1

- **身份：** LREC-COLING 2024同行评审论文，ACL Anthology pp.3283-3296。
- **读取：** 全文；理论、数据、切分、三提示、人工协议、两类一致性、CrowdTruth、540条分歧、书/块/分句分析、结论和切分附录均核对。
- **关键结果：** 41,715分句；三提示Fleiss κ约.57；24,649条三提示完全同意；人工/模型对有争议条目存在系统差异。
- **关键不利：** 人工仅992条完整三人标注；作者把event明确当广义事实而非形式事件；段落级输入；结构分析只用P1；目标是解释某一读法而非证明读法正确。
- **本地哈希：** `E19307F2805D63974FAC5117221B431ACA255B7896DB1E562283C21EDE03B9ED`。

### QF133-D1

- **身份：** CLAUSE-ATLAS固定commit Parquet。
- **读取：** 41,715行、15列全部读取；六书/章/段/分句键、null、标签、提示/人工一致、体验者、重复、文本长度和极端样例均审计。
- **关键重算：** 三提示κ`.567685`；人工κ`.323587`；P1对人工多数票raw `.495968`、κ`.348927`；人工全同393条中P1 raw `.64631`。
- **发布缺陷：** 论文称992条两端共同标注，实际还出现第993条部分人工记录，其中Pinocchio一条`annotator_two`缺失；不应悄悄填补。
- **本地哈希：** `2FCE6A0EDE875E521384E3695794AEDB23BFEDD7EA79CC161D3D328CDCF475BE`。

### QF133-D2

- **身份：** 固定commit三页人工指南。
- **读取：** 全部定义、例、主功能裁决、上下文建议和叙事人称例。
- **作用：** 证明human label不是无歧义事实：指南明确允许考虑邻接上下文，并要求多功能分句只选“最重要”一类。
- **本地哈希：** `14241CAE0F451312CA38F24A46BAB9D96F1BFF4B2ACA0328E711ABF4E1DAC57D`。

### QF133-D3

- **身份：** 固定commit notebook。
- **读取：** 12个cell全部读取；模型、三个label prompt、切分/标注/体验者function schema和toy example核对。
- **作用：** 提示可追踪；也显示发布不是端到端可复现包：缺六书获取/清洗/章节解析、固定依赖、请求响应、失败重试和最终合并脚本。
- **本地哈希：** `4A4E23B774B6BB031310978EC4D905A625C664DA8CEC15DFD89D10A91BC1D368`。

### QF133-O1

- **身份：** Berman 1997同行评审原始概念论文，DOI `10.1075/jnlh.7.29nar`。
- **读取：** 作者上传扫描的核心全文OCR与出版元数据；重点读取三分内容、形式—内容—功能区分、结构成分映射和发展性结论。
- **作用：** 证明CLAUSE-ATLAS三类有明确理论谱系，也同时证明原理论没有把一切人物内部内容简单等同可稳定自动分类标签。
- **边界：** OCR质量差且本轮未获得可保存本地PDF；不伪称拥有本地副本。

### QF133-V1

- **身份：** Berman与Katzenberger 2004，*Discourse Processes* 38(1):57-94，TalkBank开放PDF。
- **读取：** 38页全文；80名希伯来语参与者、160篇写作、开篇功能切分、两作者超过90%一致、时间/一般性枢轴、结果与讨论均核对。
- **作用：** 同谱系经验修正：T-unit结构和话语开篇功能不是同一单位；叙事开篇可混合事件、描述、一般化和元话语。
- **关键边界：** 只分析诱发文本开篇；作者明确没有把开篇发现直接当总体质量测量。

### QF133-C1 / D4

- **身份：** 2020 ACL NUSE同行评审论文及固定官方仓库。
- **读取：** 论文全文；仓库14条目、README、许可、MTurk HTML和10,296行CSV全部审计。
- **关键结果：** 594篇口述个人叙事；三人票；3,495条全同、5,739条多数、1,062条全异；高一致test F-score 84.7%，agreement>=2 test为68.31%。
- **关键不利：** 定义不是CLAUSE-ATLAS的逐项复制；evaluation含叙述目的/意义，action强调因果序列，orientation相似性匹配仅48%；低一致行的mode随机选择。
- **本地哈希：** PDF `0B00A3710D3800B84FF3304AB077985D2E43D58721A95DE5404F3D978B14A8B4`；ZIP `D4B2065376A67514275664A3AED126957E82B839DE0CC2028C027CF1C238A2CB`。

## F. 原义、独立修正、项目转译与不受支持项

- **theory_directly_supports：** eventive / attitudinal-evaluative / factual-informative三分内容及其与结构成分、形式实现的区别。
- **CLAUSE-ATLAS_directly_supports：** 六书完整层级地址、E/S/C三提示标签、有限人工层、体验者字符串、书级构成、等分块趋势和标签转移的探索性描述。
- **release_audit_supports：** 一致性重算、1个缺失、体验者身份碎片、数据卡字段/说明错位、notebook非端到端复现和许可边界。
- **independent_correction_supports：** 相邻Labov分类可在大规模口述分句上被非专家操作，但低一致行很多，高分只适用于高一致子集，orientation对故事相似性的作用没有得到支持。
- **project_translation：** 未来若用户批准特定文本试验，可把分句功能当一个人工可审计层，与事件、时间、人物状态和自然章容器并排，不得替代它们。
- **not_supported：** ChatGPT与自然读者等价；三提示等于三名独立专家；多数票等于唯一正确；S就是人物弧；E就是完整事件骨干；C就是可删背景；标签熵就是情节高潮；块趋势就是自然章节结构；体验者字符串就是稳定人物ID；任何比例或转移就是质量、追读、留存或付费；据此自动生成、重写、压缩、分章、分卷或评分。

## G. 主要批评、负面结果与内部冲突

1. **验证覆盖过小：** 人工完整三人层只占992/41,715约2.38%，且集中在三本第一章。
2. **同模型伪独立风险：** 三个自动“标注者”是同一模型、同温度、同段落输入，仅提示细节不同。
3. **人工本身低一致：** 三人κ约.324，第三人与第二人raw agreement约.466；不能用“人也分歧”直接证明模型正确。
4. **模型—人工差异大：** P1对人工多数票原始一致约49.6%；人工全同子集升高是条件选择，不能外推全部分句。
5. **构念被扩宽：** Berman evaluative关注解释/态度，CLAUSE-ATLAS的S把感知、记忆、信念、动机等全部合入；这是项目操作化，不是原理论逐字等价。
6. **event未形式化：** 论文主动把E定义成各种factual happenings；没有参与者角色、结果状态、时间双端、事件同一性或因果边。
7. **单标签强迫：** 层叠分句必须选“最重要”一类，分歧可能来自真正多功能，而不只是标注者不可靠。
8. **段落上下文不足：** 自动标签看不到跨段依赖；长篇视点回接、延迟揭示和跨章意义可能被压成局部判断。
9. **分句切分验证薄：** 只有六书各四段、共120个分句；74%三人全同，且论文承认存在长块和错误切分。
10. **体验者未消歧：** 固定数据中`narrator`、`The narrator`、`Other: narrator`、`I`、`Other: I`和角色变体并存；879个字符串不是879个可靠实体。
11. **章节只是地址：** 数据保留自然章ID，但论文没有给每章独立人工功能gold、章际差异检验或章结构正确性验证。
12. **等分块非自然结构：** 100块及6块平滑是分析选择；尖峰与情节点的联系只用少数案例解释。
13. **发布文档错位：** README把human/ChatGPT两行的instructions写反，写`human_one`但实际是`annotator_one`，写`chapter_id i64`但Frankenstein含`Letter 1`等字符串。
14. **复现链不完整：** notebook使用旧API并只运行toy example；没有固定Gutenberg文本版本、完整清洗、重试和最终数据构建脚本。
15. **独立语料非复制：** RTN是短口述职业叙事，分类定义不同；其1,062条全异票也说明功能标签存在真实歧义。
16. **外部效度：** 六部英语公版经典不代表现代中文网文、连续更新、多卷结构、平台阅读或付费读者。

## H. 冻结不等式与竞争解释

- `clause_function_label != formal_story_event`
- `same_model_three_prompts != three_independent_expert_annotators`
- `human_disagreement != automatic_annotation_correctness`
- `first_chapter_human_subset != whole_book_human_gold`
- `declared_chapter_id != chapter_function_validation`
- `equal_clause_chunk != natural_chapter_or_volume`
- `subjective_experience_count != character_arc`
- `experiencer_string != canonical_character_id`
- `label_entropy_or_transition != plot_quality`
- `whole_book_automatic_coverage != reliable_whole_book_understanding`

竞争解释包括：S比例高来自提示定义宽、对话和感知动词，而不一定说明小说更“内心化”；C比例差来自文体/句法/切分，而不一定是世界建构多少；事件到S的转移可能由报告思想的语法或对话标记造成；块熵峰可能只是章节长度、切分密度或平滑参数；模型—人工差异可能是观点差，也可能是提示偏差、上下文不足、实体表和切分错；跨书差异可能由年代、体裁、叙述人称、翻译版本或Gutenberg清洗造成。

## I. 与本项目的有限转译

当前不分析用户小说，不运行CLAUSE-ATLAS模型，不自动切分、标签、修复或评分生产文本。只有用户另行明确批准具体文本和有限试验后，才可建立以下人工审计表：

1. `work/version/natural chapter/paragraph/clause span`；
2. `segmenter/version/split alternatives/error flag`；
3. `E/S/C primary label + secondary plausible labels + rationale`；
4. `annotator/prompt/model/context window/independence`；
5. `experiencer canonical ID / surface form / uncertainty`；
6. `formal event link / time endpoints / participant roles / causal state`；
7. `chapter aggregation / equal-chunk aggregation / parameter sensitivity`；
8. `agreement metric / raw disagreement / adjudication / held-out unit`；
9. `reader/quality/commercial outcome explicitly unobserved`。

即便获批，T069也只能作为文本功能层；必须同T001事件性、T024宏结构、T037自然边界、T043/T051时间图、T060读者事件模型、T061行动者语义和T063摘要遗漏并列。没有这些层，不得把E/S/C序列升级为完整情节线或人物弧。

## J. 实际诊断价值

T069当前最有价值地回答：“一个声称覆盖整本小说的分句标注资源，究竟覆盖了什么、验证了什么，又把哪些结构悄悄省略了？”

- 原文是否还能按书、章、段、分句回定位；
- 标签是理论内容功能、语法类别、事件、人物心理还是质量，是否被混写；
- 一个分句只有一个主功能，还是有被裁决掉的次功能；
- 三个提示是否共享同一模型偏差；
- 人工层覆盖多少、是否集中在开篇、是否有缺失；
- κ、raw agreement、全同/多数/全异是否同时报告；
- 选择高一致子集后成绩提高，是否被写成全语料可靠；
- 自然章只是地址，还是有独立章级gold；
- 100等分块和移动平均是否被误当作者结构；
- 体验者是否完成实体归一和代词/叙述者消歧；
- 数据卡、字段、许可和notebook是否足够支持复现；
- 是否误把整书自动覆盖写成整书人类验证。

其当前诊断身份是`whole_book_clause_function_atlas_and_disagreement_audit_candidate_only`。

## K. 与其他理论的关系

- 与T001：`broad_event_label_vs_eventhood_and_eventfulness`
- 与T024：`clause_function_composition_vs_macrosemantic_structure`
- 与T025：`subjective_experience_experiencer_vs_social_mind_units`
- 与T035：`experiencer_mentions_vs_pairwise_relationship_trajectory`
- 与T036：`flat_label_sequence_vs_multi_storyline_coordination`
- 与T037：`declared_hierarchy_vs_boundary_recovery`
- 与T041：`clause_function_distribution_vs_genre_tense_deictic_center`
- 与T043：`E_label_vs_temporal_relation_graph`
- 与T050：`declared_chapter_address_vs_narrative_time_container`
- 与T051：`function_sequence_vs_fabula_syuzhet_dual_endpoints`
- 与T052：`chapter_address_vs_chapter_transition_gold`
- 与T060：`text_function_sequence_vs_reader_event_model_update`
- 与T061：`subjective_experiencer_vs_typed_goal_belief_plan_semantics`
- 与T062：`experiencer_frequency_vs_cross_scene_character_arc`
- 与T063：`full_source_labels_vs_summary_selection_and_faithfulness`
- 与T065：`text_profile_vs_visible_reader_response`
- 与T066：`broad_E_label_vs_event_role_topology`

## L. 最终状态与重审条件

**当前状态：`provisional`。**

冻结的窄身份：

`whole_book_hierarchy + clause_function_label_layers + limited_human_subset + explicit_prompt/human_disagreement + release_audit`

不冻结：

`formal_event_graph + complete_chapter_fabula_endpoints + chapter_or_volume_intrinsic_structure + stable_storyline_state + canonical_character_arc + reader_quality + Chinese_webnovel_transfer + automatic_writing_rules`

只有同时满足以下条件后才重审成熟度：

1. 多部完整自然长篇、跨体裁和至少一次现代中文连载复制；
2. 分句切分的大样本、多标注者、命名IAA和裁决日志；
3. 六书或新增书的分层随机人工gold，而非只取三个第一章；
4. 人工标签允许多功能或至少保存次选与分歧原因；
5. 模型、提示、人工之间分开报告raw、κ/α、逐类混淆和不确定性；
6. 体验者规范化为稳定实体ID并报告共指/叙述者误差；
7. 自然章级聚合有独立人类效度，而非只叠加边界线；
8. 固定文本版本、完整清洗、重试、原始响应和端到端代码可复现；
9. 至少一个独立团队复制功能分布或转移结果；
10. 若声称连接事件、人物弧、质量或读者结果，必须分别取得对应直接gold、held-out验证和独立批评。

在此之前，T069不得用于自动生成、重写、删改、扩写、压缩、分章、分卷、评分或商业预测。长期目标继续`active`。
