import React, { useEffect, useState } from 'react'
import { ArrowRight, Check, Circle } from 'lucide-react'
import type { ChapterView } from '../study/types'
import { useStudy } from './hooks'
import { creatorStages, inferCreatorStage, type CreatorStageId } from './stage-data'

interface Props { sessionId: string; space: string; refresh: number }

export function StageOverview({ sessionId, space, refresh }: Props) {
  const chapters = useStudy<ChapterView>(sessionId, 'chapters', { space }, refresh)
  const chapterCount = chapters.value?.chapters.length ?? 0
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
    <p className="nw-viz-note">阶段按章节文件推断；开卷与设计阶段以主会话的状态校准为准。</p>
    {chapters.error ? <p className="nw-error" role="alert">{chapters.error}</p> : null}
  </section>
}
