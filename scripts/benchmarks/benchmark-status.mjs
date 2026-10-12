import { performance } from 'node:perf_hooks'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { register } from 'node:module'
// Node ≥22.6 类型剥离直接跑源码:不依赖构建产物,`pnpm build` 是纯类型门禁(dsh 同款)。
// 仓内源码是无扩展名相对导入,先挂补 .ts 的解析钩子;状态派生引入 core 全量(含 lock.ts
// 的构造器参数属性),须用 --experimental-transform-types 运行(与 benchmark:search 同款)。
register('../strip-types-loader.mjs', import.meta.url)
const core = await import('../../packages/core/src/index.ts')

// ── fixture:200 章合成书(4 卷×50 章,真实文件形状)──────────────────────────
// 长篇性能护栏(数据保护三件套 #7):novel_get_story_status 的核心派生面在长篇下的时长
// 上限。0.0.31 修复前每章重调 renderStatusCard(重跑 scanChapter＋账本/记忆/对账整套),
// 200 章＝约两倍文件扫描＋200 次全账本查询;修复后复用 listResumable 的快照,本基准防回退。
const VOLUMES = 4
const CHAPTERS_PER_VOLUME = 50
const TOTAL = VOLUMES * CHAPTERS_PER_VOLUME
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-benchmark-status-'))
const doc = (title, body) => `# ${title}\n\n${body}`
for (let v = 1; v <= VOLUMES; v += 1) {
  fs.mkdirSync(path.join(root, '大纲/卷规划', `卷${String(v).padStart(2, '0')}`, '章细纲'), { recursive: true })
  fs.writeFileSync(path.join(root, '大纲/卷规划', `卷${String(v).padStart(2, '0')}`, '卷纲.md'), doc(`卷${v}卷纲`, '定位段:测试。\n'))
  fs.writeFileSync(path.join(root, '大纲/卷规划', `卷${String(v).padStart(2, '0')}`, '计划时间线.md'), '# 计划时间线\n\n## 窗口覆盖\n\n## 窗口外锚点\n')
  fs.writeFileSync(path.join(root, '大纲/卷规划', `卷${String(v).padStart(2, '0')}`, '近期窗口.md'), '# 近期窗口\n')
  for (let c = 0; c < CHAPTERS_PER_VOLUME; c += 1) {
    const chapterNo = (v - 1) * CHAPTERS_PER_VOLUME + c + 1
    const name = `章${chapterNo}`
    fs.writeFileSync(path.join(root, '大纲/卷规划', `卷${String(v).padStart(2, '0')}`, '章细纲', `${String(chapterNo).padStart(4, '0')}-${name}.md`), doc(`${name}细纲`, '任务:测试推进。\n'))
    const draftDir = path.join(root, '草稿区/草稿', `卷${String(v).padStart(2, '0')}-${name}`)
    fs.mkdirSync(draftDir, { recursive: true })
    fs.writeFileSync(path.join(draftDir, '稿1.md'), `---\n角色: 草稿\n---\n# ${name}\n\n正文占位。\n`)
  }
}
fs.mkdirSync(path.join(root, '作品契约'), { recursive: true })
fs.writeFileSync(path.join(root, '作品契约/契约.md'), '---\n状态: 已确认\n---\n# 契约\n\n测试契约。\n')
for (const name of ['故事线', '人物弧线', '承诺', '线索', '时间线']) {
  fs.mkdirSync(path.join(root, '账本'), { recursive: true })
  fs.writeFileSync(path.join(root, '账本', `${name}.md`), `# ${name}\n`)
}
for (const name of ['文风', '决策', '对话', '灵感']) {
  fs.mkdirSync(path.join(root, '本书记忆'), { recursive: true })
  fs.writeFileSync(path.join(root, '本书记忆', `${name}.md`), `# ${name}\n`)
}

// ── 与 novel_get_story_status 同形的状态派生(设计面＋章节面)────────────────
const start = performance.now()
const selection = core.selectCurrentVolume(root)
const derived = core.deriveDesign(core.scanDesign(root, selection.kind === 'active' ? selection.卷 : selection.kind === 'planning' ? selection.规划卷 : 1))
const 已确认无内容 = core.listConfirmedEmpty(core.scanDesignDetail(root))
const resumable = core.listResumable(root)
const cards = resumable.map((r) => r.statusCard)
const elapsed = performance.now() - start

// ── fixture 探针(取数前必须先过,不满足即抛不出数)──────────────────────────
if (resumable.length !== TOTAL) throw new Error(`探针失败:可恢复章数 ${resumable.length} ≠ ${TOTAL}(检查章细纲文件名形状)`)
if (cards.length !== TOTAL || cards.some((c) => !c.includes('近况｜'))) throw new Error('探针失败:statusCard 缺失或形状不对')

// ── 长篇护栏:200 章状态派生须在预算内完成(默认 10s,环境变量可覆盖)──────────
const BUDGET_MS = Number(process.env.ABZU_STATUS_BUDGET_MS ?? 10_000)
const result = { chapters: resumable.length, elapsedMs: Number(elapsed.toFixed(1)), budgetMs: BUDGET_MS, ok: elapsed < BUDGET_MS, 设计建议环节: derived.建议.环节, 已确认无内容: 已确认无内容.length }
console.log(JSON.stringify(result))
if (!result.ok) {
  console.error(`长篇性能护栏失败:${TOTAL} 章状态派生 ${result.elapsedMs}ms 超预算 ${BUDGET_MS}ms`)
  process.exitCode = 1
}
fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
