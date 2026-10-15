#!/usr/bin/env node
// KB 分发提取：知识库源目录 → 各技能 references/ 净版分发件。
// 分发映射表单源在此脚本；净版规则＝机械剥除（来源行/编者注/T 编号锚/来源卡括注等）
// ＋改写表（逐字引语/黑名单词/附录指针的既定编辑裁定，逐条钉死）。
//
// 用法：
//   node scripts/kb-extract.mjs --source <KB目录> --check
//   node scripts/kb-extract.mjs --source <KB目录> --write
//   node scripts/kb-extract.mjs --source <KB目录> --write --out <输出根目录>   # 测试重定向用
// 源目录也可由环境变量 ABZU_KB_SOURCE 提供（--source 优先）。
// --check 只比对不写：全部分发件与净版输出逐字节一致 → 退出码 0；有漂移 → 1。
// 09_附录/00_总目录/0B_节级索引/0C_理论地基 不分发（映射表外自动忽略）。
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { fileURLToPath } from 'node:url'

const KB_VERSION = 'v2.4.7'
const STAMP = `> 知识库净版 · 源版本 ${KB_VERSION} · 净版纪律见 docs/design/增强实施计划.md §二`

/** 分发映射表（单源）：KB 文件 → 技能 references/ 目录。
 *  v2.4.1 阶段1：大纲域+卷纲域拆分——04/05 整文件退役为源侧壳（不分发），
 *  8 件上位 novel-design，章纲-信息与情绪为存根件（§4.11 先行入住，主节阶段4归位）。
 *  v2.4.2 阶段2：人物域拆分——02_人物设计 整文件退役为源侧壳（不分发），6 件上位 novel-design。
 *  v2.4.3 阶段3：开书域+世界观域拆分——01_开书/03_世界观设计 整文件退役为源侧壳（不分发），
 *  8 件上位 novel-design（§1.10 跨域移入既有件《大纲-牌局与结构检查》）。
 *  v2.4.4 阶段4：章纲域+正文域拆分——06_章纲/07_正文写作 整文件退役为源侧壳（不分发），
 *  10 件上位（novel-outline 4 件——《章纲-信息与情绪》存根归位成件；novel-drafting 6 件）。
 *  v2.4.5 阶段5a：排障域拆分＋0A 退场——08_修订排障 整文件退役为源侧壳（不分发），
 *  3 件上位 novel-director；0A_第一性原理层 退役删源（理论内容移植主仓
 *  docs/design/判据根系·七原语，产品文档不分发），0C 降格审计件不分发。 */
const MAPPING = [
  { file: '开书-构思与验证.md', skill: 'novel-design' },
  { file: '开书-读者与情绪定位.md', skill: 'novel-design' },
  { file: '开书-书名与简介.md', skill: 'novel-design' },
  { file: '开书-参考作品利用.md', skill: 'novel-design' },
  { file: '人物设计-主角.md', skill: 'novel-design' },
  { file: '人物设计-金手指设计.md', skill: 'novel-design' },
  { file: '人物设计-配角与群像.md', skill: 'novel-design' },
  { file: '人物设计-反派.md', skill: 'novel-design' },
  { file: '人物设计-弧光与关系.md', skill: 'novel-design' },
  { file: '人物设计-人物卡工具.md', skill: 'novel-design' },
  { file: '世界观-规则与铁则.md', skill: 'novel-design' },
  { file: '世界观-力量体系与天花板.md', skill: 'novel-design' },
  { file: '世界观-地图与势力.md', skill: 'novel-design' },
  { file: '世界观-经济与原创性.md', skill: 'novel-design' },
  { file: '大纲-主线与骨架.md', skill: 'novel-design' },
  { file: '大纲-激励事件与首尾.md', skill: 'novel-design' },
  { file: '大纲-换图与支线.md', skill: 'novel-design' },
  { file: '大纲-伏笔埋收.md', skill: 'novel-design' },
  { file: '大纲-牌局与结构检查.md', skill: 'novel-design' },
  { file: '卷纲-卷功能与结构.md', skill: 'novel-design' },
  { file: '卷纲-节奏与高潮.md', skill: 'novel-design' },
  { file: '卷纲-情节类型骨架.md', skill: 'novel-design' },
  { file: '章纲-章型与开篇.md', skill: 'novel-outline' },
  { file: '章纲-冲突与爽点.md', skill: 'novel-outline' },
  { file: '章纲-场景与节奏.md', skill: 'novel-outline' },
  { file: '章纲-信息与情绪.md', skill: 'novel-outline' },
  { file: '正文-展示与对白.md', skill: 'novel-drafting' },
  { file: '正文-场景与动作.md', skill: 'novel-drafting' },
  { file: '正文-视角落地.md', skill: 'novel-drafting' },
  { file: '正文-文笔修炼.md', skill: 'novel-drafting' },
  { file: '正文-开场转场与特殊戏.md', skill: 'novel-drafting' },
  { file: '正文-中文行文规范.md', skill: 'novel-drafting' },
  { file: '排障-索引与改稿流程.md', skill: 'novel-director' },
  { file: '排障-专项修复.md', skill: 'novel-director' },
  { file: '排障-长篇防崩.md', skill: 'novel-director' },
]

/**
 * 改写表：净版纪律中无法机械归纳的既定编辑裁定（逐字引语改写为判据句式、
 * 黑名单词按语境改写、附录指针改写），逐条钉死原句→净版句。
 * KB 升版后源句变动会使对应条目失配——--check 报漂移，人工重审后更新本表。
 */
const REWRITES = {
  // v2.4.5 阶段5a：章名导航退役——章节已拆为件，10+1 处导航/限定词改指件名或域（源侧正文中的导航清理随 T2 内容刀）
  '人物设计-人物卡工具.md': [
    ['｜ → 第三章·世界观设计', '｜ → 世界观域（世界观-*）'],
  ],

  // v2.4.3 阶段3：开书域+世界观域改写条目随节搬迁重归属（原 01_开书.md/03_世界观设计.md 两键退役；
  // 活条目 11 并入下列 4 键，落壳条目 2 删——「灵魂契约」口径行落 01 壳口径对照、
  // 「| 经济闭环 |」产出清单纯表头行落 03 壳本章产出清单，壳不分发故无净版影响）
  '开书-构思与验证.md': [
    ['- 理论课的**人前显圣**推演：', '- **人前显圣**推演：'],
    ['- 《小说的骨架》的样板前提句：「记者克里斯发现他入睡后进入另一个世界，那个世界正处在崩溃边缘，他别无选择唯有拯救它」——主人公', '- 样板前提句（《小说的骨架》）：记者克里斯入睡后会进入另一个世界，那个世界濒临崩溃，他别无选择、唯有拯救它——主人公'],
    ['- 《救猫咪》的意外样板：「一个警察来到洛杉矶看望分居的妻子，妻子的办公室被恐怖分子占领了」（《虎胆龙威》）——', '- 意外样板（《救猫咪》评《虎胆龙威》）：一个警察去洛杉矶看望分居的妻子，赶到时妻子的办公室已被恐怖分子占领——'],
  ],
  '开书-读者与情绪定位.md': [
    ['｜ → 第二章·人物设计', '｜ → 人物域（人物设计-*）'],
    ['> **类型特化**：写女频文详见「附.2 女频类型怎么特化」及附.7-附.11各子类型。', '> **类型特化**：写女频文的类型特化判据在知识库附录（附.2 及附.7-附.11——附录不分发、运行时不可读）。'],
    ['用他的话说是"像一个球一样为核心服务"，所有面都指向同一个中心。', '所有设定像球面一样朝向核心这一个中心。'],
  ],
  // v2.4.2 阶段2：人物域改写条目随节搬迁重归属（原 02_人物设计.md 键退役，4 条全活零死条目）
  // v2.4.5 阶段5a 追加两键：《KB重构裁定》（2026-10-15 起外部档案·设计源存档，账见《来源声明》§三）:19「02 内两处"详见 0A"清洗」——0A 退役后人物域
  // 两处边界块 0A 指针改分发剥除（与章纲/正文 4 处同款条目，源句保留）
  '人物设计-金手指设计.md': [
    ['- 番茄官方给的正例：', '- 正例：'],
    ['，详见 `0A_第一性原理层.md`）', '）'],
  ],
  '人物设计-配角与群像.md': [
    ['，详见 `0A_第一性原理层.md`）', '）'],
  ],
  '人物设计-反派.md': [
    ['> **类型特化**：写权谋文详见「附.1 权谋类型怎么特化」。', '> **类型特化**：写权谋文的类型特化判据在知识库附录（附.1——附录不分发、运行时不可读）。'],
  ],
  '人物设计-弧光与关系.md': [
    ['> **类型特化**：写女频文详见「附.2 女频类型怎么特化」及附.7-附.11各子类型。', '> **类型特化**：写女频文的类型特化判据在知识库附录（附.2 及附.7-附.11——附录不分发、运行时不可读）。'],
    ['遗物补刀/因果闭环/温柔一刀', '遗物补刀/因果扣合/温柔一刀'],
  ],
  '世界观-规则与铁则.md': [
    ['← 第二章·人物卡怎么建｜ → 力量体系怎么搭', '← 《人物设计-人物卡工具》人物卡怎么建｜ → 力量体系怎么搭'],
    ['随文微调 ≠ 开篇前不用设计。三九音域说得很清楚："要实现这种层层递进，就必须在开篇前设计好整个故事的世界观。"开篇前定死的是', '随文微调 ≠ 开篇前不用设计。层层递进的前提是开篇前设计好整个故事的世界观。开篇前定死的是'],
  ],
  '世界观-经济与原创性.md': [
    ['｜ → 第四章·大纲', '｜ → 大纲域（大纲-*）'],
    ['这四条串起来就是一个闭环，闭环立不住', '这四条串起来就是一个循环，循环立不住'],
    ['| 路径 | 怎么设计经济闭环 | 例子 |', '| 路径 | 怎么设计经济循环 | 例子 |'],
    ['都要落到**闭环自洽**', '都要落到**循环自洽**'],
    ['→ 经济闭环对了', '→ 经济循环对了'],
    ['### 常见错误（本质上都是经济没有闭环）', '### 常见错误（本质上都是经济循环没立住）'],
  ],
  // v2.4.1 阶段1：改写表随节搬迁重归属（原 04/05 两键退役；
  // 失配死条目 2 条与落壳条目 4 条经落位分析删除，活条目 14 条并入下列 6 键）
  '大纲-主线与骨架.md': [
    ['← 第三章·原创性怎么对照｜', '← 《世界观-经济与原创性》原创性怎么对照｜'],
    ['**另一套续法（分歧保留）**：理论课程按"目标怎么接续"给主线续命', '**另一套续法（分歧保留）**：按"目标怎么接续"给主线续命'],
    ['**另一套分法（分歧保留）**：B站课程按"主线怎么组织"分三式', '**另一套分法（分歧保留）**：按"主线怎么组织"分三式'],
  ],
  '大纲-伏笔埋收.md': [
    ['> **类型特化**：写悬疑文详见「附.3 悬疑类型怎么特化」。', '> **类型特化**：写悬疑文的类型特化判据在知识库附录（附.3——附录不分发、运行时不可读）。'],
  ],
  '大纲-牌局与结构检查.md': [
    ['｜ → 第五章·卷纲', '｜ → 卷纲域（卷纲-*）'],
    ['- 《斩神》《我不是戏神》用**活大纲法（网文版）**：三九音域开书前会准备大纲，但"写到那个地步的时候，就会发现有一条路可能更好，发展可能会更有意思，所以就会抛弃原来的，去选择新的路线。所以凡是有大纲都会被我推翻，后来就没有大纲了"。不是真没有', '- 《斩神》《我不是戏神》用**活大纲法（网文版）**：三九音域开书前会准备大纲，但写到中途发现更好的路线就抛弃原案重选——大纲一路被推翻，最后只剩世界观大框架和核心精神。不是真没有'],
    ['**要不要写大纲**：老编辑结论——争论的两极', '**要不要写大纲**：争论的两极'],
    ['> **类型特化**：写权谋文详见「附.1 权谋类型怎么特化」。', '> **类型特化**：写权谋文的类型特化判据在知识库附录（附.1——附录不分发、运行时不可读）。'],
  ],
  '卷纲-卷功能与结构.md': [
    ['「第四章·大纲」的「分卷怎么规划」', '本件「§4.5 分卷怎么规划」'],
    ['「第五章·卷纲」的「一卷的功能是什么」', '本件「§5.1 一卷的功能是什么」'],
    ['｜ → 第六章·章纲', '｜ → 章纲域（章纲-*）'],
    ['每一卷独立闭环、承上启下', '每一卷独立完整、承上启下'],
    ['每一卷独立闭环、同时承上启下', '每一卷独立完整、同时承上启下'],
    ['如果这一卷没有独立闭环，读者就没有阶段感', '如果这一卷不能独立成篇，读者就没有阶段感'],
    ['都要落到**独立闭环**——这一卷独立看是完整的', '都要落到**独立完整**——这一卷独立看是完整的'],
    ['- 有（独立闭环）→ 卷纲对了', '- 有（独立成篇）→ 卷纲对了'],
    ['卷里没有完整闭环', '卷里没有完整故事'],
  ],
  '卷纲-节奏与高潮.md': [
    ['**时间线管理三件**（咕嘎72理论库，延伸档）：', '**时间线管理三件**：'],
  ],
  '卷纲-情节类型骨架.md': [
    ['与第一章 §1.4 主情绪', '与《开书-读者与情绪定位》§1.4 主情绪'],
    ['（素材未给三幕，按争夺目标排：明面争什么+暗线争什么）', '（三幕按争夺目标排：明面争什么+暗线争什么）'],
    ['**第二套参考系：按"读者要什么"选基调（网文经典结构九类）**。上表按', '**第二套参考系：按"读者要什么"选基调的九类**。上表按'],
    ['| 素材未标 |', '| — |'],
  ],
  // v2.4.4 阶段4：章纲域+正文域改写条目随节搬迁重归属（原 06_章纲.md/07_正文写作.md 两键退役；
  // 6 条全活零死零落壳并入下列 7 键——0A 指针条目 4 处落位分驻 4 键）
  '章纲-章型与开篇.md': [
    ['**核心逻辑**：不管这一章主要干什么，最终都要落到**一章一个小闭环**——有头有尾有钩。', '**核心逻辑**：不管这一章主要干什么，最终都要落到**一章一个完整小单元**——有头有尾有钩。'],
    ['，详见 `0A_第一性原理层.md`）', '）'],
  ],
  '章纲-冲突与爽点.md': [
    ['，详见 `0A_第一性原理层.md`）', '）'],
  ],
  '正文-展示与对白.md': [
    ['，详见 `0A_第一性原理层.md`）', '）'],
  ],
  '正文-场景与动作.md': [
    ['，详见 `0A_第一性原理层.md`）', '）'],
    ['**分歧条件**：素材里对"一次用几种感官"有两说', '**分歧条件**：对"一次用几种感官"有两说'],
  ],
  '正文-文笔修炼.md': [
    ['老舍自述词汇贫乏第三根源＝生活/艺术知识太少——不懂音乐绘画只会"好听/好看"，写不出具体词不是文采不够，是认知颗粒度太粗："一个人的词汇边界，说到底就是他感受世界的边界"', '词汇贫乏的一大根源是生活/艺术知识太少——不懂音乐绘画只会"好听/好看"，写不出具体词不是文采不够，是认知颗粒度太粗；词汇边界就是感受世界的边界'],
  ],
  '正文-开场转场与特殊戏.md': [
    ['｜ → 第八章·修订排障', '｜ → 排障域（排障-*）'],
    ['**更狠的一招（动笔前用）**：三九音域写悲情场景，不是直接写，是"先构思，脑海中有画面，先把自己的情绪酝酿到位，然后才能去把它写下来。中间这个把自己情绪酝酿到位的过程，其实就是在刀我自己。我觉得这个刀好像还可以，还可以更刀一点，还是不够让我痛。"——他写刀子，先把自己刀到痛了才落笔。所以死亡戏', '**更狠的一招（动笔前用）**：写悲情场景不直接落笔——先构思画面，把自己的情绪酝酿到位才写；酝酿的过程就是先把自己"刀"到痛，觉得还不够痛就继续加深。所以死亡戏'],
  ],
  // v2.4.5 阶段5a：排障域改写条目随节搬迁重归属（原 08_修订排障.md 键退役，4 条全活零死——
  // grep 实测落位：网文资料菌#34 与「四个学科…见 §8.10」两条在 §8.6 → 专项修复；
  // 「另一层根子」在 §8.3 → 索引与改稿流程；「附.13」相关联行在 §8.10 尾 → 长篇防崩。
  // 0A_第一性原理层.md 键 4 条随 0A 退役删除——源文件已删，分发件不复存在）
  '排障-索引与改稿流程.md': [
    ['另一层根子（理论课程，与上面并存）：', '另一层根子（与上面并存）：'],
  ],
  '排障-专项修复.md': [
    ['网文资料菌#34 说得更直接：期待感的本质是信息差', '期待感的本质是信息差'],
    ['——四个学科的多线研究收敛于同一结构，见 §8.10）', '，见 §8.10）'],
  ],
  '排障-长篇防崩.md': [
    ['**相关联**：← 伏笔没收怎么办｜ → 附.13 循环文设定账本', '**相关联**：← 伏笔没收怎么办'],
  ],
}

/** 整行删除规则（行首匹配）：来源行与各类编者注/理论锚点注/运营护栏注。 */
const DROP_LINE_PREFIXES = [
  '**来源**：',
  '> **理论锚点',
  '> **性质**：编者归纳层',
  '> （编者推断，可推翻',
  '> （本节为编者归纳',
  '> 并入理由（',
  '> 移出理由（',
  '> 题材选择是商业决策',
  '> 付费免费、频道选择',
  '> 如需市场运营相关资料',
  '> 如需平台运营相关资料',
]

/**
 * 括注剥除判定：返回 true 保留、false 整段删、字符串替换。
 * 覆盖：T 编号锚（整段以（T数字开头）、编者推断、通用例标注、素材未给/素材原词标注、
 * 来源卡括注（含 # 编号——混合段只剥卡段留正文）、写网文的老刘署名、附录详见指针、编者归纳注。
 */
function spanVerdict (span) {
  if (/^（T\d/.test(span)) return false
  if (span.startsWith('（编者推断，可推翻')) return false
  if (span === '（依公式推演的通用例）') return false
  if (span.startsWith('（素材未给')) return false
  if (span.startsWith('（素材原词是')) return false
  if (span.startsWith('（详见附.')) return false
  if (span.includes('#')) {
    // 来源卡括注：纯卡段整删；混合段（如「见 §4.5，清竹#1」）只删含卡的分段
    const inner = span.slice(1, -1)
    const kept = inner.split('，').filter((seg) => !seg.includes('#'))
    return kept.length === 0 ? false : '（' + kept.join('，') + '）'
  }
  if (span.includes('写网文的老刘')) {
    // 署名括注：整段是署名→整删；正文尾随署名（——写网文的老刘）→只剥署名
    if (span.startsWith('（写网文的老刘')) return false
    return span.replace('——写网文的老刘', '')
  }
  if (span.startsWith('（注：') && span.includes('可推翻')) {
    const cut = span.indexOf('可推翻；')
    if (cut !== -1) return '（' + span.slice(cut + '可推翻；'.length)
    return false
  }
  return true
}

/** 平衡扫描全角括注：按判定剥除（含一层以上嵌套）。 */
function stripSpans (line) {
  let out = ''
  let i = 0
  while (i < line.length) {
    if (line[i] === '（') {
      let depth = 0
      let j = i
      let closed = -1
      while (j < line.length) {
        if (line[j] === '（') depth++
        else if (line[j] === '）') { depth--; if (depth === 0) { closed = j; break } }
        j++
      }
      if (closed === -1) { out += line[i]; i++; continue }
      const span = line.slice(i, closed + 1)
      const verdict = spanVerdict(span)
      if (verdict === true) out += span
      else if (verdict !== false) out += verdict
      i = closed + 1
      continue
    }
    out += line[i]
    i++
  }
  return out
}

/** 净版主流程：源文本 → 分发件文本（LF、版本戳、剥除、改写、空行归一）。 */
export function cleanVersion (kbFile, sourceText) {
  let text = sourceText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  let lines = text.split('\n')
  // 1. 整行删除（来源行/编者注/护栏注）；`> ` 空引言行只出现在护栏注块内，一并删
  lines = lines.filter((l) => !DROP_LINE_PREFIXES.some((p) => l.startsWith(p)) && l !== '> ')
  text = lines.join('\n')
  // 2. 改写表（先于括注剥除——部分原句含将被剥除的括注）
  for (const [from, to] of REWRITES[kbFile] ?? []) {
    while (text.includes(from)) text = text.replace(from, to)
  }
  // 3. 通用化表述前缀（署名括注随前缀整段去）
  text = text.replace(/通用化表述（[^（）]*）：/g, '')
  // 4. 共思行的附录节引用（附录不分发）
  text = text.replace(/、§附\.\d+（[^（）]*）/g, '')
  // 5. 括注剥除（平衡扫描）＋括内残存的 T 编号锚（带可选【档位】或短语限定）
  text = text.split('\n').map((l) => stripSpans(l).replace(/(?:。|，|——)?T\d+(?:【[^】]*】| [^，。；）]*)?/g, '')).join('\n')
  // 6. 空行归一：连续空行并一；文末尾空行全清，单换行收尾
  lines = text.split('\n')
  const collapsed = []
  for (const l of lines) {
    if (l === '' && collapsed[collapsed.length - 1] === '') continue
    collapsed.push(l)
  }
  while (collapsed.length > 0 && collapsed[collapsed.length - 1] === '') collapsed.pop()
  // 7. 版本戳插在标题与正文之间（唯一元信息）
  if (collapsed.length < 2 || !collapsed[0].startsWith('# ') || collapsed[1] !== '') {
    throw new Error(`${kbFile}: 源文件开头不是「# 标题＋空行」结构，无法插版本戳`)
  }
  collapsed.splice(2, 0, STAMP, '')
  return collapsed.join('\n') + '\n'
}

function usage () {
  console.error('用法：node scripts/kb-extract.mjs --source <KB目录> (--check|--write) [--out <输出根目录>]（源目录亦可用 ABZU_KB_SOURCE 提供）')
}

const args = process.argv.slice(2)
const flag = (name) => args.indexOf(name)
const val = (name) => { const i = flag(name); return i !== -1 ? args[i + 1] : undefined }
const sourceDir = flag('--source') !== -1 ? val('--source') : process.env.ABZU_KB_SOURCE
const outRoot = val('--out') ?? nodePath.resolve(nodePath.dirname(fileURLToPath(import.meta.url)), '..', 'skills')
const mode = flag('--check') !== -1 ? 'check' : flag('--write') !== -1 ? 'write' : undefined

if (process.argv[1] !== undefined && process.argv[1].endsWith('kb-extract.mjs')) {
  if (sourceDir === undefined || mode === undefined) { usage(); process.exit(2) }
  run(sourceDir, outRoot, mode)
}

/** 件级结构校验（v2.4 起拆分件＝非数字开头文件名）：H1＋件头定位/消费位两要素。 */
function assertPieceHeader (file, sourceText) {
  const lines = sourceText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  if (!lines[0].startsWith('# ')) throw new Error(`${file}: 件头第一行不是 H1`)
  const header = lines.slice(1, 10)
  if (!header.some((l) => l.startsWith('> 件定位：'))) throw new Error(`${file}: 件头缺「> 件定位：」`)
  if (!header.some((l) => l.startsWith('> 消费位：'))) throw new Error(`${file}: 件头缺「> 消费位：」`)
}

function isPieceFile (file) {
  return !/^\d/.test(file)
}

/** 主命令：遍历映射表，净版输出→比对或写入。返回退出码。 */
export function run (sourceDir, outRoot, mode) {
  let drift = 0
  const sectionOwners = new Map()
  for (const { file, skill } of MAPPING) {
    const srcPath = nodePath.join(sourceDir, file)
    const distPath = nodePath.join(outRoot, skill, 'references', file)
    if (!fs.existsSync(srcPath)) {
      console.log(`缺失源文件：${srcPath}`)
      drift++
      continue
    }
    if (isPieceFile(file)) assertPieceHeader(file, fs.readFileSync(srcPath, 'utf8'))
    const cleaned = cleanVersion(file, fs.readFileSync(srcPath, 'utf8'))
    for (const m of cleaned.matchAll(/^## §(\d+\.\d+) /gm)) {
      const id = m[1]
      if (sectionOwners.has(id)) {
        console.log(`节重复：§${id} 同时在 ${sectionOwners.get(id)} 与 ${file}`)
        drift++
      } else sectionOwners.set(id, file)
    }
    if (mode === 'write') {
      fs.mkdirSync(nodePath.dirname(distPath), { recursive: true })
      fs.writeFileSync(distPath, cleaned, 'utf8')
      console.log(`已写入：${distPath}`)
      continue
    }
    if (!fs.existsSync(distPath)) {
      console.log(`漂移：分发件不存在 ${distPath}`)
      drift++
      continue
    }
    const current = fs.readFileSync(distPath, 'utf8')
    if (current === cleaned) {
      console.log(`一致：${skill}/references/${file}`)
      continue
    }
    const curLines = current.split('\n')
    const newLines = cleaned.split('\n')
    let at = 0
    while (at < Math.min(curLines.length, newLines.length) && curLines[at] === newLines[at]) at++
    console.log(`漂移：${skill}/references/${file}（首个差异在第 ${at + 1} 行）`)
    console.log(`  分发件: ${(curLines[at] ?? '<EOF>').slice(0, 80)}`)
    console.log(`  净版出: ${(newLines[at] ?? '<EOF>').slice(0, 80)}`)
    drift++
  }
  const code = drift === 0 ? 0 : 1
  if (mode === 'check') console.log(drift === 0 ? '全部一致（退出码 0）' : `${drift} 处漂移（退出码 1）`)
  if (process.argv[1] !== undefined && process.argv[1].endsWith('kb-extract.mjs')) process.exit(code)
  return code
}
