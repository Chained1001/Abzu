/**
 * 写前十查机械部分脚本的 CLI 逻辑（⑥爽点铺垫对账＋⑧近五章重复——机械比对交脚本）。
 *
 * 本模块经薄入口 `skills/novel-outline/scripts/十查机械.mjs` 动态引 lib 调用。
 * 只算不写：读候选细纲「冲突与爽点」「本章形状」与细纲段单元行、账本/承诺进行中条目、
 * 上一章章摘要、本卷近五份确认细纲，机械比对产出候选行；机械行是呈确认件的原料，
 * 真铺垫/真重复的语义判断仍归主 Agent（十查是检查不是门禁）。
 * argv 进、退出码出，模块顶层零副作用。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseDocument, paths, queryDueLedger, queryLedger, resolveDraftRel, type LedgerQueryResult } from '@abzu/core'

/** ③伏笔到期 三组成员项输出条数上限(每条一行,防止单章输出淹没)。 */
const DUE_ROW_LIMIT = 12
/** ④接钩:上一章定稿正文末段取长上限(按段落取,超长如实截断)。 */
const PREV_TAIL_LIMIT = 240

/** 虚词大字不计入内容双字——避免任意两段中文都撞出「一个／到了」式假命中。 */
const FUNCTION_CHARS = new Set('的了是在和与就都也很个又一不没我你他她它这那及被把让向上下中出说到做去来还要'.split(''))

/** ⑧同款转折关键词：候选与确认细纲单元行同现即出候选行；枚举单源在本脚本，语义判断归主 Agent。 */
const TURN_KEYWORDS = ['反转', '误会', '揭穿', '摊牌', '背叛', '反目', '突袭', '遇袭', '伏击', '救场', '绝地', '翻盘', '反杀', '暴露', '灭门', '认亲'] as const

/** ⑥冲突层行与低压章「往下看的理由」行不是爽点位，不计入铺垫对账。 */
const NON_PAYOFF_LINE = /^(?:[-*]\s*)?(?:外部|人际|内心|往下看的理由)\s*[：:]/

function argValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  if (i === -1) return undefined
  const value = argv[i + 1]
  // Y7(批F):后随值以 -- 开头＝本参数缺值(值位被下一选项占住)——按缺失处理,由调用方点名报参数缺失
  return value === undefined || value.startsWith('--') ? undefined : value
}

function readBookFile(book: string, rel: string): string | null {
  try {
    return fs.readFileSync(path.join(book, ...rel.split('/')), 'utf-8')
  } catch {
    return null
  }
}

/** 剥 frontmatter 取正文；解析失败带明细抛出，由调用方按运行异常分流。 */
function bodyOf(text: string): string {
  const parsed = parseDocument(text)
  if (!parsed.ok) throw new Error(`frontmatter 解析失败：${parsed.detail}`)
  return parsed.data.body.replace(/\r\n/g, '\n')
}

/** 取「### 标题」小节正文（到下一个任意级别标题为止）；缺节返回 null。 */
function section(body: string, title: string): string | null {
  const lines = body.split('\n')
  const start = lines.findIndex(line => line.trim() === `### ${title}`)
  if (start < 0) return null
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,6}\s/.test(lines[i]!.trim())) {
      end = i
      break
    }
  }
  return lines.slice(start + 1, end).join('\n').trim()
}

/** 中文内容字双字集合——字符串相似的机械底座。 */
function contentBigrams(text: string): Set<string> {
  const grams = new Set<string>()
  for (const run of text.match(/[\u4e00-\u9fff]{2,}/g) ?? []) {
    for (let i = 0; i + 1 < run.length; i += 1) {
      const a = run[i]!
      const b = run[i + 1]!
      if (!FUNCTION_CHARS.has(a) && !FUNCTION_CHARS.has(b)) grams.add(a + b)
    }
  }
  return grams
}

function sharedBigrams(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let shared = 0
  for (const gram of a) if (b.has(gram)) shared += 1
  return shared
}

function dice(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  return (2 * sharedBigrams(a, b)) / (a.size + b.size)
}

/** ≥3 字连续中文段——⑧稀有内容词重合的取词口径。 */
function contentRuns(text: string): string[] {
  return text.match(/[\u4e00-\u9fff]{3,}/g) ?? []
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/^(?:[-*]\s*)?/, '').replace(/^(?:爽点位(?:分级)?|铺垫)\s*[：:]/, '').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`
}

/** 细纲段单元行（六字段行全文）——「## 细纲段」之后取，定位段列表行不混入。 */
function unitRows(body: string): string {
  const lines = body.split('\n')
  const start = lines.findIndex(line => line.trim() === '## 细纲段')
  const tail = start < 0 ? lines : lines.slice(start + 1)
  return tail.filter(line => /^\s*[-*]\s+\S/.test(line)).join('\n')
}

interface OutlineDoc {
  readonly file: string
  readonly shape: string | null
  readonly units: string
}

function readOutlineDoc(file: string, text: string): OutlineDoc {
  const body = bodyOf(text)
  return { file, shape: section(body, '本章形状'), units: unitRows(body) }
}

/** 目录内「NNNN-*.md」按章号排（升序）；目录不存在返回空。 */
function chapterFiles(book: string, 卷: number, kind: '章摘要' | '章细纲'): ReadonlyArray<{ readonly name: string; readonly no: number }> {
  const dir = path.join(book, '大纲', '卷规划', `卷${String(卷).padStart(2, '0')}`, kind)
  let names: string[] = []
  try {
    names = fs.readdirSync(dir).filter(name => /^\d{4}-.+\.md$/i.test(name))
  } catch {
    return []
  }
  return names
    .map(name => ({ name, no: Number(/^(\d{4})-/.exec(name)?.[1]) }))
    .filter(item => Number.isInteger(item.no))
    .sort((a, b) => a.no - b.no)
}

function readVolumeFile(book: string, 卷: number, kind: '章摘要' | '章细纲', name: string): string | null {
  return readBookFile(book, `大纲/卷规划/卷${String(卷).padStart(2, '0')}/${kind}/${name}`)
}

/** 章摘要目录里章号小于目标章的最大一份；本卷没有回上一卷，再没有返回 null。 */
function previousSummary(book: string, 卷: number, 章: number): { readonly file: string; readonly text: string } | null {
  const found = previousChapter(book, 卷, 章)
  return found === null ? null : { file: found.summaryFile, text: found.summaryBody }
}

interface PreviousChapter {
  readonly 卷: number
  readonly no: number
  readonly 名: string
  readonly summaryFile: string
  readonly summaryBody: string
}

/** 上一章的定位（本卷取章号小于目标章的最大一份；本卷首章回上一卷末章）；没有返回 null。 */
function previousChapter(book: string, 卷: number, 章: number): PreviousChapter | null {
  for (const vol of [卷, ...(卷 > 1 ? [卷 - 1] : [])]) {
    const last = chapterFiles(book, vol, '章摘要').filter(item => item.no < 章).at(-1)
    if (last === undefined) continue
    const text = readVolumeFile(book, vol, '章摘要', last.name)
    if (text === null) continue
    return { 卷: vol, no: last.no, 名: last.name.replace(/^\d{4}-/, '').replace(/\.md$/i, ''), summaryFile: last.name, summaryBody: bodyOf(text) }
  }
  return null
}

/** ③伏笔到期:到期/逾期/区间不明三组机械列行(候选行,不是结论)。 */
function dueRows(book: string, 卷: number, 章: number): Record<string, unknown> {
  const due = queryDueLedger(book, { 卷, 章 })
  // 三态与承诺账本同口径:批8 分类单本降载后 queryLedger({分类:'线索'}) 只读线索这一本账,
  // ok:false 即线索账本自身缺失/不可读/解析失败(不再因其余账本缺失连坐)——仍按
  // 「线索.md 是否在读入文件里」判在读,再看 read 失败原因。
  const ledger = queryLedger(book, { 分类: '线索' })
  const 账本状态 = 承诺账本状态(ledger, paths.账本('线索'))
  const row = (item: { readonly 名称: string; readonly 预期兑现区间: string; readonly 状态: string; readonly 超出幅度?: number }) =>
    `${item.名称}｜预期兑现区间：${item.预期兑现区间 || '（未填）'}｜状态：${item.状态}${item.超出幅度 === undefined ? '' : `｜超出 ${item.超出幅度} 章`}`
  const 到期 = due.到期.slice(0, DUE_ROW_LIMIT).map(row)
  const 逾期 = due.逾期.slice(0, DUE_ROW_LIMIT).map(row)
  const 区间不明 = due.区间不明.slice(0, DUE_ROW_LIMIT).map(row)
  const 行: string[] = [
    ...到期.map(line => `到期：${line}`),
    ...逾期.map(line => `逾期：${line}`),
    ...区间不明.map(line => `预期兑现区间无法解析：${line}`),
  ]
  if (行.length === 0) {
    行.push(账本状态 === '已读' ? '无到期/逾期/区间不明线索（截至本章）' : `线索账本${账本状态}——到期线索无从核对，先处理账本`)
  }
  return {
    账本状态,
    到期条数: due.到期.length,
    逾期条数: due.逾期.length,
    区间不明条数: due.区间不明.length,
    行,
  }
}

/** ④接钩:上一章章摘要末行原文＋上一章定稿正文最后一段(按段落取,如实写缺)。 */
function hookRows(book: string, 卷: number, 章: number): Record<string, unknown> {
  const prev = previousChapter(book, 卷, 章)
  if (prev === null) return { 上一章: null, 章摘要末行: null, 定稿末段: null, 行: ['无上章'] }
  const summaryLines = prev.summaryBody.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).filter(line => line !== '')
  const 末行 = summaryLines.at(-1) ?? null
  // 定稿正文末段:路径 定稿/卷NN/NNNN-章名.md；取不到如实写缺(不必区分「未定稿」与「读不了」)
  const 定稿文 = readBookFile(book, paths.定稿章(prev.卷, prev.no, prev.名))
  let 定稿末段: string | null = null
  if (定稿文 !== null) {
    try {
      const paras = bodyOf(定稿文).split(/\n\s*\n/).map(p => p.trim()).filter(p => p !== '')
      定稿末段 = paras.length === 0 ? null : truncate(paras.at(-1)!, PREV_TAIL_LIMIT)
    } catch { 定稿末段 = null }
  }
  const 行 = [
    `上一章：卷${String(prev.卷).padStart(2, '0')} 第${prev.no}章（${prev.summaryFile}）`,
    `章摘要末行：${末行 ?? '（缺）'}`,
    `定稿末段：${定稿末段 ?? '（缺：上一章定稿正文未落或不可读）'}`,
  ]
  return { 上一章: prev.summaryFile, 章摘要末行: 末行, 定稿末段, 行 }
}

/** 从候选细纲叙事单元取「人物」字段里的人名(顿号/逗号/空格切分,去重保序)。 */
function characterNames(units: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const line of units.split('\n')) {
    const m = /^\s*[-*]\s*人物\s*[：:]\s*(.*?)\s*$/.exec(line)
    if (m === null) continue
    for (const raw of m[1]!.split(/[、,，\s]+/)) {
      const name = raw.trim()
      if (name === '' || seen.has(name)) continue
      seen.add(name)
      names.push(name)
    }
  }
  return names
}

/** 出场间隔:对候选单元里的人名,从近到远找本卷(不足回上一卷)已确认章细纲最近出现的章号。 */
function appearanceRows(book: string, 卷: number, 章: number, candidate: OutlineDoc): Record<string, unknown> {
  const names = characterNames(candidate.units)
  if (names.length === 0) return { 行: ['候选细纲无「人物」字段——出场间隔无可取人名'] }
  // 从近到远:本卷确认细纲(排除同章号旧版)降序,随后上一卷降序
  const ordered: { readonly 卷: number; readonly no: number; readonly file: string }[] = []
  for (const vol of [卷, ...(卷 > 1 ? [卷 - 1] : [])]) {
    const items = chapterFiles(book, vol, '章细纲').filter(item => !(vol === 卷 && item.no === 章))
    for (const item of [...items].reverse()) ordered.push({ 卷: vol, no: item.no, file: item.name })
  }
  const 行 = names.map(name => {
    for (const item of ordered) {
      const text = readVolumeFile(book, item.卷, '章细纲', item.file)
      if (text === null) continue
      const doc = readOutlineDoc(item.file, text)
      if (!doc.units.includes(name)) continue
      const 间隔 = 章 - item.no
      return `${name}｜上次出场第${item.no}章｜间隔${间隔}章`
    }
    return `${name}｜本卷未出场`
  })
  return { 人名: names, 行 }
}

/** 本卷近五份确认细纲（新→旧），重入修订时同章号旧版不算近五章。 */
function recentOutlines(book: string, 卷: number, 章: number): OutlineDoc[] {
  return chapterFiles(book, 卷, '章细纲')
    .filter(item => item.no !== 章)
    .slice(-5)
    .reverse()
    .flatMap(item => {
      const text = readVolumeFile(book, 卷, '章细纲', item.name)
      return text === null ? [] : [readOutlineDoc(item.name, text)]
    })
}

function payoffRows(book: string, 卷: number, 章: number, body: string): Record<string, unknown> {
  const payoff = section(body, '冲突与爽点')
  if (payoff === null) {
    return { 承诺账本: '未读', 进行中承诺条目: 0, 上一章摘要: null, 行: ['候选缺「### 冲突与爽点」节——⑥机械对账无爽点位可取，先落节再查'] }
  }
  const ledger = queryLedger(book, { 分类: '承诺', 状态: '进行中' })
  const planted = ledger.entries
  const summary = previousSummary(book, 卷, 章)
  const sources = [
    ...planted.map(entry => ({
      label: `承诺「${entry.名称}」`,
      grams: contentBigrams([entry.名称, entry.正文, ...Object.values(entry.字段)].join('\n')),
    })),
    ...(summary === null ? [] : [{ label: `上章摘要(${summary.file})`, grams: contentBigrams(summary.text) }]),
  ]
  const rows = payoff.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !NON_PAYOFF_LINE.test(line))
  const lines = rows.length === 0
    ? ['无爽点位行（只有冲突层或「往下看的理由」行——低压章⑥如实空过）']
    : rows.map(row => {
      const grams = contentBigrams(row)
      const hits = sources.filter(source => sharedBigrams(grams, source.grams) >= 2).map(source => source.label)
      return hits.length === 0 ? `无铺垫：${truncate(row, 24)}` : `有候选铺垫：${truncate(row, 24)}｜←${hits.join('、')}`
    })
  const 承诺文件 = paths.账本('承诺')
  const 账本状态 = 承诺账本状态(ledger, 承诺文件)
  return { 承诺账本: 账本状态, 进行中承诺条目: planted.length, 上一章摘要: summary?.file ?? null, 行: lines }
}

/**
 * 承诺账本读侧状态（A-2 步 3）：
 * - `已读`：该文件确实读进来了；
 * - `解析失败`：读进来了但格式坏；
 * - `不可读`：文件在、这次读不了（io）——不得说成「未建账」；
 * - `未建账`：只有真·缺失（missing）才算。
 */
function 承诺账本状态(ledger: LedgerQueryResult, 承诺文件: string): string {
  if (ledger.files.includes(承诺文件)) return '已读'
  if (!ledger.ok && ledger.file === 承诺文件) {
    if (ledger.kind === 'parse-error') return '解析失败'
    if (ledger.kind === 'unreadable') return '不可读'
  }
  return '未建账'
}

function repeatRows(candidate: OutlineDoc, confirmed: readonly OutlineDoc[]): Record<string, unknown> {
  if (confirmed.length === 0) {
    return { 比对序列: [], 行: ['本卷无确认细纲（首章或跨卷）——⑧无可比对'] }
  }
  const candidateUnits = candidate.units
  const candidateRuns = contentRuns(candidateUnits)
  const rows: string[] = []
  const candidateShapeGrams = candidate.shape === null ? null : contentBigrams(candidate.shape)
  for (const doc of confirmed) {
    if (candidateShapeGrams !== null && doc.shape !== null) {
      const similarity = dice(candidateShapeGrams, contentBigrams(doc.shape))
      if (similarity >= 0.5) rows.push(`章形同款：${doc.file}（相似 ${similarity.toFixed(2)}）`)
    }
    const turns = TURN_KEYWORDS.filter(word => candidateUnits.includes(word) && doc.units.includes(word))
    if (turns.length > 0) rows.push(`转折同款：${turns.join('/')}｜${doc.file}`)
    const overlap = [...new Set(candidateRuns.filter(run => doc.units.includes(run) && confirmed.filter(other => other.units.includes(run)).length <= 2))]
    if (overlap.length >= 2) rows.push(`内容重合：${overlap.slice(0, 2).join('/')}｜${doc.file}`)
  }
  return { 比对序列: confirmed.map(doc => doc.file), 行: rows.length === 0 ? ['无同款'] : rows }
}

export function tenChecksCli(argv: readonly string[]): number {
  const book = argValue(argv, 'book')?.trim()
  const 章名 = argValue(argv, '章名')?.trim()
  const 卷 = Number(argValue(argv, '卷'))
  const 章 = Number(argValue(argv, '章'))
  if (!book) {
    console.error('前置参数错误：必须传 --book 书仓路径')
    return 1
  }
  if (!Number.isSafeInteger(卷) || 卷 < 1) {
    console.error('前置参数错误：--卷 须为正整数')
    return 1
  }
  if (!Number.isSafeInteger(章) || 章 < 1) {
    console.error('前置参数错误：--章 须为正整数')
    return 1
  }
  if (!章名) {
    console.error('前置参数错误：必须传 --章名')
    return 1
  }
  if (!fs.existsSync(book) || !fs.statSync(book).isDirectory()) {
    console.error(`书仓不存在：${path.resolve(book)}`)
    return 1
  }
  const candidateRel = resolveDraftRel(book, '候选细纲', { 卷, 章, 章名 })
  const candidateText = readBookFile(book, candidateRel)
  if (candidateText === null) {
    console.error(JSON.stringify({ ok: false, reason: `候选细纲不存在：${candidateRel}（先落候选再跑十查）` }))
    return 1
  }
  try {
    const candidate = readOutlineDoc(candidateRel, candidateText)
    const payoff = payoffRows(book, 卷, 章, bodyOf(candidateText))
    if (payoff.承诺账本 === '解析失败') {
      console.error(JSON.stringify({ ok: false, reason: '账本/承诺.md 解析失败——按《工作台总控》「脚本失败分流」表先修文件再跑同一脚本' }))
      return 1
    }
    const report = {
      ok: true,
      候选: candidateRel,
      '③伏笔到期': dueRows(book, 卷, 章),
      '④接钩': hookRows(book, 卷, 章),
      出场间隔: appearanceRows(book, 卷, 章, candidate),
      '⑥爽点铺垫': payoff,
      '⑧近五章重复': repeatRows(candidate, recentOutlines(book, 卷, 章)),
    }
    console.log(JSON.stringify(report, null, 2))
    return 0
  } catch (err) {
    console.error(`十查机械比对异常：${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}
