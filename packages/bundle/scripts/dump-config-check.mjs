import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { thinScripts } from './artifact-contract.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
// 五条 insert 是用户 profile 的稳定契约（设置 ns／凭据引用／禁用状态都挂在 id 上）。
assert.deepEqual(parse(fs.readFileSync(path.join(root, 'cordis.patch.yml'), 'utf8')), [
  { insert: [
    { id: 'abzu', name: manifest.name },
    { id: 'abzu-embeddings', name: `${manifest.name}/embeddings` },
    { id: 'abzu-scenes', name: `${manifest.name}/scenes` },
    { id: 'abzu-reranking', name: `${manifest.name}/reranking` },
    { id: 'abzu-companion', name: `${manifest.name}/companion` },
  ] },
])
assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
for (const entry of ['.', './client', './embeddings', './scenes', './reranking', './companion']) {
  assert.ok(manifest.exports?.[entry], `Missing export declaration: ${entry}`)
}
const lib = fs.readFileSync(path.join(root, 'lib/index.js'), 'utf8')
for (const [relative, name] of thinScripts) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8')
  assert.ok(text.includes('lib/index.js'), relative)
  assert.ok(!/from\s*["']@abzu\//.test(text), relative)
  assert.ok(lib.includes(name), `${name} missing from built library`)
}
console.log(`[bundle] config and ${thinScripts.length} installed script entrypoints: ok`)
