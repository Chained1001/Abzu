import { test } from 'node:test'
import { strictEqual, ok } from 'node:assert'
import { validate } from '../../skills/abzu-teardown/scripts/teardown/validate.mjs'
import { audit } from '../../skills/abzu-teardown/scripts/teardown/audit.mjs'
import { generate } from '../../skills/abzu-teardown/scripts/teardown/index.mjs'
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ORIGINAL = `第一章 开始
主角在牢中醒来，发现记忆混乱，穿越的事实逐渐清晰。他决定自救，第一步是搞清楚税银案的来龙去脉。牢房外传来打更声，三更天，距离流放还有三天时间。`

// 60 字合规摘要
const SUMMARY_60 = '主角穿越醒来身处牢狱，整理记忆发现原身背负税银案嫌疑，三日后流放边陲，他决定先查清案情再图自救脱身，牢外打更三声报三更天'

// 逐字照扫描工任务书行格式构造的合规轻扫缓存（索引行＋要点行）
const SCAN_CACHE = `### 跨批状态
已确认别名：无
未闭合剧情点：无
悬念：税银案
关系变化：无
待核事项：无

### 逐章事实
第1章|开始|摘要|${SUMMARY_60}|人物|主角|位置|牢房
- 要点|1|1|主角醒来确认穿越处境
- 要点|1|2|记忆梳理出税银案线索

### 跨章观察
- 开局即入狱，信息密度高

### 自查
索引行数=1==章数；要点行=2

<!-- teardown:cache-end:批次-01 -->`

function writeTempPair (original, cache) {
  const dir = mkdtempSync(join(tmpdir(), 'abzu-validate-'))
  const o = join(dir, 'o.txt')
  const c = join(dir, 'c.md')
  writeFileSync(o, original, 'utf8')
  writeFileSync(c, cache, 'utf8')
  return { o, c, dir }
}

test('validate — 合规轻扫缓存整体通过（含要点行不误报）', () => {
  const { o, c, dir } = writeTempPair(ORIGINAL, SCAN_CACHE)
  const r = validate(o, c)
  strictEqual(r.pass, true, `错误：${r.errors.join('; ')}`)
  ok(r.checks.sections.startsWith('✅'))
  ok(r.checks.wordCount.includes('摘要 1 条'), `实际 ${r.checks.wordCount}`)
  rmSync(dir, { recursive: true })
})

test('validate — 缺节拒收', () => {
  const broken = SCAN_CACHE.replace('### 自查\n索引行数=1==章数；要点行=2\n', '')
  const { o, c, dir } = writeTempPair(ORIGINAL, broken)
  const r = validate(o, c)
  strictEqual(r.pass, false)
  ok(r.errors.some(e => e.includes('自查')), '应报缺自查节')
  rmSync(dir, { recursive: true })
})

test('validate — cache-end 不在末行拒收', () => {
  const broken = SCAN_CACHE + '\n多出来的一行\n'
  const { o, c, dir } = writeTempPair(ORIGINAL, broken)
  const r = validate(o, c)
  strictEqual(r.pass, false)
  ok(r.errors.some(e => e.includes('cache-end')), '应报末行标记不完整')
  rmSync(dir, { recursive: true })
})

test('validate — 真摘要过短被查（不再只查要点行）', () => {
  const bad = SCAN_CACHE.replace(SUMMARY_60, '太短')
  const { o, c, dir } = writeTempPair(ORIGINAL, bad)
  const r = validate(o, c)
  strictEqual(r.pass, false)
  ok(r.errors.some(e => e.includes('第1章') && e.includes('下限 45')), `实际：${r.errors.join('; ')}`)
  rmSync(dir, { recursive: true })
})

test('validate — 深读深卡字数被查', () => {
  const deep = `### 跨批状态
已确认别名：无
未闭合剧情点：无
悬念：无
关系变化：无
待核事项：无

### 逐章事实
#### 第1章 深卡
- 六步|情绪事件|入狱惊醒|欲望目标|自救脱身|阻碍|流放在即|解决|查税银案|行动高潮|梳理线索|结局反馈|计划成形
- 钩子|章首|惊醒失忆|章末|计划成形
- 打分|剧情2·情绪好奇4·描写2|开局立钩
- 证据|1·开篇
- 深卡|${'深'.repeat(255)}

### 跨章观察
- 深读一章样例

### 自查
字段行数=1章×11

<!-- teardown:cache-end:批次-1c-01 -->`
  const { o, c, dir } = writeTempPair(ORIGINAL, deep)
  const r = validate(o, c)
  strictEqual(r.pass, true, `错误：${r.errors.join('; ')}`)
  ok(r.checks.wordCount.includes('深卡 1 条'), `实际 ${r.checks.wordCount}`)

  const tooLong = deep.replace('深'.repeat(255), '深'.repeat(700))
  const b = writeTempPair(ORIGINAL, tooLong)
  const r2 = validate(b.o, b.c)
  ok(r2.warnings.some(w => w.includes('上限 405')), '超长深卡应出警告')
  rmSync(dir, { recursive: true })
  rmSync(b.dir, { recursive: true })
})

test('validate — 范围 hash 按全局章序定位（卷内编号书不查错章）＋双向错配拒收', () => {
  // 三卷各 2 章、卷内编号重启（每卷 第一/第二章）；批次＝全局第 3 章（卷二第一章，章题编号=1）
  const mk = t => t.repeat(10)
  const b1 = mk('甲章正文内容持续足够长以通过检测。')
  const b2 = mk('乙章正文内容持续足够长以通过检测。')
  const b3 = mk('丙章正文内容持续足够长以通过检测。')
  const b4 = mk('丁章正文内容持续足够长以通过检测。')
  const b5 = mk('戊章正文内容持续足够长以通过检测。')
  const b6 = mk('己章正文内容持续足够长以通过检测。')
  const volBook = `第一卷 甲\n第一章\n${b1}\n\n第二章\n${b2}\n第二卷 乙\n第一章\n${b3}\n\n第二章\n${b4}\n第三卷 丙\n第一章\n${b5}\n\n第二章\n${b6}\n`
  const dir = mkdtempSync(join(tmpdir(), 'abzu-scope-'))
  const o = join(dir, 'o.txt')
  writeFileSync(o, volBook, 'utf8')
  const aj = join(dir, 'audit.json')
  writeFileSync(aj, JSON.stringify(audit(o)), 'utf8')
  const csv = join(dir, 'index.csv')
  generate(aj, csv)
  // 缓存写全局章序 3（协议钉死 {N}＝index），章题虽是"第一章"——范围 hash 必须定位全局第 3 章
  const mkCache = id => `### 跨批状态\n无\n\n### 逐章事实\n第${id}章|第一章|摘要|${SUMMARY_60}|人物|主角|位置|L1-L10\n\n### 跨章观察\n- 样例\n\n### 自查\n行数对\n\n<!-- teardown:cache-end:批次-01 -->\n`
  const c = join(dir, 'c.md')
  writeFileSync(c, mkCache(3), 'utf8')

  // 场景1：完好——通过且 hash 报 1 章一致
  const ok1 = validate(o, c, aj, csv)
  strictEqual(ok1.pass, true, `完好应过：${ok1.errors.join('; ')}`)
  ok(ok1.checks.hash.includes('1 章重算一致'), `实际 ${ok1.checks.hash}`)

  // 场景2：CSV 第 3 行 sha 被改——拒收
  const lines = readFileSync(csv, 'utf8').split('\n')
  const parts = lines[3].split(',')
  parts[8] = 'deadbeefdead'
  lines[3] = parts.join(',')
  writeFileSync(csv + '.bad', lines.join('\n'), 'utf8')
  const r2 = validate(o, c, aj, csv + '.bad')
  strictEqual(r2.pass, false, 'CSV sha 被改应拒收')
  ok(r2.errors.some(e => e.includes('CSV sha 列与重算不一致')), `实际：${r2.errors.join('; ')}`)

  // 场景3：全局第 3 章原文漂移（audit 后改文件）——拒收（旧 find-by-chNum 会查到卷一第一章而假绿）
  writeFileSync(o, volBook.replace(b3, b3 + '漂移注入'), 'utf8')
  const r3 = validate(o, c, aj, csv)
  strictEqual(r3.pass, false, '该批真实覆盖章漂移应拒收')
  ok(r3.errors.some(e => e.includes('sha 与 audit 不一致')), `实际：${r3.errors.join('; ')}`)
  rmSync(dir, { recursive: true })
})
