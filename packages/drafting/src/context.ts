/**
 * 草稿干净上下文(插件规格 §5):写稿只收确认细纲 + 材料包,不含审核/讨论。
 */

import {
  hardConstraintCore,
  parseOutline,
  paths,
  readBookText,
  type ChapterKey,
} from '@abzu/core'
import { loadMaterialPackage } from '@abzu/core'

export interface DraftContext {
  readonly 细纲: string
  readonly 材料段: Readonly<Record<string, string>>
  readonly 硬约束: readonly string[]
}

export function loadDraftContext(bookRoot: string, key: Pick<ChapterKey, '卷' | '章' | '章名'>): DraftContext {
  const 细纲Rel = paths.确认细纲(key.卷, key.章, key.章名)
  // Y5(批F):读原语单源(core readBookText,剥 BOM)——外部编辑器带 BOM 保存的细纲
  // 不再让硬约束解析整段失配;读失败仍按无细纲(与原判据一致)。
  const outlineText = readBookText(bookRoot, 细纲Rel)
  const 细纲 = outlineText.ok ? outlineText.text : ''
  const parsed = 细纲 === '' ? null : parseOutline(细纲)
  const 硬约束 = parsed === null
    ? []
    : parsed.constraints.filter((c) => c.mark === '硬').map((c) => hardConstraintCore(c.line)).filter((s) => s !== '')

  const materials = loadMaterialPackage(bookRoot, key)
  const 材料段: Record<string, string> = { ...materials.段 }
  const 清单 = materials.清单
  if (清单 !== null) 材料段['材料清单'] = 清单

  return { 细纲, 材料段, 硬约束 }
}
