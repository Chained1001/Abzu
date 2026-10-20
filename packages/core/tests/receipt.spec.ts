/**
 * 提案回执(0.0.88)纯逻辑：从工具结果造回执、累积、渲染。
 *
 * 锁四件事：
 * 1. 只认写入类工具——只读工具不产生回执，否则噪声淹没信号；
 * 2. 失败也必须回执，且 reason 进结论（「被拒别原样重提」靠这条）；
 * 3. 结论只取首句并截断——回执不能把整篇 message 塞进上下文；
 * 4. 没有回执时渲染返回 null（不注入空话）。
 */
import { describe, expect, it } from 'vitest'
import {
  回执条数上限,
  回执结论上限,
  是否需要回执,
  写入类工具,
  空累积,
  追加回执,
  渲染回执,
  造回执,
} from '../src/derive/receipt'

describe('回执：只认写入类工具', () => {
  it('写入类工具在名单里，只读/检索不在', () => {
    expect(是否需要回执('novel_apply_revision')).toBe(true)
    expect(是否需要回执('novel_settle_chapter')).toBe(true)
    expect(是否需要回执('novel_get_story_status')).toBe(false)
    expect(是否需要回执('novel_search_finalized')).toBe(false)
    expect(是否需要回执('novel_review_summary')).toBe(false)
    expect(是否需要回执('novel_select_book')).toBe(false)
  })

  it('只读工具即使成功也不产回执', () => {
    expect(造回执('novel_get_story_status', { ok: true, message: '状态已读' })).toBeUndefined()
  })

  it('名单里没有重复项', () => {
    expect(new Set(写入类工具).size).toBe(写入类工具.length)
  })
})

describe('回执：成败与结论', () => {
  it('成功：结论取 message 首句，不算全篇', () => {
    const e = 造回执('novel_apply_revision', {
      ok: true,
      message: '已应用改稿。后续范围报告：硬约束回查失败 2 项。是否重跑由你判断。',
      卷: 1, 章: 3, 章名: '追查',
    })
    expect(e).toBeDefined()
    expect(e!.成败).toBe('成功')
    expect(e!.结论).toBe('已应用改稿')
    expect(e!.定位).toEqual({ 卷: 1, 章: 3, 章名: '追查' })
  })

  it('失败：reason 进结论（不吞掉失败）', () => {
    const e = 造回执('novel_settle_chapter', { ok: false, reason: '未获作者批准: 答案 id 与种类不匹配' })
    expect(e!.成败).toBe('失败')
    expect(e!.结论).toBe('未获作者批准: 答案 id 与种类不匹配')
  })

  it('有 reason 但没 ok:true 也算失败（工具层约定）', () => {
    const e = 造回执('novel_prepare_pack', { reason: '笔误' })
    expect(e!.成败).toBe('失败')
  })

  it('失败但没给 reason：结论明确说「未给出原因」，不静默', () => {
    const e = 造回执('novel_apply_retcon', { ok: false })
    expect(e!.成败).toBe('失败')
    expect(e!.结论).toBe('未给出原因')
  })

  it('成功但没有 message：给一句明确兜底，不产出空结论', () => {
    const e = 造回执('novel_note_pending', { ok: true })
    expect(e!.成败).toBe('成功')
    expect(e!.结论).toBe('已完成（工具未给说明）')
  })

  it('结论超长被截断', () => {
    const 长 = '啊'.repeat(500)
    const e = 造回执('novel_import_draft', { ok: true, message: 长 })
    expect(e!.结论.length).toBeLessThanOrEqual(回执结论上限 + 1)
    expect(e!.结论.endsWith('…')).toBe(true)
  })

  it('结果形状不对（null / 数组 / 标量）不报错，返回 undefined', () => {
    expect(造回执('novel_apply_revision', null)).toBeUndefined()
    expect(造回执('novel_apply_revision', [])).toBeUndefined()
    expect(造回执('novel_apply_revision', 'x')).toBeUndefined()
  })

  it('ok 既非 true 也非 false 且无 reason：不产回执（不瞎猜）', () => {
    expect(造回执('novel_apply_revision', { message: '奇怪' })).toBeUndefined()
  })

  it('定位只取白名单键，且长字符串截断', () => {
    const e = 造回执('novel_apply_revision', {
      ok: true, message: '好', 路径: 'x'.repeat(200), 无关字段: '不要', 章: 2,
    })
    expect(e!.定位).toEqual({ 路径: 'x'.repeat(80) + '…', 章: 2 })
  })
})

describe('回执：累积与渲染', () => {
  it('空累积渲染为 null（不注入「本轮无改动」的空话）', () => {
    expect(渲染回执(空累积)).toBeNull()
  })

  it('追加后能渲染，含工具名与成败标记', () => {
    let acc = 空累积
    acc = 追加回执(acc, 造回执('novel_apply_revision', { ok: true, message: '已应用改稿' })!)
    acc = 追加回执(acc, 造回执('novel_prepare_pack', { ok: false, reason: '本章审核未完成' })!)
    const text = 渲染回执(acc)!
    expect(text).toContain('✓ novel_apply_revision')
    expect(text).toContain('✗ novel_prepare_pack')
    expect(text).toContain('已应用改稿')
    expect(text).toContain('本章审核未完成')
    // 规则句必须在
    expect(text).toContain('已成功的不要重复提交')
    expect(text).toContain('失败的按给出的原因修正后再试')
    expect(text).toContain('先用只读工具读回来')
  })

  it('只有成功时不给「失败」规则；只有失败时不给「成功」规则', () => {
    const 只成功 = 追加回执(空累积, 造回执('novel_apply_revision', { ok: true, message: '好' })!)
    const t1 = 渲染回执(只成功)!
    expect(t1).toContain('已成功的不要重复提交')
    expect(t1).not.toContain('失败的按给出的原因')

    const 只失败 = 追加回执(空累积, 造回执('novel_apply_revision', { ok: false, reason: '坏了' })!)
    const t2 = 渲染回执(只失败)!
    expect(t2).toContain('失败的按给出的原因')
    expect(t2).not.toContain('已成功的不要重复提交')
  })

  it('超出条数上限时只留最近的，并报省略数（不静默丢）', () => {
    let acc = 空累积
    const 总 = 回执条数上限 + 3
    for (let i = 1; i <= 总; i++) {
      acc = 追加回执(acc, 造回执('novel_apply_revision', { ok: true, message: `第 ${i} 次` })!)
    }
    expect(acc.条目.length).toBe(回执条数上限)
    expect(acc.省略条数).toBe(3)
    const text = 渲染回执(acc)!
    expect(text).toContain('另有 3 条更早的写入未列出')
    // 最旧的被丢，最新的在
    expect(text).toContain(`第 ${总} 次`)
    expect(text).not.toContain('第 1 次')
  })

  it('追加是纯函数，不改入参', () => {
    const acc = 空累积
    const next = 追加回执(acc, 造回执('novel_apply_revision', { ok: true, message: 'x' })!)
    expect(acc.条目.length).toBe(0)
    expect(next.条目.length).toBe(1)
  })

  it('回执不含写入正文（只留结论与定位）', () => {
    const 正文 = '这是很长的一章正文，'.repeat(50)
    const e = 造回执('novel_import_draft', { ok: true, message: '作者手改已摄入', 正文 })
    expect(e).toBeDefined()
    expect(JSON.stringify(e)).not.toContain('这是很长的一章正文')
  })
})
