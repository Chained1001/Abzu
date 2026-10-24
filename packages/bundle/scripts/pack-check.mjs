/** Inspect the actual tarball; never substitute the source files list for release evidence. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { isBuiltin } from 'node:module'
import { build } from 'esbuild'
import { parse } from 'yaml'
import { skills as skillNames, referenceDocs, thinScripts } from './artifact-contract.mjs'
import { packageFiles, checkPublishableManifest } from '../../../scripts/release/tar.mjs'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
// 解包目录建在系统临时区：无论校验通过还是中途抛错，都在 finally 里删掉，避免每次运行漏一份完整产物。
// pack-check 只做校验、不留档；需要留档产物请走 pnpm release:build 的落盘输出。
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-pack-'))
try {
  const run = (exe, args, cwd = temp) => execFileSync(exe, args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 })
  let tarball = process.argv[2] && path.resolve(process.argv[2])
  if (!tarball) {
    assert.ok(process.env.npm_execpath, 'Run via pnpm pack-check, or pass an existing tarball')
    run(process.execPath, [process.env.npm_execpath, 'pack', '--pack-destination', temp], packageRoot)
    const packed = fs.readdirSync(temp).filter(name => name.endsWith('.tgz'))
    assert.equal(packed.length, 1)
    tarball = path.join(temp, packed[0])
  }
  // Validate all archive metadata before materializing regular files. No tar links or PAX global overrides.
  const extracted = path.join(temp, 'package')
  const packedFiles = packageFiles(tarball)
  for (const [relative, data] of packedFiles) {
    const target = path.join(extracted, ...relative.split('/'))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, data)
  }
  const entries = [...packedFiles.keys()].map(file => `package/${file}`)
  const read = relative => fs.readFileSync(path.join(extracted, relative), 'utf8')
  const manifest = JSON.parse(read('package.json'))
  assert.equal(manifest.name, 'abzu')
  checkPublishableManifest(manifest)
  assert.equal(manifest.license, 'GPL-3.0-only')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  for (const [subpath, entry] of [['.', './lib/index.js'], ['./client', './lib/client.js'], ['./embeddings', './lib/embeddings.js'],
    ['./scenes', './lib/scenes.js'], ['./reranking', './lib/reranking.js']]) {
    assert.equal(manifest.exports?.[subpath], entry, `Missing export: ${subpath}`)
  }
  // 四条 insert 与宿主四入口一一对应；id 逐字沿用四包时代取值，迁移零成本。
  assert.deepEqual(parse(read('cordis.patch.yml')), [{ insert: [
    { id: 'abzu', name: manifest.name },
    { id: 'abzu-embeddings', name: `${manifest.name}/embeddings` },
    { id: 'abzu-scenes', name: `${manifest.name}/scenes` },
    { id: 'abzu-reranking', name: `${manifest.name}/reranking` },
  ] }])
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(manifest.scripts?.[hook], undefined)
  for (const [name, version] of Object.entries({ ...manifest.dependencies, ...manifest.peerDependencies })) {
    assert.ok(!name.startsWith('@abzu/'), `Unpublished runtime dependency: ${name}`)
    assert.ok(!/^(workspace:|file:|link:)/.test(version), `Local runtime dependency: ${name}`)
  }
  const scripts = thinScripts.map(([file]) => file)
  assert.deepEqual(fs.readdirSync(path.join(extracted, 'skills')).sort(), [...skillNames].sort())
  for (const skill of skillNames) {
    const text = read(`skills/${skill}/SKILL.md`)
    assert.equal(parse(text.split('---')[1]).name, skill)
  }
  const expectedPrompts = [...skillNames.map(skill => `skills/${skill}/SKILL.md`), ...referenceDocs].sort()
  assert.deepEqual([...packedFiles.keys()].filter(file => file.startsWith('skills/') && file.endsWith('.md')).sort(), expectedPrompts)
  for (const reference of referenceDocs) assert.ok(read(reference).trim(), `Empty dispatch reference: ${reference}`)
  // 薄入口接脚本运行库 lib/cli.js（只依赖 Node 内置）；宿主面 lib/index.js 留着
  // external 交给宿主，普通 Node 进程跑到它会 Cannot find package。
  for (const script of scripts) assert.match(read(script), /new URL\(['"]\.\.\/\.\.\/\.\.\/lib\/cli\.js['"], import\.meta\.url\)/)
  for (const entry of entries) {
    const rel = entry.slice('package/'.length)
    assert.ok(/^(package\.json|README\.md|THIRD_PARTY_NOTICES\.md|MODEL_DIMENSIONS\.md|licenses\/[^/]+\.txt|LICENSE|cordis\.patch\.yml|lib\/(index|cli|client|embeddings|scenes|reranking)\.js|skills\/[\w-]+\/.+\.(md|mjs))$/.test(rel), `Unexpected release file: ${rel}`)
    const text = read(rel)
    assert.ok(!text.includes(path.resolve(packageRoot, '../..')), `Workspace path embedded in ${rel}`)
    assert.ok(!/-----BEGIN .*PRIVATE KEY-----|sk-[A-Za-z0-9]{24,}/.test(text), `Credential in ${rel}`)
    if (!rel.endsWith('.md')) assert.ok(!/file:\/\/[A-Za-z/]*:|[A-Z]:[\\/]wk[\\/]/.test(text), `Local runtime path in ${rel}`)
  }
  assert.ok(read('LICENSE').includes('GNU GENERAL PUBLIC LICENSE'))
  assert.ok(read('THIRD_PARTY_NOTICES.md').includes('Original notices'))
  assert.ok(entries.some(entry => entry.startsWith('package/licenses/')))
  assert.ok(read('README.md').includes('--from-default-profile web'))
  assert.ok(read('MODEL_DIMENSIONS.md').includes('常用向量模型维度表'))
  assert.ok(read('lib/client.js').includes(`id: ${JSON.stringify(manifest.name)}`))
  // 每个宿主入口都自包含：除已声明 peers 与 Node 内置外不得再引外部模块。
  for (const entry of ['index', 'embeddings', 'scenes', 'reranking']) {
    const compiled = await build({ entryPoints: [path.join(extracted, `lib/${entry}.js`)], bundle: true, packages: 'external', write: false, metafile: true, platform: 'node', format: 'esm', logLevel: 'silent' })
    const imports = [...new Set(Object.values(compiled.metafile.outputs).flatMap(output => output.imports).map(item => item.path))]
    for (const name of imports) assert.ok(isBuiltin(name) || manifest.peerDependencies?.[name] || manifest.dependencies?.[name], `Undeclared packed import in lib/${entry}.js: ${name}`)
    assert.equal(Object.keys(compiled.metafile.inputs).length, 1, `Packed lib/${entry}.js must be self-contained apart from declared peers`)
  }
  // client 是浏览器侧 CJS 产物（banner 里包 window.__ModuleLoader__.load 的 factory），包内 type:module 会让
  // esbuild 把它当 ESM，复打包判定等于空转；所以直接查产物文本：不得残留相对引用，裸引用必须是内置或已声明依赖。
  const clientText = read('lib/client.js')
  const relativeUse = /(?:require|import)\s*\(\s*["']\.{1,2}\/|from\s*["']\.{1,2}\//.exec(clientText)
  assert.ok(relativeUse === null, `Packed lib/client.js keeps a relative reference: ${relativeUse?.[0] ?? ''}`)
  for (const match of clientText.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    const name = match[1]
    assert.ok(isBuiltin(name) || manifest.peerDependencies?.[name] || manifest.dependencies?.[name], `Undeclared packed import in lib/client.js: ${name}`)
  }
  // 脚本运行库 lib/cli.js 的要求比宿主入口更严：**只准用 Node 内置**。技能薄入口是按
  // `node <resourceBase>/scripts/…` 直跑的，那时没有宿主 node_modules，任何裸引用都是运行期崩溃。
  // 8.3.1 上游修的就是这一类；这里既查静态引用，也真在解包目录里跑一次薄入口。
  {
    const compiled = await build({ entryPoints: [path.join(extracted, 'lib/cli.js')], bundle: true, packages: 'external', write: false, metafile: true, platform: 'node', format: 'esm', logLevel: 'silent' })
    const imports = [...new Set(Object.values(compiled.metafile.outputs).flatMap(output => output.imports).map(item => item.path))]
    for (const name of imports) assert.ok(isBuiltin(name), `Packed lib/cli.js must depend on Node builtins only, got: ${name}`)
    assert.equal(Object.keys(compiled.metafile.inputs).length, 1, 'Packed lib/cli.js must be self-contained')
  }
  // 真跑一次：解包目录就是宿主外的最小现场（没有 node_modules），最贴近装完之后的实际情况。
  for (const script of scripts) {
    const probe = spawnSync(process.execPath, [path.join(extracted, script), '--book', path.join(extracted, '__pack_check_no_book__')], { encoding: 'utf8', timeout: 60_000, cwd: extracted })
    assert.ok(!/Cannot find (package|module)|ERR_MODULE_NOT_FOUND/.test(`${probe.stdout}${probe.stderr}`), `Packed thin entry cannot start outside a host: ${script}\n${`${probe.stdout}${probe.stderr}`.slice(0, 400)}`)
  }
  // tarballEphemeral 指向的解包目录在返回前就被删掉,不是可以再取用的位置;留档产物请用 release:build 的落盘输出。
  const report = { package: manifest.name, version: manifest.version, tarballEphemeral: tarball, sha256: createHash('sha256').update(fs.readFileSync(tarball)).digest('hex'), files: entries.length, skills: skillNames.length, scripts: scripts.length, ok: true }
  console.log(JSON.stringify({ ...report, note: '临时解包目录已清理;需要留档产物请用 pnpm release:build' }, null, 2))
} finally {
  // 清理失败不应掩盖真正的校验结果：解包目录可重建，不值得把一次通过变成失败。
  try {
    fs.rmSync(temp, { recursive: true, force: true })
  } catch { /* best effort */ }
}
