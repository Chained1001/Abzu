/* @abzu/polish —— 行为规格见 docs/标准/书仓格式.md(单一真源);本包只放实现 */
export const pkg = '@abzu/polish'

export { applyPolishRules, BANNED_OPENERS, type ApplyRulesResult, type PolishChange } from './rules'
export { checkFidelity, countCjk, extractHardCores, CJK_LOSS_LIMIT, type FidelityRisk } from './fidelity'
export { polishDraft, type PolishInput, type PolishResult } from './run'
