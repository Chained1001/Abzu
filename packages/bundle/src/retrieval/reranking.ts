import type { Context } from '@deepseek-ai/cordis'
import { RerankConfig, resolveRerankSettings } from './auxiliary-config'
import { attachRerankingModel } from './auxiliary'

import { RERANK_NAMESPACE } from './ns'
export const name = RERANK_NAMESPACE
export const inject = ['embeddings', 'credentials']
export const Config = RerankConfig.volatile()
export function apply(ctx: Context, config: ReturnType<typeof Config>): void {
  resolveRerankSettings(config.get() ?? {})
  attachRerankingModel(ctx, () => config.get() ?? {})
}
