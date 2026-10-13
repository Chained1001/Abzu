# T051 多尺度fabula—syuzhet时间图、叙事时间体与双端省略空隙研究纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T051
- **候选ID：** QF-113
- **标准名称：** 多尺度fabula—syuzhet时间图、叙事时间体与双端省略空隙研究纲领
- **英文名称：** Multiscale Fabula-Syuzhet Time Maps, Narratological Chronotopes, and Dual-Ended Ellipsis-Gap Research Program
- **核心作者：** Sean A. Yeager
- **独立前驱、竞争与边界来源：** Nam Wook Kim等；Jan Christoph Meister；Steven Willemsen与Miklos Kiss；Edward Kearns
- **理论类型：** `validation_aware_manual_multiscale_fabula_syuzhet_time_map_research_program`
- **学科来源：** narratology；digital humanities；visualization；annotation studies；cognitive narrative studies
- **成熟状态：** `mature`

本档案成熟化的是一种有边界的人工研究纲领，不是Genette完整叙事时间理论，也不是自动时间线系统。其最小理论单位是一个由文本出现起止与故事时间起止共同确定的`narratological_chronotope`（NC）。成熟结论只涉及NC、绝对/相对时间算子、多尺度图、相邻NC之间的双端空隙、同一文本跨度的多重时间定位，以及这套表示的选择、可靠性和不可图示边界。

## B. 原始研究问题与实际研究对象

QF113-P1追问：Genette用字母和数字记录fabula—syuzhet顺序时，如何避免把一分钟和一年都压成单点；怎样把每个入选单位在文本中的起止与故事时间中的起止写成四个数；同一叙事为何需要多种尺度的图；ellipsis如何作为两个已叙述跨度之间的可见空隙出现。[QF113-P1, pp.1-11]

P1的实际核心材料是*Rashomon*与*Mrs. Dalloway*。前者展示嵌套层、重复版本和人为跨日尺度；后者同时展示约三十年全图和单日放大图，并在单日图中定位约07:00至11:00的空隙。[QF113-P1, pp.12-16]

QF113-V1是独立前驱：它把10部非线性电影的脚本场景按叙述序横排、故事序纵排，并用13人实验检验已建曲线是否可读；它没有检验10片年代顺序的正确性，也不编码真实时间距离。[QF113-V1, article pp.1-10]

QF113-C1提供竞争标注框架：文本C序、事件B序和读者A序分开；时间算子保存绝对/相对、粒度、关系、引用锚、用户、版本和重叠多解。但TempusParser和3D图在论文时仍属开发目标。[QF113-C1, pp.107-122]

QF113-C2提供认知和对象边界：非线性叙述顺序与非线性故事世界必须分开。时间环、平行世界、重复人物和多个指示中心可能使单一fabula轴根本无法成立；空间化时间线促进理解仍是由既有心理研究和电影案例推导的假说，不是本文直接实验。[QF113-C2, pp.172-193]

复用QF111-C1作为独立不利可靠性：跨句、段、章的时间中断跨度可以嵌套，但主体语料单人标注，SANTA `gamma=.24`，频次与覆盖还会给出不同结论。[QF111-C1, pp.72-77]

## C. 核心机制与理论单位

1. **文本顺序与故事时间先分栏：** 横轴记录syuzhet位置，纵轴记录fabula位置。横轴可用页码、词数、字符或影片时刻近似；这些都是版本和媒介相关测量，不是自然叙事单位。[QF113-P1, pp.1-4]
2. **单点升级为四端点：** 每个NC保存`sni`、`fni`、`snf`、`fnf`。横向长度是被叙述跨度，纵向变化是故事时间跨度；N个清楚单位至少需要4N项主数据。[QF113-P1, pp.4-5]
3. **定量值必须有定性支架：** 每行同时保存摘要、潜在时间算子、原文位置和Decisions；被舍弃的算子另列`omitted_temporal_operator`，不能让图中缺失冒充文本不存在。[QF113-P1, pp.5,10-11]
4. **绝对与相对时间算子分开：** 日期、钟点或有日期的世界事件可提供数值锚；before/after/between、衣着延续、因果和上下文通常只给关系约束，未必足以确定唯一坐标。[QF113-P1, pp.10-11]
5. **同一文本跨度可有多个NC：** 回忆内容可落在过去，回忆行为又发生在当前；两条线段可堆叠于同一syuzhet跨度。是否双计存在理论竞争，故需保存表示理由。[QF113-P1, p.6]
6. **斜率只在同一尺度内解释：** pause、stretch、scene、summary分别对应不同F/S关系；理想角度经常因时长不可知而无法严格实现，不得把图形近似写成精确速度。[QF113-P1, pp.7-9]
7. **ellipsis是缺失而非实体：** 两个横向相邻NC若`fnf`与下一`fni`不连续，其纵向空隙构成有双端锚的未叙述间隔。空隙可定位和估长，不包含其中事件、人物状态或因果。[QF113-P1, p.8]
8. **每种时间尺度另作图：** 三十年全图会把24小时压平；单日放大图才能显出上午空隙和午餐段。跨尺度图互补，不能直接比较角度、距离或密度。[QF113-P1, pp.13-15]
9. **多时间线与重复版本可用不同错位描述：** Rashomon中纵向错位表现嵌套时间层，横向错位表现同一fabula区间的互斥重述；这只是有界个案表示，不是一般多情节同步算法。[QF113-P1, pp.12-13]
10. **大结构与细坐标分开：** Rashomon把一天任意设为100、局部片段设为个位数。大层级可能不受小误差影响，但细节时长不因此成为真值。[QF113-P1, pp.12-13]
11. **图的可读性与图的正确性分开：** Story Curves的13人实验支持非专家在短训练后读取既成图形；它没有验证作者人工恢复的10片故事顺序，也没有证明小说读者自发形成同一图。[QF113-V1, article pp.6-10]
12. **标注身份和歧义必须保留：** Meister的版本、用户、引用锚和重叠多解字段说明时间标注可以不唯一；Yeager的Decisions和Omitted TO承担相近功能。[QF113-C1, pp.116-118; QF113-P1, pp.5,7]
13. **单轴适用性先行检查：** 非线性storytelling仍可尝试重排为线性fabula；时间环、平行世界、重复人物和层级越界属于nonlinear storyworld，可能需要多个轴、图或拒绝单轴。[QF113-C2, pp.172-193]
14. **人工核验是当前硬边界：** 文学隐喻、模糊矛盾算子和大话语单位阻碍通用解析；Meister算法未完成，Yeager明确要求多轮人工阅读，Kearns低一致性又限制端点金标强度。[QF113-P1, pp.5-6,9-10; QF113-C1, pp.116-122; QF111-C1, p.74]

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T051-P01 | 时间图把fabula与syuzhet绘在同一平面 | QF113-P1 pp.1-2 | 核心定义 | 区分为启发式 |
| T051-P02 | 同一叙事需要多尺度图 | QF113-P1 p.2 n.3 | 尺度原则 | 非单图全知 |
| T051-P03 | ellipsis使严格连续年代断裂 | QF113-P1 pp.2-3 | 省略重释 | 不恢复内容 |
| T051-P04 | NC由四端点确定 | QF113-P1 p.4 | 核心机制 | 端点依解释 |
| T051-P05 | N单位至少4N主数据 | QF113-P1 pp.4-5 | 数据模型 | 只限入选单位 |
| T051-P06 | 页码/词数有粒度和版本边界 | QF113-P1 p.4 n.7 | 测量边界 | 非自然单位 |
| T051-P07 | 四端点需摘要、TO和Decisions | QF113-P1 p.5 | 溯源规则 | 补充表当前不可得 |
| T051-P08 | 隐喻和大话语要求人工核验 | QF113-P1 pp.5-6 | 自动化边界 | 非绝对不可能 |
| T051-P09 | 同一syuzhet跨度可堆叠多个NC | QF113-P1 p.6 | 多重定位 | 双计有理论争议 |
| T051-P10 | 四类被叙述运动可由F/S斜率区分 | QF113-P1 pp.7-8 | 类型机制 | 理想角度难实现 |
| T051-P11 | ellipsis是相邻NC间纵向空隙 | QF113-P1 p.8 | 双端空隙 | 无空隙内容 |
| T051-P12 | 无TO的achrony不可强定位 | QF113-P1 p.9 | 不可图示边界 | catchall仍待修正 |
| T051-P13 | 数据需多轮阅读和纳入决定 | QF113-P1 pp.9-10 | 采集协议 | 单人复读非IAA |
| T051-P14 | 清楚时空标记是语料选择条件 | QF113-P1 p.9 | 选择偏差 | 模糊文本代表性不足 |
| T051-P15 | 绝对与相对TO功能不同 | QF113-P1 pp.10-11 | 线索类型 | 相对约束未必唯一 |
| T051-P16 | 低细节TO和迭代事件可被排除 | QF113-P1 p.11 | 纳入边界 | 图中缺失非文本缺失 |
| T051-P17 | 另有2865行数据但正文只析两例 | QF113-P1 p.2 n.4 | 语料声明 | 当前不可独立复算 |
| T051-P18 | 标注者图可不同而大结构或稳定 | QF113-P1 p.7 n.12 | 间接边界 | 未发表且无数值 |
| T051-P19 | Rashomon以纵/横错位区分多线与复述 | QF113-P1 pp.12-13 | 有界案例 | 非一般同步模型 |
| T051-P20 | Rashomon日/片段尺度为人为近似 | QF113-P1 pp.12-13 | 关键不利结果 | 细坐标非真值 |
| T051-P21 | Mrs. Dalloway全图压平单日 | QF113-P1 pp.13-14 | 长篇多尺度案例 | 必须另作放大 |
| T051-P22 | 单日图显出07:00—11:00空隙 | QF113-P1 p.15 | 双端小说案例 | R2不验证全图 |
| T051-P23 | 本文只奠定方法且模式非穷尽 | QF113-P1 p.16 | 范围声明 | 非完整时间理论 |
| T051-V01 | Story Curves按叙述序/故事序双轴画场景 | QF113-V1 pp.1-2 | 独立前驱 | 故事轴为序位 |
| T051-V02 | 脚本scene由时间地点slugline操作化 | QF113-V1 pp.1,4-5 | 场景单位 | 不等于小说场景 |
| T051-V03 | 横向长度可用字数或统一 | QF113-V1 pp.4-5 | 代理边界 | 非真实时距 |
| T051-V04 | 10片人工重排每部约30-60分钟 | QF113-V1 p.6 | 人工成本 | 无年代IAA |
| T051-V05 | 样本为10部选择性非线性电影 | QF113-V1 pp.6-7 | 语料范围 | 无总体频率 |
| T051-V06 | 图形组合产生探索性全局模式 | QF113-V1 pp.6-7 | 模式发现 | 无独立编码 |
| T051-V07 | 专家反馈偏修订/分析而非初稿 | QF113-V1 pp.7-8 | 非正式用途 | 非生产实验 |
| T051-V08 | 13人读图20题平均80% | QF113-V1 pp.8-9 | 可读性结果 | 小样本且非真值 |
| T051-V09 | 年代排序难于画图且有回叙混淆 | QF113-V1 pp.8-9 | 不利结果 | 排序仍困难 |
| T051-V10 | 实验未验证10片故事序正确性 | QF113-V1 pp.6,8-9 | 评价目标边界 | 80%不能作IAA |
| T051-V11 | 几十年距离与频率/时长未准确编码 | QF113-V1 p.9 | 指标边界 | Yeager的直接增量 |
| T051-V12 | 小说、分支和时间环仅为未来扩展 | QF113-V1 p.9 | 外推边界 | 未证明长篇适用 |
| T051-M01 | C/B/A分别表示文本、事件、体验序 | QF113-C1 pp.107-114 | 竞争模型 | 非经验读者验证 |
| T051-M02 | TO可含绝对/相对、粒度和引用锚 | QF113-C1 pp.112-118 | 标注框架 | 非完成语料 |
| T051-M03 | 时态和段章形式可候选A-operator | QF113-C1 pp.113-114 | 形式扩展 | 非自动可靠边界 |
| T051-M04 | 标签保留字符位置、版本、用户和多解 | QF113-C1 pp.116-118 | 溯源与歧义 | 优于单值强定 |
| T051-M05 | 隐喻必须人工处理 | QF113-C1 p.116 | 人工边界 | 非通用自动系统 |
| T051-M06 | TempusParser仍在开发 | QF113-C1 pp.119-120 | 未完成结果 | 无准确率 |
| T051-M07 | 跨文本比较依赖可客观化假设 | QF113-C1 p.119 | 前提边界 | 目标非结果 |
| T051-M08 | rock-face实验未完成且图有暗示风险 | QF113-C1 pp.120-122 | 可视化不利 | 需保留原文表 |
| T051-C01 | nonlinear storytelling与storyworld不同 | QF113-C2 pp.172-175 | 独立对象修正 | 两类可共现 |
| T051-C02 | 前者重排，后者需非线性世界模型 | QF113-C2 pp.176-178 | 任务边界 | 不同认知问题 |
| T051-C03 | 时间环可破坏事件索引和指示中心 | QF113-C2 pp.178-181 | 单轴失败 | fabula未必单一 |
| T051-C04 | 空间图式/mental timeline为认知假说 | QF113-C2 pp.182-185 | 理论假说 | 非本文实验 |
| T051-C05 | Inception需多层不同速率表示 | QF113-C2 pp.185-188 | 多速率案例 | 非长篇同步算法 |
| T051-C06 | 图可能作全局模板和记忆外置 | QF113-C2 pp.188-191 | 功能假说 | 无有图/无图对照 |
| T051-C07 | 导演/观众图是案例趋同 | QF113-C2 pp.185-192 | 案例链 | 不证明共同内图 |
| T051-C08 | metalepsis可破坏容器inside/outside | QF113-C2 pp.192-193 | 层级失败 | 不强定唯一层 |
| T051-C09 | 电影到文学迁移只是媒介中性假设 | QF113-C2 pp.173-174,193 | 媒介边界 | 中文网文未验证 |
| T051-K01 | 独立中断跨度可跨章并嵌套 | QF111-C1 pp.73-74 | 复用竞争修正 | 边界仍解释性 |
| T051-K02 | 主体单标且gamma=.24 | QF111-C1 p.74 | 关键可靠性不利 | 非强金标 |
| T051-K03 | 次数与覆盖跨度不可互换 | QF111-C1 pp.74-76 | 指标修正 | 不只数跳跃 |

## E. 来源身份与实际读取深度

### QF113-P1

- **身份：** Sean A. Yeager，2023，*Time Maps: Theory and Method*，*Journal of Cultural Analytics* 8(3)，DOI `10.22148/001c.87937`，CC BY 4.0 VOR。
- **实际读取：** 全文21页，完整覆盖四端点方法、粒度、多尺度、NC、时间算子、采集流程、Rashomon与Mrs. Dalloway案例、限制、结论和参考文献。
- **作用：** 核心理论、方法与长篇案例；直接提供双端省略空隙和多尺度年代图。
- **SHA-256：** `8CCE2513EE4B1113D1F845D939E1B3893A3B93FC9945B2337925F65DF737788E`。

### QF113-V1

- **身份：** Nam Wook Kim等，2018，*Visualizing Nonlinear Narratives with Story Curves*，*IEEE TVCG* 24(1):595-604，DOI `10.1109/TVCG.2017.2744118`，爱丁堡Pure公开同行评审版本。
- **实际读取：** 机构封面加完整正文10页，覆盖设计、解析、人工重排、10片模式、专家反馈、13人实验、讨论和限制。
- **作用：** 独立前驱和可视化验证；把图形可读性与年代标注正确性分开。
- **SHA-256：** `A7FF19C7E343B5E655D1F2C483BD1EFDEE46B08BBB0D290FF200F1FA4BB479D4`。

### QF113-C1

- **身份：** Jan Christoph Meister，2005，*Tagging Time in Prolog: The Temporality Effect Project*，*Literary and Linguistic Computing* 20 Supplement:107-124，DOI `10.1093/llc/fqi025`，法兰克福机构库出版社PDF。
- **实际读取：** printed pp.107-124全文，覆盖A/B/C线、时间算子、TempusMarker字段、多用户多解、拟议Prolog算法、3D图和结论。
- **作用：** 竞争标注框架和自动化失败边界。
- **SHA-256：** `CD588C6524CE3B890490976B5AF53C6F45E1BEA8FF144502EE870CFC843F8DDE`。

### QF113-C2

- **身份：** Steven Willemsen与Miklos Kiss，2020，*Keeping Track of Time*，*Style* 54(2):172-198，DOI `10.5325/style.54.2.0172`，Groningen机构库VOR。
- **实际读取：** published pp.172-198全文，覆盖两类非线性、理解机制、事件索引、指示中心、CMT/MTL、Inception和时间环案例、结论与注释。
- **作用：** 单一fabula轴的对象边界及空间化解释的证据强度修正。
- **SHA-256：** `CC46D8A9458B28BA16DACC254E727608C43B833398E9712DAC300958B5FF9C0F`。

### QF111-C1（复用）

- **身份：** Edward Kearns，2020，*Annotating and Quantifying Narrative Time Disruptions in Modernist and Hypertext Fiction*，NUSE pp.72-77，DOI `10.18653/v1/2020.nuse-1.9`。
- **实际读取：** 已在T049完整读取并登记；本档案只复用跨章跨度、`gamma=.24`和频次—覆盖分离三项直接结果。
- **作用：** 独立竞争操作化和不利可靠性边界，不冒充Time Maps直接复制。
- **SHA-256：** `7DDB63AB66C56BEEC07CE16B3085B77ACC264D93B37A88E05C5CA33E16F734F4`。

发现阶段另完整读取Mani与Pustejovsky 2004、Gangal等2022 NAREOR。前者只有短文本时间包含树且标注刚开始，后者只重排五句ROCStories；二者相对T043/T047/T050或当前缺口无足够净增量，未登记为T051来源，也没有据此扩充成熟主张。

## F. 原义、项目转译与不受支持项

- **theory_directly_supports：** 用四端点表示被叙述跨度；按尺度建立多张fabula—syuzhet图；保存绝对/相对时间算子、Decisions与Omitted TO；把ellipsis表示为横向相邻NC之间的纵向空隙；允许同一syuzhet跨度多重时间定位。
- **independent_prior_validation：** Story Curves独立实现整部电影双序轴，并以13人实验验证既成图形可被读取；它不验证年代真值。
- **independent_competing_annotation：** Meister的A/B/C线和多用户重叠标注说明端点与解释应带来源、版本和多解；其解析器未完成。
- **independent_object_boundary：** Willemsen与Kiss说明nonlinear storyworld可使单一年代轴、实体身份或容器层失效；其空间化认知解释仍是假说。
- **independent_adverse_reliability：** Kearns主体单标且`gamma=.24`；Yeager无定量IAA，Rashomon局部尺度人为，补充表当前不可得。
- **project_translation：** 未来只有用户批准具体文本后，才可建立“原文跨度—时间算子—四端点候选—尺度—Decisions—Omitted TO—竞争图—确定性”表。
- **project_hypothesis：** 中文长篇是否能以章节、场景或发布单元形成稳定时间图，必须另做中文标注、版本控制和跨标注者研究。
- **not_supported：** 自动恢复唯一时间线；补写省略内容；页码或章节就是自然时间单位；把时间环压成单轴；按图形斜率评分节奏；按空隙大小自动增删文本；推出悬念、追读、留存、付费、商业成功或作品质量。

## G. 文本尺度覆盖

- **directly_studied：** `temporal_operator`、`character_or_word_span`、`page_span`、`screen_time_span`、`script_scene`、`narratological_chronotope`、`dual_ended_ellipsis_gap`、`full_day_timeline`、`whole_novel_multidecade_map`、`multiscale_map_pair`、`parallel_timeline_candidate`、`repeated_version`、`whole_movie`、`whole_novel`。
- **reasonable_extension：** 对时间算子充分、版本稳定的长文本，建立多个尺度的候选时间图，并把直接锚、关系锚、解释估值、舍弃线索和不可定位单位分栏。
- **project_hypothesis：** 现代中文长篇中的场景—章—卷跨尺度时间图及跨发布版本校准。
- **not_supported：** 自然章/卷时间真值、省略内容、跨卷多线同步、时间环单轴、中文网文普遍规律、读者商业结果或质量。

## H. 批评、竞争和修正

1. T051相对T044的增量是外部物化的全篇跨度图；T044测试读者有限重建。两者不能互相冒充。
2. T051相对T048直接使用fabula跨度并可跨年；T048的24小时时刻概率和出版章序不是故事年代。T051也没有继承T048的大规模自动数据优势。
3. T051相对T049把局部计入的ellipsis变成有双端的空隙；但它仍不能恢复空隙内容，且次数、覆盖、端点和时长必须分开。
4. T051相对T050记录四端点跨度；T050记录锚—成员包容与闭包。时间体线段不自动给成员关系，容器闭包也不自动给空隙。
5. Yeager的四端点提高Story Curves只有ordinal故事序的分辨率，但代价是数百小时人工解释、尺度换算和单位选择。
6. Story Curves 80%只证明预制图形的有限可读性。10片年代序无IAA，13事件练习也不等于完整影片或小说年代金标。
7. Meister允许重叠多解是重要修正，但TempusParser、自动排序和3D图没有完成结果，不能充当自动化验证。
8. Yeager的Decisions与Omitted TO应当作为必需证据，不是附属备注；当前文章页面未提供所称补充数据，故2865行语料只作中等强度范围声明。
9. Rashomon的`day=100`与局部个位数说明跨尺度几何可以保留大轮廓，却不能把细坐标、斜率或距离写成精确时长。
10. Mrs. Dalloway单日图提供直接双端空隙与长篇实例，但一部英语小说、单标注者和页码近似不能证明中文网文或所有长篇。
11. Willemsen与Kiss把nonlinear storytelling和nonlinear storyworld分开。时间环、平行世界、重复人物或metalepsis命中时，T051必须输出`single_fabula_axis_inapplicable`，不能强行排序。
12. Kearns `gamma=.24`来自相邻但不同的跨度方案，不是Time Maps自身IAA；它只能作为风险边界，不能伪称直接复制失败。

## I. 与本项目的有限转译

当前不分析任何用户小说。未来只有用户另行批准后，才可：

1. 固定文本版本并记录页、章、段、字符或词的可回定位跨度；
2. 先收集绝对时间算子、相对时间算子、外部有日期锚和层级提示，不预设章/场景就是NC；
3. 为每个候选NC保存`sni/fni/snf/fnf`、原文摘要、证据位置、尺度、标注者/版本和确定性；
4. 把`direct_time_anchor`、`relative_constraint`、`interpretive_estimate`、`arbitrary_scale_value`和`unmappable`分开；
5. 把舍弃线索记入`omitted_temporal_operator`并写理由；
6. 对横向相邻NC检查`fnf -> next_fni`，只在两端均可定位时登记`dual_ended_ellipsis_gap`；
7. 空隙内事件、人物状态和因果一律记为`unnarrated_content_unknown`，不得由模型记忆补写；
8. 全书、卷/part、章、场景、单日或单事件分别建图，保存尺度间包含关系，不直接比较斜率和密度；
9. 回忆内容与当前回忆行为有双重证据时保留两条NC及理论竞争；
10. 时间环、平行世界、重复人物或层级越界无法单轴化时报告`single_fabula_axis_inapplicable`；
11. 至少由第二读者复核高风险端点；不一致时保留候选区间或多图，不强定；
12. 不自动调序、补时间词、补事件、扩写省略、分章分卷或修改生产文本。

## J. 实际诊断价值

T051最适合处理：“这份所谓时间线究竟记录了文本出现顺序、故事时间起止还是只记录了事件序位；两个已叙述跨度之间的空白是否真有双端；为什么全书图看不见单日细节；哪些单位因解释选择、尺度或非线性故事世界而不能进入同一图？”

可复核问题包括：

- 每个单位的syuzhet和fabula起止是否都有原文依据；
- 端点来自绝对锚、相对约束、解释估值还是人为尺度；
- 两个相邻NC之间是否有双端空隙，空隙内容是否保持未知；
- 同一文本跨度是否同时承载过去内容和当前心智行为；
- 全书与局部图使用什么单位，哪些结构在缩放中被压平；
- 哪些时间算子被排除，排除是否改变大结构；
- 多时间线是可纵向分组、重复版本，还是无法单轴化的时间环/平行世界；
- 图形结果由谁标注、怎样复核、哪些分歧仍未解决；
- 读图可理解是否被错误写成年代标注正确或作品更好。

该增量高于“按先后画时间线”的常识，因为它给出四端点数据模型、多尺度分图、双端空隙、重叠时间体、线索身份、决定日志和明确失败条件；但它不产生写作处方、质量分数或唯一年代。

## K. 与其他理论的关系

- **与T037：** `natural_scene_chapter_boundary_vs_interpretive_temporal_span_boundary`；章场候选边界与时间体边界分开。
- **与T043：** `local_temporal_relation_graph_vs_multiscale_dual_axis_map_complement`；局部边约束坐标，不自动生成全图。
- **与T044：** `reader_chronology_reconstruction_vs_annotator_materialized_time_map_boundary`；认知重建与外部图分开。
- **与T047：** `salient_reference_anchor_graph_vs_four_endpoint_span_map_complement`；参考锚与跨度坐标互补。
- **与T048：** `clock_timeflow_and_published_chapter_order_vs_fabula_syuzhet_chronology_boundary`；绝对时刻/章序与故事年代分开。
- **与T049：** `fixed_window_elapsed_time_and_disruption_span_vs_multiscale_chronotope_gap_complement`；时长/跨度与双端空隙互补。
- **与T050：** `container_membership_vs_four_endpoint_chronotope_and_gap_boundary`；包容成员与四端点不可互换。
- **与T041：** `deictic_center_vs_materialized_fabula_coordinate_boundary`；指示中心不是日期。
- **与T042：** `local_discourse_temporal_inference_vs_whole_map_constraint_complement`；局部关系只作全图约束。
- **与T045：** `event_duration_construal_vs_mapped_fabula_span_boundary`；事件时长构拟不自动验证文学端点。
- **与T046：** `narrative_frequency_vs_repeated_chronotope_offset_complement`；复述次数与图上重复线段分开。
- **与T036：** `plotline_coordination_vs_temporal_offset_visualization_boundary`；看见多线不等于协调完成。
- **与T006：** `reader_event_model_vs_analyst_time_map_boundary`；读者更新与分析者图分开。
- **与T024：** `semantic_macrostructure_vs_temporal_coordinate_map_boundary`；语义层级不由时间几何自动产生。

所有关系继续标为`emergent_provisional_structure`。

## L. 最终状态

`mature`

理由：QF113-P1提供开放CC BY VOR、明确四端点机制、完整多轮读取协议、绝对/相对时间算子、Rashomon与Mrs. Dalloway的跨媒介/长篇实例、直接双端省略空隙及大尺度—局部尺度对照；QF113-V1由独立团队提供较早的整部电影双序图和有限读图实验，同时暴露ordinal故事轴、人工年代无IAA和真实时距缺失；QF113-C1提供多用户多版本时间算子竞争框架并明确未完成自动化；QF113-C2限定单一fabula轴在非线性storyworld中的失效；复用QF111-C1保留`gamma=.24`的邻接跨度可靠性警告。成熟只属于“人工、多尺度、可溯源的fabula—syuzhet四端点表示及双端空隙诊断”，不属于省略内容恢复、唯一客观年代、自然章卷、多线时间环、现代中文网文、自动调序或改写、真实读者商业结果和作品质量。

当前结构标记：`emergent_provisional_structure`
