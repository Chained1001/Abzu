import { describe, expect, it } from 'vitest'
import { creatorStages, inferCreatorStage } from '../src/client/stage-data'

describe('四阶段导航数据', () => {
  it('阶段顺序固定为开书→书级→卷级→章级', () => {
    expect(creatorStages.map(stage => stage.id)).toEqual(['start', 'book', 'volume', 'chapter'])
    expect(creatorStages.every(stage => stage.skills.length > 0)).toBe(true)
  })

  it('按章节数推断当前阶段', () => {
    expect(inferCreatorStage(0)).toBe('book')
    expect(inferCreatorStage(1)).toBe('chapter')
    expect(inferCreatorStage(120)).toBe('chapter')
  })
})
