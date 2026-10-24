/**
 * 打成单文件 ESM 产物,供 dsh 以原生 ESM 直接加载。
 *
 * 宿主侧四入口:lib/index.js(工作台)与 lib/embeddings.js / lib/scenes.js / lib/reranking.js(检索)。
 * 四个 insert id 沿用四包时代取值,迁移零成本。
 * 技能脚本(skills 下各 scripts 目录的 .mjs)是手写薄入口(R21／裁决 A1,2026-09-05)
 * ——运行能力经相对引 lib/index.js,构建尾部只做接缝校验,不再内联任何 core 副本进 skills/。
 *
 * 为什么必须打包(2026-09-01 真机冒烟实证):
 * dsh 用原生 ESM `import()` 吃插件入口,而 Node 的 ESM 解析器不补全扩展名;
 * 本仓 tsconfig 走 moduleResolution: "Bundler",源码里相对导入都无扩展名,
 * 且 `@abzu/core` 是源码直引 —— dsh 端没有 node_modules/@abzu/*。
 * 直接把 dsh-local.yml 指向 src/index.ts 会以 ERR_MODULE_NOT_FOUND 加载失败。
 * 单文件产物同时解掉这两条:相对导入全部内联,跨包依赖一并内联。
 * 形态对齐 dsh 自身插件(@deepseek-ai/dsh-skill-filesystem:main=lib/index.js,产物内零相对导入)。
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isBuiltin } from 'node:module'
import * as esbuild from 'esbuild'
import { writeNotices } from '../../../scripts/release/notices.mjs'
import { thinScripts as THIN_SCRIPTS } from './artifact-contract.mjs'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))

/** dsh 宿主提供的服务面,不进产物。 */
const EXTERNAL = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-tools', '@deepseek-ai/dsh-llm', '@deepseek-ai/dsh-skill-filesystem', 'node:*']

function checkDependencies(result) {
  for (const output of Object.values(result.metafile.outputs)) {
    for (const entry of output.imports.filter(entry => entry.external)) {
      if (!isBuiltin(entry.path) && !manifest.peerDependencies?.[entry.path] && !manifest.dependencies?.[entry.path]) {
        throw new Error(`未声明产物运行依赖: ${entry.path}`)
      }
    }
  }
  const shared = /node_modules\/(?:@deepseek-ai\/(?:cordis|dsh-tools|dsh-llm|dsh-skill-filesystem)\/|react\/)/
  const inlined = Object.keys(result.metafile.inputs).map(input => input.replaceAll('\\', '/'))
  for (const input of inlined) {
    if (shared.test(input)) throw new Error(`共享运行时被内联: ${input}`)
  }
  // 反向一条:peer 依赖由宿主提供,被内联就等于多发一份第二副本(EXTERNAL 漏登记时的静默路径)。
  // 按每个入口的 metafile 判断,比"peer 必须出现在 EXTERNAL 里"更严:某个入口单独漏了 external 也拦得住。
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    if (inlined.some(input => input.includes(`/node_modules/${peer}/`))) {
      throw new Error(`peer 依赖被内联,应放进 EXTERNAL 交给宿主: ${peer}`)
    }
  }
}

async function buildEntry(entry, outfile) {
  const result = await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node22.19',
    format: 'esm',
    external: EXTERNAL,
    sourcemap: false,
    legalComments: 'inline',
    logLevel: 'warning',
    metafile: true,
    // 内联的 CJS 依赖(yaml@2.9.0)内部 require('process') 会落到 esbuild 的 __require
    // 垫片上并在运行时抛 "Dynamic require of X is not supported"(2026-09-01 真机实证)。
    // 注入真 require 让这类调用回到 Node 内置解析。
    banner: {
      js: [
        "import { createRequire as __createRequire } from 'node:module'",
        'const require = __createRequire(import.meta.url)',
      ].join('\n'),
    },
  })
  const bytes = fs.statSync(outfile).size
  checkDependencies(result)
  const inlined = Object.keys(result.metafile.inputs).length
  console.log(`[bundle] ${path.relative(packageRoot, outfile)} ok (${(bytes / 1024).toFixed(1)} KB, 内联 ${inlined} 个模块)`)
  const leftover = /from\s*["']\.[^"']*["']/.exec(fs.readFileSync(outfile, 'utf8'))
  if (leftover !== null) throw new Error(`产物残留相对导入:${leftover[0]}`)
  console.log(`[bundle] 自检:产物内零相对导入 (${path.relative(packageRoot, outfile)})`)
  return result
}

const hostBuilds = []
// 宿主四入口:工作台 + 检索三入口。入口文件与 exports/cordis.patch.yml 四条 insert 一一对应。
for (const [entry, outfile] of [
  ['src/index.ts', 'lib/index.js'],
  ['src/retrieval/index.ts', 'lib/embeddings.js'],
  ['src/retrieval/scenes.ts', 'lib/scenes.js'],
  ['src/retrieval/reranking.ts', 'lib/reranking.js'],
]) {
  hostBuilds.push(await buildEntry(path.join(packageRoot, ...entry.split('/')), path.join(packageRoot, ...outfile.split('/'))))
}

// DSH's native client module loader supplies the shared React runtime.
// 合并入口:工作台 + 检索设置卡片。
const clientBuild = await esbuild.build({
  entryPoints: [path.join(packageRoot, 'src', 'client', 'index.tsx')],
  outfile: path.join(packageRoot, 'lib', 'client.js'),
  platform: 'browser', format: 'cjs', bundle: true, external: ['react'], target: 'chrome110',
  loader: { '.css': 'text' }, minify: true, legalComments: 'inline', metafile: true,
  banner: { js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => { const module = { exports: {} }; const exports = module.exports;` },
  footer: { js: 'return module.exports; } });' },
})
checkDependencies(clientBuild)
const clientBytes = fs.statSync(path.join(packageRoot, 'lib', 'client.js')).size
if (clientBytes > 4 * 1024 * 1024) throw new Error(`合并 Client 超过 4 MiB(${(clientBytes / 1048576).toFixed(2)} MiB);先瘦身再发行`)
console.log(`[bundle] lib/client.js ok (DSH native client module, ${(clientBytes / 1048576).toFixed(2)} MiB)`)

/**
 * 独立 CLI 运行库（2026-10-23）。
 *
 * 技能薄入口用普通 Node 进程直跑，那里没有 dsh 宿主提供的 `@deepseek-ai/*`，所以
 * `lib/index.js`（保留 external 交给宿主）在宿主外必然加载失败。这里单独打一份只依赖
 * Node 内置模块的 `lib/cli.js`，业务实现仍是同一份 `@abzu/core` 源码。
 *
 * `external: ['node:*']` 刻意不写 `@deepseek-ai/*`：写进 external 只会让产物保留裸 import
 * 到运行时才炸，这里要让 esbuild 直接把它们当**错误**报出来。真正的护栏在
 * `checkCliDependencies` 里逐条核对产物与输入集合。
 */
function checkCliDependencies(result) {
  for (const output of Object.values(result.metafile.outputs)) {
    for (const entry of output.imports) {
      if (!isBuiltin(entry.path)) throw new Error(`CLI 产物有非 Node 依赖: ${entry.path}`)
    }
  }
  for (const input of Object.keys(result.metafile.inputs)) {
    const normalized = input.replaceAll('\\', '/')
    if (/(?:^|\/)node_modules\/(?:@deepseek-ai\/|react\/)/.test(normalized)) {
      throw new Error(`CLI 内联了宿主共享运行时: ${input}`)
    }
  }
}

const cliResult = await esbuild.build({
  entryPoints: [path.join(packageRoot, 'src', 'cli.ts')],
  outfile: path.join(packageRoot, 'lib', 'cli.js'),
  bundle: true,
  platform: 'node',
  target: 'node22.19',
  format: 'esm',
  external: ['@deepseek-ai/*', 'react', 'react/*', 'node:*'],
  sourcemap: false,
  legalComments: 'inline',
  logLevel: 'warning',
  metafile: true,
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module'",
      'const require = __createRequire(import.meta.url)',
    ].join('\n'),
  },
})
checkCliDependencies(cliResult)
const cliBytes = fs.statSync(path.join(packageRoot, 'lib', 'cli.js')).size
const cliLeftover = /from\s*["']\.[^"']*["']/.exec(fs.readFileSync(path.join(packageRoot, 'lib', 'cli.js'), 'utf8'))
if (cliLeftover !== null) throw new Error(`CLI 产物残留相对导入:${cliLeftover[0]}`)
console.log(`[bundle] lib/cli.js ok (仅 Node 内置, ${(cliBytes / 1024).toFixed(1)} KB)`)

/**
 * 技能脚本薄入口接缝校验（R21／裁决 A1）。
 *
 * 脚本产物形态已定：skills 下各 scripts 目录的 .mjs 是**手写薄入口**（进 git），运行能力
 * 经相对引插件根 `lib/cli.js`，不再由本构建内联 core 副本。这里逐个校验薄入口与 lib
 * 的接缝（入口存在／引 lib／lib 导出对应能力），防止「删了 re-export、脚本只在运行时才炸」。
 */
const cliText = fs.readFileSync(path.join(packageRoot, 'lib', 'cli.js'), 'utf8')
for (const [rel, fn] of THIN_SCRIPTS) {
  const abs = path.join(packageRoot, ...rel.split('/'))
  if (!fs.existsSync(abs)) throw new Error(`脚本薄入口缺失:${rel}`)
  const text = fs.readFileSync(abs, 'utf8')
  if (!text.includes('lib/cli.js')) throw new Error(`脚本薄入口未引 lib/cli.js:${rel}`)
  if (!cliText.includes(fn)) throw new Error(`lib/cli.js 未导出 ${fn},薄入口将无法加载:${rel}`)
}
console.log(`[bundle] 脚本薄入口接缝校验 ok (${THIN_SCRIPTS.length} 个薄入口 -> lib/cli.js)`)

// 字符串包含不足以证明入口可加载：真正 import 一次产物并核对具名导出。
// 用独立 Node 子进程跑，并剥掉 cwd 的 node_modules 解析路径，模拟装到宿主外。
const cliModule = await import(pathToFileURL(path.join(packageRoot, 'lib', 'cli.js')).href)
for (const [, fn] of THIN_SCRIPTS) {
  if (typeof cliModule[fn] !== 'function') throw new Error(`lib/cli.js 的 ${fn} 不是可调用导出，薄入口会在运行时失败`)
}

writeNotices(packageRoot, [...hostBuilds, clientBuild, cliResult])
// Vendored diagram artwork is source input rather than an npm dependency.
fs.appendFileSync(path.join(packageRoot, 'THIRD_PARTY_NOTICES.md'), '\n## Archify artwork\n\nWriting workflow geometry and semantic styling derive from Archify 3.0.1 (MIT).\nCopyright (c) 2026 tt-a1i (Archify); Copyright (c) 2025 Cocoon AI.\n[Original notice](licenses/archify.txt). Source: https://github.com/tt-a1i/archify\n')
