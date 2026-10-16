import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { removeSync } from '../src/repo/remove'
import {
  readBookMemoryCatalog,
  renderMemoryCatalog,
  writeBookMemory,
} from '../src/index'

const roots: string[] = []
function mkDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  roots.push(dir)
  return dir
}
afterAll(() => { for (const root of roots) removeSync(root) })

describe('本书记忆目录快照（15A；0.0.50 起作者层记忆目录已删除）', () => {
  it('目录被文件占用是读取错误，不报告没有记忆', () => {
    const book = mkDir('abzu-catalog-file-')
    fs.writeFileSync(path.join(book, '本书记忆'), '不是目录')
    expect(readBookMemoryCatalog(book)).toMatchObject({ 状态: '读取错误', 条目: [] })
  })

  it('目录junction、条目硬链接及索引链接不跨书读取', () => {
    const outside = mkDir('abzu-catalog-outside-')
    writeBookMemory(outside, { 类: '决策', 名称: '外部条目', 正文: '外部正文', 来源: '对谈', 裁决记录: '批准' })
    const book = mkDir('abzu-catalog-link-')
    const link = path.join(book, '本书记忆')
    fs.symlinkSync(path.join(outside, '本书记忆'), link, process.platform === 'win32' ? 'junction' : 'dir')
    expect(readBookMemoryCatalog(book)).toMatchObject({ 状态: '读取错误', 条目: [] })
    fs.unlinkSync(link)
    fs.mkdirSync(link)
    fs.linkSync(path.join(outside, '本书记忆', '外部条目.md'), path.join(link, '外部条目.md'))
    expect(readBookMemoryCatalog(book)).toMatchObject({ 状态: '读取错误', 条目: [] })
    fs.unlinkSync(path.join(link, '外部条目.md'))
    fs.linkSync(path.join(outside, '本书记忆', '索引.md'), path.join(link, '索引.md'))
    expect(readBookMemoryCatalog(book).问题.join(';')).toContain('读取索引失败')
  })

  it('旧格式文件出现在索引里时不误报为不存在', () => {
    const book = mkDir('abzu-catalog-legacy-')
    fs.mkdirSync(path.join(book, '本书记忆'))
    fs.writeFileSync(path.join(book, '本书记忆/文风.md'), '# 旧文风\n旧正文')
    fs.writeFileSync(path.join(book, '本书记忆/索引.md'), '- [文风](文风.md)\n')
    expect(readBookMemoryCatalog(book).状态).toBe('正常')
  })

  it('没有记忆：状态无记忆，索引位置仍给出', () => {
    const book = mkDir('abzu-catalog-empty-')
    fs.mkdirSync(path.join(book, '本书记忆'))
    const c = readBookMemoryCatalog(book)
    expect(c.状态).toBe('无记忆')
    expect(c.条目).toHaveLength(0)
    expect(c.索引位置).toBe('本书记忆/索引.md')
    const text = renderMemoryCatalog(c, '选书时')
    expect(text).toContain('【本书记忆目录】选书时')
    expect(text).toContain(path.join(book, '本书记忆', '索引.md'))
    expect(text).toContain('目前没有本书记忆')
  })

  it('缺描述如实标注，旧格式文件整文件定位，正文不进', () => {
    const book = mkDir('abzu-catalog-book-')
    expect(writeBookMemory(book, { 类: '决策', 名称: '主角不下山', 正文: '第三章前不离开山门', 来源: '定稿/卷01/0001-开篇.md', 裁决记录: '作者批准' }).ok).toBe(true)
    fs.writeFileSync(path.join(book, '本书记忆', '文风.md'), '## 条目\n- 名称: 旧条\n', 'utf-8')
    const c = readBookMemoryCatalog(book)
    expect(c.状态).toBe('正常')
    expect(c.条目).toEqual([
      { 名称: '主角不下山', 类: '决策', 来源: '定稿/卷01/0001-开篇.md', 全文位置: '本书记忆/主角不下山.md' },
      { 名称: '文风', 类: '文风', 全文位置: '本书记忆/文风.md', 格式: '旧' },
    ])
    const text = renderMemoryCatalog(c, '选书时')
    expect(text).toContain('- 主角不下山 — （缺描述）｜类：决策')
    expect(text).toContain('- 文风（旧格式文件，一类一文件）｜文件：本书记忆/文风.md')
    expect(text).not.toContain('第三章前不离开山门')
  })

  it('0.0.50 退役类别（对话/灵感）的旧文件照常列出（只读兼容，不迁移）', () => {
    const book = mkDir('abzu-catalog-retired-')
    fs.mkdirSync(path.join(book, '本书记忆'))
    fs.writeFileSync(path.join(book, '本书记忆/对话.md'), '# 对话\n旧一类一文件正文')
    fs.writeFileSync(path.join(book, '本书记忆/灵感.md'), '# 灵感\n旧一类一文件正文')
    fs.writeFileSync(path.join(book, '本书记忆/旧语气.md'), '---\n名称: 旧语气\n类: 对话\n---\n旧条目正文')
    fs.writeFileSync(path.join(book, '本书记忆/索引.md'), '- [对话](对话.md) — 旧\n- [灵感](灵感.md) — 旧\n- [旧语气](旧语气.md) — 旧\n')
    const c = readBookMemoryCatalog(book)
    expect(c.状态).toBe('正常')
    expect(c.条目).toEqual([
      { 名称: '对话', 类: '对话', 全文位置: '本书记忆/对话.md', 格式: '旧' },
      { 名称: '旧语气', 类: '对话', 全文位置: '本书记忆/旧语气.md' },
      { 名称: '灵感', 类: '灵感', 全文位置: '本书记忆/灵感.md', 格式: '旧' },
    ])
    const text = renderMemoryCatalog(c, '选书时')
    expect(text).toContain('- 对话（旧格式文件，一类一文件）｜文件：本书记忆/对话.md')
    expect(text).toContain('- 旧语气 — （缺描述）｜类：对话')
    expect(text).not.toContain('旧一类一文件正文')
  })

  it('索引失效：新增/删除/改名后未重建索引，状态标失效并列出差异，旧条目仍可读', () => {
    const book = mkDir('abzu-catalog-stale-')
    writeBookMemory(book, { 类: '决策', 名称: '甲', 正文: 'a', 来源: '对谈', 裁决记录: '批准' })
    const dir = path.join(book, '本书记忆')
    fs.renameSync(path.join(dir, '甲.md'), path.join(dir, '乙.md'))
    const c = readBookMemoryCatalog(book)
    expect(c.状态).toBe('索引失效')
    expect(c.问题.join(';')).toContain('索引未收录：乙.md')
    expect(c.问题.join(';')).toContain('索引指向不存在的文件：甲.md')
    expect(c.条目.map((e) => e.全文位置)).toEqual(['本书记忆/乙.md'])
    expect(renderMemoryCatalog(c, '选书时')).toContain('索引失效：')
    fs.unlinkSync(path.join(dir, '索引.md'))
    const noIndex = readBookMemoryCatalog(book)
    expect(noIndex.状态).toBe('索引失效')
    expect(noIndex.问题.join(';')).toContain('索引文件不存在')
  })

  it('读取错误：条目文件坏了明确报出，其余条目照列，不伪造描述', () => {
    const book = mkDir('abzu-catalog-broken-')
    writeBookMemory(book, { 类: '决策', 名称: '好条', 正文: 'a', 来源: '对谈', 裁决记录: '批准' })
    const dir = path.join(book, '本书记忆')
    fs.writeFileSync(path.join(dir, '坏条.md'), '---\n名称: [\n---\n正文', 'utf-8')
    const c = readBookMemoryCatalog(book)
    expect(c.状态).toBe('读取错误')
    expect(c.问题.join(';')).toContain('解析失败：本书记忆/坏条.md')
    expect(c.条目.map((e) => e.名称)).toEqual(['好条'])
    const text = renderMemoryCatalog(c, '选书时')
    expect(text).toContain('读取错误：')
    expect(text).toContain('- 好条 — （缺描述）')
  })
})
