import { describe, expect, it, vi } from 'vitest'
import { assertObjectJsonSchema, jsonSchemaToTs, validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import { createNovelTools } from '../src/novel-tools'
import { createReferenceTools } from '../src/reference/tools'

const metadata = { title: '测试', author: '作者', edition: '1', acquiredFrom: '自造', allowedUses: '测试', basis: '自造', basisKind: 'user-declaration' }
const reference = { 参考书: 'ref-test', 原文版本: 'r1', 机制: 'm1', 机制版本: 1 }
const valid: Array<[string, Record<string, unknown>]> = [
  ['source', { action: 'preview', filename: '测试.txt', encoding: 'gb18030' }],
  ['source', { action: 'import', filename: '测试.txt', metadata, expectedSourceHash: 'hash' }],
  ['source', { action: 'list' }],
  ['source', { action: 'check', sourceId: 'ref-test' }],
  ['source', { action: 'delete', sourceId: 'ref-test' }],
  ['analyze', { action: 'plan', sourceId: 'ref-test', ranges: 'all' }],
  ['analyze', { action: 'plan', sourceId: 'ref-test', ranges: [{ unitId: 'u1', start: 0, end: 1 }] }],
  ['analyze', { action: 'run', sourceId: 'ref-test', planId: 'p1' }],
  ['analyze', { action: 'run', sourceId: 'ref-test', planId: 'p1', allowProcessing: false }],
  ['analyze', { action: 'status', sourceId: 'ref-test' }],
  ['analyze', { action: 'recover', sourceId: 'ref-test' }],
  ['query', { action: 'search', query: '', tags: ['人物'] }],
  ['query', { action: 'evidence', sourceId: 'ref-test', evidenceId: 'e1', allowInChat: true }],
  ['report', { action: 'build', sourceId: 'ref-test' }],
  ['report', { action: 'save-idea', body: '点子', operationId: 'op1', references: [reference] }],
]

describe('model-facing tool input schemas (#185)', () => {
  it('all novel tools declare an explicit object root', () => {
    const tools = createNovelTools({ workspaceRoot: () => undefined, bookRootOfBookId: () => undefined, testTools: true })
    expect(tools.length).toBeGreaterThan(4)
    for (const tool of tools) {
      expect(tool.parameters.type, tool.name).toBe('object')
    }
  })

  it('reference tool parameters retain useful PTC argument types', () => {
    for (const tool of createReferenceTools({ workspaceRoot: () => undefined })) {
      expect(() => assertObjectJsonSchema(tool.parameters), tool.name).not.toThrow()
      const rendered = jsonSchemaToTs(tool.parameters)
      expect(rendered, tool.name).not.toBe('unknown')
      expect(rendered, tool.name).toContain('action')
    }
  })

  it.each(valid)('%s accepts existing arguments %j in both schema and execution', async (suffix, args) => {
    const workspaceRoot = vi.fn(() => undefined)
    const tool = createReferenceTools({ workspaceRoot }).find(tool => tool.name === `novel_reference_${suffix}`)!
    assertObjectJsonSchema(tool.parameters)
    expect(validateJsonSchemaValue(tool.parameters, args)).toEqual([])
    // Reaching the workspace check proves argument validation did not reject a valid operation.
    expect(await tool.execute(args)).toMatchObject({ ok: false, code: 'workspace-missing' })
    expect(workspaceRoot).toHaveBeenCalledOnce()
  })

  it.each([
    ['source', { action: 'preview' }],
    ['source', { action: 'preview', filename: '测试.txt', encoding: 'invalid' }],
    ['source', { action: 'import', filename: '测试.txt', metadata }],
    ['source', { action: 'import', filename: '测试.txt', metadata: { ...metadata, basisKind: 'invalid' }, expectedSourceHash: 'hash' }],
    ['source', { action: 'list', filename: '测试.txt' }],
    ['source', { action: 'delete' }],
    ['analyze', { action: 'plan', sourceId: 'ref-test' }],
    ['analyze', { action: 'plan', sourceId: 'ref-test', ranges: [{ unitId: 'u1', start: '0', end: 1 }] }],
    ['analyze', { action: 'run', sourceId: 'ref-test' }],
    ['analyze', { action: 'run', sourceId: 'ref-test', planId: 'p1', allowProcessing: 'true' }],
    ['analyze', { action: 'status', sourceId: 'ref-test', unknown: true }],
    ['query', { action: 'search' }],
    ['query', { action: 'evidence', sourceId: 'ref-test', evidenceId: 'e1', allowInChat: false }],
    ['report', { action: 'save-idea', body: '点子', references: [reference] }],
    ['report', { action: 'save-idea', body: '点子', operationId: 'op1', references: [{ ...reference, 机制版本: '1' }] }],
  ] satisfies Array<[string, Record<string, unknown>]>)('%s rejects invalid action arguments before IO: %j', async (suffix, args) => {
    const workspaceRoot = vi.fn(() => undefined)
    const tool = createReferenceTools({ workspaceRoot }).find(tool => tool.name === `novel_reference_${suffix}`)!
    expect(await tool.execute(args)).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(workspaceRoot).not.toHaveBeenCalled()
  })

  it('rejects unknown actions before IO', async () => {
    const workspaceRoot = vi.fn(() => undefined)
    for (const tool of createReferenceTools({ workspaceRoot })) {
      expect(await tool.execute({ action: 'unknown' })).toMatchObject({ ok: false, code: 'invalid-action' })
    }
    expect(workspaceRoot).not.toHaveBeenCalled()
  })
})

describe('统一入参校验（P2-2：注册面单源，execute 前按 schema 先拒）', () => {
  const tools = createNovelTools({ workspaceRoot: () => undefined, bookRootOfBookId: () => undefined, testTools: true })
  const call = async (name: string, args: Record<string, unknown>) =>
    await tools.find((t) => t.name === name)!.execute(args) as { ok: boolean; code?: string; reason?: string }

  it('缺必填参数在进 execute 前被拒，错误点名缺失参数', async () => {
    const r = await call('novel_select_book', {})
    expect(r).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(r.reason).toContain('bookId')
    expect(r.reason).toContain('novel_select_book')
  })

  it('参数类型不符被拒（relPath 非字符串、卷为字符串）', async () => {
    const r = await call('novel_note_pending', { bookId: 'b', relPath: 123, 节名: '线索' })
    expect(r).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(r.reason).toContain('relPath')
    const r2 = await call('novel_confirm_outline', { bookId: 'b', 卷: '1', 章: 1, 章名: 'x' })
    expect(r2).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(r2.reason).toContain('卷')
  })

  it('枚举外的值被拒，不再静默强转（决定/角色等词表落地）', async () => {
    const r = await call('novel_resolve_proposal', { bookId: 'b', 提案编号: '0001', 决定: '搁置', 裁决记录: 'x' })
    expect(r).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(r.reason).toContain('决定')
    const r2 = await call('novel_import_draft', { bookId: 'b', 卷: 1, 章: 1, 章名: 'x', 正文: 'y', 角色: '草', 生成模块: '作者手写' })
    expect(r2).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(r2.reason).toContain('角色')
  })

  it('声明 additionalProperties:false 的工具连未知字段一起拒', async () => {
    const r = await call('novel_reference_analyze', { action: 'status', sourceId: 'ref-test', unknown: true })
    expect(r).toMatchObject({ ok: false, code: 'invalid-args' })
    expect(r.reason).toContain('unknown')
  })

  it('schema 合法的调用照常到达 execute，不被校验层误伤', async () => {
    // bookId 齐备但书不存在：应到达 resolveBook 并报书id不存在，而非 invalid-args
    const r = await call('novel_get_story_status', { bookId: 'no-such' })
    expect(r).toMatchObject({ ok: false })
    expect(r.code).toBeUndefined()
    expect(r.reason).toContain('书id不存在')
  })

  it('全部注册工具（含 reference 四件与 seed）都套了统一校验：违规理由带工具名', async () => {
    expect(tools.length).toBeGreaterThan(20)
    for (const tool of tools) {
      const r = await tool.execute({}) as { ok?: boolean; code?: string; reason?: string }
      expect(r?.ok, tool.name).toBe(false)
      // 每个工具至少有一个必填参数（seed/最简工具也要求 bookId）；无必填者不适用本断言
      if ((tool.parameters as { required?: string[] }).required?.length) {
        expect(r?.code, tool.name).toBe('invalid-args')
        expect(r?.reason, tool.name).toContain(tool.name)
      }
    }
  })
})
