/**
 * 改稿域工具：一处小改/处置批落实/提案登记与裁决/吃书补偿执行。
 */
import { provenanceOf, type NovelToolDefinition, type ToolShared } from './shared'
import { applyVersionFields, archiveRetconRequest, bumpVersion, applyRevision, applyRevisionBatch, paths, withBookWrite, 草稿字段序, extractVersionFields, initialVersion, parseDocument, serializeDocument, type FindingChangeMap, type 处置状态, askAuthor, registerProposal, resolveProposal, retconEventOps } from '@abzu/core'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { captureApprovalFiles } from '../approval-snapshot'

export function createRevisionTools(shared: ToolShared): NovelToolDefinition[] {
  const { deps, resolveBook, chapterKeyOf } = shared
  return [
    {
      name: 'novel_apply_revision',
      description: '落实一条发现项处置。带补丁且处置为已解决/已接受修改时产出新待审稿；不带补丁只记处置。可记录上游条目的作者保留/已驳回/无法判断，实际真源修改仍须呈报。先从 novel_get_story_status 取得本章审核记录哈希并传入，避免覆盖旧记录；多项走 novel_apply_revision_batch。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          发现项编号: { type: 'string', description: '审核记录中的发现项编号' },
          审核记录哈希: { type: 'string', description: '状态查询或上次处置返回的记录 SHA-256；不一致时拒绝写入' },
          改动说明: { type: 'string', description: '本条处置说明（可选，省略保留已有说明）' },
          提案编号: { type: 'string', pattern: '^\\d{4}$', description: '已转提案时传已通过且关联本发现项的四位提案编号' },
          处置: { type: 'string', enum: ['待处理', '已接受修改', '已解决', '作者保留', '已驳回', '无法判断', '已转提案'], description: '处置状态。已转提案：影响真源的发现项已登记提案且作者已通过，必须传四位提案编号，提案须关联本章本发现项' },
          补丁旧文: { type: 'string', description: '补丁 old（可选；与补丁新文成对）' },
          补丁新文: { type: 'string', description: '补丁 new（可选）' },
        },
        required: ['bookId', '卷', '章', '章名', '发现项编号', '处置'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '新一版待审稿相对路径（无补丁时缺席）' },
            审核记录哈希: { type: 'string', description: '写入后的记录 SHA-256，供下一次处置使用' },
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
        const keyResult = chapterKeyOf(args)
        if (!keyResult.ok) return keyResult
        const key = keyResult.key
        try {
          if ((args['补丁旧文'] === undefined) !== (args['补丁新文'] === undefined)) return { ok: false, reason: '补丁旧文与补丁新文必须成对提供' }
          const hasPatch = args['补丁旧文'] !== undefined && args['补丁新文'] !== undefined
          const res = applyRevision(book.bookRoot, key, {
            发现项编号: String(args['发现项编号']).trim(),
            处置: String(args['处置']) as 处置状态,
            ...(args['审核记录哈希'] === undefined ? {} : { 审核记录哈希: String(args['审核记录哈希']) }),
            ...(args['改动说明'] === undefined ? {} : { 改动说明: String(args['改动说明']) }),
            ...(args['提案编号'] === undefined ? {} : { 提案编号: String(args['提案编号']) }),
            ...(hasPatch ? { 补丁: { old: String(args['补丁旧文']), new: String(args['补丁新文']) } } : {}),
          })
          if (!res.ok) return { ok: false, reason: res.reason }
          return { ok: true, relPath: res.relPath, 审核记录哈希: res.审核记录哈希, message: res.relPath === undefined ? '处置已记入审核记录（无补丁，不产生新稿）' : `已产出新一版待审稿：${res.relPath}` }
        } catch (err) {
          return { ok: false, reason: `落实处置失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_apply_revision_batch',
      description: '处置批落实：新稿与全部处置同批落盘；不传新稿正文只回写选定处置，保留其余字段和审核证据。传入状态查询或上次处置返回的审核记录哈希；旧记录、重复或未知编号整批拒绝。上游条目的保留/驳回/无法判断用纯处置批记录，实际修改仍走提案，不与正文修改混批。作者稿用 novel_import_draft。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          新稿正文: { type: 'string', description: '改稿子代理返回的整稿正文（可选；不传＝只回写处置）' },
          审核记录哈希: { type: 'string', description: '状态查询或上次处置返回的记录 SHA-256；不一致时整批拒绝' },
          候选事实: { type: 'array', items: { type: 'string' }, description: '覆盖候选事实段（可选；不传沿用源稿）' },
          生成模块: { type: 'string', description: '留痕用（可选；默认 改稿，作者手改时传 作者手改）' },
          处置: {
            type: 'array',
            description: '处置清单（逐条对应审核记录发现项）',
            items: {
              type: 'object',
              properties: {
                发现项编号: { type: 'string', description: '审核记录中的发现项编号' },
                处置: { type: 'string', enum: ['待处理', '已接受修改', '已解决', '作者保留', '已驳回', '无法判断', '已转提案'], description: '处置状态。已转提案：影响真源的发现项已登记提案且作者已通过，必须传四位提案编号，提案须关联本章本发现项' },
                改动说明: { type: 'string', description: '该条对应的改动说明（可选）' },
                改动映射: {
                  type: 'object',
                  description: '该条发现项落到正文的「发现项→改动」映射（可选；不传＝不回填映射，处置与改动的对应关系无处存放）',
                  properties: {
                    改动位置: { type: 'string', description: '改动落在正文的哪一处（无正文改动写 无改动）' },
                    改动说明: { type: 'string', description: '一句话说明改了什么（无正文改动写原因）' },
                  },
                  required: ['改动位置', '改动说明'],
                },
                提案编号: { type: 'string', pattern: '^\\d{4}$', description: '已转提案时传已通过且关联本发现项的四位提案编号' },
              },
              required: ['发现项编号', '处置'],
            },
          },
        },
        required: ['bookId', '卷', '章', '章名', '处置'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '新一版待审稿相对路径（只回写处置时缺席）' },
            更新条数: { type: 'number', description: '回写的处置条数' },
            审核记录哈希: { type: 'string', description: '写入后的记录 SHA-256，供下一批处置使用' },
            followup: { type: 'object', description: '后续范围报告（硬约束回查/需语义审读/仍待处置/建议重跑）' },
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
        const raw处置 = args['处置']
        if (!Array.isArray(raw处置) || raw处置.length === 0) return { ok: false, reason: '处置清单为空' }
        const 处置 = raw处置.map((item) => {
          const o = (item ?? {}) as Record<string, unknown>
          const 改动说明 = typeof o['改动说明'] === 'string' && o['改动说明'].trim() !== '' ? String(o['改动说明']) : undefined
          return {
            发现项编号: String(o['发现项编号'] ?? '').trim(),
            处置: String(o['处置'] ?? '') as 处置状态,
            ...(o['提案编号'] === undefined ? {} : { 提案编号: String(o['提案编号']) }),
            ...(改动说明 === undefined ? {} : { 改动说明 }),
            ...(o['改动映射'] === undefined ? {} : { 改动映射: o['改动映射'] as FindingChangeMap }),
          }
        })
        const keyResult = chapterKeyOf(args)
        if (!keyResult.ok) return keyResult
        try {
          const res = applyRevisionBatch(book.bookRoot, {
            ...keyResult.key,
            ...(args['新稿正文'] === undefined ? {} : { 新稿正文: String(args['新稿正文']) }),
            ...(args['审核记录哈希'] === undefined ? {} : { 审核记录哈希: String(args['审核记录哈希']) }),
            ...(Array.isArray(args['候选事实']) ? { 候选事实: (args['候选事实'] as unknown[]).map(String) } : {}),
            ...(args['生成模块'] === undefined ? {} : { 生成模块: String(args['生成模块']) }),
            处置,
          })
          if (!res.ok) return { ok: false, reason: res.reason }
          const 后续 = `后续范围报告：硬约束回查失败 ${res.followup.硬约束回查失败.length} 项；仍待处置 ${res.followup.仍待处置.length} 项${res.followup.建议重跑.length > 0 ? `；建议重跑 ${res.followup.建议重跑.join('、')}` : ''}。是否重跑由你判断，本工具不自动开跑。`
          return {
            ok: true,
            ...(res.relPath === undefined ? {} : { relPath: res.relPath }),
            更新条数: res.更新条数,
            审核记录哈希: res.审核记录哈希,
            followup: res.followup,
            message: res.relPath === undefined
              ? `已回写 ${res.更新条数} 条处置（无新稿）。${后续}`
              : `已写入新稿 ${res.relPath}，并回写 ${res.更新条数} 条处置。${后续}`,
          }
        } catch (err) {
          return { ok: false, reason: `处置批落实失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_record_proposal',
      description: '登记内容修改提案（登记本身不代表批准执行）：作者要求改某处、或审核/对账发现缺口漂移时登记，先跑影响分析脚本再补「影响分析」内容，呈作者裁决。提案文件落 草稿区/提案/，作者可读可改。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          域: { type: 'string', enum: ['内容修订', '吃书补偿'], description: '内容修订＝改计划/设定等真源；吃书补偿＝涉及已定稿内容' },
          类型: { type: 'string', enum: ['补充设计', '修改计划', '事实更正', '吃书'], description: '提案类型' },
          内容: { type: 'string', description: '提案正文：改什么、为什么、影响面摘要' },
          来源: { type: 'string', description: '提案来源（如「第3章审核发现项 2 条」「作者对话指示」）' },
          影响分析: { type: 'string', description: '影响分析脚本输出的摘要（可登记后补）' },
          关联发现项: { type: 'array', description: '从审核转交的提案须登记原发现项身份', items: { type: 'object', properties: {
            卷: { type: 'integer', minimum: 1 }, 章: { type: 'integer', minimum: 1 }, 章名: { type: 'string' }, 发现项编号: { type: 'string' },
          }, required: ['卷', '章', '章名', '发现项编号'] } },
        },
        required: ['bookId', '域', '类型', '内容', '来源'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            编号: { type: 'string', description: '提案编号（4 位序）' },
            relPath: { type: 'string', description: '提案文件相对路径' },
            message: { type: 'string', description: '结果说明（登记后续：先补影响分析，再呈作者裁决）' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        try {
          const r = registerProposal(book.bookRoot, {
            域: String(args['域']) === '吃书补偿' ? '吃书补偿' : '内容修订',
            类型: (['补充设计', '修改计划', '事实更正', '吃书'] as const).includes(args['类型'] as never) ? (args['类型'] as '补充设计' | '修改计划' | '事实更正' | '吃书') : '修改计划',
            内容: String(args['内容'] ?? ''),
            来源: String(args['来源'] ?? '作者对话指示'),
            ...(args['关联发现项'] === undefined ? {} : { 关联发现项: args['关联发现项'] as NonNullable<Parameters<typeof registerProposal>[1]['关联发现项']> }),
            ...(args['影响分析'] === undefined ? {} : { 影响分析: String(args['影响分析']) }),
          })
          return { ...r, message: `提案 ${r.编号} 已登记：${r.relPath}。先跑影响分析脚本补「影响分析」，再呈作者裁决（novel_resolve_proposal）。` }
        } catch (err) {
          return { ok: false, reason: `提案登记失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_resolve_proposal',
      description: '回写提案的作者裁决（通过/驳回＋裁决记录）。作者在对话或工作台的表态即决定（指令即批准）；已裁决的提案不重复回写。通过后：未定稿下游经确认类工具「批次文件」整批 design: 提交；已定稿下游走 novel_apply_retcon。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          提案编号: { type: 'string', description: '提案编号（4 位序，如 0001）' },
          决定: { type: 'string', enum: ['通过', '驳回'], description: '作者决定' },
          裁决记录: { type: 'string', description: '作者裁决的一句话理由（必填，留痕）' },
        },
        required: ['bookId', '提案编号', '决定', '裁决记录'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        return resolveProposal(book.bookRoot, String(args['提案编号']).trim(), String(args['决定']) === '驳回' ? '驳回' : '通过', String(args['裁决记录'] ?? ''))
      },
    },
    {
      name: 'novel_apply_retcon',
      description: '吃书补偿执行（必过作者裁决）：把受影响定稿章按更正后正文重写、可选沉淀候选走整条更正（世界书/账本/记忆），生成补偿事件记录并单次 retcon: 提交。前置：影响分析已呈报、作者已在对话中批准。不是撤销——历史经补偿事件留痕。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '受影响定稿章卷号' },
          章: { type: 'number', description: '受影响定稿章章号' },
          章名: { type: 'string', description: '受影响定稿章章名' },
          更正后正文: { type: 'string', description: '更正后的定稿章全文（原样落盘）' },
          提案编号: { type: 'string', description: '关联提案编号（可选）' },
          摘要: { type: 'string', description: '补偿事件摘要（retcon: 提交说明）' },
          事实变更: { type: 'string', description: '沉淀候选：事实变更全文（可选，走整条更正）' },
          时间线变更: { type: 'string', description: '沉淀候选：时间线变更全文（可选）' },
          账本变更: { type: 'string', description: '沉淀候选：账本变更全文（可选，更正既有条目）' },
          记忆候选: { type: 'string', description: '沉淀候选：本书层记忆候选全文（可选）' },
          更正后章摘要: { type: 'string', description: '更正后的章摘要全文（可选；未传则现有章摘要加失效标记，同提交）' },
        },
        required: ['bookId', '卷', '章', '章名', '更正后正文', '摘要'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            dests: { type: 'array', description: 'retcon 提交覆盖的文件' },
            补偿事件: { type: 'string', description: '补偿事件记录相对路径' },
            message: { type: 'string', description: '结果说明（含下游整改提醒）' },
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
        args = structuredClone(args)
        // Normalize exactly what the writer consumes before any version/event is generated.
        let 更正正文输入 = String(args['更正后正文'] ?? '')
        const passthrough = parseDocument(更正正文输入)
        if (passthrough.ok && (passthrough.data.fields['身份'] !== undefined || passthrough.data.fields['角色'] !== undefined)) {
          更正正文输入 = passthrough.data.body
        }
        更正正文输入 = serializeDocument({}, 更正正文输入)
        const 候选字段 = ['事实变更', '时间线变更', '账本变更', '记忆候选'] as const
        const optionalText = (field: string) => String(args[field] ?? '').trim() ? String(args[field]) : null
        const request = {
          更正后正文: 更正正文输入,
          更正后章摘要: optionalText('更正后章摘要'),
          提案编号: args['提案编号'] === undefined ? null : String(args['提案编号']),
          摘要: String(args['摘要'] ?? '吃书补偿').trim(),
          ...Object.fromEntries(候选字段.map(field => [field, optionalText(field)])),
        }
        const approvalFiles = [paths.定稿章(key.卷, key.章, key.章名), paths.章摘要(key.卷, key.章, key.章名), paths.契约(),
          ...(候选字段.some(field => optionalText(field) !== null) ? ['世界书', '账本', '本书记忆'] : [])]
        const before = captureApprovalFiles(bookRoot, approvalFiles, args)
        if (!before.ok) return before
        const decision = await askAuthor(deps.askFn, '吃书补偿', { 范围: `定稿/卷${key.卷.toString().padStart(2, '0')}/${key.章名}` }, { agent: sessionContext?.agent, signal: sessionContext?.signal })
        if (!decision.ok) return { ok: false, reason: `未获作者批准: ${decision.reason}` }
        if (sessionContext?.signal?.aborted) return { ok: false, reason: '作者裁决已取消（ASK_ABORTED）' }
        if (decision.决定 !== '已批准') return { ok: false, reason: `作者${decision.决定}，拒绝补偿执行` }

        return withBookWrite(bookRoot, () => {
        if (sessionContext?.signal?.aborted) return { ok: false, reason: '作者裁决已取消（ASK_ABORTED）' }
        const currentBook = resolveBook(args, sessionContext)
        if (!currentBook.ok || currentBook.bookRoot !== bookRoot) return { ok: false, reason: '等待作者裁决期间书id或归属已变化，请核对书目后重新呈报' }
        const current = captureApprovalFiles(bookRoot, approvalFiles, args)
        if (!current.ok || current.fingerprint !== before.fingerprint) return { ok: false, reason: '待补偿内容在等待作者裁决期间已变化，请重新呈报作者裁决' }
        const 定稿相对 = paths.定稿章(key.卷, key.章, key.章名)
        const res = archiveRetconRequest({ bookRoot, chapter: 定稿相对, request, provenance: provenanceOf(sessionContext) }, plannedPackageDir => {
        let 更正后全文: string
        try {
          const src = fs.readFileSync(nodePath.join(bookRoot, 定稿相对), 'utf-8')
          const doc = parseDocument(src)
          if (!doc.ok) return { ok: false, reason: `定稿章解析失败:${doc.detail}` }
          const parent = extractVersionFields(doc.data.fields).版本
          const baseVer = parent === null ? initialVersion('吃书补偿') : bumpVersion(parent, '吃书补偿')
          const fields = applyVersionFields(
            { ...doc.data.fields, 选定: true },
            { ...baseVer, 生成模块: '吃书补偿', ...(args['提案编号'] === undefined ? {} : { 来源快照: { 补偿: String(args['提案编号']) } }) },
          )
          更正后全文 = serializeDocument(fields, 更正正文输入, 草稿字段序)
        } catch (err) {
          return { ok: false, reason: `定稿章读取失败: ${err instanceof Error ? err.message : String(err)}` }
        }

        // 沉淀候选（可选）：写入补偿包目录，走 planSettlement 整条更正既有条目
        let packageDir: string | undefined
        const has候选 = 候选字段.some(f => optionalText(f) !== null)
        if (has候选) {
          const 包相对 = plannedPackageDir
          const 包绝对 = nodePath.join(bookRoot, 包相对)
          const 候选文件: Record<string, string> = {
            事实变更: '事实变更.md', 时间线变更: '时间线变更.md', 账本变更: '账本变更.md', 记忆候选: '本书层记忆候选.md',
          }
          const contents = new Map(候选字段.flatMap(f => {
            const value = optionalText(f)
            return value === null ? [] : [[候选文件[f]!, value] as const]
          }))
          // A failed pre-write attempt may have prepared this package. Reuse only exact
          // ordinary files; never overwrite an unknown or author-edited candidate.
          if (fs.existsSync(包绝对)) {
            for (const name of fs.readdirSync(包绝对)) {
              const file = nodePath.join(包绝对, name)
              const stat = fs.lstatSync(file)
              if (!contents.has(name) || !stat.isFile() || stat.isSymbolicLink() || fs.readFileSync(file, 'utf8') !== contents.get(name)) {
                return { ok: false, reason: '补偿包候选冲突，已保留，请核对后处理' }
              }
            }
          }
          fs.mkdirSync(包绝对, { recursive: true })
          for (const [name, value] of contents) {
            const file = nodePath.join(包绝对, name)
            if (!fs.existsSync(file)) fs.writeFileSync(file, value, { encoding: 'utf8', flag: 'wx' })
          }
          packageDir = 包相对
        }

        try {
          // F3:补偿事件记录与本次 retcon 同一提交(不再提交后另写)
          const event = retconEventOps(bookRoot, {
            ...(args['提案编号'] === undefined ? {} : { 提案编号: String(args['提案编号']) }),
            受影响工件: [定稿相对],
            卷: key.卷,
            账本留痕: `吃书补偿：${request.摘要}`,
            摘要: request.摘要,
          })
          const retconFiles: Array<{ 目标: string; 内容: string }> = [
            { 目标: 定稿相对, 内容: 更正后全文 },
            { 目标: event.relPath, 内容: event.content },
          ]
          // F3:章摘要随 retcon 同提交——传更正后摘要则整件更新,未传则加失效标记(不冒充已更新)
          const 摘要相对 = paths.章摘要(key.卷, key.章, key.章名)
          if (request.更正后章摘要 !== null) {
            retconFiles.push({ 目标: 摘要相对, 内容: request.更正后章摘要 })
          } else {
            try {
              const 摘要现文 = fs.readFileSync(nodePath.join(bookRoot, 摘要相对), 'utf-8')
              retconFiles.push({
                目标: 摘要相对,
                内容: `> 〔摘要过期〕定稿正文已经吃书补偿更正,本摘要待重做(关联提案 ${String(args['提案编号'] ?? '（未登记）')})

${摘要现文}`,
              })
            } catch { /* 无章摘要文件则无失效动作 */ }
          }
          return {
            bookRoot,
            ...(packageDir === undefined ? {} : { packageDir }),
            files: retconFiles,
            summary: request.摘要,
            settlement: { 章节: key, 批准: true, 裁决记录: `作者于 ${new Date().toISOString()} 批准吃书补偿（kind=${decision.kind}, 决定=${decision.决定}）` },
            provenance: provenanceOf(sessionContext),
          }
        } catch (err) {
          return { ok: false, reason: `吃书补偿失败: ${err instanceof Error ? err.message : String(err)}` }
        }
        })
        if (!res.ok) return { ok: false, reason: res.reason }
        return {
          ok: true,
          dests: res.dests,
          补偿事件: res.dests.find(dest => dest.includes('/补偿/')) ?? '（随 retcon: 提交留痕）',
          message: `吃书补偿完成（${res.message}）。补偿事件记录随本次 retcon: 提交留痕。受影响未定稿下游须同批整改（确认类工具「批次文件」）。`,
        }
        }, provenanceOf(sessionContext))
      },
    },
  ]
}
