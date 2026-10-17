/**
 * 工具注册表共享层：工具定义公共类型、跨域辅助函数与执行底座（原生写/书仓解析/章键校验）。
 * 各域实现见同目录 *-tools.ts，聚合注册见 index.ts。
 */
import { type Session } from '@deepseek-ai/dsh-session'
import { type ToolExecutionToken, type ToolOutputDefinition } from '@deepseek-ai/dsh-tools'
import { assertSegment, commitConfirmed, type EmbeddingProvider, type IndexAction, updateOperationTargets, type FileOp, type ChapterKey, type AskFn, type OperationProvenance } from '@abzu/core'
import { designCommitResult, type DesignCommitResult } from '../design-commit-result'
import { type EditorRequestHub } from '../study/editor-requests'
import { type IndexView } from '../indexing/manager'
import { type NativeWrite } from '../native-write'
import { type ReferenceHost } from '../reference/host'

/** 窄取工具执行内可见的 Agent 子集（避免全量依赖 dsh-agent）。 */
export interface AgentLike {
  readonly id: string
  readonly ctx?: unknown
  readonly session?: {
    readonly requestHeader?: Session['requestHeader']
    readonly seq?: number
    readonly eventAt?: Session['eventAt']
    readonly header?: {
      readonly id?: string
      readonly origin?: string
      /** 会话所附工作区路径（D10：web 多工作区下按会话解析书仓与门禁根）。 */
      readonly cwd?: string
    }
  }
}

/**
 * 工具执行上下文（dsh 运行时对齐批）：dsh `ToolRunContext` 的窄投影。
 * 注册 wrapper 全字段透传（signal/callId/rootCallId/token/parent/deferContext/
 * concludeTurn），工具按需消费；字段逐一对照 dsh-tools 类型，编译器校验形状。
 */
export interface ToolExecContext {
  readonly agent?: AgentLike
  readonly name?: string
  readonly arguments?: unknown
  readonly callId?: string
  readonly rootCallId?: string
  readonly token?: ToolExecutionToken
  readonly parent?: symbol
  readonly signal?: AbortSignal
  deferContext?(context: unknown): void
  concludeTurn?(): void
}

export interface NovelToolDefinition {
  readonly name: string
  readonly description: string
  readonly parameters: Record<string, unknown>
  readonly output: ToolOutputDefinition
  readonly execute: (args: Record<string, unknown>, sessionContext?: ToolExecContext) => Promise<unknown> | unknown
}

export interface NovelToolsDeps {
  readonly referenceHost?: Pick<ReferenceHost, 'runner' | 'readFile'>
  readonly nativeWrite?: NativeWrite
  /** Resolve on every query, including after network waits, to respect service reloads. */
  readonly embeddingProvider?: (agent?: AgentLike) => EmbeddingProvider | undefined
  readonly rerankingProvider?: (agent?: AgentLike) => import('@abzu/core').RerankingProvider | undefined
  readonly indexManage?: (bookId: string, action: IndexAction | 'status', agent: AgentLike, chapter?: number) => Promise<IndexView>
  readonly workspaceRoot: (agent?: AgentLike) => string | undefined
  /** 按会话解析书仓（D10）：agent 的会话 cwd 优先，全局认领兜底。 */
  readonly bookRootOfBookId: (bookId: string, agent?: AgentLike) => string | undefined
  readonly askFn?: AskFn
  /** 注册测试/走查专用工具（NOVEL_TEST_TOOL_NAMES）；作者环境不开，默认 false。 */
  readonly testTools?: boolean
  /** 书房编辑器请求。缺席时 novel_editor_suggest 拒绝交回，不读写书仓。 */
  readonly editorRequests?: EditorRequestHub
}

export function provenanceOf(ctx: ToolExecContext | undefined, targets?: readonly string[]): OperationProvenance | undefined {
  const operationId = ctx?.callId === undefined ? undefined : `tool-${ctx.callId}`
  const p: OperationProvenance = {
    ...(operationId === undefined ? {} : { operationId }),
    ...(ctx?.agent?.session?.header?.id === undefined ? undefined : ctx.agent.session.header.id === undefined ? {} : { sessionId: ctx.agent.session.header.id }),
    ...(ctx?.agent?.id === undefined ? {} : { agentId: ctx.agent.id }),
    ...(ctx?.name === undefined ? {} : { toolName: ctx.name }),
    ...(ctx?.callId === undefined ? {} : { callId: ctx.callId }),
    ...(targets === undefined ? {} : { targets }),
  }
  return Object.keys(p).length === 0 ? undefined : p
}

/** 草稿区/书房快照结果的如实播报句(成功带版本提示,失败点名原因;不影响主流程返回)。 */
export function snapshotNote(snap: { readonly ok: boolean; readonly committed?: boolean; readonly reason?: string }): string {
  if (snap.ok) return snap.committed === true ? '草稿区已快照（独立 git，不进真源提交）。' : ''
  return `草稿区快照失败:${snap.reason ?? '未知原因'}（写作主流程不受影响）。`
}

export type BookResolved =
  | { readonly ok: true; readonly bookRoot: string }
  | { readonly ok: false; readonly reason: string }

/** 各域工具工厂共用的执行底座：deps 原样透传＋原生写/书仓解析/章键校验。 */
export interface ToolShared {
  readonly deps: NovelToolsDeps
  readonly writeNative: (root: string, op: FileOp, exec?: ToolExecContext) => Promise<void>
  readonly resolveBook: (args: Record<string, unknown>, sessionContext?: ToolExecContext) => BookResolved
  readonly chapterKeyOf: (args: Record<string, unknown>) => { readonly ok: true; readonly key: ChapterKey } | { readonly ok: false; readonly reason: string }
}

/** 组装各域工具共用的执行底座（writeNative/resolveBook/chapterKeyOf 原样收拢）。 */
export function createToolShared(deps: NovelToolsDeps): ToolShared {
async function writeNative(root: string, op: FileOp, exec?: ToolExecContext): Promise<void> {
  if (deps.nativeWrite === undefined) throw new Error('宿主原生 write 不可用，拒绝无版本保护的写入')
  updateOperationTargets(root, undefined, [op.relPath])
  await deps.nativeWrite(root, op, exec)
}

const resolveBook = (args: Record<string, unknown>, sessionContext?: ToolExecContext): BookResolved => {
  const bookId = args['bookId'] ? String(args['bookId']).trim() : undefined
  if (!bookId) return { ok: false, reason: '未指定 bookId 参数（必填）' }
  const bookRoot = deps.bookRootOfBookId(bookId, sessionContext?.agent)
  if (!bookRoot) return { ok: false, reason: `书id不存在或不唯一，未能定位书仓路径（bookId: ${bookId}）——若在工作台多工作区环境，请确认会话已附上书所在的工作范围` }
  return { ok: true, bookRoot }
}

/** 章键参数校验（真机 D-004：漏传 卷 时 NaN 路径把错误报成「无待审稿」）。 */
const chapterKeyOf = (args: Record<string, unknown>): { readonly ok: true; readonly key: ChapterKey } | { readonly ok: false; readonly reason: string } => {
  const 卷 = Number(args['卷'])
  const 章 = Number(args['章'])
  const 章名 = String(args['章名'] ?? '').trim()
  if (!Number.isSafeInteger(卷) || 卷 < 1) return { ok: false, reason: `卷必须是正整数（1 起）——请确认已传入 卷 参数（收到：${String(args['卷'] ?? '未传')}）` }
  if (!Number.isSafeInteger(章) || 章 < 1) return { ok: false, reason: `章必须是正整数（全书连续，1 起）——请确认已传入 章 参数（收到：${String(args['章'] ?? '未传')}）` }
  if (章名 === '') return { ok: false, reason: '章名不能为空（须与近期窗口条目逐字一致）' }
  try { assertSegment(章名, '章名') } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, key: { 卷, 章, 章名 } }
}

  return { deps, writeNative, resolveBook, chapterKeyOf }
}

/** 重置轮次暂存的上一轮处置:明示条数与沿用规则,免得调用方以为上一轮结论凭空消失。 */
export function inheritNote(n: number): string {
  return n === 0 ? '' : `上一轮已给处置 ${n} 条暂存待继承：对应模块重新回写时，模块名、证据位置、问题说明一致的发现项沿用原处置，其余作废。`
}

/** 设计侧确认工具的公共收尾:整批一次 design: 提交(拍板 7),失败返回「已落盘但未提交」。 */
export function finishDesignCommit(
  bookRoot: string,
  writtenPaths: readonly string[],
  args: Record<string, unknown>,
  defaultSummary: string,
  chapterScope: number | null,
  sessionContext?: ToolExecContext,
): DesignCommitResult {
  const batch = Array.isArray(args['批次文件']) ? (args['批次文件'] as unknown[]).map((v) => String(v).trim()).filter((v) => v !== '') : []
  const commit = commitConfirmed({
    bookRoot,
    paths: [...writtenPaths, ...batch],
    prefix: 'design',
    summary: args['summary'] !== undefined ? String(args['summary']).trim() : defaultSummary,
    ...(chapterScope === null ? {} : { chapterScope }),
    provenance: provenanceOf(sessionContext, [...writtenPaths, ...batch]),
  })
  return designCommitResult(commit, defaultSummary, args, sessionContext)
}

export const HAN_CHAR = /[\u4e00-\u9fff]/

/** 单字符是否为汉字(空串＝字符串边界,不算汉字)。 */
export function isHan(ch: string): boolean {
  return ch !== '' && HAN_CHAR.test(ch)
}

/**
 * 偏离名是否被作者处置文本提及(拍板 4 启发式):长名(≥4 字)足够特异,子串即算;
 * 短名(<4 字)要求至少一处出现两侧均临非汉字(行首尾/空白/标点/引号/字段拼接边界)。
 * CJK 无词边界,「出发」混在无关决策正文的「出发点」内部时不得误判已处置,否则进度卡静默少报;
 * 真实处置记录按惯例以标点或引号界定偏离名(如 名称「偏离处置-出发」/正文「偏离项『出发』处置」),不受影响。
 */
export function dispositionMentions(text: string, 名: string): boolean {
  if (名.length >= 4) return text.includes(名)
  for (let i = text.indexOf(名); i !== -1; i = text.indexOf(名, i + 1)) {
    const before = i === 0 ? '' : text.charAt(i - 1)
    const after = i + 名.length >= text.length ? '' : text.charAt(i + 名.length)
    if (!isHan(before) && !isHan(after)) return true
  }
  return false
}
