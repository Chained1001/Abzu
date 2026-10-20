/**
 * 四阶段导航的展示数据；只用于产品界面，不参与路由或授权。
 * 机器判据不在本文件：设计面看 core `DesignPosition` 七值（derive/design.ts），
 * 章级看 `deriveChapterFacts` 十一行（derive/derive.ts），两者经 novel_get_story_status 返回。
 */
export type CreatorStageId = 'start' | 'book' | 'volume' | 'chapter'

export interface CreatorStage {
  readonly id: CreatorStageId
  readonly title: string
  readonly tagline: string
  readonly skills: readonly string[]
  readonly artifacts: string
  readonly gate: string
}

export const creatorStages: readonly CreatorStage[] = [
  {
    id: 'start',
    title: '开书',
    tagline: '把想法收敛成能开书的承诺',
    skills: ['灵感与立项', '素材库与采风（按需）', '参考小说拆解（按需）'],
    artifacts: '构想七要素、构想草案、书仓',
    gate: '作者确认开书，书仓建立',
  },
  {
    id: 'book',
    title: '书级基线',
    tagline: '定契约、全书大纲、分卷布局与设定基线',
    skills: ['定调设计'],
    artifacts: '作品契约、全书大纲、分卷布局、世界书最小模块',
    gate: '契约/全书大纲/分卷布局确认，世界书达到可开写',
  },
  {
    id: 'volume',
    title: '卷级滚动',
    tagline: '开这一卷：卷纲、分幕、幕纲与卷末',
    skills: ['卷幕规划'],
    artifacts: '卷纲、计划时间线、近期窗口、幕纲、卷摘要、卷对账',
    gate: '卷纲/计划时间线/近期窗口就绪，幕纲确认，第一幕可写',
  },
  {
    id: 'chapter',
    title: '章级循环',
    tagline: '这一章：细纲、备料、正文、审读、改稿、润色、沉淀',
    skills: ['细纲备料', '正文起草', '全面审读', '改稿', '精修润色', '定稿沉淀'],
    artifacts: '确认细纲、材料包、待审稿、审核记录、定稿章、待定稿包',
    gate: '本章定稿入档，进入下一章',
  },
]

export function inferCreatorStage(chapterCount: number): CreatorStageId {
  return chapterCount > 0 ? 'chapter' : 'book'
}
