export {
  checkContractComplete,
  contractTemplate,
  writeContract,
  prepareContract,
  type ContractPart,
  type ContractPartState,
  type ContractParts,
} from './contract'
export { seedMinDesign, type SeedMinDesignInput } from './seed'
// C-01：显式列表（不用 `export *`）——visibleLines / hasThirdLevelHeading 是 core 内部口径，
// 不进 barrel，保证 net 公开符号集与改造前一个不多一个不少（R2 收口）。
export {
  checkChapterLength,
  chapterLengthIdentity,
  parseChapterLength,
  readChapterLength,
  renderChapterLength,
  type ChapterLengthCheck,
  type ChapterLengthPolicy,
  type ChapterLengthRange,
} from './chapter-length'
export { updateSkeleton, updateVolumeLayout, prepareSkeleton, prepareVolumeLayout, prepareDesignDoc, type DesignWriteResult } from './skeleton'
export {
  actOutlineGaps,
  checkVolumeReady,
  planTimelineBody,
  volumeOutlineGaps,
  幕纲必备段,
  卷纲脚手架段,
  writePlanTimeline,
  writeRecentWindow,
  writeVolumeOutline,
  prepareActOutline,
  preparePlanTimeline,
  prepareRecentWindow,
  prepareVolumeOutline,
  prepareVolumeSummary,
  type TimelineAnchor,
  type TimelineEvent,
  type WindowItem,
} from './volume'
export {
  checkWorldbookMinComplete,
  ensureModulesDeclared,
  writeEntry,
  prepareEntry,
  type WorldbookEntryFields,
  type 世界书性质,
} from './worldbook'
