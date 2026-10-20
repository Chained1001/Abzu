/**
 * 审读汇总(0.0.87 跨章留痕的消费方):把已入档章的审读摘要聚成卷级/全书报表。
 *
 * 本测试直接摆摘要文件,锁四件事:
 * 1. 跨章累加正确(发现项、严重程度、处置、模块次数);
 * 2. 卷范围过滤正确;
 * 3. 「有定稿章但没摘要」被如实数出来,而不是当作零发现项(不缺报、不虚报);
 * 4. 未完成审核的章被单列,不混进「审得干净」的假象。
 */
import { afterEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { removeSync } from '../../core/src/repo/remove'
import { LAYOUT } from '../../core/src/repo/paths'
import { summarizeReviewDigests } from '../../core/src/evidence/digest-report'
import { MACHINE_SCHEMA_VERSION, serializeMachineJson } from '../../core/src/repo/schema'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach((r) => removeSync(r)))

function mkBook(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-digest-report-'))
  roots.push(root)
  return root
}

function writeDigest(root: string, 卷: number, 章: number, 章名: string, body: Record<string, unknown>): void {
  const dir = path.join(root, LAYOUT.定稿(卷), '审读摘要')
  fs.mkdirSync(dir, { recursive: true })
  const text = serializeMachineJson(
    {
      schemaVersion: MACHINE_SCHEMA_VERSION,
      章: { 卷, 章, 章名 },
      审核完成: true,
      发现项总数: 0,
      严重程度: { 高: 0, 中: 0, 低: 0, 其他: 0 },
      处置: {},
      已处置: 0,
      作者保留: 0,
      模块: {},
      审核记录哈希: 'x',
      ...body,
    } as Readonly<Record<string, unknown>>,
    MACHINE_SCHEMA_VERSION,
  )
  fs.writeFileSync(path.join(dir, `${String(章).padStart(4, '0')}-${章名}.json`), text, 'utf-8')
}

function writeFinalized(root: string, 卷: number, 章: number, 章名: string): void {
  const dir = path.join(root, LAYOUT.定稿(卷))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${String(章).padStart(4, '0')}-${章名}.md`), '正文\n', 'utf-8')
}

describe('审读汇总：跨章聚合', () => {
  it('两章累加：发现项/严重程度/处置/模块次数都对得上', () => {
    const root = mkBook()
    writeDigest(root, 1, 1, '开篇任务', {
      发现项总数: 5,
      严重程度: { 高: 2, 中: 2, 低: 1, 其他: 0 },
      处置: { 已接受修改: 2, 已解决: 1, 作者保留: 1, 已驳回: 1 },
      已处置: 5,
      作者保留: 1,
      模块: {
        人物: { 完成: true, 失败: false, 跳过: false, 发现项: 2, 高: 1 },
        伏笔: { 完成: true, 失败: false, 跳过: false, 发现项: 1, 高: 0 },
        时间线: { 完成: true, 失败: false, 跳过: false, 发现项: 2, 高: 1 },
      },
    })
    writeDigest(root, 1, 2, '追查', {
      发现项总数: 3,
      严重程度: { 高: 1, 中: 2, 低: 0, 其他: 0 },
      处置: { 已解决: 2, 待处理: 1 },
      已处置: 2,
      作者保留: 0,
      模块: {
        人物: { 完成: true, 失败: false, 跳过: false, 发现项: 3, 高: 1 },
        伏笔: { 完成: false, 失败: false, 跳过: false, 发现项: 0, 高: 0 },
      },
    })

    const s = summarizeReviewDigests(root, {})
    expect(s.已统计章数).toBe(2)
    expect(s.发现项合计).toBe(8)
    expect(s.严重程度).toEqual({ 高: 3, 中: 4, 低: 1, 其他: 0 })
    expect(s.已处置合计).toBe(7)
    expect(s.待处置合计).toBe(1)
    expect(s.作者保留合计).toBe(1)
    // 模块按发现项降序：人物 5 条 > 时间线 2 条 = 伏笔 1 条
    expect(s.模块.map((m) => m.模块名)).toEqual(['人物', '时间线', '伏笔'])
    expect(s.模块[0]).toMatchObject({ 模块名: '人物', 发现项: 5, 高: 2, 出现章数: 2 })
    // 伏笔两章都出现过（第二章发现项 0 不计出现章数），只在第一章出过 1 条
    expect(s.模块[2]).toMatchObject({ 模块名: '伏笔', 发现项: 1, 出现章数: 1, 完成章数: 1 })
    // 逐章行按章号升序
    expect(s.章.map((c) => c.章)).toEqual([1, 2])
    expect(s.章[0]).toMatchObject({ 章名: '开篇任务', 发现项总数: 5, 高: 2, 作者保留: 1 })
  })

  it('卷范围过滤：只统计指定卷', () => {
    const root = mkBook()
    writeDigest(root, 1, 1, 'A', { 发现项总数: 2 })
    writeDigest(root, 2, 3, 'B', { 发现项总数: 5 })
    const s1 = summarizeReviewDigests(root, { 卷: 1 })
    expect(s1.已统计章数).toBe(1)
    expect(s1.发现项合计).toBe(2)
    expect(s1.范围.卷).toBe(1)
    const all = summarizeReviewDigests(root, {})
    expect(all.已统计章数).toBe(2)
    expect(all.发现项合计).toBe(7)
    expect(all.范围.卷).toBeNull()
  })

  it('有定稿章但没摘要：如实单列，不当作零发现项', () => {
    const root = mkBook()
    writeDigest(root, 1, 1, '开篇任务', { 发现项总数: 4 })
    writeFinalized(root, 1, 2, '追查') // 有定稿、无摘要（本版之前入档的老章）

    const s = summarizeReviewDigests(root, {})
    expect(s.已统计章数).toBe(1)
    expect(s.缺摘要章数).toBe(1)
    expect(s.缺摘要章).toEqual([{ 卷: 1, 章: 2, 章名: '追查' }])
    // 关键：缺摘要的章不进分母，也不被算成「零发现项」
    expect(s.发现项合计).toBe(4)
  })

  it('审核未完成的章单列，不混进「审得干净」', () => {
    const root = mkBook()
    writeDigest(root, 1, 1, '干净', { 发现项总数: 0 })
    writeDigest(root, 1, 2, '半途', { 审核完成: false, 发现项总数: 1 })
    const s = summarizeReviewDigests(root, {})
    expect(s.已统计章数).toBe(2)
    expect(s.未完成审核章数).toBe(1)
    expect(s.章.find((c) => c.章名 === '半途')?.审核完成).toBe(false)
  })

  it('空书/无摘要：全零但不报错', () => {
    const root = mkBook()
    const s = summarizeReviewDigests(root, {})
    expect(s.已统计章数).toBe(0)
    expect(s.发现项合计).toBe(0)
    expect(s.模块).toEqual([])
    expect(s.章).toEqual([])
    expect(s.缺摘要章数).toBe(0)
  })

  it('模块行不给出无法如实统计的中/低（只给发现项与高）', () => {
    const root = mkBook()
    writeDigest(root, 1, 1, 'A', {
      发现项总数: 3,
      模块: { 人物: { 完成: true, 失败: false, 跳过: false, 发现项: 3, 高: 1 } },
    })
    const s = summarizeReviewDigests(root, {})
    const m = s.模块[0]!
    // 摘要的模块行只有 发现项/高；若报表给出 中/低 就是编造
    expect(Object.keys(m).sort()).toEqual(['出现章数', '发现项', '完成章数', '模块名', '高'].sort())
  })
})
