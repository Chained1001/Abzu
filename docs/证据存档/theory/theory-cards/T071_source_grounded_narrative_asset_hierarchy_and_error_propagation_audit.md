# T071 来源落地叙事资产—Episode/Storyline层级检索与自动误差传播审计研究候选纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T071
- **候选ID：** QF-135
- **标准名称：** 来源落地叙事资产—Episode/Storyline层级检索与自动误差传播审计研究候选纲领
- **英文名称：** Source-Grounded Narrative Asset, Episode/Storyline Hierarchy, Retrieval, and Error-Propagation Audit Candidate Program
- **核心作者：** Qiuyu Tian；Fengyi Chen；Yiding Li；Youyong Kong；Fan Guo；Yuyao Li；Jinjing Shen；Zhijing Xie；Yiyun Luo；Xin Zhang；Yingce Xia；Zequn Liu
- **理论类型：** `source_grounded_narrative_asset_hierarchy_and_error_propagation_audit_candidate`
- **学科来源：** natural language processing；computational narratology；retrieval-augmented generation；knowledge graphs
- **当前状态：** `provisional`

T071保存一个真实但未成熟的增量：NKW把原文证据、稳定实体、事件/互动/情境、原子事实、时变人物档案、Episode、Storyline和查询工具组织成可回查的多层叙事资产；SABER先清除Episode关系环，再对冗余语义捷径作延迟LLM裁决；主实验与消融显示这些层级对完整电影剧本的时间、因果和叙事推进问答有贡献。

它不能升级为成熟的长篇线路状态理论。论文没有给Episode/Storyline层的人类gold、命名IAA、全图召回或端到端误差率；作者明确承认上游事件、身份和事实漏检/误并会向后传播。固定仓库有实现代码和QuALITY材料，却没有公开完整151部剧本的中间资产、STAGE/FairytaleQA主表重建包或独立验证；仓库无许可证，原始配置还含疑似凭据。因此“代码存在”“下游QA有消融增益”“自动中间层语义正确”必须分开。

## B. 原始研究问题与对象

NKW的原始问题不是怎样创作好小说，而是：当长篇问答需要跨越人物状态、关系、时间、因果和情节推进时，能否在扁平文本检索之外建立来源落地的叙事资产，并让查询端在文本、图和叙事通道之间组装证据。[QF135-P1, pp.1-5]

核心评测包括：STAGE的151部完整电影剧本（109部英文、42部中文），FairytaleQA的278篇儿童故事/10,580个问题，以及QuALITY的162篇英语长文/2,523道选择题。三者分别偏向完整剧本世界、较短故事问答和长文选择题，不能被合并成同一种“长篇理解”。图资产详细统计只报告Qwen3-235B设置中的40部STAGE剧本；31部含必须破环的强连通分量。[QF135-P1, pp.5-8,21-23]

## C. 核心机制与理论单位

1. **稳定实体骨干。** 每个chunk抽取实体与关系并保留来源ID；人物、地点、时间点、物件、机构、社会角色等先规范为canonical entity，而不是让每个场景别名形成新身份。[QF135-P1, p.3]
2. **来源落地叙事单元。** 事件表示行动、发现、决定、到离、过程或状态变化；互动表示定向交流、冲突、合作或影响；情境表示持续局面、制度约束、社会规范和背景条件。它们保留文本来源，不因进入图而失去原句回查。[QF135-P1, pp.3-4]
3. **原子事实与时变档案。** 系统回访实体关联来源，抽取状态、行动、目标、因果角色、心理状态和持续关系，再合并为时敏人物属性与摘要。该档案是模型抽取产物，不是完备知识/资源/承诺账本。[QF135-P1, p.4]
4. **Episode聚合。** 事件、互动和情境按共享参与者、目标、冲突、时间连续、因果依赖、语义相似及来源支持聚合为Episode。Episode可保留scene/chunk来源，但不被当成自然Storyline边界。[QF135-P1, p.4]
5. **Episode关系。** 系统预测`causes`、`elaborates`和`precedes`，其依据混合来源顺序、共享参与者、词汇/内容相似与图邻居；这些边不是人类标注的客观因果真值。[QF135-P1, p.4]
6. **SABER破环。** 先按置信度与关系类型权重删除强连通分量中最弱边，形成DAG；只在骨架稳定后把仍可疑的三角捷径交给LLM判断是否被间接路径覆盖。[QF135-P1, pp.4,13]
7. **Trunk-branch分段。** 在Episode DAG上枚举有界源到汇路径，放入trie，按共享trunk、分支延续和终止路径提取候选链；过长链在分支或低支持点切分。[QF135-P1, pp.4,14]
8. **Storyline层。** Storyline节点由Episode链支持，并可预测blocking、resolving、prerequisite、conflict和parallel等Storyline关系。这里的Storyline是自动检索结构，不是天然情节线或作者意图。[QF135-P1, pp.4,14]
9. **通道分离。** 文本工具负责原文证据，图工具负责实体/关系，叙事工具负责事件—Episode—Storyline轨迹；所有通道只访问来源构建资产，不添加外部故事知识。[QF135-P1, pp.5,15-17]
10. **证据组装。** 查询先执行强制多通道召回，再允许最多两轮、每轮最多五个Agent自选工具调用；最终答案从证据包而不是单一检索结果生成。[QF135-P1, pp.5-7,23]
11. **阅读技能。** 查询端另检查actor、scope、polarity、state和temporal position。技能贡献只做聚合消融，没有给每种技能设计、选择和交互效应的细分验证。[QF135-P1, pp.5,7-9]
12. **下游展示。** 连续性检查用共享实体缩小场景对，再以LLM成对判断和chain critic形成生产布景连续性假说；人物状态模块只抽可见行动、表情、姿态和语调，并画scene swimlane。这些是应用展示，不是人类生产团队效度试验。[QF135-P1, pp.8,23-26]
13. **来源链接不是语义真值。** 最终回答能回到原文，只证明来源可查；若上游漏掉事件、误并身份或抽错事实，Episode、Storyline、检索和答案仍会继承错误。[QF135-P1, p.9]

## D. 命题—证据总表

完整命题见`05_CLAIM_EVIDENCE_MATRIX.csv`。裁决主干如下：

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T071-C001 | NKW构建`G,U,F,P,H,X`来源落地资产包 | QF135-P1 pp.3-5 | 核心定义 | 资产包不是人类故事真值 |
| T071-C006 | Episode关系为causes/elaborates/precedes并经SABER清理 | QF135-P1 pp.4,13 | 直接机制 | 输入边由自动/启发式混合生成 |
| T071-C009 | Storyline由DAG trunk-branch候选链形成 | QF135-P1 pp.4,14 | 直接机制 | 链不是自然章节/卷/情节线gold |
| T071-C014 | Qwen3-235B在STAGE为Overall .7012/Pass@5 .8148 | QF135-P1 p.6 Table 1 | 直接下游结果 | 不是中间层准确率 |
| T071-C018 | 移除Episode/Storyline聚合使STAGE下降.0531/.0733 | QF135-P1 p.7 Table 4 | 组件消融 | 不识别哪条自动链正确 |
| T071-C022 | STAGE语义答案由DeepSeek-V4五次随机判断多数票 | QF135-P1 pp.5,17-18 | 评价协议 | 同一LLM重复不是独立人类复标 |
| T071-C023 | STAGE judge内部一致88.5%、alpha .76 | QF135-P1 p.18 Table B.1 | LLM内部稳定性 | 不是Episode/Storyline IAA |
| T071-C025 | 40部剧本平均78.50 Episodes、8.35 Storylines | QF135-P1 pp.21-22 Table B.8 | 资产规模 | 数量不是语义质量 |
| T071-C027 | 151部中31部需严格破环 | QF135-P1 pp.22-23 | 直接图噪声边界 | 冗余捷径在更广语料仍普遍 |
| T071-C029 | 案例仍混淆起始事件/后果、局部目标/全局弧、说话者/触发 | QF135-P1 pp.19-21 | 直接失败案例 | 长程结构不能替代局部精确归因 |
| T071-C031 | 作者承认上游漏检/误并会传播到后续检索与推理 | QF135-P1 p.9 | 作者自报核心限制 | 没有给端到端传播率 |
| T071-C033 | 固定仓库有实现但无完整主实验中间资产 | QF135-D1 | 发布范围审计 | 代码存在不等于结果可重建 |
| T071-C034 | 仓库无许可证且原始配置含疑似凭据 | QF135-D1 | 安全/许可边界 | 原始ZIP不得入库或执行 |
| T071-C036 | 证据只支持候选层级与误差审计 | cross-source | 有界项目综合 | 不形成自动写作或质量规则 |

## E. 来源身份与实际读取深度

### QF135-P1

- **身份：** Tian等，2026，*Narrative Knowledge Weaver: Narrative-Centric Retrieval-Augmented Reasoning for Long-Form Text Understanding*，arXiv `2606.05724v1`，DOI `10.48550/arXiv.2606.05724`。
- **读取：** 26页全文；方法pp.1-5，评测与主结果pp.5-8，限制p.9，算法与工具pp.13-17，judge与案例pp.17-21，资产/SABER统计pp.21-23，查询和下游应用pp.23-26；主表与限制页已渲染目检。
- **许可：** PDF元数据标记CC BY 4.0。
- **SHA-256：** `692F316F0B4208ED64707A9690F773D35BF8C53EF2C9C80691B305AF0D793D14`。
- **边界：** arXiv v1；没有独立同行评审复制或中间层人类金标。

### QF135-D1

- **身份：** 固定GitHub commit `f726d40b8763df2bc9a7e6d2f64c4f8492a6b2b1`的静态发布范围与安全审计记录。
- **读取：** 626条完整API树、560个blob静态清单；README、叙事构建器、提示/schema、examples、QuALITY实验树、release/Hugging Face/许可证和敏感形态检查。
- **正面：** 证明Event -> Episode -> Storyline代码、查询工具和QuALITY实验材料确实存在。
- **不利：** 无STAGE/FairytaleQA路径、无完整151部中间资产、无公开`data/narrative_graph`成品、无主表重建包、无LICENSE、零release、无项目HF条目。
- **安全边界：** 四个配置包含同一51字符`sk-`形态值；未记录、显示、测试或复制。原始ZIP不进项目，代码不执行。
- **审计记录SHA-256：** `14563417D013C8123A867A2FF20613829F54E8541B2560C1A30B8F72C4F81DA2`。

没有独立批评、竞争、修正或复制来源。QF135-D1是同一项目的发布审计，不得冒充独立验证。

## F. 原义、发布审计、项目转译与假设分离

- **原始理论原义：** QF135-P1的来源落地实体/叙事资产、Episode/Storyline聚合、SABER、通道分离查询、阅读技能和三基准问答。
- **同项目发布审计：** QF135-D1只说明固定提交实际发布什么、缺什么以及安全/许可状态；它不验证论文结果。
- **项目转译：** 仅在未来经用户批准的有限文本试验中，可把每条自动资产连接到版本、自然容器、原文跨度、来源、算法版本、人工裁决和下游错误。这个审计表是项目接口，不是论文现成写作法。
- **项目假设：** 自动Episode可与自然章/卷fabula对齐、Storyline可成为稳定跨人物线路、SABER清理能提高真实结构正确率、结构错误可预测读者或质量，均未得到当前证据支持。

## G. 主要批评、负面结果与内部冲突

1. **完整叙事不等于小说自然结构。** STAGE是电影剧本；scene容器和剧本格式不能替代小说自然章、卷或part。
2. **下游正确不等于中间层正确。** 问答可能依赖局部文本、实体图、强模型先验或多次采样；Episode/Storyline消融只表明组件有用，不给结构precision/recall。
3. **评价者非独立人类。** STAGE/FairytaleQA语义正确由同一LLM judge重复五次；88.5%和alpha .76是随机judge内部一致，不是专家IAA。
4. **图资产统计不覆盖全部主语料。** 详细资产只报告40部Qwen3-235B设置，不能冒充151部完整发布审计。
5. **上游误差明确传播。** 作者承认事件、身份和事实漏检/误并会向后继承，却没有报告自然错误gold、全图召回或端到端误差分解。
6. **环与捷径本身是噪声证据。** 31部需要破环、广泛存在冗余语义捷径；SABER改善问答并不证明剩余DAG是唯一正确因果/时间图。
7. **失败集中在关键边界。** 系统仍把显著后果当起始事件、把全局关系弧当局部目标，并误认说话者和即时因果触发。
8. **FairytaleQA/QuALITY增益不稳定。** 轻量检索在较局部任务常更强；多轮Agent主要改善Pass@5，不总改善一次Overall。
9. **应用展示没有人类效度。** 生产连续性链和人物状态swimlane没有生产团队对照、gold、IAA或现场成本/收益验证。
10. **时变档案不完备。** 属性、目标、关系摘要没有类型化知识、资源、承诺、权限、客观因果和历史版本的完整账本。
11. **公开资产不足。** 固定仓库无法端到端重建主论文STAGE/FairytaleQA结果，也没有完整自动中间层可供独立抽样复标。
12. **许可与凭据风险。** 无LICENSE且配置疑似含凭据；安全复制、执行和再分发均受阻。
13. **无独立修正链。** 当前只有作者论文和同项目仓库，未满足成熟理论所需的独立批评、竞争、修正或后续验证。
14. **无读者/质量因果。** 三个基准只测问答正确性；不能推出文本质量、悬念、追读、留存、付费或创作成功。

## H. 冻结不等式与竞争解释

```text
source_linked != semantically_correct
canonical_entity != identity_gold
episode != natural_scene_or_chapter
storyline != stable_cross_character_plotline
episode_DAG != objective_causal_truth
cycle_removed != graph_recall_preserved
downstream_QA_gain != intermediate_layer_accuracy
five_stochastic_LLM_judgments != independent_human_IAA
40_screenplay_asset_statistics != released_151_screenplay_assets
observable_character_state != complete_goal_knowledge_resource_commitment_state
production_continuity_hypothesis != validated_production_plan
repository_code_exists != paper_results_reproducible
preprint_and_same_project_repository != independent_validation
screenplay_QA != Chinese_webnovel_reader_or_quality_evidence
```

主要竞争解释包括：大模型本身的故事知识、更多工具调用和采样预算、局部文本命中、实体规范化而非Storyline结构、LLM judge共享偏差、显著性偏置、scene格式提供的强先验，以及对错误中间层的查询端补偿。

## I. 与本项目的有限转译

只有用户另行批准具体文本试验后，才可建立：

`version_id | natural_container_id | chunk_id | source_span | canonical_entity_id | alias_evidence | event_id | interaction_id | occasion_id | atomic_fact_id | entity_profile_version | episode_id | episode_support_ids | episode_relation | episode_relation_evidence | saber_removed_edge | storyline_id_candidate | storyline_episode_ids | storyline_relation | source_link | extraction_model | prompt_version | confidence | human_reviewer | alternative_structure | adjudication | upstream_error | downstream_error | recall_status`

顺序固定为：

1. 先冻结版本、自然容器与原文跨度，不让自动Episode覆盖章/卷边界。
2. 抽取实体、事件、互动、情境和原子事实时保留模型/提示/来源及未抽取候选。
3. Episode关系、SABER删边和Storyline链分别存档，删边不能静默消失。
4. 独立人工抽样检查身份、单元、边和遗漏；没有gold时报告`automatic_hierarchy_unvalidated`。
5. 与T061的目标/信念/计划、T062的人物弧、T059的区间meeting和T051的双端时间图分栏。
6. 只报告实际下游任务变化；不得把问答提升改写成作品质量或写作处方。

## J. 实际诊断价值

在不分析用户文本的当前阶段，T071提供五个可操作的未来审计问题：

1. 每个Episode/Storyline能否回到明确原文，而不是只回到模型摘要？
2. 自动层级漏掉了哪些低显著但后续关键的事件、关系和状态？
3. 破环和捷径剪枝删除了哪些真实循环、复现、并行情节或多重因果？
4. 查询成功究竟来自文本、实体图、叙事层还是额外采样/工具预算？
5. 局部说话者、即时目标和因果触发是否被全局弧的高显著摘要覆盖？

这些问题能诊断自动叙事表示的证据链，不能自动诊断一部小说写得好不好，更不能授权生成、重写、删边、调序、分章分卷或评分。

## K. 与现有理论的关系

- **T036：** T036保存多情节协调状态；T071自动形成检索Storyline，但没有完整状态依赖或稳定线路gold。
- **T040：** T040生成场景—Storyline检索树；T071新增来源落地事件、Episode DAG、SABER和通道分离查询，但同样缺中间层人类真值。
- **T043：** T043有人工时间关系图和不确定性；T071的precedes/causes是自动Episode边，不能替代多轴时间标注。
- **T051：** T051提供文本/故事四端点和双端空隙；T071不提供自然章卷完整fabula双端。
- **T053：** T053保存多世界/模态可及性；T071实体/事件图没有严格替代世界身份和可及性语义。
- **T059：** T059严格消费给定实体—区间—meeting；T071新增自动情节聚合但没有meeting双端、并发约束或稳定状态。
- **T060：** T060解释读者事件模型更新；T071是机器检索资产，不能反推读者心理表征。
- **T061：** T061细分目标/信念/计划/尝试/结果；T071的人物档案较粗，却新增长文自动层级和误差传播接口。
- **T062：** T062公开151部剧本人物时间线/弧和抽样验证；T071复用STAGE方向并新增通用Episode/Storyline检索，但没有T062的公开完整任务资产或独立人物弧验证。
- **T063：** T063直接审计整书摘要遗漏；T071可回源但没有完整内容选择召回，Storyline摘要仍可能漏主线。
- **T067：** T067是生成期共享字典和目标刷新；T071是分析期自动资产，两者都缺类型化完整状态历史和多位人类全篇验证。
- **T068：** T068审计局部人物行动选择；T071案例表明全局弧会遮蔽局部目标、说话者和即时触发，二者形成直接误差接口。
- **T069：** T069保留整书分句E/S/C功能与分歧；T071聚合更高层事件/Storyline，但不提供完整原文分句功能gold或自然章功能效度。
- **T070：** T070是人类整本阅读行为；T071是机器对文本的检索结构，问答增益不能预测阅读速度、退出、质量或平台结果。

以上关系均为`emergent_provisional_structure`。

## L. 最终状态与重审条件

**当前状态：`provisional`。**

正面证据包括完整26页方法与评测、三基准、多模型主表、组件消融、问题类型分析、SABER对照、图资产统计、失败案例和明确上游误差声明；固定仓库又证明核心构建逻辑确实存在。

不成熟原因包括：arXiv v1；没有独立批评/复制；Episode/Storyline无人工gold、IAA、precision/recall或全图召回；完整151部中间资产和主实验重建包未发布；同一LLM judge内部一致被误当人类可靠性的风险；应用无真实用户验证；固定仓库无许可证且原始配置含疑似凭据。

升级至少需要：公开完整且许可明确的STAGE/FairytaleQA构建资产与可重建结果；独立团队固定环境复制；自然错误而非合成注错的实体/事件/Episode/Storyline gold；命名IAA、分歧和裁决；全图召回和删边影响；端到端误差传播；稳定跨人物`storyline_id`及目标/知识/资源/承诺/关系/客观因果历史；自然章/卷双端；至少一个现代中文长篇/网文复制。即使满足，也仍需另证读者和质量结果，不能自动变成写作处方。

用户未批准文本试验；本轮没有分析小说文本、调用子Agent、使用Hook或执行第三方仓库代码。长期目标保持`active`。
