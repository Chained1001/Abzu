/**
 * 主 Agent 专用 Tools（方案 A：core 能力结构化包装为 Tool）。
 *
 * 供主管 Agent 显式调用，严格保证不变量、路径解析与状态跃迁：
 * - novel_create_book: 建书立项（带构想完整度校验 N2）
 * - novel_update_contract: 安全更新作品契约分部（防 N1 抹除）；分部「已确认」时随确认产生 design: 提交
 * - novel_seed_min_design: 测试/走查专用（默认不注册，见 NOVEL_TEST_TOOL_NAMES）：注入占位设计骨架；成功后整批一次 design: 提交
 * - novel_get_story_status: 获取全书/章节真源推导状态（N4）
 * - novel_select_book: 显式切换当前会话正在写的书
 * - novel_prepare_pack: 组装待定稿包七件（定稿准备，呈作者裁决前）
 * - novel_settle_chapter: 作者批准后定稿原子沉淀（ch: 单次 Git 提交，不变量 1/6）
 * - novel_new_outline_draft / novel_confirm_outline: 候选细纲落草稿区 / 确认落真源（design(chNNNN): 整批提交）
 * - novel_update_skeleton / novel_update_volume_layout: 故事骨架 / 分卷布局更新（design: 整批提交）
 * - novel_confirm_worldbook_entry / novel_confirm_volume_outline: 世界书条目 / 卷纲与计划时间线确认（design: 整批提交）
 * - novel_roll_window: 近期窗口追加条目 / 标记已消费（design: 提交）
 * - novel_assemble_materials: 组装材料包（幂等重建；readiness 播报）
 * - novel_apply_revision: 作者口述的一处小改（改稿小修快路，带补丁产新稿，不带只记处置）
 * - novel_apply_revision_batch: 处置批落实（改稿主路：一次写新稿并回写全部处置）
 * - novel_import_draft: 作者稿导入（作者手写/作者手改，与 AI 稿地位相同）
 * - novel_record_review_findings: 隔离子 Agent 发现项回写（堵空审通过；「作者意见」模块同此通道）
 * - novel_record_memory: 作者层记忆写入（书房，一事一文件＋索引同步；不进书仓 git）
 * - novel_record_proposal / novel_resolve_proposal: 提案登记（acquisition）与裁决回写（S4）
 * - novel_apply_retcon: 吃书补偿执行（emission，必过作者裁决；retcon: 提交＋补偿事件留痕，S4）
 * - novel_editor_suggest: 回复书房编辑器请求，只把结果交回编辑器，不写文件
 *
 * 提交点纪律（拍板 1/7）：提交由写入器服务（受信代码）执行，模型不碰 git；
 * 裁决点仍只有定稿入档与吃书补偿，设计侧确认走 design:（幂等可重放）。
 */

import { withBookWrite, withBookWriteAsync } from '@abzu/core'
import { validateJsonSchemaValue, type JsonSchemaNode } from '@deepseek-ai/dsh-tools'
import { NATIVE_DESIGN_TOOLS } from '../design-commit-result'

import { REFERENCE_TOOL_NAMES } from '../reference/tools'
import { createReferenceToolSet } from './reference-tools'
import { createDesignTools } from './design-tools'
import { createOutlineTools } from './outline-tools'
import { createDraftingTools } from './drafting-tools'
import { createReviewTools } from './review-tools'
import { createRevisionTools } from './revision-tools'
import { createSettleTools } from './settle-tools'
import { createToolShared, provenanceOf, type NovelToolDefinition, type NovelToolsDeps, type ToolExecContext } from './shared'

// 公共类型经聚合口再导出：外部 import './novel-tools'（兼容薄壳）拿到的类型面不变。
export type { AgentLike, ToolExecContext, NovelToolDefinition, NovelToolsDeps } from './shared'

/**
 * 小说工具名单一事实来源（dsh 运行时对齐批）：作者环境下主 Agent scoped 注册的全集。
 * 一致性由测试保证：本表与 `createNovelTools(stub).map(t => t.name)` 逐项相等。
 */
export const NOVEL_TOOL_NAMES: readonly string[] = [
  ...REFERENCE_TOOL_NAMES,
  'novel_select_book',
  'novel_create_book',
  'novel_update_contract',
  'novel_get_story_status',
  'novel_search_finalized',
  'novel_index_manage',
  'novel_prepare_pack',
  'novel_settle_chapter',
  'novel_new_outline_draft',
  'novel_confirm_outline',
  'novel_update_skeleton',
  'novel_update_volume_layout',
  'novel_roll_window',
  'novel_confirm_worldbook_entry',
  'novel_confirm_volume_outline',
  'novel_assemble_materials',
  'novel_apply_revision',
  'novel_apply_revision_batch',
  'novel_import_draft',
  'novel_record_review_findings',
  'novel_record_proposal',
  'novel_resolve_proposal',
  'novel_apply_retcon',
  'novel_record_memory',
  'novel_note_pending',
  'novel_get_book_progress',
  'novel_editor_suggest',
]

/**
 * 测试/走查专用工具：只在 `deps.testTools` 为真时注册，不进 NOVEL_TOOL_NAMES。
 * seed 只写占位确认态（各部只有「已确认」标注、没有正文），不得作为作者的开写入口。
 */
export const NOVEL_TEST_TOOL_NAMES: readonly string[] = ['novel_seed_min_design']

/**
 * 统一入参校验（P2-2）：execute 前先按各工具声明的 parameters 过一遍 JSON Schema
 * 校验器（复用 dsh-tools 的 validateJsonSchemaValue，覆盖 required/type/enum/const/
 * oneOf/additionalProperties 等关键字），违规即拒并点名参数与问题。reference 四件与
 * editor_suggest 自带的内部分支校验不豁免——双验无害，注册面单源统一。
 * schema 之外的语义校验（章键正整数、状态词表、边界值等）仍由各工具与 core 兜底，
 * 一字不动；schema 子集外的注记关键字（minimum/pattern）校验器按注记忽略。
 */
function withInputValidation(tool: NovelToolDefinition): NovelToolDefinition {
  return {
    ...tool,
    execute: (args: Record<string, unknown>, sessionContext?: ToolExecContext) => {
      const violations = validateJsonSchemaValue(tool.parameters as JsonSchemaNode, args, 'args')
      if (violations.length > 0) {
        return { ok: false, code: 'invalid-args', reason: `工具参数不完整或格式错误（${tool.name}）：${violations.join('；')}——请对照工具参数声明修正后重试` }
      }
      return tool.execute(args, sessionContext)
    },
  }
}

export function createNovelTools(deps: NovelToolsDeps): NovelToolDefinition[] {
  const shared = createToolShared(deps)
  // 域文件按域分组收集，注册顺序按 NOVEL_TOOL_NAMES 还原（novel-tools.spec 钉死逐项相等）；
  // 名单外工具（测试专用 seed）不在名单内，保持收集序。
  const rank = new Map(NOVEL_TOOL_NAMES.map((name, i) => [name, i]))
  const tools: NovelToolDefinition[] = [
    ...createReferenceToolSet(shared),
    ...createDesignTools(shared),
    ...createOutlineTools(shared),
    ...createDraftingTools(shared),
    ...createReviewTools(shared),
    ...createRevisionTools(shared),
    ...createSettleTools(shared),
  ]
    .map((tool, order) => ({ tool, order }))
    .sort((a, b) => {
      const ra = rank.get(a.tool.name)
      const rb = rank.get(b.tool.name)
      if (ra === undefined || rb === undefined) return a.order - b.order
      return ra - rb
    })
    .map((entry) => entry.tool)

  // Tool calls are the product write boundary. Keep the read-modify-write
  // portion of synchronous mutations under the same book lock that protects
  // the final atomic file replacement. Approval tools remain async and take
  // their lock in the final write services after the author decision.
  const locked = new Set([
    'novel_new_outline_draft', 'novel_prepare_pack',
    'novel_update_contract', 'novel_seed_min_design', 'novel_confirm_outline',
    'novel_update_skeleton', 'novel_update_volume_layout', 'novel_roll_window',
    'novel_confirm_worldbook_entry', 'novel_confirm_volume_outline',
    'novel_assemble_materials', 'novel_apply_revision', 'novel_apply_revision_batch',
    'novel_import_draft', 'novel_record_review_findings', 'novel_record_proposal',
    'novel_resolve_proposal', 'novel_note_pending',
  ])
  const nativeTools = NATIVE_DESIGN_TOOLS
  const registered = deps.testTools === true ? tools : tools.filter((tool) => !NOVEL_TEST_TOOL_NAMES.includes(tool.name))
  // 入参校验包在最外层：schema 违规在拿书锁之前就拒（纯 CPU 检查不必进 withBookWrite）。
  return registered.map((tool) => {
    if (!locked.has(tool.name)) return tool
    return {
      ...tool,
      execute: (args: Record<string, unknown>, sessionContext?: ToolExecContext) => {
        const bookId = args['bookId'] === undefined ? '' : String(args['bookId']).trim()
        const root = bookId === '' ? undefined : deps.bookRootOfBookId(bookId, sessionContext?.agent)
        if (root === undefined) return tool.execute(args, sessionContext)
        try {
          if (nativeTools.has(tool.name)) {
            return withBookWriteAsync(root, async () => tool.execute(args, sessionContext), provenanceOf(sessionContext))
              .catch((error: unknown) => ({ ok: false, reason: error instanceof Error ? error.message : String(error) }))
          }
          return withBookWrite(root, () => tool.execute(args, sessionContext), provenanceOf(sessionContext))
        } catch (error) {
          return { ok: false, reason: error instanceof Error ? error.message : String(error) }
        }
      },
    }
  }).map(withInputValidation)
}
