import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { format章型, 章型承诺档, 章型情绪位, 章型问题, parse章型, 派发口径 } from '../src/outline/chapter-type'

/**
 * 章型双轴：文档/工具描述与 core 枚举的一致性。
 *
 * 拆轴时踩过的两个坑（本测试锁定不再复发）：
 * 1. 工具 schema 的 description 曾写「承诺档 关键/常规，情绪位 …过渡」——与 core 的
 *    `关键/过渡` × `铺垫/高潮/余波/切换` 不符，按描述填「常规」会被 章型问题 直接拒。
 * 2. 「章纲分级」这一节名在拆轴后已改称「章型双轴」，但四处引用没跟着改，指针悬空。
 */
describe('章型双轴文档一致性', () => {
  // 技能文档在 bundle 包；core 测试须跨包读（本测试锁跨包一致性，属刻意跨包）
  const repoRoot = path.join(__dirname, '..', '..', '..')
  const skills = path.join(repoRoot, 'packages', 'bundle', 'skills')
  const walk = (d: string, acc: string[] = []): string[] => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name)
      if (e.isDirectory()) { if (e.name !== 'assets') walk(f, acc) }
      else if (e.name.endsWith('.md')) acc.push(f)
    }
    return acc
  }
  const docs = walk(skills).map((f) => [f, fs.readFileSync(f, 'utf8')] as const)

  it('工具 schema 描述里的枚举与 core 一致', () => {
    const tool = fs.readFileSync(path.join(repoRoot, 'packages', 'bundle', 'src', 'tools', 'outline-tools.ts'), 'utf8')
    const m = /章型: \{ type: 'string', description: '([^']+)'/.exec(tool)
    expect(m, '应能找到章型 schema description').not.toBeNull()
    const desc = m![1]!
    // 承诺档两值
    for (const v of 章型承诺档) expect(desc, `描述应含承诺档 ${v}`).toContain(v)
    // 情绪位四值
    for (const v of 章型情绪位) expect(desc, `描述应含情绪位 ${v}`).toContain(v)
    // 旧错值不得出现
    expect(desc, '描述不该再写「常规」').not.toContain('常规')
    // 情绪位不能重复用「过渡」——它只属于承诺档
    expect(desc, '情绪位须明确不用「过渡」').toContain('改称「切换」')
  })

  it('描述里的每个示例值都能被 parse章型 解析', () => {
    const tool = fs.readFileSync(path.join(repoRoot, 'packages', 'bundle', 'src', 'tools', 'outline-tools.ts'), 'utf8')
    const desc = /章型: \{ type: 'string', description: '([^']+)'/.exec(tool)![1]!
    const examples = [...desc.matchAll(/「([^」]+)」/g)].map((x) => x[1]!).filter((s) => s.includes('·'))
    expect(examples.length, '描述应有具体写法示例').toBeGreaterThan(0)
    for (const ex of examples) {
      expect(章型问题(ex), `示例「${ex}」应合法，实际：${章型问题(ex)}`).toBeNull()
      expect(parse章型(ex), `示例「${ex}」应可解析`).not.toBeNull()
    }
  })

  it('「章纲分级」这个旧节名不再被任何文档引用', () => {
    const hits: string[] = []
    for (const [f, text] of docs) {
      if (text.includes('章纲分级')) hits.push(path.relative(skills, f))
    }
    expect(hits, `仍引用已改名的旧节：${hits.join('、')}`).toEqual([])
  })

  it('「章型双轴」节确实存在于 novel-outline SKILL', () => {
    const sk = fs.readFileSync(path.join(skills, 'novel-outline', 'SKILL.md'), 'utf8')
    expect(sk).toContain('章型双轴')
  })

  it('引用章型放宽的文档指向的是现存节名', () => {
    const q = fs.readFileSync(path.join(skills, 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(q).toContain('章型放宽')
    expect(q, '旧节名不得残留').not.toContain('章纲分级放宽')
  })
})

describe('派发口径真的有消费方', () => {
  // 拆轴后 派发口径() 一度是死代码：全仓仅测试引用，章型落了盘却没人读它决定下游强度。
  // 现在接在 checkConfirmable 的播报里——确认时一次说清，不另造门槛。
  const repoRoot = path.join(__dirname, '..', '..', '..')

  it('checkConfirmable 调用 派发口径 并把结果播报出去', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'packages', 'core', 'src', 'outline', 'write.ts'), 'utf8')
    expect(src, 'write.ts 应 import 派发口径').toMatch(/import \{[^}]*派发口径[^}]*\} from '\.\/chapter-type'/)
    expect(src, 'checkConfirmable 应调用 派发口径').toContain('派发口径(parsed章型)')
    // 播报须含三项下游口径，缺一项就等于没接线
    expect(src, '播报应含细纲规格').toContain('口径.规格')
    expect(src, '播报应含十查强度').toContain('口径.十查')
    expect(src, '播报应含审读强度').toContain('口径.审读')
  })

  it('派发口径不再无生产调用方（排除定义与测试）', () => {
    const walk = (d: string, acc: string[] = []): string[] => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name)
        if (e.isDirectory()) { if (!/node_modules|dist/.test(e.name)) walk(f, acc) }
        else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts')) acc.push(f)
      }
      return acc
    }
    const callers = walk(path.join(repoRoot, 'packages'))
      .filter((f) => !f.endsWith(path.join('outline', 'chapter-type.ts')))
      .filter((f) => fs.readFileSync(f, 'utf8').includes('派发口径('))
    expect(callers.length, '至少应有一个生产调用方').toBeGreaterThan(0)
  })

  it('关键格·余波：简章但十查全项（旧设计漏掉的一格）', () => {
    const 关键余波 = parse章型('过渡·余波')!
    expect(关键余波.承诺).toBe('过渡')
    // 余波必须跑全项十查——它最容易犯连续钝收与泄压钩错位
    const 口径 = 派发口径(关键余波)
    expect(口径.十查, '余波也必须十查全项').toBe('全项')
    expect(口径.规格, '余波走简章').toBe('简章')
    expect(口径.须调剂式, '余波须指定调剂式').toBe(true)
    // 播报文案用 format章型 规范化输出，保证「过渡·余波」不被写成别的分隔符
    expect(format章型(关键余波), '播报应写规范形').toBe('过渡·余波')
  })
})
