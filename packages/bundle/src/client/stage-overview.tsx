import React, { useEffect, useState } from 'react'
import { ArrowRight, Check, Circle } from 'lucide-react'
import type { ChapterView } from '../study/types'
import { useStudy } from './hooks'
import { creatorStages, inferCreatorStage, type CreatorStageId } from './stage-data'
import { deriveStageHealth, type StageHealth } from './stage-health'

interface Props { sessionId: string; space: string; refresh: number }

const healthState = (ready: boolean): 'unavailable' | 'ready' => ready ? 'ready' : 'unavailable'
const healthText = (value: number | null): string => value === null ? '—' : String(value)
const healthLabel = (value: number | null): string => value === null ? '未接入' : '已接入'
const debtAndChanges = (health: StageHealth): string => health.settingDebt === null || health.changes === null
  ? '—'
  : `${health.settingDebt} / ${health.changes}`

export function StageHealthSection({ health }: { health: StageHealth }) {
  const percent = health.total > 0 ? Math.round(health.finalized / health.total * 100) : 0
  const progressText = `已定稿 ${health.finalized} / ${health.total} 章，待定稿 ${health.pendingFinal} 章`
  return <section className="nw-stage-health" aria-label="阶段健康度">
    <div className="nw-stage-health-head">
      <div><p>健康度</p><h4>定稿进度</h4></div>
      <div className="nw-stage-health-progress">
        <div className="nw-stage-progress-bar" role="progressbar" aria-label="定稿进度"
          aria-valuemin={0} aria-valuemax={Math.max(health.total, 1)} aria-valuenow={health.finalized} aria-valuetext={progressText}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <small>{progressText}</small>
      </div>
    </div>
    <ul className="nw-stage-health-grid">
      <li className="nw-stage-health-metric" data-state={healthState(health.pendingReview !== null)}>
        <span>待处置评审</span><strong>{healthText(health.pendingReview)}</strong><small>{healthLabel(health.pendingReview)}</small>
      </li>
      <li className="nw-stage-health-metric" data-state={healthState(health.pendingReReview !== null)}>
        <span>待复评</span><strong>{healthText(health.pendingReReview)}</strong><small>{healthLabel(health.pendingReReview)}</small>
      </li>
      <li className="nw-stage-health-metric" data-state={healthState(health.settingDebt !== null && health.changes !== null)}>
        <span>设定债 / 变更</span><strong>{debtAndChanges(health)}</strong>
        <small>{health.settingDebt === null || health.changes === null ? '未接入' : '已接入'}</small>
      </li>
    </ul>
    <p className="nw-stage-health-note">健康数据接通前只显示章节事实，不伪造 0。</p>
  </section>
}

export function StageOverview({ sessionId, space, refresh }: Props) {
  const chapters = useStudy<ChapterView>(sessionId, 'chapters', { space }, refresh)
  const health = deriveStageHealth(chapters.value?.chapters)
  const chapterCount = health.total
  const current = inferCreatorStage(chapterCount)
  const [picked, setPicked] = useState<CreatorStageId>(current)
  useEffect(() => { setPicked(current) }, [current])
  const stage = creatorStages.find(item => item.id === picked) ?? creatorStages[1]!
  const index = creatorStages.findIndex(item => item.id === picked) + 1
  return <section className="nw-stage" aria-label="创作阶段导航">
    <div className="nw-stage-head">
      <div><p>四阶段导航</p><h3>{stage.title}</h3><span>{stage.tagline}</span></div>
      <div className="nw-stage-count"><strong>{chapterCount}</strong><span>章已登记</span></div>
    </div>
    <ol className="nw-stage-rail">
      {creatorStages.map((item, position) => {
        const state = item.id === current ? 'current' : position < creatorStages.findIndex(s => s.id === current) ? 'done' : 'todo'
        return <li key={item.id}>
          <button type="button" aria-current={item.id === picked ? 'step' : undefined} data-state={state} onClick={() => setPicked(item.id)}>
            <span className="nw-stage-dot">{state === 'done' ? <Check size={14} /> : state === 'current' ? <Circle size={12} fill="currentColor" /> : position + 1}</span>
            <span><strong>{item.title}</strong><small>{item.skills[0]}</small></span>
            {position < creatorStages.length - 1 ? <ArrowRight size={13} className="nw-stage-arrow" /> : null}
          </button>
        </li>
      })}
    </ol>
    <div className="nw-stage-detail">
      <small>阶段 {index} / 4</small>
      <h3>{stage.title}</h3>
      <div className="nw-stage-columns">
        <div><h4>调用技能</h4><ul>{stage.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></div>
        <div><h4>阶段产出</h4><p>{stage.artifacts}</p></div>
      </div>
      <p className="nw-stage-gate"><strong>退出条件</strong>{stage.gate}</p>
    </div>
    <StageHealthSection health={health} />
    <p className="nw-viz-note">阶段按章节文件推断；开卷与设计阶段以主会话的状态校准为准。</p>
    {chapters.error ? <p className="nw-error" role="alert">{chapters.error}</p> : null}
  </section>
}
