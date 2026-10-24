/**
 * 作品定调(PRD §3.4 / 格式规格 §3.1):契约六部模板与完成谓词。
 * 作者整份审定 M0 = 六部皆已确认;不另设签名文件。
 * N1 修复:更新分部时保留书id frontmatter 与其余分部正文内容。
 * C-01:更新分部改为按节替换——只重写显式给出的分部,未给出的分部、六部外 `##` 小节与首部的
 *   **内容与顺序**保留(不是逐字节:行尾统一为 LF——`parseDocument`/`serializeDocument` 会归一 `\r\n`)。
 *   (规格依据 docs/标准/书仓格式.md:26「保留其中已有内容」、docs/产品/是什么.md 术语表「作品契约」行「绝不整体重写」)。
 *   分部边界只认可见行(围栏代码块 / 注释里的 `## ` 不算分部);「章节篇幅」子节在 core 侧保留
 *   (该部新正文里没有任何可见 `###` 时接回旧子节),调用侧不回填,护栏只兜底绕过工具的写入路径。
 *   已知边界:本分部若含其它可见 `###` 子节却又未写「章节篇幅」,会按情形①拦下
 *   (fail-closed,模型可自恢复);若这类噪音增多,把判据从「任何可见三级标题」收窄为
 *   「标题名含『章节篇幅』的可见三级标题」即可。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { 契约六部, parseLabeledStates } from '../derive/design'
import { writeFileAtomic, type FileOp } from '../repo/atomic'
import { parseDocument, serializeDocument } from '../repo/frontmatter'
import { paths } from '../repo/paths'
import { bookWriter } from '../repo/atomic'
import { hasThirdLevelHeading, parseChapterLength, visibleLines } from './chapter-length'

export type ContractPartState = '已确认' | '暂定' | '留白'

export interface ContractPart {
  readonly state: ContractPartState
  readonly body?: string
}

export type ContractParts = Partial<Record<(typeof 契约六部)[number], ContractPart>>

export function contractTemplate(parts: ContractParts = {}, fields: Record<string, unknown> = {}): string {
  const lines: string[] = ['# 作品契约', '']
  for (const name of 契约六部) {
    const part = parts[name]
    const state = part?.state ?? '留白'
    lines.push(`## ${name} 〔${state}〕`, '')
    // 正文与状态标签是两件事：显式置〔留白〕不等于清空正文（C-01 同批，避免同一缺陷的第二副面孔）。
    if (part?.body !== undefined && part.body.trim() !== '') {
      lines.push(part.body.trim(), '')
    }
  }
  return serializeDocument(fields, lines.join('\n').trimEnd() + '\n')
}

/** 读取当前现有契约的分部与 frontmatter 字典（`body` 为解析后的正文，无文件时为空串）。 */
export function readExistingContract(bookRoot: string): {
  readonly fields: Record<string, unknown>
  readonly parts: ContractParts
  readonly body: string
} {
  const abs = path.join(bookRoot, paths.契约())
  let text: string
  try {
    text = fs.readFileSync(abs, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { fields: {}, parts: {}, body: '' }
    throw error
  }
  const doc = parseDocument(text)
  if (!doc.ok) throw new Error(`契约解析失败：${doc.detail}`)
  const labeled = new Map(parseLabeledStates(doc.data.body).map(item => [item.name, item.state]))
  const bodies = extractContractSectionBodies(doc.data.body)
  const parts: ContractParts = {}
  // C-01：按「文中存在的分部」收口，而不是只遍历有〔状态〕标签的那些——
  // 掉了标签的六部原先会连正文一起丢掉（后面整篇重建时被当留白重写）。
  for (const name of 契约六部) {
    const state = labeled.get(name)
    const body = bodies[name]
    if (state === undefined && body === undefined) continue
    parts[name] = {
      state: state === '已确认' || state === '暂定' ? state : '留白',
      body: body ?? '',
    }
  }
  return { fields: doc.data.fields, parts, body: doc.data.body }
}

/** 提取契约中每个 ## 分部的正文 */
function extractContractSectionBodies(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = body.split('\n')
  // C-01：围栏代码块 / 注释里的 `## ` 不算分部（与 parseChapterLength 共用 visibleLines 口径）。
  const visible = visibleLines(body)
  let currentHeader: string | null = null
  let currentLines: string[] = []

  for (const [index, line] of lines.entries()) {
    const m = SECTION_HEADING.exec(visible[index] ?? '')
    if (m) {
      if (currentHeader !== null) {
        out[currentHeader] = currentLines.join('\n').trim()
      }
      currentHeader = m[1]!.trim()
      currentLines = []
    } else if (currentHeader !== null) {
      currentLines.push(line)
    }
  }
  if (currentHeader !== null) {
    out[currentHeader] = currentLines.join('\n').trim()
  }
  return out
}

/** 契约二级分部标题行（与 extractContractSectionBodies 同一套口径）。 */
const SECTION_HEADING = /^##\s+(.+?)(?:\s*[〔(](.+?)[〕)])?\s*$/

/** 二级标题行（`###` 不算——它属于分部内部子节）。 */
function isSectionHeading(line: string): boolean {
  return /^##\s+\S/.test(line)
}

/** 标题行 → 分部名（去掉末尾〔状态〕）。 */
function headingNameOf(line: string): string | null {
  const m = SECTION_HEADING.exec(line)
  return m === null ? null : m[1]!.trim()
}

/** 单部渲染为契约内的行块，与 contractTemplate 的分部口径一致（〔留白〕仍带正文——标签与正文是两件事）。 */
function renderSection(name: string, part: ContractPart): string[] {
  const lines = [`## ${name} 〔${part.state}〕`, '']
  if (part.body !== undefined && part.body.trim() !== '') {
    lines.push(part.body.trim(), '')
  }
  return lines
}

/**
 * C-01 按节替换：只动目标 `## ` 分部（到下一个二级标题之前），其余**内容与顺序**保留
 * （行尾统一为 LF；不承诺逐字节——归一发生在解析/序列化入口）；
 * 文件里没有该分部时追加到文末。整篇重建会顺手删掉六部外的小节、清空掉标签分部的正文。
 */
function replaceSection(body: string, name: string, replacement: readonly string[]): string {
  const lines = body.split('\n')
  // C-01：定位与边界都只看可见行——围栏代码块或注释里的 `## ` 不是分部，按原始行切会吃掉中间正文。
  const visible = visibleLines(body)
  const start = visible.findIndex((line) => headingNameOf(line) === name)
  if (start === -1) {
    const trimmed = body.replace(/\s+$/, '')
    return trimmed === '' ? replacement.join('\n') : `${trimmed}\n\n${replacement.join('\n')}`
  }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) {
    if (isSectionHeading(visible[i]!)) { end = i; break }
  }
  return [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join('\n')
}

/** 「章节篇幅」子节的宿主分部（篇幅是它的三级子节，护栏只认这一个宿主）。 */
const LENGTH_HOST = '阅读体验与情绪承诺'

/** 「章节篇幅」三级标题行（可见行口径：围栏 / 注释里的同名行不算）。 */
const LENGTH_HEADING = /^\s*###\s+章节篇幅\s*(?:[〔(].*[〕)])?\s*$/

/** 取出分部正文里可见的「章节篇幅」子节整块（标题行到下一个同级或更高级标题之前）；行尾按解析后正文的形态带回（CRLF 已在解析入口归一为 LF）。 */
function extractChapterLengthSubsection(sectionBody: string): string | null {
  const lines = sectionBody.split('\n')
  const visible = visibleLines(sectionBody)
  const start = visible.findIndex(line => LENGTH_HEADING.test(line))
  if (start === -1) return null
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,3}\s+\S/.test(visible[i]!)) { end = i; break }
  }
  return lines.slice(start, end).join('\n').trim()
}

/**
 * 篇幅护栏：既有契约里不是「未配置」的篇幅，不得被一次更新静默抹成「未配置」。
 * 文案按输入分两句，都不挂「配置错误」前缀——那个词是 ChapterLengthPolicy.状态 的既有枚举值，
 * 会被审读渲染成「篇幅配置错误：…」并让模型改人工判；这里语义是「本次更新被拒、磁盘没动」，正好相反。
 */
function assertChapterLengthSurvives(previousBody: string, content: string, incoming: string): void {
  const next = parseChapterLength(content)
  if (next.状态 === '配置错误') throw new Error(next.原因)
  const before = parseChapterLength(previousBody)
  if (before.状态 !== '未配置' && next.状态 === '未配置') {
    throw new Error(hasThirdLevelHeading(incoming)
      ? '本次更新未包含合法的「章节篇幅」子节，已拦下以免丢失原有篇幅；请按三项正整数列表重写该子节。'
      : '本次更新会移除「章节篇幅」，已拒绝。已配置篇幅的契约不能经本工具移除该子节；请保留，或直接编辑契约文件后再走核对。')
  }
}

/** 安全更新契约分部（按节替换 + 保留其余分部与 frontmatter，防止 N1 抹除书id 与正文） */
export function prepareContract(bookRoot: string, parts: ContractParts = {}, extraFields: Record<string, unknown> = {}): FileOp {
  const existing = readExistingContract(bookRoot)
  const mergedFields = { ...existing.fields, ...extraFields }
  // 护栏文案要区分「正文自带不规范 ###」与「根本没写正文」，所以把本次该部的入参正文也传下去。
  const incomingLength = parts[LENGTH_HOST]?.body ?? ''
  // 没有既有正文（建书/首写）：仍按六部模板生成整份。
  if (existing.body.trim() === '') {
    const mergedParts: ContractParts = { ...existing.parts }
    for (const name of 契约六部) {
      if (parts[name] !== undefined) mergedParts[name] = parts[name]
    }
    const content = contractTemplate(mergedParts, mergedFields)
    assertChapterLengthSurvives(existing.body, content, incomingLength)
    return { relPath: paths.契约(), content }
  }
  // 有既有正文：按节替换，六部之外的小节与未更新分部的正文内容与顺序保留（行尾统一 LF）。
  const previousBodies = extractContractSectionBodies(existing.body)
  let body = existing.body
  for (const name of 契约六部) {
    const part = parts[name]
    if (part === undefined) continue
    // 定稿：篇幅子节在 core 侧保留，调用侧不回填（两处各自拼接＝双保险变双风险，还会覆盖模型的显式改动）。
    // 主分部带新正文、且正文里没有任何可见 `###` 子节＝漏写，把旧子节整块接回；自带三级小节（哪怕标题
    // 不规范）不接回，避免写出两个子节，随后由护栏判「合法子节是否丢失」；不带正文（含置留白）同样交护栏。
    const preserveLength = name === LENGTH_HOST && part.body !== undefined && part.body.trim() !== '' && !hasThirdLevelHeading(part.body)
    const lengthBlock = preserveLength ? extractChapterLengthSubsection(previousBodies[name] ?? '') : null
    const nextBody = lengthBlock === null ? part.body : `${part.body!.trimEnd()}\n\n${lengthBlock}`
    body = replaceSection(body, name, renderSection(name, { state: part.state, body: nextBody }))
  }
  const content = serializeDocument(mergedFields, body)
  assertChapterLengthSurvives(existing.body, content, incomingLength)
  return { relPath: paths.契约(), content }
}

function writeContractLocked(bookRoot: string, parts: ContractParts = {}, extraFields: Record<string, unknown> = {}): void {
  const op = prepareContract(bookRoot, parts, extraFields)
  writeFileAtomic(bookRoot, op.relPath, op.content)
}

export const writeContract = bookWriter(writeContractLocked)

export function checkContractComplete(bookRoot: string):
  | { readonly ok: true }
  | { readonly ok: false; readonly gaps: readonly string[] } {
  const abs = path.join(bookRoot, paths.契约())
  let text: string
  try {
    text = fs.readFileSync(abs, 'utf-8')
  } catch {
    return { ok: false, gaps: ['契约不存在'] }
  }
  const r = parseDocument(text)
  if (!r.ok) return { ok: false, gaps: [`契约解析失败:${r.detail}`] }
  const labeled = parseLabeledStates(r.data.body)
  const gaps = 契约六部.filter((name) => !labeled.some((e) => e.name === name && e.state === '已确认'))
  return gaps.length === 0 ? { ok: true } : { ok: false, gaps }
}
