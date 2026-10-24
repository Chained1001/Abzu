/**
 * 写前十查机械脚本——薄入口（⑥爽点铺垫对账＋⑧近五章重复的机械比对）。
 *
 * 运行能力与插件运行时同属一份 `lib/cli.js`：本文件不内联任何依赖，只按自身位置
 * （<插件根>/skills/novel-outline/scripts/）上溯三级动态引 lib，调其中的 `tenChecksCli`。
 * 只算不写：机械行是候选不是结论，语义判断归主 Agent。调用方式（SKILL.md／agents/写前十查.md）：
 *   node <resourceBase>/scripts/十查机械.mjs --book <bookRoot> --卷 <卷> --章 <章> --章名 <章名>
 * 退出码：0 成功；1 参数缺失/候选缺失/承诺账本解析失败；2 运行异常；3 无法加载插件运行库。
 */
const libUrl = new URL('../../../lib/cli.js', import.meta.url)
try {
  const { tenChecksCli } = await import(libUrl)
  process.exitCode = tenChecksCli(process.argv.slice(2))
} catch (err) {
  console.error(`无法加载脚本运行库 lib/cli.js（${libUrl.href}）：${err instanceof Error ? err.message : String(err)}`)
  process.exitCode = 3
}
