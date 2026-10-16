/**
 * 设计域工具：书架选书/建书/契约分部/占位设计（测试）/骨架/分卷/近期窗口/世界书/卷纲/待补便签/进度卡。
 */
import { dispositionMentions, finishDesignCommit, provenanceOf, type NovelToolDefinition, type ToolShared } from './shared'
import { checkCommitPath, commitConfirmed, createBook, listBookMemoryEntries, parseWindow, paths, reconcileLedger, renderBookProgress, scanDesignDetail, selectCurrentVolume, writePending, windowExtraLines, WINDOW_ENTRY_STATES, seedMinDesign, prepareSkeleton, prepareVolumeLayout, prepareContract, prepareEntry, ensureModulesDeclared, preparePlanTimeline, prepareRecentWindow, prepareVolumeOutline, prepareVolumeSummary, volumeOutlineGaps, type Concept, type ContractParts, type ContractPartState, lastCommitOf, type LastCommitResult } from '@abzu/core'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { bookMemoryCatalogText, progressLineOf, renderCurrentBook } from '../status-context'
import { DESIGN_COMMIT_FIELDS, designCommitResult } from '../design-commit-result'
import { scanBooks } from '../bookshelf'

export function createDesignTools(shared: ToolShared): NovelToolDefinition[] {
  const { deps, writeNative, resolveBook } = shared
  return [
    {
      name: 'novel_select_book',
      description: '核对作者在对话中指定的小说，返回书id、书名、书仓近况与该书记忆目录快照，供后续调用使用。首次明确选书和作者切书时调用。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书仓的唯一标识（如 b-123abc）或书名' },
        },
        required: ['bookId'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            bookId: { type: 'string' },
            bookName: { type: 'string' },
            近况: { type: 'string' },
            记忆目录: { type: 'string', description: '该书本书记忆目录的选书时快照（名称、一句话描述、文件位置；正文不含）' },
            message: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: (args, sessionContext) => {
        const root = deps.workspaceRoot(sessionContext?.agent)
        if (root === undefined) return { ok: false, reason: '工作范围未就绪（未装机）' }
        const books = scanBooks(root)
        const target = String(args['bookId']).trim()
        const matches = books.filter((b) => b.bookId === target || b.name === target)
        const matched = matches[0]
        if (matches.length > 1 || matched?.bookId && books.filter(b => b.bookId === matched.bookId).length > 1) {
          return { ok: false, reason: `书目或书id不唯一：${target}，请先核对重复书仓；不会自动选择或改写书id` }
        }
        if (!matched || !matched.bookId) {
          return {
            ok: false,
            reason: `未找到匹配的书目：${target}。当前可用书目：${books.map((b) => `《${b.name}》（${b.bookId}）`).join(', ') || '无'}`,
          }
        }
        const 近况 = progressLineOf(matched.root)
        return {
          ok: true,
          bookId: matched.bookId,
          bookName: matched.name,
          近况,
          记忆目录: bookMemoryCatalogText(matched.root),
          message: renderCurrentBook(matched.name, matched.bookId, 近况),
        }
      },
    },
    {
      name: 'novel_create_book',
      description: '新建一部长篇小说并初始化规范书仓。前置要求：七个构想字段齐全、核心创意与题材目标读者明确，其余可留白；作者已确认立项。',
      parameters: {
        type: 'object',
        properties: {
          bookName: { type: 'string', description: '小说书名（不可含路径字符与保留字）' },
          concept: {
            type: 'object',
            description: '作品构想七要素（状态必须为已确认）',
            properties: {
              状态: { type: 'string', enum: ['已确认'], description: '必须为已确认' },
              核心创意: { type: 'string' },
              题材与目标读者: { type: 'string' },
              主角核心欲望: { type: 'string', description: '可留白（缺省视同留白）' },
              主要冲突: { type: 'string', description: '可留白（缺省视同留白）' },
              核心看点: { type: 'string', description: '可留白（缺省视同留白）' },
              差异化方向: { type: 'string', description: '可留白（缺省视同留白）' },
              明确不要什么: { type: 'string', description: '可留白（缺省视同留白）' },
            },
            // 与 core 实际口径对齐（P2-2 schema 过查修正）：构想必填只有 核心创意/题材与目标读者，
            // 其余五要素可留白（缺省视同留白）；原先把八项全列 required 比实现更严，统一校验后
            // 会误拒合法的部分构想建书（novel-tools 既有测试即部分构想）。core 兜底不动。
            required: ['状态', '核心创意', '题材与目标读者'],
          },
        },
        required: ['bookName', 'concept'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            bookId: { type: 'string', description: '新建书仓的书id' },
            bookRoot: { type: 'string', description: '书仓绝对路径' },
            commit: { type: 'string', description: '建书首提交哈希' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: (args, sessionContext) => {
        const root = deps.workspaceRoot(sessionContext?.agent)
        if (root === undefined) return { ok: false, reason: '工作范围未就绪（未装机）' }
        const bookName = String(args['bookName']).trim()
        const concept = args['concept'] as Concept
        const res = createBook({ workspaceRoot: root, 书名: bookName, concept })
        // 裁决 12：建书后不自动切书，由模型显式调 novel_select_book
        return res
      },
    },
    {
      name: 'novel_update_contract',
      description: '更新当前小说的作品契约分部（如题材与读者定位、核心看点与差异化等）。会自动保留书id与未修改分部。分部置为「已确认」即作者确认，随确认产生 design: 提交；暂定/留白不产生提交。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          partName: {
            type: 'string',
            enum: [
              '题材与读者定位',
              '核心看点与差异化',
              '阅读体验与情绪承诺',
              '主角原则与关系边界',
              '叙事方式与文风基调',
              '创作禁区与不可妥协项',
            ],
            description: '契约分部名称',
          },
          state: { type: 'string', enum: ['已确认', '暂定', '留白'], description: '分部确认状态' },
          content: { type: 'string', description: '该分部的详细设定文本。阅读体验与情绪承诺可含三级子节「章节篇幅」，其下只写三项列表：目标汉字数、下限汉字数、上限汉字数；正整数且下限≤目标≤上限。不写该子节时沿用契约中已有的篇幅约定（要改就完整写出整个子节）。' },
          summary: { type: 'string', description: '提交摘要（可选，如「契约·核心看点」；缺省用分部名）' },
        },
        required: ['bookId', 'partName', 'state', 'content'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const bookRoot = book.bookRoot
        const bookId = String(args['bookId']).trim()
        const partName = args['partName'] as any
        const state = args['state'] as ContractPartState
        const content = String(args['content'])
        const parts: ContractParts = {
          [partName]: { state, body: content },
        }
        // C-01 定稿：篇幅子节只在 core 侧保留，调用侧不回填（两处各自拼接＝双保险变双风险，
        // 还会覆盖模型的显式改动）。这里只比较入参与结果、回报「发生过保留」，让模型知道本次没动旧篇幅。
        let lengthPreserved = false
        try {
          const op = prepareContract(bookRoot, parts)
          lengthPreserved = partName === '阅读体验与情绪承诺'
            && !/###\s+章节篇幅/.test(content) && /###\s+章节篇幅/.test(op.content)
          await writeNative(bookRoot, op, sessionContext)
        } catch (err) {
          return { ok: false, reason: `更新契约失败: ${err instanceof Error ? err.message : String(err)}` }
        }
        const lengthNote = lengthPreserved
          ? '本次未写「章节篇幅」子节，已沿用契约中旧的篇幅约定；要改就完整写出目标汉字数、下限汉字数、上限汉字数三项。'
          : ''
        // 提交点跟随作者确认（拍板 1）：只有已确认态产生 design: 提交；暂定/留白只写文件。
        if (state !== '已确认') {
          return { ok: true, commitState: 'not-required', retryable: false, message: `已完成《${bookId}》契约【${partName}】更新，状态为〔${state}〕，无需提交，不要为补提交重复调用。${lengthNote}` }
        }
        const summary = args['summary'] !== undefined ? String(args['summary']).trim() : `契约·${partName}`
        const commit = commitConfirmed({
          bookRoot,
          paths: [paths.契约()],
          prefix: 'design',
          summary,
          provenance: provenanceOf(sessionContext, [paths.契约()]),
        })
        const result = designCommitResult(commit, `契约【${partName}】`, args, sessionContext)
        return lengthNote !== '' && result.ok ? { ...result, message: `${result.message}${lengthNote}` } : result
      },
    },
    {
      name: 'novel_seed_min_design',
      description: '【测试/走查专用】为测试书一键写入占位设计（各部只有「已确认」标注、没有正文），用于验证空内容与模板待核对提示，不代表开写就绪；不得用于作者的书。成功后整批一次 design: 提交；重跑幂等（已提交过则无改动、不重复提交）。',
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
        const bookRoot = book.bookRoot
        const bookId = args['bookId'] ? String(args['bookId']).trim() : undefined
        if (!bookId) return { ok: false, reason: '未指定 bookId' }
        try {
          seedMinDesign(bookRoot)
        } catch (err) {
          return { ok: false, reason: `初始化最小设计失败: ${err instanceof Error ? err.message : String(err)}` }
        }
        // 整批一次提交（拍板 7）：seed 写入的全部设计侧工件随本次确认一并入 git。
        const 卷 = 1
        const seedPaths = [
          paths.契约(),
          '世界书/模块声明.md',
          '世界书/人物档案/主角.md',
          '世界书/世界规则/基础规则.md',
          '大纲/故事骨架.md',
          '大纲/分卷布局.md',
          paths.卷纲(卷),
          paths.计划时间线(卷),
          paths.近期窗口(卷),
        ].filter((p) => fs.existsSync(nodePath.join(bookRoot, p)))
        const commit = commitConfirmed({ bookRoot, paths: seedPaths, prefix: 'design', summary: '最小设计骨架', provenance: provenanceOf(sessionContext, seedPaths) })
        if (!commit.ok) {
          return { ok: false, reason: `最小设计已写入但提交失败（重跑本工具即可补提交）：${commit.reason}` }
        }
        return {
          ok: true,
          message: commit.noChanges === true
            ? '测试占位设计已存在（本次无改动，未产生新提交）；仍需真实设计内容，不能据此判断开写就绪。'
            : `测试占位设计已写入；仍需真实设计内容，不能据此判断开写就绪。（${commit.message}）`,
        }
      },
    },
    {
      name: 'novel_update_skeleton',
      description: '更新故事骨架（真源，覆盖式写入，再确认版本+1）。随确认产生 design: 提交；提案批次整批文件经「批次文件」一并入提交。影响面先经影响分析呈报、作者裁决后同批整改再整批确认。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          正文: { type: 'string', description: '骨架九部完整结构及状态标注；前两部确认当前追求与阻力，其余可暂定/留白，不强填终局；空的已确认部分仍报缺内容' },
          summary: { type: 'string', description: '提交摘要（可选）' },
          批次文件: { type: 'array', items: { type: 'string' }, description: '同批整改的受影响未定稿下游文件' },
        },
        required: ['bookId', '正文'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '真源相对路径' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        try {
          const w = prepareSkeleton(book.bookRoot, String(args['正文']))
          await writeNative(book.bookRoot, w, sessionContext)
          return finishDesignCommit(book.bookRoot, [w.relPath], args, '故事骨架', null, sessionContext)
        } catch (err) {
          return { ok: false, reason: `更新故事骨架失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_update_volume_layout',
      description: '更新分卷布局（真源，覆盖式写入，再确认版本+1）。随确认产生 design: 提交；提案批次整批文件经「批次文件」一并入提交。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          正文: { type: 'string', description: '分卷布局完整正文（Markdown）' },
          summary: { type: 'string', description: '提交摘要（可选）' },
          批次文件: { type: 'array', items: { type: 'string' }, description: '同批整改的受影响未定稿下游文件' },
        },
        required: ['bookId', '正文'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '真源相对路径' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        try {
          const w = prepareVolumeLayout(book.bookRoot, String(args['正文']))
          await writeNative(book.bookRoot, w, sessionContext)
          return finishDesignCommit(book.bookRoot, [w.relPath], args, '分卷布局', null, sessionContext)
        } catch (err) {
          return { ok: false, reason: `更新分卷布局失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_roll_window',
      description: '近期窗口滚动（真源）：追加新条目（状态默认「已确认」）或把既有条目标记「已消费」。随确认产生 design: 提交。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          action: { type: 'string', enum: ['追加', '标已消费'], description: '追加新条目 / 把既有条目标已消费' },
          名称: { type: 'string', description: '窗口条目名称' },
          状态: { type: 'string', enum: [...WINDOW_ENTRY_STATES], description: '追加时的状态（可选，默认「已确认」；须取窗口条目词表：已确认/暂定/已消费/已失效/等待补设计）' },
          summary: { type: 'string', description: '提交摘要（可选）' },
          批次文件: { type: 'array', items: { type: 'string' }, description: '同批整改的受影响未定稿下游文件' },
        },
        required: ['bookId', '卷', 'action', '名称'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '真源相对路径' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const 卷 = Number(args['卷'])
        if (!Number.isSafeInteger(卷) || 卷 < 1) return { ok: false, reason: `卷必须是正整数（收到：${String(args['卷'] ?? '未传')}）` }
        const 名称 = String(args['名称']).trim()
        const action = String(args['action'])
        // 状态词表双重校验(schema enum 之外 execute 再拒一次):词表外的条目解析侧永远不认,静默写入等于丢失
        const 状态 = args['状态'] !== undefined ? String(args['状态']).trim() : '已确认'
        if (!(WINDOW_ENTRY_STATES as readonly string[]).includes(状态)) {
          return { ok: false, reason: `窗口条目状态「${状态}」不在词表内（合法值：${WINDOW_ENTRY_STATES.join('、')}）` }
        }
        try {
          const rel = paths.近期窗口(卷)
          let text = ''
          try {
            text = fs.readFileSync(nodePath.join(book.bookRoot, rel), 'utf-8')
          } catch (err) {
            const code = (err as NodeJS.ErrnoException).code
            // ENOENT＝窗口尚未建立,视作空窗口;其余错误码(EPERM/EBUSY/EISDIR…)必须整体失败——继续会把 items 当空窗口整体覆盖,既有条目全部丢失
            if (code !== 'ENOENT') throw new Error(`读取近期窗口失败（${code ?? '未知错误'}），拒绝滚动以免覆盖既有条目：${rel}`)
          }
          const items = parseWindow(text).map((e) => ({ 名称: e.name, 状态: e.state }))
          const 保留行 = windowExtraLines(text)
          if (action === '追加') {
            if (items.some((i) => i.名称 === 名称)) return { ok: false, reason: `窗口已有同名条目：${名称}` }
            items.push({ 名称, 状态 })
          } else {
            const hit = items.find((i) => i.名称 === 名称)
            if (hit === undefined) return { ok: false, reason: `窗口无条目「${名称}」，无法标已消费` }
            for (const i of items) if (i.名称 === 名称) i.状态 = '已消费'
          }
          await writeNative(book.bookRoot, prepareRecentWindow(卷, items, 保留行), sessionContext)
          return finishDesignCommit(book.bookRoot, [rel], args, `近期窗口·${action}`, null, sessionContext)
        } catch (err) {
          return { ok: false, reason: `窗口滚动失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_confirm_worldbook_entry',
      description: '写入/确认世界书条目（真源）。随确认产生 design: 提交；提案批次整批文件经「批次文件」一并入提交。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          模块: { type: 'string', description: '世界书模块名（如 人物档案）' },
          名称: { type: 'string', description: '条目名（如 主角）' },
          类型: { type: 'string', description: '条目类型（如 人物/规则/地点）' },
          性质: { type: 'string', description: '计划/已成事实' },
          状态: { type: 'string', description: '状态取自计划族词表（如 已确认）' },
          来源: { type: 'string', description: '来源（如 对谈共创 或 来源引用行）' },
          正文: { type: 'string', description: '条目正文（可选）' },
          summary: { type: 'string', description: '提交摘要（可选）' },
          批次文件: { type: 'array', items: { type: 'string' }, description: '同批整改的受影响未定稿下游文件' },
        },
        required: ['bookId', '模块', '名称', '类型', '性质', '状态', '来源'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '条目真源相对路径' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const 模块 = String(args['模块']).trim()
        const 名称 = String(args['名称']).trim()
        try {
          const op = prepareEntry(模块, 名称, {
            类型: String(args['类型']).trim(),
            性质: String(args['性质']).trim(),
            状态: String(args['状态']).trim(),
            来源: String(args['来源']).trim(),
            正文: args['正文'] === undefined ? undefined : String(args['正文']),
          })
          await writeNative(book.bookRoot, op, sessionContext)
          ensureModulesDeclared(book.bookRoot, [模块])
          return finishDesignCommit(book.bookRoot, [op.relPath, '世界书/模块声明.md'], args, `世界书条目·${名称}`, null, sessionContext)
        } catch (err) {
          return { ok: false, reason: `写入世界书条目失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_confirm_volume_outline',
      description: '确认当前卷规划（卷纲或计划时间线，真源）或卷摘要（卷末复盘后经候选确认落盘，真源）。随确认产生 design: 提交；提案批次整批文件经「批次文件」一并入提交。卷摘要沿用版本协议：首次 v1、正文变化 +1、原样重跑复用版本。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          目标: { type: 'string', enum: ['卷纲', '计划时间线', '卷摘要'], description: '写哪一件' },
          正文: { type: 'string', description: '完整正文（Markdown）' },
          summary: { type: 'string', description: '提交摘要（可选）' },
          批次文件: { type: 'array', items: { type: 'string' }, description: '同批整改的受影响未定稿下游文件' },
        },
        required: ['bookId', '卷', '目标', '正文'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '卷大纲真源相对路径' },
            gaps: { type: 'array', description: '卷纲段落缺口' },
            message: { type: 'string', description: '结果说明' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: async (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        const 卷 = Number(args['卷'])
        if (!Number.isSafeInteger(卷) || 卷 < 1) return { ok: false, reason: `卷必须是正整数（收到：${String(args['卷'] ?? '未传')}）` }
        const 目标 = String(args['目标'])
        try {
          const rel = 目标 === '卷纲' ? paths.卷纲(卷) : 目标 === '卷摘要' ? paths.卷摘要(卷) : paths.计划时间线(卷)
          if (目标 === '卷纲') {
            const 正文 = String(args['正文'])
            const gaps = volumeOutlineGaps(正文)
            if (gaps.length > 0) return { ok: false, reason: gaps.join(';'), gaps }
            await writeNative(book.bookRoot, prepareVolumeOutline(卷, 正文), sessionContext)
          }
          else if (目标 === '卷摘要') await writeNative(book.bookRoot, prepareVolumeSummary(book.bookRoot, 卷, String(args['正文'])), sessionContext)
          else await writeNative(book.bookRoot, preparePlanTimeline(卷, String(args['正文'])), sessionContext)
          return finishDesignCommit(book.bookRoot, [rel], args, `${目标}·卷${String(卷).padStart(2, '0')}`, null, sessionContext)
        } catch (err) {
          return { ok: false, reason: `确认${目标}失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_note_pending',
      description: '写/清「待补便签」（真源工件分节内的 待补： 行——只有算不出来的才落盘）。文本缺省为空＝清除该节便签。写后随 design: 提交。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          relPath: { type: 'string', description: '书仓内真源工件相对路径（如 大纲/故事骨架.md）' },
          节名: { type: 'string', description: '分节/条目名（如 线索悬念伏笔）' },
          文本: { type: 'string', description: '便签内容（缺省/空＝清除该节便签）' },
          summary: { type: 'string', description: '提交摘要（可选）' },
        },
        required: ['bookId', 'relPath', '节名'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '落便签的真源相对路径' },
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
        const relPath = String(args['relPath']).trim().replace(/\\/g, '/')
        // 读侧探测信道预校验（P2-5）：与 commit 路径同形——穿越段（..）、书仓外与
        // 知识库/配置域顶层在进 core 读取之前就拒，不给「工件不存在/没有分节」的差异
        // 报文当存在性探针。core 侧 writePending 的真源顶层约束不动。
        const pathCheck = checkCommitPath(book.bookRoot, relPath)
        if (!pathCheck.ok) return { ok: false, reason: `待补便签路径非法（${pathCheck.reason}）：${relPath}` }
        const 节名 = String(args['节名']).trim()
        const 文本 = args['文本'] === undefined || String(args['文本']).trim() === '' ? null : String(args['文本']).trim()
        try {
          const r = writePending(book.bookRoot, pathCheck.relPath, 节名, 文本)
          if (!r.ok) return { ok: false, reason: r.reason }
          const commit = commitConfirmed({
            bookRoot: book.bookRoot,
            paths: [pathCheck.relPath],
            prefix: 'design',
            summary: args['summary'] !== undefined ? String(args['summary']).trim() : `待补便签·${节名}`,
            provenance: provenanceOf(sessionContext, [pathCheck.relPath]),
          })
          if (!commit.ok) {
            return { ok: false, reason: `便签已写入但提交失败（已落盘但未提交，重跑本工具即可补提交）：${commit.reason}` }
          }
          return { ok: true, relPath: pathCheck.relPath, message: 文本 === null ? `已清除「${节名}」待补便签` : `已记待补便签（${节名}）：${文本}` }
        } catch (err) {
          return { ok: false, reason: `待补便签失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_get_book_progress',
      description: '查书级进度卡（现算，不进 context）：设计工件状态与待补便签、上次改动章号、世界书计数、章进度、近期窗口余量、本卷未决偏离。选完书后、动设计侧节点前该查。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（可选，默认当前卷）' },
        },
        required: ['bookId'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            渲染: { type: 'string', description: '书级进度卡渲染文本' },
            未决偏离: { type: 'array', description: '未经作者处置的偏离项' },
            待核对: { type: 'array', description: '章级计划待核对（可选；按章号关联同章事实供核对，同章任一事件不等于内容兑现）' },
            疑似占位待核对: {
              type: 'array',
              description: '疑似模板占位的计划项（可选；计划时间线仍是种子模板时整批转入待核对，不落未决偏离）',
              items: {
                type: 'object',
                properties: {
                  名称: { type: 'string' },
                  来源: { type: 'string' },
                  状态: { type: 'string' },
                  计划区段: { type: 'string' },
                },
              },
            },
            内容问题: {
              type: 'array',
              description: '设计工件内容问题清单',
              items: {
                type: 'object',
                properties: {
                  路径: { type: 'string' },
                  分部: { type: 'string' },
                  问题: { type: 'string', enum: ['缺少内容', '缺少分部', '状态冲突', '状态无效', '疑似模板占位'] },
                  阶段: { type: 'string', enum: ['灵感阶段', '作品定调', '世界构建', '故事骨架', '分卷布局', '当前卷规划', '开写就绪'] },
                },
                required: ['路径', '分部', '问题', '阶段'],
              },
            },
            卷: { type: 'number', description: '当前卷号' },
            规划卷: { type: 'number', description: '规划目标卷（可选；当前卷已证完成且无已确认窗口条目时给出）' },
            reason: { type: 'string', description: '失败原因' },
          },
          required: ['ok'],
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      execute: (args, sessionContext) => {
        const book = resolveBook(args, sessionContext)
        if (!book.ok) return book
        try {
          // 默认对账卷与选择器同一口径(任务21, B3):active 取该卷;planning 保留已完成卷并呈报规划目标;empty 默认1
          const selection = selectCurrentVolume(book.bookRoot)
          const 卷 = args['卷'] !== undefined
            ? Number(args['卷'])
            : selection.kind === 'active'
              ? selection.卷
              : selection.kind === 'planning'
                ? (selection.已完成卷 ?? selection.规划卷)
                : 1
          const detail = scanDesignDetail(book.bookRoot, 卷)
          const docPaths = [
            detail.契约.路径, detail.骨架.路径, detail.分卷.路径,
            ...detail.卷规划.flatMap((v) => [paths.卷纲(v.卷号), paths.计划时间线(v.卷号), paths.近期窗口(v.卷号)]),
          ]
          const history: Record<string, LastCommitResult> = {}
          for (const p of docPaths) {
            if (history[p] === undefined) history[p] = lastCommitOf(book.bookRoot, p)
          }
          // 未决偏离 = 对账偏离项 − 本书层记忆已处置条目(0.0.50 起记进 本书层记忆·决策,经定稿沉淀写入);
          // 短名按 dispositionMentions 的边界规则匹配,防子串误扣
          let 未决偏离: string[] = []
          let 待核对: { 名称: string; 章号: number; 本章事实: string[] }[] = []
          let 疑似占位待核对: { 名称: string; 来源: string }[] = []
          const recon = reconcileLedger(book.bookRoot, 卷)
          if (recon.ok) {
            const 偏离 = [...recon.report.计划未兑现, ...recon.report.事实未计划].map((item) => item.名称)
            const 处置文本 = listBookMemoryEntries(book.bookRoot)
              .filter((e) => e.类 === '决策')
              .map((e) => `${e.名称} ${e.描述 ?? ''} ${e.正文}`)
            未决偏离 = 偏离.filter((名) => !处置文本.some((text) => dispositionMentions(text, 名)))
            // 章级待核对单独计数呈报(任务21, B1):不进未决偏离;非空时不得呈报无偏离
            待核对 = recon.report.章级待核对.map((p) => ({ 名称: p.计划项.名称, 章号: p.章号, 本章事实: p.本章事实.map((f) => f.名称) }))
            疑似占位待核对 = [...(recon.report.疑似占位待核对 ?? [])]
          }
          const 渲染 = renderBookProgress(detail, history, 未决偏离, 待核对.length, 疑似占位待核对)
          return {
            ok: true,
            渲染,
            未决偏离,
            ...(待核对.length > 0 ? { 待核对 } : {}),
            ...(疑似占位待核对.length > 0 ? { 疑似占位待核对 } : {}),
            内容问题: detail.内容问题 ?? [],
            卷,
            ...(selection.kind === 'planning' ? { 规划卷: selection.规划卷 } : {}),
          }
        } catch (err) {
          return { ok: false, reason: `进度卡查询失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
  ]
}
