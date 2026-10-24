import { describe, expect, it, vi } from 'vitest'
import { chapterLabel, chapterTargetOf, createWorkbenchSelection, mountedSessionOf, WORKBENCH_PANEL_ID } from '../src/client/chapter-target'

const finalized = (path: string, space = 'book:fog') => chapterTargetOf({ space, path })
const draft = (path: string, space = 'book:fog') => chapterTargetOf({ space, path })

describe('章定位：从路径认出一章', () => {
  it('认定稿章，卷号与章号按书仓口径解析', () => {
    expect(finalized('定稿/卷01/0007-夜渡.md')).toEqual({
      space: 'book:fog', ref: { space: 'book:fog', path: '定稿/卷01/0007-夜渡.md' },
      volume: 1, chapter: 7, title: '夜渡',
    })
  })

  it('认草稿区新键章稿（带章号四位）', () => {
    expect(draft('草稿区/草稿/卷01-0007-夜渡/稿2.md')).toMatchObject({ volume: 1, chapter: 7, title: '夜渡' })
  })

  it('旧键草稿目录（无章号）也认，章号记 0 表示未定位', () => {
    expect(draft('草稿区/草稿/卷01-夜渡/稿1.md')).toMatchObject({ volume: 1, chapter: 0, title: '夜渡' })
  })

  it('反斜杠路径按同一口径认', () => {
    expect(draft('草稿区\\草稿\\卷02-0003-风起\\稿1.md')).toMatchObject({ volume: 2, chapter: 3, title: '风起' })
  })

  it('章细纲、材料包、审核记录不是正文，不进工作台', () => {
    for (const path of [
      '故事剧情/卷规划/卷01/章细纲/0007-夜渡.md',
      '草稿区/章细纲/卷01-0007-夜渡.md',
      '草稿区/材料包/卷01-0007-夜渡/材料.md',
      '草稿区/审核/卷01-0007-夜渡.json',
      '草稿区/定稿准备/卷01-0007-夜渡/待定稿包.md',
    ]) expect(finalized(path), path).toBeUndefined()
  })

  it('设计面文件与共享资料不进工作台', () => {
    expect(finalized('作品契约.md')).toBeUndefined()
    expect(finalized('故事剧情/全书大纲.md')).toBeUndefined()
    expect(finalized('定稿/卷01/0007-夜渡.md', 'shared')).toBeUndefined()
  })

  it('章标签不把未定位章显示成第 0 章', () => {
    expect(chapterLabel({ volume: 1, chapter: 7, title: '夜渡' })).toBe('卷 01 · 第 7 章 夜渡')
    expect(chapterLabel({ volume: 2, chapter: 0, title: '风起' })).toBe('卷 02 · 章未定位 风起')
  })
})

describe('章定位：当前看哪一章', () => {
  it('每个会话各记一份位置，可清除并通知订阅者', () => {
    const selection = createWorkbenchSelection(), notified = vi.fn()
    const one = draft('草稿区/草稿/卷01-0007-夜渡/稿1.md')!
    const two = draft('草稿区/草稿/卷01-0008-风起/稿1.md')!
    selection.subscribe(notified)
    selection.choose('s1', one)
    selection.choose('s2', two)
    expect(selection.get('s1')).toMatchObject({ chapter: 7 })
    expect(selection.get('s2')).toMatchObject({ chapter: 8 })
    expect(notified).toHaveBeenCalledTimes(2)
    selection.clear('s1')
    expect(selection.get('s1')).toBeUndefined()
    expect(notified).toHaveBeenCalledTimes(3)
    // 清空一个没有位置的会话不产生通知。
    selection.clear('missing')
    expect(notified).toHaveBeenCalledTimes(3)
  })

  it('卸载后清空全部位置且不再通知', () => {
    const selection = createWorkbenchSelection(), notified = vi.fn()
    selection.choose('s1', draft('草稿区/草稿/卷01-0007-夜渡/稿1.md')!)
    selection.subscribe(notified)
    selection.dispose()
    expect(selection.get('s1')).toBeUndefined()
    selection.choose('s2', draft('草稿区/草稿/卷01-0008-风起/稿1.md')!)
    expect(notified).not.toHaveBeenCalled()
  })
})

describe('整页态与右栏互斥（复述宿主口径）', () => {
  it('面板占用 main 时右栏没有 on-screen 会话，切回对话后交回', () => {
    expect(mountedSessionOf(WORKBENCH_PANEL_ID, 's1')).toBeUndefined()
    expect(mountedSessionOf(null, 's1')).toBe('s1')
    expect(mountedSessionOf(null, undefined)).toBeUndefined()
  })
})
