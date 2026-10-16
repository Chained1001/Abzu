/**
 * 草稿区双格式读侧解析(批8,0.0.57):新键 `卷NN-NNNN-章名` 优先、旧键 `卷NN-章名` fallback。
 *
 * 写侧一律以 paths.*(新键)为目标,但**落点经本模块解析**——该章旧格式工件还在旧位置时,
 * 重写/续写落在旧位置(同章工件不分裂到两个目录);全新工件落新键。旧书(0.0.57 前目录)
 * 全程无感:读、写、定稿清理都同时覆盖两代路径。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { legacyPaths, paths } from './paths'
import type { ChapterKey } from '../derive/scan'

export type DraftPathKind = '候选细纲' | '材料包目录' | '草稿目录' | '待定稿包目录' | '审核记录'

/** 章键的宽松形状(章可缺省——窗口新章未定位,按 章:0 处理)。 */
export type DraftChapterKeyLike = Pick<ChapterKey, '卷' | '章名'> & { readonly 章?: number }

/**
 * 双格式解析:新键在(文件或目录)则用新键;否则旧键(都不在回新键,缺失由调用方判)。
 * 新旧同在(升级中途的半迁移态)以新键为准——写侧产物视为权威。
 * 候选细纲例外:走 resolveCandidateOutlineRel(候选先于章定位落盘,须按 卷+章名 认领)。
 */
export function resolveDraftRel(bookRoot: string, kind: DraftPathKind, key: DraftChapterKeyLike): string {
  if (kind === '候选细纲') return resolveCandidateOutlineRel(bookRoot, key)
  const rel = paths[kind](key.卷, key.章 ?? 0, key.章名)
  try {
    if (fs.existsSync(path.join(bookRoot, rel))) return rel
    const legacy = legacyPaths[kind](key.卷, key.章名)
    if (fs.existsSync(path.join(bookRoot, legacy))) return legacy
  } catch {
    /* 解析不了当不存在 */
  }
  return rel
}

/**
 * 候选细纲认领(批8):候选细纲在章定位**之前**落盘(novel_write_outline 不带章号),
 * 可能带 0000 占位号、旧格式无号、或早期定位号——章细纲目录里任何 `卷NN[-NNNN]-章名.md`
 * 形态的同卷同名候选都算本章的;目标新键在则优先(重写走最新落点)。
 * 章号比对(0.0.60):已定位章(章>0)不认领别的章的同名候选——候选带号且与 key.章 不等
 * 时跳过;0000 占位与旧格式无号仍可认领(先于定位落盘的正当形态)。
 */
export function resolveCandidateOutlineRel(bookRoot: string, key: DraftChapterKeyLike): string {
  const target = paths.候选细纲(key.卷, key.章 ?? 0, key.章名)
  try {
    if (fs.existsSync(path.join(bookRoot, target))) return target
    const dirAbs = path.join(bookRoot, '草稿区', '章细纲')
    for (const name of fs.readdirSync(dirAbs).sort()) {
      const m = /^卷(\d+)(?:-(\d{1,4}))?-(.+?)\.md$/i.exec(name)
      if (m === null || Number(m[1]) !== key.卷 || m[3] !== key.章名) continue
      const 候选章 = m[2] === undefined ? 0 : Number(m[2])
      if ((key.章 ?? 0) > 0 && 候选章 > 0 && 候选章 !== (key.章 ?? 0)) continue
      return `草稿区/章细纲/${name}`
    }
  } catch {
    /* 目录读不了按缺失处理 */
  }
  return target
}
