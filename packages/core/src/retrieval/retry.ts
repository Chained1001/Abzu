import { SearchError } from './types'
import type { IndexFailure } from './state'

export interface IndexRetryPolicy {
  readonly maxRetries: number
  readonly baseDelayMs: number
  readonly maxDelayMs: number
  readonly budgetMs: number
}
export const DEFAULT_INDEX_RETRY: IndexRetryPolicy = { maxRetries: 5, baseDelayMs: 2000, maxDelayMs: 60_000, budgetMs: 600_000 }

export function retryDelayMs(attempt: number, policy: IndexRetryPolicy, retryAfterMs = 0, random = Math.random): number {
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1))
  const jittered = Math.round(exponential * (0.5 + Math.max(0, Math.min(1, random())) * 0.5))
  return Math.max(jittered, Number.isFinite(retryAfterMs) ? Math.max(0, retryAfterMs) : 0)
}

export function indexFailure(error: unknown): IndexFailure {
  if (error instanceof Error && /书仓.*锁/.test(error.message)) return { code: 'book-busy', message: '书仓正被其他操作锁定，稍后继续索引', retryable: true }
  const value = error && typeof error === 'object' ? error as { code?: unknown; httpStatus?: unknown; retryAfterMs?: unknown } : {}
  const code = typeof value.code === 'string' ? value.code : 'index-error'
  const httpStatus = typeof value.httpStatus === 'number' && Number.isInteger(value.httpStatus) ? value.httpStatus : undefined
  const retryAfterMs = typeof value.retryAfterMs === 'number' && Number.isFinite(value.retryAfterMs) ? Math.max(0, value.retryAfterMs) : undefined
  const messages: Record<string, string> = {
    'credential-missing': '嵌入 API Key 尚未配置，请在模型设置中填写凭据后重试',
    'credential-error': '无法读取嵌入凭据，请检查 DSH 凭据设置',
    'provider-unconfigured': '嵌入提供方未启用或配置不完整',
    'provider-upgrade-required': '嵌入提供方尚不支持单次批量请求，请更新提供方插件',
    'provider-changed': '检索模型配置已变化，将按新配置重新校准',
    'invalid-scenes': '场景模型未返回完整有效的段落边界',
    'scene-cache-error': '场景缓存无法读取，已保留原记录，请检查缓存或权限',
    'scene-unconfigured': '场景模型尚未配置或宿主模型服务不可用',
    'scene-input-too-long': '章节超过场景模型的输入预算，未截断原文',
    'scene-model-error': '场景模型未完成有效输出，请检查模型配置',
    'scene-timeout': '场景模型请求超时',
    'scene-transport': '场景模型服务暂时无法连接',
    'source-changed': '定稿内容已变化，将按最新内容重新校准',
    'source-incomplete': '部分定稿文件不可读取或格式异常，请查看异常来源后重试',
    'invalid-embedding': '嵌入响应数量、维数或数值不符合配置，请检查模型与维度',
    'invalid-response': '嵌入响应格式、数量或维数不符合配置，请检查服务和模型',
    'invalid-input': '嵌入输入不符合服务要求，请检查模型配置',
    timeout: '嵌入请求超时', transport: '嵌入服务暂时无法连接',
    'retry-exhausted': '自动重试次数或时间预算已用尽，请检查服务后重试',
    'recovery-required': '书仓有待处理事务，请先完成既有恢复',
    'index-busy': '另一进程正在维护此书索引',
    'index-lock-invalid': '索引任务锁的归属无法确认，请检查后重试',
    'source-error': '书仓目录不存在或不可读取',
    'unsafe-cache': '缓存或状态路径被目录、链接或共享文件占用，请检查路径',
    'foreign-cache': '缓存位置存在其他数据库，已保留原文件',
    'sqlite-unavailable': '当前 Node 不支持内置 SQLite',
    'index-state-error': '索引状态文件不可读取，已保留原文件',
  }
  // Windows 上后台索引写状态文件会撞上瞬时的 EPERM/EACCES/EBUSY（另一个句柄
  // 正在读/替换同一文件）。这些是大写 errno，不是本模块的语义码，早前会落到
  // 兜底文案「请检查书仓和缓存的读写权限」——那句话让作者去查一个并不存在的权限问题，
  // 而真实原因是瞬时争用、重试即可。这里给它们单独的可重试语义。
  const 瞬时文件错误: Record<string, string> = {
    EPERM: '索引文件正被其他操作占用（Windows 瞬时状态），稍后会自动重试',
    EACCES: '索引文件暂时无法访问（Windows 瞬时状态），稍后会自动重试',
    EBUSY: '索引文件正被其他进程使用，稍后会自动重试',
  }
  // 用 hasOwn：`code in obj` 会把 'constructor'/'toString' 也算命中，而 code 来自外部错误对象。
  const 是瞬时 = Object.hasOwn(瞬时文件错误, code)
  let message = 是瞬时 ? 瞬时文件错误[code]! : messages[code] ?? '本地索引操作失败，请检查书仓和缓存的读写权限'
  let retryable = ['timeout', 'transport', 'scene-timeout', 'scene-transport'].includes(code) || 是瞬时
  if (httpStatus !== undefined) {
    message = httpStatus === 401 || httpStatus === 403 ? `嵌入服务鉴权失败（HTTP ${httpStatus}），请检查凭据和权限`
      : httpStatus === 429 ? '嵌入服务限流或额度不足（HTTP 429）'
        : `嵌入服务返回 HTTP ${httpStatus}，请检查服务、模型和请求配置`
    retryable = httpStatus === 429 || httpStatus === 408 || httpStatus === 500 || httpStatus === 502 || httpStatus === 503 || httpStatus === 504
  }
  // 对外 code 必须是小写语义码（下游按 code 分派重试，且 schema 要求小写）。
  // 瞬时文件错误统一归到 index-busy：语义就是「另一处正在动这个文件、稍后重试」，
  // sync.ts 的 reschedule 列表里也已经有它，于是会重新排队而不是判死。
  const 归一code = 是瞬时 ? 'index-busy' : /^[a-z0-9-]{1,80}$/.test(code) ? code : 'index-error'
  return { code: 归一code, message, retryable,
    ...(httpStatus === undefined ? {} : { httpStatus }), ...(retryAfterMs === undefined ? {} : { retryAfterMs }) }
}

export function waitIndexRetry(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, ms)
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new SearchError('cancelled', '索引任务已取消')) }
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort()
  })
}

export function indexAbortable<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return operation
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(new SearchError('cancelled', '索引任务已取消')) }
    signal.addEventListener('abort', abort, { once: true })
    operation.then(value => { signal.removeEventListener('abort', abort); resolve(value) }, error => { signal.removeEventListener('abort', abort); reject(error) })
    if (signal.aborted) abort()
  })
}
