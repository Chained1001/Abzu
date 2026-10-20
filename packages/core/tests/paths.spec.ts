import { describe, expect, it } from 'vitest'
import { validateSegment, assertSegment, paths, legacyPaths, pad, chapterNo, parseChineseVolume } from '../src/repo/paths'

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
    expect(paths.确认细纲(1, 3, '初见')).toBe('故事剧情/卷规划/卷01/章细纲/0003-初见.md')
    expect(paths.账本('时间线')).toBe('账本/时间线.md')
    expect(paths.记忆('文风')).toBe('本书记忆/文风.md')
    expect(paths.候选细纲(1, 3, '初见')).toBe('草稿区/章细纲/卷01-0003-初见.md')
    expect(paths.材料包目录(1, 3, '初见')).toBe('草稿区/材料包/卷01-0003-初见')
    expect(paths.草稿目录(1, 3, '初见')).toBe('草稿区/草稿/卷01-0003-初见')
    expect(paths.待定稿包目录(1, 3, '初见')).toBe('草稿区/定稿准备/卷01-0003-初见')
    expect(paths.审核记录(1, 3, '初见')).toBe('草稿区/审核/卷01-0003-初见.json')
    // 未定位章(章:0)占位 0000;旧格式(0.0.57 前)只作读侧兼容
    expect(paths.草稿目录(1, 0, '未定位')).toBe('草稿区/草稿/卷01-0000-未定位')
    expect(legacyPaths.审核记录(1, '初见')).toBe('草稿区/审核/卷01-初见.json')
  })

  it('幕纲路径:卷号两位、幕号两位(0.0.52 幕纲批)', () => {
    expect(paths.幕纲(1, 2, '渡口疑云')).toBe('故事剧情/卷规划/卷01/幕纲/幕02-渡口疑云.md')
    expect(paths.幕纲(12, 10, '终局')).toBe('故事剧情/卷规划/卷12/幕纲/幕10-终局.md')
  })
})

describe('parseChineseVolume 卷号复合数解析(批8,0.0.60 表驱动补齐)', () => {
  it.each([
    ['十', 10],
    ['十一', 11],
    ['二十', 20],
    ['二十一', 21],
    ['两', 2],
    ['九十', 90],
    ['九十九', 99],
  ])('正例:%s → %s', (input, expected) => {
    expect(parseChineseVolume(input as string)).toBe(expected)
  })

  it.each([
    ['一百'], // 支持上限 99,百位不在表内
    [''], // 空串
    ['一二'], // 两位但无十位结构
    ['十十'], // 十不能作数字字
    ['3卷'], // 混合字
    ['第3'], // 非纯数字串带前缀
  ])('非法:%s → undefined', input => {
    expect(parseChineseVolume(input as string)).toBeUndefined()
  })

  it('阿拉伯数字直取;超过三位中文数拒绝', () => {
    expect(parseChineseVolume('3')).toBe(3)
    expect(parseChineseVolume('99')).toBe(99)
    expect(parseChineseVolume('一二三')).toBeUndefined()
  })
})
