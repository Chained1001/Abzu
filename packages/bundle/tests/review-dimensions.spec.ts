import { beforeAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { getCheck, listChecks, registerDefaultChecks, resetChecks } from '@abzu/review'
import { skillFile } from './skill-test-helpers'

/**
 * 审读维度/返回节点对撞（0.0.72 契约批）。
 *
 * 背景：审读维度原有 9 维，代码侧注册表（review/src/checks.ts 的 审读模块元）与技能侧
 * 底本（novel-review/agents/全量审读.md frontmatter 的 模块名）各有一份清单，测试只钉
 * 「9 维」字符串。新增第 10 维时注册表会自动多一项，但底本不派发、SKILL 仍写 9 维，
 * 没有任何测试会红。本文件把两份清单做成双向对撞：任何一侧单方面加维度都失败。
 *
 * 代码侧没有「单维清单」导出，只有 listChecks() 的注册结果；因此单维底本按 frontmatter
 * 的 模块名 映射到同名注册模块（文件名＝模块名，SKILL 派发表据此找底本）。
 */

const AGENTS_DIR = skillFile('novel-review', 'agents')
const SWEEP_FILE = path.join(AGENTS_DIR, '全量审读.md')
const REVIEW_SKILL = skillFile('novel-review', 'SKILL.md')

/**
 * 注册表里不是「审读维度」的三个模块——不在全量审读 frontmatter 里，属于已登记的例外：
 * - 文本规范检查／设定与时序核对：确定性代码检查，由 scripts/确定性检查.mjs 产出、主控回写；
 * - 作者意见：作者亲自回写发现项的通道，不参与自动审读。
 * 每个例外都必须在 novel-review/SKILL.md 有落点（下方测试会核对），防止「例外名单」变成
 * 藏新维度的后门。
 */
const NON_DIMENSION_MODULES: ReadonlyMap<string, string> = new Map([
  ['文本规范检查', '确定性代码检查（确定性检查.mjs 产出，主控回写）'],
  ['设定与时序核对', '确定性代码检查（确定性检查.mjs 产出，主控回写）'],
  ['作者意见', '作者亲自回写通道（SKILL 作者介入节）'],
])

/** 十份审读底本共用的建议返回节点六值集合（单源在 novel-review/SKILL.md 处置三列表）。 */
const 六值返回节点 = ['润色', '改稿', '细纲', '备料', '沉淀（账本更正）', '吃书补偿呈报'] as const

function read(file: string): string {
  return fs.readFileSync(file, 'utf8')
}

/** 取 Markdown 首个 frontmatter 的 `键: 值` 行（本仓技能 frontmatter 只有单行标量）。 */
function frontmatterOf(text: string): Readonly<Record<string, string>> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (match === null) return {}
  const fields: Record<string, string> = {}
  for (const line of match[1]!.split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at <= 0) continue
    fields[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return fields
}

function modulesOf(text: string, label: string): readonly string[] {
  const value = frontmatterOf(text)['模块名']
  expect(value, `${label}: frontmatter 应有「模块名」`).toBeDefined()
  const modules = value!.split(',').map((s) => s.trim()).filter((s) => s !== '')
  expect(modules.length, `${label}: 「模块名」不应为空`).toBeGreaterThan(0)
  return modules
}

/** agents 目录下全部「*审读.md」（全量审读＋九份单维底本）。 */
function reviewAgentFiles(): readonly string[] {
  return fs.readdirSync(AGENTS_DIR).filter((file) => file.endsWith('审读.md')).sort()
}

describe('审读维度对撞（registry ↔ 审读底本）', () => {
  beforeAll(() => {
    resetChecks()
    registerDefaultChecks()
  })

  it('listChecks 的每个模块都能在底本/SKILL 找到落点——新增第 10 维不得静默', () => {
    const sweepModules = modulesOf(read(SWEEP_FILE), 'agents/全量审读.md')
    const semanticChecks = listChecks().filter((c) => c.执行形态 === '隔离子 Agent').map((c) => c.名称)

    expect(semanticChecks.length, '注册表应至少注册一个隔离子 Agent 审读模块').toBeGreaterThan(0)
    expect(
      new Set(semanticChecks),
      `注册表的隔离子 Agent 模块与 agents/全量审读.md frontmatter 模块名不一致：`
      + `代码侧 ${JSON.stringify(semanticChecks)} vs 底本侧 ${JSON.stringify(sweepModules)}。`
      + '新增/删除维度必须同时改 review/src/checks.ts 与全量审读 frontmatter（并补单维底本）。',
    ).toEqual(new Set(sweepModules))

    // 全量覆盖：listChecks 全集 ⊆（全量审读 frontmatter ∪ 三个已登记非维度模块）
    const documented = new Set<string>([...sweepModules, ...NON_DIMENSION_MODULES.keys()])
    const undocumented = listChecks().map((c) => c.名称).filter((name) => !documented.has(name))
    expect(
      undocumented,
      `注册表出现既不在全量审读 frontmatter、也不在已登记非维度例外里的模块：${JSON.stringify(undocumented)}。`
      + '若这是新审读维度，请补 agents/全量审读.md frontmatter 与单维底本；若是新的非维度模块，请补 NON_DIMENSION_MODULES 并写清落点。',
    ).toEqual([])

    const skill = read(REVIEW_SKILL)
    for (const [name, why] of NON_DIMENSION_MODULES) {
      expect(getCheck(name), `非维度例外「${name}」应仍在注册表（${why}）`).toBeDefined()
      expect(skill, `非维度例外「${name}」应在 novel-review/SKILL.md 有落点（${why}）`).toContain(name)
    }
  })

  it('每份单维审读底本的 frontmatter 模块名都能对应代码注册模块', () => {
    const sweepModules = modulesOf(read(SWEEP_FILE), 'agents/全量审读.md')
    const files = reviewAgentFiles().filter((file) => file !== '全量审读.md')

    expect(
      files.length,
      `单维底本数应与全量审读 frontmatter 的模块数一致：实得 ${files.length} 份底本 vs ${sweepModules.length} 个模块`,
    ).toBe(sweepModules.length)

    const seen: string[] = []
    for (const file of files) {
      const label = `agents/${file}`
      const modules = modulesOf(read(path.join(AGENTS_DIR, file)), label)
      expect(modules.length, `${label}: 单维底本 frontmatter 应恰有一个模块名`).toBe(1)
      const module = modules[0]!

      expect(
        path.basename(file, '.md'),
        `${label}: 文件名应与模块名同名（novel-review/SKILL.md 派发表靠「文件名与回写用的模块名同名」找底本）`,
      ).toBe(module)
      expect(sweepModules, `${label}: 模块名未进 agents/全量审读.md frontmatter，默认全量派发会漏掉它`).toContain(module)

      const check = getCheck(module)
      expect(check, `${label}: 代码注册表没有同名模块——底本可派发，但 novel_record_review_findings 无模块可落`).toBeDefined()
      expect(check!.执行形态, `${label}: 同名注册模块的执行形态应为「隔离子 Agent」`).toBe('隔离子 Agent')
      expect(check!.skill, `${label}: 注册模块应指向同名 skill（底本文件名）`).toBe(module)
      seen.push(module)
    }

    expect(new Set(seen), '九份单维底本的模块集合应等于全量审读 frontmatter 集合').toEqual(new Set(sweepModules))
  })

  it('每份审读底本的建议返回节点都在六值集合内（表外值不改产品语义，交主代理裁决）', () => {
    const files = reviewAgentFiles()
    // 当前为全量审读＋九份单维底本；数目从 frontmatter 派生，新增维度时自动纳入本断言。
    expect(
      files.length,
      'agents 目录应为「全量审读＋每个维度一份单维底本」',
    ).toBe(modulesOf(read(SWEEP_FILE), 'agents/全量审读.md').length + 1)

    const enumByFile = new Map<string, readonly string[]>()
    for (const file of files) {
      const label = `agents/${file}`
      const line = read(path.join(AGENTS_DIR, file))
        .split(/\r?\n/)
        .find((l) => /^\|\s*建议返回节点\s*\|/.test(l))
      expect(line, `${label}: 发现项字段表应有「| 建议返回节点 |」行`).toBeDefined()

      const values = line!.split('|')[2]!.split('/').map((s) => s.trim()).filter((s) => s !== '')
      expect(values.length, `${label}: 「建议返回节点」枚举不应为空`).toBeGreaterThan(0)
      for (const value of values) {
        expect(
          六值返回节点,
          `${label}: 表外值「${value}」不在六值集合 ${JSON.stringify(六值返回节点)} 内。`
          + '按本批约定不改产品语义，请列入报告交主代理裁决。',
        ).toContain(value)
      }
      enumByFile.set(file, values)
    }

    // 全量审读是九维合并章程，必须给全六值；单维可以是子集。
    expect(
      new Set(enumByFile.get('全量审读.md')),
      'agents/全量审读.md 的建议返回节点应恰为六值（主控按它归并）',
    ).toEqual(new Set(六值返回节点))
  })
})
