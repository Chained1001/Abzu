import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { confirmOutline, seedMinDesign, writeCandidate } from '@abzu/core'
import { materialsCli } from '../src/scripts/materials-cli'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach((root) => { try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } }) })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const refs = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const
const HARD = '开场必须点名主角现身'

/** 最小可备料书仓：空壳设计＋已确认细纲（沿 prepare.spec 同形夹具；写入器不碰 git）。 */
function confirmedBook(): string {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-materials-cli-'))
  roots.push(ws)
  const root = path.join(ws, '夜航船')
  seedMinDesign(root)
  const body = [
    '# 章细纲',
    '',
    '## 定位段',
    '',
    '### 来源窗口项及拆并关系',
    '开篇任务，单章承接',
    '',
    '### 章节功能',
    '',
    `- 〔硬〕${HARD}`,
    '',
    '### 视角与焦点',
    '主角视角',
    '',
    '### 时空锚定',
    '城门口，清晨',
    '',
    '### 起止边界',
    '从抵达城门到发现异状',
    '',
    '### 故事线与承诺分配',
    '推进主线承诺',
    '',
    '### 信息边界',
    '只披露主角所见',
    '',
    '### 情绪与节奏目标',
    '紧张后留钩子',
    '',
    '### 前置条件核对结果',
    '已核对来源与窗口，前置设定均非留白',
    '',
    '## 细纲段',
    '',
    '### 单元 1',
    '',
    '- 目标: 开场',
    '- 人物: 主角',
    '- 时空: 城门口',
    '- 行动/冲突: 盘问与发现',
    '- 信息披露: 异常线索',
    '- 状态变化: 从平静到警觉',
    '',
  ].join('\n')
  writeCandidate(root, { ...key, 来源引用: refs, body })
  const r = confirmOutline(root, key)
  if (!r.ok) throw new Error(`夹具细纲确认失败:${r.gaps.join(';')}`)
  return root
}

interface Run { code: number; data?: Record<string, unknown>; err: string }

function invoke(argv: string[]): Run {
  const out: string[] = []
  const errors: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => { out.push(String(msg)) })
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg?: unknown) => { errors.push(String(msg)) })
  try {
    const code = materialsCli(argv)
    const text = out.join('\n')
    return { code, data: text === '' ? undefined : JSON.parse(text) as Record<string, unknown>, err: errors.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

describe('材料备料薄入口 CLI(R21 纯算切割)', () => {
  it('参数纪律:缺 --book/--卷/--章/--章名 或卷章非正整数拒绝(退出码 1,stderr 指名)', () => {
    const missingBook = invoke(['--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(missingBook.code).toBe(1)
    expect(missingBook.err).toContain('必须传 --book')
    expect(invoke(['--book']).code, '--book 缺值后 --卷 也取不到').toBe(1)
    const missing卷 = invoke(['--book', 'x', '--章', '1', '--章名', '开篇任务'])
    expect(missing卷.code).toBe(1)
    expect(missing卷.err).toContain('--卷 必须是正整数')
    const missing章 = invoke(['--book', 'x', '--卷', '1', '--章名', '开篇任务'])
    expect(missing章.code).toBe(1)
    expect(missing章.err).toContain('--章 必须是正整数')
    const missing章名 = invoke(['--book', 'x', '--卷', '1', '--章', '1'])
    expect(missing章名.code).toBe(1)
    expect(missing章名.err).toContain('必须传 --章名')
    for (const bad of ['0', '-1', 'abc', '1.5']) {
      const run = invoke(['--book', 'x', '--卷', bad, '--章', '1', '--章名', '开篇任务'])
      expect(run.code, `--卷 ${bad} 应拒绝`).toBe(1)
      expect(run.err).toContain('--卷 必须是正整数')
    }
    const bad章 = invoke(['--book', 'x', '--卷', '1', '--章', 'abc', '--章名', '开篇任务'])
    expect(bad章.code).toBe(1)
    expect(bad章.err).toContain('--章 必须是正整数')
  })

  it('正常路径:段齐备输出十段＋材料清单.json 载荷,清单口径与顶层一致,且零写盘', () => {
    const root = confirmedBook()
    const { code, data, err } = invoke(['--book', root, '--卷', '1', '--章', '1', '--章名', '开篇任务', '--全文', 'true'])
    expect(code, err).toBe(0)
    expect(data!.ok).toBe(true)
    expect(data!.状态).toBe('段齐备')
    expect(data!.dir).toBe('草稿区/材料包/卷01-0001-开篇任务')
    expect(data!.gaps).toEqual([])
    const 段 = data!.段 as { 段: string; 完整性: string }[]
    expect(段).toHaveLength(10)
    expect(data!.合计字数, '十段字数应大于零').toBeGreaterThan(0)
    const 文件 = data!.文件 as { relPath: string; content: string }[]
    expect(文件).toHaveLength(11)
    const manifestFile = 文件.find((f) => f.relPath.endsWith('材料清单.json'))
    expect(manifestFile, '载荷应含 材料清单.json').toBeDefined()
    expect(manifestFile!.relPath).toBe('草稿区/材料包/卷01-0001-开篇任务/材料清单.json')
    const manifest = JSON.parse(manifestFile!.content) as { 状态: string; 合计字数: number; 段: { 段: string; 来源: string[] }[]; schemaVersion: number }
    expect(manifest.状态).toBe('段齐备')
    expect(manifest.合计字数).toBe(data!.合计字数)
    expect(manifest.段).toHaveLength(10)
    expect(manifest.段.map((s) => s.段)).toEqual(段.map((s) => s.段))
    expect(manifest.段[0]!.来源[0]).toBe('故事剧情/卷规划/卷01/章细纲/0001-开篇任务.md')
    // 纯算零写盘(R21):stdout 给主 Agent 读包判断,落盘经常驻工具
    expect(fs.existsSync(path.join(root, '草稿区', '材料包')), 'CLI 不得写盘').toBe(false)
  })

  it('默认摘要：不打印十段全文，只给路径/字数/完整性/缺口', () => {
    const root = confirmedBook()
    const { code, data, err } = invoke(['--book', root, '--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(code, err).toBe(0)
    expect(data!.摘要).toBe(true)
    const 文件 = data!.文件 as { relPath: string; content?: string; 字数?: number }[]
    expect(文件).toHaveLength(11)
    for (const f of 文件) {
      expect(f.content).toBeUndefined()
      expect(typeof f.字数).toBe('number')
    }
  })

  it('前置未就绪:书仓无确认细纲时 ok:false 照常出 stdout 报告,stderr 指名缺口,退出码 1', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-materials-empty-'))
    roots.push(ws)
    const run = invoke(['--book', path.join(ws, '孤本'), '--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(run.code).toBe(1)
    expect(run.err).toContain('材料备料未完成')
    expect(run.err).toContain('确认细纲不存在')
    expect(run.data!.ok).toBe(false)
    expect(run.data!.gaps).toContain('确认细纲不存在')
    expect(run.data!.文件).toEqual([])
  })
})

/**
 * 覆盖边界：退出码 2（computeMaterials 抛异常）不可达——core 读原语把 IO 故障收进
 * 结果对象（A-2），参数面与未就绪出口已全覆盖；十段内容切片本身由 core 侧
 * core-logic/materials 相关 spec 守，本件只守薄入口的 argv→stdout/退出码契约。
 */
