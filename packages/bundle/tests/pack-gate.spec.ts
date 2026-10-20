import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { spawnSync } from 'node:child_process'
import {
  applyRevision,
  assembleMaterials,
  confirmOutline,
  deriveChapterFacts,
  packGateGaps,
  scanChapter,
  seedMinDesign,
  serializeDocument,
  writeCandidate,
} from '@abzu/core'
import { ingestFindings, recordPolish, registerDefaultChecks, resetChecks, runReview } from '@abzu/review'

/**
 * 组包前置闸 `packGateGaps`。
 *
 * 历史问题：`novel-settle/SKILL.md:18` 一直写着「审核完成、润色已承接或已登记跳过」才能组包，
 * 但组包链路上没人验这两项——绕过技能直接调 `novel_prepare_pack` 不会报错，
 * 门禁只在人守流程时有效。
 *
 * 判据放在 core 的 `packGateGaps`（纯函数、只读），由工具层 `novel_prepare_pack` 调用。
 * 不放进 `computePack`：那是纯计算，夹具/测试直调它造包是合法用法（reliability-fix1、
 * proposal 等用例都这么用），在计算层拦会误伤。
 */
const roots: string[] = []
function mkDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  roots.push(dir)
  return dir
}
afterAll(() => {
  for (const r of roots) {
    try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放 */ }
  }
})

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const refs = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const
const HARD = '开场必须点名主角现身'

function git(cwd: string, args: readonly string[]): ReturnType<typeof spawnSync> {
  return spawnSync('git', args, { cwd, encoding: 'utf-8', windowsHide: true })
}

function initRepo(): string {
  const root = mkDir('abzu-packgate-')
  expect(git(root, ['init']).status).toBe(0)
  git(root, ['config', 'user.email', 'test@example.com'])
  git(root, ['config', 'user.name', 'test'])
  git(root, ['config', 'commit.gpgsign', 'false'])
  return root
}

function confirmWithHard(root: string): void {
  seedMinDesign(root)
  const body = [
    '# 章细纲', '', '## 定位段', '',
    '### 来源窗口项及拆并关系', '开篇任务，单章承接', '',
    '### 章节功能', '', `- 〔硬〕${HARD}`, '',
    '### 视角与焦点', '主角视角', '',
    '### 时空锚定', '城门口，清晨', '',
    '### 起止边界', '从抵达城门到发现异状', '',
    '### 故事线与承诺分配', '推进主线承诺', '',
    '### 信息边界', '只披露主角所见', '',
    '### 情绪与节奏目标', '紧张后留钩子', '',
    '### 前置条件核对结果', '已核对来源与窗口，前置设定均非留白', '',
    '## 细纲段', '', '### 单元 1', '',
    '- 目标: 开场', '- 人物: 主角', '- 时空: 城门口',
    '- 行动/冲突: 盘问与发现', '- 信息披露: 异常线索', '- 状态变化: 从平静到警觉', '',
  ].join('\n')
  writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 来源引用: refs, body })
  const r = confirmOutline(root, key)
  if (!r.ok) throw new Error(`confirm failed:${r.gaps.join(';')}`)
}

function putPending(root: string, body: string): void {
  const rel = '草稿区/草稿/卷01-0001-开篇任务/稿1.md'
  fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true })
  fs.writeFileSync(
    path.join(root, rel),
    serializeDocument({ 角色: '待审稿', 选定: true, 版本: 1, 父版本: null, 生成模块: '写稿' }, body),
    'utf-8',
  )
}

/** 跑到「已审读但未回写」态。 */
function toReviewPending(root: string): void {
  confirmWithHard(root)
  assembleMaterials(root, key)
  putPending(root, `综上所述，${HARD}。`)
  resetChecks()
  registerDefaultChecks()
  runReview(root, key)
}

/** 把当前章审核推到「完成」态：回写全部模块 + 处置所有待处理项。 */
function finishReview(root: string): void {
  const after = runReview(root, key).record
  for (const [name, st] of Object.entries(after?.模块 ?? {})) {
    if (st.待回写 === true) expect(ingestFindings(root, key, name, [], after!.审读指纹).ok).toBe(true)
  }
  const rec = JSON.parse(fs.readFileSync(path.join(root, '草稿区/审核/卷01-0001-开篇任务.json'), 'utf-8'))
  for (const q of rec.问题) {
    if (q.处置状态 === '待处理') {
      expect(applyRevision(root, key, { 发现项编号: q.发现项编号, 处置: '作者保留' }).ok).toBe(true)
    }
  }
}

describe('组包前置闸 packGateGaps', () => {
  it('审核未完成时给出缺口，点名审核', () => {
    const root = initRepo()
    toReviewPending(root)
    const facts = scanChapter(root, key)
    expect(facts.有审核记录, '应已产生审核记录').toBe(true)
    expect(facts.审核完成, '只跑不回写不算完成').toBe(false)

    const gaps = packGateGaps(root, key)
    expect(gaps.length).toBeGreaterThan(0)
    expect(gaps.join('；'), '应点名审核未完成').toContain('审核未完成')
    expect(gaps.join('；'), '应给出解法').toContain('处置')
  })

  it('审核完成但润色未承接时给出缺口，点名润色', () => {
    const root = initRepo()
    toReviewPending(root)
    finishReview(root)
    const facts = scanChapter(root, key)
    expect(facts.审核完成, '模块齐+处置齐应算审核完成').toBe(true)
    expect(facts.润色已承接, '尚未登记润色').toBe(false)
    expect(deriveChapterFacts(facts).建议.环节).toBe('润色')

    const gaps = packGateGaps(root, key)
    expect(gaps.length).toBeGreaterThan(0)
    expect(gaps.join('；'), '应点名润色未承接').toContain('润色')
    expect(gaps.join('；'), '应给出「跳过」这条解法').toContain('跳过')
  }, 60_000)

  it('审核完成 + 润色已登记跳过 → 无缺口（放行）', () => {
    const root = initRepo()
    toReviewPending(root)
    finishReview(root)
    expect(recordPolish(root, { ...key, 跳过: true, 理由: '作者稿不润色' }).ok).toBe(true)
    expect(scanChapter(root, key).润色已承接).toBe(true)
    expect(packGateGaps(root, key), '应放行').toEqual([])
  }, 60_000)

  it('老书无审核记录时不误拦', () => {
    const root = initRepo()
    confirmWithHard(root)
    assembleMaterials(root, key)
    putPending(root, `${HARD}。`)
    expect(scanChapter(root, key).有审核记录, '尚未审读').toBe(false)
    expect(packGateGaps(root, key), '无审核记录不得报缺口').toEqual([])
  }, 60_000)

  it('审核未完成时不先催润色（缺口不互相遮蔽）', () => {
    const root = initRepo()
    toReviewPending(root)
    const joined = packGateGaps(root, key).join('；')
    expect(joined).toContain('审核未完成')
    expect(joined, '审核没过时不该先催润色').not.toContain('润色未承接')
  })

  it('扫描异常不阻断组包（返回空＝放行）', () => {
    // 不存在的书仓根：scanChapter 抛错时应吞掉，交给组包自身报更准的原因
    const ghost = path.join(os.tmpdir(), `abzu-ghost-${Date.now()}`)
    expect(() => packGateGaps(ghost, key)).not.toThrow()
    expect(packGateGaps(ghost, key)).toEqual([])
  })
})
