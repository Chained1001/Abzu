/**
 * 主 Agent 专用 Tools（方案 A：core 能力结构化包装为 Tool）。
 *
 * 供主管 Agent 显式调用，严格保证不变量、路径解析与状态跃迁：
 * - novel_create_book: 建书立项（带构想完整度校验 N2）
 * - novel_update_contract: 安全更新作品契约分部（防 N1 抹除）；分部「已确认」时随确认产生 design: 提交
 * - novel_seed_min_design: 测试/走查专用（默认不注册，见 NOVEL_TEST_TOOL_NAMES）：注入占位设计；成功后整批一次 design: 提交
 * - novel_get_story_status: 获取全书/章节真源推导状态（N4）
 * - novel_select_book: 显式切换当前会话正在写的书
 * - novel_prepare_pack: 组装待定稿包七件（定稿准备，呈作者裁决前）
 * - novel_settle_chapter: 作者批准后定稿原子沉淀（ch: 单次 Git 提交，不变量 1/6）
 * - novel_new_outline_draft / novel_confirm_outline: 候选细纲落草稿区 / 确认落真源（design(chNNNN): 整批提交）
 * - novel_update_full_outline / novel_update_volume_layout: 全书大纲 / 分卷布局更新（design: 整批提交）
 * - novel_confirm_worldbook_entry / novel_confirm_volume_outline: 世界书条目 / 卷纲与计划时间线确认（design: 整批提交）
 * - novel_roll_window: 近期窗口追加条目 / 标记已消费（design: 提交）
 * - novel_assemble_materials: 组装材料包（幂等重建；readiness 播报）
 * - novel_apply_revision: 作者口述的一处小改（改稿小修快路，带补丁产新稿，不带只记处置）
 * - novel_apply_revision_batch: 处置批落实（改稿主路：一次写新稿并回写全部处置）
 * - novel_import_draft: 作者稿导入（作者手写/作者手改，与 AI 稿地位相同）
 * - novel_record_review_findings: 隔离子 Agent 发现项回写（堵空审通过；「作者意见」模块同此通道）
 * - novel_record_polish: 审核通过后登记润色承接/跳过（0.0.54 润色后移批）
 * - novel_record_proposal / novel_resolve_proposal: 提案登记（acquisition）与裁决回写（S4）
 * - novel_apply_retcon: 吃书补偿执行（emission，必过作者裁决；retcon: 提交＋补偿事件留痕，S4）
 * - novel_editor_suggest: 回复书房编辑器请求，只把结果交回编辑器，不写文件
 *
 * 提交点纪律（拍板 1/7）：提交由写入器服务（受信代码）执行，模型不碰 git；
 * 裁决点仍只有定稿入档与吃书补偿，设计侧确认走 design:（幂等可重放）。
 */

import { withBookWrite, withBookWriteAsync } from '@abzu/core'
import { validateJsonSchemaValue, type JsonSchemaNode } from '@deepseek-ai/dsh-tools'

import { TOOL_SPECS, specOf, toolNamesOf } from '../tool-spec'
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
 * 作者环境下主 Agent scoped 注册的全集。**对本表的投影**，不再是独立字面量。
 *
 * 历史顺序保留在 `TOOL_SPECS` 的行序里，故本名单与 `createNovelTools(stub).map(t => t.name)`
 * 仍逐项相等（`novel-tools.spec` 钉死）。
 */
export const NOVEL_TOOL_NAMES: readonly string[] = toolNamesOf('author')

/**
 * 测试/走查专用工具：只在 `deps.testTools` 为真时注册，不进 NOVEL_TOOL_NAMES。
 * seed 只写占位确认态（各部只有「已确认」标注、没有正文），不得作为作者的开写入口。
 */
export const NOVEL_TEST_TOOL_NAMES: readonly string[] = toolNamesOf('test-only')

/**
 * 统一入参校验（P2-2）：execute 前先按各工具声明的 parameters 过一遍 JSON Schema
 * 校验器（复用 dsh-tools 的 validateJsonSchemaValue，覆盖 required/type/enum/const/
 * oneOf/additionalProperties 等关键字），违规即拒并点名参数与问题。reference 四件与
 * editor_suggest 自带的内部分支校验不豁免——双验无害，注册面单源统一。
 * schema 之外的语义校验（章键正整数、状态词表、边界值等）仍由各工具与 core 兜底，
 * 一字不动；schema 子集外的注记关键字（minimum/pattern）校验器按注记忽略。
 */
function withInputValidation(tool: NovelToolDefinition): NovelToolDefinition {
  // Y8(批F):校验层会回 code:'invalid-args',该键由本层单点注入各工具 output.schema
  // 的 properties(未自带 code 声明者)——不在二十余份域文件里逐份抄。
  return {
    ...tool,
    output: declareOutputCode(tool),
    execute: (args: Record<string, unknown>, sessionContext?: ToolExecContext) => {
      const violations = validateJsonSchemaValue(tool.parameters as JsonSchemaNode, args, 'args')
      if (violations.length > 0) {
        return { ok: false, code: 'invalid-args', reason: `工具参数不完整或格式错误（${tool.name}）：${violations.join('；')}——请对照工具参数声明修正后重试` }
      }
      return tool.execute(args, sessionContext)
    },
  }
}

/** 给未声明 code 的 output.schema 补上 code 属性（invalid-args 等失败码）。 */
function declareOutputCode(tool: NovelToolDefinition): NovelToolDefinition['output'] {
  const schema = tool.output?.schema as Record<string, unknown> | undefined
  if (schema === undefined || typeof schema !== 'object' || Array.isArray(schema)) return tool.output
  const properties = schema['properties'] as Record<string, unknown> | undefined
  if (properties === undefined || typeof properties !== 'object' || Array.isArray(properties) || 'code' in properties) return tool.output
  return { ...tool.output, schema: { ...schema, properties: { ...properties, code: { type: 'string', description: '失败码（invalid-args＝入参不合声明）' } } } }
}

export function createNovelTools(deps: NovelToolsDeps): NovelToolDefinition[] {
  const shared = createToolShared(deps)
  // 域文件按域分组收集；注册顺序由 TOOL_SPECS 的行序决定（表序即注册序）。
  // 原先这里是按 NOVEL_TOOL_NAMES 的索引重排——两份顺序存在才有意义；现在名单
  // 是表的投影，两套顺序合一，排序的**来源**改为表本身。
  const produced = new Map<string, NovelToolDefinition>()
  for (const tool of [
    ...createReferenceToolSet(shared),
    ...createDesignTools(shared),
    ...createOutlineTools(shared),
    ...createDraftingTools(shared),
    ...createReviewTools(shared),
    ...createRevisionTools(shared),
    ...createSettleTools(shared),
  ]) {
    produced.set(tool.name, tool)
  }
  // 两个方向都必须是空的，否则就是表与域文件漂移（新增工具忘了加行／加了行忘了实现）。
  const 表外工具 = [...produced.keys()].filter((name) => specOf(name) === undefined)
  if (表外工具.length > 0) {
    throw new Error(`工具未在 tool-spec.ts 登记身份：${表外工具.join('、')}——锁/回执/标题无法推导，拒绝注册`)
  }
  const 缺实现 = TOOL_SPECS.filter((spec) => !produced.has(spec.name)).map((spec) => spec.name)
  if (缺实现.length > 0) {
    throw new Error(`tool-spec.ts 登记了未实现的工具：${缺实现.join('、')}——请补上域文件或删掉表行`)
  }
  const tools: NovelToolDefinition[] = TOOL_SPECS.map((spec) => produced.get(spec.name)!)

  // Tool calls are the product write boundary. Keep the read-modify-write
  // portion of synchronous mutations under the same book lock that protects
  // the final atomic file replacement. Approval tools remain async and take
  // their lock in the final write services after the author decision.
  const registered = deps.testTools === true
    ? tools
    : tools.filter((tool) => specOf(tool.name)?.register === 'author')
  /**
   * 书锁/写路径兜底失败的结构化返回。
   *
   * §7.3 要求工具层把异常转成 `{ok:false, reason:'中文语境: <原消息>'}`，点名工具场景。
   * 早前这里只回 `error.message`，19 个 locked 工具连带原生写工具一起兜底时，
   * 模型拿到的是一句没有上下文的裸异常文本，不知道是哪一步、哪类操作失败的。
   */
  const 写路径兜底失败 = (toolName: string, error: unknown): { ok: false; reason: string } => ({
    ok: false,
    reason: `工具 ${toolName} 写入失败: ${error instanceof Error ? error.message : String(error)}`,
  })
  // 入参校验包在最外层：schema 违规在拿书锁之前就拒（纯 CPU 检查不必进 withBookWrite）。
  return registered.map((tool) => {
    const spec = specOf(tool.name)
    if (spec === undefined) {
      // specOf 在上面已双向校验过，走到这里说明表在注册期间被改（不可变数据，理论不可达）。
      throw new Error(`工具 ${tool.name} 无身份登记`)
    }
    if (spec.lock !== 'book-sync' && spec.lock !== 'book-async') return withInputValidation(tool)
    const 异步写 = spec.lock === 'book-async'
    return withInputValidation({
      ...tool,
      execute: (args: Record<string, unknown>, sessionContext?: ToolExecContext) => {
        const bookId = args['bookId'] === undefined ? '' : String(args['bookId']).trim()
        const root = bookId === '' ? undefined : deps.bookRootOfBookId(bookId, sessionContext?.agent)
        if (root === undefined) return tool.execute(args, sessionContext)
        try {
          if (异步写) {
            return withBookWriteAsync(root, async () => tool.execute(args, sessionContext), provenanceOf(sessionContext))
              .catch((error: unknown) => 写路径兜底失败(tool.name, error))
          }
          return withBookWrite(root, () => tool.execute(args, sessionContext), provenanceOf(sessionContext))
        } catch (error) {
          return 写路径兜底失败(tool.name, error)
        }
      },
    })
  })
}
