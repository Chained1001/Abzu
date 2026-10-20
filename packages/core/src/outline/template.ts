/**
 * 章细纲空候选模板(格式规格 §3.3):定位段固定小节 + 一个空叙事单元。
 */

export const 定位段小节 = [
  '来源窗口项及拆并关系',
  '章节功能',
  '视角与焦点',
  '时空锚定',
  '起止边界',
  '故事线与承诺分配',
  '信息边界',
  '情绪与节奏目标',
  '前置条件核对结果',
] as const

/**
 * 定位段之后另加的四固定小节（规格单源：bundle 技能包 templates/章细纲固定小节规格.md）。
 * 它们与 定位段小节 不同层：定位段是九节「###」，四小节里「冲突与爽点」「章末双钩」是
 * 「###」，四者都在细纲段之前的正文里，不属于细纲段单元字段。
 *
 * 机器侧只做**软校验**（缺则播报，不拦确认）：存量细纲没有这四节，硬拦会让旧书全部确认不了。
 */
export const 四固定小节 = ['本章形状', '已排除走向', '冲突与爽点', '章末双钩'] as const

export const 单元字段 = [
  '目标',
  '人物',
  '时空',
  '行动/冲突',
  '信息披露',
  '状态变化',
] as const

export type 定位段名 = (typeof 定位段小节)[number]
export type 单元字段名 = (typeof 单元字段)[number]

/** 空候选正文:定位段九节 + 四固定小节 + 细纲段一个空单元,不发明情节。 */
export function emptyCandidateBody(): string {
  const lines: string[] = ['# 章细纲', '', '## 定位段', '']
  for (const name of 定位段小节) {
    lines.push(`### ${name}`, '', '')
  }
  // 四固定小节也生成空壳:规格要求它们必在,模板却不生,等于让新候选一出厂就欠四节。
  // 只给标题不给内容——内容判据在技能文档,机器不发明情节。
  for (const name of 四固定小节) {
    lines.push(`### ${name}`, '', '')
  }
  lines.push('## 细纲段', '', '### 单元 1', '')
  for (const field of 单元字段) {
    lines.push(`- ${field}:`, '')
  }
  return `${lines.join('\n').replace(/\n+$/, '')}\n`
}

/**
 * 四固定小节缺失播报（软校验）：缺则返回一句给人看的提示，齐全或无法判则返回 null。
 *
 * 为什么软：这四节是规格要求（章细纲固定小节规格.md），但存量细纲没有它们，
 * 硬校验会让旧书全部确认不了。与「章型」「卷纲第五段」同款口径——缺则播报，非法才拦。
 * 只判「这一节标题在不在」，不判内容质量（内容判据在技能文档，机器不越界）。
 */
export function 四固定小节缺失(body: string): string | null {
  const missing = 四固定小节.filter((name) => {
    const re = new RegExp('^#{2,3}\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm')
    return !re.test(body)
  })
  if (missing.length === 0) return null
  if (missing.length === 四固定小节.length) {
    return `细纲未写四固定小节（本章形状／已排除走向／冲突与爽点／章末双钩）：存量细纲可后补，不拦确认；新写细纲请按 templates/章细纲固定小节规格.md 补齐`
  }
  return `细纲缺固定小节：${missing.join('、')}（行式见 templates/章细纲固定小节规格.md；缺项不拦确认，但审读会按缺节处理）`
}
