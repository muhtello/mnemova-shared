// Re-exports for backwards compatibility — import from '@mnemova/shared' or the sub-files
// directly. Explicit `export { x }` (not `export *`) so names survive Hermes/R8 release
// builds; see src/index.ts for the full rationale.
export { syncDecks } from './sync/decks'
export { syncStudyData } from './sync/study'
export { syncSessionHistory } from './sync/sessionHistory'
export { syncRecordResets } from './sync/recordResets'
export { ensureProfile, updateProfile } from './sync/profile'
export type { ProfileData, ProfileUpdate } from './sync/profile'
export { buildSyncMessage } from './sync/log'
export type { SyncLog, SyncMessage } from './sync/log'
