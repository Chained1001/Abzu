/**
 * 本章工作台的定位层：从文件路径认出一章，并保存「当前在看哪一章」。
 *
 * 位置是 UI 状态，不落盘、不进书仓——真源仍是文件；页面重开后由点击重新定位。
 * 路径口径与书仓格式一致（paths.ts）：定稿 `定稿/卷NN/NNNN-章名.md`，
 * 草稿区新键 `草稿区/草稿/卷NN-NNNN-章名/稿N.md`，旧键 `卷NN-章名`（无章号）只读兼容。
 */
import type { FileRef } from '../study/types'

export const WORKBENCH_PANEL_ID = 'abzu-chapter-workbench'

export interface ChapterTarget {
  readonly space: string
  readonly ref: FileRef
  readonly volume: number
  readonly chapter: number
  readonly title: string
}

const FINALIZED = /^定稿\/卷(\d{1,2})\/(\d{1,4})-(.+)\.md$/i
const DRAFT = /^草稿区\/草稿\/卷(\d{1,2})-(\d{1,4})-(.+?)\/稿\d+\.md$/i
const LEGACY_DRAFT = /^草稿区\/草稿\/卷(\d{1,2})-(.+?)\/稿\d+\.md$/i

function targetOf(ref: FileRef, volume: string, chapter: string, title: string): ChapterTarget {
  return { space: ref.space, ref, volume: Number(volume), chapter: Number(chapter), title }
}

/**
 * 认一章：路径命中定稿章或草稿区章稿才算。
 * @param ref - 文件来源；共享资料不属任何章节。
 * @returns 章位置；不是章节文件时返回 undefined，调用方照常按文档打开。
 */
export function chapterTargetOf(ref: FileRef): ChapterTarget | undefined {
  if (ref.space === 'shared') return undefined
  const path = ref.path.replace(/\\/g, '/')
  const finalized = FINALIZED.exec(path)
  if (finalized) return targetOf(ref, finalized[1]!, finalized[2]!, finalized[3]!)
  const draft = DRAFT.exec(path)
  if (draft) return targetOf(ref, draft[1]!, draft[2]!, draft[3]!)
  const legacy = LEGACY_DRAFT.exec(path)
  // 旧格式草稿目录没有章号：位置只知道卷与章名，章号记 0（与书仓 0000 未定位占位同口径）。
  if (legacy) return { space: ref.space, ref, volume: Number(legacy[1]), chapter: 0, title: legacy[2]! }
  return undefined
}

/** 页面标题用的章标签；章号 0 是未定位，不显示成「第 0 章」。 */
export function chapterLabel(target: Pick<ChapterTarget, 'volume' | 'chapter' | 'title'>): string {
  const volume = '卷 ' + String(target.volume).padStart(2, '0')
  const chapter = target.chapter > 0 ? '第 ' + target.chapter + ' 章' : '章未定位'
  return volume + ' · ' + chapter + ' ' + target.title
}

export function createWorkbenchSelection() {
  const positions = new Map<string, ChapterTarget>()
  const listeners = new Set<() => void>()
  const emit = () => { for (const listener of listeners) listener() }
  return {
    get(sessionId: string): ChapterTarget | undefined { return positions.get(sessionId) },
    choose(sessionId: string, target: ChapterTarget) { positions.set(sessionId, target); emit() },
    clear(sessionId: string) { if (positions.delete(sessionId)) emit() },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    dispose() { positions.clear(); listeners.clear() },
  }
}
export type WorkbenchSelection = ReturnType<typeof createWorkbenchSelection>

/**
 * 宿主对「整页态下右栏」的既定行为（ui-sidebar-right `on-screen Session` 效果）：
 * `mounted` 只在 `panelInfo.activePanelId === null` 时才是选中的会话，否则为 undefined；
 * 右栏面板本身随 `rightbar.session` 一起不渲染，但展开态留在该会话自己的 store 里，
 * 切回对话后由座席重新上报。所以工作台**不得**在进/出时去 toggle 右栏——
 * 那样会把作者原本展开的右栏收起。本函数只复述这条口径，供回归测试与调用方自检。
 */
export function mountedSessionOf(activePanelId: string | null, sessionId: string | undefined): string | undefined {
  return activePanelId === null ? sessionId : undefined
}
