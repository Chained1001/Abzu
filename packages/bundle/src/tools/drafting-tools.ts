/**
 * 起草域工具：作者稿导入（作者手写/手改，与 AI 稿地位相同）/书房编辑器建议回传。
 */
import { snapshotNote, type NovelToolDefinition, type ToolShared } from './shared'
import { importAuthorDraft } from '@abzu/drafting'
import { snapshotDraft, ingestAuthorRevision } from '@abzu/core'
import { acceptEditorSuggestion } from '../study/editor-requests'

export function createDraftingTools(shared: ToolShared): NovelToolDefinition[] {
  const { deps, resolveBook, chapterKeyOf } = shared
  return [
    {
      name: 'novel_import_draft',
      description: '作者稿导入：把作者亲手写的整章或改过的版本落为草稿区新一稿，与 AI 稿地位相同（生成模块留痕 作者手写/作者手改）。角色: 待审稿＝交审（默认用法，旧待审稿自动降级，父版本指向被改的稿）；角色: 草稿＝作者暂存、还不交审。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          正文: { type: 'string', description: '作者稿全文（可带「## 草稿候选事实」段）' },
          候选事实: { type: 'array', items: { type: 'string' }, description: '候选事实（可选，逐条）' },
          角色: { type: 'string', enum: ['草稿', '待审稿'], description: '待审稿＝交审（默认用法，替代当前待审稿）；草稿＝作者暂存、还不交审' },
          生成模块: { type: 'string', enum: ['作者手写', '作者手改'], description: '整章自写＝作者手写；在某稿基础上改＝作者手改（可选；缺省按 作者手写 留痕——与实现的缺省口径一致，P2-2 schema 过查修正）' },
          父版本: { type: 'number', description: '作者手改时指向被改稿的版本（可选；缺省取该章最新版本）' },
        },
        // 生成模块 与实现对齐改为可选（缺省 作者手写）：原 required 比实现更严，
        // 统一校验后会误拒合法调用（approval-snapshot F04 既有用例即省略）。core 兜底不动。
        required: ['bookId', '卷', '章', '章名', '正文', '角色'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '新稿相对路径' },
            diff: { type: 'array', description: '作者手改时：相对父版本的行级差异' },
            followup: { type: 'object', description: '作者手改时：后续范围报告（硬约束回查/仍待处置/建议重跑）' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const keyResult = chapterKeyOf(args)
        if (!keyResult.ok) return keyResult
        const key = keyResult.key
        const 角色 = String(args['角色']) === '待审稿' ? '待审稿' : '草稿'
        const 生成模块 = String(args['生成模块']) === '作者手改' ? '作者手改' : '作者手写'
        try {
          // M1：作者手改（待审稿替代）走 ingestAuthorRevision——正文原样落盘＋后续范围报告＋diff
          if (角色 === '待审稿' && 生成模块 === '作者手改') {
          const r = ingestAuthorRevision(book.bookRoot, key, String(args['正文'] ?? ''))
          if (!r.ok) return { ok: false, reason: r.reason }
          const snap = snapshotDraft(book.bookRoot, `快照: 作者手改 ${r.relPath}`)
          return {
            ok: true,
            relPath: r.relPath,
            diff: r.diff,
            followup: r.followup,
            message: `作者手改已摄入：${r.relPath}（生成模块 作者手改，原样落盘）。后续范围报告：硬约束回查失败 ${r.followup.硬约束回查失败.length} 项；仍待处置 ${r.followup.仍待处置.length} 项${r.followup.建议重跑.length > 0 ? `；建议重跑 ${r.followup.建议重跑.join('、')}` : ''}。是否重跑由你判断，本工具不自动开跑。${snapshotNote(snap)}`,
          }
          }
          const res = importAuthorDraft(book.bookRoot, {
            ...key,
            正文: String(args['正文'] ?? ''),
            ...(Array.isArray(args['候选事实']) ? { 候选事实: (args['候选事实'] as unknown[]).map(String) } : {}),
            角色,
            生成模块,
            ...(args['父版本'] === undefined ? {} : { 父版本: Number(args['父版本']) }),
          })
          if (!res.ok) return { ok: false, reason: res.reason }
          const snap = snapshotDraft(book.bookRoot, `快照: 作者稿导入 ${res.relPath}`)
          return {
            ok: true,
            relPath: res.relPath,
            ...(res.播报 === undefined ? {} : { 播报: res.播报 }),
            message: `作者稿已导入：${res.relPath}（生成模块 ${生成模块}，角色 ${角色}）。${角色 === '待审稿' ? '已交审：该稿为当前唯一待审稿，可进入《全面审读》。' : '作者暂存：不交审，待作者要求交审时再以 角色: 待审稿 导入。'}${snapshotNote(snap)}`,
          }
        } catch (err) {
          return { ok: false, reason: `作者稿导入失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_editor_suggest',
      description: '把书房编辑器请求的结果交回编辑器，由作者决定是否采用。只用于回复以「【书房编辑器」开头的请求；必须调用本工具交回，不要直接改写文件，也不要把这次请求当作推进章节的授权。润色、扩写、精简、按要求改用 replace；续写用 insert；审读用 comments；没有可交回的修改时用 none。润色不得新增行动者、立场、动作或事实。审读只标出问题，comments 的每条 quote 必须逐字摘自请求原文。本工具不读写书仓。',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string', description: '书房编辑器请求中的编号' },
          kind: { type: 'string', enum: ['replace', 'insert', 'comments', 'none'], description: 'replace 替换原文，insert 在插入点续写，comments 只标问题，none 表示无需修改' },
          text: { type: 'string', description: 'replace 或 insert 的正文' },
          comments: {
            type: 'array',
            description: '审读批注，1 到 12 条；每条 quote 必须逐字摘自请求原文',
            items: {
              type: 'object',
              properties: {
                quote: { type: 'string', description: '逐字摘自请求原文的引文' },
                note: { type: 'string', description: '这条引文的问题说明，不超过 300 字' },
              },
              required: ['quote', 'note'],
            },
          },
          note: { type: 'string', description: '给作者的一句话说明，不超过 200 字' },
        },
        required: ['requestId', 'kind'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否已交回编辑器' },
            requestId: { type: 'string' },
            delivered: { type: 'boolean', description: '成功时为 true，表示结果已送到编辑器' },
            message: { type: 'string' },
            reason: { type: 'string', description: '未能交回的原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: (args, sessionContext) => acceptEditorSuggestion(deps.editorRequests, sessionContext?.agent, args),
    },
  ]
}
