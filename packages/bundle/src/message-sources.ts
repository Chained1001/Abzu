// Match the producer names emitted by DSH's native V3-to-V4 reader.
export const AUTHOR_SAVE_SOURCE = 'plugin:abzu'
export const EDITOR_REQUEST_SOURCE = 'plugin:abzu-editor'
/**
 * 提案回执(0.0.88):上一轮写入结果回灌。独立 source 的理由——
 * 它不是作者说的话(不是 AUTHOR_SAVE),也不是编辑器请求(不是 EDITOR_REQUEST);
 * 下游若要区分「模型自己看到的事实」与「作者/编辑器发起的事件」,靠这个 source 判定。
 */
export const TOOL_RECEIPT_SOURCE = 'plugin:abzu-receipt'

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'plugin:abzu': { kind: typeof AUTHOR_SAVE_SOURCE }
    'plugin:abzu-editor': { kind: typeof EDITOR_REQUEST_SOURCE; requestId: string }
    'plugin:abzu-receipt': { kind: typeof TOOL_RECEIPT_SOURCE }
  }
}
