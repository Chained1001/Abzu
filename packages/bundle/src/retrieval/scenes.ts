import type { Context } from '@deepseek-ai/cordis'
import { SceneConfig, resolveSceneSettings } from './auxiliary-config'
import { attachSceneModel } from './auxiliary'

import { SCENE_NAMESPACE } from './ns'
export const name = SCENE_NAMESPACE
export const inject = ['embeddings']
export const Config = SceneConfig.volatile()
export function apply(ctx: Context, config: ReturnType<typeof Config>): void {
  resolveSceneSettings(config.get() ?? {})
  attachSceneModel(ctx, () => config.get() ?? {})
}
