import { describe, expect, it } from 'vitest'
import { validateSegment, assertSegment, paths, pad, chapterNo } from '../src/repo/paths'

describe('路径白名单(机制 B2)', () => {
  it('合法中文名通过', () => {
    expect(validateSegment('初见')).toEqual([])
    expect(validateSegment('第一卷-风起')).toEqual([])
  })
  it('非法字符拒绝', () => {
    expect(validateSegment('a/b').length).toBeGreaterThan(0)
    expect(validateSegment('a\\b').length).toBeGreaterThan(0)
    expect(validateSegment('a:b').length).toBeGreaterThan(0)
    expect(validateSegment('a<b').length).toBeGreaterThan(0)
  })
  it('保留名与边界拒绝', () => {
    expect(validateSegment('CON').length).toBeGreaterThan(0)
    expect(validateSegment('..').length).toBeGreaterThan(0)
    expect(validateSegment('名字 ').length).toBeGreaterThan(0) // 尾空格(Windows)
    expect(validateSegment('名字.').length).toBeGreaterThan(0) // 尾点
    expect(validateSegment('').length).toBeGreaterThan(0)
  })
  it('前导点或空格拒绝(0.0.46:对齐 validateAuthorRelativePath 与书架点目录跳过)', () => {
    expect(validateSegment('.git')).toEqual(['以点或空格开头(点前缀目录对书架扫描不可见)'])
    expect(validateSegment('.abzu')).toEqual(['以点或空格开头(点前缀目录对书架扫描不可见)'])
    expect(validateSegment('.x')).toEqual(['以点或空格开头(点前缀目录对书架扫描不可见)'])
    expect(validateSegment('.隐藏章名')).toEqual(['以点或空格开头(点前缀目录对书架扫描不可见)'])
    expect(validateSegment(' 章名').length).toBeGreaterThan(0) // 前导空格(首尾空白＋前导点空格双报)
  })
  it('assertSegment 抛错带字段名', () => {
    expect(() => assertSegment('a/b', '章名')).toThrow(/B2/)
  })
})

describe('路径构造(格式规格 §2)', () => {
  it('卷号两位、章号四位', () => {
    expect(pad(1)).toBe('01')
    expect(chapterNo(12)).toBe('0012')
    expect(paths.定稿章(2, 13, '风起')).toBe('定稿/卷02/0013-风起.md')
    expect(paths.确认细纲(1, 3, '初见')).toBe('大纲/卷规划/卷01/章细纲/0003-初见.md')
    expect(paths.账本('时间线')).toBe('账本/时间线.md')
    expect(paths.记忆('文风')).toBe('本书记忆/文风.md')
    expect(paths.审核记录(1, '初见')).toBe('草稿区/审核/卷01-初见.json')
  })

  it('幕纲路径:卷号两位、幕号两位(0.0.52 幕纲批)', () => {
    expect(paths.幕纲(1, 2, '渡口疑云')).toBe('大纲/卷规划/卷01/幕纲/幕02-渡口疑云.md')
    expect(paths.幕纲(12, 10, '终局')).toBe('大纲/卷规划/卷12/幕纲/幕10-终局.md')
  })
})
