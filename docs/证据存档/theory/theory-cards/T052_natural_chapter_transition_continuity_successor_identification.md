# T052 自然章节转换的事件—焦点—地点—时间连续类型与长程后继辨识研究纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T052
- **候选ID：** QF-114
- **标准名称：** 自然章节转换的事件—焦点—地点—时间连续类型与长程后继辨识研究纲领
- **英文名称：** Natural Chapter-Transition Event, Focus, Location, Timeline-Continuity, and Long-Range Successor-Identification Research Program
- **核心作者：** Simeng Sun、Katherine Thai、Mohit Iyyer
- **独立竞争与边界作者：** Kalpesh Krishna、Yapei Chang、John Wieting、Mohit Iyyer；David Castillo-Bolado、Joseph Davidson、Finlay Gray、Marek Rosa
- **理论类型：** `validation_aware_natural_chapter_transition_annotation_and_successor_ranking_research_program`
- **学科来源：** computational narratology；long-document NLP；annotation studies；long-context evaluation
- **成熟状态：** `mature`

本档案成熟化的不是“最佳分章理论”，也不是章节写作公式。它把已经由作品版式或元数据声明的相邻章界当作给定对象，分别记录事件是否结束、焦点人物/视点是否变化、地点是否变化，以及时间线是连续、向前跳跃、倒叙还是回到先前章节时间。另一条任务支路在同一作品的六个章首候选中辨识真实下一章，用来检测长程文本与后继章的相容性。两条支路必须分开：转换标注不是章首排序成绩，排序正确也不证明时间标签或章节功能。

## B. 原始研究问题与对象

QF114-P1追问：只看token级困惑度会掩盖模型是否真正使用长程叙事信息，能否把自然章界变成更困难的后继辨识任务；AO3与PG-19中的章际转换又包含哪些事件、焦点、地点和时间变化。[QF114-P1, pp.3704-3707, Appendix A-B]

每个CHAPTERBREAK实例由最长8K token、恰在章界结束的前缀，一个真实下一章的128-token开头，以及同一作品未来五章的章首组成。负例章号被改成与真实章相同，减少直接读取章号的捷径。PG-19章界由以`chapter`开头的行匹配，AO3直接使用章节元数据。[QF114-P1, pp.3705-3706]

作者从AO3随机抽取300个章际转换，按事件、焦点人物/视点、地点和时间连续性四轴标注。时间连续性简化自Ireland 1986：不超过一夜为连续，向前跳跃超过一夜为非连续但仍按年代前进；倒叙回到更早事件；`parallel`则回到任一先前章节的时间，常伴焦点人物切换，并把alternate、parallel和simultaneous三类折叠。[QF114-P1, p.3706, Appendix B pp.3710-3711]

QF114-C1是独立的模型与评分竞争：RankGen只取256-token前缀，在同一CHAPTERBREAK单一可用split上用对比排序显著超过普通LM，同时词元重叠和PMI也暴露非叙事线索与评分函数的影响。[QF114-C1, Appendix C.4-C.6, pp.217-218]

QF114-C2是较弱但直接的不利复用：后续长时记忆基准作者手工筛选CHAPTERBREAK，只保留四例，称很多转换因人物、地点或时间完全切换而近乎无上下文解，并另行删除泄漏章号。其“约60%无解”没有给出抽样、复核或一致性，因此只能作为低等级筛查警报，不能当总体比例事实。[QF114-C2, p.4, Appendix A.11 pp.23-24]

## C. 核心机制与理论单位

1. **先固定已声明章界：** 输入必须是作品中真实存在的章序与章界；这里不预测哪里应该分章，也不判断该章界是否最佳。
2. **章际转换是多轴向量：** 同一章界可同时是事件延续、人物焦点改变、地点改变和时间连续；四轴不是互斥总标签。
3. **事件延续与换事件分开：** 前章事件结束/新事件开始与事件跨章继续形成二分，但没有给出事件身份的独立多标注者协议。
4. **焦点变化不是人物出现变化：** 记录视点或主要焦点人物是否改变，不把任意人物提及当成换焦点。
5. **地点变化是章两侧相对判断：** 只判断前缀与新章描述地点是否不同，不提供地点层级、移动路径或自然场景容器。
6. **时间连续阈值是方案约定：** `continuous`为章间不超过一夜，`discontinuous_chronological`为向前超过一夜；该阈值来自简化方案，不是自然时间真值。
7. **倒叙与并行分开：** `analepsis`回到较早事件；`parallel`回到任一先前章节时间并常换焦点，但后者折叠alternate/parallel/simultaneous，不能写成精确同步。
8. **后继辨识是条件排序：** 给定六个章首候选，比较哪个与前缀最相容；它不是自由生成，也不是恢复所有可能的合理下一章。
9. **同书负例提高难度也改变任务：** 同一作品的未来章首共享人物和稀有词，减少文体捷径；但候选构造仍可能让局部词元、章号或排序器训练目标产生捷径。
10. **上下文长度与建模目标分开：** P1的SuffixLM从256到8K明显提升，而若干token级LRLM几乎不提升；C1又在256-token设置用专门排序器取得更高结果。故“章界需要长程信息”只能作为任务总体趋势，不等于每例都需8K，也不等于长窗口自动有效。
11. **困惑度与后继兼容性分开：** P1中较低困惑度不保证较高章首辨识，C1中PMI又优于普通条件似然；模型比较必须保存评分函数。
12. **人类与标注可靠性是硬边界：** P1没有给300例的标注者数量、逐项一致性或裁决协议；《傲慢与偏见》67%连续与Ireland的72%只是分布接近，不是同一项目级标签一致。
13. **不可预测章首不等于叙事失败：** 作者可能故意让转换出人意料；没有人类上限时，模型错误不能直接解释为文本不连贯。
14. **数据清洗属于效度链：** 章号、作者注、元评论、候选来源和“近乎无解”实例都应留痕；后续四例筛选只说明风险，不验证整个数据集的60%比例。

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T052-P01 | 任务以前缀、真实下一章首和同书五个未来章首构成六选一 | QF114-P1 pp.3705-3706 | 核心任务定义 | 候选排序而非自由生成 |
| T052-P02 | AO3有7355例/1202作，PG-19有241例/17作 | QF114-P1 pp.3705,3710 | 直接数据规模 | PG-19极小且提取规则不同 |
| T052-P03 | AO3长篇平均约41513词、21.5章，最低10000词且超过10章 | QF114-P1 Appendix A pp.3710 | 长篇材料范围 | 同人写作与英语平台偏差 |
| T052-P04 | 300个随机AO3章际转换按四轴标注 | QF114-P1 p.3706 | 直接人工标注 | 无标注者数与IAA |
| T052-P05 | 事件换新/继续为76%/24% | QF114-P1 Table 1 | 直接分布 | 只代表抽样AO3 |
| T052-P06 | 焦点/视点改变为36%，地点改变为68% | QF114-P1 Table 1 | 直接分布 | 没有逐类可靠性 |
| T052-P07 | 时间连续62%、向前不连续29%、倒叙2%、并行6% | QF114-P1 Table 1 | 直接分布 | 四舍五入且方案折叠 |
| T052-P08 | 连续/向前不连续以一夜为约定阈值 | QF114-P1 Appendix B | 直接操作定义 | 不是自然章时间区间 |
| T052-P09 | parallel回到任一先前章时间并折叠三类phase | QF114-P1 Appendix B | 直接类型机制 | 不证明严格同时 |
| T052-P10 | 《傲慢与偏见》连续章转67%，Ireland报告72% | QF114-P1 p.3706 n.8 | 有限分布校验 | 非同项复标或IAA |
| T052-P11 | P1没有报告300例的标注者数量或一致性 | QF114-P1全文与Appendix B | 直接报告缺失 | 不能称强金标 |
| T052-P12 | LT/RT/BigBird/GPT-2/3约22%-36%，SuffixLM为PG19 52%、AO3 41% | QF114-P1 Table 2 | 直接模型结果 | 架构、训练域与长度不同 |
| T052-P13 | AO3 SuffixLM从256到8K约31%升至46%，RT只升约1.4% | QF114-P1 pp.3707,3713-3714 | 长度趋势 | 不说明每例都依全局上下文 |
| T052-P14 | 256-token下cause/dialogue超过80%，章界明显更低 | QF114-P1 pp.3707-3708 | 边界对照 | cause/dialogue由字符串规则构造 |
| T052-P15 | 困惑度与章首辨识不单调对应 | QF114-P1 p.3707 | 指标修正 | 模型tokenizer与归一化仍不同 |
| T052-P16 | 同书负例比跨书负例更难 | QF114-P1 Appendix F | 负例设计验证 | 同书稀有词仍可能形成捷径 |
| T052-P17 | 全部模型共同错的89例中，74%换事件、64%换地点、62%时间连续 | QF114-P1 Appendix I | 直接错误分布 | 这是错误子集组成，不是条件错误率 |
| T052-P18 | 人类在不同前缀长度上的成绩被明确留给未来 | QF114-P1 pp.3707-3708 | 核心效度缺口 | 不存在已知人类上限 |
| T052-C01 | RankGen只用256-token前缀且数据没有验证/测试拆分 | QF114-C1 Appendix C.4 | 独立任务修正 | 与P1 8K曲线不可直接等同 |
| T052-C02 | 词元重叠在PG19/AO3为37.3%/28.7% | QF114-C1 Table 14 | 直接捷径基线 | 高于随机不等于叙事理解 |
| T052-C03 | PG-INBOOK RankGen在PG19/AO3为64.3%/39.5% | QF114-C1 Table 14 | 独立竞争结果 | 模型直接训练同书负例目标 |
| T052-C04 | PG19上PMI 38.2%，普通平均条件似然20.3% | QF114-C1 Table 15 | 评分函数修正 | 单一模型与短前缀 |
| T052-C05 | 排序器需过生成/候选集并继承候选偏差 | QF114-C1 Limitations pp.208 | 独立部署边界 | 不构成自动章节生成器 |
| T052-D01 | 后续基准手工只保留四个可解样本 | QF114-C2 p.4, Appendix A.11 | 直接不利复用 | 极小选择样本 |
| T052-D02 | 人物、地点或时代完全切换可令候选缺少上下文线索 | QF114-C2 Appendix A.11 | 直接效度警报 | 未量化可解性的判断标准 |
| T052-D03 | 后续基准发现并删除候选章号泄漏 | QF114-C2 Appendix A.11 | 直接清洗警报 | 不证明P1所有版本都有泄漏 |
| T052-D04 | “约60%无解”无抽样、复核或IAA支撑 | QF114-C2 p.4及方法 | 低置信度不利声明 | 不登记为总体事实 |

## E. 来源身份与实际读取深度

### QF114-P1

- **身份：** Simeng Sun、Katherine Thai、Mohit Iyyer，2022，*CHAPTERBREAK: A Challenge Dataset for Long-Range Language Models*，NAACL-HLT pp.3704-3714，DOI `10.18653/v1/2022.naacl-main.271`，ACL Anthology VOR。
- **实际读取：** 全文11页，覆盖任务、PG-19/AO3构造、300例四轴标注、模型、结果、限制、结论及Appendix A-I。
- **作用：** 核心自然章际转换标注和长程后继辨识研究对象。
- **SHA-256：** `D53105893B9303A248CB5AE6B322FD20A5B5C325AF1E1C9D124296CF0E1686F0`。

### QF114-C1

- **身份：** Kalpesh Krishna、Yapei Chang、John Wieting、Mohit Iyyer，2022，*RankGen: Improving Text Generation with Large Ranking Models*，EMNLP pp.199-232，DOI `10.18653/v1/2022.emnlp-main.15`，ACL Anthology VOR。
- **实际读取：** 全文结构核验并深读ChapterBreak相关Appendix C.4-C.6、Tables 14-15、核心对比学习方法和Limitations。
- **作用：** 独立排序目标、短前缀、评分函数和候选偏差修正。
- **SHA-256：** `B3B77A8BC4F5284A93F5DDB1BBB582D8CDF9B982C111F6E27634A5796DAD763F`。

### QF114-C2

- **身份：** David Castillo-Bolado、Joseph Davidson、Finlay Gray、Marek Rosa，2024，*Beyond Prompts: Dynamic Conversational Benchmarking of Large Language Models*，NeurIPS 2024 Datasets and Benchmarks Track，38页官方VOR。
- **实际读取：** 全文结构核验并深读测试设计、ChapterBreak条目、Appendix A.11、整体限制与详细结果。
- **作用：** 数据可解性、手工筛查和章号泄漏的后续不利边界。
- **SHA-256：** `74CEED38B137207E29778828EED91D596D4F3010F2D2107452C8100F70E78CF1`。

## F. 原始适用范围与文本尺度

- **材料：** AO3英语同人长篇、PG-19公共领域英语书籍；后续模型与长时记忆基准。
- **直接单位：** 已声明章界、前章末尾长前缀、下一章首、同书未来章首、相邻章的事件/焦点/地点/时间转换。
- **直接问题：** 章际转换分类、同书章首六选一、上下文长度/评分函数/负例构造影响、错误分布和数据清洗。
- **没有直接测量：** 每章完整故事时间区间、场景时间真值、卷/part时间边界、跨卷多线同步、作者分章意图、最佳章长、中文网文发布、真实读者悬念/追读/留存/付费或作品质量。

| 文本对象 | 覆盖 | 可观察证据 | 限制 |
| --- | --- | --- | --- |
| declared_chapter_boundary | directly_assumed | PG-19 chapter行或AO3元数据 | 不预测最佳章界 |
| adjacent_chapter_pair | directly_studied | 前缀与下一章128-token开头 | 不是完整两章时间区间 |
| event_transition | directly_annotated | 换事件/延续 | 无事件身份IAA |
| actor_focus_transition | directly_annotated | 视点/焦点人物变化 | 不等于任意人物变化 |
| location_transition | directly_annotated | 章两侧地点同异 | 无地点层级或路径 |
| timeline_continuity | directly_annotated | 连续、向前不连续、倒叙、并行 | 一夜阈值与折叠类别 |
| chapter_successor_candidate_set | directly_studied | 一真五负、同书未来章首 | 选择任务而非生成 |
| whole_work_chapter_sequence | partially_used | 未来章首和最多8K前缀 | 不恢复整部故事年代 |
| natural_chapter_interval | none | 无 | 没有每章fabula起止 |
| volume_cross_volume | none | 无 | 无卷界、多线持续或会合 |

## G. 边界与不适用条件

1. 不把`natural chapter transition`写成自然、唯一或最佳分章；它只表示作品中已声明的章界。
2. 不把四轴分布外推为所有小说、中文网文或作者应该采用的比例。
3. 不把“一夜”阈值写成叙事自然法则，也不从连续/不连续标签恢复精确起止。
4. 不把`parallel`写成严格同时；P1明确折叠alternate、parallel和simultaneous。
5. 不把《傲慢与偏见》67%与Ireland 72%写成标注一致性。
6. 不隐藏300例缺少标注者数量、IAA和裁决协议。
7. 不把SuffixLM、RankGen或任一LRLM成绩写成人类阅读能力、作者意图或作品连贯质量。
8. 不把错误子集中的74%/64%/62%写成各类别条件错误率。
9. 不把更长前缀带来的平均增益写成每个章界都需要8K；C1的256-token排序器构成直接修正。
10. 不把词元重叠、章号或同书实体捷径写成叙事理解。
11. 不把C2“约60%无解”写成可靠总体比例；它没有报告验证链。
12. 不从章际转换自动推出场景、事件弧、卷、整部宏结构或多线同步。
13. 不生成换视点、换地点、倒叙、悬念或断章处方，不自动重排章节或改写文本。
14. 未经用户批准，不分析小说文本或启动真实文本试验。

## H. 批评、竞争和修正

P1的直接增量在于真正使用已经存在的长篇章界，并把相邻章转换拆成四轴，而不是用固定窗口、等词数分段或人工时间图替代章节。AO3规模也显著大于单书案例。其最强负面证据同样来自自身：300例没有标注者数量与IAA；时间连续只用一夜阈值；parallel折叠三类；人类后继辨识被留作未来；作者承认有些章首本来就应当不可预测。

C1改变了“低成绩必由缺少8K长程理解造成”的单因解释。只取256-token前缀时，专门以同书负例训练的RankGen在PG-19达到64.3%，AO3为39.5%；简单词元重叠也高于随机，PMI又显著超过普通条件似然。该结果证明模型目标、评分函数、训练负例和局部线索共同决定成绩。它没有否认长程信息有用，因为P1的SuffixLM随长度增长明显；它只禁止把窗口长度当唯一机制。

C2提供更尖锐但证据较弱的后续效度警报：一些章首因人物、地点或时代完全切换而几乎没有唯一上下文线索，候选还可能泄漏章号。由于作者只保留四例，且“约60%无解”没有来源方法，这一声明只能触发数据审核，不能推翻或重估P1全部结果。

相对T037，T052不再寻找章界，而是假定章界后标注两侧转换；相对T051，T052提供自然章际时间类型但没有四端点或每章区间；相对T036，它只把回到先前章时间标成粗`parallel`，没有支线身份、跨卷持续、会合或同步机制。因此该候选有真实净增量但没有关闭原队列的全部自然章卷与多线残余。

## I. 与本项目的有限转译

- **theory_directly_supports：** 对已声明相邻章界建立“事件延续/换新—焦点同/变—地点同/变—时间连续/向前跳跃/倒叙/并行”向量；对每个后继辨识结果保存候选集、前缀长度、评分函数、训练负例和清洗状态。
- **independent_correction_supports：** 把长程上下文、局部词元、候选构造、排序训练、评分函数与不可预测性分栏；缺IAA时标`annotation_reliability_unreported`。
- **project_translation：** 只有用户批准具体文本后，才逐章记录声明章界和四轴候选，保留多标签、证据句、分歧与未知；不得修改生产文本。
- **project_hypothesis：** 中文网文的发布章、卷名、平台元数据、章号泄漏和连载间隔可能改变任务，需独立中文语料与标注者可靠性。
- **not_supported：** 每章应该换事件/换地点；连续章更好；并行章更有悬念；固定一夜阈值适用于中文；模型可自动分卷、提高追读或保证质量。

## J. 实际诊断价值

T052适合处理：“这两个已经存在的相邻章节之间，究竟是事件继续但换地点，还是换人物却回到先前时间线；我们为什么会把不同变化混成一次‘大转场’？”诊断时先锁定真实章界，再分别找四轴证据；`parallel`必须继续问是alternate、parallel还是simultaneous，证据不足就保留折叠标签。若使用模型，只能报告在给定候选集中的相容性，并同时列出前缀长度、负例来源、章号/元数据清洗和评分函数。

它相对普通“换时间地点就换章”的常识增量在于：同一章界可以事件继续、焦点改变、地点改变而时间仍连续；也可以事件换新却保持同一地点。它还给出直接的AO3分布、后继辨识失败、评分修正和不可解实例边界。但它不能回答该章界是否应该存在、每章完整时间跨度、跨卷多线如何同步或怎样写出更好的断章。

## K. 与其他理论的关系

- **与T037：** `declared_boundary_detection_vs_post_boundary_transition_vector`；T037决定章/场/主题边界竞争，T052只在真实章界后标注转换。
- **与T051：** `chapter_transition_class_vs_four_endpoint_time_map_complement`；T052给章际粗时间类，T051给解释性跨度坐标，二者都没有自然卷同步。
- **与T048：** `published_chapter_order_vs_next_chapter_compatibility_boundary`；原章序和相邻后继任务不等于故事年代。
- **与T036：** `parallel_transition_label_vs_multiplot_coordination_boundary`；粗parallel标签不能替代支线身份、状态依赖和会合。
- **与T044：** `model_successor_ranking_vs_reader_chronology_reconstruction_boundary`；模型选择章首不等于读者重建事件顺序。
- **与T006：** `declared_chapter_transition_vs_reader_event_boundary`；格式章界和读者在线事件更新可以错开。
- **与T043：** `chapter_level_coarse_continuity_vs_local_temporal_graph_boundary`；四类章际标签不提供事件对稠密边或多轴偏序。
- **与T013：** `single_work_chapter_transition_vs_volume_series_form_boundary`；AO3多章不等于卷或系列结构。
- **与T024：** `transition_vector_vs_semantic_macrostructure_boundary`；换事件/焦点/地点/时间不自动产生宏命题或情节弧。
- **与T029：** `chapter_successor_compatibility_vs_reader_navigation_memory_boundary`；章首可辨识不证明真实设备上的回看和位置记忆。

以上关系均为 `emergent_provisional_structure`，不构成固定理论层级。

## L. 最终状态

`mature`

成熟理由：QF114-P1为NAACL同行评审开放VOR，全文读取后能直接冻结已声明自然章界、四轴转换、简化时间连续类型、长程候选构造、数据规模、模型结果、错误分布和人类评估缺口；QF114-C1由独立后续同行评审论文以短前缀、对比排序、词元重叠和PMI修正“只由长上下文决定”的解释；QF114-C2虽只有四例且关键比例缺验证，仍以低证据等级提供不可解样本和章号泄漏警报。成熟对象严格限于“已声明相邻章节的多轴转换与给定候选后继辨识”，不属于自然章区间、卷/part、跨卷多线同步、不可单轴故事世界替代、中文网文、自动写作、真实读者商业结果或质量。
