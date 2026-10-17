/**
 * 0.0.65 第一批「声明-实现一致性」门禁不变量。
 *
 * 只断言决策对象与行为,不做逐字提示词断言。三层声明各一组:
 * 1. 单源判定:bundle `decideTargetForFile` 与 core `decidePreExecute` 对同一书仓、
 *    同一目标(书id:相对 / 书仓绝对两种输入形态)必须同判(allow/deny 与 reason)。
 * 2. 监听面:`attachFileGateToAgent` 注册的 tools/pre-execute listener 在
 *    agent 缺失、未登记工具、缺路径、合法草稿、定稿、受信原生写入下的行为。
 * 3. 注册面:无 on → undefined;有 on → 交回可调用一次的注销函数;on 抛错 → fail-open。
 *
 * 不依赖真实宿主:工作区用 mkdtemp 合成,ctx 桩只记录 on/off。
 * 复用说明:lifecycle.spec.ts 的 makeAgentCtx 是文件内私有函数(导入 spec 会顺带执行其用例),
 * 无法复用;这里只保留 8 行 on/off 记录桩,不复制其宿主/依赖注入基础设施。
 */

import { afterAll, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { decidePreExecute, type ToolCall } from '@abzu/core'
import {
  attachFileGateToAgent,
  decideTargetForFile,
  type GateDeps,
  type PreToolExec,
} from '../src/gates'

const BOOK_ID = 'xingchen-001'
const roots: string[] = []

afterAll(() => {
  for (const root of roots) {
    try {
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    } catch { /* Windows 句柄延迟释放,%TEMP% 残留不影响结论 */ }
  }
})

/** 合成工作范围:书仓(草稿区/定稿/构想/作品契约)+ 书房 + 参考书机器状态目录。 */
function makeWorkspace(): { ws: string; bookRoot: string } {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-gate-inv-'))
  roots.push(ws)
  const bookRoot = path.join(ws, '星辰')
  for (const dir of [
    '草稿区/章细纲',
    '草稿区/草稿/卷01-第一章',
    '定稿/卷01',
    '构想',
    '作品契约',
    '大纲',
  ]) {
    fs.mkdirSync(path.join(bookRoot, dir), { recursive: true })
  }
  fs.mkdirSync(path.join(ws, '书房', '知识库'), { recursive: true })
  fs.mkdirSync(path.join(ws, '书房', '参考书', '某书', '.abzu'), { recursive: true })
  return { ws, bookRoot }
}

function depsOf(ws: string, bookRoot: string, extra: Partial<GateDeps> = {}): GateDeps {
  return {
    bookRootOfId: (id) => (id === BOOK_ID ? bookRoot : undefined),
    bookRootForAbs: (abs) => {
      const rel = path.relative(bookRoot, abs)
      return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel) ? bookRoot : undefined
    },
    workspaceRoot: () => ws,
    ...extra,
  }
}

function writeCall(filePath: string): ToolCall {
  return { name: 'write', arguments: { file_path: filePath, content: '正文' } }
}

// ---------------------------------------------------------------------------
// 1. bundle vs core:同一书仓、同一目标同判
// ---------------------------------------------------------------------------

const DRAFT_REL = '草稿区/章细纲/0001-第一章.md'
const DRAFT_CHAPTER_REL = '草稿区/草稿/卷01-第一章/稿1.md'
const FINAL_REL = '定稿/卷01/0001-第一章.md'
const CONCEPT_REL = '构想/构想快照.md'
const CANON_REL = '作品契约/契约.md'
const ESCAPE_REL = '../书仓外.md'

/** 两种输入形态:书id:仓内相对 / 书仓绝对(同一物理目标)。 */
const INPUT_FORMS = [
  { form: '书id:仓内相对', target: (bookRoot: string, rel: string) => `${BOOK_ID}:${rel}` },
  { form: '书仓绝对路径', target: (bookRoot: string, rel: string) => path.resolve(bookRoot, rel) },
]

const COMPARABLE_ROWS: ReadonlyArray<{ name: string; rel: string; expected: 'allow' | 'deny' }> = [
  { name: '合法草稿(章细纲)', rel: DRAFT_REL, expected: 'allow' },
  { name: '合法草稿(卷/章稿)', rel: DRAFT_CHAPTER_REL, expected: 'allow' },
  { name: '定稿', rel: FINAL_REL, expected: 'deny' },
  { name: '构想', rel: CONCEPT_REL, expected: 'deny' },
  { name: '真源(作品契约)', rel: CANON_REL, expected: 'deny' },
]

describe.each(INPUT_FORMS)('与 core 对同一书仓目标同判($form)', ({ target }) => {
  it.each(COMPARABLE_ROWS)('$name → $expected', (row) => {
    const { ws, bookRoot } = makeWorkspace()
    const bundle = decideTargetForFile(target(bookRoot, row.rel), depsOf(ws, bookRoot))
    const core = decidePreExecute(bookRoot, writeCall(path.resolve(bookRoot, row.rel)))

    expect(bundle.kind, 'bundle 判定').toBe(row.expected)
    expect(core.kind, 'core 判定').toBe(row.expected)
    expect(bundle.kind, 'bundle 与 core 必须同判').toBe(core.kind)
    if (bundle.kind === 'deny' && core.kind === 'deny') {
      expect(bundle.reason, '同一条路径两侧应给出同一拒绝原因').toBe(core.reason)
    }
  })
})

describe('core 无法表达的输入域(bundle 前置)', () => {
  it('书id:../ 逃逸:bundle 与 core 同判 deny,原因同为书仓逃逸', () => {
    const { ws, bookRoot } = makeWorkspace()
    const bundle = decideTargetForFile(`${BOOK_ID}:${ESCAPE_REL}`, depsOf(ws, bookRoot))
    const core = decidePreExecute(bookRoot, writeCall(path.resolve(bookRoot, ESCAPE_REL)))

    expect(bundle.kind).toBe('deny')
    expect(core.kind).toBe('deny')
    if (bundle.kind === 'deny' && core.kind === 'deny') {
      expect(bundle.reason).toBe(core.reason)
    }
  })

  it('绝对路径落在书仓外(仍在工作范围内):bundle ask,core deny——输入域不同,不是矛盾', () => {
    const { ws, bookRoot } = makeWorkspace()
    const outside = path.resolve(bookRoot, ESCAPE_REL)
    const bundle = decideTargetForFile(outside, depsOf(ws, bookRoot))
    // 绝对路径归属由书架扫描决定;扫描不到即逐次确认(N10),不冒充 core 的逃逸拒绝。
    expect(bundle.kind).toBe('ask')
    expect(decidePreExecute(bookRoot, writeCall(outside)).kind).toBe('deny')
  })

  it('未知书id:bundle 拒绝(书id 须已在书架扫描中发现),core 无对应入参', () => {
    const { ws, bookRoot } = makeWorkspace()
    const d = depsOf(ws, bookRoot)
    const unknown = decideTargetForFile('ghost:草稿区/章细纲/0001-第一章.md', d)
    expect(unknown.kind).toBe('deny')
    // 同 id 换成书仓绝对路径仍可判(书id 解析只挡复合输入),证明拒绝来自书id而非路径。
    expect(decideTargetForFile(path.join(bookRoot, DRAFT_REL), d)).toEqual({ kind: 'allow' })
  })

  it('工作范围未就绪:bundle 先于分区 fail-closed;core 无 workspace 入参→仍是 allow', () => {
    const { ws, bookRoot } = makeWorkspace()
    const stripped = depsOf(ws, bookRoot, { workspaceRoot: () => undefined })
    for (const target of [
      `${BOOK_ID}:${DRAFT_REL}`,
      path.join(bookRoot, DRAFT_REL),
      path.join(ws, '书房', '知识库', '技法.md'),
    ]) {
      expect(decideTargetForFile(target, stripped).kind, target).toBe('deny')
    }
    // 记录分层事实:该不变量只能由 bundle 前置守;core 单用会放行草稿。
    expect(decidePreExecute(bookRoot, writeCall(path.join(bookRoot, DRAFT_REL)))).toEqual({ kind: 'allow' })
  })
})

// ---------------------------------------------------------------------------
// 2. tools/pre-execute listener 行为
// ---------------------------------------------------------------------------

type GateListener = (exec: PreToolExec | undefined, next: () => Promise<unknown>) => Promise<unknown>

interface AttachedGate {
  readonly registered: Array<{ event: string; listener: GateListener }>
  readonly offCalls: string[]
  readonly undo: (() => void) | undefined
  readonly deps: GateDeps
}

/** 最小 agent ctx 桩:记录注册的监听与注销调用,不模拟宿主其余表面。 */
function attachGate(ws: string, bookRoot: string, extra: Partial<GateDeps> = {}): AttachedGate {
  const registered: Array<{ event: string; listener: GateListener }> = []
  const offCalls: string[] = []
  const ctx = {
    on: (event: string, listener: GateListener) => {
      registered.push({ event, listener })
      return () => { offCalls.push(event) }
    },
  }
  const deps = depsOf(ws, bookRoot, extra)
  return { registered, offCalls, undo: attachFileGateToAgent(ctx as never, deps), deps }
}

/** 取出唯一监听并触发一次;next 是哨兵,区分「放行」与「决策对象」。 */
async function fire(gate: AttachedGate, exec: unknown): Promise<{ result: unknown; next: ReturnType<typeof vi.fn> }> {
  expect(gate.registered).toHaveLength(1)
  const entry = gate.registered[0]!
  expect(entry.event).toBe('tools/pre-execute')
  const next = vi.fn(async () => 'NEXT')
  const result = await entry.listener(exec as PreToolExec | undefined, next)
  return { result, next }
}

describe('attachFileGateToAgent listener 行为', () => {
  it('exec 缺失或 exec.agent 缺失 → 直接 next,不落任何路径判定', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    const finalFile = path.join(bookRoot, FINAL_REL)
    for (const exec of [
      undefined,
      { name: 'write', arguments: { file_path: finalFile } },
    ]) {
      const { result, next } = await fire(gate, exec)
      expect(result).toBe('NEXT')
      expect(next).toHaveBeenCalledTimes(1)
    }
  })

  it('未登记工具携带 file_path/path → ask,不给更强的 deny/allow', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    for (const exec of [
      { agent: { id: 'main' }, name: 'apply_patch', arguments: { path: '草稿区/章细纲/x.md' } },
      { agent: { id: 'main' }, name: 'mystery_writer', arguments: { file_path: path.join(bookRoot, DRAFT_REL) } },
    ]) {
      const { result, next } = await fire(gate, exec)
      expect(result).toMatchObject({ kind: 'ask' })
      expect(next).not.toHaveBeenCalled()
    }
  })

  it('改写工具缺路径 → deny(fail-closed),edit 只认 file_path', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    for (const exec of [
      { agent: { id: 'main' }, name: 'write', arguments: { content: '正文' } },
      { agent: { id: 'main' }, name: 'edit', arguments: { path: '草稿区/章细纲/x.md' } },
    ]) {
      const { result, next } = await fire(gate, exec)
      expect(result).toMatchObject({ kind: 'deny' })
      expect(next).not.toHaveBeenCalled()
    }
  })

  it('书仓草稿区合法目标 → next(绝对与 书id:相对 两种输入形态)', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    for (const target of [
      path.join(bookRoot, DRAFT_REL),
      `${BOOK_ID}:${DRAFT_CHAPTER_REL}`,
    ]) {
      const { result, next } = await fire(gate, {
        agent: { id: 'main' },
        name: 'write',
        arguments: { file_path: target, content: '正文' },
      })
      expect(result).toBe('NEXT')
      expect(next).toHaveBeenCalledTimes(1)
    }
  })

  it('书仓定稿 → deny,且与 decideTargetForFile 是同一决策(单源)', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    const finalFile = path.join(bookRoot, FINAL_REL)
    const { result, next } = await fire(gate, {
      agent: { id: 'main' },
      name: 'write',
      arguments: { file_path: finalFile, content: '正文' },
    })
    expect(result).toEqual(decideTargetForFile(finalFile, gate.deps))
    expect(result).toMatchObject({ kind: 'deny' })
    expect(next).not.toHaveBeenCalled()
  })

  it('已登记只读工具即使目标定稿 → next(只读不经可写分区判定)', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    const { result, next } = await fire(gate, {
      agent: { id: 'main' },
      name: 'read',
      arguments: { file_path: path.join(bookRoot, FINAL_REL) },
    })
    expect(result).toBe('NEXT')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('参考书机器状态(.abzu)先于工具分类 deny:只读工具也不放行', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    const machineState = path.join(ws, '书房', '参考书', '某书', '.abzu', 'state.json')
    const { result, next } = await fire(gate, {
      agent: { id: 'main' },
      name: 'read',
      arguments: { file_path: machineState },
    })
    expect(result).toMatchObject({ kind: 'deny' })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('trustedNativeWrite 精确授权语义(不伪造 bridge)', () => {
  it('仅同一 exec 实例返回 true → 直接 next;同形不同 callId 仍走门禁', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const granted = {
      agent: { id: 'main' },
      callId: 'abzu-write-1',
      parent: Symbol('business-call'),
      name: 'write',
      arguments: { file_path: path.join(bookRoot, FINAL_REL), content: '受信正文' },
    }
    const trustedNativeWrite = vi.fn((exec: PreToolExec) => exec === granted)
    const gate = attachGate(ws, bookRoot, { trustedNativeWrite })

    const exact = await fire(gate, granted)
    expect(exact.result).toBe('NEXT')
    expect(exact.next).toHaveBeenCalledTimes(1)
    expect(trustedNativeWrite).toHaveBeenCalledTimes(1)
    expect(trustedNativeWrite).toHaveBeenCalledWith(granted)

    // 只差 callId:授权不精确 → 回落到文件门禁,定稿 deny。
    const lookalike = { ...granted, callId: 'unrelated-call' }
    const other = await fire(gate, lookalike)
    expect(other.result).toMatchObject({ kind: 'deny' })
    expect(other.next).not.toHaveBeenCalled()
    expect(trustedNativeWrite).toHaveBeenCalledTimes(2)
  })

  it('只认严格 true:truthy 返回值不构成授权', async () => {
    const { ws, bookRoot } = makeWorkspace()
    const trustedNativeWrite = vi.fn(() => 1) as unknown as (exec: PreToolExec) => boolean
    const gate = attachGate(ws, bookRoot, { trustedNativeWrite })
    const { result, next } = await fire(gate, {
      agent: { id: 'main' },
      name: 'write',
      arguments: { file_path: path.join(bookRoot, FINAL_REL), content: '正文' },
    })
    expect(result).toMatchObject({ kind: 'deny' })
    expect(next).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 3. 注册面:fail-open 与注销
// ---------------------------------------------------------------------------

describe('attachFileGateToAgent 注册面', () => {
  it('无 on 表面(或 on 非函数)→ undefined', () => {
    const { ws, bookRoot } = makeWorkspace()
    const deps = depsOf(ws, bookRoot)
    expect(attachFileGateToAgent({} as never, deps)).toBeUndefined()
    expect(attachFileGateToAgent({ on: undefined } as never, deps)).toBeUndefined()
    expect(attachFileGateToAgent({ on: 42 } as never, deps)).toBeUndefined()
  })

  it('有 on → 恰注册一个 tools/pre-execute 监听,注销函数可调用一次并透传 off', () => {
    const { ws, bookRoot } = makeWorkspace()
    const gate = attachGate(ws, bookRoot)
    expect(gate.registered).toHaveLength(1)
    expect(gate.registered[0]!.event).toBe('tools/pre-execute')
    expect(typeof gate.undo).toBe('function')
    expect(gate.offCalls).toEqual([])
    gate.undo!()
    expect(gate.offCalls).toEqual(['tools/pre-execute'])
  })

  it('on 回非函数注销值 → 交回的注销函数仍可调用(不抛)', () => {
    const { ws, bookRoot } = makeWorkspace()
    const ctx = { on: () => undefined }
    const undo = attachFileGateToAgent(ctx as never, depsOf(ws, bookRoot))
    expect(typeof undo).toBe('function')
    expect(() => undo!()).not.toThrow()
  })

  it('on 抛错 → fail-open 返回 undefined,不打断装载', () => {
    const { ws, bookRoot } = makeWorkspace()
    const ctx = { on: () => { throw new Error('宿主无该事件面') } }
    expect(attachFileGateToAgent(ctx as never, depsOf(ws, bookRoot))).toBeUndefined()
  })
})
