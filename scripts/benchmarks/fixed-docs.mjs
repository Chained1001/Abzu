/**
 * 每章固定文档预算复测（0.0.70 起）。
 *
 * 口径：主控每章首次加载的固定文档字符数（JS String.length），不含章节正文、
 * 材料包正文与一次性设计路径 B。基线 77,283 字符来自 A 报告（0.0.68 前）。
 * 目标：≤ 基线的 80%（降幅 ≥20%）。
 *
 * 用法：node scripts/benchmarks/fixed-docs.mjs [--json]
 * 退出码：0 达标；1 超预算；2 文件缺失/读失败。
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const skills = path.join(root, 'packages', 'bundle', 'skills')
const BASELINE = 77_283
const TARGET = 0.8

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
  return { baseline: BASELINE, target: TARGET, total, reduction, rows, ok: reduction >= 1 - TARGET }
}

const result = measureFixedDocs()
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2))
} else {
  for (const row of result.rows) {
    console.log(`${row.node.padEnd(3, ' ')} ${String(row.chars).padStart(7, ' ')}  ${row.files.map((f) => `${path.basename(f.rel)}:${f.chars}`).join('  ')}`)
  }
  console.log(`合计 ${result.total} / 基线 ${result.baseline}，降幅 ${(result.reduction * 100).toFixed(1)}%（目标 ≥20%）`)
}
if (!result.ok) process.exitCode = 1
