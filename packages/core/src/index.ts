/* @abzu/core —— 核心服务(M0:书仓/推导/配置最小)。行为规格见 docs/标准/书仓格式.md。 */
export * from './repo/draft-length'
export * from './repo/draft-git'
export * from './repo/backup'
export * from './repo/paths'
export * from './repo/draft-paths'
export * from './repo/draft-cleanup'
export * from './repo/frontmatter'
export * from './repo/atomic'
export * from './repo/transaction'
export * from './repo/lock'
export * from './repo/sourceRef'
export * from './repo/hash'
export * from './repo/schema'
export * from './derive/states'
export * from './derive/scan'
export * from './derive/derive'
export * from './derive/design'
// 逐名书写（工程规范 §8.1：禁止新增 export *）
export {
  回执结论上限,
  回执条数上限,
  写入类工具,
  是否需要回执,
  造回执,
  追加回执,
  空累积,
  渲染回执,
  type 回执条目,
  type 回执累积,
} from './derive/receipt'
export * from './provenance'
export * from './config/resolve'
export * from './gate'
export * from './arbitration'
export * from './commit'
export * from './inspire'
export * from './memory/book'
export * from './memory/catalog'
export * from './progress'
export * from './book'
export * from './design'
export * from './outline'
export * from './assembly'
export * from './evidence'
export * from './export'
export * from './revise'
export * from './prepare'
export * from './settlement'
export * from './ledger'
export * from './impact'
export * from './summary'
export * from './recovery'
export type { EmbeddingInput, EmbeddingProvider, SceneProvider, RerankingProvider, FinalizedSearchResult, FinalizedSearchHit } from './retrieval/types'
export { forgetSceneBoundaries } from './retrieval/scene-sync'
export { forgetSnapshotCache } from './retrieval/cache'
export { searchFinalized, type SearchOptions } from './retrieval/search'
export { syncFinalizedIndex, type SyncIndexOptions, type SyncIndexResult } from './retrieval/sync'
export { readIndexState, changeIndexState, emptyIndexState, type IndexAction, type IndexSyncState, type IndexFailure, type IndexNotice } from './retrieval/state'
export { embeddingRevision } from './retrieval/embedding'
export { indexFailure, DEFAULT_INDEX_RETRY, type IndexRetryPolicy } from './retrieval/retry'
export {
  CANDIDATE_HEADING,
  composeBody,
  countPendingReviewDrafts,
  countProseText,
  demoteOtherPendingDrafts,
  findPendingReviewDraft,
  listChapterDrafts,
  nextDraftFileName,
  prepareDraftDemotions,
  splitCandidateFacts,
  草稿字段序,
  type DraftFile,
  type ProseTextCounts,
} from './repo/drafts'

export { scanWorkspaceBooks, uniqueBookRoot, hasBooks, type WorkspaceBook } from './book/identity'
export { readBookText, readBookTextOrNull, type BookTextResult } from './repo/read'
export * from './reference'
