"use strict";
// Explicit named re-exports (NOT `export *`). The barrel `export *` form compiles to
// __exportStar(), which discovers names at runtime via a for-in loop over the required
// module. Under Metro inlineRequires + Hermes/R8 in release builds, the submodule can be
// only partially initialised when that loop runs, leaving named exports bound to
// `undefined` (e.g. validateEmail became undefined in production, silently breaking auth).
// Explicit `export { x } from` emits a static, lazy getter per name — immune to init order.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTier = exports.deleteAccount = exports.EXERCISE_HELP = exports.getDeckStats = exports.getExerciseStats = exports.buildSyncMessage = exports.updateProfile = exports.ensureProfile = exports.syncSessionHistory = exports.syncStudyData = exports.syncDecks = exports.selectNextPool = exports.getRepeatInsertPosition = exports.shouldRepeatHard = exports.shouldRepeatAgain = exports.applyRating = exports.pickFromPool = exports.buildExercisePool = exports.getInitialRecord = exports.resendConfirmationEmail = exports.checkEmailConfirmed = exports.validateEmail = exports.TIER_INFO = exports.TIER_LIMITS = exports.RC_ENTITLEMENT_ID = exports.createDeck = exports.DEFAULT_STUDY_SETTINGS = exports.EXERCISE_META = exports.getDraftFields = void 0;
var exerciseType_1 = require("./types/exerciseType");
Object.defineProperty(exports, "getDraftFields", { enumerable: true, get: function () { return exerciseType_1.getDraftFields; } });
Object.defineProperty(exports, "EXERCISE_META", { enumerable: true, get: function () { return exerciseType_1.EXERCISE_META; } });
var settingType_1 = require("./types/settingType");
Object.defineProperty(exports, "DEFAULT_STUDY_SETTINGS", { enumerable: true, get: function () { return settingType_1.DEFAULT_STUDY_SETTINGS; } });
var deckType_1 = require("./types/deckType");
Object.defineProperty(exports, "createDeck", { enumerable: true, get: function () { return deckType_1.createDeck; } });
var tierType_1 = require("./types/tierType");
Object.defineProperty(exports, "RC_ENTITLEMENT_ID", { enumerable: true, get: function () { return tierType_1.RC_ENTITLEMENT_ID; } });
Object.defineProperty(exports, "TIER_LIMITS", { enumerable: true, get: function () { return tierType_1.TIER_LIMITS; } });
Object.defineProperty(exports, "TIER_INFO", { enumerable: true, get: function () { return tierType_1.TIER_INFO; } });
// ─── Helpers ──────────────────────────────────────────────────────────────────
var auth_helper_1 = require("./helpers/auth.helper");
Object.defineProperty(exports, "validateEmail", { enumerable: true, get: function () { return auth_helper_1.validateEmail; } });
Object.defineProperty(exports, "checkEmailConfirmed", { enumerable: true, get: function () { return auth_helper_1.checkEmailConfirmed; } });
Object.defineProperty(exports, "resendConfirmationEmail", { enumerable: true, get: function () { return auth_helper_1.resendConfirmationEmail; } });
var study_helper_1 = require("./helpers/study.helper");
Object.defineProperty(exports, "getInitialRecord", { enumerable: true, get: function () { return study_helper_1.getInitialRecord; } });
Object.defineProperty(exports, "buildExercisePool", { enumerable: true, get: function () { return study_helper_1.buildExercisePool; } });
Object.defineProperty(exports, "pickFromPool", { enumerable: true, get: function () { return study_helper_1.pickFromPool; } });
Object.defineProperty(exports, "applyRating", { enumerable: true, get: function () { return study_helper_1.applyRating; } });
Object.defineProperty(exports, "shouldRepeatAgain", { enumerable: true, get: function () { return study_helper_1.shouldRepeatAgain; } });
Object.defineProperty(exports, "shouldRepeatHard", { enumerable: true, get: function () { return study_helper_1.shouldRepeatHard; } });
Object.defineProperty(exports, "getRepeatInsertPosition", { enumerable: true, get: function () { return study_helper_1.getRepeatInsertPosition; } });
Object.defineProperty(exports, "selectNextPool", { enumerable: true, get: function () { return study_helper_1.selectNextPool; } });
var sync_helper_1 = require("./helpers/sync.helper");
Object.defineProperty(exports, "syncDecks", { enumerable: true, get: function () { return sync_helper_1.syncDecks; } });
Object.defineProperty(exports, "syncStudyData", { enumerable: true, get: function () { return sync_helper_1.syncStudyData; } });
Object.defineProperty(exports, "syncSessionHistory", { enumerable: true, get: function () { return sync_helper_1.syncSessionHistory; } });
Object.defineProperty(exports, "ensureProfile", { enumerable: true, get: function () { return sync_helper_1.ensureProfile; } });
Object.defineProperty(exports, "updateProfile", { enumerable: true, get: function () { return sync_helper_1.updateProfile; } });
Object.defineProperty(exports, "buildSyncMessage", { enumerable: true, get: function () { return sync_helper_1.buildSyncMessage; } });
var stats_helper_1 = require("./helpers/stats.helper");
Object.defineProperty(exports, "getExerciseStats", { enumerable: true, get: function () { return stats_helper_1.getExerciseStats; } });
Object.defineProperty(exports, "getDeckStats", { enumerable: true, get: function () { return stats_helper_1.getDeckStats; } });
var exerciseHelp_1 = require("./helpers/exerciseHelp");
Object.defineProperty(exports, "EXERCISE_HELP", { enumerable: true, get: function () { return exerciseHelp_1.EXERCISE_HELP; } });
var deleteAccount_1 = require("./helpers/deleteAccount");
Object.defineProperty(exports, "deleteAccount", { enumerable: true, get: function () { return deleteAccount_1.deleteAccount; } });
var tier_helper_1 = require("./helpers/tier.helper");
Object.defineProperty(exports, "getUserTier", { enumerable: true, get: function () { return tier_helper_1.getUserTier; } });
