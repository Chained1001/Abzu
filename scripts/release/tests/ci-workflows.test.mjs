import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { BaseSequencer, createVitest } from 'vitest/node'
import { root } from '../version.mjs'

const { parse } = createRequire(path.join(root, 'packages/bundle/package.json'))('yaml')
const workflow = name => parse(fs.readFileSync(path.join(root, `.github/workflows/${name}.yml`), 'utf8'))

test('both Windows runtimes keep complete, disjoint test shards and required policy checks', async () => {
  const ci = workflow('abzu-ci')
  assert.deepEqual(ci.jobs.quality.strategy.matrix.node, ['22.19.0', '24.15.0'])
  assert.deepEqual(ci.jobs.quality.strategy.matrix.shard, [1, 2])
  assert.deepEqual(ci.jobs.required.needs, ['policy', 'quality'])
  for (const job of [ci.jobs.policy, ci.jobs.quality]) assert.notEqual(job['continue-on-error'], true)
  const testStep = ci.jobs.quality.steps.find(step => step.run?.startsWith('pnpm test '))
  assert.match(testStep.run, /--shard=\$\{\{ matrix.shard \}\}\/2/)
  assert.equal(testStep.if, undefined)
  assert.notEqual(testStep['continue-on-error'], true)
  assert.ok(ci.jobs.policy.steps.some(step => step.run === 'pnpm check:public'))

  const vitest = await createVitest('test', { root, watch: false })
  try {
    const specifications = await vitest.globTestSpecifications()
    const actual = specifications.map(spec => path.resolve(spec.moduleId)).sort()
    const expected = []
    const walk = directory => {
      if (!fs.existsSync(directory)) return
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules') walk(file)
        else if (entry.isFile() && entry.name.endsWith('.spec.ts')) expected.push(file)
      }
    }
    for (const entry of fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      for (const folder of ['tests', 'src']) walk(path.join(root, 'packages', entry.name, folder))
    }
    assert.ok(expected.length > 0)
    assert.deepEqual(actual, expected.sort(), 'the root run must cover every package test')
    const shards = []
    for (const index of ci.jobs.quality.strategy.matrix.shard) {
      vitest.config.shard = { index, count: 2 }
      shards.push(await new BaseSequencer(vitest).shard(specifications))
    }
    const combined = shards.flat().map(spec => path.resolve(spec.moduleId))
    assert.equal(new Set(combined).size, combined.length, 'shards must not overlap')
    assert.deepEqual(combined.sort(), actual, 'shards must not omit tests')
  } finally { await vitest.close() }
})
