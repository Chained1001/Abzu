import * as fs from 'node:fs'

const waitCell = new Int32Array(new SharedArrayBuffer(4))
/**
 * Windows 的 EPERM/EBUSY 重试退避。
 *
 * 原先 5 档共 335ms。实测（2026-10-20，后台索引并发写 state.json）
 * 仍会耗尽 5 次后抛 EPERM：竞争窗口比 335ms 长——VS Code/Defender 之类的
 * 目录扫描、以及另一个索引 worker 正在读同一目录，都能让 rename 持续被拒。
 * 扩到约 2.1s（仍是有界重试，不删除目标、不改权限），正常路径第一次就成功、零成本。
 */
const WINDOWS_RETRY_MS = [10, 25, 50, 100, 150, 250, 400, 500, 600] as const

/** Windows 目录扫描/读句柄可能短暂阻止 rename；有界重试同一原子操作，不改权限或删除目标。 */
export function renameSync(source: string, target: string): void {
  for (let attempt = 0; ; attempt++) {
    try {
      fs.renameSync(source, target)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      const delay = WINDOWS_RETRY_MS[attempt]
      if (process.platform !== 'win32' || (code !== 'EPERM' && code !== 'EBUSY') || delay === undefined) throw error
      Atomics.wait(waitCell, 0, 0, delay)
    }
  }
}
