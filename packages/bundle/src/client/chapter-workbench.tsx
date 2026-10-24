import React, { useCallback, useSyncExternalStore } from 'react'
import { ArrowLeft, Hammer } from 'lucide-react'
import type { ClientHost } from './host'
import { useSession } from './hooks'
import type { EditorStore } from './store'
import { chapterLabel, WORKBENCH_PANEL_ID, type ChapterTarget, type WorkbenchSelection } from './chapter-target'

export interface WorkbenchUI {
  readonly host: ClientHost
  readonly store: EditorStore
  readonly selection: WorkbenchSelection
}

/** 订阅「当前会话在看哪一章」；位置只在 UI 内存里，不落盘。 */
function useChapterTarget(selection: WorkbenchSelection, sessionId: string | undefined): ChapterTarget | undefined {
  return useSyncExternalStore(selection.subscribe, useCallback(() => sessionId ? selection.get(sessionId) : undefined, [selection, sessionId]))
}

/**
 * 本章工作台的整页壳子。占根作用域 `main` 槽的一个 key，由 `ctx.layout.selectPanel`
 * 选中；此刻对话列让位，右栏没有 on-screen 会话（宿主行为），所以页面自己带返回。
 */
export function ChapterWorkbench({ host, store: _store, selection }: WorkbenchUI) {
  const sessionId = useSession(host)
  const target = useChapterTarget(selection, sessionId)
  return <div className="abzu nw-workbench" role="region" aria-label="本章工作台">
    <header className="nw-workbench-head">
      <button type="button" className="nw-workbench-back" onClick={() => host.layout.selectPanel(null)}>
        <ArrowLeft size={15} /><span>返回书稿</span>
      </button>
      <div className="nw-workbench-title">
        <h1>本章工作台</h1>
        <p>{target ? chapterLabel(target) : '还没有选中章节'}</p>
      </div>
    </header>
    <div className="nw-workbench-body">
      {target
        ? <p className="nw-workbench-placeholder"><Hammer size={16} />{target.title}：环节状态、正文与审读发现项在下一批接入。</p>
        : <p className="nw-workbench-placeholder"><Hammer size={16} />从左侧书房层级树点一章进入。</p>}
    </div>
  </div>
}

/** 把工作台挂进 `main` 槽；同一个 key 只注册一次，随 client lifetime 一起撤。 */
export function installChapterWorkbench(ui: WorkbenchUI): void {
  ui.host.effect(() => {
    const off = ui.host.slots.inject('main', () => ui.host.slots.register({ name: 'main', key: WORKBENCH_PANEL_ID }, () => <ChapterWorkbench {...ui} />))
    return () => { if (typeof off === 'function') (off as () => void)() }
  }, 'abzu: chapter workbench panel')
}
