/**
 * 一键备份脚本——薄入口（数据保护三件套 #3）。
 *
 * 运行能力与插件运行时同属一份 `lib/index.js`：本文件不内联任何依赖，只按自身位置
 * （<插件根>/skills/novel-export/scripts/）上溯三级动态引 lib，调其中的 `backupCli`。
 * 只读复制源目录，输出到新目录不覆盖既有备份；调用方式（SKILL.md）：
 *   node <resourceBase>/scripts/一键备份.mjs --book <bookRoot> [--书房 <workspaceRoot>] [--目标 <输出目录>]
 * 退出码：0 成功；1 参数缺失/前置不满足/备份未完成；2 运行异常；3 无法加载插件运行库。
 */
const libUrl = new URL('../../../lib/index.js', import.meta.url)
try {
  const { backupCli } = await import(libUrl)
  process.exitCode = backupCli(process.argv.slice(2))
} catch (err) {
  console.error(`无法加载插件运行库 lib/index.js（${libUrl.href}）：${err instanceof Error ? err.message : String(err)}`)
  process.exitCode = 3
}
