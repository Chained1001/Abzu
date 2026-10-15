import { describe, expect, it } from 'vitest'
import { attachDiscovery } from '../../src/retrieval/discovery'

/** 最小 connection 桩：收下 discovery 注册的 fetch handler，供直接投递请求体。 */
interface RegisteredFetch {
  readonly path: string
  readonly fetch: (request: { text(): Promise<string>; signal?: AbortSignal }) => Promise<Response>
}

function discoveryHarness() {
  const entries: RegisteredFetch[] = []
  const scope = {
    effect: () => () => {},
    connection: { fetch: { register: (entry: RegisteredFetch) => { entries.push(entry) } } },
  }
  const ctx = {
    inject: (_deps: readonly string[], run: (s: unknown) => void) => { run(scope); return undefined },
    credentials: { resolve: async () => undefined },
  }
  attachDiscovery(ctx as never)
  const entry = entries.find((e) => e.path === '/api/abzu/embeddings')
  if (entry === undefined) throw new Error('discovery fetch 未注册')
  const post = async (body: unknown): Promise<{ ok: boolean; error?: string }> => {
    const response = await entry.fetch({ text: async () => JSON.stringify(body), signal: new AbortController().signal })
    return await response.json() as { ok: boolean; error?: string }
  }
  return { post }
}

describe('嵌入服务探测请求（discovery）凭据 ref 白名单（P2-1）', () => {
  // 不可达本机地址＋内联 apiKey：放行后的失败只能是网络错误，凭据解析不会被触达。
  const base = { action: 'models', protocol: 'openai-compatible', baseURL: 'http://127.0.0.1:1', apiKey: 'sk-probe-1' }

  it('请求体携带非默认凭据 ref 一律拒绝，错误点名白名单与收到的 ref', async () => {
    const { post } = discoveryHarness()
    for (const ref of ['DSH_ROOT_PASSWORD', 'OPENAI_API_KEY', 'a']) {
      const r = await post({ ...base, apiKeyEnv: ref })
      expect(r.ok, ref).toBe(false)
      expect(r.error, ref).toContain('ABZU_EMBEDDING_API_KEY')
      expect(r.error, ref).toContain(ref)
    }
  })

  it('默认 ref（缺省或显式 ABZU_EMBEDDING_API_KEY）放行：失败是网络错误而非白名单拒绝', async () => {
    const { post } = discoveryHarness()
    for (const body of [base, { ...base, apiKeyEnv: 'ABZU_EMBEDDING_API_KEY' }]) {
      const r = await post(body)
      expect(r.ok).toBe(false)
      expect(r.error).not.toContain('凭据引用')
    }
  })
})
