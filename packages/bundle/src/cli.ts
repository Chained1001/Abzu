/**
 * 技能脚本的独立运行库入口。
 *
 * 技能侧的薄入口（`skills/*\/scripts/*.mjs`）用 `node <resourceBase>/scripts/xxx.mjs` 直跑，
 * 那是个**普通 Node 进程**，没有 dsh 宿主的 `node_modules`。而 `lib/index.js` 把
 * `@deepseek-ai/{cordis,dsh-tools,dsh-llm,dsh-skill-filesystem}` 留作 external 交给宿主提供
 * （宿主侧必须如此，否则会多发一份第二副本）。两条约束合起来就是：薄入口不能指向
 * `lib/index.js`，否则装到宿主外一跑就 `Cannot find package '@deepseek-ai/...'`。
 *
 * 这个入口单独打一份 `lib/cli.js`，把全部 CLI 能力内联成**只依赖 Node 内置模块**的产物。
 * 业务实现仍是同一份源码（`@abzu/core` 等），不复制逻辑；两边只在打包边界上分开。
 *
 * 只导出 CLI 函数，不导出任何工具定义或 cordis 服务——那些带宿主运行时，进不来。
 */
export { draftLengthCli } from './scripts/draft-length-cli'
export { runChecksCli } from './scripts/deterministic-checks'
export { analyzeImpactCli } from './scripts/impact-cli'
export { materialsCli } from './scripts/materials-cli'
export { tenChecksCli } from './scripts/ten-checks-cli'
export { packCli } from './scripts/pack-cli'
export { draftCleanupCli } from './scripts/draft-cleanup-cli'
export { volumeSummaryCli } from './scripts/volume-summary-cli'
export { exportCli } from './scripts/export-cli'
export { backupCli } from './scripts/backup-cli'
