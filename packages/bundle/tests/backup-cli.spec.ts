import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createHash } from 'node:crypto'
import { backupBook } from '@abzu/core'
import { backupCli } from '../src/scripts/backup-cli'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach((root) => { try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch { /* Windows 句柄延迟释放，%TEMP% 残留无害 */ } }) })

const sha = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function fixture(): { ws: string; book: string; study: string; profiles: string } {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-backup-cli-'))
  roots.push(ws)
  const book = path.join(ws, '夜航船')
  const study = path.join(ws, '书房')
  const profiles = path.join(ws, 'profiles')
  fs.mkdirSync(path.join(book, '定稿', '卷01'), { recursive: true })
  fs.mkdirSync(path.join(book, '草稿区', '草稿', '卷01-夜渡'), { recursive: true })
  fs.mkdirSync(path.join(book, '.git', 'objects'), { recursive: true })
  fs.writeFileSync(path.join(book, '定稿', '卷01', '0001-夜渡.md'), '第一章。\n', 'utf-8')
  fs.writeFileSync(path.join(book, '草稿区', '草稿', '卷01-夜渡', '稿1.md'), '草稿一。\n', 'utf-8')
  fs.writeFileSync(path.join(book, '.git', 'objects', 'stub'), 'git-obj', 'utf-8')
  fs.mkdirSync(path.join(study, '灵感池'), { recursive: true })
  fs.mkdirSync(path.join(study, '.git', 'objects'), { recursive: true })
  fs.writeFileSync(path.join(study, '灵感池', '守则.md'), '夜航船不夜行。\n', 'utf-8')
  fs.writeFileSync(path.join(study, '.git', 'objects', 'stub'), 'study-git-obj', 'utf-8')
  fs.mkdirSync(profiles, { recursive: true })
  fs.writeFileSync(path.join(profiles, '风格.md'), 'profile。\n', 'utf-8')
  return { ws, book, study, profiles }
}

function invoke(args: string[]): { code: number; data?: Record<string, unknown> } {
  const output = vi.spyOn(console, 'log').mockImplementation(() => {})
  const code = backupCli(args)
  expect(output).toHaveBeenCalledTimes(code === 0 ? 1 : 0)
  const data = code === 0 ? JSON.parse(String(output.mock.calls[0]![0])) as Record<string, unknown> : undefined
  output.mockRestore()
  return { code, data }
}

describe('一键备份 CLI(数据保护三件套 #3)', () => {
  it('打包完整性:书仓含 .git＋草稿区 git,书房含 .git,profiles 带上;manifest 逐文件 sha256＋清单最后落盘', () => {
    const { ws, book } = fixture()
    const { code, data } = invoke(['--book', book])
    expect(code).toBe(0)
    expect(data!.ok).toBe(true)
    expect(data!.含书房).toBe(true)
    expect(data!.含profiles).toBe(true)
    const out = String(data!.输出目录)
    expect(path.basename(out)).toMatch(/^夜航船-\d{8}-\d{6}$/)
    expect(path.dirname(out)).toBe(path.join(ws, '备份'))
    const manifestPath = path.join(out, 'manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { 文件数: number; 条目: Array<{ 路径: string; sha256: string; 字节: number }> }
    expect(manifest.文件数).toBe(data!.文件数)
    expect(manifest.文件数).toBe(6)
    const paths = manifest.条目.map((e) => e.路径)
    for (const expected of ['书仓/定稿/卷01/0001-夜渡.md', '书仓/草稿区/草稿/卷01-夜渡/稿1.md', '书仓/.git/objects/stub', '书房/灵感池/守则.md', '书房/.git/objects/stub', 'profiles/风格.md']) {
      expect(paths, `备份清单应含 ${expected}`).toContain(expected)
    }
    for (const entry of manifest.条目) {
      const copied = path.join(out, ...entry.路径.split('/'))
      expect(fs.existsSync(copied), `${entry.路径} 应已复制`).toBe(true)
      expect(sha(copied), `${entry.路径} 哈希应与 manifest 一致`).toBe(entry.sha256)
      expect(fs.statSync(copied).size).toBe(entry.字节)
    }
  })

  it('幂等:同一备份根两次备份互不覆盖,第二次落新目录名', () => {
    const { book, ws } = fixture()
    const first = invoke(['--book', book])
    expect(first.code).toBe(0)
    const second = invoke(['--book', book])
    expect(second.code).toBe(0)
    const dir1 = String(first.data!.输出目录)
    const dir2 = String(second.data!.输出目录)
    expect(fs.existsSync(dir1)).toBe(true)
    expect(fs.existsSync(dir2)).toBe(true)
    if (path.basename(dir1) === path.basename(dir2)) {
      // 同一秒内两次备份:靠 -2 序号保证新目录名
      expect(dir2).not.toBe(dir1)
    }
    expect(fs.readdirSync(path.join(ws, '备份')).length).toBe(2)
  })

  it('书房可选:无 书房/ 兄弟目录时照常备份且如实报告未含', () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'abzu-backup-nostudy-'))
    roots.push(ws)
    const book = path.join(ws, '孤本')
    fs.mkdirSync(path.join(book, '定稿', '卷01'), { recursive: true })
    fs.writeFileSync(path.join(book, '定稿', '卷01', '0001-章.md'), '正文。\n', 'utf-8')
    const { code, data } = invoke(['--book', book])
    expect(code).toBe(0)
    expect(data!.含书房).toBe(false)
    expect(fs.readdirSync(String(data!.输出目录))).toEqual(['manifest.json', '书仓'])
  })

  it('参数纪律:缺 --book 或未知选项拒绝(退出码 1)', () => {
    expect(invoke([]).code).toBe(1)
    expect(invoke(['--book']).code).toBe(1)
    expect(invoke(['--book', 'x', '--未知', 'y']).code).toBe(1)
  })

  it('输出目录落在被备份目录内拒绝(防自我嵌套);--目标 可指定外部备份根', () => {
    const { ws, book } = fixture()
    const inside = path.join(book, '定稿', '备份位')
    const bad = invoke(['--book', book, '--目标', inside])
    expect(bad.code).toBe(1)
    const external = path.join(ws, '外置备份')
    const ok = invoke(['--book', book, '--目标', external])
    expect(ok.code).toBe(0)
    expect(String(ok.data!.输出目录).startsWith(external)).toBe(true)
  })

  it('core 直调 backupBook 同口径:输出目录＋校验计数与 CLI 一致', () => {
    const { book } = fixture()
    const report = backupBook(book)
    expect(report.ok).toBe(true)
    if (!report.ok) return
    expect(report.校验.一致).toBe(report.文件数)
    expect(report.校验.不一致).toEqual([])
    expect(fs.existsSync(path.join(report.输出目录, 'manifest.json'))).toBe(true)
  })
})
