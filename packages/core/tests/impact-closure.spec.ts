import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'
import { analyzeImpact, buildRefGraph, normalizeNodeKey, paths, serializeDocument, writeFileAtomic, zoneOf } from '../src/index'
import type { RefGraph } from '../src/index'

const roots: string[] = []
afterAll(() => { for (const root of roots) { try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } } })

function mkRoot(prefix = 'abzu-impact-'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  roots.push(root)
  return root
}

function doc(fields: Record<string, unknown>, body = '正文\n'): string {
  return serializeDocument(fields, body)
}

function write(root: string, rel: string, content: string): void {
  writeFileAtomic(root, rel, content)
}

/**
 * 基准 fixture:契约 ← 卷纲 ← {确认细纲,候选细纲};契约 ← 定稿章(经 来源引用 复制
 * 与 来源细纲版本 两条边);细纲 → 定稿章只有 来源细纲版本 一条边。预期 7 条边。
 */
function seedChainFixture(root: string): void {
  write(root, paths.契约(), doc({}, '契约正文\n'))
  write(root, paths.卷纲(1), doc({ 来源引用: ['作品契约/契约.md@1'] }, '卷纲\n'))
  write(root, paths.确认细纲(1, 1, '开篇'), doc({ 来源引用: ['作品契约/契约.md@1', `${paths.卷纲(1)}@2`] }, '细纲\n'))
  write(root, paths.定稿章(1, 1, '开篇'), doc({
    状态: '已定稿',
    来源引用: ['作品契约/契约.md@1', `${paths.卷纲(1)}@2`],
    来源细纲版本: `${paths.确认细纲(1, 1, '开篇')}@3`,
  }, '正文\n'))
  write(root, paths.候选细纲(1, 1, '开篇'), doc({ 来源引用: [`${paths.卷纲(1)}@2`] }, '候选\n'))
}

function edgeCount(graph: RefGraph): { forward: number; reverse: number } {
  let forward = 0
  for (const list of graph.forward.values()) forward += list.length
  let reverse = 0
  for (const list of graph.reverse.values()) reverse += list.length
  return { forward, reverse }
}

/** 朴素全扫闭包(参照实现,与 BFS 无共享代码):重复扩到不动点为止。 */
function naiveClosure(graph: RefGraph, changed: string, stopAtFinalized: boolean): Set<string> {
  const edges = [...graph.forward.values()].flat()
  const seen = new Set<string>([changed])
  const expandable = new Set<string>([changed])
  let grew = true
  while (grew) {
    grew = false
    for (const edge of edges) {
      if (!expandable.has(edge.to) || seen.has(edge.from)) continue
      seen.add(edge.from)
      grew = true
      if (!(stopAtFinalized && zoneOf(edge.from) === '已定稿')) expandable.add(edge.from)
    }
  }
  return seen
}

function closureNodes(report: ReturnType<typeof analyzeImpact>): Set<string> {
  return new Set([report.changed, ...report.闭包逐跳.flat().map((ref) => ref.relPath)])
}

function snapshotFiles(root: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else out.set(path.relative(root, abs).replace(/\\/g, '/'), fs.readFileSync(abs, 'utf8'))
    }
  }
  walk(root)
  return out
}

describe('影响闭包:建图与规范化', () => {
  it('normalizeNodeKey 五条规则:分隔符、不折叠大小写、NFC、拒 .. 与绝对路径、posix.normalize', () => {
    expect(normalizeNodeKey('故事剧情\\全书大纲.md')).toBe('故事剧情/全书大纲.md')
    expect(normalizeNodeKey('./故事剧情/全书大纲.md')).toBe('故事剧情/全书大纲.md')
    expect(normalizeNodeKey('故事剧情/全书大纲.MD')).toBe('故事剧情/全书大纲.MD')
    expect(normalizeNodeKey('故事剧情/全书大纲.MD')).not.toBe(normalizeNodeKey('故事剧情/全书大纲.md'))
    expect(normalizeNodeKey('故事剧情/cafe\u0301.md')).toBe(normalizeNodeKey('故事剧情/café.md'))
    expect(normalizeNodeKey('设定/../全书大纲.md')).toBeNull()
    expect(normalizeNodeKey('/故事剧情/全书大纲.md')).toBeNull()
    expect(normalizeNodeKey('C:/故事剧情/全书大纲.md')).toBeNull()
    expect(normalizeNodeKey('')).toBeNull()
  })

  it('fixture 探针:正反边集数量一致且等于预期、悬空 0、解析失败 0,不一致即抛(A2)', () => {
    const root = mkRoot()
    seedChainFixture(root)
    const graph = buildRefGraph(root)
    const counts = edgeCount(graph)
    const expected = 7 // 卷纲→契约;细纲→契约,细纲→卷纲;定稿→契约,定稿→卷纲,定稿→细纲;候选→卷纲
    expect(counts.forward).toBe(expected)
    expect(counts.reverse).toBe(expected)
    expect(graph.悬空引用).toEqual([])
    expect(graph.解析失败).toEqual([])
    expect(graph.提示).toEqual([])
  })

  it('来源细纲版本缺 @版本 仍建边并计入提示(R12)', () => {
    const root = mkRoot()
    write(root, paths.确认细纲(1, 1, '开篇'), doc({}, '细纲\n'))
    write(root, paths.定稿章(1, 1, '开篇'), doc({ 来源细纲版本: paths.确认细纲(1, 1, '开篇') }, '正文\n'))
    const graph = buildRefGraph(root)
    expect(edgeCount(graph).forward).toBe(1)
    expect(graph.提示.join('\n')).toMatch(/缺 @版本/)
    const report = analyzeImpact(root, paths.确认细纲(1, 1, '开篇'))
    expect(report.references.map((ref) => ref.relPath)).toContain(paths.定稿章(1, 1, '开篇'))
  })
})

describe('影响闭包:传递闭包', () => {
  it('闭包与朴素全扫参照实现逐节点相等,止于与不止于两种模式都对跑(A1)', () => {
    const root = mkRoot()
    seedChainFixture(root)
    const graph = buildRefGraph(root)

    const full = analyzeImpact(root, paths.契约(), { 止于: null })
    expect(closureNodes(full)).toEqual(naiveClosure(graph, paths.契约(), false))

    const stopped = analyzeImpact(root, paths.契约())
    expect(closureNodes(stopped)).toEqual(naiveClosure(graph, paths.契约(), true))
  })

  it('命中已定稿:标注须走吃书补偿、命中即停不往下扩、未写入任何文件(A3)', () => {
    const root = mkRoot()
    write(root, '世界书/北境.md', doc({}, '北境设定\n'))
    write(root, paths.定稿章(1, 1, '开篇'), doc({ 状态: '已定稿', 来源引用: ['世界书/北境.md@1'] }, '正文\n'))
    // 只有定稿章引用北境;章摘要引用定稿章——命中即停则章摘要不得入闭包
    write(root, paths.章摘要(1, 1, '开篇'), doc({ 来源引用: [`${paths.定稿章(1, 1, '开篇')}@1`] }, '摘要\n'))
    const before = snapshotFiles(root)
    const report = analyzeImpact(root, '世界书/北境.md')
    const after = snapshotFiles(root)
    expect(report.已定稿命中.map((ref) => ref.relPath)).toEqual([paths.定稿章(1, 1, '开篇')])
    expect(report.已定稿命中[0]!.处置).toBe('须走吃书补偿')
    expect(report.闭包逐跳).toHaveLength(1)
    expect(report.闭包逐跳.flat().map((ref) => ref.relPath)).not.toContain(paths.章摘要(1, 1, '开篇'))
    expect(after.size).toBe(before.size)
    for (const [rel, text] of before) expect(after.get(rel)).toBe(text)
  })

  it('环、自环、重复边都靠已见集合有界收敛(A4)', () => {
    const root = mkRoot()
    // 环:甲 ↔ 乙 互相引用
    write(root, '设定/甲.md', doc({ 来源引用: ['设定/乙.md@1'] }, '甲\n'))
    write(root, '设定/乙.md', doc({ 来源引用: ['设定/甲.md@1'] }, '乙\n'))
    const cycle = analyzeImpact(root, '设定/甲.md')
    expect(closureNodes(cycle)).toEqual(new Set(['设定/甲.md', '设定/乙.md']))
    // 自环:丙引用自己
    write(root, '设定/丙.md', doc({ 来源引用: ['设定/丙.md@1'] }, '丙\n'))
    const selfLoop = analyzeImpact(root, '设定/丙.md')
    expect(selfLoop.references).toEqual([])
    // 重复边:同一 (from,to) 只计一条,重复本身进提示
    write(root, '设定/丁.md', doc({ 来源引用: ['设定/甲.md@1', '设定/甲.md@2'] }, '丁\n'))
    const graph = buildRefGraph(root)
    const rev = graph.reverse.get('设定/甲.md') ?? []
    expect(rev.filter((edge) => edge.from === '设定/丁.md')).toHaveLength(1)
    expect(graph.提示.join('\n')).toMatch(/重复引用/)
  })

  it('悬空引用被显式报出:引用了不存在文件时单列,不静默跳过(A5)', () => {
    const root = mkRoot()
    write(root, '设定/戊.md', doc({ 来源引用: ['设定/不存在.md@1'] }, '戊\n'))
    const report = analyzeImpact(root, '设定/无干.md')
    expect(report.悬空引用).toHaveLength(1)
    expect(report.悬空引用[0]!.from).toBe('设定/戊.md')
    expect(report.悬空引用[0]!.to).toBe('设定/不存在.md')
  })

  it('frontmatter 解析失败进报告而非静默跳过,坏文件即使引用 changed 也不入闭包(A10)', () => {
    const root = mkRoot()
    write(root, '设定/己.md', doc({}, '己\n'))
    // frontmatter 未闭合 → parse-error;它引用了 changed,必须出现在 解析失败
    fs.writeFileSync(path.join(root, '设定/庚.md'), '---\n来源引用: 来源:设定/己.md@1\n')
    const report = analyzeImpact(root, '设定/己.md')
    expect(report.解析失败).toHaveLength(1)
    expect(report.解析失败[0]!.rel).toBe('设定/庚.md')
    expect(report.解析失败[0]!.detail).toMatch(/未闭合/)
    expect(report.references.map((ref) => ref.relPath)).not.toContain('设定/庚.md')
  })

  it('git checkout 换掉工作树后结果随之改变——证明无缓存、无过期(A6)', () => {
    const root = mkRoot('abzu-impact-git-')
    const git = (args: readonly string[]): void => {
      const r = spawnSync('git', args, { cwd: root, encoding: 'utf-8', windowsHide: true })
      expect(r.status).toBe(0)
    }
    git(['init'])
    git(['config', 'user.email', 'test@example.com'])
    git(['config', 'user.name', 'test'])
    git(['config', 'commit.gpgsign', 'false'])
    write(root, '设定/剑谱.md', doc({}, '剑谱\n'))
    write(root, '故事剧情/全书大纲.md', doc({ 来源引用: ['设定/剑谱.md@1'] }, '全书大纲\n'))
    git(['add', '-A'])
    git(['commit', '-m', 'ch: 有边'])
    expect(analyzeImpact(root, '设定/剑谱.md').references.map((ref) => ref.relPath)).toEqual(['故事剧情/全书大纲.md'])
    write(root, '故事剧情/全书大纲.md', doc({}, '全书大纲改\n'))
    git(['add', '-A'])
    git(['commit', '-m', 'ch: 无边'])
    expect(analyzeImpact(root, '设定/剑谱.md').references).toEqual([])
    git(['checkout', 'HEAD~1', '--', '故事剧情/全书大纲.md'])
    expect(analyzeImpact(root, '设定/剑谱.md').references.map((ref) => ref.relPath)).toEqual(['故事剧情/全书大纲.md'])
  })

  it('调用前后无新增 watcher/timer/句柄等常驻资源(A7)', () => {
    const root = mkRoot()
    seedChainFixture(root)
    const before = [...process.getActiveResourcesInfo()].sort()
    analyzeImpact(root, paths.契约())
    analyzeImpact(root, paths.契约())
    const after = [...process.getActiveResourcesInfo()].sort()
    expect(after).toEqual(before)
  })

  it('细纲下游可达:只经 来源细纲版本 指向它的定稿章在第一跳并落 已定稿命中(A11)', () => {
    const root = mkRoot()
    seedChainFixture(root)
    const report = analyzeImpact(root, paths.确认细纲(1, 1, '开篇'))
    expect(report.references.map((ref) => ref.relPath)).toEqual([paths.定稿章(1, 1, '开篇')])
    expect(report.references[0]!.field).toBe('来源细纲版本')
    expect(report.已定稿命中.map((ref) => ref.relPath)).toEqual([paths.定稿章(1, 1, '开篇')])
  })

  it('分区标注:草稿区/真源未定稿/已定稿三类同现逐条正确,可入批次文件只含真源未定稿(A12)', () => {
    const root = mkRoot()
    write(root, paths.契约(), doc({}, '契约正文\n'))
    write(root, paths.卷纲(1), doc({ 来源引用: ['作品契约/契约.md@1'] }, '卷纲\n'))
    write(root, paths.候选细纲(1, 1, '开篇'), doc({ 来源引用: ['作品契约/契约.md@1'] }, '候选\n'))
    write(root, paths.定稿章(1, 1, '开篇'), doc({ 状态: '已定稿', 来源引用: ['作品契约/契约.md@1'] }, '正文\n'))
    const report = analyzeImpact(root, paths.契约())
    const byRel = new Map(report.references.map((ref) => [ref.relPath, ref.分区]))
    expect(byRel.get(paths.候选细纲(1, 1, '开篇'))).toBe('草稿区')
    expect(byRel.get(paths.卷纲(1))).toBe('真源未定稿')
    expect(byRel.get(paths.定稿章(1, 1, '开篇'))).toBe('已定稿')
    expect(report.可入批次文件).toEqual([paths.卷纲(1)])
    expect(report.可入批次文件.every((rel) => zoneOf(rel) === '真源未定稿')).toBe(true)
  })
  it('0.0.52 幕纲批：章细纲来源引用写幕纲，改幕纲后影响分析列出该细纲（反向边走通）', () => {
    const root = mkRoot()
    write(root, paths.契约(), doc({}, '契约正文\n'))
    const 幕纲路径 = paths.幕纲(1, 1, '渡口疑云')
    write(root, 幕纲路径, doc({}, '幕纲正文\n'))
    // 章细纲同时引卷纲与幕纲（0.0.52 起「来源引用幕纲」的新形态）
    write(root, paths.卷纲(1), doc({ 来源引用: ['作品契约/契约.md@1'] }, '卷纲\n'))
    write(root, paths.确认细纲(1, 1, '开篇'), doc({
      状态: '已确认',
      来源引用: ['作品契约/契约.md@1', `${paths.卷纲(1)}@2`, `${幕纲路径}@1`],
    }, '细纲\n'))

    // 图里存在 章细纲 → 幕纲 这条引用边（反向图键 幕纲，from 为章细纲）
    const graph = buildRefGraph(root)
    const edges = [...(graph.reverse.get(normalizeNodeKey(幕纲路径)!) ?? [])]
    expect(edges.map((e) => e.from)).toContain(normalizeNodeKey(paths.确认细纲(1, 1, '开篇')))
    expect(edges.map((e) => e.version)).toContain('1')

    // 改幕纲 → 影响分析列出该细纲（真源未定稿，可入批次文件）
    const report = analyzeImpact(root, 幕纲路径)
    expect(report.changed).toBe(幕纲路径)
    expect(report.references.map((ref) => ref.relPath)).toContain(paths.确认细纲(1, 1, '开篇'))
    expect(report.references.find((ref) => ref.relPath === paths.确认细纲(1, 1, '开篇'))?.分区).toBe('真源未定稿')
    expect(report.可入批次文件).toContain(paths.确认细纲(1, 1, '开篇'))
    expect(report.悬空引用).toEqual([])
  })
})

describe('幕纲/卷纲版本绑定提示(批8,0.0.57)', () => {
  it('引用版本 > 目标文件当前版本 → 提示「引用了未来版本」;边的存在性不变;文件无版本沿用现状不提示', () => {
    const root = mkRoot('abzu-impact-ver-')
    write(root, paths.卷纲(1), doc({ 状态: '已确认', 版本: 2 }, '卷纲 v2\n'))
    // 引用 @3 > 文件 v2 → 未来版本提示
    write(root, paths.确认细纲(1, 1, '开篇'), doc({ 来源引用: [`${paths.卷纲(1)}@3`] }, '细纲\n'))
    const future = buildRefGraph(root)
    expect(future.提示.some((t) => t.includes('未来版本') && t.includes('@3') && t.includes('v2'))).toBe(true)
    // 边的存在性不变:细纲 → 卷纲 的反向边仍在
    expect([...(future.reverse.get(normalizeNodeKey(paths.卷纲(1))!) ?? [])].map((e) => e.from)).toContain(paths.确认细纲(1, 1, '开篇'))

    // 引用版本 ≤ 文件版本(2 ≤ 3)＝有效,不提示
    const root2 = mkRoot('abzu-impact-ver2-')
    write(root2, paths.卷纲(1), doc({ 状态: '已确认', 版本: 3 }, '卷纲 v3\n'))
    write(root2, paths.确认细纲(1, 1, '开篇'), doc({ 来源引用: [`${paths.卷纲(1)}@2`] }, '细纲\n'))
    expect(buildRefGraph(root2).提示.filter((t) => t.includes('未来版本'))).toEqual([])
    // 边仍在
    expect([...(buildRefGraph(root2).reverse.get(normalizeNodeKey(paths.卷纲(1))!) ?? [])]).toHaveLength(1)

    // 旧文件无 frontmatter 版本:沿用现状(不新增提示),边照建
    const root3 = mkRoot('abzu-impact-ver3-')
    write(root3, paths.卷纲(1), '# 卷纲\n\n旧文件无版本。\n')
    write(root3, paths.确认细纲(1, 1, '开篇'), doc({ 来源引用: [`${paths.卷纲(1)}@5`] }, '细纲\n'))
    const legacy = buildRefGraph(root3)
    expect(legacy.提示.filter((t) => t.includes('未来版本'))).toEqual([])
    expect([...(legacy.reverse.get(normalizeNodeKey(paths.卷纲(1))!) ?? [])]).toHaveLength(1)
  })
})
