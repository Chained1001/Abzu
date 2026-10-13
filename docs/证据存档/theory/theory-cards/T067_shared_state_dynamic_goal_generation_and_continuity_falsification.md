# T067 长篇多角色共享状态—动态目标生成与图式连续性证伪研究候选纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T067
- **候选ID：** QF-130
- **标准名称：** 长篇多角色共享状态—动态目标生成与图式连续性证伪研究候选纲领
- **英文名称：** Long-Form Multi-Character Shared-State, Dynamic-Goal Generation, and Graph-Grounded Continuity Falsification Program
- **理论类型：** `validation_limited_longform_shared_state_dynamic_goal_generation_and_continuity_falsification_candidate_program`
- **核心生成来源：** Aluru et al. 2026，*From Personas to Plot*（MAGNET/ATLAS，arXiv v1）
- **独立整书关系修正：** Sancheti与Rudinger 2025，*Tracking Evolving Relationship Between Characters in Books*
- **独立长输出连续性修正：** Li et al. 2026，*Lost in Stories*（ConStory-Bench）
- **固定实现/数据审计：** ConStory-Bench代码commit `3f4195adda94d977ad9bd56f58ec51eaf1a1cd93`；数据commit `acaffac048c382eb2d5cb7bfbea3ad99a01d2f6e`的`prompts.parquet`
- **当前状态：** `provisional`

T067的净增量不是泛泛的“人物要一致”，而是一条可分解、可反驳的生成—验证链：人物agent根据persona、当前目标、近期文本与共享状态提出行动；critic审查行动并提出状态更新；narrator只选择部分行动写成下一段；只有被选行动的状态更新进入后续轮次；目标在停滞或轨迹重复时刷新；另一条ATLAS/ConStory链再把当前场景的事实与较早事实配成可定位矛盾证据。

这个增量只能暂存。MAGNET最长设置每系统只有一篇约100页故事，主要评审者是LLM，一名人类只核验一篇20页故事中的既有评语和偏好。共享状态虽然源自有向图，却在实际生成中扁平化为字典并用最新值覆写；它没有稳定`storyline_id`，也没有目标、知识、资源、承诺、关系与客观因果的完整类型化历史。独立整书关系研究显示“关系是什么”与“关系如何变化”的可靠性差异很大；ConStory的合成注错验证和公开提示表也有明确边界。因此，T067是实际长篇生成与连续性证伪的候选研究纲领，不是成熟的长篇线路状态理论或写作系统。

## B. 原始研究问题与对象

MAGNET的原始问题是：多个人物persona与持续更新的故事目标通过共享世界状态互动时，能否生成更连贯的长篇叙事？对象是系统生成的英语prose：2页、20页和100页三个长度设置，以及由LLM editor、成对rubric和ATLAS给出的评价。[QF130-P1, §§1,3-4]

ATLAS的对象不是全部叙事意义，而是场景级图式事实冲突：从当前场景抽取实体/状态属性，与此前场景的世界表示比较，提出候选hallucination，再回到文本证据核验。[QF130-P1, §3.5]

Sancheti与Rudinger的对象是11部2023年英语爱情小说中每部一对主角的关系轨迹。每个同时提及两人的段落输出“关系类型 + 正向/负向/稳定演化”，并比较完整相关段、运行摘要加当前段和完整摘要三种上下文策略。[QF130-V1, pp.64-71]

ConStory-Bench的对象是2000条长故事生成提示、目标8k-10k词的模型输出，以及五大类19子类的连续性矛盾。它提供可定位的事实—矛盾证据链，但并不提供自然小说的完整人物线路或文学质量金标。[QF130-V2, pp.8400-8407]

四种对象必须分开：

1. `generated_action/state`：生成系统内部控制对象；
2. `pairwise_relationship_trajectory`：完整书中一对人物的解释性状态序列；
3. `evidence_grounded_contradiction`：两个文本跨度间的二元不一致；
4. `natural_longform_structure/quality`：自然章卷、完整线路、读者或文学质量；前三者都不能自动替代第四者。

## C. 核心机制与理论单位

1. **Persona条件化行动：** 人物persona含关系、性格、目标、描述、角色、位置和能力；每轮agent据persona、当前故事目标、近期历史和相关状态提出行动。[QF130-P1, §3.1]
2. **Critic门控：** critic检查行动是否相关、具体、符合人物和场景、推进目标且不重复；若拒绝则反馈重提，若接受则提出与该行动相关的世界更新。[QF130-P1, §3.2]
3. **Narrator选择与文本化：** narrator接收所有候选行动、当前状态、目标和既有段落，只选适合当前场景的行动并写成下一段。[QF130-P1, §3.2]
4. **提交语义：** 只有narrator选中的行动之更新被写入共享状态；未选行动没有世界后果。[QF130-P1, Algorithm 1]
5. **图—字典投影：** 状态概念上是根、人物和状态节点组成的有向图，但供agent使用时被扁平化为字典。[QF130-P1, §3.3]
6. **最新值覆写：** 新key插入；已有key直接由新值替换。该实现缺少旧值、变更原因、观察来源、持有者知识和置信的强制记录。[QF130-P1, §3.3]
7. **动态目标控制：** 未完成目标15步后刷新；每40步切换故事领域。两阈值来自作者观察到动作和目标轨迹重复后的经验选择，不是经跨故事析因验证的自然结构常数。[QF130-P1, §3.1]
8. **图式证伪：** ATLAS/ConStory不只给总体分数，而是返回候选事实、冲突事实、类别和原文位置，使连续性判断可被人工推翻或确认。[QF130-P1, §3.5; QF130-V2, §2.3]
9. **关系状态二分：** 完整书中的`relationship_type`与`relationship_evolution`是不同标注对象；前者相对容易，后者在局部逐点判断中人类和模型一致性都明显更低。[QF130-V1, pp.68-71]
10. **状态完整性不是矛盾数：** 某个已抽出的事实没有被后文矛盾，不代表关键人物、目标、资源、承诺、因果或线路节点没有遗漏；precision也不能替代全图recall。

## D. 命题—证据总表

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T067-C001-C006 | persona、行动—critic—narrator—提交、图—字典和15/40目标控制构成MAGNET机制 | QF130-P1 §§3.1-3.3, Algorithm 1 | 核心原始机制 | 经验阈值和自由字典不是自然长篇结构定律 |
| T067-C007 | 2/20页各3篇，100页仅1篇proof of concept | QF130-P1 §4.1 | 直接样本边界 | 无长设置重复或不确定性 |
| T067-C008 | IBSEN以剧本而MAGNET以prose输出 | QF130-P1 §4.2 | 直接基线边界 | 格式差异混入比较 |
| T067-C009-C011 | 100页编辑数82对123/116，rubric较高，ATLAS为6对12/11；20页ATLAS全0 | QF130-P1 Tables 2-4 | 原始结果与地板效应 | LLM主评、n=1、无自然错误全量gold |
| T067-C012 | 一名人类核一篇20页：75条编辑判断92.0%，44个成对判断95.5% | QF130-P1 §4.4 | 原始核验 | 同意既有LLM输出，不是多读者IAA |
| T067-C013-C014 | ATLAS在3部合成剧本40个gold上F1 .853，小模型F1 .361 | QF130-P1 Table 1/Appendix | 合成注错验证 | 单人核验、同类模型生成、不能代表自然召回 |
| T067-C015 | 单篇20页组件消融均增加LLM编辑标注 | QF130-P1 Table 6 | 方向性消融 | n=1、组件纠缠、无显著性 |
| T067-C016 | 论文与代码都没有稳定线路和完整类型化状态；当前默认运行栈不同 | QF130-P1 §6/repository audit | 限制与实现审计 | 不能声明论文效果已由当前仓库复现 |
| T067-C017-C020 | 11部完整爱情小说、一对主角、100-200词段、关系类型+演化、三上下文策略 | QF130-V1 §§2-5 | 独立整书对象 | 书不开放、对称单标签、一对/书 |
| T067-C021 | 运行摘要+当前段跨模型α为.24/.20/.13；完整摘要.22/.08/.11 | QF130-V1 Figure 3 | 独立不利一致性 | 流畅摘要不保证关系演化稳定 |
| T067-C022-C023 | 条件人工结果显示演化远难于关系类型；只抽高一致4书的有限分歧段 | QF130-V1 Table 2/Limitations | 独立有限验证 | 不是随机全点金标 |
| T067-C024 | 总体trope：多数54.54%，完整段63.64%，运行摘要21.21%，完整摘要6.06% | QF130-V1 Table 3 | 独立全书不利结果 | 只有11书，不能估一般效应 |
| T067-C025 | 线性情节、对称关系、摘要未独立验证、无全点gold | QF130-V1 Limitations | 独立范围边界 | 不能形成完整多人物线路状态 |
| T067-C026-C027 | ConStory有2000提示/19子类并输出精确证据跨度 | QF130-V2 §§1-2 | 独立基准机制 | 二元矛盾不覆盖遗漏、含混、揭示或质量 |
| T067-C028-C029 | 200篇/1000注错的两名快速人类F1 .281/.177、并集.374；checker F1 .678 | QF130-V2 diagnostic appendix | 独立但受限的注错验证 | 低报酬高吞吐，不能称机器超过认真自然阅读 |
| T067-C030 | 绝对时间/地理/记忆/视角平均证据间隔29.7/31.0/25.4/4.7% | QF130-V2 Table 5 | 独立位置结果 | 位置差不等于因果或章卷跨度 |
| T067-C031 | 英语西方小说、二元矛盾、含混/揭示与因果质量未测 | QF130-V2 §6 | 独立范围边界 | 错误密度不是文学/商业质量 |
| T067-C032 | 代码快照无原始诊断人工标注和1000注错 | QF130-D1 fixed tree | 发布审计 | 无法独立复算关键验证 |
| T067-C033-C035 | 提示表2000行但1991唯一，10行同一拒绝占位；12个zh标签含英文/非故事/乱码 | QF130-D2 all rows | 固定数据直接审计 | 有界质量控制缺陷，不等于全库失效 |
| T067-C036 | 三源只支持候选机制和证伪入口，不支持自然章卷、稳定线路、人类质量或商业结果 | cross-source | 项目综合 | 不形成自动写作规则 |

## E. 来源身份与实际读取深度

### QF130-P1

- **身份：** arXiv `2607.00918v1`，2026-07-01提交，预印本。
- **读取：** pp.1-23全文；两套算法、Tables 1-8、提示、模型栈、训练数据、消融、human verification、限制与伦理均核对；MAGNET仓库README及`environment.py`、`pipeline.py`、`sim_types.py`、`prompts.py`直接检查。
- **关键结果：** 100页LLM编辑总数123/116/82；ATLAS 12/11/6；成对rubric的MAGNET结果较高。
- **关键不利：** 100页每系统n=1；human verification只有一名人类和一篇20页；没有显著性/区间；IBSEN格式不同；状态覆写；无稳定线路类型；当前README默认运行模型栈与论文运行不同。
- **本地哈希：** `8B32EB03A2D116AC066C833942D34F59ACAFAB219B553C9DCE6FC7945465EF30`。

### QF130-V1

- **身份：** 2025 Workshop on Narrative Understanding同行评审论文，DOI `10.18653/v1/2025.wnu-1.12`，pp.64-82。
- **读取：** 数据、任务形式、三种策略、模型协议、agreement、人工局部评价、全局trope、消融和限制全读。
- **作用：** 它是对MAGNET自由关系字段的独立实质修正：真实完整书中，即使只追踪一对主角，关系演化也比关系类型难得多；运行摘要和完整摘要都可能丢失不同层次的信息。
- **关键不利：** 11部书均受版权限制；每书一对；人工局部评价条件化于高一致4书和有限分歧段；没有全部时间点gold。
- **本地哈希：** `CCE36751F2AAEF1A152FD367DD9E29086A636FF26CC55C22C58A5A8AA19FDD61`。

### QF130-V2

- **身份：** Findings ACL 2026同行评审论文，DOI `10.18653/v1/2026.findings-acl.410`，pp.8400-8428。
- **读取：** 2000提示、四任务、五类19子类、checker、模型结果、诊断注错、人类比较、位置分析、附录提示和限制全读。
- **作用：** 为知识、记忆、技能、时间、因果、事实、地理和视角连续性提供证据链式反证入口，也用诊断协议限制“LLM judge等于人类”的说法。
- **关键不利：** 注错而非自然错误；两名写手在两天内以每篇1美元处理全部200篇长故事；作者明确不处理含混、揭示和因果质量。
- **本地哈希：** `24CB6E59EA3CF790AF8A42612E3EF9B7895E1ED690101957CA095B870EFC2284`。

### QF130-D1

- **身份：** ConStory-Bench官方GitHub固定commit代码快照。
- **读取：** 29个文件全部枚举（含`.gitignore`），README、LICENSE、checker、评测代码、提示和assets检查，ZIP完整性校验。
- **作用：** 证明实现可定位并可审计，同时直接显示原始1000注错、两名人工标签和完整生成输出不在代码包内。
- **本地哈希：** `D969D7FE69DD641C143F0D1DD13BAE48A18357B057E5023BCE5DE519E91ADC3B`。

### QF130-D2

- **身份：** ConStory-Bench Hugging Face数据仓库固定commit的`prompts.parquet`单文件快照。
- **读取：** 2000行、4列、全部任务计数、null、唯一文本、重复组、语言标签和内容逐行审计。
- **结果：** 任务数751/432/422/395，与论文表一致；唯一提示1991；十行同一拒绝占位文本；12个`zh`标签中可见英文、非故事对象和乱码/混杂文本。
- **边界：** 整个数据仓库约13.58GB，本轮只固定提示表，不声称已下载或审计所有故事与模型输出。
- **本地哈希：** `47A052254D60F384B2DC36058040935A0CE0DE1E60066285EB0D51C807F3A7FD`。

## F. 原义、独立修正、项目转译与不受支持项

- **theory_directly_supports：** 人物persona、行动提议、critic门控、narrator选择、选中更新提交、图—字典投影、最新值覆写、动态目标刷新；三种生成长度的公开结果；ATLAS合成注错协议。
- **independent_validation_or_correction_supports：** 整书关系类型/演化的分离与低一致性；摘要策略对局部轨迹和总体trope的不同失败；ConStory的连续性分类、证据链和受限注错验证。
- **release_audit_supports：** ConStory代码包没有关键诊断gold；提示表存在可复核的重复拒绝占位和语言/对象污染。
- **project_translation：** 未来如果用户明确批准具体文本试验，可把“人物行动—候选状态变化—实际叙述提交—证据跨度—冲突/遗漏”作为人工诊断表的候选列，并同T035/T036/T051/T061对照。
- **project_hypothesis：** 类型化、带来源与历史的线路账本是否比自由覆写字典更可靠；关系类型/演化分开是否降低长篇状态错误；图式证伪是否能提高自然错误召回。这些都尚未实证。
- **not_supported：** 15步必换目标、40步必换大方向；最新值就是正确当前事实；LLM编辑少就是作品更好；一人同意就等于多读者可靠；合成注错F1就是自然长篇错误召回；100页就是中文网文长篇；矛盾少必然提高追读、留存或付费；据此自动续写、重写、修复、分章、分卷或评分用户文本。

## G. 主要批评、负面结果与内部冲突

1. **长度效应无重复：** 最重要的100页结果建立在每系统单篇故事上，无法区分系统效应、题材效应和一次采样波动。
2. **评审非独立：** 核心质量结果由LLM editor和rubric产生；human verification是一个人对既有判断的同意，不是多位读者独立评价整篇。
3. **基线格式混淆：** IBSEN输出戏剧脚本，编辑/语言问题可能受格式影响；差值不能全部分配给共享状态或动态目标。
4. **状态历史被覆写：** 当前值替换旧值，无法回答“何时改变、谁造成、谁知道、依据何在、是否被误报”。
5. **自由schema：** critic可输出任意world keys；保护字段很少；系统没有完整目标、知识、资源、承诺、关系和客观因果类型。
6. **无稳定线路：** 没有`storyline_id`、成员变更、长期意图、会合/分离条件、线级闭包或中间全图recall。
7. **阈值经验化：** 15/40步来自单计划观察，没有与自然章节、卷、阶段或人类感知边界对齐。
8. **ATLAS验证合成化：** 三个故事、40个gold、同类模型生成和单人核验，不足以估自然错误或遗漏召回。
9. **关系演化不可靠：** 完整书研究中，局部演化的人类α低至.26，模型跨模型α更低；只保存关系标签会漏变化方向和阶段。
10. **摘要不是状态账本：** 完整摘要在局部演化上较好，却在11书总体trope预测仅6.06%；运行摘要保留局部过程，却也没有形成稳定全书判断。
11. **ConStory人类比较边界：** 两名写手的低F1发生在两天、每篇1美元、注错gold条件下；不能作为“机器优于人”的一般证据。
12. **公开验证不完整：** 代码快照不含诊断人工标签和原始注错；提示表又与去重/质量控制说明存在有界冲突。
13. **构念混写风险：** 编辑标注、成对偏好、hallucination、关系演化、矛盾密度、文学质量与商业行为是不同因变量。
14. **外部效度不足：** 核心材料为英语生成文本、合成剧本、英语爱情小说和英语西方fiction提示，不覆盖现代中文多卷连载。

## H. 冻结不等式与竞争解释

- `shared_world_dictionary != stable_storyline_state_machine`
- `latest_value_overwrite != causal_or_epistemic_history`
- `single_100_page_story != replicated_longform_effect`
- `LLM_editor_count != human_intrinsic_quality`
- `single_human_agreement != multi_reader_IAA`
- `synthetic_injected_error_detection != natural_continuity_recall`
- `relationship_type != relationship_evolution`
- `flat_summary != complete_pairwise_trajectory`
- `contradiction_density != literary_quality_or_commercial_outcome`
- `generated_longform != Chinese_webnovel_or_serial_reader_validation`

竞争解释包括：MAGNET更少标注来自文体/长度/格式而非状态机制；narrator本身的大模型能力吸收了多数一致性工作；critic和editor共享模型偏好；覆写减少表面冲突却删除必要历史；动态换域增加新颖度但破坏长期意图；ATLAS只找到可表述为二元属性冲突的错误；ConStory的位置差由提示模板、输出长度或自动抽取偏差造成；关系演化分歧反映文学多解而不只是模型失败。

## I. 与本项目的有限转译

当前不分析用户小说，不调用MAGNET生成，不运行ATLAS/ConStory评分，也不修改生产文本。只有用户另行明确批准具体文本和有限试验后，才可建立以下人工可审计表：

1. `version / natural container / discourse position`；
2. `character_id / storyline_id candidate / current goal / long-term intention`；
3. `knowledge / source / uncertainty / resource / commitment / relationship type / relationship evolution`；
4. `proposed action / actually narrated action / before-state / after-state / change cause`；
5. `objective causal edge / character-believed edge / evidence spans / competing interpretation`；
6. `line pause / retrieval / convergence / separation condition`；
7. `extractor stage / node-edge recall / error propagation / human annotators / named IAA / adjudication`。

即便获批，也只允许把T067作为竞争候选：同T035关系轨迹、T036多线协调、T051双端时间、T061目标—信念—计划语义和T063摘要遗漏并列。输出必须显式区分`current_value`、`change_history`、`knowledge_holder`和`objective_fact`，不得把15/40阈值或编辑计数变成自动创作规则。

## J. 实际诊断价值

T067当前可以高价值地回答：“一个看似持续记忆世界状态的长篇生成系统，究竟真的维护了什么，又漏了什么？”

- persona、目标和状态是否由同一人物/线路稳定持有；
- narrator没有选择的行动是否被错误地留在世界状态中；
- 新值覆写旧值后，变化原因、时间和知识来源是否丢失；
- “关系是朋友”是否掩盖正在恶化、暂时修复或表面对立等演化；
- 某个状态更新是文本明示、人物推断、critic想象还是narrator补写；
- 当前只有矛盾precision，还是也检查遗漏、全图recall和错误传播；
- 100页优势是否有重复、区间、独立读者和保留题材；
- LLM editor、人工内在结构、真实读者结果和商业行为是否被混成一个“质量”；
- 公开数据和代码是否足以复算关键验证。

其不可替代性在于把“记忆”“目标”“多人协作”“连续性”和“验证”拆成具有提交语义、状态投影、证据跨度和失效点的链，而不是提供一般写作常识。当前诊断身份是`shared_state_generation_and_falsification_candidate_only`，不是可直接部署的创作方法。

## K. 与其他理论的关系

- 与T008：`explicit_narrative_planning_vs_dynamic_LLM_goal_control`
- 与T035：`validated_pairwise_relationship_trajectory_vs_freeform_relationship_state`
- 与T036：`multiplot_storyline_state_vs_shared_dictionary_generation`
- 与T040：`retrieval_storyline_hierarchy_vs_generation_world_state`
- 与T051：`fabula_syuzhet_endpoints_vs_turn_order_and_overwrite`
- 与T052：`natural_chapter_transition_vs_generated_page_progression`
- 与T057：`cross_volume_proxy_network_vs_single_generated_long_story`
- 与T058：`storyline_pause_retrieval_stitching_vs_goal_refresh_domain_shift`
- 与T060：`reader_event_model_update_vs_agent_world_state_update`
- 与T061：`typed_goal_belief_plan_semantics_vs_untyped_world_updates`
- 与T062：`full_screenplay_character_arc_evidence_vs_generated_persona_consistency`
- 与T063：`book_summary_faithfulness_vs_flat_state_and_relationship_summary`
- 与T064：`published_chapter_order_vs_generation_turn_order`
- 与T066：`event_role_topology_vs_agent_action_state_commit`

这些关系均属`emergent_provisional_structure`。尤其不能因为T067实际生成了长文本，就让它覆盖T051的时间双端、T036的稳定线路、T061的行动者语义或T063的内容遗漏审计。

## L. 最终状态与重审条件

`provisional`

保留理由：

1. 相对只做表示/问答或把生成列为未来工作的候选，MAGNET确实运行了长篇生成并公开了状态、目标、critic与narrator组件；
2. ATLAS与ConStory提供可回到原文证据的连续性证伪，而不是只给总分；
3. 独立整书关系研究直接修正自由关系状态，显示类型与演化必须分开；
4. 三源之间形成“生成机制—自然整书不利修正—独立证伪基准”的真实证据链。

不能成熟化的理由：

1. 最长设置每系统只有一篇，且没有统计不确定性；
2. 核心质量评审为LLM，一名人类只做有限一致性核验；
3. 共享状态为自由key-value覆写，不保存完整语义历史；
4. 没有稳定线路ID、长期意图、会合/分离、自然章卷双端、全图召回和端到端状态误差；
5. ATLAS和ConStory关键验证主要依赖合成注错，公开包又缺关键人工gold；
6. 独立关系研究数据受版权限制，人工局部验证条件抽样且演化一致性低；
7. 没有现代中文网文、真实连载版本、独立读者或商业结果。

重审至少需要：多个题材和随机种子的长设置重复；预注册或保留验证；多位独立人类完整阅读并报告命名IAA、分歧和裁决；开放的自然长篇状态/关系/错误gold；稳定`storyline_id`和类型化目标/知识/资源/承诺/关系/客观因果历史；自然章/卷边界与fabula双端；中间图、全图recall和端到端错误传播；对自然错误而非只注错的独立评估；至少一个现代中文连载复制。即使满足这些，也仍需另证读者和质量结果，不能自动变成写作处方。

当前结构标记：`emergent_provisional_structure`
