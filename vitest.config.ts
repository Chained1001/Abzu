import { defineConfig } from 'vitest/config';
import { mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { diagnosticForks } from './scripts/release/ci-pool.mjs';

// Windows runners expose an 8.3 TEMP alias; fixtures and fault-injection mocks
// must use the same canonical path that the filesystem returns to production.
//
// ABZU_TEST_TEMP: 本机可选覆盖。有些 Windows 机器上系统 %TEMP% 的 ACL 会让 esbuild
// 写不出产物（"Failed to write to output file: ... Access is denied"），连带
// archive-receipt / transaction-process / retcon-retry-receipt / host-loader /
// retrieval-settings 五处整份失败——那是机器环境问题，不是代码问题。把该变量指向
// 仓内目录（如 .tmp/test-temp）即可全绿；不设时行为与 CI 完全一致，不做任何改变。
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
