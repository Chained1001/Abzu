/**
 * A-2 读书仓内文本的唯一原语（步 1：纯新增，零调用点改动）。
 *
 * 四态分工（写死）：
 * - `missing`：**只认 ENOENT**
 * - `io`：其余全部 errno（EACCES / EPERM / EBUSY / EISDIR / EMFILE…），`detail` 带 code 与原始 message
 * - `parse-error` **不进本函数**：机器 JSON / frontmatter 的解析失败仍归调用方（`parseMachineJson` / `parseDocument`）
 * - `text === ''` 不是错误，是 `ok: true`（调用方自己判空，行为不变）
 *
 * 统一剥首部 BOM（同 `repo/schema.ts:19` 的 `readMachineText` 口径，读侧口径合一）；
 * 因此**逐字节比对 / 哈希类调用点不要用它**——哈希要与写侧同源，BOM 剥除会改变字节。
 *
 * 不做：不 canonicalize（`assembly/read` 那处保留自己的预归一）、不解析 frontmatter、不缓存。
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

export type BookTextResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: 'missing' | 'io'; readonly detail: string; /** 原 errno，供需要「原样重抛」的调用方保留 code（如 design/skeleton 的 ENOENT-only 特例）。 */ readonly code?: string }

/** 读书仓内文本：`rel` 为书仓相对路径（`/` 与 `\` 都收）。 */
export function readBookText(root: string, rel: string): BookTextResult {
  const target = path.join(root, ...rel.split(/[\\/]/))
  let raw: string
  try {
    raw = fs.readFileSync(target, 'utf8')
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return { ok: false, reason: 'missing', detail: `文件不存在：${rel}`, ...(code === undefined ? {} : { code }) }
    return {
      ok: false,
      reason: 'io',
      detail: `读取失败：${rel}（${code ?? '未知错误'}：${error instanceof Error ? error.message : String(error)}）`,
      ...(code === undefined ? {} : { code }),
    }
  }
  return { ok: true, text: raw.replace(/^\uFEFF/, '') }
}
