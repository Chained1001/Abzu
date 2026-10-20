import { describe, expect, it } from 'vitest'
import { emptyCandidateBody, 四固定小节, 四固定小节缺失 } from '../src/outline/template'

describe('四固定小节：模板与软校验自洽', () => {
  it('空候选模板已含四固定小节（不会一出厂就欠节）', () => {
    for (const name of 四固定小节) expect(emptyCandidateBody()).toContain(`### ${name}`)
  })
  it('模板产物不触发缺失播报', () => {
    expect(四固定小节缺失(emptyCandidateBody())).toBeNull()
  })
})
