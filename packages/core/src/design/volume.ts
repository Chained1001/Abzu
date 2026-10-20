/**
 * 当前卷规划三件(格式规格 §3.2 / D27 / D56 方案 A):卷纲 / 计划时间线 / 近期窗口。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseWindow } from '../derive/scan'
import { assertWindowEntryState, isWindowEntryReady } from '../derive/states'
import { writeFileAtomic, type FileOp } from '../repo/atomic'
import { assertSegment, paths } from '../repo/paths'
import { bookWriter } from '../repo/atomic'
import { prepareDesignDoc, type DesignWriteResult } from './skeleton'

export interface WindowItem {
  readonly 名称: string
  readonly 状态: string
}

export interface TimelineEvent {
  readonly 名称: string
  readonly 先后?: string
  readonly 并行?: string
  readonly 间隔?: string
}

export interface TimelineAnchor {
  readonly 名称: string
}

export const 卷纲脚手架段 = ['叙事结构', '弧线', '线索推进', '卷末兑现'] as const

/**
 * 卷纲第五段(0.0.87)。**不在 卷纲脚手架段 里，因为它是软校验**：
 * 建书脚手架只建四段(book/scaffold.ts)，「压力升级检查」是本卷规划时新加的第五段，
 * 存量书没有它。若并入 卷纲脚手架段 走硬校验，旧卷纲一律确认不了——
 * 与章型同款处理：缺段只播报，写错/写了但五项不全才拦。
 * 规格单源：novel-arcplan/templates/卷纲固定段规格.md「压力升级检查」。
 */
export const 卷纲第五段 = '压力升级检查' as const

/** 幕纲六个必备段(规格单源:novel-arcplan/templates/幕纲固定段规格.md)。 */
export const 幕纲必备段 = ['本幕故事', '线与伏笔', '出场人物', '查证清单', '章组排布', '幕末结算'] as const

/** 正文里的 `## 标题` 集合(去 〔已确认/留白/暂定〕 尾注);卷纲与幕纲的段名校验共用。 */
function sectionTitles(body: string): ReadonlySet<string> {
  const titles = new Set<string>()
  for (const line of body.split(/\r?\n/)) {
    const match = /^##\s+(.+?)\s*$/.exec(line.trim())
    if (match === null) continue
    titles.add((match[1] ?? '').replace(/\s*[〔(](?:已确认|留白|暂定)[〕)]\s*$/, '').trim())
  }
  return titles
}

export function volumeOutlineGaps(body: string): string[] {
  const titles = sectionTitles(body)
  return 卷纲脚手架段.filter((name) => !titles.has(name)).map((name) => `卷纲段落不完整:${name}`)
}

/**
 * 卷纲第五段的软校验：返回播报（缺口提示），不返回 gap。
 *
 * 只播报不拦的理由同章型：存量卷纲没有这一段，硬拦会让旧书无法确认。
 * 但「写了就必须像样」——标题在位却一个核对项都没有，等于走了形式，这时要报。
 */
export function volumeUpgradeCheckNotice(body: string): string | null {
  const titles = sectionTitles(body)
  if (!titles.has(卷纲第五段)) {
    return `卷纲未写第五段「${卷纲第五段}」：本卷规划要求逐条过五核对项（规格见 novel-arcplan/templates/卷纲固定段规格.md）；存量卷纲可后补，不拦确认`
  }
  // 标题在 → 看有没有实际内容（五核对项至少写出可辨认的条目行）
  const lines = body.split(/\r?\n/)
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${卷纲第五段}`).test(l.trim()))
  if (start < 0) return null
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i]!.trim())) { end = i; break }
  }
  const bodyText = lines.slice(start + 1, end).join('\n').trim()
  const 条目数 = lines
    .slice(start + 1, end)
    .filter((l) => /^\s*(?:\d+[.、)]|[-*+])\s+\S/.test(l)).length
  if (bodyText === '' || bodyText.includes('〔留白〕')) return null
  if (条目数 === 0) {
    return `卷纲第五段「${卷纲第五段}」有标题但没有分条核对项：五核对项须逐条写（可标〔留白〕并说明原因）`
  }
  return null
}

/** 幕纲段名缺口:六个必备段缺一即报(幕末结算开幕时留白合法,但标题须在位)。 */
export function actOutlineGaps(body: string): string[] {
  const titles = sectionTitles(body)
  return 幕纲必备段.filter((name) => !titles.has(name)).map((name) => `幕纲段落不完整:${name}`)
}

function writeVolumeOutlineLocked(bookRoot: string, 卷: number, body: string): DesignWriteResult {
  const op = prepareVolumeOutline(bookRoot, 卷, body)
  writeFileAtomic(bookRoot, op.relPath, op.content)
  return op.result
}

/**
 * 卷纲落盘准备(批8,0.0.57 起走 prepareDesignDoc):frontmatter 带 状态/版本/父版本/生成模块
 * ——首次 v1、正文变化 +1、原样重跑复用版本(旧书无 frontmatter 的卷纲按 v1 起步,无需迁移)。
 */
export function prepareVolumeOutline(bookRoot: string, 卷: number, body: string): FileOp & { result: DesignWriteResult } {
  return prepareDesignDoc(bookRoot, paths.卷纲(卷), body, '卷纲确认')
}

/**
 * 幕纲落盘准备(0.0.52 幕纲批;批8 起走 prepareDesignDoc 带版本字段)。
 * 幕名过路径白名单(同章名/模块名的 assertSegment 习惯),幕号须正整数。
 */
export function prepareActOutline(bookRoot: string, 卷: number, 幕: number, 幕名: string, body: string): FileOp & { result: DesignWriteResult } {
  assertSegment(幕名, '幕名')
  if (!Number.isSafeInteger(幕) || 幕 < 1) {
    throw new Error(`幕号必须是正整数(收到:${String(幕)})`)
  }
  return prepareDesignDoc(bookRoot, paths.幕纲(卷, 幕, 幕名), body, '幕纲确认')
}

export const writeVolumeOutline = bookWriter(writeVolumeOutlineLocked)

/**
 * 卷摘要落盘准备(任务21, 件一;格式规格 §3.4):
 * 真源工件经写入器写;版本协议沿用 prepareDesignDoc(首次 v1、正文变化 +1/父版本指旧版、
 * 原样重跑复用版本——重跑幂等)。生成模块「卷摘要确认」。
 */
export function prepareVolumeSummary(bookRoot: string, 卷: number, body: string): FileOp & { result: DesignWriteResult } {
  return prepareDesignDoc(bookRoot, paths.卷摘要(卷), body, '卷摘要确认')
}

function writePlanTimelineLocked(bookRoot: string, 卷: number, body: string): DesignWriteResult {
  const op = preparePlanTimeline(bookRoot, 卷, body)
  writeFileAtomic(bookRoot, op.relPath, op.content)
  return op.result
}

/** 计划时间线落盘准备(批8 起走 prepareDesignDoc 带 frontmatter 版本字段;旧文件按 v1 起步)。 */
export function preparePlanTimeline(bookRoot: string, 卷: number, body: string): FileOp & { result: DesignWriteResult } {
  return prepareDesignDoc(bookRoot, paths.计划时间线(卷), body, '计划时间线确认')
}

export const writePlanTimeline = bookWriter(writePlanTimelineLocked)

export function prepareRecentWindow(卷: number, items: readonly WindowItem[], 保留行: readonly string[] = []): FileOp {
  for (const i of items) assertWindowEntryState(i.状态)
  const lines = [
    '# 近期窗口',
    '',
    ...items.map((i) => `- ${i.名称} 〔${i.状态}〕`),
    ...(保留行.length === 0 ? [] : ['', ...保留行]),
    '',
  ]
  return { relPath: paths.近期窗口(卷), content: lines.join('\n') }
}

function writeRecentWindowLocked(bookRoot: string, 卷: number, items: readonly WindowItem[]): void {
  const op = prepareRecentWindow(卷, items)
  writeFileAtomic(bookRoot, op.relPath, op.content)
}

export const writeRecentWindow = bookWriter(writeRecentWindowLocked)

/** 锁定渐进轻写形状:窗口覆盖可细写,窗外只留锚点。 */
export function planTimelineBody(input: {
  readonly windowEvents: readonly TimelineEvent[]
  readonly anchors: readonly TimelineAnchor[]
}): string {
  const win = input.windowEvents.map((e) => {
    const bits = [
      e.先后 ? `先后:${e.先后}` : null,
      e.并行 ? `并行:${e.并行}` : null,
      e.间隔 ? `间隔:${e.间隔}` : null,
    ].filter((x): x is string => x !== null)
    return bits.length === 0 ? `- ${e.名称}` : `- ${e.名称}（${bits.join('；')}）`
  })
  const anchors = input.anchors.map((a) => `- ${a.名称}`)
  return [
    '# 计划时间线',
    '',
    '## 窗口覆盖',
    '',
    ...(win.length === 0 ? ['- 〔留白〕'] : win),
    '',
    '## 窗口外锚点',
    '',
    ...(anchors.length === 0 ? ['- 〔留白〕'] : anchors),
    '',
  ].join('\n')
}

export function checkVolumeReady(bookRoot: string, 卷 = 1):
  | { readonly ok: true }
  | { readonly ok: false; readonly gaps: readonly string[] } {
  const gaps: string[] = []
  if (!exists(bookRoot, paths.卷纲(卷))) gaps.push('卷纲不存在')
  if (!exists(bookRoot, paths.计划时间线(卷))) gaps.push('计划时间线不存在')
  const 窗口Abs = path.join(bookRoot, paths.近期窗口(卷))
  let 窗口文: string | null = null
  try { 窗口文 = fs.readFileSync(窗口Abs, 'utf-8') } catch { 窗口文 = null }
  if (窗口文 === null) gaps.push('近期窗口不存在')
  else if (!parseWindow(窗口文).some((e) => isWindowEntryReady(e.state))) {
    gaps.push('近期窗口无可进入条目')
  }
  return gaps.length === 0 ? { ok: true } : { ok: false, gaps }
}

function exists(root: string, rel: string): boolean {
  try { return fs.existsSync(path.join(root, rel)) } catch { return false }
}


