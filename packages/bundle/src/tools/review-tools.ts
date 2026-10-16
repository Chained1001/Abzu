/**
 * 审读域工具：全书状态推导/已定稿检索/索引管理/隔离子代理发现项回写。
 */
import { inheritNote, type NovelToolDefinition, type ToolShared } from './shared'
import { deriveDesign, listResumable, listConfirmedEmpty, scanChapter, scanDesign, scanDesignDetail, selectCurrentVolume, searchFinalized, type IndexAction, indexFailure, type 处置状态 } from '@abzu/core'
import { ingestFindings } from '@abzu/review'

export function createReviewTools(shared: ToolShared): NovelToolDefinition[] {
  const { deps, resolveBook, chapterKeyOf } = shared
  return [
    {
      name: 'novel_get_story_status',
      description: '读取小说的真实推进状态与可恢复章节（从 Git 与书仓真源推导，中断后无损恢复）。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
        },
        required: ['bookId'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            bookId: { type: 'string', description: '书id' },
            design: { type: 'object', description: '设计面事实清单与建议（建议仅供参考）；「内容问题」影响就绪建议，「已确认无内容」保留全部已确认空分部的提示，合法远期留白不阻塞' },
            chapters: { type: 'array', description: '章节事实清单列表（每章含逐行事实项与建议）' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const bookRoot = book.bookRoot
        const bookId = args['bookId'] ? String(args['bookId']).trim() : undefined
        if (!bookId) return { ok: false, reason: '未指定 bookId' }
        try {
          // 两段返回(设计面 + 章节面),均为 R1 事实清单形状:逐项事实 + 可选建议(无权威,判断归主 Agent)
          // 设计面事实按当前卷选择器取卷(任务21, B3):active 取该卷;planning 检查规划目标卷;empty 默认卷1
          const selection = selectCurrentVolume(bookRoot)
          const derived = deriveDesign(scanDesign(bookRoot, selection.kind === 'active' ? selection.卷 : selection.kind === 'planning' ? selection.规划卷 : 1))
          // 原状态标注保留；必要内容问题已参与建议，全部空分部另列供作者核对。
          const 已确认无内容 = listConfirmedEmpty(scanDesignDetail(bookRoot))
          const design = 已确认无内容.length === 0 ? derived : { ...derived, 已确认无内容 }
          const resumable = listResumable(bookRoot)
          // 复用 listResumable 已算好的 statusCard(每卷一份 BookStatus 缓存)——原先每章重调
          // renderStatusCard 会把 scanChapter＋账本/记忆/对账整套重跑一遍,长篇下 O(章×全卷扫描)。
          const chapters = resumable.map((r) => ({
            key: r.key,
            建议: r.derived.建议,
            事实项: r.derived.事实项,
            叠加标记: r.derived.叠加标记,
            statusCard: r.statusCard,
            ...(r.facts.审核记录哈希 === undefined ? {} : { 审核记录哈希: r.facts.审核记录哈希 }),
          }))
          return { ok: true, bookId, design, chapters }
        } catch (err) {
          return { ok: false, reason: `推导状态失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_search_finalized',
      description: '检索指定书的已定稿正文。关键词与已启用嵌入服务融合召回；返回章节、路径、行号、版本和哈希。结果仅供定位，必须原生 read 核对原文后才能引用；无提供方或接口失败时明确返回关键词模式。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '当前工作范围内的书id（必填）' },
          query: { type: 'string', description: '待找的词句或情节描述，1–256 字符；关键词按完整字面匹配' },
          mode: { type: 'string', enum: ['hybrid', 'keyword'], description: '默认混合检索；精确词句可指定 keyword 跳过查询模型' },
          rerank: { type: 'boolean', description: '默认使用已启用的重排服务；false 跳过重排' },
          limit: { type: 'integer', description: '最多返回 1–50 条，默认 10' },
        },
        required: ['bookId', 'query'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            bookId: { type: 'string' },
            mode: { type: 'string', enum: ['hybrid', 'keyword'] },
            status: { type: 'string', enum: ['matches', 'no-matches', 'no-finalized', 'partial'] },
            query: { type: 'string' },
            hits: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  relativePath: { type: 'string' }, absolutePath: { type: 'string' },
                  volume: { type: 'integer' }, chapter: { type: 'integer' }, title: { type: 'string' },
                  startLine: { type: 'integer' }, endLine: { type: 'integer' }, snippet: { type: 'string' },
                  scene: { type: 'object', description: '所属场景的标识和原文起止行号' },
                  version: { oneOf: [{ type: 'string' }, { type: 'number' }] }, hash: { type: 'string', description: '原文件字节的 SHA-256' },
                  matchedBy: { type: 'array', items: { type: 'string', enum: ['keyword', 'semantic'] } },
                  来源标注: {
                    type: 'object',
                    properties: {
                      条目: { type: 'string' }, 片段: { type: 'string' }, 来源: { type: 'string' },
                      版本: { oneOf: [{ type: 'string' }, { type: 'number' }] }, 状态: { type: 'string' }, 完整性: { type: 'string' },
                    },
                    required: ['条目', '片段', '来源', '版本', '状态', '完整性'],
                  },
                },
                required: ['relativePath', 'absolutePath', 'volume', 'chapter', 'title', 'startLine', 'endLine', 'snippet', 'version', 'hash', 'matchedBy', '来源标注'],
              },
            },
            limited: { type: 'boolean' },
            issues: {
              type: 'array', description: '未能检索的来源，不可将 partial 解释为完整搜索',
              items: { type: 'object', properties: { path: { type: 'string' }, code: { type: 'string' }, message: { type: 'string' } }, required: ['path', 'code', 'message'] },
            },
            degraded: { type: 'string' },
            reranking: { type: 'object', description: '是否执行模型重排、候选数及降级原因' },
            index: {
              type: 'object',
              properties: {
                state: { type: 'string', enum: ['created', 'ready', 'rebuilt'] }, chapters: { type: 'integer' }, chunks: { type: 'integer' },
                embedded: { type: 'integer' }, reused: { type: 'integer' },
              },
              required: ['state', 'chapters', 'chunks', 'embedded', 'reused'],
            },
            message: { type: 'string' },
            code: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return { ...book, code: 'book-not-found' }
        const result = await searchFinalized(book.bookRoot, {
          query: args['query'] as string,
          limit: args['limit'] as number | undefined,
          getProvider: () => deps.embeddingProvider?.(sessionContext?.agent),
          getReranker: () => deps.rerankingProvider?.(sessionContext?.agent),
          mode: args['mode'] as 'hybrid' | 'keyword' | undefined,
          rerank: args['rerank'] as boolean | undefined,
          signal: sessionContext?.signal,
        })
        return { ...result, bookId: String(args['bookId']).trim() }
      },
    },
    {
      name: 'novel_index_manage',
      description: '查看指定书的后台索引状态，或委托程序更新、暂停、继续和重建。正常维护自动运行。收到索引错误先查状态；全量重建只在作者明确要求时使用，不自行操作数据库或无限重试。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '当前工作范围内的书id' },
          action: { type: 'string', enum: ['status', 'enable', 'disable', 'update', 'pause', 'resume', 'retry', 'rebuild', 'rescan-scenes'], description: '默认 status；update 增量更新，rebuild 仅重建向量；rescan-scenes 按作者明确要求重新识别场景' },
          chapter: { type: 'integer', minimum: 1, description: 'rescan-scenes 可指定一章；省略表示全书' },
        },
        required: ['bookId'],
      },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean' }, index: { type: 'object' }, code: { type: 'string' }, reason: { type: 'string' } }, required: ['ok'] },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        if (!sessionContext?.agent) return { ok: false, code: 'agent-required', reason: '索引管理需要当前主 Agent' }
        if (!deps.indexManage) return { ok: false, code: 'unavailable', reason: '后台索引服务尚未就绪' }
        const action = args['action'] ?? 'status'
        if (typeof action !== 'string' || !['status', 'enable', 'disable', 'update', 'pause', 'resume', 'retry', 'rebuild', 'rescan-scenes'].includes(action)) return { ok: false, code: 'invalid-action', reason: '未知索引操作' }
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return { ...book, code: 'book-not-found' }
        try { return { ok: true, index: await deps.indexManage(String(args['bookId']).trim(), action as IndexAction | 'status', sessionContext.agent, args['chapter'] as number | undefined) } }
        catch (error) { const failure = indexFailure(error); return { ok: false, code: failure.code, reason: failure.message } }
      },
    },
    {
      name: 'novel_record_review_findings',
      description: '把审读子 Agent 产出的发现项回写进审核记录（堵「空审通过」）。同一模块重复回写＝本轮结果整批替换；跨轮沿用按 模块名+证据位置+问题说明 认亲。全部模块回写仅表示报告齐全；证据须适用当前稿且发现项均有效处置，才能报告审核通过。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          模块名: { type: 'string', description: '审读模块名（如 章节结构审读）' },
          发现项: {
            type: 'array',
            description: '发现项数组（每条含 证据位置/问题说明 等；无问题传空数组）',
            items: { type: 'object' },
          },
          审读指纹: { type: 'string', description: '自动模块每次必填：使用派发该模块时的审核输入指纹，不得省略或换成后来取得的值；作者意见可不提供' },
        },
        required: ['bookId', '卷', '章', '章名', '模块名', '发现项'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            完成: { type: 'boolean', description: '全部审读模块（确定性＋语义）是否回写完毕' },
            审核通过: { type: 'boolean', description: '当前证据有效且所有发现项已处置' },
            待处置数: { type: 'number', description: '仍未处置的发现项数量' },
            待回写模块: { type: 'array', description: '尚未回写的模块名（与「完成」同源：为空即完成）' },
            待继承处置数: { type: 'number', description: '上一轮已给处置中暂存待继承的条数' },
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
        try {
          const r = ingestFindings(book.bookRoot, keyResult.key, String(args['模块名']).trim(), Array.isArray(args['发现项']) ? (args['发现项'] as unknown[]) : [],
            typeof args['审读指纹'] === 'string' ? args['审读指纹'] : undefined)
          if (!r.ok) return { ok: false, reason: r.reason }
          const 完成 = r.record?.完成 === true
          const 审核通过 = scanChapter(book.bookRoot, keyResult.key).审核完成
          const 待处置数 = r.record?.问题.filter(item => !item.处置状态 || item.处置状态 === '待处理').length ?? 0
          const pending = r.待回写模块 ?? []
          const 待继承处置数 = r.record?.待继承处置?.length ?? 0
          return {
            ok: true,
            完成,
            审核通过,
            待处置数,
            待回写模块: pending,
            待继承处置数,
            message: 审核通过
              ? '发现项已回写，全部模块完成，审核通过。'
              : 完成 ? `全部模块已回写，但审核尚未通过；仍有 ${待处置数} 项待处置，请核对当前证据并完成处置。`
              : `发现项已回写。尚待回写模块：${pending.join('、')}（全部回写后审核才完成）。${inheritNote(待继承处置数)}`,
          }
        } catch (err) {
          return { ok: false, reason: `发现项回写失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
  ]
}
