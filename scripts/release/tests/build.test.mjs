import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  assertPackageVersion, checksumFile, parseReleaseArgs, planAssets, readPackedManifest,
  releaseManifestFile, releaseNotesFile, runVerification, verificationSteps, writeReleaseIndex,
} from '../build.mjs'

const info = { packageName: 'abzu', version: '0.0.72' }
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')

test('release build verifies tests by default and only skips them explicitly', () => {
  assert.deepEqual(verificationSteps(parseReleaseArgs([])), [['test:release'], ['check:version']])
  assert.deepEqual(verificationSteps(parseReleaseArgs(['--skip-tests'])), [])
  assert.deepEqual(parseReleaseArgs(['--source', 'public', '--packages', 'packs', '--out', 'out', '--skip-tests']),
    { source: 'public', packages: 'packs', out: 'out', skipTests: true })
  assert.equal(parseReleaseArgs([]).skipTests, false)
  assert.throws(() => parseReleaseArgs(['--out']), /--out requires a value/)
  assert.throws(() => parseReleaseArgs(['--out', '--skip-tests']), /--out requires a value/)
  const calls = []
  runVerification(parseReleaseArgs([]), args => calls.push(args))
  assert.deepEqual(calls, [['test:release'], ['check:version']])
  calls.length = 0
  runVerification(parseReleaseArgs(['--skip-tests']), args => calls.push(args))
  assert.deepEqual(calls, [])
})

test('release notes are an asset that is written before the manifest and checksums', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-release-index-'))
  const tarball = 'abzu-0.0.72.tgz'
  const source = 'abzu-0.0.72-source.tar.gz'
  try {
    fs.writeFileSync(path.join(output, tarball), 'tarball')
    fs.writeFileSync(path.join(output, source), 'source archive')
    const writes = []
    const result = writeReleaseIndex(output, {
      payloadFiles: [source, tarball],
      manifest: { schemaVersion: 1, ...info },
      notes: '# 0.0.72\n',
      onWrite: file => writes.push(file),
    })
    assert.deepEqual(writes, [releaseNotesFile, releaseManifestFile, checksumFile], 'notes must be written before the manifest that hashes them')
    assert.deepEqual(result.manifest.assets.map(asset => asset.file), [source, tarball, releaseNotesFile].sort())
    for (const asset of result.manifest.assets) {
      assert.equal(asset.sha256, digest(path.join(output, asset.file)), `manifest hash mismatch for ${asset.file}`)
    }
    const sums = new Map()
    for (const line of fs.readFileSync(path.join(output, checksumFile), 'utf8').trim().split('\n')) {
      const [sha256, file] = line.split('  ')
      assert.ok(!sums.has(file), `duplicate checksum entry: ${file}`)
      sums.set(file, sha256)
    }
    assert.deepEqual([...sums.keys()].sort(), [source, tarball, releaseNotesFile, releaseManifestFile].sort())
    assert.equal(sums.get(releaseNotesFile), digest(path.join(output, releaseNotesFile)))
    assert.equal(sums.get(releaseManifestFile), digest(path.join(output, releaseManifestFile)))
    assert.equal(sums.has(checksumFile), false, 'SHA256SUMS never lists itself')
  } finally { fs.rmSync(output, { recursive: true, force: true }) }
})

test('asset planning rejects payloads that already claim generated metadata', () => {
  assert.deepEqual(planAssets(['b.tgz', 'a.tgz']), {
    assets: ['a.tgz', 'b.tgz', releaseNotesFile],
    checksummed: ['a.tgz', 'b.tgz', releaseManifestFile, releaseNotesFile],
  })
  assert.throws(() => planAssets([]), /must not be empty/)
  assert.throws(() => planAssets([releaseManifestFile]), /already contains generated file/)
  assert.throws(() => planAssets(['dir/a.tgz']), /bare filename/)
})

test('prebuilt packages are rejected when their own name or version differs', () => {
  const read = value => () => value
  assert.equal(assertPackageVersion('abzu-0.0.72.tgz', info, read({ name: 'abzu', version: '0.0.72' })).version, '0.0.72')
  assert.throws(() => assertPackageVersion('abzu-0.0.72.tgz', info, read({ name: 'abzu', version: '0.0.71' })),
    /version 0\.0\.71 does not match 0\.0\.72/)
  assert.throws(() => assertPackageVersion('abzu-0.0.72.tgz', info, read({ name: 'another', version: '0.0.72' })),
    /name another does not match abzu/)
})

test('an unreadable prebuilt tarball fails with an explicit tar error', () => {
  assert.throws(() => readPackedManifest('missing.tgz', () => { throw new Error('tar: command not found') }),
    /Cannot read package\/package\.json from missing\.tgz with tar -xOf: tar: command not found/)
  assert.throws(() => readPackedManifest('broken.tgz', () => 'not json'), /Invalid package\/package\.json in broken\.tgz/)
})

test('package manifest is read from a real tarball with the platform tar', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-release-tar-'))
  const directory = path.join(root, 'package')
  const tarball = path.join(root, 'abzu-0.0.72.tgz')
  try {
    fs.mkdirSync(directory)
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: info.packageName, version: info.version }))
    execFileSync('tar', ['-czf', tarball, '-C', root, 'package'], { windowsHide: true })
    assert.equal(readPackedManifest(tarball).version, info.version)
    assert.equal(assertPackageVersion(tarball, info).name, info.packageName)
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
