/**
 * 章型双轴(业务设计修正 1：章型拆轴)。
 *
 * 旧设计把两条正交的轴压成一条「关键章／过渡章＝其余」，导致：
 * - 余波章被误分到低规格侧，而余波恰是高设计密度(钝收边界、泄压钩居位)；
 * - 判定结果不落盘，审读/润色只能各自重猜，于是各自发明一套分类。
 *
 * 现在拆成两条互相独立的轴：
 * - 承诺档(轴 A)：本章对下游欠多少账 → 决定细纲规格密度、写前十查强度；
 * - 情绪位(轴 B)：本章在情绪曲线的哪一段 → 决定流程负担、收束方式、钩型居位。
 *
 * 字段值形如 `过渡·余波`(轴 A·轴 B)。落候选细纲 frontmatter，不进九节正文——
 *
 * 命名取舍：轴 A 沿用旧词「关键／过渡」（历史语义＝关键章／其余章），不新造「常规」——
 * 旧词已在 40+ 处使用，换名只会制造迁移成本。轴 B 因此避开「过渡」，用「切换」表示桥接章，
 * 两轴取值集合互不相交，杜绝 `过渡·余波` 被误判成情绪位「过渡」的歧义。
 * 章型是调度元数据，不是内容判据；写进正文会污染定位段九节的硬枚举校验。
 */

/** 轴 A · 承诺档：决定规格密度。 */
export const 章型承诺档 = ['关键', '过渡'] as const
export type 章型承诺档 = (typeof 章型承诺档)[number]

/** 轴 B · 情绪位：决定流程负担与收束方式。 */
export const 章型情绪位 = ['铺垫', '高潮', '余波', '切换'] as const
export type 章型情绪位 = (typeof 章型情绪位)[number]

export interface Parsed章型 {
  readonly 承诺?: 章型承诺档
  readonly 情绪?: 章型情绪位
}

const 承诺集 = new Set<string>(章型承诺档)
const 情绪集 = new Set<string>(章型情绪位)

/**
 * 解析章型字段。接受 `过渡·余波`、`过渡/余波`、`过渡-余波`、`过渡|余波` 等分隔写法，
 * 也接受只写一轴(`高潮`＝情绪位单独给)。解析不出任何一轴时返回 null——
 * 调用方据此决定「缺失」还是「非法」，不要在这里抛。
 */
export function parse章型(raw: unknown): Parsed章型 | null {
  if (typeof raw !== 'string') return null
  const text = raw.trim()
  if (text === '') return null
  const parts = text
    .split(/[·/|｜\-—>、\s]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
  if (parts.length === 0) return null
  let 承诺: 章型承诺档 | undefined
  let 情绪: 章型情绪位 | undefined
  for (const part of parts) {
    if (承诺 === undefined && 承诺集.has(part)) {
      承诺 = part as 章型承诺档
      continue
    }
    if (情绪 === undefined && 情绪集.has(part)) {
      情绪 = part as 章型情绪位
    }
  }
  if (承诺 === undefined && 情绪 === undefined) return null
  return { ...(承诺 !== undefined ? { 承诺 } : {}), ...(情绪 !== undefined ? { 情绪 } : {}) }
}

/** 规范写法：两轴都有则 `承诺·情绪`，只有一轴则写那一轴。 */
export function format章型(parsed: Parsed章型): string {
  if (parsed.承诺 !== undefined && parsed.情绪 !== undefined) return `${parsed.承诺}·${parsed.情绪}`
  if (parsed.承诺 !== undefined) return parsed.承诺
  if (parsed.情绪 !== undefined) return parsed.情绪
  return ''
}

/** 校验用：返回不合法的原因，合法时返回 null。 */
export function 章型问题(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  const text = String(raw).trim()
  if (text === '') return null
  if (parse章型(raw) !== null) return null
  return `章型字段无法识别:${text}（合法写法：<承诺档>·<情绪位>，承诺档取 ${章型承诺档.join('/')}，情绪位取 ${章型情绪位.join('/')}，如「过渡·余波」「关键·高潮」；只写一轴亦可）`
}

/**
 * 派发口径：把章型翻译成下游实际要用的两件事。
 * 审读与润色拿这个结果决定强度，而不是自己再猜一遍。
 */
export interface 章型派发口径 {
  /** 细纲规格密度：全规格 or 简章。 */
  readonly 规格: '全规格' | '简章'
  /** 写前十查：全项 or ⑧隔章跑。 */
  readonly 十查: '全项' | '⑧隔章'
  /** 审读强度：9 维 or 确定性+单维。 */
  readonly 审读: '9维' | '确定性+单维'
  /** 是否必须指定调剂式(仅余波为 true)。 */
  readonly 须调剂式: boolean
}

/**
 * 承诺档与情绪位的组合口径。
 *
 * 关键格：常规·余波＝简化细纲但十查全项——余波最容易犯「连续钝收」与「泄压钩错位」，
 * 这两错只有十查能拦，所以细则可简、查项不可省。这是旧设计漏掉的一格。
 */
export function 派发口径(parsed: Parsed章型): 章型派发口径 {
  const 关键 = parsed.承诺 === '关键'
  const 情绪 = parsed.情绪
  const 须调剂式 = 情绪 === '余波'
  if (关键) return { 规格: '全规格', 十查: '全项', 审读: '9维', 须调剂式 }
  if (情绪 === '余波') return { 规格: '简章', 十查: '全项', 审读: '确定性+单维', 须调剂式 }
  if (情绪 === '高潮') return { 规格: '全规格', 十查: '全项', 审读: '确定性+单维', 须调剂式 }
  if (情绪 === '切换') return { 规格: '简章', 十查: '⑧隔章', 审读: '确定性+单维', 须调剂式 }
  return { 规格: '全规格', 十查: '⑧隔章', 审读: '确定性+单维', 须调剂式 }
}
