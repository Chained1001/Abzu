/**
 * 提案回执的宿主接线(0.0.88)。
 *
 * 时机设计——**不用轮次边界,用工具边界**:
 *
 * 做法是「攒一批,下次开工前交出去」:
 * - `tools/result` 观察者:每次写入类工具返回后,把事实攒进本 agent 的累积;
 * - `tools/execute` 中间件:**下一次工具执行前**,若累积非空,把回执投进该 agent
 *   的 **next-step** 队列,再清空。
 *
 * 为什么是 next-step 而不是 next-turn(实测宿主 dsh-agent-loop 的 inbox 语义):
 *
 * | 方法      | 目标队列   | 唤醒 | 什么时候被模型看到 |
 * |-----------|-----------|------|-------------------|
 * | followup  | next-turn | 是   | 本轮结束、**下一轮**开始时 |
 * | steer     | next-step | 是   | 本轮下一步 |
 * | inject    | next-step | 否   | 本轮下一步 |
 *
 * 宿主驱动循环里 `target` 在一轮内固定为 `next-step`(工具调用后 `target = "next-step"`),
 * `next-turn` 只在该轮收尾时才被消费。所以用 `followup` 会带来两个错:
 * ① 回执要等下一轮才可见,而**重复提交恰恰发生在一轮之内**;
 * ② `followup` 的 wakeup=true 会为本批回执**额外唤起一个轮次**,等于每次写入都多烧一次模型调用。
 *
 * 用 `inject`(next-step,不唤醒)才对:回执在**同一轮的下一步**就进上下文,
 * 且不会凭空开启新轮次。若本轮已无后续步骤,该消息留在队列里等下一次自然唤醒——
 * 反正模型下次动手前一定会读到。
 *
 * 三条纪律(与 gates.ts 的观察者一致):
 * - **只读回执,不改写任何工具结果**;
 * - **异常零外溢**:观察者、中间件、投递全程 try/catch,失败只 warn;
 * - **不落盘**:回执是瞬时态,不进书仓、不进 Git,卸载即丢。
 */

import { 空累积, 追加回执, 渲染回执, 造回执, type 回执累积 } from '@abzu/core'

type EventAgent = {
  readonly on?: (event: string, listener: (...args: never[]) => unknown) => unknown
  /** 宿主 agent 的 next-step 投递口(不唤醒)。缺它时退回 followup(有唤醒,但至少能到)。 */
  readonly inject?: (message: unknown) => void
  readonly followup?: (message: unknown) => void
}

export interface 回执接线依赖 {
  /** 造一条给模型的用户消息。宿主 message 构造器由调用方注入,避免本模块依赖 dsh-llm。 */
  readonly 造消息?: (文本: string) => unknown
  readonly logger?: { readonly warn: (message: string) => void }
}

/** 每个 agent 一份累积(WeakMap:agent 回收即丢,不需要清理钩子)。 */
const 累积表 = new WeakMap<object, 回执累积>()

/**
 * 把回执层挂到某个 agent 上。返回卸载函数。
 *
 * 宿主缺 `on` 或 `followup` 时**安静地不挂**(返回 undefined)——回执是增强项,
 * 不该因为宿主面不全而让装机失败。
 */
export function attachReceiptToAgent(
  agentCtx: unknown,
  依赖: 回执接线依赖,
): (() => void) | undefined {
  try {
    if (agentCtx === null || typeof agentCtx !== 'object') return undefined
    const ctx = agentCtx as EventAgent
    if (typeof ctx.on !== 'function') return undefined
    // 投递口：优先 inject（next-step 不唤醒）；宿主只给 followup 时退回它（有唤醒但不丢回执）。
    const 投递 = typeof ctx.inject === 'function'
      ? ctx.inject.bind(ctx)
      : typeof ctx.followup === 'function' ? ctx.followup.bind(ctx) : undefined
    if (投递 === undefined) return undefined
    const 造消息 = 依赖.造消息
    if (typeof 造消息 !== 'function') return undefined

    const 取累积 = (): 回执累积 => {
      let acc = 累积表.get(ctx as object)
      if (acc === undefined) { acc = 空累积; 累积表.set(ctx as object, acc) }
      return acc
    }

    /**
     * 交出累积并清空。渲染为 null 时什么都不做。
     *
     * 顺序要紧:先渲染、**投递成功后才清空**。早前是先清空再投递,投递一旦抛错,
     * 这一批回执就永久没了(与「失败只 warn、不影响别的」的说法不等价——warn 的代价是丢数据)。
     * 现在投递失败时把累积原样放回去,下一批一起交。
     */
    const 交付 = (): void => {
      const acc = 累积表.get(ctx as object)
      if (acc === undefined || acc.条目.length === 0) return
      const text = 渲染回执(acc)
      if (text === null) { 累积表.set(ctx as object, 空累积); return }
      try {
        投递(造消息(text))
        累积表.set(ctx as object, 空累积)
      } catch (err) {
        // 保留累积,等下一批重试;只警告,不外溢。
        依赖.logger?.warn(`[abzu-bundle] 回执投递失败:${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ① 下一次工具执行前交付上批回执。
    const offExecute = ctx.on('tools/execute', (async (exec: unknown, next: () => Promise<unknown>) => {
      try { 交付() } catch { /* 交付失败不影响工具执行 */ }
      return await next()
    }) as never)

    // ② 每次工具结果后攒回执(只读,不改结果)。
    const offResult = ctx.on('tools/result', ((exec: unknown, result: unknown): void => {
      try {
        if (exec === null || typeof exec !== 'object') return
        const name = (exec as { readonly name?: unknown }).name
        if (typeof name !== 'string' || name === '') return
        // 被拒绝/待批准的调用不产回执:模型会从审批通道得到更完整的反馈,
        // 再叠一条回执只会重复。
        if (result !== null && typeof result === 'object') {
          const view = result as { readonly isError?: unknown; readonly kind?: unknown }
          if (view.kind === 'deny' || view.kind === 'ask') return
        }
        const 条目 = 造回执(name, result)
        if (条目 === undefined) return
        累积表.set(ctx as object, 追加回执(取累积(), 条目))
      } catch { /* 观察者零影响 */ }
    }) as never)

    return () => {
      // 卸载前把还没交出去的回执交掉:否则「本轮最后一次写入 + 没有下一次工具调用 + 插件卸载」
      // 这三个条件同时成立时,那批回执直接消失(累积表被 delete)。交付本身不抛错。
      try { 交付() } catch { /* 卸载不因回执失败而中断 */ }
      try { if (typeof offExecute === 'function') (offExecute as () => void)() } catch { /* noop */ }
      try { if (typeof offResult === 'function') (offResult as () => void)() } catch { /* noop */ }
      累积表.delete(ctx as object)
    }
  } catch {
    return undefined
  }
}
