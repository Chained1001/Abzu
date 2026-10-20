import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 排障体系跨包节号的可达性。
 *
 * 排障判据按 §x.y 连号分布，但物理上散在三个技能包：
 * - §4.x／§5.x → 《定调设计》references/大纲-* 与 卷纲-*
 * - §6.x       → 《细纲备料》references/章纲-*
 * - §8.x       → 《工作台总控》references/排障-*（8.0-8.3 索引、8.4-8.9 专项修复、8.10 长篇防崩）
 *
 * 入口 `novel-director/SKILL.md` 的「修订排障入口」段必须交代这个分布——
 * 否则读者拿着 §8.4 在索引文件里翻，什么都翻不到（这些节在另一个文件里）。
 * 本测试锁两件事：①入口交代了分布；②入口交代的归属与真实文件一致。
 */
describe('排障体系节号分布', () => {
  const skills = path.join(__dirname, '..', 'skills')
  const director = fs.readFileSync(path.join(skills, 'novel-director', 'SKILL.md'), 'utf8')
  const index = fs.readFileSync(path.join(skills, 'novel-director', 'references', '排障-索引与改稿流程.md'), 'utf8')

  /** 收集某个技能包 references 下所有 § 节号 → 文件。 */
  function collectSections(skill: string): Map<string, string> {
    const dir = path.join(skills, skill, 'references')
    const map = new Map<string, string>()
    if (!fs.existsSync(dir)) return map
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue
      for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^#{2,3}\s+§([\d.]+)/gm)) {
        if (!map.has(m[1])) map.set(m[1], f)
      }
    }
    return map
  }

  const all = new Map<string, string>()
  for (const skill of ['novel-director', 'novel-design', 'novel-outline']) {
    for (const [k, v] of collectSections(skill)) if (!all.has(k)) all.set(k, v)
  }

  it('入口交代了 §4/§5/§6/§8 各段的归属', () => {
    expect(director, '入口应交代 §4.x/§5.x 归属').toContain('§4.x/§5.x')
    expect(director, '入口应交代 §6.x 归属').toContain('§6.x')
    expect(director, '入口应交代 §8.x 归属').toContain('§8.x')
    expect(director, '应点名 §8.4-8.9 在专项修复').toContain('专项修复')
    expect(director, '应点名 §8.10 在长篇防崩').toContain('长篇防崩')
  })

  it('§8.4–§8.10 确实在入口点名的两个文件里', () => {
    expect(all.get('8.4'), '§8.4 应在排障-专项修复').toBe('排障-专项修复.md')
    expect(all.get('8.9'), '§8.9 应在排障-专项修复').toBe('排障-专项修复.md')
    expect(all.get('8.10'), '§8.10 应在排障-长篇防崩').toBe('排障-长篇防崩.md')
    // §8.0–§8.3 在索引件本身
    for (const s of ['8.0', '8.1', '8.2', '8.3']) {
      expect(all.get(s), `§${s} 应在索引件`).toBe('排障-索引与改稿流程.md')
    }
  })

  it('索引表里引用的跨包节号都能定位（不断链）', () => {
    const cited = [...new Set([...index.matchAll(/§(\d+\.\d+)(?![\d.x])/g)].map((m) => m[1]))]
    expect(cited.length, '索引应引用节号').toBeGreaterThan(0)
    // 包内未分发的编号：显式登记，避免静默断链
    const 未分发 = new Set(['4.9', '5.8'])
    const missing = cited.filter((s) => !all.has(s) && !未分发.has(s))
    expect(missing, `索引引用了包内不存在的节号：${missing.join('、')}`).toEqual([])
  })

  it('§4.11 归属与入口交代一致（特例，不在 §4 主件里）', () => {
    // 入口明写「§4.11 在《细纲备料》章纲-信息与情绪」
    expect(director).toContain('§4.11')
    expect(all.get('4.11'), '§4.11 应在 章纲-信息与情绪.md').toBe('章纲-信息与情绪.md')
  })

  it('§6.7 归属与入口交代一致（特例）', () => {
    expect(director).toContain('§6.7')
    expect(all.get('6.7'), '§6.7 应在 章纲-信息与情绪.md').toBe('章纲-信息与情绪.md')
  })
})
