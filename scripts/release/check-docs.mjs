/**
 * 文档索引与契约耦合检查。
 *
 * 两件事：
 * 1. **索引完整性**：docs/ 下每份 .md 都在 docs/README.md 里出现，索引里的链接都能解析到
 *    真实文件；设计文档还要有一行 `> 状态：…`。
 * 2. **契约耦合**：改了契约信号文件时，同批必须动对应的文档。这是「先写文档再改代码」的闸。
 *
 * 为什么不用 git hooks：仓库明文无版本化 hooks（工程规范 §1.7），闸只能挂在命令上。
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const INDEX = 'docs/README.md'

/** 索引里必须出现的文档。产品/技术/标准三类是现状文档，设计类是方案文档。 */
export function walkDocs(root) {
  const docs = []
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { if (entry.name !== 'adr') visit(full); continue }
      if (!entry.name.endsWith('.md')) continue
      docs.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }
  visit(path.join(root, 'docs'))
  return docs.sort()
}

/** 状态行：设计文档开头的一行 `> 状态：…`。 */
export function statusOf(text) {
  const match = text.match(/^>\s*状态[:：]\s*(.+)$/m)
  return match ? match[1].trim() : null
}

export function checkIndex(root) {
  const index = path.join(root, INDEX)
  assert.ok(fs.existsSync(index), `Missing documentation index: ${INDEX}`)
  const text = fs.readFileSync(index, 'utf8')
  // 索引只登记正文文档；索引自身、ADR 与 agents 之外的设计文档都在正文里逐份列出。
  const registered = new Set()
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue
    const resolved = path.resolve(path.dirname(index), decodeURIComponent(target))
    assert.ok(resolved.startsWith(path.join(root, 'docs') + path.sep) || resolved === path.join(root, 'AGENTS.md') || resolved === path.join(root, 'GLOSSARY.md') || resolved === root + path.sep,
      `Index link escapes docs: ${target}`)
    assert.ok(fs.existsSync(resolved), `Broken index link: ${target}`)
    if (resolved.endsWith('.md')) registered.add(path.relative(root, resolved).split(path.sep).join('/'))
  }
  const missing = walkDocs(root).filter(file => file !== INDEX && !registered.has(file))
  assert.deepEqual(missing, [], `Documents not registered in ${INDEX}: ${missing.join('、')}`)
  return { ok: true, registered: registered.size }
}

/** 设计文档必须有状态行；四段下限由作者自查，脚本只校验能机械判定的那部分。 */
export function checkDesignDocs(root) {
  const dir = path.join(root, 'docs/设计')
  if (!fs.existsSync(dir)) return { ok: true, designs: 0 }
  const designs = fs.readdirSync(dir).filter(name => name.endsWith('.md'))
  for (const name of designs) {
    const text = fs.readFileSync(path.join(dir, name), 'utf8')
    assert.ok(statusOf(text), `Design doc missing "> 状态：…" line: docs/设计/${name}`)
  }
  return { ok: true, designs: designs.length }
}

/**
 * 契约信号 ⟹ 配套文档。改左侧任一文件，同批必须动右侧之一。
 * 配对表刻意显式（不是「任何契约文件 ⟹ 任何文档」），否则误报会让人绕开闸。
 */
export const CONTRACTS = [
  {
    signal: 'packages/bundle/src/tool-spec.ts',
    docs: ['docs/技术文档.md'],
    why: '工具身份表变了，技术文档 §3 的工具清单要跟着变',
  },
  {
    signal: 'packages/core/src/repo/paths.ts',
    docs: ['docs/标准/书仓格式.md'],
    why: '书仓路径变了，书仓格式要跟着变',
  },
  {
    signal: 'packages/core/src/repo/read.ts',
    docs: ['docs/标准/工程规范.md'],
    why: '读侧 Result 形状变了，错误处理分域契约要跟着变',
  },
  {
    signal: 'packages/core/src/repo/frontmatter.ts',
    docs: ['docs/标准/工程规范.md'],
    why: '读侧 Result 形状变了，错误处理分域契约要跟着变',
  },
]

/** 各包公共导出面变了 ⟹ 技术文档。用「index.ts 的具名导出行」判定，避免整文件任何改动都触发。 */
export const EXPORT_INDEXES = ['packages/core/src/index.ts', 'packages/bundle/src/index.ts',
  'packages/drafting/src/index.ts', 'packages/polish/src/index.ts', 'packages/review/src/index.ts']
const NAMED_EXPORT = /^\s*export\s*\{/m

/** git 引用是否可用。首次 push 的 `before` 是全零 SHA，branch 也可能是 unborn。 */
export function baseAvailable(root, base) {
  if (!base || /^0+$/.test(base)) return false
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${base}^{commit}`], { cwd: root, stdio: 'ignore', windowsHide: true })
    return true
  } catch { return false }
}

export function changedFiles(root, base = 'HEAD') {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true })
  // 工作区相对 base 的改动：已跟踪的用 diff，新增的用 ls-files --others。
  const tracked = baseAvailable(root, base) ? git(['diff', '--name-only', base]).split('\n').filter(Boolean) : []
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
  return new Set([...tracked, ...untracked])
}

export function changedExportSurface(root, base, file) {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true })
  let before = ''
  try { before = git(['show', `${base}:${file}`]) } catch { return true } // 新增文件算改变
  const after = fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : ''
  const surface = text => [...text.matchAll(/export\s*\{([^}]*)\}/g)].flatMap(m => m[1].split(',')).map(s => s.trim()).filter(Boolean)
  return surface(before).sort().join('\n') !== surface(after).sort().join('\n') || NAMED_EXPORT.test(before) !== NAMED_EXPORT.test(after)
}

/**
 * 契约耦合检查。返回违规列表而不是直接 throw，好让调用方决定是拦还是只报警。
 * @param {string} root 仓库根
 * @param {{base?: string, only?: string[]}} options `only` 允许只查指定文件（测试用）
 */
export function checkContracts(root, { base = 'HEAD', only } = {}) {
  const changed = only ? new Set(only) : changedFiles(root, base)
  const violations = []
  // 只认配对表里点名的文档，不认「动了任意 docs 文件」。后者会让改一份无关笔记就绕过闸。
  for (const contract of CONTRACTS) {
    if (!changed.has(contract.signal)) continue
    if (contract.docs.some(doc => changed.has(doc))) continue
    violations.push({ signal: contract.signal, docs: contract.docs, why: contract.why })
  }
  const EXPORT_DOC = 'docs/技术文档.md'
  for (const file of EXPORT_INDEXES) {
    if (!changed.has(file)) continue
    if (!changedExportSurface(root, base, file)) continue
    if (changed.has(EXPORT_DOC)) continue
    violations.push({ signal: file, docs: [EXPORT_DOC], why: '包公共导出面变了，技术文档要跟着变' })
  }
  return violations
}

export function checkTree(root, options = {}) {
  const index = checkIndex(root)
  const design = checkDesignDocs(root)
  const violations = checkContracts(root, options)
  assert.deepEqual(violations, [], `Contract signals changed without matching docs:\n${violations.map(v => `  ${v.signal} → ${v.docs.join(' 或 ')}（${v.why}）`).join('\n')}`)
  return { ok: true, registered: index.registered, designs: design.designs }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
  const base = process.argv.find(arg => arg.startsWith('--base='))?.slice('--base='.length) ?? 'HEAD'
  console.log(JSON.stringify(checkTree(root, { base })))
}
