import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseVersion, compareVersions, inspect, readBaseline, readHostVersion, check } from '../check-dsh-version.mjs'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test('parseVersion splits prerelease and rejects junk', () => {
  assert.deepEqual(parseVersion('0.2.1-rc.3'), [0, 2, 1, 'rc', 3])
  assert.deepEqual(parseVersion('0.2.1'), [0, 2, 1, '', -1])
  assert.equal(parseVersion('v0.2.1'), null)
  assert.equal(parseVersion('0.2'), null)
  assert.equal(parseVersion('latest'), null)
})

test('compareVersions orders prereleases below the same release', () => {
  assert.ok(compareVersions('0.2.1-rc.2', '0.2.1-rc.3') < 0)
  assert.ok(compareVersions('0.2.1-rc.3', '0.2.1-rc.2') > 0)
  assert.equal(compareVersions('0.2.1-rc.3', '0.2.1-rc.3'), 0)
  // 回归：早先只比到第 4 段，rc.2 与 rc.3 会被判成相等。
  assert.notEqual(compareVersions('0.2.1-rc.2', '0.2.1-rc.3'), 0)
  assert.ok(compareVersions('0.2.1-rc.3', '0.2.1') < 0, '预发布低于正式版')
  assert.ok(compareVersions('0.2.0', '0.2.1-rc.1') < 0)
  assert.ok(compareVersions('0.10.0', '0.9.9') > 0)
})

test('only a host newer than the baseline blocks', () => {
  const hostAhead = inspect({ baseline: '0.2.1-rc.2', upstream: null, host: '0.2.1-rc.3' })
  assert.equal(hostAhead.status, 'host-ahead')
  assert.equal(hostAhead.blocking, true)

  const upstreamAhead = inspect({ baseline: '0.2.1-rc.2', upstream: '0.2.1-rc.3', host: '0.2.1-rc.2' })
  assert.equal(upstreamAhead.status, 'upstream-ahead')
  assert.equal(upstreamAhead.blocking, false)
  assert.match(upstreamAhead.notes.join(''), /待办，不是故障/)

  const hostBehind = inspect({ baseline: '0.2.1-rc.3', upstream: '0.2.1-rc.3', host: '0.2.1-rc.2' })
  assert.equal(hostBehind.status, 'host-behind')
  assert.equal(hostBehind.blocking, false)

  const same = inspect({ baseline: '0.2.1-rc.3', upstream: '0.2.1-rc.3', host: '0.2.1-rc.3' })
  assert.equal(same.status, 'up-to-date')
  assert.equal(same.blocking, false)
})

test('unknown sources are reported but never block', () => {
  const noHost = inspect({ baseline: '0.2.1-rc.2', upstream: '0.2.1-rc.3', host: null })
  assert.equal(noHost.blocking, false)
  assert.match(noHost.notes.join(''), /宿主版本未知/)

  const noUpstream = inspect({ baseline: '0.2.1-rc.2', upstream: null, host: '0.2.1-rc.2' })
  assert.equal(noUpstream.blocking, false)
  assert.match(noUpstream.notes.join(''), /上游版本未知/)

  const neither = inspect({ baseline: '0.2.1-rc.2', upstream: null, host: null })
  assert.equal(neither.status, 'up-to-date')
  assert.equal(neither.blocking, false)
})

test('the real baseline is readable and well formed', () => {
  const baseline = readBaseline()
  assert.match(baseline.source.version, /^\d+\.\d+\.\d+/)
  assert.match(baseline.source.commit, /^[a-f0-9]{40}$/)
  assert.equal(baseline.source.tag, `dsh-v${baseline.source.version}`)
})

test('readHostVersion tolerates a missing runtime.json', () => {
  assert.equal(readHostVersion({}), null)
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-dsh-host-'))
  try {
    assert.equal(readHostVersion({ DSH_HOME: empty }), null)
  } finally { fs.rmdirSync(empty) }
})

test('offline check never blocks and never hits the network', async () => {
  const result = await check({ offline: true })
  assert.equal(result.upstream, null)
  assert.equal(result.blocking, false)
})
