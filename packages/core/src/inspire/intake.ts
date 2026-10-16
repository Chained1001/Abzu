/**
 * 参考摄入三分流(插件规格 §5 灵感节点):只登记提案,不写入真源。
 * 建书前提案落书房 提案/;书仓 草稿区/提案/ 待有书后再写。
 */

import * as path from 'node:path'
import { serializeDocument } from '../repo/frontmatter'
import { assertSegment } from '../repo/paths'
import { withBookWrite, writeFileAtomic } from '../repo/atomic'

export const 摄入分流 = ['设定候选', '文风候选', '方法候选'] as const
export type IntakeBucket = (typeof 摄入分流)[number]

export type IntakeDest = '书仓提案' | '记忆提案' | '方法库提案'

export interface IntakeProposal {
  readonly source: string
  readonly bucket: IntakeBucket
  readonly dest: IntakeDest
  readonly recordedAt: string
  readonly id: string
}

export interface IntakeRoute {
  readonly bucket: IntakeBucket
  readonly dest: IntakeDest
  readonly proposal: IntakeProposal
}

const DEST: Record<IntakeBucket, IntakeDest> = {
  设定候选: '书仓提案',
  文风候选: '记忆提案',
  方法候选: '方法库提案',
}

export function destOf(bucket: IntakeBucket): IntakeDest {
  return DEST[bucket]
}

/** 按建议桶路由;可选持久化到书房 提案/。不写真源。 */
export function routeIntake(source: string, bucket: IntakeBucket, authorRoot?: string): IntakeRoute {
  const dest = destOf(bucket)
  const recordedAt = new Date().toISOString()
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const proposal: IntakeProposal = { source, bucket, dest, recordedAt, id }
  if (authorRoot !== undefined) {
    assertSegment(id, '提案id')
    const dir = path.join(authorRoot, '提案')
    const text = serializeDocument(
      { 状态: '候选', 身份: id, 来源快照: source },
      [`# ${bucket}`, '', `去向:${dest}`, '', source].join('\n'),
    )
    // 提案文件走原子写＋书房写入边界(对齐 inspire/pool.ingestNote 先例):
    // id 虽唯一无覆盖竞争,但直写 fs.writeFileSync 半写可现、崩溃无恢复。
    withBookWrite(dir, () => {
      writeFileAtomic(dir, `${id}.md`, text)
    })
  }
  return { bucket, dest, proposal }
}
