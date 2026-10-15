/**
 * 写前十查机械部分脚本的 CLI 逻辑（⑥爽点铺垫对账＋⑧近五章重复——机械比对交脚本）。
 *
 * 本模块经薄入口 `skills/novel-outline/scripts/十查机械.mjs` 动态引 lib 调用。
 * 只算不写：读候选细纲「冲突与爽点」「本章形状」与细纲段单元行、账本/承诺已埋条目、
 * 上一章章摘要、本卷近五份确认细纲，机械比对产出候选行；机械行是呈确认件的原料，
 * 真铺垫/真重复的语义判断仍归主 Agent（十查是检查不是门禁）。
 * argv 进、退出码出，模块顶层零副作用。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseDocument, paths, queryLedger, type LedgerQueryResult } from '@abzu/core'

/** 虚词大字不计入内容双字——避免任意两段中文都撞出「一个／到了」式假命中。 */
const FUNCTION_CHARS = new Set('的了是在和与就都也很个又一不没我你他她它这那及被把让向上下中出说到做去来还要'.split(''))

/** ⑧同款转折关键词：候选与确认细纲单元行同现即出候选行；枚举单源在本脚本，语义判断归主 Agent。 */
const TURN_KEYWORDS = ['反转', '误会', '揭穿', '摊牌', '背叛', '反目', '突袭', '遇袭', '伏击', '救场', '绝地', '翻盘', '反杀', '暴露', '灭门', '认亲'] as const

/** ⑥冲突层行与低压章「往下看的理由」行不是爽点位，不计入铺垫对账。 */
const NON_PAYOFF_LINE = /^(?:[-*]\s*)?(?:外部|人际|内心|往下看的理由)\s*[：:]/

interface Args {
  readonly book: string
  readonly 卷: number
  readonly 章: number
  readonly 章名: string
}

function argValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
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
  for (const vol of [卷, ...(卷 > 1 ? [卷 - 1] : [])]) {
    const last = chapterFiles(book, vol, '章摘要').filter(item => item.no < 章).at(-1)
    if (last === undefined) continue
    const text = readVolumeFile(book, vol, '章摘要', last.name)
    if (text !== null) return { file: last.name, text: bodyOf(text) }
  }
  return null
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
    return { 承诺账本: '未读', 已埋承诺条目: 0, 上一章摘要: null, 行: ['候选缺「### 冲突与爽点」节——⑥机械对账无爽点位可取，先落节再查'] }
  }
  const ledger = queryLedger(book, { 分类: '承诺', 状态: '已埋' })
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
  return { 承诺账本: 账本状态, 已埋承诺条目: planted.length, 上一章摘要: summary?.file ?? null, 行: lines }
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
  const candidateRel = paths.候选细纲(卷, 章名)
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
