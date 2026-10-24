/**
 * 章级文件入口判定的边界用例（QA 补，依 `docs/设计/章工作台-产品文档.md` §1.2 / §1.2.1）。
 *
 * 口径（PM 文档定死）：
 * - 认定稿 `定稿/卷NN/NNNN-章名.md`
 * - 认草稿区新键 `草稿区/草稿/卷NN-NNNN-章名/稿N.md`
 * - 认旧键 `草稿区/草稿/卷NN-章名/稿N.md`（无章号，章号记 0）
 * - 不认：细纲（候选/确认）、材料包、审核记录、定稿准备、批次、设计面、共享资料
 *
 * 本文件只测「甲」方案的判定面。作者若选乙（细纲也算章级）或丙（新做章树），
 * 那份扩面另写一组用例，不动本文件的既有断言——把它们当作「甲方案下必须成立」的基线。
 */
import { describe, expect, it } from 'vitest'
import { chapterTargetOf } from '../src/client/chapter-target'
import type { FileRef } from '../src/study/types'

const at = (path: string, space = 'book:fog') => chapterTargetOf({ space, path })

describe('定稿章：认', () => {
  it('标准形态', () => {
    expect(at('定稿/卷01/0007-夜渡.md')).toMatchObject({ volume: 1, chapter: 7, title: '夜渡' })
  })

  it('卷号一位、章号一位也认（不强制补零）', () => {
    expect(at('定稿/卷1/7-夜渡.md')).toMatchObject({ volume: 1, chapter: 7, title: '夜渡' })
  })

  it('卷号两位、章号四位是书写口径', () => {
    expect(at('定稿/卷12/0042-长夜.md')).toMatchObject({ volume: 12, chapter: 42, title: '长夜' })
  })

  it('章名含空格、数字、标点都算章名的一部分', () => {
    expect(at('定稿/卷01/0007-第 3 次·雪.md')).toMatchObject({ title: '第 3 次·雪' })
  })

  it('扩展名大小写不敏感', () => {
    expect(at('定稿/卷01/0007-夜渡.MD')).toMatchObject({ chapter: 7 })
  })
})

describe('草稿区新键：认', () => {
  it('稿1 / 稿2 都认，且认到同一章', () => {
    const one = at('草稿区/草稿/卷01-0007-夜渡/稿1.md')
    const two = at('草稿区/草稿/卷01-0007-夜渡/稿2.md')
    expect(one).toMatchObject({ volume: 1, chapter: 7, title: '夜渡' })
    expect(two).toMatchObject({ volume: 1, chapter: 7, title: '夜渡' })
    // 两者指向各自文件（ref 不同），但章节位置相同。
    expect(one!.ref.path).not.toBe(two!.ref.path)
    expect(one!.chapter).toBe(two!.chapter)
  })

  it('稿号多位数认', () => {
    expect(at('草稿区/草稿/卷01-0007-夜渡/稿12.md')).toMatchObject({ chapter: 7 })
  })
})

describe('旧键草稿目录：认，但章号记 0', () => {
  it('无章号时 chapter 为 0（与书仓 0000 未定位同口径）', () => {
    const target = at('草稿区/草稿/卷01-夜渡/稿1.md')
    expect(target).toMatchObject({ volume: 1, chapter: 0, title: '夜渡' })
  })

  it('章名本身含数字也不被误读成章号', () => {
    // 「卷01-第3次雪」里的 3 是章名的一部分，不是章号。
    expect(at('草稿区/草稿/卷01-第3次雪/稿1.md')).toMatchObject({ volume: 1, chapter: 0, title: '第3次雪' })
  })
})

describe('非章级文件：不认（保持右栏现状）', () => {
  const notChapters = [
    // 细纲：本期方案甲不认（§1.2.1）。若作者改判乙，这四条要移到「认」组。
    '草稿区/章细纲/卷01-0007-夜渡.md',
    '故事剧情/卷规划/卷01/章细纲/0007-夜渡.md',
    // 过程工件
    '草稿区/材料包/卷01-0007-夜渡/材料清单.json',
    '草稿区/材料包/卷01-0007-夜渡/01-切片.md',
    '草稿区/审核/卷01-0007-夜渡.json',
    '草稿区/定稿准备/卷01-0007-夜渡/待定稿包.md',
    '草稿区/批次/卷01-0007-夜渡/批次.md',
    // 设计面
    '作品契约/契约.md',
    '故事剧情/全书大纲.md',
    '故事剧情/卷规划/卷01/卷纲.md',
    '故事剧情/卷规划/卷01/幕纲/幕01-开局.md',
    '世界书/人物档案/主角.md',
    '账本/故事线.md',
    // 其他
    '定稿/卷01/0007-夜渡.txt',
    '定稿/0007-夜渡.md',
    '草稿区/草稿/卷01-0007-夜渡/草稿1.md',
    '',
  ]

  it('逐条返回 undefined', () => {
    for (const path of notChapters) expect(at(path), path).toBeUndefined()
  })
})

describe('共享资料永不进工作台', () => {
  it('同样是定稿章路径，space 为 shared 时不认', () => {
    expect(at('定稿/卷01/0007-夜渡.md', 'shared')).toBeUndefined()
  })
})

describe('路径归一', () => {
  it('反斜杠按正斜杠处理', () => {
    expect(at('定稿\\卷01\\0007-夜渡.md')).toMatchObject({ chapter: 7 })
    expect(at('草稿区\\草稿\\卷01-0007-夜渡\\稿1.md')).toMatchObject({ chapter: 7 })
  })

  it('ref 原样保留（不把反斜杠写回 ref）', () => {
    const ref: FileRef = { space: 'book:fog', path: '定稿\\卷01\\0007-夜渡.md' }
    expect(chapterTargetOf(ref)!.ref).toBe(ref)
  })
})
