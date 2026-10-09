import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createNovelTools } from '../src/novel-tools'
import { nativeWriteStub } from './fixtures/native-write-stub'

/**
 * 真机缺陷回归（20章连写第2章，D-004）：模型漏传必填的 卷 参数，Number(undefined)=NaN
 * 拼出「卷NaN-章名」路径，错误被报成「无待审稿」——工具不校验章键参数，真实原因被掩盖。
 * 修复：章键工具先校验 卷/章/章名，返回指明缺失参数的明确原因。
 */
function makeBook(): { ws: string; bookRoot: string } {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-keycheck-'))
  const bookRoot = path.join(ws, '探书')
  fs.mkdirSync(path.join(bookRoot, '作品契约'), { recursive: true })
  fs.writeFileSync(path.join(bookRoot, '作品契约', '契约.md'), '---\n书id: probe-key\n---\n正文\n', 'utf-8')
  return { ws, bookRoot }
}

describe('章键参数校验（D-004 回归）', () => {
  it('漏传 卷/章 或空章名时给出指明参数的明确原因，不报「无待审稿」', async () => {
    const { ws, bookRoot } = makeBook()
    const tools = createNovelTools({ nativeWrite: nativeWriteStub, workspaceRoot: () => ws, bookRootOfBookId: () => bookRoot })
    const call = (name: string, a: Record<string, unknown>) => tools.find((t) => t.name === name)!.execute(a)
    for (const name of ['novel_prepare_pack', 'novel_confirm_outline', 'novel_assemble_materials', 'novel_record_review_findings']) {
      const missing卷 = await call(name, { bookId: 'probe-key', 章: 1, 章名: '探章', 模块名: '章节结构审读', 发现项: [] }) as { ok: boolean; reason?: string }
      expect(missing卷.ok, name).toBe(false)
      expect(missing卷.reason, name).toContain('卷')
      expect(missing卷.reason, name).not.toContain('无待审稿')
      const missing章 = await call(name, { bookId: 'probe-key', 卷: 1, 章名: '探章', 模块名: '章节结构审读', 发现项: [] }) as { ok: boolean; reason?: string }
      expect(missing章.ok, name).toBe(false)
      expect(missing章.reason, name).toContain('章')
      const blank章名 = await call(name, { bookId: 'probe-key', 卷: 1, 章: 1, 章名: ' ', 模块名: '章节结构审读', 发现项: [] }) as { ok: boolean; reason?: string }
      expect(blank章名.ok, name).toBe(false)
      expect(blank章名.reason, name).toContain('章名')
    }
    const float = await call('novel_prepare_pack', { bookId: 'probe-key', 卷: 1.5, 章: 1, 章名: '探章' }) as { ok: boolean; reason?: string }
    expect(float.ok).toBe(false)
    expect(float.reason).toContain('正整数')
    fs.rmSync(ws, { recursive: true, force: true, maxRetries: 5 })
  })

  it('非法章名(路径白名单)在 prepare/settle 工具层被拒且不产生半截文件', async () => {
    const { ws, bookRoot } = makeBook()
    // 裁决通道注入只会抛错的假 askFn:非法章名应在询问作者之前就被拒
    const askFn = async () => { throw new Error('不应询问作者') }
    const tools = createNovelTools({ nativeWrite: nativeWriteStub, workspaceRoot: () => ws, bookRootOfBookId: () => bookRoot, askFn })
    const call = (name: string, a: Record<string, unknown>) => tools.find((t) => t.name === name)!.execute(a)
    for (const 章名 of ['a/b', '尾点.', '带\x07控制符']) {
      const prep = await call('novel_prepare_pack', { bookId: 'probe-key', 卷: 1, 章: 1, 章名 }) as { ok: boolean; reason?: string }
      expect(prep.ok, 章名).toBe(false)
      expect(prep.reason, 章名).toContain('章名')
      const settle = await call('novel_settle_chapter', { bookId: 'probe-key', 卷: 1, 章: 1, 章名, summary: 'x' }) as { ok: boolean; reason?: string }
      expect(settle.ok, 章名).toBe(false)
      expect(settle.reason, 章名).toContain('章名')
    }
    expect(fs.existsSync(path.join(bookRoot, '草稿区'))).toBe(false)
    expect(fs.existsSync(path.join(bookRoot, '定稿'))).toBe(false)
    fs.rmSync(ws, { recursive: true, force: true, maxRetries: 5 })
  })
})
