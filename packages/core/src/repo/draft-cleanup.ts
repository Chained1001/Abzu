/**
 * 定稿后清理草稿区(批8,0.0.57):settle 入档成功后删本章草稿区五处工件。
 *
 * 动因:草稿区/草稿|材料包|审核|定稿准备＋候选细纲原先定稿后永久留存——draft-git 每次
 * `add -A` 全量索引随书膨胀,千章书草稿区拖累所有快照。入档(ch: 提交)原子完成后调用,
 * 清理失败**不回滚入档**(入档已原子完成),由调用方如实播报。
 *
 * 删除目标覆盖新旧两代键(0.0.57 起键带章号;旧书 `卷NN-章名` 一并清)——任一不存在跳过。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { legacyPaths, paths } from './paths'
import { resolveCandidateOutlineRel, type DraftChapterKeyLike } from './draft-paths'
import { removeSync } from './remove'

export interface DraftChapterCleanup {
  /** 实际删除的相对路径(含落过盘的新旧两代键)。 */
  readonly removed: readonly string[]
  /** 不存在而跳过的相对路径。 */
  readonly skipped: readonly string[]
}

/** 本章草稿区五处工件的全部候选路径(新键＋旧键＋候选细纲认领位),去重保序。 */
export function draftCleanupTargets(bookRoot: string, key: DraftChapterKeyLike): readonly string[] {
  const 章 = key.章 ?? 0
  const rels = [
    paths.候选细纲(key.卷, 章, key.章名),
    legacyPaths.候选细纲(key.卷, key.章名),
    resolveCandidateOutlineRel(bookRoot, key),
    paths.材料包目录(key.卷, 章, key.章名),
    legacyPaths.材料包目录(key.卷, key.章名),
    paths.草稿目录(key.卷, 章, key.章名),
    legacyPaths.草稿目录(key.卷, key.章名),
    paths.待定稿包目录(key.卷, 章, key.章名),
    legacyPaths.待定稿包目录(key.卷, key.章名),
    paths.审核记录(key.卷, 章, key.章名),
    legacyPaths.审核记录(key.卷, key.章名),
  ]
  return [...new Set(rels)]
}

/** 本章草稿区五处是否尚有残留(任一候选路径在盘即 true)——存量清理 CLI 的判定口径。 */
export function draftChapterResidue(bookRoot: string, key: DraftChapterKeyLike): readonly string[] {
  return draftCleanupTargets(bookRoot, key).filter((rel) => {
    try { return fs.existsSync(path.join(bookRoot, rel)) } catch { return false }
  })
}

/**
 * 删本章草稿区五处(草稿/材料包/审核记录/待定稿包/候选细纲),新旧两代键都清;
 * 任一不存在跳过。只删列出的路径本身,不递归删父目录。
 */
export function archiveDraftChapter(bookRoot: string, key: DraftChapterKeyLike): DraftChapterCleanup {
  const removed: string[] = []
  const skipped: string[] = []
  for (const rel of draftCleanupTargets(bookRoot, key)) {
    try {
      if (fs.existsSync(path.join(bookRoot, rel))) {
        removeSync(path.join(bookRoot, rel))
        removed.push(rel)
      } else {
        skipped.push(rel)
      }
    } catch (err) {
      throw new Error(`草稿区清理失败:${rel}——${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return { removed, skipped }
}
