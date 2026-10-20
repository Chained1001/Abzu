import { describe, expect, it } from 'vitest'
import { parseDocument, serializeDocument, unwrap } from '../src/repo/frontmatter'

describe('frontmatter 解析(B3/B4/B5)', () => {
  it('标准结构', () => {
    const r = parseDocument('---\n状态: 候选\n版本: 3\n---\n\n正文第一行\n')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.fields['状态']).toBe('候选')
      expect(r.data.fields['版本']).toBe(3)
      expect(r.data.body).toContain('正文第一行')
    }
  })
  it('无 frontmatter=空字段(合法)', () => {
    const r = parseDocument('# 只有正文\n')
    expect(r.ok).toBe(true)
    if (r.ok) expect(Object.keys(r.data.fields)).toEqual([])
  })
  it('B5:未闭合→parse-error 带明细,不静默', () => {
    const r = parseDocument('---\n状态: 候选\n')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('parse-error')
      expect(r.detail).toContain('未闭合')
    }
  })
  it('B5:YAML 语法错→parse-error 带明细', () => {
    const r = parseDocument('---\n状态: [未闭合\n---\nx\n')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('parse-error')
  })
  it('外部编辑器 BOM(\\uFEFF):剥除后照常解析,字段不静默丢失', () => {
    // 候选细纲形:readFileSync(utf-8) 保留 BOM,不剥则整文件被当正文、状态/角色字段全丢
    const 候选细纲 = '\uFEFF---\n状态: 候选\n版本: 2\n---\n\n细纲正文\n'
    const r = parseDocument(候选细纲)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.fields['状态']).toBe('候选')
      expect(r.data.fields['版本']).toBe(2)
      expect(r.data.body.startsWith('\uFEFF')).toBe(false)
    }
    // 契约形:契约读侧(readExistingContract)同样汇入 parseDocument
    const 契约 = '\uFEFF---\n状态: 暂定\n作者裁决: 待定\n---\n\n## 主题 〔已确认〕\n\n契约正文\n'
    const c = parseDocument(契约)
    expect(c.ok).toBe(true)
    if (c.ok) expect(c.data.fields['状态']).toBe('暂定')
  })
  it('BOM+无 frontmatter 正文:字段空,正文不带 BOM', () => {
    const r = parseDocument('\uFEFF# 只有正文\n')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(Object.keys(r.data.fields)).toEqual([])
      expect(r.data.body.startsWith('#')).toBe(true)
    }
  })
  it('B4:unwrap 区分 missing 与 parse-error 的报错语义', () => {
    const missing: ReturnType<typeof parseDocument> = { ok: false, reason: 'missing', detail: '' }
    expect(() => unwrap(missing, '契约')).toThrow('没有数据')
    const broken: ReturnType<typeof parseDocument> = { ok: false, reason: 'parse-error', detail: 'YAML 解析失败:…' }
    expect(() => unwrap(broken, '契约')).toThrow('解析失败')
  })
})

describe('frontmatter 序列化(B9 稳定输出)', () => {
  it('键序稳定:定义序优先,其余按中文排序', () => {
    const a = serializeDocument({ 状态: '候选', 版本: 1 }, '正文')
    const b = serializeDocument({ 版本: 1, 状态: '候选' }, '正文')
    expect(a).toBe(b)
  })
  it('空字段省略 frontmatter', () => {
    expect(serializeDocument({}, '正文')).toBe('正文\n')
  })
  it('序列化输出不带 BOM(写出侧干净,往返不受剥除影响)', () => {
    const text = serializeDocument({ 状态: '候选', 版本: 1 }, '正文')
    expect(text).not.toContain('\uFEFF')
    expect(text.startsWith('---\n')).toBe(true)
  })
  it('往返一致', () => {
    const text = serializeDocument({ 状态: '已确认', 来源引用: '故事剧情/卷规划/卷01/卷纲.md@5' }, '# 标题\n内容')
    const r = parseDocument(text)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.fields['状态']).toBe('已确认')
      expect(r.data.body).toContain('# 标题')
    }
  })
})
