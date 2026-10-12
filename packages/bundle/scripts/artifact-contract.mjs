export const skills = ['novel-director', 'novel-inspiration', 'novel-design', 'novel-outline', 'novel-drafting', 'novel-review', 'novel-polish', 'novel-revision', 'novel-settle', 'novel-export', 'novel-analyze']
/** Dispatch references must travel with the skills that consume them. */
export const referenceDocs = [
  ...['导入与覆盖', '事实提取', '机制与灵感'].map(name => `skills/novel-analyze/references/${name}.md`),
  ...['全量', '章节结构', '人物与关系', '情节与因果', '信息披露', '线索与伏笔', '节奏与张力', '读者承诺', '文风与表达']
    .map(name => `skills/novel-review/agents/${name}审读.md`),
  ...['1-表达清理', '2-节奏与重塑', '3-平台格式'].map(name => `skills/novel-polish/references/${name}.md`),
  'skills/novel-revision/agents/改稿章程.md',
  'skills/novel-settle/agents/沉淀对账.md',
  'skills/novel-outline/agents/写前十查.md',
  'skills/novel-design/agents/作家评审.md',
  'skills/novel-design/agents/读者评审.md',
  'skills/novel-inspiration/agents/采风检索.md',
  // 灵感库种子：十类框架八册（历史事实/现实生活待采不建册，见种子索引.md）
  ...['文化元素', '剧情结构', '人物原型', '台词金句', '古词古句·意象', '影视动漫', '命名词语', '设定概念']
    .map(name => `skills/novel-inspiration/assets/灵感库种子/${name}/零件卡.md`),
  'skills/novel-inspiration/assets/灵感库种子/索引.md',
  'skills/novel-drafting/agents/写作卡.md',
  'skills/novel-design/references/参考标尺.md',
  'skills/novel-design/references/雷点清单.md',
  ...['人物档案', '世界规则', '力量体系', '组织', '地图', '局规则'].map(name => `skills/novel-design/templates/世界书/${name}条目模板.md`),
  'skills/novel-design/templates/对手梯队子表规格.md',
  'skills/novel-design/templates/卷纲固定段规格.md',
  'skills/novel-outline/templates/章细纲固定小节规格.md',
  ...['01_开书', '02_人物设计', '03_世界观设计', '04_大纲', '05_卷纲', '0A_第一性原理层']
    .map(name => `skills/novel-design/references/${name}.md`),
  'skills/novel-outline/references/06_章纲.md',
  'skills/novel-drafting/references/07_正文写作.md',
  'skills/novel-director/references/08_修订排障.md',
  'skills/novel-director/references/书房与检索.md',
]
export const thinScripts = [
  ['skills/novel-review/scripts/确定性检查.mjs', 'runChecksCli'],
  ['skills/novel-drafting/scripts/核验字数.mjs', 'draftLengthCli'],
  ['skills/novel-design/scripts/影响分析.mjs', 'analyzeImpactCli'],
  ['skills/novel-outline/scripts/影响分析.mjs', 'analyzeImpactCli'],
  ['skills/novel-outline/scripts/材料备料.mjs', 'materialsCli'],
  ['skills/novel-settle/scripts/定稿备包.mjs', 'packCli'],
  ['skills/novel-settle/scripts/卷摘要候选.mjs', 'volumeSummaryCli'],
  ['skills/novel-export/scripts/最小导出.mjs', 'exportCli'],
  ['skills/novel-export/scripts/一键备份.mjs', 'backupCli'],
]
