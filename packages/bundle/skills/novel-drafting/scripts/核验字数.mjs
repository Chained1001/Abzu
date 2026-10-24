// Thin entry: use the plugin's shared counter, with no embedded runtime copy.
const libUrl = new URL('../../../lib/cli.js', import.meta.url)
try {
  const { draftLengthCli } = await import(libUrl)
  process.exitCode = draftLengthCli(process.argv.slice(2))
} catch (err) {
  console.error(`无法加载脚本运行库 lib/cli.js（${libUrl.href}）：${err instanceof Error ? err.message : String(err)}`)
  process.exitCode = 3
}
