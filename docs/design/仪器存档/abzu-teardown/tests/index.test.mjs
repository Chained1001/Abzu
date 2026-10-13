import { test } from 'node:test'
import { strictEqual, ok } from 'node:assert'
import { generate, verify, stats } from '../../skills/abzu-teardown/scripts/teardown/index.mjs'
import { audit } from '../../skills/abzu-teardown/scripts/teardown/audit.mjs'
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const SAMPLE = `第一章 测试
这是开头的内容，足够长以通过空章检测。添加更多文字确保字数超过一百。这是一段测试用的文本，包含足够的内容。还有一些更多的文字来补充字数。

第二章 继续
这里继续。同样足够长以通过检测。这里是更多文字来补充字数，确保达到最低要求。继续添加内容直到超过一百字。这是第二段的补充。

第三章 结束
最后一段。足够长。继续添加文字以满足检测要求。这里是最后的测试数据内容。这里是更多文字来确保长度。这里是补充文字。`

function writeTemp (content, suffix) {
  const dir = mkdtempSync(join(tmpdir(), 'abzu-test-'))
  const file = join(dir, 'test' + suffix)
  writeFileSync(file, content, 'utf8')
  return { file, dir }
}

test('generate — 从 audit 生成空索引', () => {
  const { file: txtFile, dir } = writeTemp(SAMPLE, '.txt')
  const auditResult = audit(txtFile)
  const auditFile = join(dir, 'audit.json')
  writeFileSync(auditFile, JSON.stringify(auditResult), 'utf8')
  const result = generate(auditFile)

  strictEqual(result.total, 3)
  ok(result.csv.includes('全局章序,卷号,卷内章号'))
  ok(result.csv.includes('第一章 测试'))

  const dataLine = result.csv.split('\n')[1]
  strictEqual(dataLine.split(',').length, 12)
  rmSync(dir, { recursive: true })
})

test('verify — 空摘要校验', () => {
  const { file: txtFile, dir } = writeTemp(SAMPLE, '.txt')
  const auditResult = audit(txtFile)
  const auditFile = join(dir, 'audit.json')
  writeFileSync(auditFile, JSON.stringify(auditResult), 'utf8')
  const csvFile = join(dir, 'test.csv')
  generate(auditFile, csvFile)

  const result = verify(auditFile, csvFile)
  strictEqual(result.pass, true)
  strictEqual(result.stats.emptySummaries, 3)
  rmSync(dir, { recursive: true })
})

test('verify — sha 不匹配', () => {
  const { file: txtFile, dir } = writeTemp(SAMPLE, '.txt')
  const auditResult = audit(txtFile)
  const auditFile = join(dir, 'audit.json')
  writeFileSync(auditFile, JSON.stringify(auditResult), 'utf8')
  const csvFile = join(dir, 'test.csv')
  generate(auditFile, csvFile)

  const csv = readFileSync(csvFile, 'utf8')
  const lines = csv.split('\n')
  const parts = lines[1].split(',')
  parts[8] = 'wrongsha123'
  lines[1] = parts.join(',')
  writeFileSync(csvFile, lines.join('\n'), 'utf8')

  const result = verify(auditFile, csvFile)
  ok(result.stats.shaMismatches >= 1)
  rmSync(dir, { recursive: true })
})

test('stats — 填充进度', () => {
  const { file: txtFile, dir } = writeTemp(SAMPLE, '.txt')
  const auditResult = audit(txtFile)
  const auditFile = join(dir, 'audit.json')
  writeFileSync(auditFile, JSON.stringify(auditResult), 'utf8')
  const csvFile = join(dir, 'test.csv')
  generate(auditFile, csvFile)

  const result = stats(csvFile)
  strictEqual(result.total, 3)
  strictEqual(result.summaryFilled, 0)
  strictEqual(result.summaryEmpty, 3)
  strictEqual(result.malformedRows, 0)
  rmSync(dir, { recursive: true })
})

test('verify — 摘要含换行的引号单元格不拆记录', () => {
  const { file: txtFile, dir } = writeTemp(SAMPLE, '.txt')
  const auditResult = audit(txtFile)
  const auditFile = join(dir, 'audit.json')
  writeFileSync(auditFile, JSON.stringify(auditResult), 'utf8')
  const csvFile = join(dir, 'test.csv')
  generate(auditFile, csvFile)

  // 第 1 行摘要填入含换行的引号单元格
  const csv = readFileSync(csvFile, 'utf8')
  const lines = csv.split('\n')
  const parts = lines[1].split(',')
  parts[7] = '"上半句，\n下半句"'
  lines[1] = parts.join(',')
  writeFileSync(csvFile, lines.join('\n'), 'utf8')

  const result = verify(auditFile, csvFile)
  strictEqual(result.pass, true, `合法引号换行不应误报：${result.errors.join('; ')}`)
  strictEqual(result.stats.totalRows, 3, '换行不应拆出多余记录')
  rmSync(dir, { recursive: true })
})
