/**
 * 润色入口:读选定/最新草稿,写新版本;无保真风险才标 待审稿。
 */

import * as path from 'node:path'
import {
  applyVersionFields,
  assertSegment,
  bumpVersion,
  composeBody,
  extractVersionFields,
  filenameCase,
  initialVersion,
  listChapterDrafts,
  nextDraftFileName,
  parseDocument,
  paths,
  prepareDraftDemotions,
  readBookText,
  resolveDraftRel,
  serializeDocument,
  splitCandidateFacts,
  writeBatchAtomic,
  草稿字段序,
  type ChapterKey,
  type FileOp,
} from '@abzu/core'
import { checkFidelity, type FidelityRisk } from './fidelity'
import { applyPolishRules, type PolishChange } from './rules'
import { bookWriter } from '@abzu/core'

export interface PolishInput {
  readonly 卷: number
  readonly 章: number
  readonly 章名: string
}

export interface PolishResult {
  readonly ok: boolean
  readonly relPath: string
  readonly 角色: string
  readonly risks: readonly FidelityRisk[]
  readonly changes: readonly PolishChange[]
  readonly reason?: string
}

// 修复(0.0.20 批 bug4):8 键本地副本已是死代码(写侧实际用下方 import 的 草稿字段序)——删除,单源在 core repo/drafts.ts。

interface DraftView {
  readonly file: string
  readonly rel: string
  readonly text: string
  readonly fields: Record<string, unknown>
  readonly body: string
  readonly no: number
}

function loadDrafts(bookRoot: string, key: Pick<ChapterKey, '卷' | '章名'>): DraftView[] {
  const views: DraftView[] = []
  for (const draft of listChapterDrafts(bookRoot, key)) {
    const doc = parseDocument(draft.text)
    if (!doc.ok) continue
    views.push({ file: draft.file, rel: draft.relPath, text: draft.text, fields: doc.data.fields, body: doc.data.body, no: parseDraftNo(draft.file) })
  }
  return views
}

/**
 * 润色源:已有待审稿就在它之上继续润色(否则上一版成果会被丢弃),
 * 其次是选定草稿,最后退回最新一稿。
 */
function parseDraftNo(file: string): number {
  const m = /^稿(\d+)\.md$/.exec(filenameCase(file))
  return m ? Number(m[1]) : 0
}

function pickSource(drafts: readonly DraftView[]): DraftView | null {
  if (drafts.length === 0) return null
  const pending = drafts.filter((d) => d.fields['角色'] === '待审稿')
  if (pending.length > 0) return pending.reduce((a, b) => (b.no >= a.no ? b : a))
  const selected = drafts.filter((d) => d.fields['选定'] === true)
  if (selected.length > 0) return selected[selected.length - 1]!
  return drafts.reduce((a, b) => (b.no >= a.no ? b : a))
}

function polishDraftLocked(bookRoot: string, key: PolishInput): PolishResult {
  assertSegment(key.章名, '章名')
  const drafts = loadDrafts(bookRoot, key)
  const src = pickSource(drafts)
  if (src === null) {
    return listChapterDrafts(bookRoot, key).length === 0
      ? { ok: false, relPath: '', 角色: '', risks: [], changes: [], reason: '无草稿' }
      : { ok: false, relPath: '', 角色: '', risks: [], changes: [], reason: '草稿解析失败' }
  }

  // 候选事实段保真:润色执行只见正文,候选段由代码原样带到新稿,不经模型转写
  const split = splitCandidateFacts(src.body)
  const applied = applyPolishRules(split.prose)
  // Y5(批F):细纲读取分流——missing 仍按无细纲润色(判据不变);io 失败(EACCES 等)
  // 明确失败,不再静默按 '' 润色(空细纲会让保真核对误判通过)。
  const outlineResult = readBookText(bookRoot, paths.确认细纲(key.卷, key.章, key.章名))
  if (!outlineResult.ok && outlineResult.reason === 'io') {
    return { ok: false, relPath: '', 角色: '', risks: [], changes: [], reason: `确认细纲不可读:${outlineResult.detail}` }
  }
  const outline = outlineResult.ok ? outlineResult.text : ''
  const risks = checkFidelity({ draft: split.prose, polished: applied.text, outlineText: outline })
  const 角色 = risks.length === 0 ? '待审稿' : '草稿'

  const parent = extractVersionFields(src.fields).版本
  const ver = parent === null ? initialVersion('润色') : bumpVersion(parent, '润色')
  const relPath = path.posix.join(resolveDraftRel(bookRoot, '草稿目录', key), nextDraftFileName(bookRoot, key))
  const fields = applyVersionFields(
    {
      ...src.fields,
      身份: { 卷: key.卷, 章: key.章, 章名: key.章名 },
      角色,
      选定: 角色 === '待审稿',
      ...(risks.length > 0 ? { 保真风险: risks.map((r) => `${r.kind}:${r.detail}`) } : {}),
    },
    ver,
  )
  // Y5(批F):降级集与新稿同一 writeBatchAtomic 事务(照 writeDraft/importAuthorDraft 批形态)——
  // 崩溃时要么旧态要么新态,不出现「旧待审稿已降级而新稿未落」的半写态;旧待审稿产生 0 份
  // (可再润色)而非 2 份(死锁)的纪律不变,只是降级与写新稿不再可能被截开。
  const ops: FileOp[] = [
    ...(角色 === '待审稿' ? prepareDraftDemotions(bookRoot, key, relPath) : []),
    { relPath, content: serializeDocument(fields, composeBody(applied.text, split.facts), 草稿字段序) },
  ]
  writeBatchAtomic(bookRoot, ops)
  return { ok: true, relPath, 角色, risks, changes: applied.changes }
}

export const polishDraft = bookWriter(polishDraftLocked)
