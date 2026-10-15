import { afterEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { writeAuthorMemory } from '../src/memory/author'
import { removeSync } from '../src/repo/remove'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach(removeSync))

function root(): string {
  const value = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-author-memory-guard-'))
  roots.push(value)
  return value
}

const base = {
  描述: '一行描述',
  类: '决策' as const,
  标签: ['书名'],
  来源: '对谈',
}

describe('作者记忆写入守卫（0.0.30：新增不覆盖＋更新须原文）', () => {
  it('新增不传原文；同名已存在时新增拒绝，提示走更新', () => {
    const workspace = root()
    const first = writeAuthorMemory(workspace, { ...base, 名称: '文风基准', 正文: '第一条' })
    expect(first).toMatchObject({ ok: true, updated: false })
    const conflict = writeAuthorMemory(workspace, { ...base, 名称: '文风基准', 正文: '想覆盖的第二条' })
    expect(conflict).toMatchObject({ ok: false })
    if (conflict.ok) return
    expect(conflict.reason).toContain('已存在')
    expect(conflict.reason).toContain('更新')
    const file = path.join(workspace, '书房/作者记忆/文风基准.md')
    expect(fs.readFileSync(file, 'utf-8')).toContain('第一条')
  })

  it('同内容重复新增幂等返回已更新，不重写文件', () => {
    const workspace = root()
    const first = writeAuthorMemory(workspace, { ...base, 名称: '同条', 正文: '同文' })
    expect(first).toMatchObject({ ok: true, updated: false })
    const again = writeAuthorMemory(workspace, { ...base, 名称: '同条', 正文: '同文', 描述: '一行描述' })
    expect(again).toMatchObject({ ok: true, updated: true })
    const file = path.join(workspace, '书房/作者记忆/同条.md')
    const before = fs.readFileSync(file, 'utf-8')
    expect(writeAuthorMemory(workspace, { ...base, 名称: '同条', 正文: '同文' })).toMatchObject({ ok: true })
    expect(fs.readFileSync(file, 'utf-8')).toBe(before)
  })

  it('更新须提供完整原文；原文不匹配拒绝，匹配后写入', () => {
    const workspace = root()
    writeAuthorMemory(workspace, { ...base, 名称: '目标', 正文: '旧正文' })
    const file = path.join(workspace, '书房/作者记忆/目标.md')
    const current = fs.readFileSync(file, 'utf-8')
    const missing = writeAuthorMemory(workspace, { ...base, 名称: '目标', 正文: '新正文', 操作: '更新' })
    expect(missing).toMatchObject({ ok: false })
    if (!missing.ok) expect(missing.reason).toContain('完整原文')
    const stale = writeAuthorMemory(workspace, { ...base, 名称: '目标', 正文: '新正文', 操作: '更新', 原文: current.replace('旧正文', '别的旧版') })
    expect(stale).toMatchObject({ ok: false })
    if (!stale.ok) expect(stale.reason).toContain('原文已变化')
    const ok = writeAuthorMemory(workspace, { ...base, 名称: '目标', 正文: '新正文', 操作: '更新', 原文: current })
    expect(ok).toMatchObject({ ok: true, updated: true })
    expect(fs.readFileSync(file, 'utf-8')).toContain('新正文')
  })

  it('更新不存在的条目拒绝；新增操作不接受原文参数', () => {
    const workspace = root()
    const missing = writeAuthorMemory(workspace, { ...base, 名称: '没有这条', 正文: 'x', 操作: '更新', 原文: '旧' })
    expect(missing).toMatchObject({ ok: false })
    if (!missing.ok) expect(missing.reason).toContain('更新目标不存在')
    const badNew = writeAuthorMemory(workspace, { ...base, 名称: '新条', 正文: 'x', 操作: '新增', 原文: '不该带' })
    expect(badNew).toMatchObject({ ok: false })
    if (!badNew.ok) expect(badNew.reason).toContain('不接受更新原文')
  })

  it('条目与索引走事务原子写(0.0.46):落盘后运行目录无半账,索引行同步', () => {
    const workspace = root()
    const first = writeAuthorMemory(workspace, { ...base, 名称: '原子写', 正文: '第一条' })
    expect(first).toMatchObject({ ok: true, updated: false })
    const second = writeAuthorMemory(workspace, { ...base, 名称: '第二条', 正文: '第二条正文' })
    expect(second).toMatchObject({ ok: true, updated: false })
    const dir = path.join(workspace, '书房/作者记忆')
    // 写入边界在记忆目录本身(对齐 inspire/pool.ingestNote 的书房锁先例):事务已提交清账
    expect(fs.readdirSync(path.join(dir, '.abzu', 'transactions'))).toEqual([])
    const index = fs.readFileSync(path.join(dir, '索引.md'), 'utf8')
    expect(index).toContain('[原子写](原子写.md)')
    expect(index).toContain('[第二条](第二条.md)')
  })
})
