/**
 * 提案回执接线(0.0.88)：验证「攒一批、下次开工前交付」的时机与容错。
 *
 * 锁五件事：
 * 1. 写入类工具的结果在**下一次工具执行前**被回灌；
 * 2. 只读工具不产生回执；
 * 3. 被拒绝/待批准的调用不产回执（避免与审批通道重复）；
 * 4. 宿主缺 followup 或 on 时安静不挂，不让装机失败；
 * 5. 回执投递失败不外溢到工具执行。
 */
import { describe, expect, it } from 'vitest'
import { attachReceiptToAgent } from '../src/receipt'

type Listener = (...args: never[]) => unknown

/**
 * 一个最小的假 agent：能手动触发事件、记录投递到两个队列的消息。
 *
 * 刻意把 inject / followup 分开记：
 * - inject   → next-step（本轮下一步可见，不唤醒）
 * - followup → next-turn（下一轮才可见，且唤醒）
 * 回执必须走 inject —— 这是一条被真实宿主语义支撑的硬约束，用测试钉住。
 */
function 假Agent(选项?: { readonly 只给followup?: boolean }): {
  readonly ctx: object
  readonly 消息: string[]
  readonly 绕过inject的消息: string[]
  触发(event: string, ...args: unknown[]): Promise<unknown> | unknown
} {
  const 监听 = new Map<string, Listener[]>()
  const 消息: string[] = []
  const 绕过inject的消息: string[] = []
  const 收 = (组: string[]) => (message: unknown) => {
    const m = message as { readonly content?: readonly { readonly text?: string }[] }
    组.push(m.content?.[0]?.text ?? '')
  }
  const ctx: Record<string, unknown> = {
    on: (event: string, listener: Listener) => {
      const 组 = 监听.get(event) ?? []
      组.push(listener)
      监听.set(event, 组)
      // 与真实宿主一致：off 之后该监听不再被调用
      return () => { 监听.set(event, (监听.get(event) ?? []).filter((l) => l !== listener)) }
    },
    followup: 收(绕过inject的消息),
  }
  if (选项?.只给followup !== true) ctx['inject'] = 收(消息)
  return {
    ctx,
    消息,
    绕过inject的消息,
    触发: (event: string, ...args: unknown[]) => {
      const 组 = 监听.get(event) ?? []
      // tools/execute 是中间件：需要 next 才能继续；无监听时直接放行
      if (event === 'tools/execute') {
        const next = args[1] as () => Promise<unknown>
        const first = 组[0] as unknown as ((e: unknown, n: () => Promise<unknown>) => Promise<unknown>) | undefined
        return first === undefined ? next() : first(args[0], next)
      }
      for (const l of 组) (l as unknown as (...a: unknown[]) => unknown)(...args)
      return undefined
    },
  }
}

const 造消息 = (文本: string): unknown => ({ content: [{ type: 'text', text: 文本 }] })

describe('回执接线：时机', () => {
  it('写入类结果在下一次工具执行前被回灌', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    expect(off).toBeDefined()

    // 第一次工具：先执行（此时无回执可交），再产结果
    await a.触发('tools/execute', { name: 'novel_apply_revision' }, async () => 'ok')
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '已应用改稿', 卷: 1, 章: 3 })
    expect(a.消息.length).toBe(0) // 还没交付

    // 第二次工具执行前 → 交付上批
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(a.消息.length).toBe(1)
    expect(a.消息[0]).toContain('novel_apply_revision')
    expect(a.消息[0]).toContain('已应用改稿')
    expect(a.消息[0]).toContain('卷=1')
    expect(a.消息[0]).toContain('章=3')

    // 交付后清空：第三次执行不该重复交付
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(a.消息.length).toBe(1)
    off?.()
  })

  it('同一批多个写入合并成一条回执（不是多消息轰炸）', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '改了 A' })
    a.触发('tools/result', { name: 'novel_record_polish' }, { ok: true, message: '润了 B' })
    await a.触发('tools/execute', { name: 'novel_get_story_status' }, async () => 'ok')
    expect(a.消息.length).toBe(1)
    expect(a.消息[0]).toContain('改了 A')
    expect(a.消息[0]).toContain('润了 B')
    off?.()
  })

  it('只读工具不产回执（执行前后都不该有消息）', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    a.触发('tools/result', { name: 'novel_get_story_status' }, { ok: true, message: '状态已读' })
    a.触发('tools/result', { name: 'novel_search_finalized' }, { ok: true, message: '找到 3 处' })
    await a.触发('tools/execute', { name: 'novel_get_book_progress' }, async () => 'ok')
    expect(a.消息.length).toBe(0)
    off?.()
  })

  it('失败也产回执，且下一次必然被看到（「被拒别原样重提」的机制保证）', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    a.触发('tools/result', { name: 'novel_settle_chapter' }, { ok: false, reason: '未获作者批准' })
    await a.触发('tools/execute', { name: 'novel_apply_revision' }, async () => 'ok')
    expect(a.消息.length).toBe(1)
    expect(a.消息[0]).toContain('✗ novel_settle_chapter')
    expect(a.消息[0]).toContain('未获作者批准')
    expect(a.消息[0]).toContain('不要原样重提')
    off?.()
  })

  it('被拒绝/待批准的调用不产回执（与审批通道不重复）', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    a.触发('tools/result', { name: 'novel_settle_chapter' }, { kind: 'deny' })
    a.触发('tools/result', { name: 'novel_apply_retcon' }, { kind: 'ask' })
    await a.触发('tools/execute', { name: 'novel_apply_revision' }, async () => 'ok')
    expect(a.消息.length).toBe(0)
    off?.()
  })
})

describe('回执接线：投递口选择（inject 优先）', () => {
  it('有 inject 时走 inject（next-step），不碰 followup（next-turn）', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '好' })
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(a.消息.length).toBe(1)
    // 关键：不能走 followup —— 那会把回执推到下一轮，并额外唤醒一个轮次
    expect(a.绕过inject的消息.length).toBe(0)
    off?.()
  })

  it('宿主只给 followup 时退回它，回执不丢', async () => {
    const a = 假Agent({ 只给followup: true })
    const off = attachReceiptToAgent(a.ctx, { 造消息 })
    expect(off).toBeDefined()
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '好' })
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(a.绕过inject的消息.length).toBe(1)
    expect(a.绕过inject的消息[0]).toContain('novel_apply_revision')
    off?.()
  })

  it('inject 与 followup 都没有 → 不挂', () => {
    const ctx = { on: () => () => {} }
    expect(attachReceiptToAgent(ctx, { 造消息 })).toBeUndefined()
  })
})

describe('回执接线：容错', () => {
  it('宿主缺 on → 不挂，返回 undefined', () => {
    const ctx = { inject: () => {} }
    expect(attachReceiptToAgent(ctx, { 造消息 })).toBeUndefined()
  })

  it('没给造消息 → 不挂', () => {
    const a = 假Agent()
    expect(attachReceiptToAgent(a.ctx, {})).toBeUndefined()
  })

  it('null / 非对象入参不抛', () => {
    expect(attachReceiptToAgent(null, { 造消息 })).toBeUndefined()
    expect(attachReceiptToAgent('x', { 造消息 })).toBeUndefined()
  })

  it('投递抛错不外溢，工具仍正常执行', async () => {
    const 警告: string[] = []
    let resultListener: Listener | undefined
    let middle: ((e: unknown, n: () => Promise<unknown>) => Promise<unknown>) | undefined
    const ctx = {
      on: (event: string, listener: Listener) => {
        if (event === 'tools/execute') middle = listener as never
        if (event === 'tools/result') resultListener = listener
        return () => {}
      },
      inject: () => { throw new Error('宿主拒绝') },
    }
    const off = attachReceiptToAgent(ctx, { 造消息, logger: { warn: (m) => 警告.push(m) } })
    expect(off).toBeDefined()
    // 先攒一条回执，再让工具执行触发交付——交付时 inject 抛错
    ;(resultListener as unknown as (e: unknown, r: unknown) => void)({ name: 'novel_apply_revision' }, { ok: true, message: '好' })
    const 结果 = await middle!({ name: 'novel_prepare_pack' }, async () => '工具有效')
    expect(结果).toBe('工具有效')
    expect(警告.length).toBe(1)
    expect(警告[0]).toContain('回执投递失败')
    off?.()
  })

  it('投递抛错时保留累积，下一批一并交付（不因一次失败丢掉整批）', async () => {
    const 收到: string[] = []
    let 应该抛错 = true
    const a = 假Agent()
    // 把假 agent 的 inject 换成本地记录器，并按开关抛错
    ;(a.ctx as Record<string, unknown>)['inject'] = (message: unknown) => {
      if (应该抛错) throw new Error('宿主暂时不可用')
      const m = message as { readonly content?: readonly { readonly text?: string }[] }
      收到.push(m.content?.[0]?.text ?? '')
    }
    const off = attachReceiptToAgent(a.ctx, { 造消息, logger: { warn: () => {} } })!
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '第一处改好了' })
    // 第一次交付失败
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(收到.length, '投递抛错时不该有消息送达').toBe(0)
    // 恢复宿主，再攒一条并交付——上一批必须一起到达
    应该抛错 = false
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '第二处改好了' })
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(收到.length, '恢复后应交付一次').toBe(1)
    expect(收到[0]).toContain('第一处改好了')
    expect(收到[0]).toContain('第二处改好了')
    off()
  })

  it('卸载前把未交付的回执交掉（否则末批回执随累积表一起消失）', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })!
    // 攒一条，但本轮不再调工具 —— 正常时机下它会等下一次工具执行
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '最后一处改好了' })
    expect(a.消息.length, '此时还没到交付时机').toBe(0)
    off()
    expect(a.消息.length, '卸载应把未交付的回执交掉').toBe(1)
    expect(a.消息[0]).toContain('最后一处改好了')
  })

  it('卸载后不再积累也不再交付，且可重复卸载', async () => {
    const a = 假Agent()
    const off = attachReceiptToAgent(a.ctx, { 造消息 })!
    off()
    off() // 重复卸载不抛
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: '好' })
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(a.消息.length).toBe(0)
  })

  it('agent 之间互不串味（各自独立累积）', async () => {
    const a = 假Agent()
    const b = 假Agent()
    const offA = attachReceiptToAgent(a.ctx, { 造消息 })
    const offB = attachReceiptToAgent(b.ctx, { 造消息 })
    a.触发('tools/result', { name: 'novel_apply_revision' }, { ok: true, message: 'A 的改动' })
    // b 执行前不该收到 a 的回执
    await b.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(b.消息.length).toBe(0)
    await a.触发('tools/execute', { name: 'novel_prepare_pack' }, async () => 'ok')
    expect(a.消息.length).toBe(1)
    offA?.(); offB?.()
  })
})
