/**
 * 定稿域工具：待定稿包组装/作者批准后原子沉淀。
 */
import { provenanceOf, type NovelToolDefinition, type ToolShared } from './shared'
import { archiveDraftChapter, pad, paths, preparePack, archiveChapter, withBookWrite, askAuthor, writeSettlementDecision, resolveDraftRel, snapshotDraft } from '@abzu/core'
import { captureApprovalFiles } from '../approval-snapshot'

export function createSettleTools(shared: ToolShared): NovelToolDefinition[] {
  const { deps, resolveBook, chapterKeyOf } = shared
  return [
    {
      name: 'novel_prepare_pack',
      description: '组装本章待定稿包七件（正文/事实变更/时间线变更/账本变更/章摘要/卷对账/记忆候选）到草稿区定稿准备目录，供呈报作者裁决。传沉淀候选（沉淀子代理对账产出）则写入七件并逐段预校验，失败返回解析器原话且不写任何文件；不传则相应件为占位。前置：存在唯一待审稿。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          时间线变更: { type: 'string', description: '沉淀候选：时间线变更全文（可选）' },
          账本变更: { type: 'string', description: '沉淀候选：账本变更全文（可选）' },
          记忆候选: { type: 'string', description: '沉淀候选：本书层记忆候选全文（可选）' },
          章摘要: { type: 'string', description: '沉淀候选：章摘要全文（可选）' },
          事实变更: { type: 'string', description: '沉淀候选：事实变更全文（可选）' },
        },
        required: ['bookId', '卷', '章', '章名'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            dir: { type: 'string', description: '待定稿包目录（书仓内相对路径）' },
            files: { type: 'array', description: '七件清单' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const bookRoot = book.bookRoot
        const keyResult = chapterKeyOf(args)
        if (!keyResult.ok) return keyResult
        const key = keyResult.key
        const textArg = (name: string): string | undefined => {
          const raw = args[name]
          if (raw === undefined || raw === null) return undefined
          const s = String(raw)
          return s.trim() === '' ? undefined : s
        }
        const 沉淀候选 = {
          ...(textArg('时间线变更') === undefined ? {} : { 时间线变更: textArg('时间线变更') }),
          ...(textArg('账本变更') === undefined ? {} : { 账本变更: textArg('账本变更') }),
          ...(textArg('记忆候选') === undefined ? {} : { 记忆候选: textArg('记忆候选') }),
          ...(textArg('章摘要') === undefined ? {} : { 章摘要: textArg('章摘要') }),
          ...(textArg('事实变更') === undefined ? {} : { 事实变更: textArg('事实变更') }),
        }
        try {
          const res = preparePack(bookRoot, key, 沉淀候选)
          if (!res.ok) return { ok: false, reason: res.reason }
          return {
            ok: true,
            dir: res.dir,
            files: res.files,
            message: `待定稿包已组装至 ${res.dir}，请逐件审阅后呈报作者裁决；作者批准后再调用 novel_settle_chapter 沉淀。`,
          }
        } catch (err) {
          return { ok: false, reason: `组装待定稿包失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_settle_chapter',
      description: '定稿原子沉淀：将作者已批准的待定稿包按清单原子写入并做单次 Git 提交（ch:）。⚠️ 仅在作者明确批准定稿裁决后调用，未获批准严禁入档。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          summary: { type: 'string', description: '提交摘要（如 第一章 登船）' },
        },
        required: ['bookId', '卷', '章', '章名', 'summary'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            message: { type: 'string', description: '结果说明（含入档去处）' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: async (args, sessionContext) => {
        if (!deps.askFn) return { ok: false, reason: '裁决通道未配置（需宿主注入 askFn）' }
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const bookRoot = book.bookRoot
        const keyResult = chapterKeyOf(args)
        if (!keyResult.ok) return keyResult
        const key = keyResult.key
        // Y9(批F):summary trim 非空——空提交摘要不进裁决流程(schema 只验类型,空白串会漏)
        const summary = typeof args['summary'] === 'string' ? args['summary'].trim() : ''
        if (summary === '') return { ok: false, reason: `summary 必须非空（提交摘要，如 第一章 登船；收到：${String(args['summary'])}）` }
        const approvalFiles = [resolveDraftRel(bookRoot, '待定稿包目录', key), paths.契约()]
        const before = captureApprovalFiles(bookRoot, approvalFiles, args)
        if (!before.ok) return before
        const decision = await askAuthor(deps.askFn, '定稿入档', { 范围: `卷${key.卷.toString().padStart(2, '0')}/${key.章名}` }, { agent: sessionContext?.agent, signal: sessionContext?.signal })
        if (!decision.ok) return { ok: false, reason: `未获作者批准: ${decision.reason}` }
        if (sessionContext?.signal?.aborted) return { ok: false, reason: '作者裁决已取消（ASK_ABORTED）' }
        // decision.ok 只表示答案有效;退回同样是有效答案,须按 决定 判。
        const 裁决 = decision.决定 === '已批准' ? '已批准' : '已退回'
        return withBookWrite(bookRoot, () => {
          if (sessionContext?.signal?.aborted) return { ok: false, reason: '作者裁决已取消（ASK_ABORTED）' }
          const currentBook = resolveBook(args, sessionContext)
        if (!currentBook.ok || currentBook.bookRoot !== bookRoot) return { ok: false, reason: '等待作者裁决期间书id或归属已变化，请核对书目后重新呈报' }
        const current = captureApprovalFiles(bookRoot, approvalFiles, args)
          if (!current.ok || current.fingerprint !== before.fingerprint) return { ok: false, reason: '待定稿包在等待作者裁决期间已变化，旧批准不可使用；请重新呈报作者裁决' }
          const decisionWrite = writeSettlementDecision(bookRoot, key, 裁决)
          if (裁决 !== '已批准') {
            // 驳回本身必须保留原有语义;清单缺失时无法落裁决,但不能把作者决定
            // 误报成基础设施错误。若清单存在,上面的回写仍会打通退回通路。
            const reason = `未获作者批准（作者${decision.决定}）,拒绝入档`
            return { ok: false, reason }
          }
          if (!decisionWrite.ok) return { ok: false, reason: decisionWrite.reason }
          try {
            const res = archiveChapter({
              bookRoot,
              packageDir: resolveDraftRel(bookRoot, '待定稿包目录', key),
              summary,
              settlement: { 章节: key, 批准: true, 裁决记录: `作者于 ${new Date().toISOString()} 批准定稿入档（kind=${decision.kind}, 决定=${decision.决定}）` },
              provenance: provenanceOf(sessionContext),
            })
            if (!res.ok) return { ok: false, reason: res.reason }
            // 定稿后清理草稿区五处(批8,0.0.57):入档已原子完成,清掉本章草稿/材料包/审核记录/待定稿包/候选细纲
            // ——draft-git 的 add -A 全量索引不再随书膨胀。清理失败不回滚入档,如实进返回。
            // 写时发现须在沉淀步分拣完毕后才清(口径见 novel-settle SKILL 沉淀步)。
            let cleanupNote = ''
            try {
              const cleanup = archiveDraftChapter(bookRoot, key)
              const snap = snapshotDraft(bookRoot, `定稿后清理:卷${pad(key.卷)}-${key.章名}`)
              cleanupNote = `草稿区已清理（删 ${cleanup.removed.length} 处，快照${snap.committed ? '已提交' : '无变化'}）。`
            } catch (cleanupErr) {
              cleanupNote = `草稿区清理失败:${cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)}（入档不受影响，可跑 草稿清理.mjs --执行 true 补清）。`
            }
            return { ok: true, message: `定稿沉淀完成（${res.message}），入档：${res.dests.join('、')}。${cleanupNote}` }
          } catch (err) {
            return { ok: false, reason: `定稿沉淀失败: ${err instanceof Error ? err.message : String(err)}` }
          }
        }, provenanceOf(sessionContext))
      },
    },
  ]
}
