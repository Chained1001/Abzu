import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { thinScripts } from './artifact-contract.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
// 四条 insert 是用户 profile 的稳定契约（设置 ns／凭据引用／禁用状态都挂在 id 上）。
assert.deepEqual(parse(fs.readFileSync(path.join(root, 'cordis.patch.yml'), 'utf8')), [
  { insert: [
    { id: 'abzu', name: manifest.name },
    { id: 'abzu-embeddings', name: `${manifest.name}/embeddings` },
    { id: 'abzu-scenes', name: `${manifest.name}/scenes` },
    { id: 'abzu-reranking', name: `${manifest.name}/reranking` },
  ] },
])
assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
for (const entry of ['.', './client', './embeddings', './scenes', './reranking']) {
  assert.ok(manifest.exports?.[entry], `Missing export declaration: ${entry}`)
}
// 薄入口自 a2038b1 起指向 lib/cli.js（只依赖 Node 内置，脱离宿主 node_modules），
// 而 CLI 函数也只能在 cli.js 里找到。这里必须查 cli.js——早先写成 index.js，
// 于是这条断言从那次重构起就一直失败，只是本地没人跑这个脚本（CI 跑，红了很久）。
const cli = fs.readFileSync(path.join(root, 'lib/cli.js'), 'utf8')
for (const [relative, name] of thinScripts) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8')
  assert.ok(text.includes('lib/cli.js'), relative)
  assert.ok(!/from\s*["']@abzu\//.test(text), relative)
  assert.ok(cli.includes(name), `${name} missing from built CLI library`)
}
console.log(`[bundle] config and ${thinScripts.length} installed script entrypoints: ok`)
