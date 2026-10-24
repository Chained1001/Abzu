import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

export const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
function markdownUnder(directory, relative) {
  const absolute = path.join(directory, relative)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(entry => {
    const child = `${relative}/${entry.name}`
    if (entry.isDirectory()) return markdownUnder(directory, child)
    return entry.name.endsWith('.md') ? [child] : []
  })
}
export function releaseVersion(directory = root, tag) {
  const bundle = JSON.parse(fs.readFileSync(path.join(directory, 'packages/bundle/package.json'), 'utf8'))
  const workspace = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
  assert.match(bundle.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
  assert.equal(workspace.version, bundle.version, 'Workspace and main release version must agree')
  assert.equal(bundle.name, 'abzu')
  const expectedTag = `abzu-v${bundle.version}`
  if (tag) assert.equal(tag, expectedTag, 'Release tag must match the package version')
  const changelog = fs.readFileSync(path.join(directory, 'CHANGELOG.md'), 'utf8')
  assert.ok(changelog.includes(`## [${bundle.version}]`), 'Missing versioned changelog entry')
  const documents = ['README.md', 'packages/bundle/README.md', ...markdownUnder(directory, 'docs')]
  for (const file of documents) {
    const text = fs.readFileSync(path.join(directory, file), 'utf8')
    for (const match of text.matchAll(/abzu-([\d][\w.-]*)\.tgz/g)) {
      assert.equal(match[1], bundle.version, `Stale installation example in ${file}`)
    }
    for (const match of text.matchAll(/releases\/tag\/abzu-v([\d][\w.-]*)/g)) {
      assert.equal(match[1], bundle.version, `Stale download link in ${file}`)
    }
    for (const match of text.matchAll(/abzu@(\d+[\w.-]*)/g)) {
      assert.equal(match[1], bundle.version, `Stale registry installation example in ${file}`)
    }
  }
  const skillPin = path.join(directory, 'packages/bundle/tests/skills-batches.spec.ts')
  if (fs.existsSync(skillPin)) {
    const text = fs.readFileSync(skillPin, 'utf8')
    // 版本纪律组必须从 bundle/package.json 读版本再比对，不得写死字面量——
    // 写死的话每次升版都要手改测试，而它守的是「四处版本一致」这个性质，不是某个具体版本。
    assert.ok(
      text.includes('const version = bundlePkg.version'),
      'skills-batches version discipline group must derive the version from bundle/package.json',
    )
  }
  return { version: bundle.version, tag: expectedTag, prerelease: bundle.version.includes('-'),
    packageName: bundle.name, filename: `abzu-${bundle.version}.tgz` }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(releaseVersion(root, process.env.RELEASE_TAG), null, 2))
}
