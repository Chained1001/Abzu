/**
 * 当前卷规划三件(格式规格 §3.2 / D27 / D56 方案 A):卷纲 / 计划时间线 / 近期窗口。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseWindow } from '../derive/scan'
import { assertWindowEntryState, isWindowEntryReady } from '../derive/states'
import { writeFileAtomic, type FileOp } from '../repo/atomic'
import { assertSegment, pad, paths } from '../repo/paths'
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

/** 幕纲六个必备段(规格单源:novel-design/templates/幕纲固定段规格.md)。 */
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

/** 幕纲段名缺口:六个必备段缺一即报(幕末结算开幕时留白合法,但标题须在位)。 */
export function actOutlineGaps(body: string): string[] {
  const titles = sectionTitles(body)
  return 幕纲必备段.filter((name) => !titles.has(name)).map((name) => `幕纲段落不完整:${name}`)
}

function writeVolumeOutlineLocked(bookRoot: string, 卷: number, body: string): void {
  const op = prepareVolumeOutline(卷, body)
  writeFileAtomic(bookRoot, op.relPath, op.content)
}

export function prepareVolumeOutline(卷: number, body: string): FileOp {
  return { relPath: paths.卷纲(卷), content: body.endsWith('\n') ? body : `${body}\n` }
}

/**
 * 幕纲落盘准备(0.0.52 幕纲批):幕是卷与章之间的完整剧情单元,幕纲是可选真源工件。
 * 幕名过路径白名单(同章名/模块名的 assertSegment 习惯),幕号须正整数;纯文本写入、补末尾换行。
 */
export function prepareActOutline(卷: number, 幕: number, 幕名: string, body: string): FileOp {
  assertSegment(幕名, '幕名')
  if (!Number.isSafeInteger(幕) || 幕 < 1) {
    throw new Error(`幕号必须是正整数(收到:${String(幕)})`)
  }
  return { relPath: paths.幕纲(卷, 幕, 幕名), content: body.endsWith('\n') ? body : `${body}\n` }
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

function writePlanTimelineLocked(bookRoot: string, 卷: number, body: string): void {
  const op = preparePlanTimeline(卷, body)
  writeFileAtomic(bookRoot, op.relPath, op.content)
}

export function preparePlanTimeline(卷: number, body: string): FileOp {
  return { relPath: paths.计划时间线(卷), content: body.endsWith('\n') ? body : `${body}\n` }
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

export function volumeDir(卷: number): string {
  return `大纲/卷规划/卷${pad(卷)}`
}
