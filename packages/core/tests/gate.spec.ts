import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { classifyFileTool, decidePreExecute } from '../src/gate/preExecute'
import { reportDraftReadiness } from '../src/gate/writeDraft'
import { serializeDocument } from '../src/repo/frontmatter'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-gate-'))
  roots.push(dir)
  return dir
}
function put(root: string, rel: string, content: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  fs.writeFileSync(path.join(root, rel), content, 'utf-8')
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

function write(file_path: string) {
  return { name: 'write', arguments: { file_path } }
}

describe('文件门禁(不变量 4/5)', () => {
  it('允许写入草稿区/章细纲/', () => {
    const root = mkBook()
    const d = decidePreExecute(root, write(path.join(root, '草稿区/章细纲/卷01-初见.md')))
    expect(d).toEqual({ kind: 'allow' })
  })

  it('拒绝写入定稿/', () => {
    const root = mkBook()
    const d = decidePreExecute(root, write(path.join(root, '定稿/卷01/0001-初见.md')))
    expect(d.kind).toBe('deny')
    if (d.kind === 'deny') expect(d.reason).toMatch(/定稿区只读/)
  })

  it('拒绝写入构想/', () => {
    const root = mkBook()
    const d = decidePreExecute(root, write(path.join(root, '构想/构想快照.md')))
    expect(d.kind).toBe('deny')
    if (d.kind === 'deny') expect(d.reason).toMatch(/构想快照建书后只读/)
  })

  it('拒绝写入故事剧情/(真源,非文件工具)', () => {
    const root = mkBook()
    const d = decidePreExecute(root, write(path.join(root, '故事剧情/全书大纲.md')))
    expect(d.kind).toBe('deny')
    if (d.kind === 'deny') expect(d.reason).toMatch(/真源区.*文件工具不得改写/)
  })

  it('路径逃逸拒绝', () => {
    const root = mkBook()
    const escaped = decidePreExecute(root, write(path.join(root, '..', '越界.md')))
    expect(escaped.kind).toBe('deny')
    if (escaped.kind === 'deny') expect(escaped.reason).toMatch(/路径逃逸书仓根/)
  })

  it('改写工具缺路径→拒绝', () => {
    const root = mkBook()
    expect(decidePreExecute(root, { name: 'write', arguments: {} }).kind).toBe('deny')
    expect(decidePreExecute(root, { name: 'edit', arguments: { path: '草稿区/x.md' } }).kind).toBe('deny')
  })

  it('内部收据路径在创建前后都受保护，Windows 别名不能绕过', () => {
    const root = mkBook()
    for (const dir of ['.archive-receipts', '.author-edits']) {
      const exact = path.join(root, '草稿区', dir, 'receipt.json')
      expect(decidePreExecute(root, write(exact)).kind).toBe('deny')
      for (const alias of [dir.toUpperCase(), dir.toUpperCase() + '.', dir.toUpperCase() + ' ']) {
        const target = path.join(root, '草稿区', alias, 'receipt.json')
        expect(decidePreExecute(root, write(target)).kind).toBe(process.platform === 'win32' ? 'deny' : 'allow')
      }
      const actual = path.join(root, '草稿区', dir.toUpperCase(), 'receipt.json')
      put(root, path.relative(root, actual), 'trusted receipt')
      expect(decidePreExecute(root, write(actual)).kind).toBe(process.platform === 'win32' ? 'deny' : 'allow')
      if (process.platform === 'win32') expect(decidePreExecute(root, write(exact)).kind).toBe('deny')
      expect(fs.readFileSync(actual, 'utf8')).toBe('trusted receipt')
    }
    expect(decidePreExecute(root, write(path.join(root, '草稿区/章细纲/正常.md'))).kind).toBe('allow')
  })
})

describe('写稿门槛(R1 落码:播报不拒绝)', () => {
  it('未确认细纲:放行写入,readiness 如实播报', () => {
    const root = mkBook()
    const rel = '草稿区/草稿/卷01-初见/稿1.md'
    const d = decidePreExecute(root, write(path.join(root, rel)))
    expect(d).toEqual({ kind: 'allow' })
    const r = reportDraftReadiness(root, rel)
    expect(r?.细纲已确认).toBe(false)
    expect(r?.说明).toMatch(/细纲未确认/)
  })

  it('材料包组装中:放行写入,readiness 播报材料包状态', () => {
    const root = mkBook()
    put(root, '故事剧情/卷规划/卷01/章细纲/0003-初见.md', serializeDocument({ 状态: '已确认' }, '细纲'))
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '组装中' }))
    const rel = '草稿区/草稿/卷01-初见/稿1.md'
    expect(decidePreExecute(root, write(path.join(root, rel)))).toEqual({ kind: 'allow' })
    const r = reportDraftReadiness(root, rel)
    expect(r?.细纲已确认).toBe(true)
    expect(r?.材料包状态).toBe('组装中')
  })

  it('草稿路径无法解析章节键→拒绝(路径形状校验保留)', () => {
    const root = mkBook()
    const d = decidePreExecute(root, write(path.join(root, '草稿区/草稿/随意路径/稿1.md')))
    expect(d.kind).toBe('deny')
    if (d.kind === 'deny') expect(d.reason).toMatch(/章节键/)
  })

  it('确认细纲+材料包段齐备→允许写草稿,readiness 全绿(说明不含材料包段)', () => {
    const root = mkBook()
    put(root, '故事剧情/卷规划/卷01/章细纲/0003-初见.md', serializeDocument({ 状态: '已确认' }, '细纲'))
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    const rel = '草稿区/草稿/卷01-初见/稿1.md'
    const d = decidePreExecute(root, write(path.join(root, rel)))
    expect(d).toEqual({ kind: 'allow' })
    const r = reportDraftReadiness(root, rel)
    expect(r?.细纲已确认).toBe(true)
    expect(r?.材料包状态).toBe('段齐备')
    expect(r?.说明).not.toMatch(/材料包/)
  })

  it('对照:材料包段有缺→仍放行写入(R1 播报不拒绝),readiness 追加播报材料包段有缺', () => {
    const root = mkBook()
    put(root, '故事剧情/卷规划/卷01/章细纲/0003-初见.md', serializeDocument({ 状态: '已确认' }, '细纲'))
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段有缺' }))
    const rel = '草稿区/草稿/卷01-初见/稿1.md'
    const d = decidePreExecute(root, write(path.join(root, rel)))
    expect(d).toEqual({ kind: 'allow' })
    const r = reportDraftReadiness(root, rel)
    expect(r?.材料包状态).toBe('段有缺')
    expect(r?.说明).toBe('细纲已确认;材料包段有缺')
  })
})

describe('str_replace_editor 命令分流', () => {
  it('view 允许读定稿;str_replace 拒绝', () => {
    const root = mkBook()
    const dest = path.join(root, '定稿/卷01/0001-初见.md')
    const view = decidePreExecute(root, { name: 'str_replace_editor', arguments: { command: 'view', path: dest } })
    expect(view).toEqual({ kind: 'allow' })
    const edit = decidePreExecute(root, { name: 'str_replace_editor', arguments: { command: 'str_replace', path: dest } })
    expect(edit.kind).toBe('deny')
  })
})

describe('D-1 文件工具分类（带路径默认拦、登记过才放行）', () => {
  it('已登记只读工具：read / read_image 带 file_path → allow', () => {
    const root = mkBook()
    expect(decidePreExecute(root, { name: 'read', arguments: { file_path: path.join(root, '定稿/卷01/0001-初见.md') } })).toEqual({ kind: 'allow' })
    expect(decidePreExecute(root, { name: 'read_image', arguments: { file_path: path.join(root, '草稿区/插图.png') } })).toEqual({ kind: 'allow' })
    expect(classifyFileTool({ name: 'read_image', arguments: { file_path: 'x.png' } })).toBe('read-only')
  })

  it('str_replace_editor{command:view} → read-only（回归钉子：判定顺序不能换）', () => {
    const root = mkBook()
    expect(classifyFileTool({ name: 'str_replace_editor', arguments: { command: 'view', path: 'x.md' } })).toBe('read-only')
    expect(decidePreExecute(root, { name: 'str_replace_editor', arguments: { command: 'view', path: path.join(root, '定稿/卷01/0001-初见.md') } })).toEqual({ kind: 'allow' })
  })

  it('str_replace_editor{command:create} 打定稿 → deny（既有行为不变）', () => {
    const root = mkBook()
    const d = decidePreExecute(root, { name: 'str_replace_editor', arguments: { command: 'create', path: path.join(root, '定稿/卷01/0001-初见.md') } })
    expect(d.kind).toBe('deny')
    if (d.kind === 'deny') expect(d.reason).toMatch(/定稿区只读/)
  })

  it('未登记却带 path 的工具 → ask，reason 指名工具（fail-closed，不误 deny）', () => {
    const root = mkBook()
    expect(classifyFileTool({ name: 'apply_patch', arguments: { path: '草稿区/x.md' } })).toBe('unknown')
    expect(decidePreExecute(root, { name: 'apply_patch', arguments: { path: '草稿区/x.md' } })).toEqual({
      kind: 'ask',
      reason: '未登记的文件工具 apply_patch 携带路径参数，无法判定只读或改写，需作者确认',
    })
  })

  it('不碰路径参数的工具 → unrelated / allow（今天零行为变化的那一类）', () => {
    const root = mkBook()
    expect(classifyFileTool({ name: 'todo_write', arguments: { todos: [] } })).toBe('unrelated')
    expect(classifyFileTool({ name: 'novel_get_story_status', arguments: { bookId: 'b-1' } })).toBe('unrelated')
    expect(decidePreExecute(root, { name: 'todo_write', arguments: { todos: [] } })).toEqual({ kind: 'allow' })
  })

  it('write 缺 file_path → deny（既有 fail-closed 不变）', () => {
    const root = mkBook()
    expect(classifyFileTool({ name: 'write', arguments: {} })).toBe('mutating')
    expect(decidePreExecute(root, { name: 'write', arguments: {} }).kind).toBe('deny')
  })
})
