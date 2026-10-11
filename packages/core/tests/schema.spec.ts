import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  MACHINE_SCHEMA_VERSION,
  parseMachineJson,
  readMachineText,
  serializeMachineJson,
} from '../src/repo/schema'
import { loadReviewRecord, readReviewRecordForUpdate, serializeReviewRecord } from '../src/evidence/record'
import { writeSettlementDecision } from '../src/settlement/decision'
import { readManifest } from '../src/assembly/assemble'
import { paths } from '../src/repo/paths'

describe('机器态 JSON(B8 schemaVersion)', () => {
  it('接受已知版本', () => {
    const r = parseMachineJson(JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }), MACHINE_SCHEMA_VERSION)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.schemaVersion).toBe(1)
      expect(r.data['状态']).toBe('段齐备')
    }
  })

  it('拒绝缺 schemaVersion', () => {
    const r = parseMachineJson(JSON.stringify({ 状态: '段齐备' }), MACHINE_SCHEMA_VERSION)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('parse-error')
      expect(r.detail).toContain('schemaVersion')
    }
  })

  it('拒绝未知版本', () => {
    const r = parseMachineJson(JSON.stringify({ schemaVersion: 99 }), MACHINE_SCHEMA_VERSION)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('parse-error')
      expect(r.detail).toMatch(/未知|不匹配/)
    }
  })

  it('拒绝非法 JSON', () => {
    const r = parseMachineJson('{坏的 json', MACHINE_SCHEMA_VERSION)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('parse-error')
  })

  it('往返:serialize 必写 schemaVersion,parse 还原字段', () => {
    const text = serializeMachineJson({ 完成: true, 问题: [] }, MACHINE_SCHEMA_VERSION)
    expect(JSON.parse(text).schemaVersion).toBe(1)
    const r = parseMachineJson(text, MACHINE_SCHEMA_VERSION)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data['完成']).toBe(true)
      expect(r.data.schemaVersion).toBe(1)
    }
  })
})

describe('机器态文本统一读取(0.0.20 批 bug7:带 BOM 的机器态文件四读点行为一致)', () => {
  const roots: string[] = []
  function mkBook(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-bom-'))
    roots.push(dir)
    return dir
  }
  afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

  /** 模拟外部编辑器给机器态文件存 BOM:内容前置 U+FEFF 写盘。 */
  function putBom(root: string, rel: string, content: string): void {
    const abs = path.join(root, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, `\uFEFF${content}`, 'utf-8')
  }

  it('readMachineText 剥首部 BOM 且保留正文', () => {
    const root = mkBook()
    const rel = '草稿区/bom-probe.json'
    putBom(root, rel, '{"schemaVersion":1}')
    const text = readMachineText(path.join(root, rel))
    expect(text.charCodeAt(0)).not.toBe(0xFEFF)
    expect(parseMachineJson(text, MACHINE_SCHEMA_VERSION).ok).toBe(true)
  })

  it('带 BOM 的审核记录:loadReviewRecord 与 readReviewRecordForUpdate 同口径可读', () => {
    const root = mkBook()
    const key = { 卷: 1, 章名: '初见' }
    const record = serializeReviewRecord({ schemaVersion: MACHINE_SCHEMA_VERSION, 完成: true, 问题: [], 模块: { '章节结构审读': { 完成: true, 失败: false } } })
    putBom(root, paths.审核记录(key.卷, key.章名), record)
    const loaded = loadReviewRecord(root, key)
    expect(loaded?.完成).toBe(true)
    expect(loaded?.模块['章节结构审读']?.完成).toBe(true)
    const forUpdate = readReviewRecordForUpdate(root, key)
    expect(forUpdate.ok).toBe(true)
  })

  it('带 BOM 的待定稿包清单:writeSettlementDecision 可读可回写', () => {
    const root = mkBook()
    const key = { 卷: 1, 章名: '初见' }
    putBom(root, path.posix.join(paths.待定稿包目录(key.卷, key.章名), '清单.json'), serializeMachineJson({ 正文: 'x' }, MACHINE_SCHEMA_VERSION))
    const result = writeSettlementDecision(root, key, '已批准')
    expect(result.ok).toBe(true)
    const rewritten = fs.readFileSync(path.join(root, paths.待定稿包目录(key.卷, key.章名), '清单.json'), 'utf-8')
    expect(JSON.parse(rewritten)['裁决']).toBe('已批准')
  })

  it('带 BOM 的材料清单:readManifest 可读且与无 BOM 行为一致', () => {
    const root = mkBook()
    const key = { 卷: 1, 章名: '初见' }
    const manifest = serializeMachineJson({ 状态: '段齐备', 合计字数: 0, 段: [] }, MACHINE_SCHEMA_VERSION)
    putBom(root, path.posix.join(paths.材料包目录(key.卷, key.章名), '材料清单.json'), manifest)
    const m = readManifest(root, key)
    expect(m?.状态).toBe('段齐备')
    expect(m?.合计字数).toBe(0)
  })
})
