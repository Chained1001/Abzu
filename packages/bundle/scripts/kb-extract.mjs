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

const KB_VERSION = 'v2.0.2'
const STAMP = `> 知识库净版 · 源版本 ${KB_VERSION} · 净版纪律见 docs/design/增强实施计划.md §二`

/** 分发映射表（单源）：KB 文件 → 技能 references/ 目录。 */
const MAPPING = [
  { file: '01_开书.md', skill: 'novel-design' },
  { file: '02_人物设计.md', skill: 'novel-design' },
  { file: '03_世界观设计.md', skill: 'novel-design' },
  { file: '04_大纲.md', skill: 'novel-design' },
  { file: '05_卷纲.md', skill: 'novel-design' },
  { file: '06_章纲.md', skill: 'novel-outline' },
  { file: '07_正文写作.md', skill: 'novel-drafting' },
  { file: '08_修订排障.md', skill: 'novel-director' },
  { file: '0A_第一性原理层.md', skill: 'novel-design' },
]

/**
 * 改写表：净版纪律中无法机械归纳的既定编辑裁定（逐字引语改写为判据句式、
 * 黑名单词按语境改写、附录指针改写），逐条钉死原句→净版句。
 * KB 升版后源句变动会使对应条目失配——--check 报漂移，人工重审后更新本表。
 */
const REWRITES = {
  '01_开书.md': [
    ['> **类型特化**：写女频文详见「附.2 女频类型怎么特化」及附.7-附.11各子类型。', '> **类型特化**：写女频文的类型特化判据在知识库附录（附.2 及附.7-附.11——附录不分发、运行时不可读）。'],
    ['- 理论课的**人前显圣**推演：', '- **人前显圣**推演：'],
    ['- 《小说的骨架》的样板前提句：「记者克里斯发现他入睡后进入另一个世界，那个世界正处在崩溃边缘，他别无选择唯有拯救它」——主人公', '- 样板前提句（《小说的骨架》）：记者克里斯入睡后会进入另一个世界，那个世界濒临崩溃，他别无选择、唯有拯救它——主人公'],
    ['- 《救猫咪》的意外样板：「一个警察来到洛杉矶看望分居的妻子，妻子的办公室被恐怖分子占领了」（《虎胆龙威》）——', '- 意外样板（《救猫咪》评《虎胆龙威》）：一个警察去洛杉矶看望分居的妻子，赶到时妻子的办公室已被恐怖分子占领——'],
    ['用他的话说是"像一个球一样为核心服务"，所有面都指向同一个中心。', '所有设定像球面一样朝向核心这一个中心。'],
    ['同一个概念。素材原词是"灵魂契约"；全书统一用"核心卖点"', '同一个概念的不同叫法；全书统一用"核心卖点"'],
  ],
  '02_人物设计.md': [
    ['> **类型特化**：写女频文详见「附.2 女频类型怎么特化」及附.7-附.11各子类型。', '> **类型特化**：写女频文的类型特化判据在知识库附录（附.2 及附.7-附.11——附录不分发、运行时不可读）。'],
    ['> **类型特化**：写权谋文详见「附.1 权谋类型怎么特化」。', '> **类型特化**：写权谋文的类型特化判据在知识库附录（附.1——附录不分发、运行时不可读）。'],
    ['遗物补刀/因果闭环/温柔一刀', '遗物补刀/因果扣合/温柔一刀'],
    ['- 番茄官方给的正例：', '- 正例：'],
  ],
  '03_世界观设计.md': [
    ['随文微调 ≠ 开篇前不用设计。三九音域说得很清楚："要实现这种层层递进，就必须在开篇前设计好整个故事的世界观。"开篇前定死的是', '随文微调 ≠ 开篇前不用设计。层层递进的前提是开篇前设计好整个故事的世界观。开篇前定死的是'],
    ['这四条串起来就是一个闭环，闭环立不住', '这四条串起来就是一个循环，循环立不住'],
    ['| 路径 | 怎么设计经济闭环 | 例子 |', '| 路径 | 怎么设计经济循环 | 例子 |'],
    ['都要落到**闭环自洽**', '都要落到**循环自洽**'],
    ['→ 经济闭环对了', '→ 经济循环对了'],
    ['### 常见错误（本质上都是经济没有闭环）', '### 常见错误（本质上都是经济循环没立住）'],
    ['| 经济闭环 | 世界经济/资源怎么设计 |', '| 经济循环 | 世界经济/资源怎么设计 |'],
  ],
  '04_大纲.md': [
    ['§4.11 潜文本象征已移附录·附.12；', '§4.11 潜文本象征已移知识库附录·附.12——附录不分发、运行时不可读；'],
    ['**另一套续法（分歧保留）**：理论课程按"目标怎么接续"给主线续命', '**另一套续法（分歧保留）**：按"目标怎么接续"给主线续命'],
    ['**另一套分法（分歧保留）**：B站课程按"主线怎么组织"分三式', '**另一套分法（分歧保留）**：按"主线怎么组织"分三式'],
    ['每一卷独立闭环、承上启下', '每一卷独立完整、承上启下'],
    ['卷里没有完整闭环', '卷里没有完整故事'],
    ['> **本节已移出**：文学性内容，对百万字连载的结构决策边际价值低，整体移至**附录·附.12**。', '> **本节已移出**：文学性内容（象征/潜文本属精修层），整体移至知识库附录·附.12（附录不分发、运行时不可读）。'],
    ['- 《斩神》《我不是戏神》用**活大纲法（网文版）**：三九音域开书前会准备大纲，但"写到那个地步的时候，就会发现有一条路可能更好，发展可能会更有意思，所以就会抛弃原来的，去选择新的路线。所以凡是有大纲都会被我推翻，后来就没有大纲了"。不是真没有', '- 《斩神》《我不是戏神》用**活大纲法（网文版）**：三九音域开书前会准备大纲，但写到中途发现更好的路线就抛弃原案重选——大纲一路被推翻，最后只剩世界观大框架和核心精神。不是真没有'],
    ['**要不要写大纲**：老编辑结论——争论的两极', '**要不要写大纲**：争论的两极'],
    ['一卷的功能=单卷内部的目标/冲突/闭环（第五章）', '一卷的功能=单卷内部的目标/冲突/完整结构（第五章）'],
    ['> **类型特化**：写悬疑文详见「附.3 悬疑类型怎么特化」。', '> **类型特化**：写悬疑文的类型特化判据在知识库附录（附.3——附录不分发、运行时不可读）。'],
    ['> **类型特化**：写权谋文详见「附.1 权谋类型怎么特化」。', '> **类型特化**：写权谋文的类型特化判据在知识库附录（附.1——附录不分发、运行时不可读）。'],
  ],
  '05_卷纲.md': [
    ['每一卷独立闭环、承上启下', '每一卷独立完整、承上启下'],
    ['每一卷独立闭环、同时承上启下', '每一卷独立完整、同时承上启下'],
    ['如果这一卷没有独立闭环，读者就没有阶段感', '如果这一卷不能独立成篇，读者就没有阶段感'],
    ['都要落到**独立闭环**——这一卷独立看是完整的', '都要落到**独立完整**——这一卷独立看是完整的'],
    ['- 有（独立闭环）→ 卷纲对了', '- 有（独立成篇）→ 卷纲对了'],
    ['（素材未给三幕，按争夺目标排：明面争什么+暗线争什么）', '（三幕按争夺目标排：明面争什么+暗线争什么）'],
    ['**第二套参考系：按"读者要什么"选基调（网文经典结构九类）**。上表按', '**第二套参考系：按"读者要什么"选基调的九类**。上表按'],
    ['| 素材未标 |', '| — |'],
    ['**时间线管理三件**（咕嘎72理论库，延伸档）：', '**时间线管理三件**：'],
    ['| 本卷核心目标 | 一卷的功能是什么 | 独立闭环 |', '| 本卷核心目标 | 一卷的功能是什么 | 独立完整 |'],
    ['一卷=一套完整的阶段目标+起承转合，独立闭环；一章=', '一卷=一套完整的阶段目标+起承转合，独立成篇；一章='],
    ['一卷的功能=单卷内部的目标/冲突/闭环（本章）；分卷规划=', '一卷的功能=单卷内部的目标/冲突/完整结构（本章）；分卷规划='],
  ],
  '06_章纲.md': [
    ['**核心逻辑**：不管这一章主要干什么，最终都要落到**一章一个小闭环**——有头有尾有钩。', '**核心逻辑**：不管这一章主要干什么，最终都要落到**一章一个完整小单元**——有头有尾有钩。'],
    ['，详见 `0A_第一性原理层.md`）', '）'],
  ],
  '07_正文写作.md': [
    ['，详见 `0A_第一性原理层.md`）', '）'],
    ['**分歧条件**：素材里对"一次用几种感官"有两说', '**分歧条件**：对"一次用几种感官"有两说'],
    ['老舍自述词汇贫乏第三根源＝生活/艺术知识太少——不懂音乐绘画只会"好听/好看"，写不出具体词不是文采不够，是认知颗粒度太粗："一个人的词汇边界，说到底就是他感受世界的边界"', '词汇贫乏的一大根源是生活/艺术知识太少——不懂音乐绘画只会"好听/好看"，写不出具体词不是文采不够，是认知颗粒度太粗；词汇边界就是感受世界的边界'],
    ['**更狠的一招（动笔前用）**：三九音域写悲情场景，不是直接写，是"先构思，脑海中有画面，先把自己的情绪酝酿到位，然后才能去把它写下来。中间这个把自己情绪酝酿到位的过程，其实就是在刀我自己。我觉得这个刀好像还可以，还可以更刀一点，还是不够让我痛。"——他写刀子，先把自己刀到痛了才落笔。所以死亡戏', '**更狠的一招（动笔前用）**：写悲情场景不直接落笔——先构思画面，把自己的情绪酝酿到位才写；酝酿的过程就是先把自己"刀"到痛，觉得还不够痛就继续加深。所以死亡戏'],
  ],
  '08_修订排障.md': [
    ['网文资料菌#34 说得更直接：期待感的本质是信息差', '期待感的本质是信息差'],
    ['另一层根子（理论课程，与上面并存）：', '另一层根子（与上面并存）：'],
    ['——四个学科的多线研究收敛于同一结构，见 §8.10）', '，见 §8.10）'],
    ['**相关联**：← 伏笔没收怎么办｜ → 附.13 循环文设定账本', '**相关联**：← 伏笔没收怎么办'],
  ],
  '0A_第一性原理层.md': [
    ['§4.9→§6.7 悬念维持、附.1 权谋（读者知道所有棋手底牌看互算）', '§4.9→§6.7 悬念维持、权谋（读者知道所有棋手底牌看互算）'],
    ['（每步目标都是一次付出与收获的交换——编者演绎）', '（每步目标都是一次付出与收获的交换）'],
    ['**推导的完整示范**：原语落到具体类型怎么长出整套写法——见附录（附.1–附.3、附.7–附.11，每节开头标注了原语来源）。看懂那里的推导过程，你就能给任何类型自己长出写法。', '**推导的完整示范**：原语落到具体类型怎么长出整套写法——完整推导示范在知识库附录（附.1–附.3、附.7–附.11，每节开头标注了原语来源；附录不分发、运行时不可读）。'],
    ['**相关联**：→ 总目录（全库导航）｜各原语详情见上列各节', '**相关联**：各原语详情见上列各节'],
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

/** 主命令：遍历映射表，净版输出→比对或写入。返回退出码。 */
export function run (sourceDir, outRoot, mode) {
  let drift = 0
  for (const { file, skill } of MAPPING) {
    const srcPath = nodePath.join(sourceDir, file)
    const distPath = nodePath.join(outRoot, skill, 'references', file)
    if (!fs.existsSync(srcPath)) {
      console.log(`缺失源文件：${srcPath}`)
      drift++
      continue
    }
    const cleaned = cleanVersion(file, fs.readFileSync(srcPath, 'utf8'))
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
