import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  applyRevisionBatch,
  confirmOutline,
  listChapterDrafts,
  loadReviewRecord,
  parseDocument,
  seedMinDesign,
  writeCandidate,
} from '@abzu/core'
import { ingestFindings, registerDefaultChecks, resetChecks, runReview } from '@abzu/review'
import { createNovelTools } from '../src/novel-tools'
import { nativeWriteStub } from './fixtures/native-write-stub'

const roots: string[] = []
function mkDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  roots.push(dir)
  return dir
}
afterAll(() => { for (const root of roots) { try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const HARD = '开场必须点名主角现身'
const FACTS = ['事实：主角捡到半枚铜符', '时间线：盘问结束｜第三日清晨']

function confirmWithHard(root: string): void {
  seedMinDesign(root)
  for (const name of ['故事线', '人物弧线', '承诺', '线索', '时间线'] as const) {
    fs.mkdirSync(path.join(root, '账本'), { recursive: true })
    fs.writeFileSync(path.join(root, '账本', `${name}.md`), `# ${name}\n`, 'utf-8')
  }
  const body = [
    '# 章细纲', '', '## 定位段', '', '### 来源窗口项及拆并关系', '开篇任务，单章承接', '',
    '### 章节功能', '', `- 〔硬〕${HARD}`, '',
    '### 视角与焦点', '主角视角', '', '### 时空锚定', '城门口，清晨', '',
    '### 起止边界', '从抵达城门到发现异状', '', '### 故事线与承诺分配', '推进主线承诺', '',
    '### 信息边界', '只披露主角所见', '', '### 情绪与节奏目标', '紧张后留钩子', '',
    '### 前置条件核对结果', '已核对来源与窗口，前置设定均非留白', '',
    '## 细纲段', '', '### 单元 1', '',
    '- 目标: 开场', '- 人物: 主角', '- 时空: 城门口', '- 行动/冲突: 盘问与发现', '- 信息披露: 异常线索', '- 状态变化: 从平静到警觉', '',
  ].join('\n')
  writeCandidate(root, { 卷: 1, 章: 1, 章名: key.章名, 来源引用: ['作品契约/契约.md@1'], body })
  const r = confirmOutline(root, key)
  if (!r.ok) throw new Error(`confirm failed:${r.gaps.join(';')}`)
}

function putPending(root: string, body: string): void {
  const rel = `草稿区/草稿/卷01-${key.章名}/稿1.md`
  fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true })
  fs.writeFileSync(
    path.join(root, rel),
    `---\n角色: 待审稿\n选定: true\n版本: 1\n父版本: null\n生成模块: 写稿\n---\n${body}`,
    'utf-8',
  )
}

/** 经「作者意见」通道回写三条处置目标(发现项编号 P1/P2/P3)。 */
function seedFindings(root: string): void {
  resetChecks()
  registerDefaultChecks()
  runReview(root, key)
  const r = ingestFindings(root, key, '作者意见', [
    { 审核编号: 'R-作者意见-1', 模块名: '作者意见', 发现项编号: '审-01-0001-作者意见-1', 严重程度: '中', 是否建议阻断: false, 证据位置: '第一段', 所依据材料及版本: '稿1@1', 问题说明: '开头节奏拖沓', 影响范围: '正文', 不确定性说明: '', 修改建议: '合并前两句', 建议返回节点: '改稿', 建议复审模块: '作者意见', 材料完整性: '完整', 处置状态: '待处理', 处置: '待处理' },
    { 审核编号: 'R-作者意见-2', 模块名: '作者意见', 发现项编号: '审-01-0001-作者意见-2', 严重程度: '低', 是否建议阻断: false, 证据位置: '第二段', 所依据材料及版本: '稿1@1', 问题说明: '口头语重复', 影响范围: '正文', 不确定性说明: '', 修改建议: '删除一处', 建议返回节点: '改稿', 建议复审模块: '作者意见', 材料完整性: '完整', 处置状态: '待处理', 处置: '待处理' },
    { 审核编号: 'R-作者意见-3', 模块名: '作者意见', 发现项编号: '审-01-0001-作者意见-3', 严重程度: '低', 是否建议阻断: false, 证据位置: '结尾', 所依据材料及版本: '稿1@1', 问题说明: '钩子偏弱', 影响范围: '正文', 不确定性说明: '', 修改建议: '保留现状也可', 建议返回节点: '改稿', 建议复审模块: '作者意见', 材料完整性: '完整', 处置状态: '待处理', 处置: '待处理' },
  ])
  expect(r.ok).toBe(true)
}

describe('改稿批(A8)', () => {
  it('一次写新稿并回写 3 条处置:旧稿降级、版本+1、处置说明回填、候选事实保留', () => {
    const root = mkDir('abzu-batch-')
    confirmWithHard(root)
    putPending(root, `综上所述，${HARD}。\n\n## 草稿候选事实\n\n${FACTS.map((f) => `- ${f}`).join('\n')}\n`)
    seedFindings(root)

    const res = applyRevisionBatch(root, {
      卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `改后正文。${HARD}。`,
      生成模块: '作者手改',
      处置: [
        { 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决', 改动说明: '合并了前两句' },
        { 发现项编号: '审-01-0001-作者意见-2', 处置: '作者保留' },
        { 发现项编号: '审-01-0001-作者意见-3', 处置: '已驳回', 改动说明: '作者裁决：保留原钩子' },
      ],
    })
    expect(res.ok).toBe(true)
    expect(res.relPath).toBe(`草稿区/草稿/卷01-${key.章名}/稿2.md`)

    const drafts = listChapterDrafts(root, key)
    expect(drafts.filter((d) => d.角色 === '待审稿').map((d) => d.file)).toEqual(['稿2.md'])
    const 新稿 = drafts.find((d) => d.file === '稿2.md')!
    expect(新稿.版本).toBe(2)
    const doc = parseDocument(新稿.text)
    expect(doc.ok).toBe(true)
    if (doc.ok) {
      expect(doc.data.fields['父版本']).toBe(1)
      expect(doc.data.fields['生成模块']).toBe('作者手改')
      expect(doc.data.fields['来源快照']).toMatchObject({ 处置编号: ['审-01-0001-作者意见-1', '审-01-0001-作者意见-2', '审-01-0001-作者意见-3'] })
      const body = doc.data.body
      expect(body).toContain('改后正文')
      expect(body).toContain('事实：主角捡到半枚铜符')
      expect(body).toContain('时间线：盘问结束｜第三日清晨')
    }
    // 旧稿原样留档且已降级
    const 旧稿 = drafts.find((d) => d.file === '稿1.md')!
    expect(旧稿.角色).toBe('草稿')
    expect(旧稿.选定).toBe(false)
  })

  it('审核记录 3 条处置状态与处置说明均已更新', () => {
    const root = mkDir('abzu-batch-record-')
    confirmWithHard(root)
    putPending(root, `综上所述，${HARD}。`)
    seedFindings(root)
    const res = applyRevisionBatch(root, {
      卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `改后正文。${HARD}。`,
      处置: [
        { 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决', 改动说明: '合并了前两句' },
        { 发现项编号: '审-01-0001-作者意见-2', 处置: '作者保留' },
        { 发现项编号: '审-01-0001-作者意见-3', 处置: '已驳回', 改动说明: '作者裁决：保留原钩子' },
      ],
    })
    expect(res.ok).toBe(true)
    const record = loadReviewRecord(root, key)
    expect(record).toBeTruthy()
    const byId = new Map(record!.问题.map((p) => [p.发现项编号, p]))
    expect(byId.get('审-01-0001-作者意见-1')?.处置状态).toBe('已解决')
    expect(byId.get('审-01-0001-作者意见-1')?.处置说明).toBe('合并了前两句')
    expect(byId.get('审-01-0001-作者意见-2')?.处置状态).toBe('作者保留')
    expect(byId.get('审-01-0001-作者意见-3')?.处置状态).toBe('已驳回')
    expect(byId.get('审-01-0001-作者意见-3')?.处置说明).toBe('作者裁决：保留原钩子')
  })

  it('不带新稿正文时只回写处置,不产生新文件', () => {
    const root = mkDir('abzu-batch-nodraft-')
    confirmWithHard(root)
    putPending(root, `综上所述，${HARD}。`)
    seedFindings(root)
    const res = applyRevisionBatch(root, {
      卷: 1, 章: 1, 章名: key.章名,
      处置: [
        { 发现项编号: '审-01-0001-作者意见-1', 处置: '作者保留' },
        { 发现项编号: '审-01-0001-作者意见-2', 处置: '已驳回', 改动说明: '误报' },
        { 发现项编号: '审-01-0001-作者意见-3', 处置: '待处理' },
      ],
    })
    expect(res.ok).toBe(true)
    expect(res.relPath).toBeUndefined()
    expect(listChapterDrafts(root, key).map((d) => d.file)).toEqual(['稿1.md'])
  })

  it('含不存在的发现项编号 → 整批不写', () => {
    const root = mkDir('abzu-batch-miss-')
    confirmWithHard(root)
    putPending(root, `综上所述，${HARD}。`)
    seedFindings(root)
    const res = applyRevisionBatch(root, {
      卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `改后正文。${HARD}。`,
      处置: [
        { 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决' },
        { 发现项编号: '不存在', 处置: '已解决' },
      ],
    })
    expect(res).toMatchObject({ ok: false, reason: expect.stringContaining('发现项不存在') })
    expect(listChapterDrafts(root, key).map((d) => d.file)).toEqual(['稿1.md'])
    const record = loadReviewRecord(root, key)!
    expect(record.问题.find((p) => p.发现项编号 === '审-01-0001-作者意见-1')?.处置状态).toBe('待处理')
  })

  it('触及真源的发现项整批拒绝', () => {
    const root = mkDir('abzu-batch-true-')
    confirmWithHard(root)
    putPending(root, `${HARD}。`)
    resetChecks()
    registerDefaultChecks()
    runReview(root, key)
    const r = ingestFindings(root, key, '作者意见', [
      { 审核编号: 'R-作者意见-1', 模块名: '作者意见', 发现项编号: '审-01-0001-作者意见-1', 严重程度: '高', 是否建议阻断: false, 证据位置: 'x', 所依据材料及版本: '稿1@1', 问题说明: '与设定冲突', 影响范围: '世界书/人物档案/主角.md', 不确定性说明: '', 修改建议: '呈报上游', 建议返回节点: '改稿', 建议复审模块: '作者意见', 材料完整性: '完整', 处置状态: '待处理', 处置: '待处理' },
    ])
    expect(r.ok).toBe(true)
    const res = applyRevisionBatch(root, {
      卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `${HARD}。`,
      处置: [{ 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决' }],
    })
    expect(res).toMatchObject({ ok: false, reason: expect.stringContaining('须呈报上游') })
  })
})

describe('改稿批工具面：followup 与「发现项→改动」映射', () => {
  function makeTools(root: string) {
    const tools = createNovelTools({
      nativeWrite: nativeWriteStub,
      workspaceRoot: () => root,
      bookRootOfBookId: () => root,
      testTools: true,
    })
    const call = async (name: string, args: Record<string, unknown>) =>
      await tools.find((t) => t.name === name)!.execute(args, { agent: { id: 'a', session: { append: () => {} } } } as never) as Record<string, unknown> & { ok: boolean }
    return { call }
  }

  const bookId = '改稿批书'

  function ready(root: string): void {
    confirmWithHard(root)
    putPending(root, `综上所述，${HARD}。`)
    seedFindings(root)
  }

  it('不传改动映射时旧行为不变：工具照常落实，记录里没有 改动映射', async () => {
    const root = mkDir('abzu-tool-map-absent-')
    ready(root)
    const { call } = makeTools(root)
    const res = await call('novel_apply_revision_batch', {
      bookId, 卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `改后正文。${HARD}。`,
      处置: [{ 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决', 改动说明: '合并了前两句' }],
    }) as { ok: boolean; relPath?: string; 更新条数?: number; followup?: { 硬约束回查失败: string[] } }
    expect(res.ok, JSON.stringify(res)).toBe(true)
    expect(res.relPath).toBe(`草稿区/草稿/卷01-${key.章名}/稿2.md`)
    expect(res.更新条数).toBe(1)
    const record = loadReviewRecord(root, key)!
    expect(record.问题.find((p) => p.发现项编号 === '审-01-0001-作者意见-1')).not.toHaveProperty('改动映射')
  })

  it('batch 返回值带 followup（与 novel_import_draft 同形状，硬约束回查口径一致）', async () => {
    const root = mkDir('abzu-tool-followup-')
    ready(root)
    // 确认细纲再加一条确定性「出现」类硬约束：新稿不写该词 → 回查失败非空
    const 细纲相对 = `故事剧情/卷规划/卷01/章细纲/0001-${key.章名}.md`
    const 原文 = fs.readFileSync(path.join(root, 细纲相对), 'utf-8')
    fs.writeFileSync(path.join(root, 细纲相对), 原文.replace(`- 〔硬〕${HARD}`, `- 〔硬〕${HARD}\n- 〔硬〕本章必须出现「郑姓旗官」`), 'utf-8')
    const { call } = makeTools(root)
    // 新稿既不写 HARD（语义类）也不写「郑姓旗官」（确定性出现类）
    const res = await call('novel_apply_revision_batch', {
      bookId, 卷: 1, 章: 1, 章名: key.章名,
      新稿正文: '改后正文，没提那句硬约束。',
      处置: [
        { 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决' },
        { 发现项编号: '审-01-0001-作者意见-2', 处置: '作者保留' },
      ],
    }) as { ok: boolean; followup?: { 硬约束回查失败: string[]; 需语义审读: string[]; 仍待处置: { 发现项编号: string }[]; 建议重跑: string[] } }
    expect(res.ok, JSON.stringify(res)).toBe(true)
    expect(res.followup).toBeDefined()
    // 形状与 novel_import_draft 的 followup 一致（四键同集）
    expect(Object.keys(res.followup!).sort()).toEqual(['仍待处置', '建议重跑', '硬约束回查失败', '需语义审读'])
    // 确定性出现类：正文缺「郑姓旗官」→ 回查失败
    expect(res.followup!.硬约束回查失败.some((l) => l.includes('郑姓旗官'))).toBe(true)
    // 语义类：HARD 不伪装成通过或失败，落需语义审读
    expect(res.followup!.需语义审读.length).toBeGreaterThan(0)
    // 第 3 条仍留待处理 → 仍待处置能点出来
    expect(res.followup!.仍待处置.map((p) => p.发现项编号)).toContain('审-01-0001-作者意见-3')
  })

  it('传入的改动映射被保存并可回读', async () => {
    const root = mkDir('abzu-tool-map-present-')
    ready(root)
    const { call } = makeTools(root)
    const res = await call('novel_apply_revision_batch', {
      bookId, 卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `改后正文。${HARD}。`,
      处置: [
        { 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决', 改动映射: { 改动位置: '第1段', 改动说明: '把两句并成一句' } },
        { 发现项编号: '审-01-0001-作者意见-2', 处置: '作者保留', 改动映射: { 改动位置: '无改动', 改动说明: '作者确认保留' } },
      ],
    }) as { ok: boolean }
    expect(res.ok, JSON.stringify(res)).toBe(true)
    const record = loadReviewRecord(root, key)!
    expect(record.问题.find((p) => p.发现项编号 === '审-01-0001-作者意见-1')?.改动映射).toEqual({ 改动位置: '第1段', 改动说明: '把两句并成一句' })
    expect(record.问题.find((p) => p.发现项编号 === '审-01-0001-作者意见-2')?.改动映射).toEqual({ 改动位置: '无改动', 改动说明: '作者确认保留' })
  })

  it.each([
    ['缺改动位置', { 改动说明: '只写说明' }, '缺「改动位置」'],
    ['缺改动说明', { 改动位置: '第1段' }, '缺「改动说明」'],
    ['改动说明为空白', { 改动位置: '第1段', 改动说明: '   ' }, '「改动说明」为空'],
    ['不是对象', '第1段', '形状非法'],
  ])('非法改动映射被工具拒绝且理由可读：%s', async (_label, map, expected) => {
    const root = mkDir('abzu-tool-map-bad-')
    ready(root)
    const { call } = makeTools(root)
    const res = await call('novel_apply_revision_batch', {
      bookId, 卷: 1, 章: 1, 章名: key.章名,
      新稿正文: `改后正文。${HARD}。`,
      处置: [{ 发现项编号: '审-01-0001-作者意见-1', 处置: '已解决', 改动映射: map }],
    }) as { ok: boolean; reason?: string; code?: string }
    expect(res.ok).toBe(false)
    // schema 层或 core 层拒绝均可，但必须点名这条发现项并可读
    if (res.code === 'invalid-args') {
      expect(res.reason).toContain('改动映射')
    } else {
      expect(res.reason).toContain('审-01-0001-作者意见-1')
      expect(res.reason).toContain(expected)
      expect(res.reason).toContain('修正方法：')
    }
    // 整批不写
    expect(listChapterDrafts(root, key).map((d) => d.file)).toEqual(['稿1.md'])
    expect(loadReviewRecord(root, key)!.问题.find((p) => p.发现项编号 === '审-01-0001-作者意见-1')?.处置状态).toBe('待处理')
  })
})
