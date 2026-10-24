/**
 * 工具身份唯一事实来源。
 *
 * 此前「一个工具是什么」这件事被抄在六份名单里：
 * - `tools/index.ts#locked`（19 项）—— 工具层要不要拿书锁，拿同步锁还是异步锁；
 * - `design-commit-result.ts#NATIVE_DESIGN_TOOLS`（6 项）—— 既决定异步写，又决定查不查重复空提交；
 * - `derive/receipt.ts#写入类工具`（21 项，在 core）—— 产不产回执；
 * - `client/tool-result.ts#novelToolTitles`（32 项）—— 结果卡标题；
 * - `study/workflow-types.ts#toolStages`（17 项）—— 工作流视图阶段；
 * - `tools/index.ts#NOVEL_TOOL_NAMES` / `NOVEL_TEST_TOOL_NAMES` —— 注册名单。
 *
 * 六份之间没有任何机械约束：新增一个工具要记得改六处，漏一处是静默失效
 * （漏锁＝丢原子性，漏标题＝卡片露出原始工具名）。本表把「身份」收成一行，
 * 各消费方改为对本表投影，由 `tool-spec.spec.ts` 的三向 join 测试对撞。
 *
 * 本文件**零运行时 import**。`WorkflowStage` 是 type-only 导入（擦除），
 * 所以浏览器入口（`lib/client.js`）引它不会拖进 `node:fs`；也因此它不能引
 * `@abzu/core` 或工具层。
 *
 * 工具的 `parameters` 与 `execute` **不在此处**：那是每个工具真正的 interface，
 * 与实现强耦合，留在各域 `*-tools.ts`。
 */

import type { WorkflowStage } from './study/workflow-types'

/**
 * 书锁作用域。四值穷举，不可省略——「忘了填」与「故意不填」必须可区分。
 *
 * - `book-sync`：工具层 `withBookWrite` 同步锁（读-改-写整段在锁内）；
 * - `book-async`：工具层 `withBookWriteAsync` 异步锁（批准类工具，作者裁决后才落锁）；
 * - `core-only`：工具层不落锁，锁在 core 的 `bookWriter` 里（settle/retcon 等需过作者裁决的写入）；
 * - `workspace`：锁在 workspace 作用域，不在 bookRoot（参考书四件走 `referenceLocked`）。
 */
export type ToolLock = 'book-sync' | 'book-async' | 'core-only' | 'workspace'

export interface ToolSpec {
  readonly name: string
  /** 结果卡标题。测试专用工具也填，但投影时按 `register` 过滤。 */
  readonly title: string
  /** 工作流视图阶段；`null` ＝该工具不上工作流视图（显式的「没有」，不是漏填）。 */
  readonly stage: WorkflowStage | null
  /** `test-only` 只在 `deps.testTools` 为真时注册。 */
  readonly register: 'author' | 'test-only'
  readonly lock: ToolLock
  /**
   * 是否参与「同一轮重复执行同一次设计侧操作」的幂等检测
   * （`design-commit-result.ts#repeatedDesignNoChange`）。
   *
   * 与 `lock === 'book-async'` 今日恰好同集，但这是两个独立事实：
   * 前者问「要不要查重」，后者问「锁怎么拿」。合并会让将来出现
   * 「异步写但不查重」的工具被强行绑死。
   */
  readonly designIdempotence: boolean
  /** 改不改变书仓/草稿区持久状态。产不产回执。 */
  readonly receipt: boolean
}

/**
 * 全部注册工具。**顺序即注册顺序**（`createNovelTools` 不再重排），
 * 与 `NOVEL_TOOL_NAMES` 的历史顺序逐项一致，故 `novel-tools.spec` 的
 * `toEqual([...NOVEL_TOOL_NAMES])` 仍然成立。
 *
 * 改这张表时：`title`/`stage` 漏填由 join 测试抓；`register`/`lock`/`receipt`/
 * `designIdempotence` 缺行会在注册时 `throw`（见 `tools/index.ts`）——漏锁是静默
 * 丢失原子性，比加载失败糟得多。
 */
export const TOOL_SPECS: readonly ToolSpec[] = [
  // ── 参考书四件：锁在 workspace，不上工作流视图，不产回执 ──
  { name: 'novel_reference_source', title: '管理参考小说', stage: null, register: 'author', lock: 'workspace', designIdempotence: false, receipt: false },
  { name: 'novel_reference_analyze', title: '渐进拆解小说', stage: null, register: 'author', lock: 'workspace', designIdempotence: false, receipt: false },
  { name: 'novel_reference_query', title: '查找参考机制', stage: null, register: 'author', lock: 'workspace', designIdempotence: false, receipt: false },
  { name: 'novel_reference_report', title: '保存拆书成果', stage: null, register: 'author', lock: 'workspace', designIdempotence: false, receipt: false },

  { name: 'novel_select_book', title: '选择作品', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },
  { name: 'novel_create_book', title: '创建作品', stage: 'idea', register: 'author', lock: 'core-only', designIdempotence: false, receipt: true },
  { name: 'novel_update_contract', title: '更新作品契约', stage: 'design', register: 'author', lock: 'book-async', designIdempotence: true, receipt: true },
  { name: 'novel_get_story_status', title: '查看写作状态', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },
  { name: 'novel_search_finalized', title: '检索定稿', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },
  { name: 'novel_index_manage', title: '管理检索索引', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },
  { name: 'novel_prepare_pack', title: '准备定稿包', stage: 'settle', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_settle_chapter', title: '定稿入档', stage: 'confirm', register: 'author', lock: 'core-only', designIdempotence: false, receipt: true },
  { name: 'novel_new_outline_draft', title: '准备大纲草案', stage: 'outline', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_confirm_outline', title: '确认大纲', stage: 'outline', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_update_full_outline', title: '更新全书大纲', stage: 'fullOutline', register: 'author', lock: 'book-async', designIdempotence: true, receipt: true },
  { name: 'novel_update_volume_layout', title: '更新分卷布局', stage: 'volumes', register: 'author', lock: 'book-async', designIdempotence: true, receipt: true },
  { name: 'novel_roll_window', title: '更新近期窗口', stage: 'volume', register: 'author', lock: 'book-async', designIdempotence: true, receipt: true },
  { name: 'novel_confirm_worldbook_entry', title: '确认世界书', stage: 'design', register: 'author', lock: 'book-async', designIdempotence: true, receipt: true },
  { name: 'novel_confirm_volume_outline', title: '确认卷纲', stage: 'volume', register: 'author', lock: 'book-async', designIdempotence: true, receipt: true },
  { name: 'novel_assemble_materials', title: '组装写作材料', stage: 'materials', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_apply_revision', title: '应用改稿', stage: 'revise', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_apply_revision_batch', title: '应用批次改稿', stage: 'revise', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_import_draft', title: '导入草稿', stage: 'draft', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_record_review_findings', title: '记录审读结果', stage: 'review', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_record_polish', title: '记录润色承接', stage: 'polish', register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_review_summary', title: '汇总审读结果', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },
  { name: 'novel_record_proposal', title: '记录提案', stage: null, register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_resolve_proposal', title: '处置提案', stage: null, register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_apply_retcon', title: '应用吃书补偿', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: true },
  { name: 'novel_note_pending', title: '记录待补事项', stage: null, register: 'author', lock: 'book-sync', designIdempotence: false, receipt: true },
  { name: 'novel_get_book_progress', title: '查看作品进度', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },
  { name: 'novel_editor_suggest', title: '交回编辑建议', stage: null, register: 'author', lock: 'core-only', designIdempotence: false, receipt: false },

  // ── 测试/走查专用：只在 deps.testTools 为真时注册 ──
  { name: 'novel_seed_min_design', title: '注入占位设计', stage: null, register: 'test-only', lock: 'book-sync', designIdempotence: false, receipt: false },
]

const byName = new Map(TOOL_SPECS.map((spec) => [spec.name, spec]))

/** 按工具名取身份。名字不在表里返回 `undefined`，由调用方决定是 `throw` 还是回退。 */
export function specOf(name: string): ToolSpec | undefined {
  return byName.get(name)
}

/** 某注册类别下的工具名，保持表序。 */
export function toolNamesOf(register: ToolSpec['register']): readonly string[] {
  return TOOL_SPECS.filter((spec) => spec.register === register).map((spec) => spec.name)
}
