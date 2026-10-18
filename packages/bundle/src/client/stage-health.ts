/**
 * 阶段健康度的可推导事实。
 *
 * 当前没有真源健康 API：章节定稿进度可以从 ChapterView.chapters 推导，其余指标
 * 保持 null 表示“未接入”，绝不以 0 冒充已接通。本模块只服务产品界面。
 */
import type { ChapterView } from '../study/types'

export type StageChapter = ChapterView['chapters'][number]

export interface StageHealth {
  /** 已登记章节总数。 */
  readonly total: number
  /** 已定稿章节数。 */
  readonly finalized: number
  /** 尚未定稿章节数。 */
  readonly pendingFinal: number
  /** 设定债数量；真源健康 API 未接入时为 null。 */
  readonly settingDebt: number | null
  /** 待处置评审数量；真源健康 API 未接入时为 null。 */
  readonly pendingReview: number | null
  /** 待复评数量；真源健康 API 未接入时为 null。 */
  readonly pendingReReview: number | null
  /** 变更数量；真源健康 API 未接入时为 null。 */
  readonly changes: number | null
}

/** 与章节进度视图保持同一判定：显式 finalized 优先，旧宿主回退到状态“完成”。 */
export function isFinalizedChapter(chapter: StageChapter): boolean {
  return chapter.finalized ?? chapter.status === '完成'
}

export function deriveStageHealth(chapters: readonly StageChapter[] | null | undefined): StageHealth {
  const list = chapters ?? []
  const total = list.length
  const finalized = list.filter(isFinalizedChapter).length
  return {
    total,
    finalized,
    pendingFinal: total - finalized,
    settingDebt: null,
    pendingReview: null,
    pendingReReview: null,
    changes: null,
  }
}
