import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { LEDGER_KINDS, LEDGER_NAMES, MEMORY_KINDS, 旧记忆类别 } from '@abzu/core'
import { skillFile } from './skill-test-helpers'

/**
 * 账本/记忆类别与沉淀字段口径对撞（0.0.72 契约批）。
 *
 * 1) 类别常量（core/src/repo/paths.ts）与沉淀对账底本（novel-settle/agents/沉淀对账.md）
 *    各有一份正文。过去测试只钉散文原句，新增类别时散文不动也不红，沉淀解析器却整条拒收。
 * 2) 三分类型/账本核对/保温强化/口径四行是 v2.9-B3 并入的人工判据：写入时留在账本条目
 *    `### 正文`，脚本侧白名单不收编、不参与到期/计数。本文件把「只留正文、脚本不读」钉住，
 *    防止以后顺手结构化却没人读（或反过来：有人以为脚本会读）。
 */

const RECONCILE = skillFile('novel-settle', 'agents/沉淀对账.md')
const SETTLEMENT_SRC = path.join(__dirname, '..', '..', 'core', 'src', 'settlement', 'index.ts')
const LEDGER_SRC = path.join(__dirname, '..', '..', 'core', 'src', 'ledger', 'index.ts')

/** 中文计数词（散文写「四类」「两类」；常量数变化时计数词也必须跟着改）。 */
const 计数词 = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'] as const
function countWord(n: number): string {
  return 计数词[n] ?? String(n)
}

function read(file: string): string {
  return fs.readFileSync(file, 'utf8')
}

/** 取含指定标记的 Markdown 段落（空行分段）；找不到即失败并给出标记。 */
function paragraphContaining(text: string, needle: string): string {
  const paragraph = text.split(/\r?\n\r?\n/).find((p) => p.includes(needle))
  expect(paragraph, `沉淀对账.md 应有含「${needle}」的段落`).toBeDefined()
  return paragraph!
}

/** 从源码里抽一个「字符串字面量数组」的成员（用于核对解析器白名单）。 */
function literalMembers(source: string, pattern: RegExp, label: string): readonly string[] {
  const match = pattern.exec(source)
  expect(match, `应从 ${label} 抽到字段白名单字面量`).not.toBeNull()
  return [...match![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!)
}

describe('账本/记忆类别：代码常量 ↔ 沉淀对账散文', () => {
  it('账本四类/记忆两类的每个常量都写在散文里；新增类别不更新散文即红', () => {
    const text = read(RECONCILE)
    // 分类段落用「账本四类」作锚点（文件里还有别处提到账本，不能只按「账本」找段落）。
    const paragraph = paragraphContaining(text, '账本四类')

    expect(
      paragraph,
      `散文的分类计数词应随 LEDGER_KINDS 数量变化：现应写「账本${countWord(LEDGER_KINDS.length)}类」`,
    ).toContain(`账本${countWord(LEDGER_KINDS.length)}类`)
    for (const kind of LEDGER_KINDS) {
      expect(
        paragraph,
        `账本类别「${kind}」在 core/src/repo/paths.ts 的 LEDGER_KINDS 里，但沉淀对账.md 分类段没有逐字写出——`
        + '模型看不到新类别，永远不会产出它。',
      ).toContain(`\`${kind}\``)
    }

    expect(
      paragraph,
      `散文的记忆类别计数词应随 MEMORY_KINDS 数量变化：现应写「本书层记忆${countWord(MEMORY_KINDS.length)}类」`,
    ).toContain(`本书层记忆${countWord(MEMORY_KINDS.length)}类`)
    for (const kind of MEMORY_KINDS) {
      expect(
        paragraph,
        `记忆类别「${kind}」在 core/src/repo/paths.ts 的 MEMORY_KINDS 里，但沉淀对账.md 分类段没有逐字写出。`,
      ).toContain(`\`${kind}\``)
    }

    // 退役类别也要留在散文里（旧书仓仍可读，模型须知道不能再写）；常量改名/增删同样要改散文。
    for (const retired of 旧记忆类别) {
      expect(
        paragraph,
        `退役记忆类别「${retired}」在 core/src/repo/paths.ts 的 旧记忆类别 里，沉淀对账.md 应说明它已退役。`,
      ).toContain(retired)
    }

    // 「账本四类」之外还有一本时间线账：LEDGER_NAMES 的每个名字都应在底本出现，防止漏掉第五本账。
    for (const name of LEDGER_NAMES) {
      expect(text, `LEDGER_NAMES 的「${name}」在沉淀对账.md 里没有落点（时间线是四类之外的另一本账）。`).toContain(name)
    }
  })
})

describe('沉淀四字段口径：只留正文、脚本不读', () => {
  const 四字段 = ['口径', '三分类型', '账本核对', '保温强化'] as const

  it('底本声明在位：四行只留在条目正文供人工核对，不参与脚本到期/计数', () => {
    const text = read(RECONCILE)
    const paragraph = paragraphContaining(text, '只留在条目正文')

    for (const field of 四字段) {
      expect(paragraph, `口径段应点名四字段「${field}」`).toContain(field)
    }
    expect(paragraph, '口径段应写「人工核对」——四行是给人读的').toContain('人工核对')
    expect(paragraph, '口径段应写「脚本不读」').toContain('脚本不读')
    expect(paragraph, '口径段应写「不参与」脚本判定').toContain('不参与')
    expect(paragraph, '口径段应点名「到期」判定（线索到期查询不读这四行）').toContain('到期')
    expect(paragraph, '口径段应点名「计数」判定（统计/计数不读这四行）').toContain('计数')

    // 四行仍是输出协议的一部分：口径不是「可省字段」，只是消费边界。
    expect(text, '输出格式应保留「口径」行').toContain('- 口径：事件型 | 关系型')
    expect(text, '输出格式应保留「三分类型」行').toContain('- 三分类型：伏笔 | 契诃夫之枪 | 回响 | 未定')
    expect(text, '输出格式应保留「账本核对」行').toContain('- 账本核对：')
    expect(text, '输出格式应保留「保温强化」行').toContain('- 保温强化：第NNNN章 | 无')
  })

  it('解析器白名单未收编这四行（收编即破坏「只留正文」口径）', () => {
    const writeFields = literalMembers(
      read(SETTLEMENT_SRC),
      /const details = stripFields\(section\.body, \[([\s\S]*?)\]\)/,
      'core/src/settlement/index.ts 的 ledgerBlock',
    )
    const readFields = literalMembers(
      read(LEDGER_SRC),
      /const STRUCTURED_FIELDS = new Set\(\[([\s\S]*?)\]\)/,
      'core/src/ledger/index.ts 的 STRUCTURED_FIELDS',
    )
    // 白名单解析成功的基本核对：结构化字段至少含「状态」。
    expect(writeFields, 'settlement 写侧结构化白名单应含「状态」').toContain('状态')
    expect(readFields, 'ledger 读侧结构化白名单应含「状态」').toContain('状态')

    for (const field of 四字段) {
      expect(
        writeFields,
        `settlement 写侧白名单出现了「${field}」：这会把四行从正文提为结构化字段，`
        + '但当前没有任何读方/迁移方案，与底本「只留正文、脚本不读」的口径冲突。',
      ).not.toContain(field)
      expect(
        readFields,
        `ledger 读侧白名单出现了「${field}」：脚本会把它当结构化字段读，`
        + '但底本声明它只作人工核对；如要结构化，请同批改底本、加迁移与到期/计数测试。',
      ).not.toContain(field)
    }
  })
})
