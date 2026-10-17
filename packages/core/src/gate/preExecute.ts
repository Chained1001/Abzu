/**
 * tools/pre-execute 纯策略(插件规格 §6):非改写工具放行;改写文件工具先路径门禁再写稿门槛。
 * 缺路径/不可解析一律拒绝(fail-closed)。
 */

import { gateFileAccess } from './paths'
import type { PreToolDecision, ToolCall } from './types'
import { gateWriteDraft } from './writeDraft'

const MUTATING_FILE_TOOLS = new Set(['write', 'edit', 'str_replace_editor'])
/** 已登记的只读文件工具：带路径参数的工具必须出现在这里或 MUTATING 里，否则判 unknown（D-1）。 */
const READ_ONLY_FILE_TOOLS = new Set(['read', 'read_image'])

export type FileToolKind = 'mutating' | 'read-only' | 'unknown' | 'unrelated'

/**
 * D-1 文件工具分类（单源，core 与 bundle 共用）：
 * - `mutating`  改写工具（语义由 isMutatingFileTool 决定，本函数不改它）
 * - `read-only` 已登记的只读 / 非改写文件工具
 * - `unknown`   顶层带 `file_path`/`path` 却未登记——判不了只读还是改写，交作者确认（fail-closed）
 * - `unrelated` 顶层不碰路径参数的工具（novel_* / present / todo 类），一律放行
 *
 * 判定顺序不能换：`str_replace_editor {command:'view'}` 的 isMutatingFileTool 为 false，
 * 必须靠第 2 步（名字在 MUTATING_FILE_TOOLS 里）判成 read-only，否则今天就会多出一批 ask。
 * 键名口径与 extractToolPath 同一套（只认 file_path / path，不猜 target / uri / filePath）。
 */
export function classifyFileTool(exec: ToolCall): FileToolKind {
  if (isMutatingFileTool(exec)) return 'mutating'
  if (MUTATING_FILE_TOOLS.has(exec.name)) return 'read-only'
  if (READ_ONLY_FILE_TOOLS.has(exec.name)) return 'read-only'
  const args = asRecord(exec.arguments)
  if (args !== null && ('file_path' in args || 'path' in args)) return 'unknown'
  return 'unrelated'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function stringField(obj: Record<string, unknown> | null, key: string): string | null {
  if (!obj) return null
  const v = obj[key]
  return typeof v === 'string' && v !== '' ? v : null
}

export function isMutatingFileTool(exec: ToolCall): boolean {
  if (!MUTATING_FILE_TOOLS.has(exec.name)) return false
  if (exec.name !== 'str_replace_editor') return true
  // 批F:删死集 STR_REPLACE_MUTATING——走到这里 cmd 必非 'view'(上方已返回 false),
  // `has(cmd) || cmd !== 'view'` 恒真;未登记命令一律按改写(fail-closed)。
  const cmd = stringField(asRecord(exec.arguments), 'command')
  return cmd !== 'view'
}

export function extractToolPath(exec: ToolCall): string | null {
  const args = asRecord(exec.arguments)
  if (exec.name === 'read' || exec.name === 'write' || exec.name === 'edit') return stringField(args, 'file_path')
  if (exec.name === 'str_replace_editor') return stringField(args, 'path')
  return null
}

export function decidePreExecute(bookRoot: string, exec: ToolCall): PreToolDecision {
  const kind = classifyFileTool(exec)
  if (kind === 'unknown') {
    return { kind: 'ask', reason: `未登记的文件工具 ${exec.name} 携带路径参数，无法判定只读或改写，需作者确认` }
  }
  if (kind !== 'mutating') return { kind: 'allow' }
  const target = extractToolPath(exec)
  if (target === null) return { kind: 'deny', reason: '文件工具缺少可解析路径,拒绝写入' }
  const access = gateFileAccess(bookRoot, target)
  if (!access.allow) return { kind: 'deny', reason: access.reason }
  const draft = gateWriteDraft(bookRoot, access.relPath)
  if (!draft.allow) return { kind: 'deny', reason: draft.reason }
  return { kind: 'allow' }
}
