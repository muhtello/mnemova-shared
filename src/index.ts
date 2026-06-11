// Explicit named re-exports (NOT `export *`). The barrel `export *` form compiles to
// __exportStar(), which discovers names at runtime via a for-in loop over the required
// module. Under Metro inlineRequires + Hermes/R8 in release builds, the submodule can be
// only partially initialised when that loop runs, leaving named exports bound to
// `undefined` (e.g. validateEmail became undefined in production, silently breaking auth).
// Explicit `export { x } from` emits a static, lazy getter per name — immune to init order.

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ExerciseType, FillableField, BaseExercise, FlashcardExercise,
  FillInTheBlankExercise, WordPickExercise, McqExercise, OrderSentenceExercise, Exercise,
} from "./types/exerciseType";
export { getDraftFields, EXERCISE_META } from "./types/exerciseType";

export type { RepeatMode, RepeatStrategy, StudySettings } from "./types/settingType";
export { DEFAULT_STUDY_SETTINGS } from "./types/settingType";

export type {
  CardRating, CardRecord, QueueItem, SessionStats, AttemptLog, RecordReset, SessionLog,
} from "./types/studyType";

export type { Deck } from "./types/deckType";
export { createDeck } from "./types/deckType";

export type { Tier, SubscriptionStatus, UserTierRow } from "./types/tierType";
export { RC_ENTITLEMENT_ID, TIER_LIMITS, TIER_INFO } from "./types/tierType";

export type { ExerciseStatus, ExerciseStats, DeckStats } from "./types/statsType";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export {
  validateEmail, checkEmailConfirmed, resendConfirmationEmail,
} from "./helpers/auth.helper";

export {
  getInitialRecord, buildExercisePool, pickFromPool, applyRating,
  shouldRepeatAgain, shouldRepeatHard, getRepeatInsertPosition, selectNextPool,
} from "./helpers/study.helper";

export {
  syncDecks, syncStudyData, syncSessionHistory, ensureProfile, updateProfile, buildSyncMessage,
} from "./helpers/sync.helper";
export type { ProfileData, ProfileUpdate, SyncLog, SyncMessage } from "./helpers/sync.helper";

export { getExerciseStats, getDeckStats } from "./helpers/stats.helper";

export type { FieldHelp, ExerciseTypeHelp } from "./helpers/exerciseHelp";
export { EXERCISE_HELP } from "./helpers/exerciseHelp";

export { deleteAccount } from "./helpers/deleteAccount";

export { getUserTier } from "./helpers/tier.helper";
export type { UserTierResult } from "./helpers/tier.helper";
