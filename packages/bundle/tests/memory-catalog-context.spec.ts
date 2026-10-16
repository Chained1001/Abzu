import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { writeBookMemory } from '@abzu/core'
import { bookMemoryCatalogText } from '../src/status-context'
import { createNovelTools } from '../src/novel-tools'
import { nativeWriteStub } from './fixtures/native-write-stub'
import { removeSync } from '../../core/src/repo/remove'

const roots: string[] = []
afterAll(() => roots.forEach(root => removeSync(root)))
function makeWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-memctx-'))
  roots.push(dir)
  const book = path.join(dir, '星辰')
  fs.mkdirSync(path.join(book, '作品契约'), { recursive: true })
  fs.writeFileSync(path.join(book, '作品契约/契约.md'), '---\n书id: xingchen-001\n---\n正文\n')
  return dir
}

describe('本书记忆目录：随选书结果返回（15A；0.0.50 起会话开始的作者记忆目录注入已删除）', () => {
  it('novel_select_book 成功返回 记忆目录（选书时快照）；普通查询不附目录；切书换书目录', async () => {
    const ws = makeWorkspace()
    const bookRoot = path.join(ws, '星辰')
    writeBookMemory(bookRoot, { 类: '决策', 名称: '不写系统', 正文: '全书无系统面板', 来源: '定稿/卷01/0001-开篇.md', 裁决记录: '作者批准' })
    const tools = createNovelTools({ nativeWrite: nativeWriteStub, workspaceRoot: () => ws, bookRootOfBookId: () => bookRoot })
    const select = tools.find((t) => t.name === 'novel_select_book')!
    const res = (await select.execute({ bookId: 'xingchen-001' })) as { ok: boolean; bookId: string; 记忆目录: string; message: string }
    expect(res.ok).toBe(true)
    expect(res.bookId).toBe('xingchen-001')
    expect(res.记忆目录).toContain('【本书记忆目录】选书时')
    expect(res.记忆目录).toContain('- 不写系统 — （缺描述）｜类：决策')
    expect(res.记忆目录).toContain(path.join(bookRoot, '本书记忆', '索引.md'))
    expect(res.记忆目录).not.toContain('全书无系统面板')
    expect(res.message).not.toContain('记忆目录')
    const status = tools.find((t) => t.name === 'novel_get_story_status')!
    const statusRes = (await status.execute({ bookId: 'xingchen-001' })) as Record<string, unknown>
    expect(statusRes['记忆目录']).toBeUndefined()
    expect(JSON.stringify(statusRes)).not.toContain('记忆目录')
    // 切书：另一本书返回自己的目录
    const other = path.join(ws, '夜航')
    fs.mkdirSync(path.join(other, '作品契约'), { recursive: true })
    fs.writeFileSync(path.join(other, '作品契约/契约.md'), '---\n书id: yehang-002\n---\n', 'utf8')
    const res2 = (await select.execute({ bookId: 'yehang-002' })) as { ok: boolean; 记忆目录: string }
    expect(res2.ok).toBe(true)
    expect(res2.记忆目录).toContain('目前没有本书记忆')
    expect(res2.记忆目录).toContain(path.join(other, '本书记忆', '索引.md'))
    expect(res2.记忆目录).not.toContain('不写系统')
    // 选书失败不带目录
    const bad = (await select.execute({ bookId: '不存在' })) as Record<string, unknown>
    expect(bad['ok']).toBe(false)
    expect(bad['记忆目录']).toBeUndefined()
    expect(bookMemoryCatalogText(path.join(ws, '不存在的书'))).toContain('目前没有本书记忆')
  })
})
