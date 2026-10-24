import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkIndex, checkDesignDocs, statusOf, checkContracts, CONTRACTS, walkDocs, baseAvailable, changedFiles } from '../check-docs.mjs'

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

test('design docs must carry a status line', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    write(root, 'docs/设计/有状态.md', '# x\n\n> 状态：**待拍板**。理由。\n')
    assert.equal(checkDesignDocs(root).designs, 1)
    assert.equal(statusOf('> 状态：**待拍板**。理由。'), '**待拍板**。理由。')
    write(root, 'docs/设计/无状态.md', '# y\n\n正文。\n')
    assert.throws(() => checkDesignDocs(root), /missing "> 状态/)
  } finally { cleanup(root) }
})

test('statusOf accepts both colon widths and requires a blockquote', () => {
  assert.equal(statusOf('> 状态：实施中'), '实施中')
  assert.equal(statusOf('> 状态: 实施中'), '实施中')
  assert.equal(statusOf('状态：实施中'), null, '不带 > 不算状态行')
  assert.equal(statusOf('正文里提到状态：xx'), null)
})

test('walkDocs skips adr and non-markdown', () => {
  const root = scratch()
  try {
    write(root, 'docs/README.md', '')
    write(root, 'docs/adr/0001-x.md', '# adr')
    write(root, 'docs/设计/a.md', '# a')
    write(root, 'docs/note.txt', 'x')
    assert.deepEqual(walkDocs(root), ['docs/README.md', 'docs/设计/a.md'])
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
