# T059 时间区间角色—会合—分支同步与Storyline可视化研究纲领

## Table Of Contents

Use the existing section headings below as the navigation map.

当前结构标记：`emergent_provisional_structure`

## A. 理论身份

- **理论ID：** T059
- **候选ID：** QF-122
- **标准名称：** 时间区间角色—会合—分支同步与Storyline可视化研究纲领
- **英文名称：** Interval Actor–Meeting–Branch Synchronization and Storyline Visualization Research Program
- **核心作者：** Irina Kostitsyna；Martin Nöllenburg；Valentin Polishchuk；André Schulz；Darren Strash
- **系统与经验验证：** Shixia Liu；Yingcai Wu；Enxun Wei；Mengchen Liu；Yang Liu
- **并发扩展：** Emilio Di Giacomo；Walter Didimo；Giuseppe Liotta；Fabrizio Montecchiani；Alessandra Tappini
- **领域综述：** Sara Di Bartolomeo
- **理论类型：** `validation_aware_interval_actor_meeting_branch_synchronization_and_layout_research_program`
- **学科来源：** graph drawing；information visualization；temporal networks；visual analytics；algorithm design
- **成熟状态：** `mature`

本档案成熟化的是一种严格但有界的同步表示：先把角色或实体作为稳定ID，把相遇/同组作为带起止的闭时间区间，再要求同一时刻的成员约束、非重叠约束或显式并发分支均可检查；最后才优化线条交叉、弯折和空白。它可以回答“谁在什么区间与谁处于同一会合组”“同一实体能否同时属于多个组”“一张图在给定输入下是否满足会合约束”。

它不成熟化文本中的情节线自动抽取、人物知识/目标/资源状态、事件因果、自然章节或卷的fabula双端，也不把线条少交叉写成故事更好。形式论文把人物、事件和时间区间视为输入；StoryFlow也从session table和location tree开始。由文本得到这些输入仍是另一项未验证任务。

## B. 原始研究问题与对象

Kostitsyna等把storyline定义为`S=(C,T,E)`：`C`是角色集合，`T`是自然数端点构成的闭时间区间集合，`E`中的每个事件由参与角色子集及其完整会合区间组成。经典模型要求一个角色不能参加两个相互重叠的事件。输出是二维图：横轴为时间，每个角色是一条x单调曲线；会合中的角色曲线在区间内靠近，非会合角色保持更大距离。[QF122-P1, pp.1-2]

该论文的主要问题不是识别文本情节，而是在输入已知时，storyline图最少需要多少交叉以及能否有效求解。两人单次会合且事件图为树时，给出`O(n log n)`上界和存在`Ω(n log n)`下界；一般交叉最小化为NP-complete，但按角色数`k`参数化时可在`O(k!² k log k + k!² m)`内求解。[QF122-P1, pp.2-6]

StoryFlow把系统输入写成session table和location tree。表中每个`entity × time frame`单元有session ID；地点树保存层级地点与其中发生的session。管线依次处理关系树、session/line ordering、alignment和layout compaction，并以交叉数、wiggle数和空间效率评价版面。[QF122-V1, pp.1-6]

Di Giacomo等指出经典“同刻只能属于一组”在时间粒度粗或抽象群组中太强，提出Storyline with Ubiquitous Actors（SUA）。同一actor用连接的树而非单线表示，并以actor planarity、branch continuity和branch degree控制并发分支。[QF122-X1, pp.1-6]

2026综述把领域最低识别条件总结为：一实体一条可追踪线、重点是线间互动、存在时间轴、垂直排序由meeting而非外部元数据决定；同时统一character、interaction/meeting、time step和vertical order等术语，并区分启发式、精确和混合布局。[QF122-S1, indexed VOR relevant sections]

## C. 核心机制与理论单位

1. **稳定实体ID先于可视化。** 每个角色/实体必须有唯一可追踪身份；同名、化身或版本是否合并不由布局算法决定。
2. **会合是区间对象。** 事件至少包含参与者集合与`[begin,end]`，而不是只写“同章出现”或“同日”。
3. **参与约束必须显式。** 经典模型禁止一个实体同时进入两个重叠meeting；需要并发时必须切换到SUA等扩展，不能暗中违反假设。
4. **会合和非会合均有约束。** 同组线在区间内相邻/成束，非同组线应分离；靠近不是自动推断出的关系事实。
5. **生命期与活跃期分栏。** 线的起止可表示实体在数据中的lifespan，但缺线不自动等于角色不存在或死亡。
6. **时间层与布局序分开。** 横轴时间或time step来自输入；每层的vertical order只是可读性安排，不是人物等级或因果顺序。
7. **交叉是表示成本。** 上下界、NP-hardness、FPT和最优算法只说明绘图复杂度，不能解释作品质量。
8. **session table是最小运行账本。** 对每个实体和时间帧登记session ID，另以location/group hierarchy管理层级。
9. **并发用分支而非复制身份。** SUA把同一actor表示为树；分支需保持连通、避免自交，并尽量延续前后分支。
10. **输入结构与输出布局分栏。** 算法可优化已给meeting结构；文本抽取错误不会因布局最优而消失。
11. **线性时间是条件。** StoryFlow对大量交错倒叙和数千time frames存在明确限制；需要另行保存story order与discourse order。
12. **语义状态是残余缺口。** 同组、同地点或线汇合不能证明目标、知识、资源、承诺、因果或情节线状态已同步。

## D. 命题—证据总表

完整36条命题及定位见`05_CLAIM_EVIDENCE_MATRIX.csv`。成熟裁决主干如下：

| claim_id | 命题 | 来源与定位 | 证据身份 | 硬边界 |
| --- | --- | --- | --- | --- |
| T059-C001 | storyline由角色、闭时间区间和事件集合定义 | QF122-P1 pp.1-2 | 形式定义 | 输入不是自动抽取结果 |
| T059-C003 | 经典模型禁止同一角色参加重叠事件 | QF122-P1 p.2 | 硬约束 | 粗粒度数据可能违反 |
| T059-C005 | 树事件图的两人单次会合有`O(n log n)`上界 | QF122-P1 pp.3-4 | 定理 | 只限特定事件图 |
| T059-C006 | 存在`Ω(n log n)`必要交叉 | QF122-P1 pp.4-5 | 下界 | 交叉不是叙事错误数 |
| T059-C008 | 一般问题按角色数固定参数可解 | QF122-P1 pp.5-6 | 算法定理 | 阶乘依赖限制大角色集 |
| T059-C011 | StoryFlow表逐实体逐时间帧保存session ID | QF122-V1 pp.2-3 | 系统输入协议 | 未提供文本抽取可靠性 |
| T059-C015 | 四数据集量化比较测交叉、wiggle与时间 | QF122-V1 pp.6-7 | 有界经验验证 | 评价布局而非理解正确性 |
| T059-C018 | 用户证据只有三位领域专家初步访谈 | QF122-V1 pp.8-9 | 初步定性反馈 | 不是控制实验或普遍读者结果 |
| T059-C019 | StoryFlow同刻单session假设会在粗尺度失败 | QF122-V1 p.10 | 作者自报限制 | 需并发扩展 |
| T059-C023 | SUA把group定义为actor集合与起止区间 | QF122-X1 pp.2-3 | 形式扩展 | group语义仍来自输入 |
| T059-C025 | 同一actor同时多组时以树分支保持身份连续 | QF122-X1 pp.2-4 | 并发机制 | 树不是情节分支真值 |
| T059-C028 | SUA只在少量publication-data案例中验证 | QF122-X1 pp.7-8 | 不利边界 | 大规模可读性未验证 |
| T059-C030 | 领域标准要求一实体一可追踪线及meeting驱动排序 | QF122-S1 §1.1 | 同行评审综述 | 某些扩展会放宽单线条件 |
| T059-C033 | 大多数方法把互动压到离散time step | QF122-S1 §3.3 | 领域边界 | 概念持续事件可能被瞬时化 |
| T059-C036 | 领域主要优化给定结构的可读性 | QF122-S1 §§3-4 | 综述修正 | 不能反推原始叙事结构正确 |

## E. 来源身份与实际读取深度

### QF122-P1

- **身份：** Kostitsyna等，2015，*On Minimizing Crossings in Storyline Visualizations*，GD 2015，DOI `10.1007/978-3-319-27261-0_16`。
- **读取：** 开放作者稿7页全文。
- **作用：** 闭区间meeting定义、非重叠约束、上下界、NP-complete与FPT。
- **SHA-256：** `A9DDB4F49F7D481D868C5D629D7B8F692905DA7FC519A59D2FA94FE34408743B`。

### QF122-V1

- **身份：** Liu等，2013，*StoryFlow: Tracking the Evolution of Stories*，IEEE TVCG 19(12):2436-2445，DOI `10.1109/TVCG.2013.196`。
- **读取：** Microsoft Research开放全文10页。
- **作用：** session table/location tree、混合优化、四组量化比较、电影/Twitter案例、三专家访谈和自报限制。
- **SHA-256：** `4B38A4EA322C162FC204A19386B84E77546A6913900A762654096E70C773BADC`。

### QF122-X1

- **身份：** Di Giacomo等，2020/2021，*Storyline Visualizations with Ubiquitous Actors*，GD 2020 revised proceedings pp.324-332，DOI `10.1007/978-3-030-68766-3_25`。
- **读取：** 开放作者稿9页全文。
- **作用：** 同刻多组、actor tree、分支连续性、两个publication-data案例和规模限制。
- **SHA-256：** `959B2EFCCDF146CD69EEF4909222A9B360464A584FC4155F138565037CBAE704`。

### QF122-S1

- **身份：** Sara Di Bartolomeo，2026，*The Story(line) So Far: A Survey on Storyline Visualization*，*Computer Graphics Forum*，DOI `10.1111/cgf.70499`。
- **读取：** Wiley VOR索引可读的摘要、§1.1、术语表、优化目标、时间模型和算法分类相关段落。
- **本地状态：** Wiley PDF命令下载返回403，未伪称本地副本；只登记实际读取深度。
- **作用：** 2026领域标准化、离散时间压缩和“结构输入—布局优化”边界。

## F. 原始适用范围与文本尺度

- **直接对象：** 电影/戏剧角色meeting、社会/协作网络、Twitter意见领袖、publication groups、给定的实体—session—time数据。
- **直接单位：** actor/entity ID、life span、time step、closed interval、meeting/group/session ID、location tree、vertical order、crossing、wiggle、branch。
- **直接问题：** 给定互动输入的同步表示、冲突检测、并发参与、布局可读性和算法复杂度。
- **部分问题：** 长篇人物跨章出现可投成time steps，但原始论文不提供自然章节的故事时间双端。
- **未测量：** 文本事件抽取准确率、故事线/情节线语义身份、目标/知识/资源状态依赖、因果、章卷fabula双端、IAA、中文网文、真实读者理解或商业结果。

## G. 边界与不适用条件

1. 不把character line称为完整人物弧；它只表示输入中的活跃与meeting。
2. 不把meeting等同情节会合；同场、同组和共同因果结果是不同关系。
3. 不把闭时间区间称为自然章/卷时间；端点来源必须另行审计。
4. 不把经典非重叠约束写成现实规律；SUA已经证明同刻多组是必要扩展。
5. 不把SUA actor tree写成分支世界或多重身份；它是并发可视表示。
6. 不把线条交叉数当叙事混乱数、人物冲突数或质量分。
7. 不把FPT算法写成可扩展到任意角色数；复杂度对`k!²`敏感。
8. 不把三位专家的积极评论写成读者理解、记忆或偏好因果。
9. 不把900实体/63帧Twitter案例写成长篇小说验证。
10. 不把线性time step无损映射到交错倒叙；StoryFlow明确承认限制。
11. 不从最优布局反推输入meeting、时间或身份正确。
12. 不自动抽取、同步、重排、续写、分章分卷或修改用户文本。

## H. 项目操作化转译

仅在用户另行批准具体文本试验后，建立以下审计表：

`entity_id | identity_evidence | discourse_span | story_interval_begin | story_interval_end | interval_source | meeting_id | participant_ids | overlap_conflict | concurrent_group_ids | branch_id | state_dependency_ref | extraction_confidence | adjudication | layout_status`

操作顺序：

1. 先核实体身份和版本，不由名字字符串自动合并。
2. 再标meeting参与者和区间双端；只有单日期/单章时标为代理。
3. 检查同一实体的重叠meeting；真实并发转SUA，不真实则登记冲突。
4. 人物目标、知识、资源、承诺和因果另建状态依赖表，不塞进meeting。
5. 只有输入通过人工裁决后才生成布局；布局指标只评价可读性。
6. 无文本抽取IAA或误差集时报告`strict_presence_sync_only`，不称情节严格同步。

## I. 竞争解释与混淆

- 同章出现不等于同场互动；窗口过大会制造假meeting。
- 同地点不等于同一时刻；同日不等于区间重叠。
- 人物离线可能是叙述省略，不是故事世界消失。
- 线汇合可能只是视觉分组，不是人物状态或情节因果会合。
- 交叉可来自布局顺序，也可来自真实群组频繁变化。
- 线性time step可把持续事件、倒叙和同时多事件压平。
- 自动共指、事件抽取或时间归一化的误差会先于布局传播。
- 层级地点可改善可读性，但不证明该层级是文本的自然情节结构。

## J. 与现有理论的关系

- **T036：** T036处理多情节协调和状态失败；T059提供更严格的实体—meeting区间输入与并发约束，但不含语义状态。
- **T051：** T051给话语/故事四端点；T059可消费其故事区间，却不能生成自然章卷端点。
- **T052：** T052处理相邻章节四轴转换；T059处理给定time steps中的持续实体与meeting。
- **T054：** T054提供版本化实体键和日期区间治理；T059可视化前应继承这些审计字段。
- **T057：** T057把章压到单日期；T059要求meeting区间，因此直接暴露单点代理损失。
- **T058：** T058提供strand/stitch和相对会合描述；T059新增稳定实体ID、闭区间和形式约束，但不提供叙事语义strand。
- **T043/T047：** 局部事件—时间关系和显著锚可作为区间证据，却不足以自动形成长篇meeting账本。
- **T055/T056：** actor tree是同一时刻并发分组，不是分支真值、历史束或时间旅行身份。

## K. 研究质量裁决

- **正面：** 形式定义清楚；有定理、复杂度界、量化系统比较、案例、并发扩展和2026同行评审综述。
- **不利：** 输入meeting和时间已给定；StoryFlow只有三位专家初步反馈；SUA只做两个少量actor的publication案例；线性time step和大量倒叙有明确限制。
- **成熟理由：** “给定实体—区间—meeting后如何严格表示并优化”已形成跨论文稳定研究纲领。
- **成熟边界：** 不含“怎样从自然长篇可靠抽取该结构”，也不含“该结构是否构成情节因果或读者质量”。

## L. 下一步研究队列

1. 继续寻找自然章节/卷的完整fabula起止、双标/裁决和不确定性协议。
2. 寻找真正把`storyline_id + event_interval + semantic_state_dependency + convergence_condition`同时人工标注并报告误差的长篇研究。
3. 寻找从小说文本抽取meeting区间的开放金标、IAA和错误传播研究；不再重复只给布局算法的StoryFlow/交叉最小化路线。
4. QF121只在合法完整转写或手稿图像可读后回访。
5. 用户未批准前，不分析其小说文本，不运行真实试验，不建立自动写作、同步或评分规则。

长期目标保持`active`。
