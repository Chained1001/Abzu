import { describe, expect, it } from 'vitest'
import {
  format章型,
  parse章型,
  章型问题,
  章型情绪位,
  章型承诺档,
  派发口径,
} from '../src/outline/chapter-type'

describe('章型双轴：解析', () => {
  it('两轴写法都能解析', () => {
    expect(parse章型('关键·高潮')).toEqual({ 承诺: '关键', 情绪: '高潮' })
    expect(parse章型('过渡·余波')).toEqual({ 承诺: '过渡', 情绪: '余波' })
  })

  it('接受多种分隔符', () => {
    for (const raw of ['过渡/余波', '过渡-余波', '过渡｜余波', '过渡 余波', '过渡、余波']) {
      expect(parse章型(raw), raw).toEqual({ 承诺: '过渡', 情绪: '余波' })
    }
  })

  it('顺序无关', () => {
    expect(parse章型('余波·过渡')).toEqual({ 承诺: '过渡', 情绪: '余波' })
  })

  it('只写一轴也成立', () => {
    expect(parse章型('高潮')).toEqual({ 情绪: '高潮' })
    expect(parse章型('关键')).toEqual({ 承诺: '关键' })
  })

  it('空值与无法识别的值返回 null', () => {
    for (const raw of [undefined, null, '', '   ', '随便写点什么', 42, {}]) {
      expect(parse章型(raw), String(raw)).toBeNull()
    }
  })

  it('规范写法可往返', () => {
    const once = parse章型('过渡·余波')
    expect(once).not.toBeNull()
    expect(format章型(once!)).toBe('过渡·余波')
    expect(parse章型(format章型(once!))).toEqual(once)
  })
})

describe('章型双轴：取值集合不变量', () => {
  it('两轴取值集合互不相交', () => {
    // 相交会导致「过渡·余波」被解析成情绪位「过渡」——歧义不是文风问题而是解析错误。
    const 承诺 = new Set<string>(章型承诺档)
    const 交集 = 章型情绪位.filter((v) => 承诺.has(v))
    expect(交集, `两轴不得共用取值：${交集.join('、')}`).toEqual([])
  })

  it('每轴取值都能被单独识别，且不会跨轴误配', () => {
    for (const v of 章型承诺档) expect(parse章型(v), v).toEqual({ 承诺: v })
    for (const v of 章型情绪位) expect(parse章型(v), v).toEqual({ 情绪: v })
  })
})

describe('章型双轴：校验', () => {
  it('缺失不报错（软校验，兼容旧书）', () => {
    expect(章型问题(undefined)).toBeNull()
    expect(章型问题(null)).toBeNull()
    expect(章型问题('')).toBeNull()
    expect(章型问题('   ')).toBeNull()
  })

  it('合法值不报错', () => {
    for (const raw of ['关键·高潮', '过渡·余波', '过渡·切换', '高潮']) {
      expect(章型问题(raw), raw).toBeNull()
    }
  })

  it('非法值给出可操作的错误文案', () => {
    const msg = 章型问题('超级章')
    expect(msg).not.toBeNull()
    expect(msg).toContain('章型字段无法识别:超级章')
    // 文案必须列出合法取值，否则模型无从修正
    for (const v of 章型承诺档) expect(msg, `错误文案应列出 ${v}`).toContain(v)
    for (const v of 章型情绪位) expect(msg, `错误文案应列出 ${v}`).toContain(v)
  })
})

describe('章型双轴：派发口径', () => {
  it('关键章一律全规格全项', () => {
    for (const 情绪 of 章型情绪位) {
      expect(派发口径({ 承诺: '关键', 情绪 })).toMatchObject({ 规格: '全规格', 十查: '全项', 审读: '9维' })
    }
  })

  it('过渡·余波＝简化细纲但十查全项（旧设计漏掉的一格）', () => {
    // 余波最容易犯「连续钝收」与「泄压钩错位」，这两错只有十查能拦：
    // 细则可简，查项不可省。
    expect(派发口径({ 承诺: '过渡', 情绪: '余波' })).toEqual({
      规格: '简章',
      十查: '全项',
      审读: '确定性+单维',
      须调剂式: true,
    })
  })

  it('过渡·切换走简章＋⑧隔章', () => {
    expect(派发口径({ 承诺: '过渡', 情绪: '切换' })).toMatchObject({ 规格: '简章', 十查: '⑧隔章' })
  })

  it('常规·高潮细纲不简（高潮要写足），但审读单维', () => {
    expect(派发口径({ 承诺: '过渡', 情绪: '高潮' })).toMatchObject({ 规格: '全规格', 十查: '全项' })
  })

  it('只有余波须指定调剂式', () => {
    for (const 情绪 of 章型情绪位) {
      expect(派发口径({ 承诺: '过渡', 情绪 }).须调剂式, String(情绪)).toBe(情绪 === '余波')
    }
    expect(派发口径({ 承诺: '关键' }).须调剂式).toBe(false)
  })
})
