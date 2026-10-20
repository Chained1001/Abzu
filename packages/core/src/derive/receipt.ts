/**
 * 提案回执(0.0.88):把「上一轮写入了什么、成没成」回灌给模型。
 *
 * 问题:模型调完一个写入类工具后,下一轮并不知道那一次到底落成了没有——
 * 报错被折叠、结果被上下文压缩吃掉、或者它干脆没读返回。于是常见三种病:
 * - 反复重提同一处改动(以为没写);
 * - 以为写了其实没写,后续基于不存在的改动继续推演;
 * - 被拒后原样重提(没看懂拒绝理由)。
 *
 * 解法:每次**写入类工具返回后**,把「工具名 + 成败 + 一句话结论 + 关键字段」压成
 * 一条回执行,累计到本轮结束前统一回灌。模型下一轮一定看得到自己上轮干了什么。
 *
 * 三条纪律:
 * - **只记事实,不记原文**:回执里放计数、路径、成败、以及工具自己给的 message,
 *   不放写入正文——否则每轮都在上下文里塞一份稿子。
 * - **只认写入类工具**:只读工具不产生回执,避免噪声淹没信号。
 * - **失败也要回执**:失败比成功更需要被记住——「被拒别原样重提」靠的就是这条。
 *
 * 本模块是纯函数 + 一个无副作用的内存累加器,不写盘、不读盘、不碰 Git。
 */

/** 一条回执。字段刻意少:模型只需要知道「做了什么、成没成、下一步别重复什么」。 */
export interface 回执条目 {
  /** 工具名(如 novel_apply_revision)。 */
  readonly 工具: string
  /** 成败。失败时 结论 一定非空(约定了修正方向)。 */
  readonly 成败: '成功' | '失败'
  /** 一句话结论:成功取工具 message 首句;失败取 reason。截断到 回执单条上限。 */
  readonly 结论: string
  /** 从工具结果里摘出的关键定位字段(如 章/卷/路径),没有就不给。 */
  readonly 定位?: Readonly<Record<string, string | number>>
}

/** 回执单条结论的最大字符数:超了截断加省略号,避免一条 message 吃掉整个回执预算。 */
export const 回执结论上限 = 160

/** 一轮最多留多少条回执:超出只保留最近的,并单独报省略数(不静默丢弃)。 */
export const 回执条数上限 = 12

/**
 * 写入类工具名单——**只有这些工具产生回执**。
 *
 * 判定口径是「会不会改变书仓/草稿区的持久状态」,不是「名字里有没有 update」:
 * - 只读与检索(query/status/progress/summary/search)不在此列;
 * - 纯登记类(record_proposal / note_pending)在列:它们写文件,同样会被模型遗忘;
 * - settle/retcon 在列:这是最高代价的两种写入。
 */
export const 写入类工具: readonly string[] = [
  'novel_create_book',
  'novel_update_contract',
  'novel_new_outline_draft',
  'novel_confirm_outline',
  'novel_update_full_outline',
  'novel_update_volume_layout',
  'novel_roll_window',
  'novel_confirm_worldbook_entry',
  'novel_confirm_volume_outline',
  'novel_assemble_materials',
  'novel_apply_revision',
  'novel_apply_revision_batch',
  'novel_import_draft',
  'novel_record_review_findings',
  'novel_record_polish',
  'novel_record_proposal',
  'novel_resolve_proposal',
  'novel_note_pending',
  'novel_prepare_pack',
  'novel_settle_chapter',
  'novel_apply_retcon',
] as const

export function 是否需要回执(工具名: string): boolean {
  return 写入类工具.includes(工具名)
}

/** 从工具结果里摘定位字段。只认这几个键,且只取标量——避免把整个结果塞进回执。 */
const 定位键 = ['卷', '章', '章名', '路径', 'relPath', '状态', '轮次'] as const

function 摘定位(值: Record<string, unknown>): Record<string, string | number> | undefined {
  const out: Record<string, string | number> = {}
  for (const k of 定位键) {
    const v = 值[k]
    if (typeof v === 'string' && v.trim() !== '') out[k] = v.length > 80 ? v.slice(0, 80) + '…' : v
    else if (typeof v === 'number') out[k] = v
  }
  return Object.keys(out).length === 0 ? undefined : out
}

/** 取首句:中文句号/分号/换行都算断点。message 常常是多句长文,回执只要第一句。 */
function 首句(s: string): string {
  const cut = s.split(/[。；\n]/)[0] ?? s
  return cut.trim()
}

function 截断(s: string): string {
  return s.length > 回执结论上限 ? s.slice(0, 回执结论上限) + '…' : s
}

/**
 * 从一次工具结果造回执条目。`结果` 是工具返回的原始对象(含 ok/message/reason)。
 *
 * 不是写入类工具、或结果形状不对 → 返回 undefined(调用方直接跳过,不报错)。
 */
export function 造回执(工具名: string, 结果: unknown): 回执条目 | undefined {
  if (!是否需要回执(工具名)) return undefined
  if (结果 === null || typeof 结果 !== 'object' || Array.isArray(结果)) return undefined
  const r = 结果 as Record<string, unknown>
  const 定位 = 摘定位(r)
  // 失败判定:ok === false,或带了 reason 却没 ok:true。工具层约定失败必有 reason。
  const 是失败 = r['ok'] === false || (typeof r['reason'] === 'string' && r['reason'].trim() !== '' && r['ok'] !== true)
  if (是失败) {
    const reason = typeof r['reason'] === 'string' && r['reason'].trim() !== '' ? r['reason'] : '未给出原因'
    return { 工具: 工具名, 成败: '失败', 结论: 截断(首句(reason)), ...(定位 ? { 定位 } : {}) }
  }
  if (r['ok'] !== true) return undefined
  const message = typeof r['message'] === 'string' ? r['message'] : ''
  return {
    工具: 工具名,
    成败: '成功',
    结论: message === '' ? '已完成（工具未给说明）' : 截断(首句(message)),
    ...(定位 ? { 定位 } : {}),
  }
}

/** 回执累积结果:保留条目 + 被省略条数(不静默丢)。 */
export interface 回执累积 {
  readonly 条目: readonly 回执条目[]
  readonly 省略条数: number
}

/**
 * 追加一条回执,超出上限时丢最旧的并累加省略数。
 * 纯函数:返回新对象,不改入参。
 */
export function 追加回执(累积: 回执累积, 新条目: 回执条目): 回执累积 {
  const 全部 = [...累积.条目, 新条目]
  if (全部.length <= 回执条数上限) return { 条目: 全部, 省略条数: 累积.省略条数 }
  const 溢出 = 全部.length - 回执条数上限
  return { 条目: 全部.slice(溢出), 省略条数: 累积.省略条数 + 溢出 }
}

export const 空累积: 回执累积 = { 条目: [], 省略条数: 0 }

/**
 * 把累积渲染成给模型看的一段文本。**没有回执时返回 null**——调用方据此决定不注入,
 * 而不是注入一段「本轮没有改动」的空话(那只会占预算、教模型忽略回执)。
 */
export function 渲染回执(累积: 回执累积): string | null {
  if (累积.条目.length === 0) return null
  const 行: string[] = []
  行.push('【上一轮写入结果】以下是你在上一轮实际做过的写入动作及结果，用于避免重复提交或基于未落盘的改动继续推演。')
  if (累积.省略条数 > 0) 行.push(`（另有 ${累积.省略条数} 条更早的写入未列出。）`)
  for (const e of 累积.条目) {
    const 位置 = e.定位 === undefined ? '' : ' ' + Object.entries(e.定位).map(([k, v]) => `${k}=${String(v)}`).join(' ')
    const 标记 = e.成败 === '成功' ? '✓' : '✗'
    行.push(`${标记} ${e.工具}${位置}：${e.结论}`)
  }
  // 这三句是回执真正起作用的地方:不给规则,模型仍然会原样重提
  const 有失败 = 累积.条目.some((e) => e.成败 === '失败')
  const 有成功 = 累积.条目.some((e) => e.成败 === '成功')
  行.push('据此:')
  if (有成功) 行.push('- 已成功的不要重复提交；要调整就在现有结果上继续。')
  if (有失败) 行.push('- 失败的按给出的原因修正后再试，不要原样重提。')
  行.push('- 需要确认实际落盘内容的，先用只读工具读回来，不要凭这条回执推演细节。')
  return 行.join('\n')
}
