// Match the producer names emitted by DSH's native V3-to-V4 reader.
export const AUTHOR_SAVE_SOURCE = 'plugin:abzu'
export const EDITOR_REQUEST_SOURCE = 'plugin:abzu-editor'

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'plugin:abzu': { kind: typeof AUTHOR_SAVE_SOURCE }
    'plugin:abzu-editor': { kind: typeof EDITOR_REQUEST_SOURCE; requestId: string }
  }
}
