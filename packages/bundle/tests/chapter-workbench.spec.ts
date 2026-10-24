import React from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it } from 'vitest'
import { installChapterWorkbench } from '../src/client/chapter-workbench'
import { chapterTargetOf, createWorkbenchSelection, WORKBENCH_PANEL_ID } from '../src/client/chapter-target'
import { createEditorStore } from '../src/client/store'
import type { ClientHost } from '../src/client/host'

const renderers: ReactTestRenderer[] = []
const cleanups: (() => void)[] = []
afterEach(async () => {
  await act(async () => { for (const renderer of renderers.splice(0)) renderer.unmount() })
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
})

const mainSession = 'session-a'
const sessionHost = () => ({ byId: { [mainSession]: { retainedBy: { mainView: 1 } } } })

/** 宿主的一面记录：selectPanel 只接受已注册的 key，panelInfo 可订阅。 */
function layout() {
  const registered = new Set<string>()
  let active: string | null = null
  const listeners = new Set<() => void>()
  const emit = () => { for (const listener of listeners) listener() }
  return {
    registered,
    get active() { return active },
    selectPanel(panelId: string | null) {
      if (panelId !== null && !registered.has(panelId)) throw new Error('slot "' + panelId + '" is not declared')
      active = panelId
      emit()
    },
    panelInfo: { getSnapshot: () => ({ activePanelId: active }), subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } } },
  }
}

function fixture() {
  const board = layout()
  let Component!: React.ComponentType<Record<string, unknown>>
  const host = {
    effect(fn: () => unknown) { const cleanup = fn(); if (typeof cleanup === 'function') cleanups.push(cleanup as () => void) },
    layout: board,
    sessions: { list: { getSnapshot: () => sessionHost(), subscribe: () => () => {} } },
    slots: {
      inject(_name: string, fn: () => void) { return fn() },
      register(options: { name: string; key?: string }, component: React.ComponentType<Record<string, unknown>>) {
        board.registered.add(options.key!)
        Component = component
        return () => { board.registered.delete(options.key!) }
      },
    },
  } as unknown as ClientHost
  const selection = createWorkbenchSelection(), store = createEditorStore()
  installChapterWorkbench({ host, store, selection })
  return { host, board, selection, store, Component }
}

async function mount(Component: React.ComponentType<Record<string, unknown>>, props: Record<string, unknown> = {}) {
  let renderer!: ReactTestRenderer
  await act(async () => { renderer = create(React.createElement(Component, props)) })
  renderers.push(renderer)
  return renderer
}
function text(node: ReactTestInstance): string { return node.children.map(child => typeof child === 'string' ? child : text(child)).join('') }
const button = (renderer: ReactTestRenderer, label: string) => renderer.root.findAllByType('button').find(item => text(item).includes(label))

describe('本章工作台：整页壳子', () => {
  it('注册到 main 槽的固定 key，宿主面板表里能选中它', () => {
    const f = fixture()
    expect(WORKBENCH_PANEL_ID).toBe('abzu-chapter-workbench')
    expect(f.board.registered.has(WORKBENCH_PANEL_ID)).toBe(true)
    expect(() => f.board.selectPanel(WORKBENCH_PANEL_ID)).not.toThrow()
    expect(f.board.active).toBe(WORKBENCH_PANEL_ID)
  })

  it('返回按钮把面板切回 null（回对话）', async () => {
    const f = fixture()
    const target = chapterTargetOf({ space: 'book:fog', path: '草稿区/草稿/卷01-0007-夜渡/稿1.md' })!
    f.selection.choose(mainSession, target)
    f.board.selectPanel(WORKBENCH_PANEL_ID)
    const page = await mount(f.Component)
    await act(async () => { button(page, '返回书稿')!.props.onClick() })
    expect(f.board.active).toBeNull()
  })

  it('显示当前章节位置；没有选中章节时提示从层级树进入', async () => {
    const f = fixture()
    const empty = await mount(f.Component)
    expect(text(empty.root)).toContain('还没有选中章节')
    expect(text(empty.root)).toContain('从左侧书房层级树点一章进入')

    f.selection.choose(mainSession, chapterTargetOf({ space: 'book:fog', path: '定稿/卷02/0013-风起.md' })!)
    await act(async () => { empty.update(React.createElement(f.Component)) })
    expect(text(empty.root)).toContain('卷 02 · 第 13 章 风起')
    expect(text(empty.root)).not.toContain('还没有选中章节')
  })

  it('位置随位置源变化更新，且只认当前主会话的位置', async () => {
    const f = fixture()
    const page = await mount(f.Component)
    await act(async () => {
      f.selection.choose(mainSession, chapterTargetOf({ space: 'book:fog', path: '草稿区/草稿/卷01-0007-夜渡/稿1.md' })!)
    })
    expect(text(page.root)).toContain('第 7 章 夜渡')
    await act(async () => { f.selection.choose('session-b', chapterTargetOf({ space: 'book:fog', path: '草稿区/草稿/卷01-0008-风起/稿1.md' })!) })
    expect(text(page.root)).toContain('第 7 章 夜渡')
  })

  it('进入整页时右栏没有 on-screen 会话，退出后交回', async () => {
    const f = fixture()
    // ui-sidebar-right 的 on-screen 会话规则：panelInfo.activePanelId 为 null 时才是选中的会话。
    let mounted: string | undefined = mainSession
    const sync = () => { mounted = f.board.panelInfo.getSnapshot().activePanelId === null ? mainSession : undefined }
    const unsubscribe = f.board.panelInfo.subscribe(sync)
    sync()
    expect(mounted).toBe(mainSession)

    f.board.selectPanel(WORKBENCH_PANEL_ID)
    expect(mounted).toBeUndefined()

    f.board.selectPanel(null)
    expect(mounted).toBe(mainSession)
    unsubscribe()
  })

  it('client 生命周期结束时撤掉 main 注册', () => {
    const f = fixture()
    expect(f.board.registered.has(WORKBENCH_PANEL_ID)).toBe(true)
    for (const cleanup of cleanups.splice(0).reverse()) cleanup()
    expect(f.board.registered.has(WORKBENCH_PANEL_ID)).toBe(false)
  })
})
