import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkIndex, checkDesignDocs, statusOf, assertStatus, STATUSES, checkContracts, CONTRACTS, walkDocs, baseAvailable, changedFiles, countsFromCode, checkCounts, checkPnpmScripts } from '../check-docs.mjs'

const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-docs-'))
const cleanup = root => {
  const remove = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name)
      if (entry.isDirectory()) remove(target)
      else fs.unlinkSync(target)
    }
    fs.rmdirSync(dir)
  }
  remove(root)
}

const write = (root, file, text) => {
  const full = path.join(root, file)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, text)
}

test('index must register every doc and reject broken links', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '[t](技术文档.md)')
    write(root, 'docs/技术文档.md', '# 技术文档')
    checkIndex(root)
    // 新增一份没登记的文档 → 拦
    write(root, 'docs/产品文档.md', '# 产品文档')
    assert.throws(() => checkIndex(root), /not registered/)
    // 登记后放行
    write(root, 'docs/README.md', '[t](技术文档.md) [p](产品文档.md)')
    checkIndex(root)
    // 死链 → 拦
    write(root, 'docs/README.md', '[t](技术文档.md) [p](产品文档.md) [x](missing.md)')
    assert.throws(() => checkIndex(root), /Broken index link/)
  } finally { cleanup(root) }
})

test('index must not reach outside docs and the two root entries', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '[x](../packages/secret.md)')
    write(root, 'packages/secret.md', '# secret')
    assert.throws(() => checkIndex(root), /escapes docs/)
  } finally { cleanup(root) }
})

test('design docs must carry a valid status from the fixed set', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    const four = '## 1. 要解决的问题\n## 2. 关键取舍与不选什么\n## 3. 验收标准\n## 4. 待确认\n'
    write(root, 'docs/设计/有状态.md', `# x\n\n> 状态：待裁决\n\n${four}`)
    assert.equal(checkDesignDocs(root).designs, 1)
    assert.equal(statusOf('> 状态：实施中'), '实施中')
    write(root, 'docs/设计/无状态.md', `# y\n\n${four}`)
    assert.throws(() => checkDesignDocs(root), /missing "> 状态/)
  } finally { cleanup(root) }
})

test('a free-text status must be rejected', () => {
  // 回归：早先只校验「有没有 `> 状态：`」，于是「**待作者拍板 + 待 Dev 会签**。这是决策记录…」
  // 这种整句也能过。实测 10 份文档用了 9 种自由词，其中四种指同一件事。
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    const four = '## 1. 要解决的问题\n## 2. 关键取舍与不选什么\n## 3. 验收标准\n## 4. 待确认\n'
    write(root, 'docs/设计/整句式.md', `# x\n\n> 状态：**待作者拍板 + 待 Dev 会签**。这是决策记录。\n\n${four}`)
    assert.throws(() => checkDesignDocs(root), /unknown status/)
  } finally { cleanup(root) }
})

test('statusOf accepts both colon widths and requires a blockquote', () => {
  assert.equal(statusOf('> 状态：实施中'), '实施中')
  assert.equal(statusOf('> 状态: 实施中'), '实施中')
  assert.equal(statusOf('状态：实施中'), null, '不带 > 不算状态行')
  assert.equal(statusOf('正文里提到状态：xx'), null)
})

test('every status in the set is accepted and nothing else is', () => {
  for (const status of STATUSES) {
    const root = scratch()
    try {
      write(root, 'docs/README.md', '')
      const four = '## 1. 要解决的问题\n## 2. 关键取舍与不选什么\n## 3. 验收标准\n## 4. 待确认\n'
      const successor = status === '已废弃' ? '\n被取代：另一份。\n' : ''
      write(root, 'docs/设计/a.md', `# x\n\n> 状态：${status}\n\n${four}${successor}`)
      assert.equal(checkDesignDocs(root).designs, 1, `${status} 应当合法`)
    } finally { cleanup(root) }
  }
  assert.throws(() => assertStatus('> 状态：待作者审查', 'x'), /unknown status/)
})

test('design plans must carry all four sections; 记录 is exempt', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    // 缺「关键取舍」→ 拦
    write(root, 'docs/设计/缺段.md', '# x\n\n> 状态：草案\n\n## 要解决的问题\n## 验收标准\n## 待确认\n')
    assert.throws(() => checkDesignDocs(root), /missing required sections/)
    // 标为「记录」后免四段——研究报告/盘点结论不打算建成什么，硬塞验收标准只会写出空话
    write(root, 'docs/设计/缺段.md', '# x\n\n> 状态：已定\n> 类型：记录\n\n## 结论\n')
    assert.equal(checkDesignDocs(root).designs, 1)
  } finally { cleanup(root) }
})

test('已废弃 must name a successor or declare the conclusion void', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    const four = '## 1. 要解决的问题\n## 2. 关键取舍与不选什么\n## 3. 验收标准\n## 4. 待确认\n'
    write(root, 'docs/设计/无后代.md', `# x\n\n> 状态：已废弃\n\n${four}`)
    assert.throws(() => checkDesignDocs(root), /names no successor/)
    // 换成指名取代者的版本——必须把上一份删掉，否则它仍在目录里、仍会报错
    fs.unlinkSync(path.join(root, 'docs/设计/无后代.md'))
    write(root, 'docs/设计/有后代.md', `# x\n\n> 状态：已废弃\n\n被取代：另一份。\n\n${four}`)
    assert.equal(checkDesignDocs(root).designs, 1)
    // 「结论作废」是另一种合法写法：没有后代，但明确说了别照它做
    write(root, 'docs/设计/有后代.md', `# x\n\n> 状态：已废弃\n\n结论作废，不再有后续方案。\n\n${four}`)
    assert.equal(checkDesignDocs(root).designs, 1)
  } finally { cleanup(root) }
})

test('walkDocs covers adr, agents and the root glossary', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    write(root, 'docs/adr/0001-x.md', '# adr')
    write(root, 'docs/agents/domain.md', '# d')
    write(root, 'docs/设计/a.md', '# a')
    write(root, 'docs/note.txt', 'x')
    write(root, 'GLOSSARY.md', '# g')
    // 回归：早先显式跳过 adr，于是新增 ADR 可以永远不进索引，等于允许「没人能找到的文档」。
    assert.deepEqual(walkDocs(root), ['GLOSSARY.md', 'docs/README.md', 'docs/adr/0001-x.md', 'docs/agents/domain.md', 'docs/设计/a.md'])
  } finally { cleanup(root) }
})

test('documented tool and skill counts must match the code', () => {
  const root = scratch()
  try {
    write(root, 'packages/bundle/src/tool-spec.ts',
      "export const TOOL_SPECS = [\n  { name: 'a', register: 'author' },\n  { name: 'b', register: 'author' },\n  { name: 't', register: 'test-only' },\n]\n")
    write(root, 'packages/bundle/skills/novel-a/SKILL.md', '# a')
    write(root, 'packages/bundle/skills/novel-b/SKILL.md', '# b')
    assert.equal(countsFromCode(root).authorTools, 2)
    assert.equal(countsFromCode(root).skills, 2)
    write(root, 'docs/README.md', '')
    write(root, 'docs/x.md', '共 2 个作者可用工具，共 2 个技能。')
    assert.equal(checkCounts(root).ok, true)
    // 计数写错 → 拦。回归：技术文档曾长期写 31，实际 32。
    write(root, 'docs/x.md', '共 31 个作者可用工具。')
    assert.throws(() => checkCounts(root), /disagree with code/)
  } finally { cleanup(root) }
})

test('documented pnpm scripts must exist, and pnpm builtins are allowed', () => {
  const root = scratch()
  try {
    write(root, 'package.json', JSON.stringify({ scripts: { test: 'vitest run', 'check:docs': 'node x.mjs' } }))
    write(root, 'docs/README.md', '')
    write(root, 'docs/ok.md', '跑 `pnpm test` 和 `pnpm check:docs`，先 `pnpm install`。')
    assert.equal(checkPnpmScripts(root).ok, true)
    // 回归：技术设计里写过 `pnpm vitest run`——vitest 不是脚本，得写 `pnpm exec vitest`。
    write(root, 'docs/bad.md', '跑 `pnpm vitest run`。')
    assert.throws(() => checkPnpmScripts(root), /do not exist/)
    // 名词短语不该被当成命令
    write(root, 'docs/bad.md', '依赖版本已收敛 pnpm catalog（四组单源）。')
    assert.equal(checkPnpmScripts(root).ok, true)
  } finally { cleanup(root) }
})

test('contract signal requires its paired doc in the same batch', () => {
  // 不用 git：直接喂 only，只验配对逻辑。
  const signal = CONTRACTS[0].signal
  const violations = checkContracts(process.cwd(), { only: [signal] })
  assert.equal(violations.length, 1)
  assert.equal(violations[0].signal, signal)
  assert.deepEqual(violations[0].docs, CONTRACTS[0].docs)
  // 同批带上配对文档 → 放行
  assert.deepEqual(checkContracts(process.cwd(), { only: [signal, CONTRACTS[0].docs[0]] }), [])
  // 无关文件 → 放行
  assert.deepEqual(checkContracts(process.cwd(), { only: ['packages/polish/src/checks.ts'] }), [])
})

test('an unrelated docs edit must not satisfy the pairing', () => {
  // 回归：早先的实现用「动了任意 docs/ 文件」作放行条件，改一份无关笔记就能绕过闸。
  const signal = CONTRACTS[0].signal
  const unrelatedDoc = 'docs/设计/某份无关笔记.md'
  assert.notEqual(CONTRACTS[0].docs[0], unrelatedDoc)
  const violations = checkContracts(process.cwd(), { only: [signal, unrelatedDoc] })
  assert.equal(violations.length, 1, '无关 docs 改动不应放行')
})

test('every contract row names a real signal file and a real paired doc', () => {
  const root = path.resolve(import.meta.dirname, '../../..')
  for (const contract of CONTRACTS) {
    assert.ok(fs.existsSync(path.join(root, contract.signal)), `signal file missing: ${contract.signal}`)
    for (const doc of contract.docs) assert.ok(fs.existsSync(path.join(root, doc)), `paired doc missing: ${doc}`)
    assert.ok(contract.why.length > 0, `contract row needs a why: ${contract.signal}`)
  }
})

test('baseAvailable rejects zero SHAs and unknown refs', () => {
  const root = path.resolve(import.meta.dirname, '../../..')
  assert.equal(baseAvailable(root, '0000000000000000000000000000000000000000'), false)
  assert.equal(baseAvailable(root, ''), false)
  assert.equal(baseAvailable(root, undefined), false)
  assert.equal(baseAvailable(root, 'no-such-ref-abc123'), false)
  assert.equal(baseAvailable(root, 'HEAD'), true)
})

test('changedFiles survives an unusable base instead of throwing', () => {
  const root = path.resolve(import.meta.dirname, '../../..')
  // 回归：首次 push 时 github.event.before 是全零 SHA，早先会让 git 报
  // fatal: bad object 并让检查直接崩掉，而不是退化成「只查索引完整性」。
  const files = changedFiles(root, '0000000000000000000000000000000000000000')
  assert.ok(files instanceof Set)
  assert.doesNotThrow(() => changedFiles(root, 'no-such-ref-abc123'))
})

test('the real repository passes the docs gate', () => {
  const root = path.resolve(import.meta.dirname, '../../..')
  const index = checkIndex(root)
  assert.ok(index.registered > 0)
  const design = checkDesignDocs(root)
  assert.ok(design.designs > 0)
})
