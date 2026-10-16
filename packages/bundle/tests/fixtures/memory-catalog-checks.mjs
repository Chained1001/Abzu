import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * 0.0.50：作者层记忆已删除——会话开始不再注入「作者记忆目录」快照；
 * 本测试只验证书层目录随 `novel_select_book` 结果返回、普通查询不附带、
 * 以及任何会话事件里都不再出现作者记忆目录消息。
 */
export async function checkMemoryCatalog({ host, ctx, workspace, book, service, execute, check, report, withTurn }) {
  const { LlmAdapter, createUserMessage } = await import(host === undefined
    ? '@deepseek-ai/dsh-llm' : pathToFileURL(host.entry('@deepseek-ai/dsh-llm')).href)
  class CatalogAdapter extends LlmAdapter {
    async *stream() {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: '已读取上下文。' }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: '已读取上下文。' } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    }
  }
  const releaseAdapter = service('llm').registerAdapter(['catalog-fixture'], new CatalogAdapter())
  const agentOptions = { provider: 'catalog-fixture', model: 'fixture' }
  const entry = (dir, name, fields, body) => {
    fs.mkdirSync(dir, { recursive: true })
    const head = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    fs.writeFileSync(path.join(dir, `${name}.md`), `---\n${head}\n---\n\n${body}\n`)
  }
  const index = (dir, title, rows) => fs.writeFileSync(path.join(dir, '索引.md'), `# ${title}\n\n${rows.map(([n, d]) => `- [${n}](${n}.md) — ${d}`).join('\n')}\n`)
  const catalogMessages = agent => Array.from({ length: agent.session.seq }, (_, i) => agent.session.eventAt(i))
    .filter(event => event.type === 'user/message' && String(event.data.source?.kind) === 'plugin:abzu-memory-catalog')
  const runTurn = async agent => {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { off(); reject(new Error('catalog fixture turn timeout')) }, 10000)
      const off = ctx.on('agent/status', ({ agent: subject, status }) => {
        if (subject !== agent || status !== 'idle') return
        clearTimeout(timer); off(); resolve()
      })
      agent.followup(createUserMessage({ content: [{ type: 'text', text: '核对本次上下文。' }], source: { kind: 'user' } }))
    })
  }
  await check('本书记忆目录随选书返回，作者记忆目录注入已删除', async () => {
    entry(path.join(book, '本书记忆'), '不写系统', { 名称: '不写系统', 类: '决策', 状态: '已确认', 来源: '定稿/卷01/0001-开篇.md', 裁决记录: '作者批准' }, '全书无系统面板。')
    index(path.join(book, '本书记忆'), '本书记忆索引', [['不写系统', '类：决策｜来源：定稿/卷01/0001-开篇.md']])
    const created = await service('agents').create({ sessionId: 'loader-memory', meta: { cwd: workspace }, agentOptions })
    const agent = created.agent
    try {
      // 会话开始：不再注入任何作者记忆目录消息（0.0.50 删除）
      await runTurn(agent)
      assert.equal(catalogMessages(agent).length, 0)
      const assembly = await service('systemPrompt').assemble({ agent, scope: agent })
      assert.equal(assembly.contexts.filter(c => c.name === 'abzu.memory').length, 0)
      // 选书：结果附本书目录（选书时快照）；普通查询不附
      const selected = await withTurn(agent, () => execute(agent, 'novel_select_book', { bookId: 'loader-book' }))
      assert.equal(selected.value.ok, true, JSON.stringify(selected))
      assert.match(selected.value.记忆目录, /【本书记忆目录】选书时/)
      assert.match(selected.value.记忆目录, /- 不写系统 — （缺描述）｜类：决策/)
      assert.ok(selected.value.记忆目录.includes(path.join(book, '本书记忆', '索引.md')))
      assert.doesNotMatch(selected.value.记忆目录, /全书无系统面板/)
      const status = await withTurn(agent, () => execute(agent, 'novel_get_story_status', { bookId: 'loader-book' }))
      assert.equal(status.value.ok, true)
      assert.equal(status.value.记忆目录, undefined)
      assert.equal(catalogMessages(agent).length, 0)
      const delegated = await service('agents').create({ parentAgent: agent, sessionId: 'loader-memory-child', meta: { cwd: workspace }, agentOptions })
      try { await runTurn(delegated.agent); assert.equal(catalogMessages(delegated.agent).length, 0) } finally { await delegated.dispose() }
      report.memoryCatalog = { authorCatalogRemoved: true, selectBookCatalog: true, statusWithoutCatalog: true, delegatedCatalogAbsent: true }
    } finally { await created.dispose(); releaseAdapter() }
  })
}
