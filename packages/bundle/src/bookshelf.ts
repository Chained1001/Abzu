/** Shared book discovery and identity resolution; always read from the filesystem. */
export { scanWorkspaceBooks as scanBooks, hasBooks, uniqueBookRoot } from '@abzu/core'
export type { WorkspaceBook as BookOverview } from '@abzu/core'
