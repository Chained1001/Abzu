/**
 * 哈希与稳定读单源(批F,全代码审查 P2-18):原先 sha256 五份等价包装、TOCTOU 稳定读
 * 三份近似拷贝(assembly/source 的 readMaterialFile、retrieval/source 的
 * readCheckedFinalized、reference/storage 的 referenceRead)各自为政——本文件合一。
 *
 * - `sha256Hex`:字符串按 utf8 编码(与原先各处 `update(text,'utf-8'/'utf8')` 逐字节一致),
 *   Buffer/Uint8Array 按原始字节——**指纹逐字节不变**,纯等价替换。
 * - `readStableFile`:fd 钉住＋三段 stat 比对(dev/ino/size/mtimeMs/ctimeMs,nlink 全程
 *   必须 ===1,取原三份实现中最严口径)。失败经 `StableReadError` 分类(not-plain-file/
 *   replaced/changed),由调用方转译为各自领域错误文案——各处错误消息保持原语义。
 *   路径合法性/符号链接检查/大小上限/解码归调用方(域各异,不共用)。
 */

import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

export function sha256Hex(data: string | Buffer | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export type StableReadCode = 'not-plain-file' | 'replaced' | 'changed'

export class StableReadError extends Error {
  constructor(readonly code: StableReadCode, message: string) {
    super(message)
    this.name = 'StableReadError'
  }
}

/**
 * 稳定读:`base` 内相对路径 `rel`(正斜杠分段)的原始字节。
 *
 * 三段比对——open 前 lstat(普通文件、非链接、nlink===1)、open(O_NOFOLLOW)后 fstat 与
 * lstat 比 dev/ino/nlink、读完再 lstat＋fstat 与已打开身份比 dev/ino/size/mtimeMs/
 * ctimeMs/nlink。任一失配抛 `StableReadError`,ENOENT 等原始 errno 照原样抛出。
 */
export function readStableFile(base: string, rel: string): Buffer {
  const target = path.join(base, ...rel.split('/'))
  const initial = fs.lstatSync(target)
  if (!initial.isFile() || initial.isSymbolicLink() || initial.nlink !== 1) {
    throw new StableReadError('not-plain-file', `稳定读目标不是独立普通文件:${rel}`)
  }
  const fd = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0))
  try {
    const opened = fs.fstatSync(fd)
    if (opened.dev !== initial.dev || opened.ino !== initial.ino || opened.nlink !== 1) {
      throw new StableReadError('replaced', `稳定读目标在打开时被替换:${rel}`)
    }
    const bytes = fs.readFileSync(fd)
    const current = fs.lstatSync(target)
    const finished = fs.fstatSync(fd)
    if (!current.isFile() || current.nlink !== 1 || current.dev !== opened.dev || current.ino !== opened.ino
      || finished.nlink !== 1 || finished.size !== opened.size || finished.mtimeMs !== opened.mtimeMs || finished.ctimeMs !== opened.ctimeMs) {
      throw new StableReadError('changed', `稳定读目标在读取期间已变化:${rel}`)
    }
    return bytes
  } finally {
    fs.closeSync(fd)
  }
}
