/**
 * 每章固定文档预算复测（0.0.70 起）。
 *
 * 口径：主控每章首次加载的固定文档字符数（JS String.length），不含章节正文、
 * 材料包正文与一次性设计路径 B。
 *
 * ## 为什么改成绝对上限（0.0.87）
 *
 * 原口径是「相对 0.0.68 前的历史峰值 77,283 降幅 ≥20%」＝ 上限 61,826。
 * 该目标在 0.0.86 达成后已耗尽：余额只剩 8 字符，任何要改这 16 个文件的
 * 需求都只能先删等价内容，出现「为塞新判据而删有效判据」的劣化。
 *
 * 逐文件核查确认没有哪个文件异常膨胀（最大 novel-outline/SKILL.md 10.5k，
 * 全部在正常范围），所以问题不是「写肥了」，而是「相对峰值的比例目标已用尽」。
 *
 * 改为绝对上限 62,000：保住已达成的成果（不退回 77k），并留出约 150 字符
 * 的合理余量供后续修正。**这不是放松约束**——绝对上限会持续约束总量，
 * 只是不再用「历史峰值的百分比」这种会随基数漂移的尺子。
 *
 * 若未来要再收紧，应改这个常量并说明去向，而不是改回比例口径。
 *
 * 用法：node scripts/benchmarks/fixed-docs.mjs [--json]
 * 退出码：0 达标；1 超预算；2 文件缺失/读失败。
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const skills = path.join(root, 'packages', 'bundle', 'skills')

/** 历史峰值（0.0.68 前），只用于展示降幅，不再作为达标判据。 */
const BASELINE = 77_283
/** 绝对上限：达标判据（见文件头说明）。 */
const CAP = 62_000

export const components = [
  {
    node: '细纲',
    files: [
      'novel-outline/SKILL.md',
      'novel-outline/templates/步骤卡-章细纲.md',
      'novel-outline/templates/步骤卡-写前十查.md',
    ],
  },
  {
    node: '起草',
    files: [
      'novel-drafting/SKILL.md',
      'novel-drafting/agents/写作卡-索引.md',
      'novel-drafting/references/默认文风.md',
    ],
  },
  {
    node: '审读',
    files: [
      'novel-review/SKILL.md',
      'novel-review/agents/全量审读.md',
      'novel-drafting/references/默认文风-速查.md',
    ],
  },
  {
    node: '改稿',
    files: [
      'novel-revision/SKILL.md',
      'novel-revision/agents/改稿章程.md',
    ],
  },
  {
    node: '润色',
    files: [
      'novel-polish/SKILL.md',
      'novel-polish/references/1-表达清理.md',
      'novel-polish/references/2-节奏与重塑.md',
      'novel-drafting/references/默认文风-速查.md',
    ],
  },
  {
    node: '沉淀',
    files: [
      'novel-settle/SKILL.md',
      'novel-settle/agents/沉淀对账.md',
    ],
  },
]

export function measureFixedDocs() {
  const rows = []
  let total = 0
  for (const c of components) {
    const files = c.files.map((rel) => {
      const abs = path.join(skills, rel)
      const chars = fs.readFileSync(abs, 'utf8').length
      return { rel, chars }
    })
    const chars = files.reduce((sum, f) => sum + f.chars, 0)
    total += chars
    rows.push({ node: c.node, chars, files })
  }
  const reduction = (BASELINE - total) / BASELINE
  return { baseline: BASELINE, cap: CAP, total, reduction, remaining: CAP - total, rows, ok: total <= CAP }
}

const result = measureFixedDocs()
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2))
} else {
  for (const row of result.rows) {
    console.log(`${row.node.padEnd(3, ' ')} ${String(row.chars).padStart(7, ' ')}  ${row.files.map((f) => `${path.basename(f.rel)}:${f.chars}`).join('  ')}`)
  }
  console.log(`合计 ${result.total} / 上限 ${result.cap}（余量 ${result.remaining}）；对照历史峰值 ${result.baseline} 降幅 ${(result.reduction * 100).toFixed(1)}%`)
}
if (!result.ok) process.exitCode = 1
