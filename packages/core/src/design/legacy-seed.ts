/** Recognize the entire old seed plan, never infer provenance from an event name. */
import { parseDocument } from '../repo/frontmatter'

export function isLegacySeedPlan(text: string): boolean {
  const original = '# 计划时间线\n\n## 窗口覆盖\n\n- 开篇任务（先后:最先）\n\n## 窗口外锚点\n\n- 卷末锚点'
  // 0.0.57 起计划时间线带 frontmatter 版本字段(seed 同批):比对前剥 frontmatter 取正文;
  // 旧文件无 frontmatter,解析失败按原文比(两代同判)。
  const parsed = parseDocument(text)
  const body = parsed.ok ? parsed.data.body : text
  return body.replace(/\r\n/g, '\n').trim() === original
}
