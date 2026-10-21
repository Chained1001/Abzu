import { defineConfig } from 'vitest/config';
import { mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { diagnosticForks } from './scripts/release/ci-pool.mjs';

// Windows runners expose an 8.3 TEMP alias; fixtures and fault-injection mocks
// must use the same canonical path that the filesystem returns to production.
//
// 关于「esbuild 写系统 %TEMP% 报 Access is denied」（2026-10-20 复核，结论已修正）：
// 早前这里把它归为「系统 %TEMP% 的 ACL 问题」，实测不成立——同目录下 Node 自己的
// writeFileSync 成功、esbuild 的 transformSync（不落盘）也成功，只有 **esbuild 落盘**
// 到系统 %TEMP% 失败（buildSync 走独立 Go 进程写文件，具体拦截来源未查明）。
// 因此那五处受影响的用例（archive-receipt / transaction-process / retcon-retry-receipt /
// host-loader / retrieval-settings）已改为用 core/tests/helpers/scratch.ts 的
// testScratchDir()，默认把产物建在仓内 .tmp/ 下——**不再依赖任何环境变量**。
//
// ABZU_TEST_TEMP 保留为可选覆盖：仍会把子进程的 TEMP/TMP/TMPDIR 指向指定目录，
// 供其余纯 Node 写入的夹具使用（如需要复现 CI 的路径、或把临时文件挪出系统盘）。
// 不设时行为与 CI 完全一致，不做任何改变。
const tempOverride = process.env['ABZU_TEST_TEMP'];
const testTemp = tempOverride === undefined || tempOverride === ''
  ? realpathSync.native(tmpdir())
  : (mkdirSync(tempOverride, { recursive: true }), realpathSync.native(tempOverride));
const diagnostics = fileURLToPath(new URL('./.tmp/ci', import.meta.url));
if (process.env['CI']) mkdirSync(diagnostics, { recursive: true });

export default defineConfig({
  test: {
    include: ['packages/*/tests/**/*.spec.ts', 'packages/*/src/**/*.spec.ts'],
    environment: 'node',
    // Many integration files spawn Git/Node processes; bound contention on CI.
    maxWorkers: process.env['CI'] ? 2 : 4,
    pool: process.env['CI'] ? diagnosticForks(diagnostics) : 'forks',
    // Keep process isolation; fatal Node reports omit environment values.
    execArgv: process.env['CI'] ? ['--report-on-fatalerror', '--report-exclude-env', `--report-directory=${diagnostics}`] : [],
    // Windows runners with 2 workers can take >15s on single integration cases; 30s avoids
    // false reds while still catching real hangs (CI job cap 20min).
    testTimeout: 30_000,
    // afterAll fixture removal retries on slow Windows runners can exceed the 10s default.
    hookTimeout: 60_000,
    env: { TEMP: testTemp, TMP: testTemp, TMPDIR: testTemp },
  },
});
