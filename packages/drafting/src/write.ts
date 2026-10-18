/**
 * 单稿写作(插件规格 §5 草稿协议):干净上下文 / 硬约束提醒 / 版本 / 候选事实 / 完整性。
 */

import * as path from 'node:path'
import {
  applyVersionFields,
  assertSegment,
  bumpVersion,
  composeBody,
  initialVersion,
  isMarkdownFileName,
  listChapterDrafts,
  nextDraftFileName,
  parseDocument,
  prepareDraftDemotions,
  resolveDraftRel,
  scanChapter,
  serializeDocument,
  splitCandidateFacts,
  writeBatchAtomic,
  草稿字段序,
  type ChapterKey,
  type FileOp,
} from '@abzu/core'
import { bookWriter } from '@abzu/core'

// 候选事实段拆拼自 core 迁入(repo/drafts.ts),重导出保持旧 import 可用
export { CANDIDATE_HEADING, composeBody, splitCandidateFacts } from '@abzu/core'

export interface WriteDraftInput {
  readonly 卷: number
  readonly 章: number
  readonly 章名: string
  readonly body: string
  readonly 候选事实?: readonly string[]
}

export interface WriteDraftResult {
  readonly ok: boolean
  readonly relPath: string
  readonly gaps: readonly string[]
  /** R1 播报:细纲确认状态与材料包状态,不参与门禁。 */
  readonly 播报?: string
}

export interface DraftInfo {
  readonly file: string
  readonly relPath: string
  readonly 角色: string | null
  readonly 选定: boolean
  readonly 版本: number | null
}

// 修复(0.0.20 批 bug4):本地 7 键副本缺「保真风险」且与 core 双源漂移——删除,改用 import 的 草稿字段序(8 键单源)。

/** 草稿目录双格式解析(批8):新键优先、旧键 fallback——旧书目录无感。 */
function draftDir(bookRoot: string, key: Pick<ChapterKey, '卷' | '章名'> & { readonly 章?: number }): string {
  return resolveDraftRel(bookRoot, '草稿目录', key)
}

function latestVersion(bookRoot: string, key: Pick<ChapterKey, '卷' | '章名'>): number | null {
  let max: number | null = null
  for (const draft of listChapterDrafts(bookRoot, key)) {
    if (draft.版本 !== null && (max === null || draft.版本 > max)) max = draft.版本
  }
  return max
}

function nextFileName(bookRoot: string, key: Pick<ChapterKey, '卷' | '章名'>): string {
  return nextDraftFileName(bookRoot, key)
}

/** R1 播报(R1 落码 2026-09-05,原 gateCanWrite 门槛摘除):如实报告细纲与材料包状态,不拒绝写。 */
function readinessBroadcast(bookRoot: string, key: ChapterKey): string {
  const f = scanChapter(bookRoot, key)
  const parts = [f.确认细纲 ? '细纲已确认' : '细纲未确认(播报,不阻断)']
  parts.push(f.材料包状态 === null ? '材料包未组装' : `材料包${f.材料包状态}`)
  return parts.join(';')
}

export function listDrafts(bookRoot: string, key: Pick<ChapterKey, '卷' | '章名'>): readonly DraftInfo[] {
  return listChapterDrafts(bookRoot, key).map(({ file, relPath, 角色, 选定, 版本 }) => ({
    file,
    relPath,
    角色,
    选定,
    版本,
  }))
}

function selectDraftLocked(
  bookRoot: string,
  input: Pick<ChapterKey, '卷' | '章名'> & { readonly file: string },
): { readonly ok: boolean; readonly reason?: string } {
  assertSegment(input.章名, '章名')
  const target = isMarkdownFileName(input.file) ? input.file : `${input.file}.md`
  const drafts = listChapterDrafts(bookRoot, input)
  if (!drafts.some((draft) => draft.file === target)) return { ok: false, reason: `草稿不存在:${target}` }
  // 先全量解析再写：目标稿解析失败时不能“跳过它仍报成功”，也不能写一半。
  const ops: FileOp[] = []
  for (const draft of drafts) {
    const doc = parseDocument(draft.text)
    if (!doc.ok) return { ok: false, reason: `草稿解析失败:${draft.file}` }
    const fields = { ...doc.data.fields, 选定: draft.file === target }
    ops.push({ relPath: draft.relPath, content: serializeDocument(fields, doc.data.body, 草稿字段序) })
  }
  writeBatchAtomic(bookRoot, ops)
  return { ok: true }
}

export const selectDraft = bookWriter(selectDraftLocked)

/** 写一版草稿。调用方提供正文(非 LLM)。 */
function writeDraftLocked(bookRoot: string, input: WriteDraftInput): WriteDraftResult {
  assertSegment(input.章名, '章名')
  const key = { 卷: input.卷, 章: input.章, 章名: input.章名 }
  const 播报 = readinessBroadcast(bookRoot, key)

  const split = splitCandidateFacts(input.body)
  const facts = [...split.facts, ...(input.候选事实 ?? [])].map((s) => s.trim()).filter((s) => s !== '')
  const prose = split.prose.trim()
  const gaps: string[] = []
  if (prose === '') gaps.push('正文为空')
  if (gaps.length > 0) return { ok: false, relPath: '', gaps }

  const parent = latestVersion(bookRoot, key)
  const ver = parent === null ? initialVersion('写稿') : bumpVersion(parent, '写稿')
  const file = nextFileName(bookRoot, key)
  const relPath = path.posix.join(draftDir(bookRoot, key), file)
  // 0.0.54 起草收稿即待审稿:起草子代理产出与作者稿一样直接交审,不再等润色标待审稿。
  // 重写稿先降级旧待审稿再写新稿(与改稿同一纪律),保证任一时刻待审稿唯一;
  // 0.0.60:降级集与新稿同一 writeBatchAtomic 事务(照 applyRevision 的批形态)——
  // 崩溃时要么旧态要么新态,不出现「旧待审稿已降级而新稿未落」的半写态。
  const fields = applyVersionFields(
    {
      身份: { 卷: input.卷, 章: input.章, 章名: input.章名 },
      角色: '待审稿',
      选定: true,
    },
    ver,
  )
  const ops: FileOp[] = [
    ...prepareDraftDemotions(bookRoot, key, relPath),
    { relPath, content: serializeDocument(fields, composeBody(prose, facts), 草稿字段序) },
  ]
  writeBatchAtomic(bookRoot, ops)

  return { ok: true, relPath, gaps: [], 播报 }
}

export const writeDraft = bookWriter(writeDraftLocked)

export interface ImportAuthorDraftInput {
  readonly 卷: number
  readonly 章: number
  readonly 章名: string
  readonly 正文: string
  readonly 候选事实?: readonly string[]
  /** 写稿节点用 草稿;润色/改稿节点贴作者改过的版本用 待审稿。 */
  readonly 角色: '草稿' | '待审稿'
  /** 整章自写＝作者手写;在某稿基础上改＝作者手改。 */
  readonly 生成模块: '作者手写' | '作者手改'
  /** 作者手改时指向被改的稿;缺省取该章最新版本。 */
  readonly 父版本?: number
}

export type ImportAuthorDraftResult =
  | { readonly ok: true; readonly relPath: string; readonly 播报?: string }
  | { readonly ok: false; readonly reason: string }

/**
 * 作者稿导入(写稿 seam 的「作者手写/作者手改」实现,PRD §3.5.3):作者稿与 AI 稿地位相同,
 * 只在 生成模块 留痕。角色 待审稿 时先降级既有待审稿再写(与润色同一纪律)。
 * R1:细纲/材料包状态只播报不拒绝。
 */
function importAuthorDraftLocked(bookRoot: string, input: ImportAuthorDraftInput): ImportAuthorDraftResult {
  try {
    assertSegment(input.章名, '章名')
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
  const key = { 卷: input.卷, 章: input.章, 章名: input.章名 }
  const 播报 = readinessBroadcast(bookRoot, key)

  const split = splitCandidateFacts(input.正文)
  const facts = [...split.facts, ...(input.候选事实 ?? [])].map((s) => s.trim()).filter((s) => s !== '')
  const prose = split.prose.trim()
  if (prose === '') return { ok: false, reason: '正文为空' }

  const explicitParent = input.父版本 ?? latestVersion(bookRoot, key)
  const ver = explicitParent === null ? initialVersion('作者稿导入') : bumpVersion(explicitParent, '作者稿导入')
  const file = nextFileName(bookRoot, key)
  const relPath = path.posix.join(draftDir(bookRoot, key), file)
  const fields = applyVersionFields(
    {
      身份: { 卷: input.卷, 章: input.章, 章名: input.章名 },
      角色: input.角色,
      选定: input.角色 === '待审稿',
    },
    { ...ver, 生成模块: input.生成模块 },
  )
  // 0.0.60:待审稿角色的降级集与新稿同一 writeBatchAtomic 事务(照 applyRevision 的批形态,
  // 与 writeDraft 同款)——不再「先降级、后写新稿」两批,半写态不可再现。
  const ops: FileOp[] = [
    ...(input.角色 === '待审稿' ? prepareDraftDemotions(bookRoot, key, relPath) : []),
    { relPath, content: serializeDocument(fields, composeBody(prose, facts), 草稿字段序) },
  ]
  writeBatchAtomic(bookRoot, ops)
  return { ok: true, relPath, 播报 }
}

export const importAuthorDraft = bookWriter(importAuthorDraftLocked)
