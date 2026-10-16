import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { confirmOutline, seedMinDesign, serializeDocument, writeCandidate } from '@abzu/core'
import { packCli } from '../src/scripts/pack-cli'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach((root) => { try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } }) })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const refs = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const
const HARD = '开场必须点名主角现身'
const 七件 = ['正文.md', '事实变更.md', '时间线变更.md', '账本变更.md', '章摘要.md', '卷对账.md', '本书层记忆候选.md'] as const

/** 最小可备包书仓：已确认细纲＋一份选定待审稿（沿 prepare.spec 同形夹具；写入器不碰 git）。 */
function packableBook(): string {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-pack-cli-'))
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
  const rel = '草稿区/草稿/卷01-0001-开篇任务/稿1.md'
  fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true })
  fs.writeFileSync(path.join(root, rel), serializeDocument({ 角色: '待审稿', 选定: true, 版本: 1, 父版本: null, 生成模块: '写稿' }, `巷口风大。${HARD}。`), 'utf-8')
  return root
}

interface Run { code: number; data?: Record<string, unknown>; err: string }

function invoke(argv: string[]): Run {
  const out: string[] = []
  const errors: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => { out.push(String(msg)) })
  const errSpy = vi.spyOn(console, 'error').mockImplementation((msg?: unknown) => { errors.push(String(msg)) })
  try {
    const code = packCli(argv)
    const text = out.join('\n')
    return { code, data: text === '' ? undefined : JSON.parse(text) as Record<string, unknown>, err: errors.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

describe('定稿备包薄入口 CLI(R21 纯算切割)', () => {
  it('参数纪律:缺 --book/--卷/--章/--章名 或卷章非正整数拒绝(退出码 1,stderr 指名)', () => {
    const missingBook = invoke(['--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(missingBook.code).toBe(1)
    expect(missingBook.err).toContain('必须传 --book')
    const missing卷 = invoke(['--book', 'x', '--章', '1', '--章名', '开篇任务'])
    expect(missing卷.code).toBe(1)
    expect(missing卷.err).toContain('--卷 必须是正整数')
    const missing章 = invoke(['--book', 'x', '--卷', '1', '--章名', '开篇任务'])
    expect(missing章.code).toBe(1)
    expect(missing章.err).toContain('--章 必须是正整数')
    const missing章名 = invoke(['--book', 'x', '--卷', '1', '--章', '1'])
    expect(missing章名.code).toBe(1)
    expect(missing章名.err).toContain('必须传 --章名')
    for (const bad of ['0', '-2', 'abc']) {
      expect(invoke(['--book', 'x', '--卷', bad, '--章', '1', '--章名', '开篇任务']).code, `--卷 ${bad} 应拒绝`).toBe(1)
    }
    expect(invoke(['--book', 'x', '--卷', '1', '--章', '1.5', '--章名', '开篇任务']).err).toContain('--章 必须是正整数')
  })

  it('正常路径:七件＋清单.json 载荷齐,清单校验通过,且零写盘', () => {
    const root = packableBook()
    const { code, data, err } = invoke(['--book', root, '--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(code, err).toBe(0)
    expect(data!.ok).toBe(true)
    expect(data!.dir).toBe('草稿区/定稿准备/卷01-0001-开篇任务')
    const files = data!.files as string[]
    expect(files).toHaveLength(8)
    for (const 名 of [...七件, '清单.json']) {
      expect(files, `载荷应含 ${名}`).toContain(`草稿区/定稿准备/卷01-0001-开篇任务/${名}`)
    }
    const 文件 = data!.文件 as { relPath: string; content: string }[]
    expect(文件).toHaveLength(8)
    const 正文 = 文件.find((f) => f.relPath.endsWith('正文.md'))!
    expect(正文.content).toContain('状态: 已定稿')
    expect(正文.content).toContain(`巷口风大。${HARD}。`)
    const 清单 = JSON.parse(文件.find((f) => f.relPath.endsWith('清单.json'))!.content) as { 校验: string; 工件: unknown[]; 文件: { 目标: string }[] }
    expect(清单.校验).toBe('通过')
    expect(清单.工件).toHaveLength(7)
    expect(清单.文件.map((f) => f.目标)).toEqual(['定稿/卷01/0001-开篇任务.md', '大纲/卷规划/卷01/章摘要/0001-开篇任务.md'])
    // 纯算零写盘(R21):落盘经常驻工具 novel_prepare_pack
    expect(fs.existsSync(path.join(root, '草稿区', '定稿准备')), 'CLI 不得写盘').toBe(false)
  })

  it('幂等:同一书仓两次计算输出逐字节一致(computePack 决定论,重跑不产新载荷)', () => {
    const root = packableBook()
    const first = invoke(['--book', root, '--卷', '1', '--章', '1', '--章名', '开篇任务'])
    const second = invoke(['--book', root, '--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(first.code).toBe(0)
    expect(second.code).toBe(0)
    expect(JSON.stringify(second.data)).toBe(JSON.stringify(first.data))
  })

  it('前置未就绪:无待审稿时 ok:false 照常出 stdout 报告,stderr 指名,退出码 1', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-pack-empty-'))
    roots.push(ws)
    const run = invoke(['--book', path.join(ws, '孤本'), '--卷', '1', '--章', '1', '--章名', '开篇任务'])
    expect(run.code).toBe(1)
    expect(run.err).toContain('定稿备包未完成')
    expect(run.err).toContain('无待审稿')
    expect(run.data!.ok).toBe(false)
    expect(run.data!.reason).toBe('无待审稿')
    expect(run.data!.files).toEqual([])
  })

  it('章名未过路径白名单:computePack 抛错收进退出码 2(B2 嵌套目录防线)', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-pack-badname-'))
    roots.push(ws)
    const run = invoke(['--book', path.join(ws, '孤本'), '--卷', '1', '--章', '1', '--章名', 'a/b'])
    expect(run.code).toBe(2)
    expect(run.err).toContain('定稿备包异常')
    expect(run.err).toContain('章名')
  })
})

/**
 * 覆盖边界：备包落盘与沉淀候选预校验由 core 侧 prepare spec 守；卷对账内容形态由
 * prepare.spec「presents actual ledger reconciliation」守——本件只守薄入口的
 * argv→stdout/退出码契约（参数面、正常载荷、幂等、未就绪出口、白名单异常出口）。
 */
