import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { build } from 'esbuild'
import { execFile } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { removeSync } from '../../core/src/repo/remove'
import { testScratchDir } from '../../core/tests/helpers/scratch'
import { loadSourceHost } from '../scripts/dsh-source.mjs'
import { linkFixtureDependencies } from './fixtures/fixture-dependencies.mjs'

const run = promisify(execFile)
const packageRoot = path.resolve(__dirname, '..')
const checks = [
  '真实 Loader 与基线版本',
  '主 Agent 工具与全局隔离',
  '子 Agent 工具拒绝与真实 never 策略',
  '真实问答拒绝受委派调用',
  '作者裁决与本次调用绑定',
  'Loader 卸载重载等价',
  '随包技能发现、资源、覆盖优先级与卸载重载',
  '运行时归属优先于历史 origin',
  '同一会话恢复后重新装机',
  '问答依赖卸载与重载',
  '审批依赖晚到仍拒绝子 Agent',
  '真实文件工具动作授权与审计',
  '文件动作预取消与等待中取消',
  '作者裁决预取消与迟到批准',
  '工作区注册、别名与非法 cwd',
  '裁决服务失败不写真源',
  '真实提案与补偿提交',
  '七类设计文件复用原生观察与 design 提交',
  '作者保存和落盘前并发修改使旧观察失效',
  '读观察按会话隔离且普通嵌套调用不能绕过门禁',
  '原生写入后提交失败可原样重跑且不重复升版',
  '多文件改稿保留事务且不拆成原生单文件写入',
  '纯处置保留证据、拒绝旧记录并允许上游保留',
  '本书记忆目录随选书返回，作者记忆目录注入已删除',
  '补充原文预览保存、恢复审读与源变化失效',
  '参考小说真实文件服务、配置模型与私有原文边界',
  '最小导出合集清单、范围冲突与确定重跑',
  '当前宿主中文候选生成编辑确认与失败恢复',
  '定稿检索真实权限、关键词与原文定位',
  '独立嵌入提供方真实 HTTP 混合检索与配置刷新',
  '嵌入提供方卸载、晚到与取消不污染缓存',
  '宿主场景模型、独立缓存与可选重排完整接线',
  '工作区依赖重启交回旧根',
  '原生文件工具对子 Agent 的边界',
  '工具服务重启后重新装机',
  '原生对话恢复后继续',
] as const

interface LoaderReport {
  node: string
  checks: Record<string, { ok: boolean; error?: string }>
  [key: string]: unknown
}

let root: string
let report: LoaderReport

function linkHostDependencies(fixtureRoot: string) {
  const source = process.env['ABZU_DSH_SOURCE']
  if (source === undefined) {
    linkFixtureDependencies(packageRoot, fixtureRoot)
  } else {
    const host = loadSourceHost(source)
    fs.mkdirSync(path.join(fixtureRoot, 'node_modules', '@deepseek-ai'), { recursive: true })
    for (const name of ['cordis', 'dsh-tools', 'dsh-llm', 'dsh-credentials', 'dsh-skill-filesystem', 'dsh-working-directory']) {
      fs.symlinkSync(host.get(`@deepseek-ai/${name}`).directory, path.join(fixtureRoot, 'node_modules', '@deepseek-ai', name), 'junction')
    }
  }
}

beforeAll(async () => {
  // 走仓内 .tmp：esbuild 产物写系统 %TEMP% 在本机会 Access is denied（详见 helpers/scratch.ts）
  root = testScratchDir('abzu-loader')
  const workspace = path.join(root, 'workspace')
  fs.mkdirSync(workspace)
  // 沙箱只允许写仓内，所以 root 必然在仓内、其祖先链上有本仓的 `.git`。
  // findProjectRoot 只认 `.git` 并一路向上找，在仓内跑时每次都会命中仓根，
  // 于是「项目根」指向了 Abzu 仓而不是 fixture workspace——单个 check 已用临时 .git 标记绕开
  // （见 host-loader.mjs 的说明），但其余 check 仍要反复走这条向上查找。
  // 这里在 workspace 落一个常驻标记，把项目根截断在 fixture 内：语义更接近 CI（TEMP 在仓外），
  // 也避免整份用例因为仓内运行而慢一倍以上。
  fs.writeFileSync(path.join(workspace, '.git'), 'gitdir: ../.fixture-not-a-repo\n', 'utf8')
  linkHostDependencies(root)
  const outfile = path.join(root, 'lib', 'abzu.mjs')
  fs.cpSync(path.join(packageRoot, 'skills'), path.join(root, 'skills'), { recursive: true })
  await build({
    entryPoints: {
      'lib/abzu': path.join(packageRoot, 'src', 'index.ts'),
      'native-write-core': path.join(packageRoot, 'tests/fixtures/native-write-core.ts'),
      'embedding-provider': path.join(packageRoot, 'src', 'retrieval', 'index.ts'),
      scenes: path.join(packageRoot, 'src', 'retrieval', 'scenes.ts'),
      reranking: path.join(packageRoot, 'src', 'retrieval', 'reranking.ts'),
    },
    outdir: root,
    outExtension: { '.js': '.mjs' },
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-tools', '@deepseek-ai/dsh-llm', '@deepseek-ai/dsh-credentials', '@deepseek-ai/dsh-skill-filesystem', 'node:*'],
    legalComments: 'none',
    banner: { js: "import { createRequire as __createRequire } from 'node:module'\nconst require = __createRequire(import.meta.url)" },
  })
  const result = await run(process.execPath, [
    path.join(packageRoot, 'tests', 'fixtures', 'host-loader.mjs'), root, outfile,
  ], {
    cwd: workspace,
    env: { ...process.env, DSH_HOME: path.join(root, '.dsh'), DSH_AGENTS_HOME: path.join(root, '.agents'), DSH_TELEMETRY_DISABLED: '1' },
    // The shared process runs 35 integration scenarios, including native settings
    // reloads and local HTTP. Keep a total bound without treating it as one test.
    // 2026-10-15 实测：全套 87.3s / 89.7s / 92.8s / 94.1s，90s 预算已在悬崖上，
    // 满载那跑在第 26/37 个 check 被判超时 SIGTERM（逐条断言都是绿的，死的是预算）。
    // 当时提到 120s。
    // 2026-10-20 复核：这台机器上稳定要 115.5s 跑完全部 37 条，120s 只剩 4.5s 余量，
    // 于是「偶发失败」其实是长期贴着预算跑——实测连续三次都是 123.5~124.3s 被杀，
    // report 里 34/35 个 check 已 ok:true、停在最后一个场景。**不是实现失败**。
    // 2026-10-21 定案：240s 这个数其实是当时误判的产物（那时以为是纯预算不足）。
    // 真正的原因有两层，都已修掉：
    //   ① 沙箱只允许写仓内，root 必然在仓内 → findProjectRoot 反复向上命中外层仓，
    //      整份用例慢一倍以上；现在 workspace 里落 .git 标记把项目根截断在 fixture 内。
    //   ② 宿主 dsh-atomic-write 写 cordis.patch.yml 时的 1.1s 重试在满载时不够，
    //      偶发 EPERM 假红；现在 fixture 侧对瞬时文件错误再兜一层重试。
    // 修完实测：单独 112~156s、全量并发 2 遍均全绿，故预算收到 180s（约 1.6 倍余量）。
    // 保留 180s 而不是贴着实测值：慢机器/CI 上仍要有余量，但也不能大到掩盖真回归。
    timeout: 180_000,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  }).catch((error: unknown) => {
    const partialPath = path.join(root, 'report.json')
    const partial = fs.existsSync(partialPath) ? fs.readFileSync(partialPath, 'utf8') : '(report not created)'
    const reportPath = process.env['ABZU_LOADER_REPORT']
    if (reportPath !== undefined) fs.writeFileSync(path.resolve(reportPath), partial)
    throw new Error(`Loader process failed; last progress report:\n${partial}`, { cause: error })
  })
  report = JSON.parse(fs.readFileSync(path.join(root, 'report.json'), 'utf8')) as LoaderReport
  const reportPath = process.env['ABZU_LOADER_REPORT']
  if (reportPath !== undefined) fs.writeFileSync(path.resolve(reportPath), JSON.stringify({ ...report, stdout: result.stdout, stderr: result.stderr }, null, 2))
  expect(result.stderr).not.toContain('UNHANDLED')
  // hook 预算必须大于子进程预算（含 esbuild 构建），否则子进程还没到点、hook 先被判超时。
  // 子进程 180s，构建另需数秒，故 hook 取 240s。
}, 240_000)

afterAll(() => {
  if (root === undefined) return
  // removeSync uses lstat and unlinks package junctions without following them.
  removeSync(root)
})

describe('真实 DSH Loader 验收（独立进程）', () => {
  it('#167 作者保存后重复空操作结束轮次，新的作者委托仍可正常修改', async () => {
    const loopRoot = testScratchDir('abzu-save-loop')
    try {
      linkHostDependencies(loopRoot)
      for (const file of ['native-write-core.mjs', 'embedding-provider.mjs', 'scenes.mjs', 'reranking.mjs']) fs.copyFileSync(path.join(root, file), path.join(loopRoot, file))
      await run(process.execPath, [path.join(packageRoot, 'tests/fixtures/host-loader.mjs'), loopRoot, path.join(root, 'lib/abzu.mjs'), 'save-loop'], {
        cwd: loopRoot, env: { ...process.env, DSH_HOME: path.join(loopRoot, '.dsh'), DSH_AGENTS_HOME: path.join(loopRoot, '.agents'), DSH_TELEMETRY_DISABLED: '1' },
        timeout: 45000, windowsHide: true, maxBuffer: 2 * 1024 * 1024,
      })
      const result = JSON.parse(fs.readFileSync(path.join(loopRoot, 'report.json'), 'utf8'))
      expect(result.checks['保存后的重复空操作终止且下一轮可修改']).toEqual({ ok: true })
      expect(result.saveLoop).toMatchObject({ repeatedTurnRequests: 3, totalRequests: 6, noExtraCommit: true, nextTurnChanged: true })
      expect(result.saveInspection).toMatchObject({ notificationReceived: true, nativeReadCalls: 2, impactReferences: ['故事剧情/全书大纲.md'], noAutomaticWrites: true })
    } finally { removeSync(loopRoot) }
  }, 60000)

  for (const name of checks) {
    it(name, () => {
      expect(report.checks[name], report.checks[name]?.error).toEqual({ ok: true })
    })
  }
})
