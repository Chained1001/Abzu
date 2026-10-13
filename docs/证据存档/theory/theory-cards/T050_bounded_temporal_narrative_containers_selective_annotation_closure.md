# 理论档案：T050

## Table Of Contents

Use the existing section headings below as the navigation map.

## A. 理论身份

- **理论编号：** T050
- **候选编号：** QF-112
- **标准名称：** 有界时间叙事容器、选择性包含标注与闭包推断研究纲领
- **英文名称：** Bounded Temporal Narrative Containers, Selective Containment Annotation, and Closure-Inference Research Program
- **核心研究者：** James Pustejovsky；Amber Stubbs
- **标注规范、语料与模型验证研究者：** William F. Styler IV；Steven Bethard；Sean Finan；Martha Palmer；Sameer Pradhan；Piet C. de Groen；Brad Erickson；Timothy Miller；Chen Lin；Guergana Savova；Julien Tourille；Olivier Ferret；Xavier Tannier；Aurelie Neveol
- **理论类型：** 时间信息标注、选择性关系表示、嵌套闭包与模型失败的有界研究纲领
- **核心来源：** QF112-P1
- **规范与语料验证：** QF112-V1
- **同项目关系抽取验证：** QF112-V2
- **独立模型复核：** QF112-C1
- **当前状态：** `mature`

这里成熟的不是自然场景、章节或卷的时间容器理论，也不是长篇故事年代恢复算法。成熟对象严格限定为一种**标注型时间容器**：当全部事件对的关系数量按平方增长时，优先把事件连接到较小、显著的时间或事件容器，再用容器之间及嵌套容器的关系做有限闭包推断。该表示减少显式边并提高部分关系的信息量，但容器边界、`CONTAINS`与`OVERLAP`、远距成员关系和跨域模型都存在明显不确定性。

## B. 原始研究问题

QF112-P1追问：TimeML允许的事件对数量过大，而新闻中许多未显式锚定事件又只被粗略连到文档创建时间；能否区分Narrative Scope、移动的Narrative Time与默认Narrative Container，以更少但更有信息的事件—时间关系替代不可承受的全配对标注。[QF112-P1, pp.152-155]

QF112-V1把这一思想改造成THYME临床标注规范：怎样用DocTimeRel、`CONTAINS`和少量水平关系形成可闭包的嵌套容器，同时把语言显式关系、逻辑闭包和医学领域知识推断分开。[QF112-V1, pp.148-152]

QF112-V2和QF112-C1进一步追问：在临床文本中自动识别容器成员关系能达到什么程度；句法、语义、跨句距离和特征工程的失败说明了什么。[QF112-V2, pp.18-26; QF112-C1, pp.224-230]

这些来源不回答自然场景或章节是否构成时间单元、未叙述间隔中发生了什么、整部长篇如何跨日或跨卷排序、两条情节线怎样同步，也不证明容器结构改善读者体验或作品质量。

## C. 核心机制与理论单位

1. **三种文档时间对象必须分开：** Narrative Scope是文档提及的最早到最晚时间范围；Narrative Time是阅读推进时的当前时间锚；Narrative Container是无显式锚事件默认落入的显著区间。三者不能互换。[QF112-P1, pp.153-155]
2. **选择性标注对抗平方增长：** n个事件产生近似平方数量的候选事件对。容器方案优先标事件—时间或事件—容器关系，而不是穷举全部事件对。[QF112-P1, pp.153-154; QF112-V1, pp.148-149]
3. **信息量来自较小的包容锚：** 在关系可成立时，`IS_INCLUDED/CONTAINS`比仅相对DCT的before/after更精确；较小容器通常比宽泛容器提供更多时间限制。但“更有信息”不等于更正确。[QF112-P1, pp.154,158-159]
4. **默认容器依语域而变：** 新闻中的右边界常是DCT，左边界受出版频率、渠道、风格和显式锚影响；该默认没有跨域固定长度。[QF112-P1, pp.153,155-158]
5. **容器不是单独标签：** THYME不把事件直接标成“容器”。标注者通过DocTimeRel和一组`CONTAINS` TLINK让锚及成员关系从图中涌现。[QF112-V1, pp.148-149]
6. **嵌套闭包减少重复边：** 若日期包含手术、手术包含切口、切口包含出血，则可推导出血发生于该日期；推导边必须保留来源链，不能冒充人工直接标注。[QF112-V1, pp.149-151]
7. **显式、逻辑推导与领域推断分层：** 传递闭包可由已标关系自动产生；医学流程知识产生的先后关系属于另一类推断，不应强迫非专家标注者直接写入金标。[QF112-V1, pp.149-151]
8. **包含关系并不容易：** P1的文档容器大小三人严格一致只有95/183；THYME的`CONTAINS`关系F1一致性为.5630。该方案降低边数，却没有消除边界和标签歧义。[QF112-P1, pp.157-159; QF112-V1, pp.150-152]
9. **成员关系依语义和话语结构：** `currently treated`可能是CONTAINS或OVERLAP；`since May`更可能是BEGINS-ON；远距、协调、分句断裂、慢性/急性知识和子事件会改变判断。[QF112-V2, pp.24-25]
10. **句内与跨句任务必须分开：** 2017模型把两类关系分别训练；约75%实例在句内，跨句只保留不超过三句的候选，跨句最佳配置仍明显较弱。[QF112-C1, pp.225-228]
11. **模型分数不验证容器本体：** 2013最佳句内事件—时间F1为.737；2017全任务F1为.613。两者都使用金标事件/时间或属性，处理临床文本，不证明自动识别自然叙事容器。[QF112-V2, pp.23-25; QF112-C1, pp.224-228]
12. **自然场景/章节是未验证外推：** 论文中的“natural cluster”指围绕时间或医疗情境形成的标注关系簇，不是文学场景、章界、卷界或连载单元。[QF112-V1, pp.148-149]

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T050-P01 | NC是无显式锚事件的默认包容区间 | QF112-P1 p.152 | 核心定义 | 新闻导向初始提案 |
| T050-P02 | 时间标注必须考虑语域/风格和话语关系 | QF112-P1 pp.152-153 | 核心范围 | 未给跨域统一规则 |
| T050-P03 | Narrative Scope、Time与Container是不同对象 | QF112-P1 pp.153-155 | 概念分层 | Scope未进入该轮正式标注 |
| T050-P04 | 全事件对标注随事件数近似平方增长 | QF112-P1 p.153 | 成本机制 | 不等于所有关系无价值 |
| T050-P05 | 事件—时间包容关系可替代部分全配对边 | QF112-P1 pp.153-155 | 选择性标注 | 事件—事件仍重要 |
| T050-P06 | 更小包容区间通常比宽泛顺序关系更有信息 | QF112-P1 p.154 | 信息量原则 | 信息量不等于真值 |
| T050-P07 | NC右界多为DCT而左界依出版频率等条件 | QF112-P1 pp.155-156 | 新闻域假设 | 不可外推小说章节 |
| T050-P08 | TimeBank 183篇以财经和新闻为主 | QF112-P1 p.156 | 语料范围 | 非文学长篇样本 |
| T050-P09 | 三名本科标注者重标全部TimeBank事件 | QF112-P1 pp.156-157 | 初步验证设计 | 方向有限且非完整TimeML任务 |
| T050-P10 | 文档容器大小严格一致为95/183，完全分歧6/183 | QF112-P1 p.157 | 关键不利结果 | 其余多为部分一致 |
| T050-P11 | 播报文本没有任何文档达到三人完全一致 | QF112-P1 pp.157-158 | 语域失败 | 容器长度需继续研究 |
| T050-P12 | 约50%事件以IS_INCLUDED连到NC | QF112-P1 p.158 | 关系分布 | 近似描述而非固定比例 |
| T050-P13 | 平均锚定kappa=.74但低变异会产生负值 | QF112-P1 p.159 | 一致性及指标边界 | 不能只报总体kappa |
| T050-V01 | THYME把临床时间线任务和领域作为规范条件 | QF112-V1 pp.143-146 | 领域化规范 | 不等同一般叙事 |
| T050-V02 | 临床记录含大量隐式和领域知识关系 | QF112-V1 pp.144-146 | 对象边界 | 不宜强迫非专家全标 |
| T050-V03 | PRT/POST表达可在缺失明确事件时作为容器 | QF112-V1 p.148 | 特定语言机制 | 医疗构式而非文学章界 |
| T050-V04 | 容器可由日期、时间表达、抽象概念或持续事件锚定 | QF112-V1 pp.148-149 | 锚类型 | 不是版面容器 |
| T050-V05 | DocTimeRel先给四个DCT粗容器 | QF112-V1 pp.148-149 | 两级标注 | DCT机制具有临床文档特性 |
| T050-V06 | 后续TLINK只用五类关系且CONTAINS最多 | QF112-V1 p.149 | 标注选择 | 非完整Allen关系集 |
| T050-V07 | 嵌套CONTAINS支持成员关系闭包 | QF112-V1 p.149 | 推导机制 | 必须保留推导链 |
| T050-V08 | 手工标注与自动推导必须区分 | QF112-V1 pp.149-150 | 证据身份规则 | 领域推断另行处理 |
| T050-V09 | 发布子集含35名患者、107文档、双标加专家裁决 | QF112-V1 p.150 | 语料与流程 | 肿瘤临床资料 |
| T050-V10 | 15769事件、1426时间表达、7935关系 | QF112-V1 p.150 | 语料统计 | 不能外推小说分布 |
| T050-V11 | CONTAINS为5112/7935即64.42% | QF112-V1 p.150 | 关系统计 | 讨论节写66%，保留报告差异 |
| T050-V12 | CONTAINS IAA F1=.5630，全部LINK类型=.4506 | QF112-V1 p.151 | 关键可靠性边界 | 容器方法没有解决一致性 |
| T050-V13 | 新闻训练系统在THYME LINK上F1=.204 | QF112-V1 pp.151-152 | 跨域不利结果 | 事件/时间识别也显著下降 |
| T050-V14 | 剩余分歧多在是否显式标边而非关系类型 | QF112-V1 p.152 | 规范边界 | 选择规则仍需细化 |
| T050-M01 | 临床CONTAINS定义为事件跨度完全在时间跨度内 | QF112-V2 p.19 | 标签语义 | 与OVERLAP竞争 |
| T050-M02 | 该78文档子集CONTAINS IAA F1=.60 | QF112-V2 p.19 | 同项目基线 | 与后续107文档统计范围不同 |
| T050-M03 | 句内事件—时间对被逐对分为CONTAINS或否 | QF112-V2 p.20 | 模型任务 | 不处理跨句或事件—事件 |
| T050-M04 | 训练开发含4378句、7372事件、849时间和2287 CONTAINS | QF112-V2 p.23 | 数据范围 | 使用金标解析与属性 |
| T050-M05 | 最近事件高精度基线F1=.627，最近时间高召回基线=.656 | QF112-V2 pp.23-24 | 基线结果 | 距离启发式偏科 |
| T050-M06 | 最佳复合树核P=.770、R=.707、F1=.737 | QF112-V2 p.24 | 有限模型正结果 | 仅句内临床事件—时间 |
| T050-M07 | CONTAINS/OVERLAP和BEGINS-ON存在真实歧义 | QF112-V2 pp.24-25 | 错误修正 | 不能把相关即包含 |
| T050-M08 | 远距、协调、分句断裂和子事件造成漏判 | QF112-V2 p.25 | 失败分析 | 需话语和事件语义 |
| T050-C01 | THYME训练/测试含49147/15503事件 | QF112-C1 p.225 | 独立模型数据 | 临床资料且实体为金标 |
| T050-C02 | 约75%关系为句内，另有跨句关系 | QF112-C1 p.225 | 任务分层 | 跨句不是长篇远距 |
| T050-C03 | 跨句候选被限制为不超过三句 | QF112-C1 p.226 | 成本约束 | 超窗关系不被检验 |
| T050-C04 | 任务按方向分CONTAINS/CONTAINED-BY/无关系三类 | QF112-C1 pp.225-226 | 模型标签 | 非完整时间关系集 |
| T050-C05 | 最佳整体P=.657、R=.575、F1=.613 | QF112-C1 p.228 | 独立模型正结果 | 不等于可靠自动标注 |
| T050-C06 | 句内最佳F1=.683，跨句最佳F1=.482 | QF112-C1 p.227 | 跨句不利结果 | 两值来自各自最佳配置 |
| T050-C07 | cTAKES特征使跨句F1从.482降至.443 | QF112-C1 pp.227-228 | 特征负结果 | 特征并非普遍增益 |

## E. 来源身份与实际读取深度

### QF112-P1

- **身份：** James Pustejovsky与Amber Stubbs，2011，*Increasing Informativeness in Temporal Annotation*，LAW V，printed pp.152-160，ACL ID `W11-0419`。
- **实际读取：** 全文九页，覆盖TimeML缺口、NC/NT/Scope、信息量、TimeBank重标、分类、三标注者一致性、kappa、图示、结论和未来工作。
- **作用：** 提供容器中心选择性标注的核心定义和第一次不利可靠性数据。
- **SHA-256：** `66F9722CC7A70862D520A6809E3ADD3A48442F0A72F9CD7E0BCB77F64BA00A72`。

### QF112-V1

- **身份：** Styler等，2014，*Temporal Annotation in the Clinical Domain*，*Transactions of the Association for Computational Linguistics* 2:143-154，DOI `10.1162/tacl_a_00172`。
- **实际读取：** 全文十二页，覆盖临床对象、THYME扩展、容器标注、嵌套闭包、显式/推导分离、107文档统计、IAA、跨域基线、讨论与限制。
- **作用：** 把容器提案实现为公开标注规范和语料，并直接暴露LINK一致性与跨域失败。
- **SHA-256：** `1764A40CEAB0E84FF5AD5DEA58797CADE14B9B8C1E18E6350D4884DF2F4DF868`。

### QF112-V2

- **身份：** Timothy A. Miller等，2013，*Discovering Narrative Containers in Clinical Text*，BioNLP 2013，printed pp.18-26，ACL ID `W13-1903`，DOI `10.18653/v1/W13-1903`。
- **实际读取：** 全文九页，覆盖语料、CONTAINS任务、复合核、78文档数据、基线与模型、评估争议、错误分析和结论。
- **作用：** 同项目计算验证，量化句内关系模型并提供标签歧义、远距和子事件失败。
- **SHA-256：** `05E2A3D347BB18307A6A54E73A34730505DBB6764178311D789672C62E419A79`。

### QF112-C1

- **身份：** Julien Tourille、Olivier Ferret、Xavier Tannier与Aurelie Neveol，2017，*Neural Architecture for Temporal Relation Extraction: A Bi-LSTM Approach for Detecting Narrative Containers*，ACL 2017 Short Papers，printed pp.224-230，DOI `10.18653/v1/P17-2035`。
- **实际读取：** 全文七页，覆盖THYME语料、句内/跨句任务、三句窗口、Bi-LSTM、特征、训练、两类结果、负增量和限制。
- **作用：** 独立团队对同一公开任务的模型复核，证明跨句容器关系仍显著弱于句内关系。
- **SHA-256：** `DC5AE43596CA59FDD093E24DCB40BAE9DF4AC0F62DF0FE5E8B612F139171617D`。

## F. 原义、项目转译与不受支持项

- **theory_directly_supports：** 区分Narrative Scope、Narrative Time和默认Narrative Container；用较少的事件—容器关系替代部分全配对；以DocTimeRel、`CONTAINS`和嵌套闭包形成有界可推导图；区分直接标注、逻辑闭包和领域推断。
- **same_project_validation：** THYME规范和Miller等模型把提案用于临床文本，提供语料规模、IAA、句内模型与错误分析；同项目身份不冒充独立复制。
- **independent_model_recheck：** Tourille等在同一公开任务上用Bi-LSTM复核，并显示整体F1=.613、跨句最佳F1=.482及特征负增量。
- **independent_adverse_evidence：** 文档容器大小严格一致仅95/183、THYME `CONTAINS` IAA=.5630、新闻模型跨域LINK F1=.204、跨句模型明显弱于句内。
- **project_translation：** 未来只有用户批准具体文本后，才可把可定位时间/事件锚、容器候选、成员、直接边、闭包边、边界竞争和未检查远距关系列表化。
- **project_hypothesis：** 中文长篇中的自然场景/章/卷能否成为时间容器，必须由自然单元标注、跨单元事件证据和可靠性研究另行验证。
- **not_supported：** 版面章界就是时间容器；容器自动给出全部事件顺序；省略期间内容可由容器补出；DCT等于小说当前时刻；更少边一定更正确；模型F1代表读者时间理解；可自动调序、补时间词、分章分卷或推出悬念、追读、留存、付费与质量。

## G. 文本尺度覆盖

- **directly_studied：** `event_mention`、`timex`、`event_time_pair`、`narrative_time_anchor`、`document_creation_time`、`default_document_interval`、`sentence`、`three_sentence_window`、`clinical_section`、`nested_container`、`whole_news_document`、`whole_clinical_note`、`clinical_corpus`。
- **reasonable_extension：** 在边界明确的短文档中，把显式时间/事件锚与可定位成员建立有向包容图，并保存直接与闭包关系。
- **project_hypothesis：** 自然场景或短章节内部的时间容器候选，及跨容器成员关系。
- **not_supported：** 自然场景/章节/卷真值、未叙述间隔内容、整部长篇相对年代、跨卷多线同步、现代中文网文、真实读者结果或商业质量。

## H. 批评、竞争和修正

1. Pustejovsky与Stubbs用容器降低全配对成本，但其左边界依语域，三人对容器大小严格一致仅略过半；故容器长度不能当固定常数。
2. T043的TimeML/局部稠密图提供关系集合和必查窗口；T050反向选择少量容器边。两者是不同成本策略，不得把容器稀疏图冒充局部全查图。
3. T047为每个显式节点选择reference timex和可选reference event；T050问锚包含哪些成员。参考父边和容器成员边可以互补，但不是同一结构。
4. THYME把容器嵌套用于闭包，却要求推导边不直接计入一致性；这阻止“推导更多边所以人工一致更高”的循环证明。
5. `CONTAINS`与`OVERLAP`取决于事件是否完全落入时间范围；`since`还可能要求BEGINS-ON。相关或同段共现不充分支持包含。
6. 2013模型使用金标事件、时间、属性和解析，最佳F1=.737只适用于句内临床事件—时间对；不能写成端到端容器识别。
7. 2017模型虽然超过当时对照，但整体F1只有.613，跨句最佳.482，且cTAKES特征使跨句结果下降；远距关系仍未解决。
8. 四篇研究对象是新闻/财经和肿瘤临床记录。论文中的document、section或natural cluster都不能自动转译为小说场景、章、卷或连载发布单元。

## I. 与本项目的有限转译

当前不分析任何用户小说。未来只有用户另行批准后，才可：

1. 先列出可定位时间表达、持续事件和明确文档锚，不把章/场景预设为容器；
2. 对每个容器候选记录左/右界证据、来源语域、成员事件和竞争容器；
3. 分开`direct_contains`、`direct_overlap`、`begins_on_candidate`、`closure_inferred`、`domain_inferred`和`unexamined`；
4. 为每条闭包边保存完整推导链，不能把推导边伪装成原文直接关系；
5. 把句内、三句内、跨段、跨章和跨卷分别标记，不用短窗口模型替代远距检查；
6. 容器边界或标签不唯一时保留`container_boundary_indeterminate`或`relation_indeterminate`；
7. 只把场景/章/卷记为`natural_container_unverified`，直到有独立人工可靠性和跨单元证据；
8. 不自动补未叙述事件、调序、改时间词、分章分卷或修改生产文本。

## J. 实际诊断价值

T050最适合处理：“为什么逐对标所有时间关系不可承受，哪些事件可以先连接到一个较小时间容器，又有哪些关系只能通过容器嵌套推导？”它提供以下可复核问题：

- 当前对象是Scope、移动Time还是默认Container；
- 容器由显式时间、持续事件、DCT还是领域假设锚定；
- 左右边界是否都有文本证据，或只由新闻/临床默认补出；
- 成员关系是完全包含、重叠、从某时开始还是仅相关；
- 哪些边直接标注，哪些来自闭包，哪些依赖领域知识；
- 跨句关系是否超出三句或其他候选窗口；
- 子事件、协调结构、慢性/急性语义是否导致漏判；
- 自然场景/章/卷、未叙述间隔、多线同步和完整年代是否仍未表示。

该增量高于“把同一天的事放一组”的常识，因为它给出对象分层、成本理由、选择性标注、嵌套闭包、证据身份和成体系的失败数据；但它仍不产生长篇时间线或写作处方。

## K. 与其他理论的关系

- **与T043：** `local_dense_pair_check_vs_container_centered_selective_annotation_competition`；T043规定局部必查边，T050用容器减少显式边。
- **与T047：** `salient_reference_anchor_vs_containment_membership_complement`；reference timex/event选择与容器成员归属不可互换。
- **与T042：** `discourse_temporal_inference_vs_materialized_container_relation_boundary`；话语推断产生候选，容器图保存直接/闭包关系。
- **与T041：** `deictic_center_vs_narrative_time_and_default_container_boundary`；指示中心解释时态视点，不等于容器边界。
- **与T045：** `event_duration_semantics_vs_contains_overlap_boundary_complement`；事件持续性决定完全包含还是重叠。
- **与T044：** `reader_chronology_reconstruction_vs_annotation_container_boundary`；读者是否形成同一容器图未验证。
- **与T046：** `event_recount_frequency_vs_container_membership_boundary`；发生/叙述次数不能由容器成员数替代。
- **与T048：** `clock_timeflow_vs_annotation_container_boundary`；24小时时刻流不是事件包容图。
- **与T049：** `elapsed_window_and_disruption_span_vs_containment_membership_complement`；经过时长/中断跨度不提供容器成员边。
- **与T037：** `natural_scene_boundary_vs_annotation_temporal_container_boundary`；文学场景边界不能由临床容器关系自动生成。
- **与T006：** `reader_event_model_vs_annotation_container_boundary`；读者更新和标注关系簇是不同对象。
- **与T024：** `semantic_macrostructure_vs_temporal_container_cluster_boundary`；局部包容簇不自动聚合为章弧卷宏结构。
- **与T036：** `plotline_coordination_vs_temporal_container_membership_boundary`；容器没有解决跨线切换、会合和全局历史。

所有关系继续标为 `emergent_provisional_structure`。

## L. 最终状态

`mature`

理由：QF112-P1提供开放可重定位的核心定义、选择性标注理由和第一次三人不利可靠性；QF112-V1把提案实现为THYME规范和107文档语料，明确区分直接/闭包/领域推断并报告低LINK一致性与跨域失败；QF112-V2量化句内模型并给出关系歧义、远距和子事件错误；QF112-C1由独立团队在同一公开任务上复核句内/跨句模型，保留跨句F1=.482和特征负增量。成熟状态只属于“标注型时间容器、选择性成员边、嵌套闭包和可靠性/模型失败边界”，不属于自然场景/章节/卷、未叙述内容、整部长篇相对年代、多线同步、中文网文、读者心理、自动改写、商业结果或作品质量。

当前结构标记：`emergent_provisional_structure`
