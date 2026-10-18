import assert from 'node:assert/strict'
import test from 'node:test'
import { checkPublishableManifest } from '../tar.mjs'

const base = () => ({
  name: 'abzu',
  private: false,
  publishConfig: { access: 'public', tag: 'latest', registry: 'https://registry.npmjs.org/' },
  dependencies: { yaml: '^2.0.0' },
  peerDependencies: { '@deepseek-ai/cordis': '^4.0.0' },
})

test('publishable manifest: normal package passes', () => {
  assert.doesNotThrow(() => checkPublishableManifest(base()))
})

test('publishable manifest: private package rejected', () => {
  assert.throws(() => checkPublishableManifest({ ...base(), private: true }), /must not be private/)
})

test('publishable manifest: publish config must be public/latest/official registry', () => {
  const missing = base()
  delete missing.publishConfig
  assert.throws(() => checkPublishableManifest(missing))
  assert.throws(() => checkPublishableManifest({ ...base(), publishConfig: { ...base().publishConfig, access: 'restricted' } }))
  assert.throws(() => checkPublishableManifest({ ...base(), publishConfig: { ...base().publishConfig, tag: 'next' } }))
  assert.throws(() => checkPublishableManifest({ ...base(), publishConfig: { ...base().publishConfig, registry: 'https://example.invalid/' } }))
})

test('publishable manifest: lifecycle hooks rejected', () => {
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare', 'prepublishOnly', 'prepack', 'postpack', 'publish', 'postpublish']) {
    assert.throws(() => checkPublishableManifest({ ...base(), scripts: { [hook]: 'node bad.mjs' } }), new RegExp(hook))
  }
})

test('publishable manifest: workspace/file/link and @abzu runtime deps rejected', () => {
  for (const version of ['workspace:*', 'file:../x', 'link:../x', 'catalog:']) {
    assert.throws(() => checkPublishableManifest({ ...base(), dependencies: { lodash: version } }))
  }
  assert.throws(() => checkPublishableManifest({ ...base(), dependencies: { '@abzu/core': '^1.0.0' } }))
  assert.throws(() => checkPublishableManifest({ ...base(), peerDependencies: { '@abzu/core': '^1.0.0' } }))
})
