/**
 * D-2：书房 API 的路由生命周期。
 *
 * `connection.fetch.register` 返回注销函数，且真源里同一 path 重复注册会抛
 * （dsh-client-connection：`connection: exact Fetch route ... is already registered`）。
 * 所以"卸载后旧 handler 退场 + 重装不抛"是硬约束而非风格问题——下面的 fetch 桩照真源行为抛。
 */
import { describe, expect, it } from 'vitest'
import { attachStudyWeb } from '../src/study/web'
import { EditorRequestHub } from '../src/study/editor-requests'

/** 照真源行为的 connection.fetch 桩：重复注册同一 path 直接抛。 */
function makeFetchRegistry() {
  const routes = new Map<string, () => void>()
  return {
    routes,
    fetch: {
      register: (route: { readonly path: string }) => {
        if (routes.has(route.path)) throw new Error(`connection: exact Fetch route ${JSON.stringify(route.path)} is already registered`)
        const off = () => { routes.delete(route.path) }
        routes.set(route.path, off)
        return async () => { off() }
      },
    },
  }
}

/** 宿主桩：inject 依赖齐了就同步跑 setup（与 lifecycle.spec 同形）；setups 供"晚到"场景手动触发。
 *  scope 上要像真 cordis 一样能按属性读到已就绪服务（`scope.connection`），否则桩比真源更严会误报。 */
function makeHost(ready: Record<string, unknown>) {
  let disposed = 0
  const setups: Array<(scope: unknown) => void> = []
  const scope: Record<string, unknown> = {
    ...ready,
    logger: { info: () => {}, warn: () => {} },
    get: (name: string) => ready[name],
    on: () => () => {},
  }
  scope.inject = (deps: readonly string[], setup: (scope: unknown) => void) => {
    setups.push(setup)
    if (deps.every((dep) => ready[dep] !== undefined)) setup(scope)
    return { dispose: async () => { disposed += 1 } }
  }
  return { host: scope, setups, disposedCount: () => disposed }
}

describe('D-2 书房 API 路由随插件生命周期退场', () => {
  it('卸载：路由全部注销、注入 fiber 交回；重装不抛（重复注册会抛是桩的硬约束）', () => {
    const { routes, fetch } = makeFetchRegistry()
    const { host, disposedCount } = makeHost({ connection: { fetch }, agents: { list: () => [], roots: () => [] } })

    const undo = attachStudyWeb(host as never, undefined, new EditorRequestHub())
    const mounted = routes.size
    expect(mounted, '应挂上全部书房路由').toBeGreaterThan(0)

    undo()

    expect(routes.size, '旧 handler 必须退场').toBe(0)
    expect(disposedCount(), '注入 fiber 应显式交回').toBe(1)
    expect(() => attachStudyWeb(host as never, undefined, new EditorRequestHub())).not.toThrow()
    expect(routes.size).toBe(mounted)
  })

  it('插件已卸载后 connection 才就绪：晚到的 setup 当场退场，不留孤儿路由', () => {
    const { routes, fetch } = makeFetchRegistry()
    const { host, setups } = makeHost({ agents: { list: () => [], roots: () => [] } }) // connection 未就绪

    const undo = attachStudyWeb(host as never, undefined, new EditorRequestHub())
    expect(routes.size).toBe(0)

    undo()
    // connection 服务重启 → cordis 重跑 setup（此时插件已卸载）
    setups[0]!({ ...host, connection: { fetch } })

    expect(routes.size, '晚到路由不得留在宿主上').toBe(0)
  })

  it('重复卸载幂等：只交回一次，不抛', () => {
    const { fetch } = makeFetchRegistry()
    const { host, disposedCount } = makeHost({ connection: { fetch }, agents: { list: () => [], roots: () => [] } })
    const undo = attachStudyWeb(host as never, undefined, new EditorRequestHub())

    expect(() => { undo(); undo(); undo() }).not.toThrow()
    expect(disposedCount(), '三次卸载只 dispose 一次').toBe(1)
  })
})
