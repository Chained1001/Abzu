import { afterAll, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  activeChapterLine,
  assembleMaterials,
  preparePack,
  readBookMemoryCatalog,
  renderMemoryCatalog,
  renderStatusCard,
  serializeDocument,
  writeFileAtomic,
} from '../src/index'
import { makeFixtureBook } from './helpers/fixture-book'
import { removeSync } from '../src/repo/remove'

/**
 * 0.0.50 兼容要求：本书记忆收窄为 文风/决策 两类后，带旧四类文件
 * （旧格式一类一文件 文风/决策/对话/灵感.md ＋ 类为对话的条目文件）的已有书仓
 * 必须仍能正常选书近况、读状态、备料、定稿组包——不报错、不迁移、不改写用户文件。
 */

const roots: string[] = []
afterAll(() => { for (const root of roots) removeSync(root) })
function mkDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  roots.push(dir)
  return dir
}

function legacyMemoryBook(chapters: number): string {
  const root = mkDir('abzu-legacy-mem-')
  makeFixtureBook(root, chapters)
  fs.mkdirSync(path.join(root, '本书记忆'), { recursive: true })
  // 旧格式一类一文件（0.0.50 前建的书仓四类全在，无 frontmatter 类字段）
  writeFileAtomic(root, '本书记忆/文风.md', '# 文风\n\n## 旧文风条\n状态：已确认\n短句，画面先行。\n')
  writeFileAtomic(root, '本书记忆/决策.md', '# 决策\n\n## 旧决策条\n状态：已确认\n主角前十章不入内城。\n')
  writeFileAtomic(root, '本书记忆/对话.md', '# 对话\n\n## 旧对话条\n状态：已确认\n主角语气：少解释。\n')
  writeFileAtomic(root, '本书记忆/灵感.md', '# 灵感\n\n## 旧灵感条\n状态：已确认\n铜符可在卷末回响。\n')
  // 旧格式条目文件（类为已退役的对话）
  writeFileAtomic(root, '本书记忆/主角语气.md', '---\n名称: 主角语气\n类: 对话\n状态: 已确认\n来源: 定稿/卷01/0001-章1.md\n裁决记录: 作者批准\n---\n遇险时避免长篇解释。\n')
  writeFileAtomic(root, '本书记忆/索引.md', [
    '# 本书记忆索引', '',
    '- [旧文风条](文风.md) — 类：文风｜来源：对谈',
    '- [旧决策条](决策.md) — 类：决策｜来源：对谈',
    '- [旧对话条](对话.md) — 类：对话｜来源：对谈',
    '- [旧灵感条](灵感.md) — 类：灵感｜来源：对谈',
    '- [主角语气](主角语气.md) — 类：对话｜来源：定稿/卷01/0001-章1.md',
    '',
  ].join('\n'))
  return root
}

describe('0.0.50 旧四类本书记忆书仓兼容（选书近况/状态/备料/组包不报错，用户文件不动）', () => {
  it('旧格式四类文件与退役类别条目并存时，近况、状态、备料、定稿组包全部可用', () => {
    const root = legacyMemoryBook(3)
    const key = { 卷: 1, 章: 2, 章名: '章2' } as const

    // 选书附带的本书记忆目录：旧四类文件照常列出（只读，不报错）
    const catalog = readBookMemoryCatalog(root)
    expect(catalog.状态).toBe('正常')
    expect(catalog.条目.map((e) => e.名称).sort()).toEqual(['主角语气', '决策', '文风', '对话', '灵感'].sort())
    expect(renderMemoryCatalog(catalog, '选书时')).toContain('- 对话（旧格式文件，一类一文件）｜文件：本书记忆/对话.md')
    expect(renderMemoryCatalog(catalog, '选书时')).toContain('- 主角语气 — （缺描述）｜类：对话')

    // 近况（选书结果附带的行）与状态卡（读状态）
    const line = activeChapterLine(root)
    expect(line.ok, JSON.stringify(line)).toBe(true)
    const card = renderStatusCard(root, key)
    expect(card).toContain('本书记忆：2 条')

    // 备料
    const materials = assembleMaterials(root, key)
    expect(materials.ok, JSON.stringify(materials)).toBe(true)

    // 定稿组包：造一份唯一待审稿后组装占位候选包
    const draftRel = '草稿区/草稿/卷01-章3/稿1.md'
    writeFileAtomic(root, draftRel, serializeDocument({ 角色: '待审稿', 版本: 1, 生成模块: '写稿' }, '主角继续前行，铜符仍在袖中。'))
    const pack = preparePack(root, { 卷: 1, 章: 3, 章名: '章3' }, {})
    expect(pack.ok, JSON.stringify(pack)).toBe(true)

    // 用户文件未被改写/删除：旧四类文件与退役条目原样在盘
    for (const rel of ['本书记忆/对话.md', '本书记忆/灵感.md', '本书记忆/主角语气.md']) {
      expect(fs.existsSync(path.join(root, rel)), `${rel} 应原样保留`).toBe(true)
    }
    expect(fs.readFileSync(path.join(root, '本书记忆/对话.md'), 'utf8')).toContain('旧对话条')
  })
})
