/**
 * 细纲域工具：细纲候选落草稿区/确认落真源/材料包组装。
 */
import { provenanceOf, type NovelToolDefinition, type ToolShared } from './shared'
import { assembleMaterials, commitConfirmed, confirmOutline, paths, reportDraftReadiness, writeCandidate, computeMaterials, type SupplementEdit } from '@abzu/core'
import { DESIGN_COMMIT_FIELDS } from '../design-commit-result'

export function createOutlineTools(shared: ToolShared): NovelToolDefinition[] {
  const { resolveBook, chapterKeyOf } = shared
  return [
    {
      name: 'novel_new_outline_draft',
      description: '在草稿区落一份候选细纲（空模板或带正文与来源引用）。候选属草稿区散文工件，可反复重写；确认落真源须走 novel_confirm_outline。空模板不含约束分级标记，确认前正文须自带至少一行〔硬〕/〔软〕/〔自由〕行内标记。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          正文: { type: 'string', description: '细纲正文（可选，缺省落空模板）' },
          来源引用: { type: 'array', items: { type: 'string' }, description: '来源引用行（可选）。合法形态：来源:<仓内相对路径>@<版本>（如 故事剧情/卷规划/卷01/卷纲.md@1）、来源:作者自定义、来源:对谈共创；锚点/行号/绝对路径无效' },
          章型: { type: 'string', description: '章型双轴（可选，建议填）。写法 <承诺档>·<情绪位>：承诺档 关键/过渡，情绪位 铺垫/高潮/余波/切换（两轴取值不重叠——情绪位不用「过渡」，改称「切换」），如「过渡·余波」「关键·高潮」；只写一轴亦可。落候选 frontmatter，供审读与润色取本章强度；不填只播报不拦，填了但无法识别则拒确认' },
        },
        required: ['bookId', '卷', '章名'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '候选细纲相对路径' },
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
        const 卷 = Number(args['卷'])
        const 章名 = String(args['章名'] ?? '').trim()
        if (!Number.isSafeInteger(卷) || 卷 < 1) return { ok: false, reason: `卷必须是正整数（收到：${String(args['卷'] ?? '未传')}）` }
        if (章名 === '') return { ok: false, reason: '章名不能为空（须与近期窗口条目逐字一致）' }
        try {
          const rel = writeCandidate(book.bookRoot, {
            卷,
            章名,
            body: args['正文'] === undefined ? undefined : String(args['正文']),
            来源引用: Array.isArray(args['来源引用']) ? (args['来源引用'] as unknown[]).map(String) : undefined,
            章型: args['章型'] === undefined ? undefined : String(args['章型']),
          })
          return { ok: true, relPath: rel, message: `候选细纲已落草稿区：${rel}。完成后调 novel_confirm_outline 确认。` }
        } catch (err) {
          return { ok: false, reason: `落候选细纲失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_confirm_outline',
      description: '确认章细纲落真源（含既有门槛校验；已有确认细纲再确认＝版本+1；真源已落位、候选已删时重跑＝幂等补提交）。随确认产生 design(chNNNN): 提交，提案批次整批文件经「批次文件」一并入提交。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          summary: { type: 'string', description: '提交摘要（可选，如「确认细纲·初见」）' },
          批次文件: { type: 'array', items: { type: 'string' }, description: '同批整改的受影响未定稿下游文件（提案批次整批确认）' },
        },
        required: ['bookId', '卷', '章', '章名'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ...DESIGN_COMMIT_FIELDS,
            ok: { type: 'boolean', description: '是否成功' },
            relPath: { type: 'string', description: '确认细纲真源相对路径' },
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
        const { 卷, 章, 章名 } = keyResult.key
        try {
          const r = confirmOutline(book.bookRoot, { 卷, 章, 章名 })
          if (!r.ok) return { ok: false, reason: r.gaps.join(';'), ...(r.播报 === undefined ? {} : { message: r.播报.join('；') }) }
          const batch = Array.isArray(args['批次文件']) ? (args['批次文件'] as unknown[]).map((v) => String(v).trim()).filter((v) => v !== '') : []
          const commit = commitConfirmed({
            bookRoot: book.bookRoot,
            paths: [paths.确认细纲(卷, 章, 章名), ...batch],
            prefix: 'design',
            summary: args['summary'] !== undefined ? String(args['summary']).trim() : `确认细纲·${章名}`,
            chapterScope: 章,
            provenance: provenanceOf(sessionContext, [paths.确认细纲(卷, 章, 章名), ...batch]),
          })
          if (!commit.ok) {
            return { ok: false, commitState: 'failed', retryable: true, reason: `细纲已确认落位但提交失败（已落盘但未提交，重跑本工具即可补提交）：${commit.reason}` }
          }
          return {
            ok: true,
            commitState: commit.noChanges === true ? 'unchanged' : 'committed',
            retryable: false,
            relPath: paths.确认细纲(卷, 章, 章名),
            message: commit.noChanges === true
              ? `细纲《${章名}》此前已确认（幂等重放，无改动未产生新提交）`
              : `细纲《${章名}》已确认落真源（${commit.message}）${r.播报 && r.播报.length > 0 ? `；播报：${r.播报.join('；')}` : ''}`,
          }
        } catch (err) {
          return { ok: false, reason: `确认细纲失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
    {
      name: 'novel_assemble_materials',
      description: '组装本章十段基础材料并保留已登记补充。补充先用模式=预览只读核对原文，取得来源读取哈希与材料清单哈希，再用模式=保存提交短引用。补充操作按稳定编号设置/移除，来源限当前书原文或同工作范围书房；索引不是证据。来源变化标过期，不自动替换旧摘录。返回就绪播报，是否开写由主控判断。',
      parameters: {
        type: 'object',
        properties: {
          bookId: { type: 'string', description: '书id（必填）' },
          卷: { type: 'number', description: '卷号（如 1）' },
          章: { type: 'number', description: '章号（全书连续，如 1）' },
          章名: { type: 'string', description: '章名（如 第一章）' },
          模式: { type: 'string', enum: ['预览', '保存'], description: '预览只读；保存按核对后的引用落盘；缺省保存' },
          材料清单哈希: { type: 'string', description: '预览返回的当前清单SHA-256；空字符串表示此前无清单，设置/移除时传入' },
          补充操作: {
            type: 'array', description: '显式设置或移除补充；省略时保留既有补充',
            items: {
              type: 'object', required: ['操作', '编号'], properties: {
                操作: { type: 'string', enum: ['设置', '移除'] },
                编号: { type: 'string', description: '稳定编号，如 memory-1，字母数字短横线下划线，最长64位' },
                标题: { type: 'string', description: '设置时必填，自由标题' },
                理由: { type: 'string', description: '设置时必填，本章为什么需要这段原文' },
                性质: { type: 'string', enum: ['原文', '建议'], description: '设置时必填，建议不作事实' },
                来源: {
                  type: 'object', required: ['域', '路径'], properties: {
                    域: { type: 'string', enum: ['本书', '书房'] },
                    路径: { type: 'string', description: '对应域内相对原文路径；书房示例 构想/<书名>.md；不能引用索引' },
                    起行: { type: 'integer', minimum: 1, description: '从1开始，省略从首行读' },
                    终行: { type: 'integer', minimum: 1, description: '包含该行；省略读到末行' },
                    读取哈希: { type: 'string', description: '预览自动返回；保存时原样带回，拒绝来源漂移' },
                  },
                },
              },
            },
          },
        },
        required: ['bookId', '卷', '章', '章名'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', description: '是否成功' },
            dir: { type: 'string', description: '材料包目录' },
            状态: { type: 'string', description: '材料包完整状态' },
            gaps: { type: 'array', description: '缺口清单' },
            readiness: { type: 'object', description: '开写就绪度报告' },
            材料清单哈希: { type: 'string', description: '预览时为当前清单哈希，保存时为写入后哈希' },
            合计字数: { type: 'number', description: '基础与补充材料合计字数' },
            补充预览: { type: 'array', description: '核对用原文及带来源读取哈希的操作；保存时只需回传操作，无需转录原文' },
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
        const { 卷, 章, 章名 } = keyResult.key
        try {
          const input = { 卷, 章, 章名,
            ...(Array.isArray(args['补充操作']) ? { 补充操作: args['补充操作'] as SupplementEdit[] } : {}),
            ...(typeof args['材料清单哈希'] === 'string' ? { 材料清单哈希: args['材料清单哈希'] } : {}),
          }
          if (args['模式'] === '预览') {
            const result = computeMaterials(book.bookRoot, { ...input, 仅预览: true })
            // 失败或空补充时可选字段缺席；工具返回值必须是无损 JSON，undefine 会被宿主拒收。
            return { ok: result.ok, dir: result.dir, 状态: result.状态, gaps: result.gaps,
              材料清单哈希: result.已有清单哈希 ?? '', 合计字数: result.合计字数 ?? 0, 补充预览: result.补充预览 ?? [],
              message: result.ok ? '材料预览未落盘。核对原文后，用返回的操作（含读取哈希）和材料清单哈希保存。' : `材料预览未完成：${result.gaps.join('；')}`,
            }
          }
          const res = assembleMaterials(book.bookRoot, input)
          if (!res.ok) return { ok: false, 状态: res.状态, gaps: res.gaps, 材料清单哈希: res.材料清单哈希 ?? '', reason: `材料包组装失败:${res.gaps.join(';')}` }
          const readiness = reportDraftReadiness(book.bookRoot, `${paths.草稿目录(卷, 章, 章名)}/`)
          return {
            ok: true,
            dir: res.dir,
            状态: res.状态,
            gaps: res.gaps,
            readiness,
            材料清单哈希: res.材料清单哈希, 合计字数: res.合计字数,
            message: `材料包已组装至 ${res.dir}（状态：${res.状态}${res.gaps.length > 0 ? `；缺:${res.gaps.join('、')}` : ''}）。${readiness?.说明 ?? ''}`,
          }
        } catch (err) {
          return { ok: false, reason: `组装材料包失败: ${err instanceof Error ? err.message : String(err)}` }
        }
      },
    },
  ]
}
