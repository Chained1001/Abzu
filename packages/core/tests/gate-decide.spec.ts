/**
 * 书仓内写入门禁单源(0.0.65 第一批):`decideBookWrite` 是 core 对书仓内目标
 * 的唯一判定入口,`decidePreExecute` 对改写工具委托给它,不再各写一份。
 *
 * 覆盖:草稿区合法路径 allow;草稿区非法章键 deny;定稿/构想/真源 deny;
 * `../` 逃逸 deny;绝对路径与相对路径同判;write 工具与 decideBookWrite 同判;
 * 非改写工具 / read 一律放行。
 */
import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { decideBookWrite } from '../src/gate'
import { decidePreExecute } from '../src/gate/preExecute'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-gate-decide-'))
  roots.push(dir)
  return dir
}
afterAll(() => {
  for (const root of roots) {
    try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ }
  }
})

function write(file_path: string) {
  return { name: 'write', arguments: { file_path } }
}

describe('decideBookWrite(书仓内写入门禁单源)', () => {
  it('草稿区合法路径 allow(既有草稿区目录与可解析章键草稿)', () => {
    const root = mkBook()
    expect(decideBookWrite(root, '草稿区/章细纲/卷01-初见.md')).toEqual({ kind: 'allow' })
    expect(decideBookWrite(root, '草稿区/草稿/卷01-0001-初见/稿1.md')).toEqual({ kind: 'allow' })
    expect(decideBookWrite(root, path.join(root, '草稿区/章细纲/卷01-初见.md'))).toEqual({ kind: 'allow' })
  })

  it('草稿区非法章键 deny(路径形状校验,门禁文案不变)', () => {
    const root = mkBook()
    const d = decideBookWrite(root, '草稿区/草稿/随意路径/稿1.md')
    expect(d.kind).toBe('deny')
    if (d.kind === 'deny') expect(d.reason).toMatch(/章节键/)
  })

  it('定稿/构想/真源 deny(分区文案与 gateFileAccess 一致)', () => {
    const root = mkBook()
    const finalized = decideBookWrite(root, '定稿/卷01/0001-初见.md')
    expect(finalized.kind).toBe('deny')
    if (finalized.kind === 'deny') expect(finalized.reason).toMatch(/定稿区只读/)

    const idea = decideBookWrite(root, '构想/构想快照.md')
    expect(idea.kind).toBe('deny')
    if (idea.kind === 'deny') expect(idea.reason).toMatch(/构想快照建书后只读/)

    const source = decideBookWrite(root, '故事剧情/全书大纲.md')
    expect(source.kind).toBe('deny')
    if (source.kind === 'deny') expect(source.reason).toMatch(/真源区.*文件工具不得改写/)
  })

  it('../ 逃逸 deny(相对与绝对两种写法同判)', () => {
    const root = mkBook()
    for (const target of [
      '../越界.md',
      path.join(root, '..', '越界.md'),
      path.join(root, 'a', '..', '..', '越界.md'),
    ]) {
      const d = decideBookWrite(root, target)
      expect(d.kind, target).toBe('deny')
      if (d.kind === 'deny') expect(d.reason, target).toMatch(/路径逃逸书仓根/)
    }
  })

  it('绝对路径与相对路径同判(allow 与各 deny 分支)', () => {
    const root = mkBook()
    const rels = [
      '草稿区/章细纲/卷01-初见.md',
      '草稿区/草稿/卷01-0001-初见/稿1.md',
      '草稿区/草稿/随意路径/稿1.md',
      '定稿/卷01/0001-初见.md',
      '构想/构想快照.md',
      '故事剧情/全书大纲.md',
    ]
    for (const rel of rels) {
      const absolute = path.join(root, rel)
      expect(decideBookWrite(root, absolute), rel).toEqual(decideBookWrite(root, rel))
    }
  })

  it('decidePreExecute 对 write 工具与 decideBookWrite 同判', () => {
    const root = mkBook()
    const targets = [
      '草稿区/章细纲/卷01-初见.md',
      '草稿区/草稿/卷01-0001-初见/稿1.md',
      '草稿区/草稿/随意路径/稿1.md',
      '定稿/卷01/0001-初见.md',
      '构想/构想快照.md',
      '故事剧情/全书大纲.md',
      '../越界.md',
    ]
    for (const target of targets) {
      expect(decidePreExecute(root, write(target)), target).toEqual(decideBookWrite(root, target))
      const absolute = path.isAbsolute(target) ? target : path.join(root, target)
      expect(decidePreExecute(root, write(absolute)), absolute).toEqual(decideBookWrite(root, absolute))
    }
    expect(decidePreExecute(root, { name: 'edit', arguments: { file_path: path.join(root, '定稿/卷01/0001-初见.md') } }))
      .toEqual(decideBookWrite(root, path.join(root, '定稿/卷01/0001-初见.md')))
  })

  it('非改写工具 / read 放行(即便目标落在只读分区)', () => {
    const root = mkBook()
    const finalized = path.join(root, '定稿/卷01/0001-初见.md')
    expect(decidePreExecute(root, { name: 'read', arguments: { file_path: finalized } })).toEqual({ kind: 'allow' })
    expect(decidePreExecute(root, { name: 'read_image', arguments: { file_path: path.join(root, '定稿/插图.png') } })).toEqual({ kind: 'allow' })
    expect(decidePreExecute(root, { name: 'str_replace_editor', arguments: { command: 'view', path: finalized } })).toEqual({ kind: 'allow' })
    expect(decidePreExecute(root, { name: 'todo_write', arguments: { todos: [] } })).toEqual({ kind: 'allow' })
    expect(decidePreExecute(root, { name: 'novel_get_story_status', arguments: { bookId: 'b-1' } })).toEqual({ kind: 'allow' })
    // 对照:同一路径对写工具仍 deny,放行只因工具只读。
    expect(decideBookWrite(root, '定稿/卷01/0001-初见.md').kind).toBe('deny')
  })
})
