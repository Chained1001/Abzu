/**
 * 工具身份表的三向 join 测试。
 *
 * 这张表（`src/tool-spec.ts`）存在的理由，是把原先散在六个 module 里的「工具身份」
 * 收成一行。但它本身也是字面量，所以必须有一条测试证明**表与真实注册面、与 core 的
 * 回执名单、与展示侧两份投影**彼此一致——否则只是把重复挪了个地方。
 *
 * 每条断言各自对撞一个消费方；删掉任何一条都等于放掉一个方向的漂移。
 */
import { describe, expect, it } from 'vitest'
import { 写入类工具 } from '@abzu/core'
import { TOOL_SPECS, specOf, toolNamesOf } from '../src/tool-spec'
import { NOVEL_TEST_TOOL_NAMES, NOVEL_TOOL_NAMES, createNovelTools } from '../src/novel-tools'
import { REFERENCE_TOOL_NAMES } from '../src/reference/tools'
import { novelToolTitles } from '../src/client/tool-result'
import { toolStages, workflowStages } from '../src/study/workflow-types'
import { nativeWriteStub } from './fixtures/native-write-stub'

/** 只用于取名，不触达文件系统；工具工厂不执行任何 IO。 */
const deps = (testTools: boolean) => ({
  workspaceRoot: () => undefined,
  bookRootOfBookId: () => undefined,
  nativeWrite: nativeWriteStub,
  testTools,
})

const 作者名 = TOOL_SPECS.filter((s) => s.register === 'author').map((s) => s.name)

describe('tool-spec：工具身份唯一事实来源', () => {
  it('表序即注册序：表里每一行都真的注册出一个同名工具', () => {
    const registered = createNovelTools(deps(true)).map((t) => t.name)
    expect(registered).toEqual(TOOL_SPECS.map((s) => s.name))
  })

  it('表里没有重复行', () => {
    const names = TOOL_SPECS.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('作者名单是对表的投影，且不含测试专用工具', () => {
    expect(NOVEL_TOOL_NAMES).toEqual(作者名)
    expect(NOVEL_TEST_TOOL_NAMES).toEqual(toolNamesOf('test-only'))
    for (const name of NOVEL_TEST_TOOL_NAMES) expect(NOVEL_TOOL_NAMES).not.toContain(name)
  })

  it('表覆盖参考书四件，因此名单拼接已消失', () => {
    for (const name of REFERENCE_TOOL_NAMES) expect(specOf(name)).toBeDefined()
    // 参考四件的锁在 workspace，不在 bookRoot；这一条钉住它们没被误标成书锁。
    for (const name of REFERENCE_TOOL_NAMES) expect(specOf(name)!.lock).toBe('workspace')
  })

  it('core 的回执名单与 receipt 标记逐项一致', () => {
    // core 为保持纯函数与独立性仍自存一份名单（见 derive/receipt.ts 注释），
    // 这条断言就是那份名单与表的对撞点：任一边改了都会在这里红。
    const 表内回执 = TOOL_SPECS.filter((s) => s.receipt).map((s) => s.name).sort()
    expect(表内回执).toEqual([...写入类工具].sort())
  })

  it('展示侧投影的键集合与表一致，且阶段值只取自 workflowStages', () => {
    // novelToolTitles / toolStages 由 Object.fromEntries 对 TOOL_SPECS 投影而来，
    // 「等于表」的断言恒真，故不再保留（原先 tool-result.spec 那条已删）。
    // 留下两条结构性检查：键不漏（length 对得上）、阶段值是合法 id。
    expect(Object.keys(novelToolTitles)).toHaveLength(作者名.length)
    expect(Object.keys(toolStages)).toHaveLength(TOOL_SPECS.filter((s) => s.stage !== null).length)
    const 合法阶段 = new Set<string>(workflowStages.map((s) => s.id))
    for (const stage of Object.values(toolStages)) expect(合法阶段.has(stage)).toBe(true)
  })

  it('designIdempotence 只落在异步锁工具上', () => {
    // 今日两者同集。这不是约束，是记录现状：若将来出现「要异步写但不查重」的工具，
    // 这条会红，提醒把两个概念真的分开写，而不是把断言删掉。
    for (const spec of TOOL_SPECS) {
      expect(spec.designIdempotence).toBe(spec.lock === 'book-async')
    }
  })
})
