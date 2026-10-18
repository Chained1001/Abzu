import { beforeEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { abzuSelfCheck, apply, currentWorkspaceRoot, resetWorkspaceRoot } from '../src/index'
import { SELF_CHECK_IDS, resetSelfCheck, type SelfCheckSnapshot } from '../src/self-check'

/** 临时工作范围：一本带契约的书（与 lifecycle.spec 同构）。 */
function makeWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-selfcheck-'))
  const book = path.join(dir, '星辰')
  fs.mkdirSync(path.join(book, '作品契约'), { recursive: true })
  fs.writeFileSync(path.join(book, '作品契约', '契约.md'), '---\n书id: xingchen-001\n---\n正文\n', 'utf8')
  return dir
}

/**
 * 宿主 ctx 桩：ready 里没有的服务视为尚未就绪（pending）。
 * 与 lifecycle.spec 的 makeHost 同形，另收 logs（A 档日志断言用）。
 */
function makeHost(opts: {
  readonly ready: Record<string, unknown>
  readonly withInject?: boolean
  readonly withEffect?: boolean
  readonly withPlugin?: boolean
}) {
  const injected: Array<{ deps: readonly string[]; run: (scope: unknown) => void }> = []
  const effects: Array<() => void> = []
  const logs: string[] = []

  const host: Record<string, unknown> = {
    logger: {
      info: (m: string) => { logs.push(m) },
      warn: (m: string) => { logs.push(`warn:${m}`) },
    },
    get: (n: string) => opts.ready[n],
    on: () => () => {},
  }
  if (opts.withInject !== false) {
    host.inject = (deps: readonly string[], run: (scope: unknown) => void) => {
      injected.push({ deps, run })
      if (deps.every((d) => opts.ready[d] !== undefined)) run(host)
      return undefined
    }
    if (opts.withPlugin !== false) host.plugin = () => {}
  }
  if (opts.withEffect !== false) {
    host.effect = (execute: () => unknown) => {
      const undo = execute()
      if (typeof undo === 'function') effects.push(undo as () => void)
      return () => {}
    }
  }
  return { host, injected, effects, logs }
}

function statusOf(snapshot: SelfCheckSnapshot, id: string): string | undefined {
  return snapshot.items.find((item) => item.id === id)?.status
}

/** 一主一子的最小装机面；主 Agent 的 agent.ctx 暴露 tools.register 记录器。 */
function fullSetup(mainRegistered: string[]): ReturnType<typeof makeHost> {
  const mainCtx = {
    get: (n: string) => (n === 'tools'
      ? { register: (tool: { name: string }) => { mainRegistered.push(tool.name); return () => {} } }
      : undefined),
  }
  const subCtx = { get: () => undefined }
  return makeHost({
    ready: {
      agents: {
        list: () => [
          { id: 'sess-1', ctx: mainCtx },
          { id: 'sub-1', session: { header: { origin: 'subagent' } }, ctx: subCtx },
        ],
      },
      tools: { register: () => {} },
      userQuestions: {},
    },
  })
}

describe('R1 装机自检（可查询的降级状态，纯增不改行为）', () => {
  beforeEach(() => {
    resetSelfCheck()
    resetWorkspaceRoot()
  })

  it('无 inject 表面的宿主：host.inject 记 missing，既有 warn 文案照旧', () => {
    const { host, logs } = makeHost({ ready: {}, withInject: false, withEffect: false })
    apply(host as never)

    expect(logs.some((m) => m.includes('随包技能未挂载'))).toBe(true)
    const snapshot = abzuSelfCheck()
    expect(statusOf(snapshot, 'host.inject')).toBe('missing')
    expect(statusOf(snapshot, 'skills.mount')).toBe('missing')
  })

  it('workspaceRegistry 缺席：workspace.root 记 degraded（cwd 兜底），不是 missing', () => {
    const { host } = makeHost({ ready: {} })
    apply(host as never)

    expect(currentWorkspaceRoot()).toBeDefined()
    expect(statusOf(abzuSelfCheck(), 'workspace.root')).toBe('degraded')
  })

  it('workspaceRegistry 就绪：workspace.root 记 ok，detail 带已认领路径', () => {
    const ws = makeWorkspace()
    const { host } = makeHost({ ready: { workspaceRegistry: { list: () => [{ path: ws }] } } })
    apply(host as never)

    const item = abzuSelfCheck().items.find((entry) => entry.id === 'workspace.root')
    expect(item?.status).toBe('ok')
    expect(item?.detail).toContain(path.basename(ws))
    for (const dir of ['构想', '灵感池', '知识库']) {
      expect(fs.statSync(path.join(ws, '书房', dir)).isDirectory()).toBe(true)
    }
  })

  it('registry 后到时 pending→ok 收敛：degraded 让位给真值', () => {
    const ws = makeWorkspace()
    const { host, injected } = makeHost({ ready: {} })
    apply(host as never)
    expect(statusOf(abzuSelfCheck(), 'workspace.root')).toBe('degraded')

    const decl = injected.find((item) => item.deps.includes('workspaceRegistry'))
    expect(decl, 'workspaceRegistry 应经 ctx.inject 声明').toBeDefined()
    decl!.run({ workspaceRegistry: { list: () => [{ path: ws }] } })

    expect(currentWorkspaceRoot()).toBe(ws)
    expect(statusOf(abzuSelfCheck(), 'workspace.root')).toBe('ok')
  })

  it('只给 tools/userQuestions、不给 approval：approval.policy 记 missing，且工具照旧注册', () => {
    const registered: string[] = []
    const { host } = fullSetup(registered)
    apply(host as never)

    expect(statusOf(abzuSelfCheck(), 'approval.policy')).toBe('missing')
    // 零行为变更的证据：记录状态不影响既有的装机与注册路径
    expect(registered.length).toBeGreaterThan(0)
    expect(statusOf(abzuSelfCheck(), 'tools.register')).toBe('ok')
  })

  it('approval 抛错时记 degraded（服务在但调用失败）', () => {
    const agentCtx = {
      get: (n: string) => (n === 'approval'
        ? { setPolicy: () => { throw new Error('策略拒绝') } }
        : undefined),
    }
    const { host } = makeHost({ ready: { agents: { list: () => [{ id: 'sub-9', session: { header: { origin: 'subagent' } }, ctx: agentCtx }] } } })
    apply(host as never)

    expect(statusOf(abzuSelfCheck(), 'approval.policy')).toBe('degraded')
  })

  it('A 档：自检 step 末尾落一行固定字段 JSON，值里不夹自由文本', () => {
    const registered: string[] = []
    const { host, logs } = fullSetup(registered)
    apply(host as never)

    const line = logs.find((m) => m.startsWith('{"event":"abzu.self-check"'))
    expect(line, '应有一行 abzu.self-check JSON 日志').toBeDefined()
    const parsed = JSON.parse(line!) as Record<string, unknown>
    // 字段名是契约、顺序不承诺，因此只比集合
    expect(Object.keys(parsed).sort()).toEqual(['books', 'degraded', 'event', 'missing', 'pending', 'workspace'])
    for (const key of ['degraded', 'missing', 'pending']) {
      expect(Array.isArray(parsed[key]), `${key} 应是 id 数组`).toBe(true)
      for (const id of parsed[key] as string[]) expect(SELF_CHECK_IDS).toContain(id)
    }
    expect(typeof parsed['workspace']).toBe('string')
    expect(typeof parsed['books']).toBe('number')
  })

  it('漏报防护：上报的 id 全部来自 SELF_CHECK_IDS，且每条都带 detail 与时间戳', () => {
    const registered: string[] = []
    const { host } = fullSetup(registered)
    apply(host as never)

    const snapshot = abzuSelfCheck()
    expect(snapshot.items.length).toBeGreaterThan(0)
    for (const item of snapshot.items) {
      expect(SELF_CHECK_IDS, `未知自检 id：${item.id}`).toContain(item.id)
      expect(item.detail, `${item.id} 缺诊断信息`).toBeTruthy()
      expect(Number.isNaN(Date.parse(item.at)), `${item.id} 时间戳非法`).toBe(false)
    }
    // 汇总与逐项一致
    const counted = snapshot.items.reduce((acc, _item) => acc + 1, 0)
    const { ok, degraded, pending, missing } = snapshot.summary
    expect(ok + degraded + pending + missing).toBe(counted)
  })
})

/** agent scoped ctx 桩：按需暴露 systemPrompt / inject / on / tools / approval 表面。 */
function agentStub(opts: {
  readonly prompt?: boolean
  readonly inject?: boolean
  readonly on?: boolean
  readonly tools?: unknown
  readonly approval?: unknown
} = {}): Record<string, unknown> {
  const ctx: Record<string, unknown> = {
    // status-context 的 sysPromptOf 优先走 ctx.get('systemPrompt')，属性读只是兜底
    get: (n: string) => (n === 'systemPrompt' && opts.prompt !== false ? ctx['systemPrompt']
      : n === 'tools' ? opts.tools
        : n === 'approval' ? opts.approval
          : undefined),
  }
  if (opts.on !== false) ctx['on'] = () => {}
  if (opts.prompt !== false) ctx['systemPrompt'] = { context: () => () => {}, section: () => () => {}, variable: () => {} }
  if (opts.inject !== false) {
    ctx['inject'] = (_deps: unknown, cb: (scope: unknown) => void) => { cb(ctx); return { dispose: async () => {} } }
  }
  return ctx
}

const idsOf = (): string[] => abzuSelfCheck().items.map((item) => item.id)

/**
 * 补齐 6 个从未被断言的挂载点（skills.dir / agents.surface / tools.kit / gate.file /
 * persona.mount / status.mount），并加「上报集合 vs SELF_CHECK_IDS」的覆盖率断言——
 * 原漏报防护只保证「已上报的 id 合法」，新增挂载点忘了上报仍会报健康。
 */
describe('R1 装机自检：挂载点 id 覆盖率', () => {
  beforeEach(() => {
    resetSelfCheck()
    resetWorkspaceRoot()
  })

  it('skills.dir：正常安装面记 ok 且 detail 带技能目录（inject 缺席时该 id 不上报）', () => {
    const { host } = makeHost({ ready: {} })
    apply(host as never)

    const item = abzuSelfCheck().items.find((entry) => entry.id === 'skills.dir')
    expect(item?.status).toBe('ok')
    expect(item?.detail).toContain('技能目录存在')
    // skills 服务未就绪，挂载停在 pending —— 与 skills.dir 是两件事
    expect(statusOf(abzuSelfCheck(), 'skills.mount')).toBe('pending')
  })

  it('agents.surface：无 agents 服务记 pending，就绪记 ok', () => {
    const offHost = makeHost({ ready: {}, withInject: false })
    apply(offHost.host as never)
    expect(statusOf(abzuSelfCheck(), 'agents.surface')).toBe('pending')
    expect(abzuSelfCheck().items.find((i) => i.id === 'agents.surface')?.detail).toContain('未就绪')

    resetSelfCheck(); resetWorkspaceRoot()
    const onHost = makeHost({ ready: { agents: { list: () => [] } } })
    apply(onHost.host as never)
    expect(statusOf(abzuSelfCheck(), 'agents.surface')).toBe('ok')
  })

  it('tools.kit：tools 服务未就绪 pending、缺裁决通道 degraded、两者齐备 ok', () => {
    const pending = makeHost({ ready: { agents: { list: () => [] } }, withInject: false })
    apply(pending.host as never)
    expect(statusOf(abzuSelfCheck(), 'tools.kit')).toBe('pending')

    resetSelfCheck(); resetWorkspaceRoot()
    const degraded = makeHost({ ready: { agents: { list: () => [] }, tools: { register: () => {} }, userQuestions: {} } })
    apply(degraded.host as never)
    expect(statusOf(abzuSelfCheck(), 'tools.kit')).toBe('degraded')

    resetSelfCheck(); resetWorkspaceRoot()
    const ok = makeHost({ ready: { agents: { list: () => [] }, tools: { register: () => {} }, userQuestions: { ask: async () => ({ answers: [] }) } } })
    apply(ok.host as never)
    expect(statusOf(abzuSelfCheck(), 'tools.kit')).toBe('ok')
  })

  it('gate.file：agent 无 on 表面记 missing，有 on 记 ok（高危项必须留痕）', () => {
    const missing = makeHost({ ready: { agents: { list: () => [{ id: 'a-1', ctx: agentStub({ on: false, tools: { register: () => {} } }) }] } } })
    apply(missing.host as never)
    expect(statusOf(abzuSelfCheck(), 'gate.file')).toBe('missing')

    resetSelfCheck(); resetWorkspaceRoot()
    const ok = makeHost({ ready: { agents: { list: () => [{ id: 'a-1', ctx: agentStub({ tools: { register: () => {} } }) }] } } })
    apply(ok.host as never)
    expect(statusOf(abzuSelfCheck(), 'gate.file')).toBe('ok')
  })

  it('persona.mount / status.mount：无 surface 记 missing，就绪记 ok', () => {
    const missing = makeHost({ ready: { agents: { list: () => [{ id: 'a-1', ctx: agentStub({ prompt: false, inject: false }) }] } } })
    apply(missing.host as never)
    expect(statusOf(abzuSelfCheck(), 'persona.mount')).toBe('missing')
    expect(statusOf(abzuSelfCheck(), 'status.mount')).toBe('missing')

    resetSelfCheck(); resetWorkspaceRoot()
    const ok = makeHost({ ready: { agents: { list: () => [{ id: 'a-1', ctx: agentStub({ on: false, tools: { register: () => {} } }) }] } } })
    apply(ok.host as never)
    expect(statusOf(abzuSelfCheck(), 'persona.mount')).toBe('ok')
    expect(statusOf(abzuSelfCheck(), 'status.mount')).toBe('ok')
  })

  it('tools.restrict（P2-4）：挂上记 ok、restrict 抛错记 degraded、无子 Agent 记 pending', () => {
    // ok：子 Agent 暴露 restrict 表面，deny 名单进宿主
    const denied: string[] = []
    const subCtx = agentStub({ tools: { restrict: (filter: { deny?: readonly string[] }) => { denied.push(...(filter.deny ?? [])); return () => {} } } })
    const ws = makeWorkspace()
    const okHost = makeHost({
      ready: {
        workspaceRegistry: { list: () => [{ path: ws }] },
        agents: {
          list: () => [
            { id: 'main-1', ctx: agentStub({ tools: { register: () => () => {} } }) },
            { id: 'sub-1', session: { header: { origin: 'subagent' } }, ctx: subCtx },
          ],
        },
        tools: { register: () => {} },
        userQuestions: { ask: async () => ({ answers: [] }) },
      },
    })
    apply(okHost.host as never)
    const okItem = abzuSelfCheck().items.find((i) => i.id === 'tools.restrict')
    expect(okItem?.status).toBe('ok')
    expect(okItem?.detail).toContain('restrict')
    expect(denied.length).toBeGreaterThan(0)

    // degraded：restrict 抛「未知名字」（工具面未就绪时的既有失败形态）
    resetSelfCheck(); resetWorkspaceRoot()
    const throwingSub = agentStub({ tools: { restrict: () => { throw new Error('未知名字') } } })
    const degradedHost = makeHost({
      ready: {
        agents: { list: () => [{ id: 'sub-2', session: { header: { origin: 'subagent' } }, ctx: throwingSub }] },
        tools: { register: () => {} },
        userQuestions: { ask: async () => ({ answers: [] }) },
      },
    })
    apply(degradedHost.host as never)
    expect(statusOf(abzuSelfCheck(), 'tools.restrict')).toBe('degraded')

    // pending：只有主 Agent、无子 Agent（正常等待，不是故障）
    resetSelfCheck(); resetWorkspaceRoot()
    const mainOnly = makeHost({
      ready: {
        agents: { list: () => [{ id: 'main-9', ctx: agentStub({ tools: { register: () => () => {} } }) }] },
        tools: { register: () => {} },
        userQuestions: { ask: async () => ({ answers: [] }) },
      },
    })
    apply(mainOnly.host as never)
    expect(statusOf(abzuSelfCheck(), 'tools.restrict')).toBe('pending')
  })

  it('满配宿主：12 个 id 全部上报，集合与 SELF_CHECK_IDS 相等', () => {
    const ws = makeWorkspace()
    const registered: string[] = []
    const mainCtx = agentStub({ tools: { register: (tool: { name: string }) => { registered.push(tool.name); return () => {} } } })
    const subCtx = agentStub({ approval: { setPolicy: () => {} }, tools: { restrict: () => () => {} } })
    const { host } = makeHost({
      ready: {
        workspaceRegistry: { list: () => [{ path: ws }] },
        skills: {},
        agents: {
          list: () => [
            { id: 'main-1', ctx: mainCtx },
            { id: 'sub-1', session: { header: { origin: 'subagent' } }, ctx: subCtx },
          ],
        },
        tools: { register: () => {} },
        userQuestions: { ask: async () => ({ answers: [] }) },
      },
    })
    apply(host as never)

    expect([...idsOf()].sort()).toEqual([...SELF_CHECK_IDS].sort())
    expect(registered.length).toBeGreaterThan(0)
    expect(statusOf(abzuSelfCheck(), 'skills.mount')).toBe('ok')
    expect(statusOf(abzuSelfCheck(), 'approval.policy')).toBe('ok')
    expect(statusOf(abzuSelfCheck(), 'tools.register')).toBe('ok')
    expect(statusOf(abzuSelfCheck(), 'tools.restrict')).toBe('ok')
  })

  it('缺配宿主：只上报最小集合，其余挂载点不得凭空出现', () => {
    const { host } = makeHost({ ready: {}, withInject: false, withEffect: false })
    apply(host as never)

    // inject 缺席 ⇒ skills.dir 不上报；无 agent ⇒ persona/status/gate/approval 不上报
    // （tools.restrict 与 tools.register 同点：无子 Agent 记 pending）
    expect([...idsOf()].sort()).toEqual([
      'agents.surface', 'host.inject', 'skills.mount', 'tools.kit', 'tools.register', 'tools.restrict', 'workspace.root',
    ].sort())
    expect(idsOf().every((id) => (SELF_CHECK_IDS as readonly string[]).includes(id))).toBe(true)
  })
})
