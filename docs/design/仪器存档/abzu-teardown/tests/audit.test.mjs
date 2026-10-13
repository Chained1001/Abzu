import { test } from 'node:test'
import { strictEqual, ok, deepStrictEqual } from 'node:assert'
import { audit } from '../../skills/abzu-teardown/scripts/teardown/audit.mjs'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// 测试用小样本——正文不以"第N章"开头（防误匹配）
const SAMPLE_3CH = `第一章 开始
这是开头的内容。许七安醒来发现自己在牢里，四周是石头墙，空气潮湿。他记得自己应该在家里，怎么到了这里。这是足够长的测试文本。他站起身，走到窗边看了看外面的天色。天色阴沉，远处传来打更的声音。他数了数，正是三更天。大牢里很安静，只有远处偶尔传来犯人的鼾声。他靠回墙壁，开始整理脑海中纷乱的记忆。穿越、税银案、流放，这三件事压在心头。他必须想办法自救，否则三天后就万劫不复。

第二章 继续
这里继续。他开始检查记忆，发现自己穿越了。原来这个身体也叫许七安，是个捕快。三天后要被流放。这里还有更多文字来确保字数。他回忆着原身的经历，试图找到突破口。税银案是关键，如果能查清真相，或许还有转机。他开始在脑海中梳理线索，从税银丢失的时间地点，到所有相关人员，一条条过筛。牢房的门突然被推开，一个狱卒送来了晚饭。他看着碗里的冷饭，思绪万千。

第三章 结束
最后一段。他决定自救。首先需要搞清楚税银案是怎么回事。这里是最后的测试数据，确保字数够。他站起身来，在牢房里来回踱步。三天时间说长不长，说短不短。他已经想好了第一步，就是利用自己前世的经验，从细节入手。狱卒走过来催他睡觉，他躺下装睡，脑子里却在飞速运转。计划已经初步成形，明天就开始执行。`

const SAMPLE_NO_CH = '这不是小说，没有章节标记，只是普通文本。'

const SAMPLE_VOL = `第一卷 起始
第一章 卷一第一章
内容。

第二章 卷一第二章
内容。
(本卷终)

第二卷 展开
第三章 卷二第一章
内容。`

function writeTemp (content, suffix = '.txt') {
  const dir = mkdtempSync(join(tmpdir(), 'abzu-test-'))
  const file = join(dir, 'test' + suffix)
  writeFileSync(file, content, 'utf8')
  return { file, dir }
}

test('audit — 正常三章样本', () => {
  const { file, dir } = writeTemp(SAMPLE_3CH)
  const result = audit(file)
  strictEqual(result.totalChapters, 3)
  strictEqual(result.usableRate, '100.0%')
  ok(result.totalChars > 50)
  ok(result.chapters[0].title.includes('第一章'))
  ok(result.chapters[0].sha.length === 12)
  rmSync(dir, { recursive: true })
})

test('audit — 空章检测', () => {
  const content = SAMPLE_3CH + '\n第四章 空章\n'
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.totalChapters, 4)
  ok(result.emptyChapters.length >= 1, `应检出空章，实际 ${result.emptyChapters.length}`)
  rmSync(dir, { recursive: true })
})

test('audit — 无章节标记', () => {
  const { file, dir } = writeTemp(SAMPLE_NO_CH)
  const result = audit(file)
  strictEqual(result.totalChapters, 0)
  rmSync(dir, { recursive: true })
})

test('audit — 分卷检测', () => {
  const { file, dir } = writeTemp(SAMPLE_VOL)
  const result = audit(file)
  strictEqual(result.totalChapters, 3)
  strictEqual(result.chapters[0].vol, 1)
  strictEqual(result.chapters[2].vol, 2)
  rmSync(dir, { recursive: true })
})

test('audit — 章号连续性（正常）', () => {
  const { file, dir } = writeTemp(SAMPLE_3CH)
  const result = audit(file)
  deepStrictEqual(result.continuity.gaps, [])
  deepStrictEqual(result.continuity.duplicates, [])
  deepStrictEqual(result.authorNotes, [])
  rmSync(dir, { recursive: true })
})

test('audit — 作者附注检出', () => {
  const content = SAMPLE_3CH + '\n第四章 附注章\n这里是有正文的内容，长度足够不被判为空章。他接着推行自己的计划，一切按部就班。\nPS：求月票，明天三更。\n感谢各位的支持。\n'
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.authorNotes.length, 1)
  strictEqual(result.authorNotes[0].chNum, 4)
  ok(result.authorNotes[0].noteLines >= 2, `附注行数应≥2，实际 ${result.authorNotes[0].noteLines}`)
  rmSync(dir, { recursive: true })
})

test('audit — 中文数字章号（分段算法）', () => {
  const body = '这里是足够长的正文内容，用来通过空章检测。'.repeat(8)
  const content = `第二十章 中文一\n${body}\n\n第二十一章 中文二\n${body}\n\n第二十二章 中文三\n${body}\n\n第一百零一章 大数\n${body}\n\n第一千三百九十四章 万级\n${body}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.chapters[0].chNum, 20, `二十应=20，实际 ${result.chapters[0].chNum}`)
  strictEqual(result.chapters[1].chNum, 21)
  strictEqual(result.chapters[2].chNum, 22)
  strictEqual(result.chapters[3].chNum, 101, `一百零一应=101，实际 ${result.chapters[3].chNum}`)
  strictEqual(result.chapters[4].chNum, 1394, `一千三百九十四应=1394，实际 ${result.chapters[4].chNum}`)
  deepStrictEqual(result.continuity.duplicates, [], '二十/二十二不应与其他章号撞号')
  deepStrictEqual(result.continuity.unparsed, [])
  rmSync(dir, { recursive: true })
})

test('audit — CRLF 与 BOM 不影响字数与 sha', () => {
  const body = '正文内容保持一致用于对照。'.repeat(10)
  const a = writeTemp(`第一章 A\n${body}\n`)
  const b = writeTemp('\uFEFF' + `第一章 A\r\n${body}\r\n`)
  const ra = audit(a.file)
  const rb = audit(b.file)
  strictEqual(rb.totalChapters, 1)
  strictEqual(ra.chapters[0].charCount, rb.chapters[0].charCount, 'CRLF 的 \\r 不应计入字数')
  strictEqual(ra.chapters[0].sha, rb.chapters[0].sha, 'sha 不应受行尾影响')
  rmSync(a.dir, { recursive: true })
  rmSync(b.dir, { recursive: true })
})

test('audit — 卷标收紧：长正文行首"第N卷"不判卷', () => {
  const body = '正文。'.repeat(30)
  const longVolLine = '第一卷的总结陈词从这里开始写起，这一行虽然以卷号开头但其实是正文内容，长度远超二十个字符的限制，不应被判定为卷标题才对。'
  const content = `第一章 起\n${body}\n${longVolLine}\n\n第二章 承\n${body}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.chapters[0].vol, null, '长行不应触发分卷')
  strictEqual(result.chapters[1].vol, null)
  rmSync(dir, { recursive: true })
})

test('audit — (上)(下) 是分章不是噪音', () => {
  const body = '正文内容足够长。'.repeat(20)
  const content = `第一章 起(上)\n${body}\n\n第二章 起(下)\n${body}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.chapters[0].isSplit, true)
  strictEqual(result.chapters[0].isNoise, false)
  deepStrictEqual(result.noiseChapters, [])
  strictEqual(result.usableCount, 2, '(上)(下) 章应计入可用')
  rmSync(dir, { recursive: true })
})

test('audit — 空章骤降不算收口跳点', () => {
  const long = '正文内容。'.repeat(400)
  const content = `第一章 长章\n${long}\n\n第二章 空章\n三个字\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  deepStrictEqual(result.cliffPoints, [], '当前章 <200 字的骤降应被下限过滤')
  rmSync(dir, { recursive: true })
})

test('audit — 分卷归属：题前式（卷标在旧卷末章尾部）不把末章划进下一卷', () => {
  // 三卷各 4 章、卷内编号重启；卷二/卷三标记行落在上一卷末章正文尾部（大奉式布局）
  // 正文不以"第N章"开头——防 CH_RE 误判（本文件头部既定纪律）
  const b1 = '甲卷首章内容。'.repeat(40); const b2 = '乙章正文内容。'.repeat(40); const b3 = '丙章正文内容。'.repeat(40); const b4 = '丁章正文内容。'.repeat(40)
  const content = `第一卷 甲\n第一章\n${b1}\n\n第二章\n${b2}\n\n第三章\n${b3}\n\n第四章\n${b4}\n第二卷 乙\n第一章\n${b1}\n\n第二章\n${b2}\n\n第三章\n${b3}\n\n第四章\n${b4}\n第三卷 丙\n第一章\n${b1}\n\n第二章\n${b2}\n\n第三章\n${b3}\n\n第四章\n${b4}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.totalChapters, 12, `应恰 12 章，实际 ${result.totalChapters}（正文行首误判章题会翻倍）`)
  strictEqual(result.chapters[3].vol, 1, '卷一末章（全局第4章）应留在卷一')
  strictEqual(result.chapters[4].vol, 2, '卷二首章（全局第5章）应属卷二')
  strictEqual(result.chapters[7].vol, 2, '卷二末章（全局第8章）应留在卷二')
  strictEqual(result.chapters[8].vol, 3, '卷三首章（全局第9章）应属卷三')
  strictEqual(result.chapters[9].vol, 3)
  strictEqual(result.volumeSummary['1'].start, 1)
  strictEqual(result.volumeSummary['1'].end, 4)
  strictEqual(result.volumeSummary['2'].start, 5)
  strictEqual(result.volumeSummary['2'].end, 8)
  rmSync(dir, { recursive: true })
})

test('audit — 分卷归属：后置式（卷标在首章题后数行内）贴靠归本卷', () => {
  const b1 = '正文内容。'.repeat(40)
  // 卷二标记紧跟第二章（新卷首章）标题之后——最近章题绑定：归第二章
  const content = `第一章 旧卷末\n${b1}\n\n第二章 新卷首\n\n第二卷 乙\n\n${b1}\n\n第三章 卷二续\n${b1}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.chapters[0].vol, null, '无卷一标记——旧卷末章 vol 为空')
  strictEqual(result.chapters[1].vol, 1, '后置卷标贴靠后，新卷首章属首个卷')
  strictEqual(result.chapters[2].vol, 1)
  rmSync(dir, { recursive: true })
})

test('audit — 2合1 噪音章不制造假收口跳点', () => {
  const long = '正文内容。'.repeat(400)
  const content = `第一章 正常章\n${long}\n\n第二章 合并(2合1)\n${long}${long}\n\n第三章 正常章\n${long}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  ok(result.chapters[1].isNoise, '2合1 应标噪音')
  ok(result.cliffPoints.every(c => c.after !== 2 && c.after !== 3), '噪音章前后的骤降不应入跳点')
  rmSync(dir, { recursive: true })
})

test('audit — 高潮块/块间距/谱型/卷末标记', () => {
  const base = '日常正文内容。'.repeat(20)
  const peak = '高潮爆发内容！'.repeat(100)
  let t = ''
  for (let i = 1; i <= 30; i++) {
    t += `第${i}章\n${i % 10 === 0 ? peak : base}\n\n`
  }
  t += '(本卷终)\n'
  const { file, dir } = writeTemp(t)
  const result = audit(file)
  ok(result.climaxBlocks.length >= 2, `应检出高潮块（10/20/30 章峰值），实际 ${result.climaxBlocks.length}`)
  ok(result.blockIntervals.list.length >= 1 && typeof result.blockIntervals.median === 'number', 'blockIntervals 应为含 median 的对象')
  ok(result.chapters[29].isVolEnd, '(本卷终) 应标卷末')
  rmSync(dir, { recursive: true })
})

test('audit — 谱型判定（宽谱/窄谱）', () => {
  const flat = '内容一致。'.repeat(20)
  let t = ''
  for (let i = 1; i <= 20; i++) t += `第${i}章\n${flat}\n\n`
  const a = writeTemp(t)
  const rFlat = audit(a.file)
  strictEqual(rFlat.spectrum, '窄谱')

  let t2 = ''
  for (let i = 1; i <= 20; i++) t2 += `第${i}章\n${i % 3 === 0 ? flat + flat + flat + flat : flat}\n\n`
  const b = writeTemp(t2)
  const rWide = audit(b.file)
  strictEqual(rWide.spectrum, '宽谱', `p75/p25=${rWide.lengthStats.p75p25} 应>1.3`)
  rmSync(a.dir, { recursive: true })
  rmSync(b.dir, { recursive: true })
})

test('audit — 卷内重编号不算重复（无卷标书）', () => {
  const body = '正文内容足够长用来通过空章检测线。'.repeat(8)
  const content = `第一章 甲\n${body}\n\n第二章 乙\n${body}\n\n第一章 丙\n${body}\n\n第二章 丁\n${body}\n`
  const { file, dir } = writeTemp(content)
  const result = audit(file)
  strictEqual(result.continuity.numbering, '卷内编号（无卷标）')
  deepStrictEqual(result.continuity.duplicates, [])
  deepStrictEqual(result.continuity.gaps, [])
  rmSync(dir, { recursive: true })
})

test('audit — 正文行号与 grep -n 对齐', () => {
  const { file, dir } = writeTemp(SAMPLE_3CH)
  const result = audit(file)
  const lines = SAMPLE_3CH.split('\n')
  const t2 = lines.findIndex(l => l.startsWith('第二章'))
  strictEqual(result.chapters[1].lineStart - 1, t2 + 1, 'lineStart-1 应等于下一章标题的 grep -n 行号')
  strictEqual(result.chapters[0].lineStart, 2, '首章正文从第 2 行起')
  ok(result.chapters[0].lineEnd > result.chapters[0].lineStart)
  strictEqual(typeof result.version, 'string')
  rmSync(dir, { recursive: true })
})
