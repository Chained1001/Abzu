import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { execFileSync } from 'node:child_process'
import {
  APPROVE_LABEL,
  applyRevision,
  assembleMaterials,
  confirmOutline,
  deriveChapterFacts,
  loadReviewRecord,
  paths,
  preparePack,
  scanChapter,
  seedMinDesign,
  writeCandidate,
} from '@abzu/core'
import { writeDraft } from '@abzu/drafting'
import { polishDraft } from '@abzu/polish'
import { ingestFindings, recordPolish, registerDefaultChecks, resetChecks, runReview } from '@abzu/review'
import { createNovelTools } from '../src/novel-tools'

const roots: string[] = []
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const refs = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const
const HARD = '开场必须点名主角现身'

function outlineBody(): string {
  return [
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
}

describe('最小链 e2e（0.0.54 新序：起草 → 审读 ⇄ 改稿 → 润色 → 承接 → 组包 → 裁决）', () => {
  it('seedMinDesign → confirm → assemble → writeDraft(待审稿) → review → polish → recordPolish → preparePack → 作者定稿裁决 → novel_settle_chapter(0.0.60 串尾)', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-minchain-'))
    roots.push(root)
    seedMinDesign(root)

    writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 来源引用: refs, body: outlineBody() })
    expect(confirmOutline(root, key)).toEqual({ ok: true })
    expect(assembleMaterials(root, key).ok).toBe(true)
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('写稿')

    // 起草收稿即待审稿 → 直接进审核
    const drafted = writeDraft(root, {
      ...key,
      body: `巷口风大。${HARD}。他没有回头。`,
    })
    expect(drafted.ok).toBe(true)
    expect(scanChapter(root, key).唯一待审稿).toBe(true)
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('审核')

    resetChecks()
    registerDefaultChecks()
    const reviewed = runReview(root, key)
    expect(reviewed.ok).toBe(true)
    // 空审 fail-closed:隔离子 Agent 模块未回写,审核不判完成
    expect(reviewed.record?.完成).toBe(false)
    const pendingModules = Object.entries(reviewed.record?.模块 ?? {}).filter(([, st]) => st.待回写 === true)
    expect(pendingModules.length).toBeGreaterThan(0)
    let ingested = reviewed.record
    for (const [name] of pendingModules) {
      const ing = ingestFindings(root, key, name, [], reviewed.record!.审读指纹)
      expect(ing.ok).toBe(true)
      ingested = ing.record
    }
    expect(ingested?.完成).toBe(true)
    // F1:语义类硬约束产出「需审读」发现项——按真实流程给处置(作者保留)后再推进
    for (const finding of ingested?.问题 ?? []) {
      const d = finding.处置 ?? finding.处置状态 ?? ''
      if (d === '' || d === '待处理') {
        const applied = applyRevision(root, key, { 发现项编号: finding.发现项编号, 处置: '作者保留' })
        expect(applied.ok).toBe(true)
      }
    }
    // 审核通过但未承接润色 → 停在润色位
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('润色')

    // 润色：被审稿之上产终稿（同一正文，规则润色不删硬约束）
    const polished = polishDraft(root, key)
    expect(polished.ok).toBe(true)
    expect(polished.角色).toBe('待审稿')
    // 登记润色承接：保真通过、确定性复核无新增高级发现 → 承接成功
    const carried = recordPolish(root, { ...key, 稿件: polished.relPath, 审核记录哈希: scanChapter(root, key).审核记录哈希 })
    expect(carried.ok).toBe(true)
    expect(loadReviewRecord(root, key)?.润色?.状态).toBe('已润色')
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('定稿准备与沉淀')

    expect(preparePack(root, key).ok).toBe(true)
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('作者定稿裁决')

    // 0.0.60 串尾:工具层 novel_settle_chapter(mock askFn 批准)——入档＋草稿区五处清理,链路真正闭环到「完成」
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf-8', windowsHide: true })
    git('init', '--quiet')
    git('config', 'user.name', 'Min Chain')
    git('config', 'user.email', 'min-chain@example.invalid')
    git('config', 'commit.gpgsign', 'false')
    git('config', 'core.autocrlf', 'false')
    const tools = createNovelTools({
      workspaceRoot: () => path.dirname(root),
      bookRootOfBookId: () => root,
      askFn: async () => ({ answers: [{ id: '定稿入档', selected: [APPROVE_LABEL] }] }),
    })
    const settle = tools.find((t) => t.name === 'novel_settle_chapter')!
    expect(settle).toBeDefined()
    const settled = await settle.execute(
      { bookId: 'min-chain', ...key, summary: '第一章 开篇任务' },
      { agent: { id: 'min-chain', session: { append: () => {} } } },
    ) as { ok: boolean; message?: string; reason?: string }
    expect(settled.ok, String(settled.reason)).toBe(true)
    expect(settled.message).toContain('草稿区已清理')
    // 入档在
    expect(fs.existsSync(path.join(root, paths.定稿章(key.卷, key.章, key.章名)))).toBe(true)
    // 草稿区五处消失(新键)
    for (const rel of [
      paths.草稿目录(key.卷, key.章, key.章名),
      paths.材料包目录(key.卷, key.章, key.章名),
      paths.待定稿包目录(key.卷, key.章, key.章名),
      paths.审核记录(key.卷, key.章, key.章名),
      paths.候选细纲(key.卷, key.章, key.章名),
    ]) {
      expect(fs.existsSync(path.join(root, rel)), rel).toBe(false)
    }
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('完成')
  })
})
