/**
 * 草稿清理脚本——薄入口（批8 存量清理）。
 *
 * 运行能力与插件运行时同属一份 `lib/cli.js`：本文件不内联任何依赖，只按自身位置
 * （<插件根>/skills/novel-settle/scripts/）上溯三级动态引 lib，调其中的 `draftCleanupCli`。
 * 默认只算不写：列出「已定稿但草稿区残留」的章键与将删路径计数；`--执行 true` 才逐章
 * 清理（archiveDraftChapter＋草稿区快照留痕）。调用方式（SKILL.md）：
 *   node <resourceBase>/scripts/草稿清理.mjs --book <bookRoot> [--卷 N] [--执行 true]
 * 退出码：0 成功；1 参数缺失/残留章清理失败；2 运行异常；3 无法加载插件运行库。
 */
const libUrl = new URL('../../../lib/cli.js', import.meta.url)
try {
  const { draftCleanupCli } = await import(libUrl)
  process.exitCode = draftCleanupCli(process.argv.slice(2))
} catch (err) {
  console.error(`无法加载脚本运行库 lib/cli.js（${libUrl.href}）：${err instanceof Error ? err.message : String(err)}`)
  process.exitCode = 3
}
