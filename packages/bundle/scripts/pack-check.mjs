/** Inspect the actual tarball; never substitute the source files list for release evidence. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { isBuiltin } from 'node:module'
import { build } from 'esbuild'
import { parse } from 'yaml'
import { skills as skillNames, referenceDocs, thinScripts } from './artifact-contract.mjs'
import { packageFiles, checkPublishableManifest } from '../../../scripts/release/tar.mjs'

const packageRoot = fileURLToPath(new URL('../', import.meta.url))
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-pack-'))
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
for (const script of scripts) assert.match(read(script), /new URL\(['"]\.\.\/\.\.\/\.\.\/lib\/index\.js['"], import\.meta\.url\)/)
for (const entry of entries) {
  const rel = entry.slice('package/'.length)
  assert.ok(/^(package\.json|README\.md|THIRD_PARTY_NOTICES\.md|MODEL_DIMENSIONS\.md|licenses\/[^/]+\.txt|LICENSE|cordis\.patch\.yml|lib\/(index|client|embeddings|scenes|reranking)\.js|skills\/[\w-]+\/.+\.(md|mjs))$/.test(rel), `Unexpected release file: ${rel}`)
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
const report = { package: manifest.name, version: manifest.version, tarball, sha256: createHash('sha256').update(fs.readFileSync(tarball)).digest('hex'), files: entries.length, skills: skillNames.length, scripts: scripts.length, ok: true }
fs.writeFileSync(path.join(temp, 'report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ ...report, report: path.join(temp, 'report.json') }, null, 2))
