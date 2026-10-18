// @vitest-environment jsdom
import React, { act, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChapterView } from '../src/study/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const study = vi.hoisted(() => ({
  value: undefined as ChapterView | undefined,
  error: undefined as string | undefined,
}))

vi.mock('../src/client/hooks', () => ({
  useStudy: () => ({ value: study.value, error: study.error, loading: false }),
}))

import { StageHealthSection, StageOverview } from '../src/client/stage-overview'
import { deriveStageHealth } from '../src/client/stage-health'

type Chapter = ChapterView['chapters'][number]

const chapter = (number: number, patch: Partial<Chapter> = {}): Chapter => ({
  volume: 1, chapter: number, title: `第${number}章`, status: '审读', ...patch,
})

async function render(element: ReactElement) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => { root.render(element) })
  return {
    container,
    dispose: async () => {
      await act(async () => { root.unmount() })
      container.remove()
    },
  }
}

const text = (container: HTMLElement, selector: string): string =>
  container.querySelector<HTMLElement>(selector)?.textContent ?? ''

describe('阶段健康度 UI', () => {
  afterEach(() => { study.value = undefined; study.error = undefined })

  it('没有章节时显示 0/0 章节事实，未接入指标用 — 占位', async () => {
    const ui = await render(React.createElement(StageHealthSection, { health: deriveStageHealth(undefined) }))
    try {
      const section = ui.container.querySelector<HTMLElement>('[aria-label="阶段健康度"]')
      expect(section).not.toBeNull()
      expect(text(ui.container, '.nw-stage-health-progress small')).toBe('已定稿 0 / 0 章，待定稿 0 章')

      const progress = ui.container.querySelector<HTMLElement>('[role=progressbar][aria-label="定稿进度"]')
      expect(progress).not.toBeNull()
      expect(progress!.getAttribute('aria-valuenow')).toBe('0')
      expect(progress!.getAttribute('aria-valuemax')).toBe('1')
      expect(progress!.getAttribute('aria-valuetext')).toBe('已定稿 0 / 0 章，待定稿 0 章')

      const metrics = [...ui.container.querySelectorAll<HTMLElement>('.nw-stage-health-metric')]
      expect(metrics).toHaveLength(3)
      for (const metric of metrics) {
        expect(metric.textContent).toContain('—')
        expect(metric.textContent).toContain('未接入')
        expect(metric.dataset.state).toBe('unavailable')
      }
      expect(text(ui.container, '.nw-stage-health-note')).toContain('健康数据接通前只显示章节事实，不伪造 0')
    } finally {
      await ui.dispose()
    }
  })

  it('定稿进度按真实章节事实渲染，部分定稿同时显示待定稿数', async () => {
    const health = deriveStageHealth([
      chapter(1, { finalized: true }),
      chapter(2, { status: '完成' }),
      chapter(3, { finalized: false }),
    ])
    const ui = await render(React.createElement(StageHealthSection, { health }))
    try {
      const progress = ui.container.querySelector<HTMLElement>('[role=progressbar][aria-label="定稿进度"]')!
      expect(progress.getAttribute('aria-valuenow')).toBe('2')
      expect(progress.getAttribute('aria-valuemax')).toBe('3')
      expect(progress.getAttribute('aria-valuetext')).toBe('已定稿 2 / 3 章，待定稿 1 章')
      expect(text(ui.container, '.nw-stage-health-progress small')).toContain('待定稿 1 章')
      expect(ui.container.querySelector('[data-state=unavailable]')).not.toBeNull()
    } finally {
      await ui.dispose()
    }
  })

  it('创作阶段页接入健康区，且四阶段导航保持完整', async () => {
    study.value = {
      bookId: 'book:one',
      bookName: '测试书',
      chapters: [chapter(1, { finalized: true }), chapter(2), chapter(3)],
    }
    const ui = await render(React.createElement(StageOverview, { sessionId: 'session-one', space: 'book:one', refresh: 0 }))
    try {
      expect(ui.container.querySelector('.nw-stage')).not.toBeNull()
      expect(ui.container.querySelectorAll('.nw-stage-rail button')).toHaveLength(4)
      expect(ui.container.querySelector('[aria-label="阶段健康度"]')).not.toBeNull()
      expect(text(ui.container, '.nw-stage-health-progress small')).toBe('已定稿 1 / 3 章，待定稿 2 章')
      expect(ui.container.querySelector('[role=progressbar][aria-label="定稿进度"]')?.getAttribute('aria-valuetext'))
        .toBe('已定稿 1 / 3 章，待定稿 2 章')
      expect(ui.container.textContent).toContain('待处置评审')
      expect(ui.container.textContent).toContain('待复评')
      expect(ui.container.textContent).toContain('设定债 / 变更')
      expect(ui.container.querySelectorAll('.nw-stage-health-metric[data-state=unavailable]')).toHaveLength(3)
    } finally {
      await ui.dispose()
    }
  })
})
