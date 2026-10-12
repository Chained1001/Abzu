/**
 * 参考书域工具（四件）：书房参考书族的注册接线，实现见 ../reference/tools。
 */
import { createReferenceTools } from '../reference/tools'
import type { NovelToolDefinition, ToolShared } from './shared'

export function createReferenceToolSet(shared: ToolShared): NovelToolDefinition[] {
  return createReferenceTools(shared.deps)
}
