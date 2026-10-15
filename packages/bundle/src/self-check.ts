/**
 * 装机自检（R1）：把「静默降级」的装机点收成可查询的内存状态。
 *
 * 设计约束（Arch R1 草案＋首席四条硬约束）：
 * - 纯增：本文件只提供状态容器；调用点只加 recordSelfCheck，既有控制流与 warn 文案一字不动。
 * - 不落盘：内存态，避免在书仓留运行痕迹，也不会进 check:public 的白名单扫描面。
 * - 写状态绝不能让装机抛错：recordSelfCheck 内部自吞（同 index.ts 清理路径的容错风格）。
 * - id 单一真源＝SELF_CHECK_IDS；测试断言 items 的 id 集合 ⊆ SELF_CHECK_IDS，
 *   将来新增挂载点忘了上报会红灯。
 *
 * 三级状态不许混用（Arch 草案第 4 条）：
 *   pending  ＝宿主服务尚未就绪（正常等待，不是故障）
 *   degraded ＝能用但能力削弱（cwd 兜底、裁决通道缺失）
 *   missing  ＝宿主表面根本不存在
 */

export const SELF_CHECK_IDS = [
  'host.inject',
  'skills.dir',
  'skills.mount',
  'workspace.root',
  'agents.surface',
  'tools.kit',
  'tools.register',
  'tools.restrict',
  'approval.policy',
  'gate.file',
  'persona.mount',
  'status.mount',
] as const

export type SelfCheckId = (typeof SELF_CHECK_IDS)[number]
export type SelfCheckStatus = 'ok' | 'degraded' | 'pending' | 'missing'

export interface SelfCheckItem {
  readonly id: SelfCheckId
  readonly status: SelfCheckStatus
  /** 唯一诊断信息：服务名／路径／触发点。 */
  readonly detail: string
  /** ISO 时间戳（写入时刻）。 */
  readonly at: string
}

export interface SelfCheckSummary {
  readonly ok: number
  readonly degraded: number
  readonly pending: number
  readonly missing: number
}

export interface SelfCheckSnapshot {
  readonly items: readonly SelfCheckItem[]
  readonly summary: SelfCheckSummary
}

const items = new Map<SelfCheckId, SelfCheckItem>()

/** 记录（或覆盖）一项装机状态：同一 id 后写覆盖，允许 pending → ok 收敛。 */
export function recordSelfCheck(id: SelfCheckId, status: SelfCheckStatus, detail: string): void {
  try {
    items.set(id, { id, status, detail, at: new Date().toISOString() })
  } catch {
    /* 自检记录绝不影响装机 */
  }
}

/** 只读快照：items 按 SELF_CHECK_IDS 声明顺序输出（稳定可比，不承诺随时间排序）。 */
export function readSelfCheck(): SelfCheckSnapshot {
  const ordered: SelfCheckItem[] = []
  for (const id of SELF_CHECK_IDS) {
    const item = items.get(id)
    if (item !== undefined) ordered.push(item)
  }
  const summary: Record<SelfCheckStatus, number> = { ok: 0, degraded: 0, pending: 0, missing: 0 }
  for (const item of ordered) summary[item.status] += 1
  return { items: ordered, summary }
}

/** 清空全部状态（测试用的唯一重置入口）。 */
export function resetSelfCheck(): void {
  items.clear()
}
