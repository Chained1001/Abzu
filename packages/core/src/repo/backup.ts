/**
 * 一键备份(数据保护三件套 #3):书仓(含真源 git＋草稿区独立 git)＋书房(含 git)＋profiles
 * 全量只读复制到 `备份/{书名}-{YYYYMMDD-HHmmss}/` 目录;零依赖 zip 替代=目录＋manifest.json
 * (逐文件 SHA-256,口径与 computeExport 同源:原始字节 materialHash)。
 *
 * 只新增不覆盖:输出目录名冲突时追加 -2/-3;备份只复制源文件,不改书仓、书房与任何 git。
 * manifest.json 最后落盘(与最小导出同纪律:清单存在不代表完成);落盘后回读复验哈希。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { canonicalizePath, isInsidePath } from '../gate/canonical'
import { materialHash } from '../assembly/source'
import { pad, validateSegment } from './paths'

export interface BackupEntry {
  /** 备份内的 posix 相对路径(书仓/…、书房/…、profiles/…)。 */
  readonly 路径: string
  readonly sha256: string
  readonly 字节: number
}

export interface BackupOptions {
  /** 书房所在工作范围根;缺省取书仓父目录(R20:书与书房是同工作范围的兄弟)。 */
  readonly 书房?: string
  /** 输出目录(备份根);缺省 `<工作范围>/备份`。 */
  readonly 目标?: string}

export type BackupReport =
  | {
    readonly ok: true
    readonly 书名: string
    readonly 输出目录: string
    readonly 含书房: boolean
    readonly 含profiles: boolean
    readonly 文件数: number
    readonly 合计字节: number
    readonly 条目: readonly BackupEntry[]
    /** 落盘后回读复验:不一致文件清单为空才算完整备份。 */
    readonly 校验: { readonly 一致: number; readonly 不一致: readonly string[] }
  }
  | { readonly ok: false; readonly problems: readonly string[] }

function localStamp(d = new Date()): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

interface CopySource {
  readonly label: string
  readonly dir: string
}

function walkFiles(abs: string, rel: string, problems: string[]): Array<{ rel: string; abs: string }> {
  const out: Array<{ rel: string; abs: string }> = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true })
  } catch (err) {
    problems.push(`目录无法读取:${rel || '.'}(${err instanceof Error ? err.message : String(err)})`)
    return out
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))) {
    const childAbs = path.join(abs, entry.name)
    const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`
    if (entry.isSymbolicLink()) {
      problems.push(`链接或别名不进备份,原样留在源处:${childRel}`)
      continue
    }
    if (entry.isDirectory()) {
      out.push(...walkFiles(childAbs, childRel, problems))
      continue
    }
    if (entry.isFile()) out.push({ rel: childRel, abs: childAbs })
  }
  return out
}

/** 备份一本书:只读复制＋manifest 最后落盘＋回读复验;任何复制失败如实列入 problems。 */
export function backupBook(bookRoot: string, options: BackupOptions = {}): BackupReport {
  const problems: string[] = []
  const root = canonicalizePath(bookRoot)
  if (root === '') return { ok: false, problems: ['书仓路径无效'] }
  try {
    if (!fs.statSync(root).isDirectory()) return { ok: false, problems: ['书仓路径不是目录'] }
  } catch {
    return { ok: false, problems: [`书仓不存在:${bookRoot}`] }
  }
  const 书名 = path.basename(root)
  if (validateSegment(书名).length > 0) return { ok: false, problems: [`书名不能做备份目录名:${书名}`] }

  const workspace = canonicalizePath(options.书房 !== undefined && options.书房 !== '' ? options.书房 : path.dirname(root))
  if (workspace === '') return { ok: false, problems: ['工作范围路径无效'] }
  const sources: CopySource[] = [{ label: '书仓', dir: root }]
  let studyAbs: string | null = null
  try {
    studyAbs = path.join(workspace, '书房')
    if (fs.statSync(studyAbs).isDirectory()) sources.push({ label: '书房', dir: studyAbs })
    else studyAbs = null
  } catch {
    studyAbs = null
  }
  let profilesAbs: string | null = null
  try {
    profilesAbs = path.join(workspace, 'profiles')
    if (fs.statSync(profilesAbs).isDirectory()) sources.push({ label: 'profiles', dir: profilesAbs })
    else profilesAbs = null
  } catch {
    profilesAbs = null
  }

  const base = canonicalizePath(options.目标 !== undefined && options.目标 !== '' ? options.目标 : path.join(workspace, '备份'))
  if (base === '') return { ok: false, problems: ['输出目录路径无效'] }
  if (isInsidePath(path.join(root, '草稿区'), base) || base === root || isInsidePath(root, base) || (studyAbs !== null && (base === studyAbs || isInsidePath(studyAbs, base)))) {
    return { ok: false, problems: ['输出目录落在被备份目录内,拒绝自我嵌套:请另选目录'] }
  }
  try {
    fs.mkdirSync(base, { recursive: true })
  } catch (err) {
    return { ok: false, problems: [`备份根目录不可创建:${base}(${err instanceof Error ? err.message : String(err)})`] }
  }
  // 原子占位:直接 mkdir 抢目录名(EEXIST/占用类错误换下一个序号),不做「先查再建」的窗口
  const stamp = localStamp()
  let outputDir: string | null = null
  for (let n = 1; n < 100; n += 1) {
    const candidate = path.join(base, n === 1 ? `${书名}-${stamp}` : `${书名}-${stamp}-${n}`)
    try {
      fs.mkdirSync(candidate)
      outputDir = candidate
      break
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      // EPERM/ENOTDIR 两义:同名文件占位(换序号)或目录不可写(如实报)——以目标是否实存消歧
      const occupied = code === 'EEXIST' || code === 'ENOTEMPTY'
        || ((code === 'EPERM' || code === 'ENOTDIR') && fs.existsSync(candidate))
      if (!occupied) {
        return { ok: false, problems: [`备份目录不可创建:${candidate}(${err instanceof Error ? err.message : String(err)})`] }
      }
    }
  }
  if (outputDir === null) return { ok: false, problems: ['备份目录名冲突且序号耗尽,请另选输出目录'] }

  const entries: BackupEntry[] = []
  for (const source of sources) {
    for (const file of walkFiles(source.dir, '', problems)) {
      const rel = `${source.label}/${file.rel.split('\\').join('/')}`
      const dest = path.join(outputDir, source.label, ...file.rel.split('/'))
      try {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(file.abs, dest)
        const bytes = fs.readFileSync(dest)
        entries.push({ 路径: rel, sha256: materialHash(bytes), 字节: bytes.length })
      } catch (err) {
        problems.push(`复制失败:${rel}(${err instanceof Error ? err.message : String(err)})`)
      }
    }
  }
  const 不一致: string[] = []
  for (const entry of entries) {
    try {
      const actual = materialHash(fs.readFileSync(path.join(outputDir, ...entry.路径.split('/'))))
      if (actual !== entry.sha256) 不一致.push(entry.路径)
    } catch {
      不一致.push(entry.路径)
    }
  }
  const manifest = {
    工具: '一键备份',
    书名,
    备份时间: localStamp(),
    来源: { 书仓: root, 工作范围: workspace, 含书房: studyAbs !== null, 含profiles: profilesAbs !== null },
    文件数: entries.length,
    合计字节: entries.reduce((sum, e) => sum + e.字节, 0),
    口径: '逐文件原始字节 SHA-256(与最小导出清单同口径);manifest.json 最后落盘;落盘后已回读复验。',
    条目: entries,
  }
  try {
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
  } catch (err) {
    problems.push(`manifest.json 落盘失败(${err instanceof Error ? err.message : String(err)})`)
  }
  if (problems.length > 0 || 不一致.length > 0) {
    return { ok: false, problems: [...problems, ...(不一致.length > 0 ? [`复验不一致 ${不一致.length} 个文件:${不一致.join('、')}`] : [])] }
  }
  return {
    ok: true,
    书名,
    输出目录: outputDir,
    含书房: studyAbs !== null,
    含profiles: profilesAbs !== null,
    文件数: entries.length,
    合计字节: manifest.合计字节,
    条目: entries,
    校验: { 一致: entries.length, 不一致: [] },
  }
}
