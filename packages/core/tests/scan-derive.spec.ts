import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { canonicalizeChapterKeys, listChapters, scanChapter } from '../src/derive/scan'
import { deriveChapterFacts } from '../src/derive/derive'
import { draftHashOf, reviewInputFingerprintOf } from '../src/evidence/record'
import { parseDocument } from '../src/repo/frontmatter'
import { serializeDocument } from '../src/repo/frontmatter'

const roots: string[] = []
function mkBook(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-book-'))
  roots.push(dir)
  return dir
}
function put(root: string, rel: string, content: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  fs.writeFileSync(path.join(root, rel), content, 'utf-8')
}
function md(fields: Record<string, unknown>, body = '内容'): string {
  return serializeDocument(fields, body)
}
afterAll(() => { for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

const key = { 卷: 1, 章: 3, 章名: '初见' } as const

describe('扫描器→推导端到端(真实文件树)', () => {
  it('链路推进:窗口→候选→确认→材料→草稿→待审→审核→包→裁决→入档(0.0.57 起兼作旧格式 `卷NN-章名` 草稿区目录的回归夹具:读侧 fallback)', () => {
    const root = mkBook()

    // 窗口就绪
    put(root, '大纲/卷规划/卷01/近期窗口.md', '# 近期窗口\n\n- 初见 〔已确认〕\n- 铺垫 〔暂定〕\n')
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('章细纲(待定位)')

    // 候选细纲(草稿区)
    put(root, '草稿区/章细纲/卷01-初见.md', md({ 状态: '候选', 身份: { 卷: 1, 章: 3, 章名: '初见' } }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('章细纲(待确认)')

    // 确认入真源区
    put(root, '大纲/卷规划/卷01/章细纲/0003-初见.md', md({ 状态: '已确认' }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('写作备料')

    // 材料包段齐备
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('写稿')

    // 草稿（0.0.54 起草收稿即待审稿；此处造一份 角色: 草稿 的非交审稿——停在写稿并叠加核对标记）
    put(root, '草稿区/草稿/卷01-初见/稿1.md', md({ 角色: '草稿' }, '第一章正文'))
    const 有草稿无待审 = deriveChapterFacts(scanChapter(root, key))
    expect(有草稿无待审.建议.环节).toBe('写稿')
    expect(有草稿无待审.叠加标记).toContain('有草稿但无唯一待审稿→核对稿件角色')

    // 唯一待审稿
    put(root, '草稿区/草稿/卷01-初见/稿1.md', md({ 角色: '待审稿' }, '第一章正文'))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('审核')
    const draftBody = parseDocument(md({ 角色: '待审稿' }, '第一章正文')).data.body
    const binding = {
      审稿哈希: draftHashOf(draftBody),
      审读指纹: reviewInputFingerprintOf({
        正文: draftBody,
        细纲: md({ 状态: '已确认' }),
        材料清单: JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }),
      }),
    }

    // 审核记录(有问题未处置)→改稿
    put(root, '草稿区/审核/卷01-初见.json', JSON.stringify({ schemaVersion: 1, 完成: true, ...binding, 问题: [{ 处置: '' }] }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('改稿')

    // 处置齐但未登记润色承接→润色（0.0.54 润色后移：审核通过后先润色）
    put(root, '草稿区/审核/卷01-初见.json', JSON.stringify({ schemaVersion: 1, 完成: true, ...binding, 问题: [{ 处置: '已解决' }], 模块: { 文本规范检查: { 完成: true, 失败: false } } }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('润色')

    // 登记跳过润色（承接）→定稿准备
    const skippedBody = draftBody
    put(root, '草稿区/审核/卷01-初见.json', JSON.stringify({ schemaVersion: 1, 完成: true, ...binding, 问题: [{ 处置: '已解决' }], 模块: { 文本规范检查: { 完成: true, 失败: false } },
      润色: { 状态: '已跳过', 父稿哈希: draftHashOf(skippedBody), 稿哈希: draftHashOf(skippedBody), 审读指纹: binding.审读指纹, 稿件: '草稿区/草稿/卷01-初见/稿1.md', 理由: '作者稿', 时间: '2026-10-16T00:00:00.000Z' } }))
    const 承接 = scanChapter(root, key)
    expect(承接.润色已承接).toBe(true)
    expect(deriveChapterFacts(承接).建议.环节).toBe('定稿准备与沉淀')

    // 待定稿包七件+清单
    for (const f of ['正文.md', '事实变更.md', '时间线变更.md', '账本变更.md', '章摘要.md', '卷对账.md', '本书层记忆候选.md']) {
      put(root, `草稿区/定稿准备/卷01-初见/${f}`, 'x')
    }
    put(root, '草稿区/定稿准备/卷01-初见/清单.json', JSON.stringify({ schemaVersion: 1, 文件: [] }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('作者定稿裁决')

    // 裁决批准→定稿入档
    put(root, '草稿区/定稿准备/卷01-初见/清单.json', JSON.stringify({ schemaVersion: 1, 文件: [], 裁决: '已批准' }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('定稿入档')

    // 入档完成
    put(root, '定稿/卷01/0003-初见.md', md({ 状态: '已定稿' }))
    expect(deriveChapterFacts(scanChapter(root, key)).建议.环节).toBe('完成')
  })

  it('叠加标记:细纲需复核被带出且不改位置', () => {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/章细纲/0003-初见.md', md({ 状态: '需复核' }))
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    const r = deriveChapterFacts(scanChapter(root, key))
    expect(r.建议.环节).toBe('写稿') // 行 4 照常(建议仅供参考)
    expect(r.叠加标记).toContain('细纲')
  })

  it('BOM:外部编辑器保存的窗口/候选细纲/材料清单/待审稿字段不静默丢失', () => {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/近期窗口.md', '\uFEFF# 近期窗口\n\n- 初见 〔已确认〕\n- 铺垫 〔暂定〕\n')
    expect(scanChapter(root, key).窗口就绪).toBe(true)
    put(root, '草稿区/章细纲/卷01-初见.md', '\uFEFF' + md({ 状态: '候选' }))
    expect(scanChapter(root, key).候选细纲).toBe(true)
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', '\uFEFF' + JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    expect(scanChapter(root, key).材料包状态).toBe('段齐备')
    put(root, '草稿区/草稿/卷01-初见/稿1.md', '\uFEFF' + md({ 角色: '待审稿' }, '第一章正文'))
    expect(scanChapter(root, key).唯一待审稿).toBe(true)
  })

  it('B4 落地:审核记录解析失败视为「有记录未完成」而非无记录', () => {
    const root = mkBook()
    put(root, '草稿区/草稿/卷01-初见/稿1.md', md({ 角色: '待审稿' }))
    put(root, '草稿区/审核/卷01-初见.json', '{坏的 json')
    const scan = scanChapter(root, key)
    expect(scan.有审核记录).toBe(true)
    expect(scan.审核完成).toBe(false)
    // F5:记录不可读=无哈希=证据过期;恢复视图停在审核(须重审),不冒充改稿处置
    expect(scan.审核证据过期).toBe(true)
    expect(deriveChapterFacts(scan).建议.环节).toBe('审核')
  })

  it('章枚举:listChapters 跨目录收集且去重', () => {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/章细纲/0003-初见.md', md({ 状态: '已确认' }))
    put(root, '草稿区/章细纲/卷01-铺垫.md', md({ 状态: '候选' }))
    put(root, '定稿/卷01/0001-序幕.md', md({ 状态: '已定稿' }))
    const keys = listChapters(root)
    expect(keys).toHaveLength(3)
    expect(keys.map((k) => k.章名).sort()).toEqual(['初见', '序幕', '铺垫'].sort())
  })

  it('章枚举:审核记录等机器态 JSON 不产生幽灵章键（20章连写真机发现）', () => {
    const root = mkBook()
    put(root, '草稿区/审核/卷01-初见.json', '{"schemaVersion":1}')
    put(root, '草稿区/章细纲/卷01-铺垫.md', md({ 状态: '候选' }))
    const keys = listChapters(root)
    expect(keys.map((k) => k.章名).sort()).toEqual(['铺垫'])
  })
})

describe('审核记录口径与 review 写侧对齐(M1/M2/M6)', () => {
  function reviewedBook() {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/章细纲/0003-初见.md', md({ 状态: '已确认' }))
    put(root, '草稿区/材料包/卷01-初见/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    put(root, '草稿区/草稿/卷01-初见/稿1.md', md({ 角色: '待审稿' }, '第一章正文'))
    const draftBody = parseDocument(md({ 角色: '待审稿' }, '第一章正文')).data.body
    return { root, 正文: draftBody, 细纲: md({ 状态: '已确认' }), 材料清单: JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }) }
  }

  it('M1:模块 map 残留陈旧待回写键不压住审核完成(写侧只按当轮注册名计算)', () => {
    const b = reviewedBook()
    put(b.root, '草稿区/审核/卷01-初见.json', JSON.stringify({
      schemaVersion: 1, 完成: true,
      审稿哈希: draftHashOf(b.正文),
      审读指纹: reviewInputFingerprintOf({ 正文: b.正文, 细纲: b.细纲, 材料清单: b.材料清单 }),
      问题: [{ 处置: '已解决' }],
      模块: {
        文本规范检查: { 完成: true, 失败: false, 待回写: false },
        旧版一致性检查: { 完成: false, 失败: false, 待回写: true, 理由: '隔离子 Agent 编排' },
      },
    }))
    const scan = scanChapter(b.root, key)
    expect(scan.审核完成).toBe(true)
    // 0.0.54：审核完成后先润色（未登记承接→行 7 润色），不再直接进定稿准备
    expect(scan.润色已承接).toBe(false)
    expect(deriveChapterFacts(scan).建议.环节).toBe('润色')
  })

  it('M2:方案带规范化外字段时,derive 指纹与 review 写侧一致(共用 parseReviewRecord)', () => {
    const b = reviewedBook()
    const 方案原文 = { 动作: '全维审读', 理由: '回归', 跳过: [{ 模块: '设定核对', 理由: '不适用', 备注: '旧版字段' }], 扩展说明: '旧版工具遗留' }
    // 写侧口径:指纹吃 parseReviewRecord 规范化后的方案(只留 动作/理由/跳过,剥额外字段)
    const 规范化方案 = { 动作: '全维审读', 理由: '回归', 跳过: [{ 模块: '设定核对', 理由: '不适用' }] }
    put(b.root, '草稿区/审核/卷01-初见.json', JSON.stringify({
      schemaVersion: 1, 完成: true,
      审稿哈希: draftHashOf(b.正文),
      审读指纹: reviewInputFingerprintOf({ 正文: b.正文, 细纲: b.细纲, 材料清单: b.材料清单, 方案: 规范化方案 }),
      方案: 方案原文,
      问题: [{ 处置: '已解决' }],
      模块: { 文本规范检查: { 完成: true, 失败: false } },
    }))
    const scan = scanChapter(b.root, key)
    expect(scan.审核证据过期).toBe(false)
    expect(scan.审核完成).toBe(true)
  })

  it('M6:处置值不在词表内按未处置处理,行 8 定稿准备不放行', () => {
    const b = reviewedBook()
    put(b.root, '草稿区/审核/卷01-初见.json', JSON.stringify({
      schemaVersion: 1, 完成: true,
      审稿哈希: draftHashOf(b.正文),
      审读指纹: reviewInputFingerprintOf({ 正文: b.正文, 细纲: b.细纲, 材料清单: b.材料清单 }),
      问题: [{ 处置: '已确认' }, { 处置: 'done' }, { 处置状态: '作者保留' }],
      模块: { 文本规范检查: { 完成: true, 失败: false } },
    }))
    const scan = scanChapter(b.root, key)
    expect(scan.审核证据过期).toBe(false)
    expect(scan.审核完成).toBe(false)
    const rows = deriveChapterFacts(scan)
    expect(rows.事实项.find((row) => row.row === 8)!.事实).toBe(false)
    expect(rows.建议.环节).toBe('改稿')
  })
})

describe('章键归并与窗口失效过滤(拍板 7 配套)', () => {
  it('窗口第七章 + 真源 0007-第七章 → 只返回一条键(章=7);已消费/已失效窗口项不产生键', () => {
    const root = mkBook()
    const 卷规划 = path.join(root, '大纲/卷规划/卷01')
    fs.mkdirSync(卷规划, { recursive: true })
    fs.writeFileSync(path.join(卷规划, '近期窗口.md'), [
      '# 近期窗口',
      '',
      '- 第七章 〔已确认〕',
      '- 旧章 〔已消费〕',
      '- 断章 〔已失效〕',
      '',
    ].join('\n'), 'utf-8')
    fs.mkdirSync(path.join(卷规划, '章细纲'), { recursive: true })
    fs.writeFileSync(path.join(卷规划, '章细纲/0007-第七章.md'), serializeDocument({ 状态: '已确认' }, '# 细纲\n'), 'utf-8')

    const keys = listChapters(root)
    expect(keys).toEqual([{ 卷: 1, 章: 7, 章名: '第七章' }])
    // 近况行推进:确认细纲后不再是「待定位」
    const facts = scanChapter(root, { 卷: 1, 章: 7, 章名: '第七章' })
    expect(deriveChapterFacts(facts).建议.环节).not.toBe('章细纲(待定位)')
  })

  it('canonicalizeChapterKeys:全角括号章名归一合并;归一后仍不同保留两条', () => {
    const merged = canonicalizeChapterKeys([
      { 卷: 1, 章: 0, 章名: '重逢(上)' },
      { 卷: 1, 章: 8, 章名: '重逢（上）' },
      { 卷: 1, 章: 0, 章名: '重逢 上' },
    ])
    // 全角括号归一后「重逢(上)」并入真源键;「重逢 上」归一为「重逢上」仍是另一章,如实保留
    expect(merged).toEqual([
      { 卷: 1, 章: 0, 章名: '重逢 上' },
      { 卷: 1, 章: 8, 章名: '重逢（上）' },
    ])

    const kept = canonicalizeChapterKeys([
      { 卷: 1, 章: 0, 章名: '重逢' },
      { 卷: 1, 章: 9, 章名: '重逢（下）' },
    ])
    expect(kept).toHaveLength(2)
  })
})

describe('草稿区键带章号(批8,0.0.57)——新键解析与旧目录 fallback', () => {
  const key7 = { 卷: 1, 章: 7, 章名: '第七章' } as const

  it('listChapters 解析新格式 `卷NN-NNNN-章名`(章号四位);旧格式无第二段→章:0', () => {
    const root = mkBook()
    put(root, '草稿区/草稿/卷01-0007-第七章/稿1.md', md({ 角色: '待审稿' }))
    put(root, '草稿区/章细纲/卷01-0012-新章.md', md({ 状态: '候选' }))
    put(root, '草稿区/材料包/卷01-旧章/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    const keys = listChapters(root)
    expect(keys).toContainEqual({ 卷: 1, 章: 7, 章名: '第七章' })
    expect(keys).toContainEqual({ 卷: 1, 章: 12, 章名: '新章' })
    expect(keys).toContainEqual({ 卷: 1, 章: 0, 章名: '旧章' })
  })

  it('scanChapter 旧目录 fallback:旧格式五处工件照常读,新键不存在时读旧键', () => {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/章细纲/0007-第七章.md', md({ 状态: '已确认' }))
    put(root, '草稿区/材料包/卷01-第七章/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    put(root, '草稿区/草稿/卷01-第七章/稿1.md', md({ 角色: '待审稿' }, '正文'))
    put(root, '草稿区/审核/卷01-第七章.json', JSON.stringify({ schemaVersion: 1, 完成: false, 问题: [], 模块: {} }))
    const facts = scanChapter(root, key7)
    expect(facts.材料包状态).toBe('段齐备')
    expect(facts.唯一待审稿).toBe(true)
    expect(facts.有审核记录).toBe(true)
  })

  it('scanChapter 新键优先:两代目录同在时读新键(写侧产物权威)', () => {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/章细纲/0007-第七章.md', md({ 状态: '已确认' }))
    put(root, '草稿区/材料包/卷01-第七章/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '段齐备' }))
    put(root, '草稿区/材料包/卷01-0007-第七章/材料清单.json', JSON.stringify({ schemaVersion: 1, 状态: '组装中' }))
    expect(scanChapter(root, key7).材料包状态).toBe('组装中')
  })

  it('候选细纲按 卷+章名 认领:0000 占位与旧格式同名候选都能被定位后的章读到', () => {
    const root = mkBook()
    put(root, '大纲/卷规划/卷01/章细纲/0007-第七章.md', md({ 状态: '已确认' }))
    // 候选先于定位落盘(工具不带章号 → 0000 占位)
    put(root, '草稿区/章细纲/卷01-0000-第七章.md', md({ 状态: '候选' }))
    expect(scanChapter(root, key7).候选细纲).toBe(true)
    const root2 = mkBook()
    put(root2, '大纲/卷规划/卷01/章细纲/0007-第七章.md', md({ 状态: '已确认' }))
    // 旧书:候选在旧格式路径
    put(root2, '草稿区/章细纲/卷01-第七章.md', md({ 状态: '候选' }))
    expect(scanChapter(root2, key7).候选细纲).toBe(true)
  })
})
