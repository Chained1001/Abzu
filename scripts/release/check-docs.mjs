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

/**
 * 索引里必须出现的文档。
 *
 * 覆盖 docs/ 下全部 .md（含 adr/ 与 agents/），以及仓根的 GLOSSARY.md——它是术语的真源，
 * 漏登记就等于允许「新增一份没人能找到的文档」。ADR 也要登记：它的价值在于被人读到，
 * 只躺在目录里等于没写。
 */
export function walkDocs(root) {
  const docs = []
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { visit(full); continue }
      if (!entry.name.endsWith('.md')) continue
      docs.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }
  visit(path.join(root, 'docs'))
  if (fs.existsSync(path.join(root, 'GLOSSARY.md'))) docs.push('GLOSSARY.md')
  return docs.sort()
}

/**
 * 设计文档的状态机。只有这五个值合法，且状态行必须是 `> 状态：<枚举值>` 一行到底——
 * 后面不能跟解释。理由：状态要能被机器判定，写成「**待作者拍板 + 待 Dev 会签**。这是决策
 * 记录…」这种整句时，人和脚本都只能靠猜。解释放到正文里。
 */
export const STATUSES = ['草案', '待裁决', '已定', '实施中', '已废弃']

/** 状态行：设计文档开头的一行 `> 状态：<枚举值>`，不带任何尾随说明。 */
export function statusOf(text) {
  const match = text.match(/^>\s*状态[:：]\s*(.+)$/m)
  return match ? match[1].trim() : null
}

/** 校验状态行本身：必须是五个枚举值之一。 */
export function assertStatus(text, file) {
  const raw = statusOf(text)
  assert.ok(raw, `Design doc missing "> 状态：…" line: ${file}`)
  assert.ok(STATUSES.includes(raw),
    `Design doc has an unknown status "${raw}": ${file}\n  合法值：${STATUSES.join(' / ')}\n` +
    '  状态行只写枚举值，解释放正文——整句状态无法被机械判定。')
  return raw
}

/**
 * 设计文档的最低四段。判据是标题里出现该词（`## 1. 要解决的问题`、`### 关键取舍与不选什么` 都算），
 * 不绑定编号与层级——文档结构自由，但四段必须在。
 */
export const REQUIRED_SECTIONS = [
  { key: '要解决的问题', why: '不写现在哪里不行，就没有可验收的目标' },
  { key: '关键取舍', why: '不写否掉了什么，后来者会重走已否掉的路' },
  { key: '验收标准', why: '不写怎么算成，就没有完成判据' },
  { key: '待确认', why: '不写未决点，争议会在实施时以返工的形式出现' },
]

/**
 * 文档类型。默认是「设计方案」——必须写全四段。唯一例外是「记录」：研究报告、盘点结论
 * 这类只陈述已发生的事，不打算建成什么，硬塞「验收标准」只会逼出为了过闸而写的空话。
 *
 * 默认值选 fail-closed：新增一份文档不写类型行，就得满足四段。
 */
export const KINDS = ['设计方案', '记录']

export function kindOf(text) {
  const match = text.match(/^>\s*类型[:：]\s*(.+)$/m)
  return match ? match[1].trim() : '设计方案'
}

export function missingSections(text) {
  const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => m[1]).join('\n')
  return REQUIRED_SECTIONS.filter(section => !headings.includes(section.key))
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

/** 设计文档必须有合法状态行；设计方案还要四段下限；`已废弃` 必须指名取代者或声明结论作废。 */
export function checkDesignDocs(root) {
  const dir = path.join(root, 'docs/设计')
  if (!fs.existsSync(dir)) return { ok: true, designs: 0 }
  const designs = fs.readdirSync(dir).filter(name => name.endsWith('.md'))
  for (const name of designs) {
    const file = `docs/设计/${name}`
    const text = fs.readFileSync(path.join(dir, name), 'utf8')
    const status = assertStatus(text, file)
    const kind = kindOf(text)
    assert.ok(KINDS.includes(kind),
      `Design doc has an unknown type "${kind}": ${file}\n  合法值：${KINDS.join(' / ')}`)
    if (kind === '设计方案') {
      const missing = missingSections(text)
      assert.deepEqual(missing.map(s => s.key), [], `Design doc missing required sections: ${file}\n${
        missing.map(s => `  缺「${s.key}」——${s.why}`).join('\n')}\n` +
        `  只陈述已发生事实的文档（研究报告、盘点结论）在状态行下加一行「> 类型：记录」，可免四段。`)
    }
    // 废弃而不指出后代，等于让人无从判断该照哪份做。要么点名取代它的是谁，要么明说结论作废。
    if (status === '已废弃') {
      assert.ok(/被取代[:：]|结论作废/.test(text),
        `Design doc is 已废弃 but names no successor: ${file}\n` +
        '  必须写「被取代：<文件>」或「结论作废」，否则读者不知道该照哪份做。')
    }
  }
  return { ok: true, designs: designs.length }
}

/**
 * 文档里写死的计数必须与实际一致。只查有单一代码真源的两处：
 * 工具数（`tool-spec.ts` 的 `TOOL_SPECS`）与技能数（`packages/bundle/skills/` 的目录数）。
 *
 * 其余计数（测试文件数、行数、`export *` 处数）不查——它们天天变，查了只会逼人改文档而不是
 * 改事实。规范 §5.2 要求干脆不写这类数字。
 */
export function countsFromCode(root) {
  const spec = path.join(root, 'packages/bundle/src/tool-spec.ts')
  const counts = {}
  if (fs.existsSync(spec)) {
    const entries = [...fs.readFileSync(spec, 'utf8').matchAll(/^\s*\{\s*name:\s*'([^']+)'[^}]*register:\s*'([^']+)'/gm)]
    counts.authorTools = entries.filter(m => m[2] === 'author').length
    counts.testTools = entries.filter(m => m[2] === 'test-only').length
  }
  const skillsDir = path.join(root, 'packages/bundle/skills')
  if (fs.existsSync(skillsDir)) {
    counts.skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).length
  }
  return counts
}

/**
 * 检查文档里声明的工具数与技能数。只认明确写成「共 N 个作者可用工具」「共 N 个技能」的句子，
 * 不做模糊匹配——误报会让人绕开这条闸。
 */
export function checkCounts(root) {
  const actual = countsFromCode(root)
  const problems = []
  const patterns = [
    { name: 'authorTools', re: /共\s*(\d+)\s*个作者可用工具/g, label: '作者可用工具' },
    { name: 'skills', re: /共\s*(\d+)\s*个技能/g, label: '技能' },
  ]
  const files = []
  const visit = dir => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { visit(full); continue }
      if (entry.name.endsWith('.md')) files.push(full)
    }
  }
  visit(path.join(root, 'docs'))
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const rel = path.relative(root, file).split(path.sep).join('/')
    for (const { name, re, label } of patterns) {
      const expected = actual[name]
      if (expected === undefined) continue
      for (const match of text.matchAll(re)) {
        if (Number(match[1]) !== expected) {
          problems.push(`${rel}：写「共 ${match[1]} 个${label}」，代码里是 ${expected}`)
        }
      }
    }
  }
  assert.deepEqual(problems, [], `Documented counts disagree with code:\n${problems.map(p => `  ${p}`).join('\n')}\n` +
    '  计数由脚本现算，改代码后文档要跟着改；无法现算的计数不该写进文档（规范 §5.2）。')
  return { ok: true, ...actual }
}

/**
 * 文档里出现的 `pnpm <script>` 必须是真实存在的脚本，或 pnpm 自己的内置命令。
 *
 * 只看 `pnpm x` / `pnpm x --flag` / `pnpm --filter pkg x` 这几种可执行形式；注意 `pnpm catalog`
 * 这类中文句子里的名词短语不在此列——正则要求后面不跟中文标点与长串文字。
 *
 * 两个坑（都踩过）：
 * - `pnpm workspace` 常是名词短语（「pnpm workspace 有五个包」）而非命令，但 pnpm 确实有
 *   `pnpm workspace` 之类的位置参数语义，所以放行内置命令而不是靠猜句子。
 * - `pnpm vitest` 是真错误：`vitest` 不是脚本，得写 `pnpm exec vitest`。
 */
const PNPM_BUILTINS = new Set(['install', 'i', 'add', 'remove', 'rm', 'update', 'up', 'exec', 'dlx',
  'run', 'workspace', 'catalog', 'store', 'link', 'unlink', 'publish', 'pack', 'why', 'list', 'ls',
  'outdated', 'audit', 'prune', 'dedupe', 'import', 'rebuild', 'root', 'bin', 'setup', 'init'])

export function checkPnpmScripts(root) {
  const readScripts = rel => {
    const file = path.join(root, rel)
    if (!fs.existsSync(file)) return null
    try { return JSON.parse(fs.readFileSync(file, 'utf8')).scripts ?? {} } catch { return null }
  }
  const rootScripts = readScripts('package.json') ?? {}
  const pkgScripts = { abzu: readScripts('packages/bundle/package.json') ?? {} }
  const problems = []
  const files = []
  const visit = dir => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { visit(full); continue }
      if (entry.name.endsWith('.md')) files.push(full)
    }
  }
  visit(path.join(root, 'docs'))
  files.push(path.join(root, 'AGENTS.md'))
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const rel = path.relative(root, file).split(path.sep).join('/')
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      // `pnpm --filter <pkg> <script>`：包内脚本
      const filtered = line.match(/pnpm\s+--filter\s+(\S+)\s+([a-zA-Z][\w:-]*)/)
      if (filtered) {
        const [, pkg, script] = filtered
        const table = pkgScripts[pkg] ?? (pkg === 'abzu' ? rootScripts : null)
        if (table && !(script in table) && !PNPM_BUILTINS.has(script)) {
          problems.push(`${rel}：pnpm --filter ${pkg} ${script}（该包无此脚本）`)
        }
        continue
      }
      const plain = line.match(/pnpm\s+([a-zA-Z][\w:-]*)(?=\s|$)/)
      if (!plain) continue
      const script = plain[1]
      if (script.startsWith('-') || PNPM_BUILTINS.has(script)) continue
      if (!(script in rootScripts)) problems.push(`${rel}：pnpm ${script}（根 package.json 无此脚本）`)
    }
  }
  const unique = [...new Set(problems)]
  assert.deepEqual(unique, [], `Documented pnpm scripts do not exist:\n${unique.map(p => `  ${p}`).join('\n')}\n` +
    '  确实要跑某个可执行文件时写 `pnpm exec <bin>`；内置命令（install / add / exec 等）不在此检查范围。')
  return { ok: true, scripts: Object.keys(rootScripts).length }
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
  const counts = checkCounts(root)
  const scripts = checkPnpmScripts(root)
  const violations = checkContracts(root, options)
  assert.deepEqual(violations, [], `Contract signals changed without matching docs:\n${violations.map(v => `  ${v.signal} → ${v.docs.join(' 或 ')}（${v.why}）`).join('\n')}`)
  return { ok: true, registered: index.registered, designs: design.designs, scripts: scripts.scripts, ...counts }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
  const base = process.argv.find(arg => arg.startsWith('--base='))?.slice('--base='.length) ?? 'HEAD'
  console.log(JSON.stringify(checkTree(root, { base })))
}
