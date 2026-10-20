import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { ChapterView } from '../src/study/types'
import { creatorStages, inferCreatorStage } from '../src/client/stage-data'
import { deriveStageHealth } from '../src/client/stage-health'

type Chapter = ChapterView['chapters'][number]

const chapter = (number: number, patch: Partial<Chapter> = {}): Chapter => ({
  volume: 1, chapter: number, title: `第${number}章`, status: '审读', ...patch,
})

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

describe('阶段地图与代码事实对齐（A 案：降级为纯导航）', () => {
  const map = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-director', 'references', '阶段地图.md'),
    'utf8',
  )

  it('明说四阶段不是机器判据，并给出两套真实判据的指针', () => {
    expect(map).toContain('不是机器判据')
    expect(map).toContain('DesignPosition')
    expect(map).toContain('deriveChapterFacts')
  })

  it('文档侧孤儿项清零：不再出现「素材卡」与「世界书基线」', () => {
    expect(map).not.toContain('素材卡')
    expect(map).not.toContain('世界书基线')
    expect(map, '采风实物名是 forage 的零件卡').toContain('零件卡')
  })

  it('幕纲确认如实标注无 derive 事实项（不造判据）', () => {
    expect(map).toContain('幕纲确认')
    expect(map).toContain('没有 derive 事实项')
  })
})

describe('阶段健康度只推导章节事实', () => {
  it('没有章节文件时总数为 0，不推断定稿', () => {
    for (const input of [undefined, null, [] as Chapter[]]) {
      expect(deriveStageHealth(input)).toMatchObject({ total: 0, finalized: 0, pendingFinal: 0 })
    }
  })

  it('部分定稿时区分已定稿与待定稿', () => {
    const health = deriveStageHealth([
      chapter(1, { finalized: true }),
      chapter(2, { finalized: false, status: '完成' }),
      chapter(3, { status: '完成' }),
    ])
    expect(health).toMatchObject({ total: 3, finalized: 2, pendingFinal: 1 })
  })

  it('全部定稿时定稿进度等于总数', () => {
    const health = deriveStageHealth([
      chapter(1, { finalized: true }),
      chapter(2, { status: '完成' }),
    ])
    expect(health).toMatchObject({ total: 2, finalized: 2, pendingFinal: 0 })
  })

  it('未接入的健康指标保持 null，不以 0 冒充', () => {
    const health = deriveStageHealth([chapter(1, { finalized: true })])
    expect(health.settingDebt).toBeNull()
    expect(health.pendingReview).toBeNull()
    expect(health.pendingReReview).toBeNull()
    expect(health.changes).toBeNull()
  })
})
