import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  assembleMaterials,
  confirmOutline,
  deriveChapterFacts,
  parseDocument,
  scanChapter,
  seedMinDesign,
  writeCandidate,
} from '@abzu/core'
import { loadDraftContext, selectDraft, writeDraft } from '../src/index'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-draft-'))
  roots.push(dir)
  seedMinDesign(dir)
  return dir
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

const key = { 卷: 1, 章: 1, 章名: '开篇任务' } as const
const refs = ['作品契约/契约.md@1', '世界书/人物档案/主角.md@1'] as const

function confirmReady(root: string): void {
  const body = [
    '# 章细纲', '', '## 定位段', '',
    '### 来源窗口项及拆并关系', '开篇任务，单章承接', '',
    '### 章节功能', '建立开场冲突', '- 〔软〕节奏平稳', '',
    '### 视角与焦点', '主角视角', '',
    '### 时空锚定', '城门口，清晨', '',
    '### 起止边界', '从抵达城门到发现异状', '',
    '### 故事线与承诺分配', '推进主线承诺', '',
    '### 信息边界', '只披露主角所见', '',
    '### 情绪与节奏目标', '紧张后留钩子', '',
    '### 前置条件核对结果', '已核对来源与窗口，前置设定均非留白', '',
    '## 细纲段', '', '### 单元 1', '',
    '- 目标: 找到异常', '- 人物: 主角', '- 时空: 城门口',
    '- 行动/冲突: 盘问与发现', '- 信息披露: 异常线索', '- 状态变化: 从平静到警觉', '',
  ].join('\n')
  writeCandidate(root, { 卷: 1, 章: 1, 章名: '开篇任务', 来源引用: refs, body })
  const r = confirmOutline(root, key)
  if (!r.ok) throw new Error(`confirm failed:${r.gaps.join(';')}`)
}

describe('单稿写作(插件规格 §5 草稿协议)', () => {
  it('R1 播报:细纲未确认/材料包未组装不拒绝写稿,播报随结果返回', () => {
    const root = mkBook()
    const r = writeDraft(root, { ...key, body: '他走进雨里。' })
    expect(r.ok).toBe(true)
    expect(r.播报).toContain('细纲未确认')
    expect(r.播报).toContain('材料包未组装')
    expect(fs.existsSync(path.join(root, '草稿区/草稿/卷01-0001-开篇任务/稿1.md'))).toBe(true)
  })

  it('after assemble + writeDraft → derive 审核 (起草收稿即待审稿, 0.0.54)', () => {
    const root = mkBook()
    confirmReady(root)
    const assembled = assembleMaterials(root, key)
    expect(assembled.ok).toBe(true)
    const r = writeDraft(root, { ...key, body: '他走进雨里。' })
    expect(r.ok).toBe(true)
    expect(r.relPath).toBe('草稿区/草稿/卷01-0001-开篇任务/稿1.md')
    const text = fs.readFileSync(path.join(root, r.relPath), 'utf-8')
    expect(text).toMatch(/角色:\s*待审稿/)
    expect(text).toMatch(/选定:\s*true/)
    const facts = scanChapter(root, key)
    expect(facts.有草稿).toBe(true)
    expect(facts.唯一待审稿).toBe(true)
    expect(deriveChapterFacts(facts).建议.环节).toBe('审核')
  })

  it('重写稿先降级旧待审稿再写新稿,任一时刻待审稿唯一', () => {
    const root = mkBook()
    const first = writeDraft(root, { ...key, body: '第一稿。' })
    expect(first.ok).toBe(true)
    const second = writeDraft(root, { ...key, body: '第二稿。' })
    expect(second.ok).toBe(true)
    const facts = scanChapter(root, key)
    expect(facts.唯一待审稿).toBe(true)
    const drafts = fs.readdirSync(path.join(root, '草稿区/草稿/卷01-0001-开篇任务'))
    const pending = drafts.filter((f) => {
      const doc = parseDocument(fs.readFileSync(path.join(root, '草稿区/草稿/卷01-0001-开篇任务', f), 'utf-8'))
      return doc.ok && doc.data.fields['角色'] === '待审稿'
    })
    expect(pending).toEqual(['稿2.md'])
  })

  it('context loader does not include 审核 files', () => {
    const root = mkBook()
    confirmReady(root)
    assembleMaterials(root, key)
    fs.mkdirSync(path.join(root, '草稿区/审核'), { recursive: true })
    fs.writeFileSync(path.join(root, '草稿区/审核/卷01-0001-开篇任务.json'), '{"schemaVersion":1,"完成":false,"问题":[]}', 'utf-8')
    const ctx = loadDraftContext(root, key)
    expect(ctx.细纲).toMatch(/章细纲/)
    expect(Object.keys(ctx.材料段).some((k) => k.includes('本章任务'))).toBe(true)
    const dumped = JSON.stringify(ctx)
    expect(dumped).not.toContain('草稿区/审核')
    expect(dumped).not.toContain('卷01-0001-开篇任务.json')
    expect(dumped).not.toMatch(/"完成"\s*:/)
  })

  it('Y5 带 BOM 的确认细纲照常解析，硬约束不丢', () => {
    const root = mkBook()
    confirmReady(root)
    const rel = '故事剧情/卷规划/卷01/章细纲/0001-开篇任务.md'
    const raw = fs.readFileSync(path.join(root, rel), 'utf-8')
    // 外部编辑器带 BOM 保存:读侧单源(core readBookText 剥 BOM)后仍能解析
    fs.writeFileSync(path.join(root, rel), '\uFEFF' + raw.replace('〔软〕', '〔硬〕'), 'utf-8')
    const ctx = loadDraftContext(root, key)
    expect(ctx.细纲).toMatch(/章细纲/)
    expect(ctx.硬约束.length).toBeGreaterThan(0)
  })

  it('候选事实 stays in workspace draft only', () => {
    const root = mkBook()
    confirmReady(root)
    assembleMaterials(root, key)
    const r = writeDraft(root, {
      ...key,
      body: '他走进雨里。\n\n## 草稿候选事实\n\n- 巷口多了一盏灯',
    })
    expect(r.ok).toBe(true)
    const draft = fs.readFileSync(path.join(root, r.relPath), 'utf-8')
    expect(draft).toContain('巷口多了一盏灯')
    expect(fs.existsSync(path.join(root, '世界书'))).toBe(true)
    const world = fs.readFileSync(path.join(root, '世界书/人物档案/主角.md'), 'utf-8')
    expect(world).not.toContain('巷口多了一盏灯')
    expect(fs.existsSync(path.join(root, '故事剧情/卷规划/卷01/章细纲/0001-开篇任务.md'))).toBe(true)
    const outline = fs.readFileSync(path.join(root, '故事剧情/卷规划/卷01/章细纲/0001-开篇任务.md'), 'utf-8')
    expect(outline).not.toContain('巷口多了一盏灯')
  })

  it('「草稿候选事实补充」这类同前缀标题不被当成候选事实分隔线', () => {
    const root = mkBook()
    confirmReady(root)
    assembleMaterials(root, key)
    const r = writeDraft(root, {
      ...key,
      body: '他走进雨里。\n\n## 草稿候选事实补充说明\n\n这段是正文的一部分。',
    })
    expect(r.ok).toBe(true)
    const draft = fs.readFileSync(path.join(root, r.relPath), 'utf-8')
    expect(draft).toContain('## 草稿候选事实补充说明')
    expect(draft).toContain('这段是正文的一部分。')
    expect(draft).not.toMatch(/^- 这段是正文的一部分。$/m)
  })

  it('Windows 大写扩展名草稿参与稿号与版本链,与 core 扫描同口径(POSIX 不认)', () => {
    const root = mkBook()
    const first = writeDraft(root, { ...key, body: '第一稿正文。' })
    expect(first.ok).toBe(true)
    const dir = path.join(root, '草稿区/草稿/卷01-0001-开篇任务')
    fs.renameSync(path.join(dir, '稿1.md'), path.join(dir, '稿1.MD'))
    const second = writeDraft(root, { ...key, body: '第二稿正文。' })
    expect(second.ok).toBe(true)
    if (process.platform !== 'win32') {
      expect(second.relPath).toBe('草稿区/草稿/卷01-0001-开篇任务/稿1.md')
      expect(fs.readdirSync(dir).sort()).toEqual(['稿1.MD', '稿1.md'])
      expect(scanChapter(root, key).有草稿).toBe(true)
      return
    }
    expect(second.relPath).toBe('草稿区/草稿/卷01-0001-开篇任务/稿2.md')
    expect(fs.readdirSync(dir).sort()).toEqual(['稿1.MD', '稿2.md'])
    const doc = parseDocument(fs.readFileSync(path.join(root, second.relPath), 'utf-8'))
    expect(doc.ok && doc.data.fields['版本']).toBe(2)
    expect(scanChapter(root, key).有草稿).toBe(true)
  })

  it('selectDraft 目标稿损坏时失败，不跳过并谎报成功', () => {
    const root = mkBook()
    const written = writeDraft(root, { ...key, body: '第一稿正文。' })
    expect(written.ok).toBe(true)
    const rel = '草稿区/草稿/卷01-0001-开篇任务/稿1.md'
    fs.writeFileSync(path.join(root, rel), '---\n角色: [未闭合\n---\n坏稿', 'utf-8')
    const result = selectDraft(root, { ...key, file: '稿1.md' })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('解析失败')
  })
})
