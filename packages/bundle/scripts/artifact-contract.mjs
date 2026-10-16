export const skills = ['novel-director', 'novel-inspiration', 'novel-forage', 'novel-design', 'novel-arcplan', 'novel-outline', 'novel-drafting', 'novel-review', 'novel-polish', 'novel-revision', 'novel-settle', 'novel-export', 'novel-analyze']
/** Dispatch references must travel with the skills that consume them. */
export const referenceDocs = [
  ...['导入与覆盖', '事实提取', '机制与灵感'].map(name => `skills/novel-analyze/references/${name}.md`),
  ...['全量', '章节结构', '人物与关系', '情节与因果', '信息披露', '线索与伏笔', '节奏与张力', '读者承诺', '文风与表达', '世界内合理性']
    .map(name => `skills/novel-review/agents/${name}审读.md`),
  ...['1-表达清理', '2-节奏与重塑'].map(name => `skills/novel-polish/references/${name}.md`),
  'skills/novel-revision/agents/改稿章程.md',
  'skills/novel-settle/agents/沉淀对账.md',
  'skills/novel-outline/agents/写前十查.md',
  'skills/novel-design/agents/作家评审.md',
  'skills/novel-design/agents/读者评审.md',
  'skills/novel-forage/agents/采风检索.md',
  // 灵感库种子：八部一册（地/物/事空册子标先立，0.0.58 八部重排，见种子索引.md）
  ...['人', '地', '物', '事', '知', '言', '象', '镜']
    .map(name => `skills/novel-forage/assets/灵感库种子/${name}/零件卡.md`),
  'skills/novel-forage/assets/灵感库种子/索引.md',
  'skills/novel-outline/references/桥段参照.md',
  'skills/novel-drafting/agents/写作卡.md',
  'skills/novel-design/references/参考标尺.md',
  'skills/novel-design/references/雷点清单.md',
  ...['人物档案', '世界规则', '力量体系', '组织', '地图', '局规则', '世界常量'].map(name => `skills/novel-design/templates/世界书/${name}条目模板.md`),
  'skills/novel-design/templates/对手梯队子表规格.md',
  'skills/novel-arcplan/templates/卷纲固定段规格.md',
  'skills/novel-arcplan/templates/幕纲固定段规格.md',
  'skills/novel-arcplan/templates/步骤卡-卷规划.md',
  'skills/novel-arcplan/templates/步骤卡-幕末结算.md',
  'skills/novel-outline/templates/章细纲固定小节规格.md',
  'skills/novel-outline/templates/步骤卡-章细纲.md',
  ...['开书-构思与验证', '开书-读者与情绪定位', '开书-书名与简介', '开书-参考作品利用', '人物设计-主角', '人物设计-金手指设计', '人物设计-配角与群像', '人物设计-反派', '人物设计-弧光与关系', '人物设计-人物卡工具', '世界观-规则与铁则', '世界观-力量体系与天花板', '世界观-地图与势力', '世界观-经济与原创性', '大纲-主线与骨架', '大纲-激励事件与首尾', '大纲-换图与支线', '大纲-伏笔埋收', '大纲-牌局与结构检查', '卷纲-卷功能与结构', '卷纲-节奏与高潮', '卷纲-情节类型骨架']
    .map(name => `skills/novel-design/references/${name}.md`),
  ...['章纲-章型与开篇', '章纲-冲突与爽点', '章纲-场景与节奏', '章纲-信息与情绪'].map(name => `skills/novel-outline/references/${name}.md`),
  ...['正文-展示与对白', '正文-场景与动作', '正文-视角落地', '正文-文笔修炼', '正文-开场转场与特殊戏', '正文-中文行文规范', '默认文风'].map(name => `skills/novel-drafting/references/${name}.md`),
  ...['排障-索引与改稿流程', '排障-专项修复', '排障-长篇防崩'].map(name => `skills/novel-director/references/${name}.md`),
  'skills/novel-director/references/书房与检索.md',
]
export const thinScripts = [
  ['skills/novel-review/scripts/确定性检查.mjs', 'runChecksCli'],
  ['skills/novel-drafting/scripts/核验字数.mjs', 'draftLengthCli'],
  ['skills/novel-design/scripts/影响分析.mjs', 'analyzeImpactCli'],
  ['skills/novel-outline/scripts/影响分析.mjs', 'analyzeImpactCli'],
  ['skills/novel-outline/scripts/材料备料.mjs', 'materialsCli'],
  ['skills/novel-outline/scripts/十查机械.mjs', 'tenChecksCli'],
  ['skills/novel-settle/scripts/定稿备包.mjs', 'packCli'],
  ['skills/novel-settle/scripts/草稿清理.mjs', 'draftCleanupCli'],
  ['skills/novel-settle/scripts/卷摘要候选.mjs', 'volumeSummaryCli'],
  ['skills/novel-export/scripts/最小导出.mjs', 'exportCli'],
  ['skills/novel-export/scripts/一键备份.mjs', 'backupCli'],
]
