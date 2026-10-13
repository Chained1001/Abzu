# 理论档案：T043

## Table Of Contents

Use the existing section headings below as the navigation map.

## A. 理论身份

- **理论编号：** T043
- **候选编号：** QF-105
- **标准名称：** 事件—时间表达标注、稠密局部时间图与多轴偏序研究纲领
- **英文名称：** Event and Temporal Expression Annotation, Locally Dense Temporal Graph, and Multi-Axis Partial-Order Research Program
- **代表研究者：** James Pustejovsky；José Castaño；Robert Ingria；Roser Saurí；Robert Gaizauskas；Andrea Setzer；Graham Katz；Dragomir Radev；Taylor Cassidy；Bill McDowell；Nathanael Chambers；Steven Bethard；Nasrin Mostafazadeh；Alyson Grealish；James Allen；Lucy Vanderwende；Qiang Ning；Hao Wu；Dan Roth
- **理论类型：** 时间语义、事件结构、语料标注、局部图表示及其经验修正的有界研究纲领
- **核心规范：** QF105-P1
- **稠密图验证与不利结果：** QF105-V1
- **故事级时间—因果扩展：** QF105-V2
- **多轴与起点修正：** QF105-C1
- **当前状态：** `mature`

这里成熟的不是一个完整长篇时间线算法，也不是“先标事件再自动改写”的写作方法。成熟对象是四项相互修正的研究工作所形成的有界纲领：TimeML把事件、时间表达、显式信号和关系边分层；TimeBank-Dense把规定窗口内的缺边变成可检查边，同时暴露46% `VAGUE`与较低一致性；CaTeRS把关系扩到完整五句故事并联合时间与因果；MATRES再把不可直接比较的事件分到不同语义时间轴，并只比较同轴事件的起点。四份全文共同证明“可表示、可检查、局部更稠密”不等于“全局完备、关系唯一、时长已解或适用于中文长篇”。

## B. 原始研究问题

TimeML追问：怎样在自然语言文本中统一标记事件、显式与相对时间表达、事件—时间锚定、事件间顺序、模态/事实性从属和体貌关系，同时允许欠指明时间值延迟解释。[QF105-P1, local pp.1-7]

TimeBank-Dense追问：稀疏TimeBank里的空白边究竟是无关系、未检查还是漏标；怎样让时间图具备局部完备、强连通与传递一致性；强迫标注困难事件对会付出什么一致性代价。[QF105-V1, pp.501-506]

CaTeRS追问：五句常识故事中怎样以完整故事为上下文，同时标注跨句时间关系和Cause/Enable/Prevent等因果关系；文本出现顺序与近似事件顺序相差多少；事件跨度和语义边的可靠性是否相同。[QF105-V2, pp.51-61]

MATRES追问：为什么传统区间关系即使由专家标注也常只有约.60一致性；意图、意见、假设、泛指和否定事件是否应与主轴事件强制比较；只比较同轴事件起点能否减少终点与时长造成的歧义。[QF105-C1, pp.1318-1328]

这些研究不回答作者应该用多少倒叙、章节时间跨度怎样才好，也不把标注一致性或模型F1解释成读者投入或作品质量。

## C. 核心机制与理论单位

1. **节点与边分离：** `EVENT`、`TIMEX3`、`SIGNAL`先保存文本对象，`LINK`再保存对象之间的时间、从属和体貌关系；节点身份不能由边标签反推。[QF105-P1, local pp.2-6]
2. **时间表达可延迟求值：** 日期、时间、时长、文档功能和相对时间函数分栏；`last week`等可锚到DCT后再计算，而不是在第一次标注时强造绝对值。[QF105-P1, local p.3]
3. **空边必须有语义：** 未标注不能默认等于“无关系”或`VAGUE`。TimeBank-Dense规定同句、相邻句、事件/时间到DCT的必查边，使窗口内空边可解释。[QF105-V1, pp.502-503]
4. **局部稠密不是全局完整：** 传递推理可保证规定子图强连通、无矛盾且边齐全；整篇仍只有相邻句窗口，作者明确称其`strongly connected, but not complete`。[QF105-V1, pp.503-505]
5. **模糊性是结果而非失败：** 困难边不能跳过。TimeBank-Dense以多数规则退回`VAGUE`；MATRES分别问两个方向是否可能，以四种组合产生before/after/equal/vague。[QF105-V1, pp.504-505；QF105-C1, pp.1323-1324]
6. **因果边只给部分时间约束：** Cause/Enable/Prevent通常要求原因起点先于结果起点，但事件整体可before或overlap，导致持续事件结束的关系还须另分。[QF105-V2, pp.55-57]
7. **完整局部上下文可跨句：** CaTeRS在五句故事全上下文上连边，并利用传递性只保留必要显式边；这比句内关系更广，却仍不是长篇图。[QF105-V2, pp.57-60]
8. **语义时间轴分离不可比事件：** 主轴、意图/意见正交轴、假设/泛指平行轴和不置轴的否定事件分开；只在同轴内比较，避免把未实现意图或不确定意见强投影为事实时间。[QF105-C1, pp.1319-1322]
9. **起点偏序不等于区间时间：** MATRES只标事件起点，显著提高任务可判性；终点、时长和区间关系被明确保留为另一任务。[QF105-C1, pp.1322-1326]
10. **图质量须由不利数据限制：** 46% `VAGUE`、TimeBank-Dense κ=.56-.64、CaTeRS链接κ=.49/.51、MATRES equal无测试预测及vague F1=.18都必须和正面结果共同保留。[QF105-V1, p.505；QF105-V2, p.58；QF105-C1, pp.1324-1326]

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T043-C01 | TimeML统一处理事件、时间锚定、排序和延迟解释 | QF105-P1 local pp.1-2 | 原始问题 | 不是完成系统 |
| T043-C02 | EVENT/TIMEX3/SIGNAL/LINK分层 | QF105-P1 local p.2 | 原始表示 | 不保证唯一分析 |
| T043-C03 | EVENT覆盖过程、发生和部分状态 | QF105-P1 local pp.2-3 | 原始节点表 | 非所有状态 |
| T043-C04 | TIMEX3支持文档锚点和相对函数 | QF105-P1 local p.3 | 原始时间表示 | 组合语义未完整给出 |
| T043-C05 | SIGNAL独立保存时间/否定/量化提示 | QF105-P1 local p.3 | 原始信号表 | 不穷尽隐式关系 |
| T043-C06 | TLINK/SLINK/ALINK分离三类边 | QF105-P1 local pp.4-6 | 原始边类型 | 非完整话语/因果理论 |
| T043-C07 | TLINK给出区间关系表 | QF105-P1 local p.4 | 原始关系集 | 不决定必查边 |
| T043-C08 | 欠指明、组合语义和多语言仍有限 | QF105-P1 local pp.6-7 | 直接自限 | 不可外推完成标准 |
| T043-D01 | 稀疏空边有三种不同来源 | QF105-V1 p.502 | 独立批评 | 无标签非VAGUE |
| T043-D02 | 稠密窗口只覆盖同句、相邻句和DCT边 | QF105-V1 p.503 | 独立设计 | 非任意远距 |
| T043-D03 | 工具保证强连通、无矛盾和规定边齐全 | QF105-V1 pp.503-504 | 图约束 | 不证明语义真值 |
| T043-D04 | 模态/假设按可能世界排序 | QF105-V1 p.504 | 标注选择 | 非事实断言 |
| T043-D05 | 36篇含1729事件、289时间、12715边 | QF105-V1 pp.502,504-505 | 语料结果 | 新闻小样本 |
| T043-D06 | 46% VAGUE且一致性下降 | QF105-V1 p.505 | 不利结果 | 稠密化有成本 |
| T043-D07 | 局部完备不等于完整文档图 | QF105-V1 pp.503,505 | 范围边界 | 不得误写complete |
| T043-K01 | CaTeRS扩展事件跨度与非动词事件 | QF105-V2 pp.51-54 | 独立节点修正 | 任务依赖定义 |
| T043-K02 | 四时间关系与九因果变体 | QF105-V2 pp.54-57 | 独立边表 | 非完整关系宇宙 |
| T043-K03 | 因果约束起点而不唯一约束终点 | QF105-V2 pp.55-57 | 因果—时间接口 | 不等于整体先后 |
| T043-K04 | 五句故事全局标注且传递最小化 | QF105-V2 p.57 | 故事级图设计 | 不是长篇 |
| T043-K05 | 2708事件、2715关系、488因果边 | QF105-V2 pp.57-58 | 语料结果 | 短常识故事 |
| T043-K06 | 近似语义次序与文本次序23%不符 | QF105-V2 p.58 | 顺序反证 | 计算有简化 |
| T043-K07 | span κ=.91，link κ=.49/.51 | QF105-V2 pp.58-60 | 一致性与范围 | 共享仅20故事 |
| T043-M01 | 传统任务约.60，专家先导κ=.84 | QF105-C1 pp.1318-1319 | 修正动机/先导 | 非普遍结果 |
| T043-M02 | 同轴比较并分主轴/正交/平行轴 | QF105-C1 pp.1319-1320 | 多轴机制 | 新闻任务范围 |
| T043-M03 | 跨轴关系被暂缓而非判为不重要 | QF105-C1 pp.1320-1321 | 直接边界 | 缺边非无关系 |
| T043-M04 | 可锚定性不等于事实性 | QF105-C1 pp.1321-1322 | 概念修正 | 需全文/外部知识 |
| T043-M05 | 终点任务显著难于起点 | QF105-C1 pp.1322-1323 | 不利先导 | 时长仍未解 |
| T043-M06 | 两个可能性问题显式产生VAGUE | QF105-C1 pp.1323-1324 | 模糊性设计 | 不消除固有模糊 |
| T043-M07 | 专家与众包同轴起点一致性较高 | QF105-C1 p.1324 | 经验验证 | vague仍较弱 |
| T043-M08 | 与TB-Dense明确关系多相符，equal分歧大 | QF105-C1 pp.1324-1325 | 数据对照 | 任务对象已改变 |
| T043-M09 | 基线F1=.69但equal无预测、vague=.18 | QF105-C1 pp.1325-1326 | 模型与边界 | 不可只报总体分 |

## E. 来源身份与实际读取深度

### QF105-P1

- **身份：** Pustejovsky等2003，*TimeML: Robust Specification of Event and Temporal Expressions in Text*，AAAI Technical Report SS-03-07。
- **实际读取：** 本地PDF pp.1-7全文，覆盖摘要、四项问题、EVENT/TIMEX3/SIGNAL、TLINK/SLINK/ALINK、因果示例、结论和未来工作。
- **作用：** 提供节点—信号—边的核心规范和延迟解释原则。
- **SHA-256：** `E45B9888A56A43113E79A55B9F449E2230EEEE3BB3A03ABBD4865DF7671D2BB8`。

### QF105-V1

- **身份：** Cassidy、McDowell、Chambers与Bethard 2014，*An Annotation Framework for Dense Event Ordering*，ACL 2014，pp.501-506，DOI `10.3115/v1/P14-2082`。
- **实际读取：** 全文读取空边问题、局部窗口、六关系、工具、传递约束、VAGUE准则、36文档统计、一致性和结论。
- **作用：** 证明规定窗口可形成局部稠密一致图，也直接量化模糊关系和一致性代价。
- **SHA-256：** `8DEDE5341A43CC7D20283BBAA174E687990FF6F828F93DFB935E669FCAD607D6`。

### QF105-V2

- **身份：** Mostafazadeh等2016，*CaTeRS: Causal and Temporal Relation Scheme for Semantic Annotation of Event Structures*，W16-1007，pp.51-61，DOI `10.18653/v1/W16-1007`。
- **实际读取：** 全文读取事件定义和跨度、嵌入/系词规则、四时间关系、九因果变体、五句故事标注、统计、一致性、相关工作和结论。
- **作用：** 把图扩到完整五句故事和跨句时间—因果关系，同时提供顺序反例和中等链接一致性。
- **SHA-256：** `CEC21196FA76D36AD96DFDC9A9BB8AE28F77ABE23B42590EB79DDB1708681054`。

### QF105-C1

- **身份：** Ning、Wu与Roth 2018，*A Multi-Axis Annotation Scheme for Event Temporal Relations*，ACL 2018，pp.1318-1328，DOI `10.18653/v1/P18-1122`。
- **实际读取：** 全文读取低一致性问题、多轴模型、跨轴投影、事实性区别、区间拆分、终点不利先导、VAGUE两问、MATRES统计、TB-Dense对照、基线和结论。
- **作用：** 把强制单轴比较改为同轴起点偏序，并明确分离跨轴、事实性、时长和终点问题。
- **SHA-256：** `FA56ED09681290C322C8C79104FE6CADB8715E949F72118FCBADB47BE1C104DD`。

## F. 原义、项目转译与不受支持项

- **theory_directly_supports：** 事件、时间表达、显式信号和关系边应分层；局部必查边可形成一致图；不确定边应显式保留；完整五句故事可跨句标注时间—因果关系；不同模态/意图事件可属于不可直接比较的语义时间轴。
- **independent_validation：** TimeBank-Dense量化局部稠密图及VAGUE，CaTeRS量化故事级跨句网络，MATRES以专家、众包和模型对照验证起点化与多轴拆分。
- **independent_adverse_evidence：** 46% VAGUE、较低κ、语义链接中等一致、终点任务失败、equal/vague弱类、跨轴和时长未解。
- **project_translation：** 未来经用户批准时，只能把可定位文本对象登记为节点、边、轴、缺边理由和不确定性；不得自动补齐远距离关系。
- **project_hypothesis：** 普通话时体、时间词、零形式、引语/意图层与章节跨度能否采用相同节点/轴划分，需要中文长篇标注和读者研究。
- **not_supported：** 局部强连通等于完整时间线；文本顺序错误率等于叙事质量；时长可由起点推回；多轴就是多情节线；跨轴没有关系；关系图可自动重排文本；可推出悬念、追读、留存、付费或质量。

## G. 文本尺度覆盖

- **directly_studied：** `event_mention`、`event_instance`、`temporal_expression`、`signal`、`same_sentence_pair`、`adjacent_sentence_pair`、`DCT_anchor`、`five_sentence_story`、`local_temporal_graph`、`causal_temporal_link`、`semantic_time_axis`、`start_point_partial_order`、`vague_relation`。
- **reasonable_extension：** 对一个边界明确的短片段建立节点和局部候选边，明确区分未检查、不可比、VAGUE和可判关系。
- **project_hypothesis：** 中文段落、场景内部和短章节内的事件—时间表达图及引语/意图轴。
- **not_supported：** 自然场景/章/弧/卷定位、跨章远距共指、整部长篇时间线、连载发布历史、读者长期保持和商业结果。

## H. 批评、竞争和修正

1. TimeML提供丰富关系表，但没有决定哪些节点对必须标注；TimeBank-Dense以规定窗口修复空边语义，却必须承认全图人工成本不可承受。
2. TimeBank-Dense把模态和假设事件投影到可能世界排序；MATRES指出这种跨轴投影常依外部知识，改为暂缓跨轴关系。两者是明确竞争的标注选择，不可静默合并。
3. CaTeRS把时间与因果共同标注并扩到完整五句故事，但四专家一致性只用20故事，关系κ远低于事件跨度κ，且作者否认其为全面时间/因果分析。
4. MATRES用起点和语义轴提升一致性，但代价是把终点、时长和跨轴关系分离到未来研究；整体F1提升不能掩盖equal无预测和vague低F1。
5. 四项研究都以英语新闻或短故事为主要材料，没有验证中文网络小说、跨场景章节时间重构、读者加工或写作效果。

## I. 与本项目的有限转译

当前不分析任何用户小说。未来只有用户另行批准后，才可：

1. 先记录事件跨度、时间表达、显式信号、文档/故事时间锚点和文本位置；
2. 为每条候选边记录两端、关系集、直接文字证据、推导路径和是否依赖外部知识；
3. 分开`unexamined_pair`、`no_relation_supported`、`vague_relation`、`cross_axis_deferred`和`relation_supported`；
4. 只在明确窗口内声称局部完备，并把窗口外边标为未检查；
5. 把事件文本顺序、T042关系推断、T041时态—指示中心和T043图表示分栏；
6. 对意图、意见、假设、泛指和否定事件先检查轴身份，不把未实现内容投影为事实；
7. 对时长和终点报告`duration_not_resolved_by_start_order`；
8. 不自动调序、补时间词、生成倒叙、删除VAGUE或按图密度评分。

## J. 实际诊断价值

T043最适合处理：“这段文本究竟有哪些可定位的事件和时间节点，哪些局部关系真的有证据，哪些只是没检查、不可比或仍然模糊？”它能把常见的“时间线乱”拆成：

- 节点遗漏还是边遗漏；
- 时间表达有绝对值、相对函数还是只有DCT锚点；
- 两端在同句、相邻句、五句故事还是远距离位置；
- 边来自显式信号、传递推导、因果约束还是标注选择；
- 图只是局部完备、强连通，还是根本未检查窗口外关系；
- 关系是before/after/equal/overlap/contains、`VAGUE`还是跨轴暂缓；
- 意图、意见、假设与主轴事件是否被错误混放；
- 当前只知道起点，是否有人把未知终点和时长补写成确定区间。

该增量高于“列一张时间线”的常识方法，因为它为节点、必查边、缺边语义、局部完备性、多轴不可比、起点偏序、模糊关系和不利一致性数据提供原始来源；但它仍不产生长篇写作处方。

## K. 与其他理论的关系

- **与T042：** `relation_inference_vs_explicit_temporal_graph_representation_complement`；T042解释关系候选从何而来，T043解释怎样保存为可审计节点、边、轴和缺边状态。
- **与T030：** `discourse_relation_tree_vs_temporal_event_graph_boundary`；语篇关系树与时间事件图不能互相代替。
- **与T006：** `annotated_event_graph_vs_reader_event_model_update_boundary`；标注图不是读者在线更新证据。
- **与T024：** `local_temporal_graph_vs_semantic_macrostructure_boundary`；局部图不自动聚合为宏命题、弧或卷。
- **与T035：** `relationship_text_sequence_vs_temporal_graph_normalization_complement`；人物关系文本序可与局部事件时序并列但不能自动全局校正。
- **与T036：** `plotline_switch_topology_vs_event_temporal_graph_boundary`；情节线和语义时间轴不是同一对象。
- **与T037：** `local_sentence_graph_vs_scene_chapter_boundary_boundary`；时间边变化不充分决定场景/章界。
- **与T041：** `tense_deictic_center_vs_semantic_time_axis_complement`；语法时态/指示中心与事件语义轴须分开。
- **与QF-060：** `local_temporal_graph_vs_retardation_information_delay_gap`；T043仍不覆盖信息延迟、回叙/预叙和认知排序。

所有关系继续标为 `emergent_provisional_structure`。

## L. 最终状态

`mature`

理由：QF105-P1提供完整原始标注对象与关系规范；QF105-V1提供局部稠密图的正式边界、公开语料统计和直接不利一致性；QF105-V2提供完整五句故事上的时间—因果扩展、顺序反例和语义链接误差；QF105-C1提供针对强制单轴区间标注的明确修正、终点失败数据、专家/众包/模型对照和未解边界。成熟状态只属于“事件—时间表达分层、局部稠密图、五句故事跨句边、多轴同轴起点偏序及不确定性保存”，不扩展到完整文档图、时长/速度、频率、回叙/预叙、章卷时间线、中文网文、作者意图、自动改写、读者商业结果或作品质量。

当前结构标记：`emergent_provisional_structure`
