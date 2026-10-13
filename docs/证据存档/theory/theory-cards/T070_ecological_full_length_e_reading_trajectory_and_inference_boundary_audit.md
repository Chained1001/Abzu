# T070 生态整本电子阅读会话—导航—退出轨迹与推断边界审计研究纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T070
- **候选ID：** QF-134
- **标准名称：** 生态整本电子阅读会话—导航—退出轨迹与推断边界审计研究纲领
- **英文名称：** Ecological Full-Length E-Reading Session, Navigation, Attrition, and Inference-Bound Audit Research Program
- **理论类型：** `validation_aware_ecological_full_length_e_reading_trajectory_and_inference_boundary_audit_program`
- **核心原始来源：** Vuorinen 2024博士论文，*Recreational e-Reading Behaviour in Adults' Everyday Life*
- **同行评审同项目方法前驱：** Vuorinen、Tatler与Keller 2024，*Tracking e-reading behavior*
- **独立受控整本校正：** Cop等2017 GECO；Sui等2023 GECO-CN
- **固定发布范围审计：** Vuorinen论文材料仓库commit `c95a2519dabd62d55645e7924ab8ea3c5a386559`
- **当前状态：** `mature`

T070成熟的是一个窄而重要的对象：在读者自己的电子设备和日常环境中，把页面事件切成会话，保留整书进度、回访间隔、连续投入、任务切换、相对速度、回看/前跳、完成/退出、设备和地点，并把全部操作化阈值、选择偏差、缺失和观察者效应纳入解释。它第一次为本理论群补入大样本、个体级、沉默读者、完整小说、跨会话和退出者均保留的行为轨迹；多年Kindle捐赠数据又把对象扩展到跨书、跨设备的长期历史。

成熟不意味着行为可被直接翻译成心理或质量。核心论文反复说明：页面可见时读者可能走神、泡茶、记笔记或离开；连续可见不等于沉浸，慢读不等于理解困难，回看不等于叙事失败，研究完成不等于平台留存。GECO与GECO-CN只作为独立受控范围校正：它们证明完整小说可以在词级眼动和章节理解层面研究，也同时显示实验室会话、语言、分词、字号、外加摘要和禁止回看会改变对象。T070因此成熟为`observable_full_length_e_reading_trajectory + explicit_measurement_and_inference_boundary`，不成熟化任何文本因果、中文网文商业结果或自动创作处方。

## B. 原始研究问题与对象

Vuorinen论文的问题不是“哪本小说写得好”，而是：成人日常电子阅读能否通过非侵入式或低侵入式行为日志被描述；语境、电子阅读经验与动机怎样关联频率、持续、任务切换、速度和线性；短期研究阅读器与多年企业设备日志各自能看到什么。[QF134-P1, pp.64-86, 125-215]

三个经验对象必须分开：

1. **短篇方法前驱：** 60名本科生在14天内从9篇短篇中选读一篇，检验定制阅读器、阈值和多层模型；绝大多数一次读完，不能代表整本退出与多会话轨迹。[QF134-V1, pp.1-15]
2. **整本生态研究：** 729名成人在自己的浏览器设备中从16部英语小说自选一部，产生711,445个事件；445人完成研究，284人未完成。[QF134-P1, pp.125-184]
3. **多年捐赠日志：** 31名成人的Kindle历史在排除欺诈、共享账户和预处理失败后进入分析，跨平均2.7年、最多11.2年和数千本可识别/不可识别书目。[QF134-P1, pp.185-215]

独立校正对象也必须分开：GECO让英语单语和荷英双语参与者在四次实验室会话中读完整部英语小说；GECO-CN让30名中英双语研究生以反向平衡方式阅读同一小说的简体中文和英语两半。这些对象直接观测词级注视与理解题，却不是自由设备、自由切换、自由回看的日常阅读。[QF134-C1; QF134-C2]

## C. 核心机制与理论单位

1. **追踪事件：** 打开书、翻页、失焦/脱离、菜单和遮罩等动作保存时间、文本位置、浏览器/窗口和阅读器状态。事件是仪器记录，不是认知状态。
2. **投入阈值：** 页面可见脱离不超过1秒视作连续，小于等于15秒的中断按受扰投入处理并在主分析中归入脱离；长时无活动触发遮罩。阈值必须同版本保存。
3. **会话切分：** 打开开始，关闭或60分钟无活动结束；小于1分钟或投入低于15%的会话排除。会话是分析单位，不是心理自然单位或章节边界。
4. **五个分离维度：** 频率、持续、任务切换、速度和线性分别建模；不得压成一个“投入总分”。
5. **频率：** 两次有效会话之间的间隔及返回序列。
6. **持续：** 最终文本位置、到达激励阈值后继续的分钟数及完成/未完成身份。
7. **连续投入与切换：** 会话内页面持续可见片段及失焦/返回；只说明可观察页面状态。
8. **相对速度：** 页面词数除以有效可见时间，再相对个人基线；必须保留语言、设备、页面和异常值规则。
9. **线性：** 文本位置下降定义回退，跳过下一页定义向前跃迁；登记起始次数和距离，不能预设动机。
10. **退出即数据：** 284名未完成者不从主对象中消失；完成状态同时是行为差异与末测变量缺失机制。
11. **多层时间坐标：** 事件位置、会话内位置、会话序号、整书相对位置、日历间隔和多年账户历史分栏，不把现实读时与故事时间混写。
12. **双生态来源：** 定制阅读器字段清楚但观察者知情；企业日志更接近日常但缺字段、重叠、书目不可识别和账户归属不稳。两者互补而非互相替代。
13. **受控范围校正：** GECO/GECO-CN把页级行为与词级注视、跳词、章节理解和语言特异分词并列，防止把生态日志解释得过细。
14. **推断边界作为机制一部分：** 每个行为结论必须附操作化、缺失、选择、设备、地点、历史情境和竞争解释；边界不是附录注脚。

## D. 命题—证据总表

| claim_id | 命题组 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T070-C001-C005 | 事件字段、投入阈值、会话规则和五维行为框架 | QF134-P1 pp.64-86 | 核心原始方法 | 操作化不等于心理真值 |
| T070-C006-C011 | 16部完整英语小说、样本流、完成/退出、样本/疫情和70页阈值 | QF134-P1 pp.125-143 | 直接整本生态设计与不利边界 | 自选、疫情和激励限制外推 |
| T070-C012-C018 | 711,445事件、伪迹、会话、进度、连续投入、速度和非线性 | QF134-P1 pp.144-174 | 直接行为结果 | 事件不是独立读者；均值不替代轨迹 |
| T070-C019-C026 | 退出缺失、动机/经验混合结果、位置/会话局部依赖、地点和观察者效应 | QF134-P1 pp.149-184 | 直接不利结果与解释边界 | 关联不识别文本或心理因果 |
| T070-C027-C035 | Kindle样本流、日志错误、书目识别、多年轨迹、设备、享受与问卷时间错位 | QF134-P1 pp.185-215 | 直接长期生态来源与发布边界 | 小样本、账户、未知书目和企业黑箱 |
| T070-C036-C039 | 同项目短篇前驱验证阅读器方法、开放数据和大量null/不稳定结果 | QF134-V1全文 | 同项目同行评审方法验证 | 短篇不是独立整本复制 |
| T070-C040-C044 | GECO完整小说、受控程序、非正态、可靠性及自然语料混淆 | QF134-C1全文 | 独立受控整本校正 | 单书、小样本和实验室程序 |
| T070-C045-C048 | GECO-CN中文整本、摘要/禁止回看、分词边界和高跳词竞争解释 | QF134-C2全文 | 独立中文语言范围校正 | 双语研究生和翻译文本不代表中文网文 |
| T070-C049 | 固定论文材料包不含Chapter 5/6日志、分析代码或许可证 | QF134-D1完整树 | 直接发布范围不利审计 | 不能端到端复算整本与Kindle结果 |
| T070-C050 | 跨来源足以成熟个体整本电子阅读轨迹和推断边界，不支持心理、质量、商业或创作规则 | cross-source | 严格有界项目综合 | 禁止越界转译 |

## E. 来源身份与实际读取深度

### QF134-P1

- **身份：** University of Edinburgh 2024博士论文，DOI `10.7488/era/4870`，244页官方开放审查版本。
- **读取：** 全文；重点逐页核对第3、5、6、7章及附录的仪器、预处理、样本流、五类行为、模型、失败结果、退出、企业日志和限制。
- **关键直接证据：** 整本研究729人、16书、711,445事件、445完成/284未完成；Kindle研究31人，多年跨书跨设备历史。
- **关键不利证据：** 样本选择、疫情、近半伪迹会话、退出末测缺失、一次问卷与多年历史错位、账户/书目不确定、观察者效应；作者明确行为不能直接捕捉认知或情感投入。
- **本地哈希：** `FADAAD8AE5E36DC7F65145E64EC629DC937A7734E5609EC7B05AEFF60BA55025`。

### QF134-V1

- **身份：** 2024 *Frontiers in Education*同行评审开放论文，DOI `10.3389/feduc.2023.1302701`。
- **读取：** 全文15页；设计、阅读器、会话/速度/线性规则、模型、null结果、限制和数据声明均核对。
- **作用：** 为同一阅读器方法提供同行评审前驱和开放原始/预处理数据、R分析；同时直接说明短篇多数一次读完，不足以代表完整长篇多会话和退出。
- **本地哈希：** `20436EF75911A3ABD89A9EE7E1037A8B3157E5D92AD1682FA1C3F8FD9EC5E4F9`。

### QF134-C1

- **身份：** Cop、Dirix、Drieghe与Duyck 2017 GECO，*Behavior Research Methods*，DOI `10.3758/s13428-016-0734-0`。
- **读取：** 全文；参与者、完整小说、四次90分钟会话、理解题、眼动字段、分布、分半可靠性和限制均核对。
- **作用：** 独立证明完整小说可保留词级受控加工；也显示长篇读时右偏、自然文本特征混淆和单书/小样本限制。
- **本地哈希：** `76F7EF190936F4714FA73B75C61809BE0F430581F44BE55A95FCA8DCF4509848`。

### QF134-C2

- **身份：** Sui、Dirix、Woumans与Duyck 2023 GECO-CN，*Behavior Research Methods*，DOI `10.3758/s13428-022-01931-3`。
- **读取：** 全文；30名中英双语研究生、反向平衡、四次两小时、理解、人工中文分词、跳词、可靠性、外加摘要与禁止回看均核对。
- **作用：** 防止把英语页级行为当通用中文规律；长篇简中跳词率高有篇章可预测性、字号、材料、分词等竞争解释。
- **本地哈希：** `BFA0746FA4431F810F84D55CA8F6C925614C296C14A5E5A2E886322D60F03EB5`。

### QF134-D1

- **身份：** 论文材料仓库固定commit压缩快照。
- **读取：** 73条目完整树、README和扩展名统计；48个HTML、4个图像及材料资产逐类核对。
- **作用：** 精确冻结发布范围：有书籍信息和信息图材料，没有Chapter 5/6原始日志、分析代码、机器可读结果表或许可证。
- **本地哈希：** `CC9D49221416F8F5DAE987230DF609F22277F723B708CFCDE079BE2AF6356EC0`。

## F. 原义、同项目验证、独立修正、项目转译与不受支持项

- **primary_directly_supports：** 个体整本电子阅读的页面/会话/进度/退出/速度/切换/非线性/设备/地点轨迹，以及多年捐赠日志的清洗和范围。
- **same_program_validation_supports：** 定制阅读器操作化可公开复核，并显示短篇结果和动机假设存在大量null或不稳定性。
- **independent_correction_supports：** 完整小说可在词级受控眼动中研究；读时分布、语言、分词、材料、实验程序和理解题会改变解释。
- **release_audit_supports：** 论文材料包不足以端到端复算整本与Kindle结果，成熟判断依靠可定位全文而非伪称开放原始日志。
- **project_translation：** 若未来用户批准特定有限试验，可把版本、文本位置、会话、事件、缺失、设备和行为维度作为审计层，与自然章、事件、人物状态及读者报告并列。
- **not_supported：** 页面可见就是注意；连续投入就是沉浸；慢读就是困难；快读就是略读；回看就是混乱；退出就是文本差；完成就是满意；研究阈值就是平台留存；英语电子书结果就是中文网文；行为关联就是文本因果；据此生成、修复、删改、分章分卷、评分或预测付费。

## G. 主要批评、负面结果与内部冲突

1. **仪器—心理鸿沟：** 页面可见、焦点状态和时间戳不能识别走神、理解、情绪或记忆。
2. **阈值依赖：** 1秒、15秒、5分钟、60分钟、15%和70页均会重塑结果，必须视为分析选择。
3. **伪迹规模大：** 498名参与者的3,044个会话被判伪迹，占48.82%；自然设备数据远非天然干净。
4. **选择样本：** 729人中624名女性、581名英语母语者，教育和动机偏高；不能代表一般成人或低频读者。
5. **自选书混淆：** 作品差异与读者偏好、能力和动机共同进入轨迹，不能用书间行为比较判质量。
6. **疫情历史边界：** 79.8%更多时间在家，44.9%认为习惯受影响；居家率不是常态定律。
7. **退出非随机：** 284名未完成者缺末测情境动机和体验；只能报告行为差异，不能断言低动机导致退出。
8. **多项假设为空或不稳：** 情境动机只稳定关联阈值后持续，其他行为多无关联；语境动机频率结果跨模型不完全复现；电子经验结果混合或反向。
9. **位置效应非叙事效应：** 开头慢、早期更非线性和会话末更切换可由熟悉度、文本、期限和选择性退出解释。
10. **设备非随机：** e-ink连续投入较长不证明e-ink造成专注；设备选择可能对应地点、目的和读者类型。
11. **企业日志噪声：** 缺字段、重叠、嵌套、短会话和119小时极端值说明平台日志必须逐级审计。
12. **书目识别不足：** 3,262本中仅29.4%识别；未知文本不能默认是小说，更不能默认完整长篇。
13. **时间错位：** 捐赠行为最长跨11.2年，而动机/体验只在捐赠时测一次。
14. **短篇前驱非独立整本复制：** 同一研究团队、短文本、几乎全完成；只支持方法而不复制退出结论。
15. **受控整本不等于日常阅读：** GECO有固定长会话、下巴托、校准和理解题；GECO-CN还有前章摘要与禁止回看。
16. **中文边界：** GECO-CN是高教育双语研究生和翻译文本；高跳词有多个竞争解释，不能外推中文网文读者。
17. **发布复现缺口：** 核心整本和Kindle原始日志/代码未发布；窄成熟依赖多源可定位审计，不声称计算复制。

## H. 冻结不等式与竞争解释

- `page_visible != attentive_reading`
- `page_time != comprehension_or_affect`
- `continuous_engagement != immersion`
- `nonlinear_navigation != confusion_or_quality`
- `speed_change != narrative_effect`
- `research_threshold_completion != platform_retention`
- `self_selected_book_association != text_causal_effect`
- `observer_aware_logs != unobserved_everyday_behavior`
- `same_program_short_story != independent_full_novel_replication`
- `controlled_complete_novel != ecological_session_history`
- `English_e_book_reader != Chinese_webnovel_reader`
- `individual_silent_trajectory != follow_retention_payment`

竞争解释包括：慢读可能是困难、欣赏、分心、词汇陌生、屏幕布局或笔记；快读可能是流畅、略读、重复阅读或基线偏差；回看可能是记忆恢复、线索核对、界面刷新、误操作或叙事不清；退出可能是时间不足、设备转换、另有纸书/应用、研究期限、作品偏好或技术问题；会话末切换可能是疲劳，也可能是自然结束前的界面操作；e-ink长连续投入可能来自设备，也可能来自主动选择在安静情境使用e-ink；中文高跳词可能来自篇章可预测性、字体、简体字、翻译和分词单位。

## I. 与本项目的有限转译

当前不分析用户小说，不接入平台账户，不运行真实读者实验，不生成、修复或评分文本。只有用户另行明确批准具体文本、合法数据和有限试验后，才可建立：

1. `work/version/book length/natural unit map`；
2. `reader pseudonymous ID/account-sharing uncertainty`；
3. `raw event/timestamp/text location/device/window/state`；
4. `preprocessing version/threshold/artifact/exclusion reason`；
5. `session ID/order/inter-session gap/progress/completion-or-attrition`；
6. `frequency/persistence/continuous engagement/task switching/speed/nonlinearity`分栏；
7. `questionnaire/report timestamp/missingness/ceiling`；
8. `text feature or natural chapter alignment`与`causal status`分栏；
9. `cognition/affect/quality/platform/payment unobserved`显式标记；
10. `alternative explanation/sensitivity/held-out validation`。

即使获批，也必须把T070与T006/T060认知事件模型、T013/T037/T052自然结构、T017中文词级加工、T023设备版式、T051故事/话语双端、T063摘要选择和T065可见评论并列。没有同步认知/情感、人类评价、文本版本对照和平台结果，不得把行为轨迹升级成创作规则。

## J. 实际诊断价值

T070最有价值地回答：“一个所谓整本阅读行为证据，究竟记录了哪些读者、哪些文本位置、哪些会话和哪些退出，又有哪些心理与商业结论根本不能从中得到？”

- 日志的最小事件、时间、位置和设备字段是否完整；
- 页面可见、失焦、遮罩和长时无活动怎样操作化；
- 会话切分、伪迹排除和阈值改变后结果是否稳定；
- 完成者与退出者是否同时保留，末测缺失是否被当作非随机；
- 五类行为是否分开报告而非压成单一投入分；
- 均值之外是否保留个体、书、会话和长尾分布；
- 回看/前跳是否排查刷新、布局和误操作；
- 设备和地点是否只是观察性选择；
- 问卷时间是否真正对应行为窗口；
- 书目、体裁、账户归属和企业日志错误是否可审计；
- 英语页级结果迁移中文时是否处理分词、字号、翻译和跳词；
- 是否误把研究完成写成平台留存、满意或质量；
- 是否误把行为关联写成文本因果或自动写作处方。

其成熟诊断身份是`ecological_full_length_e_reading_session_navigation_attrition_and_inference_boundary_audit`。

## K. 与其他理论的关系

- 与T002：`serial_production_feedback_vs_silent_reading_trajectory`
- 与T006：`cognitive_event_segmentation_vs_observable_page_session_behavior`
- 与T013：`long_form_structure_vs_reader_progress_coordinate`
- 与T014：`local_stylistic_processing_vs_coarse_page_trace`
- 与T017：`Chinese_word_eye_movement_vs_full_novel_ecological_behavior`
- 与T023：`display_layout_mechanism_vs_observational_device_selection`
- 与T029：`long_text_navigation_affordance_vs_individual_longitudinal_logs`
- 与T037：`natural_chapter_boundary_vs_research_session_and_threshold`
- 与T041：`tense_affect_processing_vs_behavioral_trace`
- 与T048：`narrative_clock_time_vs_wall_clock_reading_session`
- 与T049：`narrated_duration_vs_reading_duration`
- 与T051：`fabula_endpoints_vs_reading_progress`
- 与T052：`chapter_transition_vs_session_resume`
- 与T060：`reader_event_model_memory_vs_observable_behavior`
- 与T063：`summary_content_selection_vs_page_navigation`
- 与T065：`visible_comments_vs_silent_individual_trace`
- 与T069：`text_function_labels_vs_reader_behavior`

## L. 最终状态与重审条件

**当前状态：`mature`。**

冻结的窄身份：

`observable_full_length_e_reading_event/session/progress/attrition/navigation/device_trace + explicit_operationalization/missingness/selection_boundary + controlled_complete_novel_scope_correction`

不冻结：

`attention + comprehension + affect + immersion + intrinsic_quality + natural_chapter_or_volume_structure + text_causal_effect + Chinese_webnovel_transfer + follow/retention/payment + automatic_writing_rules`

以下扩展只有取得相应直接证据后才重审，不能反向改变当前窄成熟身份：

1. 中文原生长篇或连载平台中的个体级、沉默读者完整轨迹；
2. 同一文本版本下自然章/卷、页面行为与直接人类理解/情感的时间对齐；
3. 真实追读、留存、付费、推荐曝光和退出原因；
4. 析因、随机、自然实验或等价设计识别文本/界面/设备的因果作用；
5. 预注册阈值敏感性、命名IAA/裁决或多模态三角验证；
6. 多账户/多设备身份解析与书目、体裁、语言高覆盖识别；
7. Chapter 5/6原始日志、分析代码和机器可读结果的合法开放；
8. 若提出创作或修复规则，须另获用户批准并通过文本版本、独立人评、真实读者结果和不利验证。

T070的成熟不会关闭自然章/卷fabula、稳定多人物线路、中文网文平台因果或自动写作缺口。长期目标继续`active`。
