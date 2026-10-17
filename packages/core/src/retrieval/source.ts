import * as fs from 'node:fs'
import { currentSceneRecord, proseParagraphs, readSceneRecords, sceneBodyHash, sceneChunks, SCENE_CACHE_PATH } from './scenes'
import * as path from 'node:path'
import { authorDocumentPath, validateAuthorRelativePath } from '../revise/document'
import { canonicalizePath, stripDevicePrefix } from '../gate/canonical'
import { parseDocument } from '../repo/frontmatter'
import { splitCandidateFacts } from '../repo/drafts'
import { isMarkdownFileName, matchChapterFileName } from '../repo/paths'
import { sha256Hex } from '../repo/hash'
import { TRANSACTION_DIR } from '../repo/lock'
import { takeCachedSnapshot, putCachedSnapshot } from './cache'
import { SearchError, type SearchChunk, type SearchDocument, type SearchIssue, type SearchSnapshot } from './types'

export const CHUNK_VERSION = 'paragraph-800-overlap-256-v1'
const MAX_DOCUMENT_BYTES = 16 * 1024 * 1024
/** 哈希单源(批F):与 core 各处 sha256 包装同字节(字符串 utf8/字节原样),指纹逐字节不变。 */
export const digest = (text: string | Buffer): string => sha256Hex(text)

/** Pin the checked file while reading, so a replaced path cannot supply outside bytes. */
async function readCheckedFinalized(base: string, relative: string, signal?: AbortSignal): Promise<{ bytes: Buffer; absolutePath: string }> {
  signal?.throwIfAborted()
  validateAuthorRelativePath(relative)
  const filename = path.join(base, relative)
  // base is canonical for this scan. Exact physical equality rejects links in
  // every descendant component without resolving the same root 16 times/file.
  const checkPhysicalPath = () => {
    if (stripDevicePrefix(fs.realpathSync.native(filename)) !== filename) throw new SearchError('unsafe-source', '定稿路径包含链接或别名')
  }
  checkPhysicalPath()
  const initial = await fs.promises.lstat(filename)
  if (!initial.isFile() || initial.isSymbolicLink() || initial.nlink !== 1) {
    throw new SearchError('unsafe-source', '定稿文件不得为链接或共享硬链接')
  }
  if (initial.size > MAX_DOCUMENT_BYTES) throw new SearchError('invalid-document', '定稿文件超过 16 MiB，未截断索引')
  const handle = await fs.promises.open(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0))
  try {
    const opened = await handle.stat()
    if (opened.dev !== initial.dev || opened.ino !== initial.ino || opened.nlink !== 1) {
      throw new SearchError('unsafe-source', '定稿文件在打开时被替换，请重新检索')
    }
    const bytes = await handle.readFile({ signal })
    checkPhysicalPath()
    const current = await fs.promises.lstat(filename)
    const finished = await handle.stat()
    if (!current.isFile() || current.nlink !== 1 || current.dev !== opened.dev || current.ino !== opened.ino
      || finished.size !== opened.size || finished.mtimeMs !== opened.mtimeMs || finished.ctimeMs !== opened.ctimeMs) {
      throw new SearchError('source-changed', '定稿在读取期间已变化，请重新检索')
    }
    if (bytes.length > MAX_DOCUMENT_BYTES || bytes.includes(0)) throw new SearchError('invalid-document', '定稿文件大小或文本格式不受支持')
    return { bytes, absolutePath: filename }
  } finally { await handle.close() }
}

export async function readFinalizedBytes(root: string, relative: string, signal?: AbortSignal): Promise<Buffer> {
  return (await readCheckedFinalized(canonicalizePath(root), relative, signal)).bytes
}

/** Do not recover or consume half a source transaction from a read operation. */
export function assertSourceSettled(root: string): void {
  const directory = path.join(root, TRANSACTION_DIR)
  try {
    if (fs.lstatSync(directory).isSymbolicLink() || fs.readdirSync(directory).length > 0) {
      throw new SearchError('recovery-required', '书仓存在待处理事务，请先完成既有恢复后再检索')
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

function chunksOf(relative: string, hash: string, body: string, precedingLines: number): SearchChunk[] {
  const chunks: SearchChunk[] = []
  let start = 0
  while (start < body.length) {
    let end = Math.min(body.length, start + 800)
    if (end < body.length) {
      const paragraph = body.lastIndexOf('\n\n', end)
      if (paragraph > start + 400) end = paragraph + 2
      if (/^[\uDC00-\uDFFF]$/.test(body[end]!)) end--
    }
    const text = body.slice(start, end)
    if (text.trim()) chunks.push({
      id: digest(`${relative}\0${hash}\0${start}\0${CHUNK_VERSION}`), path: relative, start, end, text,
      startLine: precedingLines + body.slice(0, start).split('\n').length,
      endLine: precedingLines + body.slice(0, end).replace(/\n$/, '').split('\n').length,
    })
    if (end === body.length) break
    start = end - 256
    if (/^[\uDC00-\uDFFF]$/.test(body[start]!)) start--
  }
  return chunks
}

/**
 * stat 档指纹(批8,0.0.57):定稿树逐文件 `rel\0size\0mtime\0ctime\0ino`(符号链接与目录形态
 * 如实入指纹)＋场景记录文件 stat(分块依据)。比内容哈希便宜一个量级——一致则复用快照,
 * 不一致才全量重扫。逐命中再读校验(readFinalizedBytes)不受本缓存影响。
 */
async function statFingerprintOf(root: string, signal?: AbortSignal): Promise<string> {
  const parts: string[] = []
  const walkStat = async (relative: string): Promise<void> => {
    signal?.throwIfAborted()
    let entries: fs.Dirent[]
    try { entries = await fs.promises.readdir(authorDocumentPath(root, relative), { withFileTypes: true }) }
    catch (error) {
      parts.push(`${relative}\u0000missing${(error as NodeJS.ErrnoException).code === 'ENOENT' ? '' : '-error'}`)
      return
    }
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    for (const entry of entries) {
      signal?.throwIfAborted()
      if (entry.name.startsWith('.')) continue
      const rel = path.posix.join(relative, entry.name)
      if (entry.isSymbolicLink()) { parts.push(`${rel}\u0000symlink`); continue }
      if (entry.isDirectory()) { await walkStat(rel); continue }
      try {
        const st = await fs.promises.lstat(path.join(root, rel))
        parts.push(`${rel}\u0000${st.size}\u0000${st.mtimeMs}\u0000${st.ctimeMs}\u0000${st.ino}`)
      } catch {
        parts.push(`${rel}\u0000stat-error`)
      }
    }
  }
  await walkStat('定稿')
  try {
    const st = await fs.promises.stat(path.join(root, SCENE_CACHE_PATH))
    parts.push(`scenes\u0000${st.size}\u0000${st.mtimeMs}\u0000${st.ctimeMs}\u0000${st.ino}`)
  } catch {
    parts.push('scenes\u0000missing')
  }
  return digest(parts.sort().join('\n'))
}

export async function scanFinalized(root: string, signal?: AbortSignal): Promise<SearchSnapshot> {
  root = canonicalizePath(root)
  assertSourceSettled(root)
  signal?.throwIfAborted()
  // 指纹缓存(批8):stat 档一致直接复用上次快照——一次检索最多三次复扫,首次仍全量。
  const statFingerprint = await statFingerprintOf(root, signal)
  const cached = takeCachedSnapshot(root, statFingerprint)
  if (cached !== undefined) return cached
  const documents: SearchDocument[] = []
  const issues: SearchIssue[] = []
  const observations: string[] = []
  const scenes = readSceneRecords(root)
  const issue = (relative: string, code: SearchIssue['code'], message: string) => {
    issues.push({ path: relative, code, message }); observations.push(`${relative}\0${code}`)
  }
  const walk = async (relative: string): Promise<void> => {
    signal?.throwIfAborted()
    let entries: fs.Dirent[]
    try { entries = await fs.promises.readdir(authorDocumentPath(root, relative), { withFileTypes: true }) }
    catch (error) {
      if (relative === '定稿' && (error as NodeJS.ErrnoException).code === 'ENOENT') return
      issue(relative, 'read-error', '定稿目录无法读取'); return
    }
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    for (const entry of entries) {
      signal?.throwIfAborted()
      if (entry.name.startsWith('.')) continue
      const rel = path.posix.join(relative, entry.name)
      if (entry.isSymbolicLink()) { issue(rel, 'unsafe-path', '定稿目录中的链接不参与检索'); continue }
      if (relative === '定稿') {
        if (entry.isDirectory() && /^卷\d+$/.test(entry.name)) await walk(rel)
        continue
      }
      // 章节文件名口径单源(批F,宽松 1–4 位):卷目录前缀定卷,文件名过 matchChapterFileName
      const volumeMatch = /^定稿\/卷(\d+)\//i.exec(rel)
      if (volumeMatch === null || !entry.isFile() || !isMarkdownFileName(rel)) continue
      const key = matchChapterFileName(rel.slice(volumeMatch[0].length))
      if (key === null) continue
      if (!(Number.isSafeInteger(Number(volumeMatch[1])) && Number(volumeMatch[1]) > 0 && key.章 > 0)) {
        issue(rel, 'invalid-document', '定稿卷号或章号不是有效正整数'); continue
      }
      try {
        const { absolutePath, bytes } = await readCheckedFinalized(root, rel, signal)
        let raw: string
        try { raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
        catch { issue(rel, 'invalid-document', '定稿文件不是有效 UTF-8'); continue }
        const hash = digest(bytes)
        observations.push(`${rel}\0${hash}`)
        const parsed = parseDocument(raw)
        if (!parsed.ok) { issue(rel, 'invalid-document', '定稿 frontmatter 解析失败'); continue }
        if (parsed.data.fields['角色'] !== undefined && parsed.data.fields['角色'] !== '已定稿') {
          issue(rel, 'invalid-document', '定稿目录中的文档角色不是已定稿'); continue
        }
        const normalized = raw.replace(/\r\n/g, '\n')
        const prose = splitCandidateFacts(parsed.data.body).prose
        const bodyHash = sceneBodyHash(prose)
        const scene = currentSceneRecord(scenes, bodyHash, proseParagraphs(prose).length)
        if (scene) observations.push(rel + '\0scene\0' + JSON.stringify(scene))
        const offset = normalized.length - parsed.data.body.length + parsed.data.body.indexOf(prose)
        const precedingLines = normalized.slice(0, offset).split('\n').length - 1
        const version = parsed.data.fields['版本']
        documents.push({
          path: rel, absolutePath, hash, volume: Number(volumeMatch[1]), chapter: key.章, title: key.章名,
          version: typeof version === 'number' && Number.isFinite(version) || typeof version === 'string' && version.trim() ? version as string | number : '未知',
          prose, bodyHash, sceneStatus: scene?.status, sceneReason: scene?.reason,
          chunks: scene?.status === 'ready' ? sceneChunks(rel, hash, prose, precedingLines, scene) : chunksOf(rel, hash, prose, precedingLines),
        })
      } catch (error) {
        signal?.throwIfAborted()
        if (error instanceof SearchError) {
          if (error.code === 'source-changed') throw error
          if (error.code === 'unsafe-source') { issue(rel, 'unsafe-path', error.message); continue }
          if (error.code === 'invalid-document') { issue(rel, 'invalid-document', error.message); continue }
        }
        issue(rel, 'read-error', '定稿文件无法读取或路径不安全')
      }
    }
  }
  await walk('定稿')
  documents.sort((a, b) => a.chapter - b.chapter || a.volume - b.volume || a.path.localeCompare(b.path, 'zh-CN'))
  const snapshot: SearchSnapshot = { documents, issues, fingerprint: digest(observations.sort().join('\n')) }
  putCachedSnapshot(root, statFingerprint, snapshot)
  return snapshot
}
