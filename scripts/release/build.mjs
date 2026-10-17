import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { root as toolingRoot, releaseVersion } from './version.mjs'
import { checkTree } from './check-public-tree.mjs'

export const releaseNotesFile = 'release-notes.md'
export const releaseManifestFile = 'release-manifest.json'
export const checksumFile = 'SHA256SUMS'

/** Parse the release CLI before any filesystem work so tests can exercise the switches. */
export function parseReleaseArgs(argv) {
  const value = flag => {
    const index = argv.indexOf(flag)
    if (index < 0) return undefined
    const next = argv[index + 1]
    assert.ok(next !== undefined && !next.startsWith('--'), `${flag} requires a value`)
    return next
  }
  return {
    source: value('--source'),
    packages: value('--packages'),
    out: value('--out'),
    skipTests: argv.includes('--skip-tests'),
  }
}

/**
 * Commands that must pass before any release artifact is produced.
 * `--skip-tests` is the only way to opt out, and it is always explicit.
 */
export function verificationSteps({ skipTests = false } = {}) {
  if (skipTests) return []
  return [['test:release'], ['check:version']]
}

/** Run the preflight commands through the caller's pnpm runner; returns what was run. */
export function runVerification(options, run) {
  const steps = verificationSteps(options)
  for (const args of steps) run(args)
  return steps
}

/**
 * Payload files are the tarball(s) the build produced; generated metadata is appended here.
 * Notes are an asset in their own right and must be covered by the manifest and checksums.
 */
export function planAssets(payloadFiles) {
  assert.ok(Array.isArray(payloadFiles) && payloadFiles.length > 0, 'Release payload must not be empty')
  const generated = new Set([releaseNotesFile, releaseManifestFile, checksumFile])
  const payload = payloadFiles.map(file => {
    assert.equal(typeof file, 'string', 'Release payload file names must be strings')
    const name = path.basename(file)
    assert.equal(name, file, `Release payload must be a bare filename: ${file}`)
    assert.ok(!generated.has(name), `Release payload already contains generated file: ${name}`)
    return name
  })
  assert.equal(new Set(payload).size, payload.length, 'Release payload file names must be unique')
  const assets = [...payload, releaseNotesFile].sort()
  return { assets, checksummed: [...assets, releaseManifestFile].sort() }
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

/**
 * Write the release index in dependency order: notes first, then the manifest and checksum file
 * that cover them. Writing notes afterwards used to leave the release notes unchecksummed.
 * `onWrite` is an observation hook for callers/tests that need the order.
 */
export function writeReleaseIndex(output, { payloadFiles, manifest, notes, onWrite = () => {} }) {
  assert.ok(fs.statSync(output).isDirectory(), `Release output is not a directory: ${output}`)
  const write = (file, data) => {
    fs.writeFileSync(path.join(output, file), data)
    onWrite(file)
  }
  const { assets, checksummed } = planAssets(payloadFiles)
  write(releaseNotesFile, notes)
  const hashOf = file => sha256(path.join(output, file))
  const complete = { ...manifest, assets: assets.map(file => ({ file, sha256: hashOf(file) })) }
  write(releaseManifestFile, JSON.stringify(complete, null, 2) + '\n')
  write(checksumFile, checksummed.map(file => `${hashOf(file)}  ${file}`).join('\n') + '\n')
  return { manifest: complete, assets, checksummed }
}

function tarExtract(args) {
  return execFileSync('tar', args, { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 })
}

/** Read package/package.json from a tgz through the platform tar, without extracting to disk. */
export function readPackedManifest(tarball, extract = tarExtract) {
  let text
  try {
    text = extract(['-xOf', tarball, 'package/package.json'])
  } catch (error) {
    throw new Error(`Cannot read package/package.json from ${tarball} with tar -xOf: ${error.message}`)
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid package/package.json in ${tarball}: ${error.message}`)
  }
}

/** A prebuilt tarball is usable only when its own manifest names this exact release. */
export function assertPackageVersion(tarball, info, read = readPackedManifest) {
  const packed = read(tarball)
  assert.equal(packed.name, info.packageName, `Prebuilt package name ${packed.name} does not match ${info.packageName}: ${tarball}`)
  assert.equal(packed.version, info.version, `Prebuilt package version ${packed.version} does not match ${info.version}: ${tarball}`)
  return packed
}

function main() {
  const options = parseReleaseArgs(process.argv.slice(2))
  const root = options.source ? path.resolve(options.source) : toolingRoot
  const originalPackages = options.packages ? path.resolve(options.packages) : undefined
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true }).trim()
  const info = releaseVersion(root, process.env.RELEASE_TAG)
  assert.equal(git(['status', '--porcelain']), '', 'Release source checkout must be clean')
  if (options.source) {
    assert.ok(process.env.RELEASE_TAG, '--source requires RELEASE_TAG')
    assert.equal(git(['rev-parse', 'HEAD']), git(['rev-parse', `${info.tag}^{commit}`]), 'Source must match the immutable release tag')
    checkTree(root)
  }
  // checkTree validation happens in CI workflow after export; development repo may contain internal tools
  assert.ok(process.env.npm_execpath, 'Run via pnpm release:build')
  const pnpm = (args, cwd = root) => execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, stdio: 'inherit', windowsHide: true })
  const output = options.out ? path.resolve(options.out) : path.join(root, '.tmp', 'release', info.version)
  assert.ok(!fs.existsSync(output) || fs.readdirSync(output).length === 0, 'Release output must be empty; never overwrite a version')
  if (options.skipTests) console.warn('Skipping release tests because --skip-tests was given')
  runVerification(options, pnpm)
  fs.mkdirSync(output, { recursive: true })
  const pack = (directory, filename) => {
    if (!originalPackages) return pnpm(['pack', '--pack-destination', output], path.join(root, directory))
    const original = path.join(originalPackages, filename)
    assert.ok(fs.existsSync(original), `Original package is missing: ${original}`)
    assert.ok(fs.lstatSync(original).isFile(), 'Original package must be a regular file')
    fs.copyFileSync(original, path.join(output, filename), fs.constants.COPYFILE_EXCL)
    // 预打包路径最容易把旧 tgz 按新版本号上传：复制后读包内清单，版本/名字必须与本次发布一致。
    assertPackageVersion(path.join(output, filename), info)
  }
  pnpm(['build'])
  assert.equal(git(['status', '--porcelain']), '', 'Build changed tracked notices or metadata; commit them before release')
  pack('packages/bundle', info.filename)
  const tarball = path.join(output, info.filename)
  pnpm(['--filter', info.packageName, 'pack-check', tarball])
  const source = `abzu-${info.version}-source.tar.gz`
  git(['archive', '--format=tar.gz', '--prefix=abzu-source/', `--output=${path.join(output, source)}`, 'HEAD'])
  const payloadFiles = fs.readdirSync(output).filter(file => fs.statSync(path.join(output, file)).isFile()).sort()
  const manifestBase = { schemaVersion: 1, ...info, publicCommit: git(['rev-parse', 'HEAD']), node: process.version,
    pnpm: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).packageManager.split('@').pop(),
    dsh: JSON.parse(fs.readFileSync(path.join(root, 'packages/bundle/dsh-baseline.json'), 'utf8')).registry.version }
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8')
  const notes = changelog.slice(changelog.indexOf(`## [${info.version}]`)).split(/\n## \[/)[0]
    + `\n\n校验与安装：${releaseNotesFile} 与全部资产均列入 ${checksumFile}，清单见 ${releaseManifestFile}；参阅仓库 docs/技术文档.md「构建与安装」节。\n`
  // 发行说明先落盘、再进清单与校验和：它本身就是 release asset，不能是唯一没有校验和的附件。
  const { manifest } = writeReleaseIndex(output, { payloadFiles, manifest: manifestBase, notes })
  console.log(JSON.stringify({ ok: true, output, version: info.version, publicCommit: manifest.publicCommit, assets: manifest.assets.length }))
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main()
