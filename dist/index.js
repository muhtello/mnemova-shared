"use strict";
// Explicit named re-exports (NOT `export *`). The barrel `export *` form compiles to
// __exportStar(), which discovers names at runtime via a for-in loop over the required
// module. Under Metro inlineRequires + Hermes/R8 in release builds, the submodule can be
// only partially initialised when that loop runs, leaving named exports bound to
// `undefined` (e.g. validateEmail became undefined in production, silently breaking auth).
// Explicit `export { x } from` emits a static, lazy getter per name — immune to init order.
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_NS = exports.createI18n = exports.resources = exports.resolveLocale = exports.isRTL = exports.LOCALE_LABELS = exports.RTL_LOCALES = exports.FALLBACK_LOCALE = exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = exports.COUNTRIES = exports.connErrorKey = exports.classifyConnError = exports.resolveTodos = exports.TODO_DEFINITIONS = exports.getUserTier = exports.isEditSessionUsable = exports.generateShortCode = exports.EDIT_SESSION_TTL_MS = exports.deleteAccount = exports.EXERCISE_HELP = exports.getDeckStats = exports.getExerciseStats = exports.buildSyncMessage = exports.updateProfile = exports.ensureProfile = exports.syncRecordResets = exports.syncSessionHistory = exports.syncStudyData = exports.syncDecks = exports.selectNextPool = exports.getRepeatInsertPosition = exports.shouldRepeatHard = exports.shouldRepeatAgain = exports.applyRating = exports.pickFromPool = exports.buildExercisePool = exports.getInitialRecord = exports.resendConfirmationEmail = exports.checkEmailConfirmed = exports.validateEmail = exports.TIER_INFO = exports.TIER_LIMITS = exports.RC_ENTITLEMENT_ID = exports.createDeck = exports.DEFAULT_STUDY_SETTINGS = exports.EXERCISE_META = exports.getDraftFields = void 0;
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
Object.defineProperty(exports, "syncRecordResets", { enumerable: true, get: function () { return sync_helper_1.syncRecordResets; } });
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
var editSession_helper_1 = require("./helpers/editSession.helper");
Object.defineProperty(exports, "EDIT_SESSION_TTL_MS", { enumerable: true, get: function () { return editSession_helper_1.EDIT_SESSION_TTL_MS; } });
Object.defineProperty(exports, "generateShortCode", { enumerable: true, get: function () { return editSession_helper_1.generateShortCode; } });
Object.defineProperty(exports, "isEditSessionUsable", { enumerable: true, get: function () { return editSession_helper_1.isEditSessionUsable; } });
var tier_helper_1 = require("./helpers/tier.helper");
Object.defineProperty(exports, "getUserTier", { enumerable: true, get: function () { return tier_helper_1.getUserTier; } });
var todo_helper_1 = require("./helpers/todo.helper");
Object.defineProperty(exports, "TODO_DEFINITIONS", { enumerable: true, get: function () { return todo_helper_1.TODO_DEFINITIONS; } });
Object.defineProperty(exports, "resolveTodos", { enumerable: true, get: function () { return todo_helper_1.resolveTodos; } });
var connError_helper_1 = require("./helpers/connError.helper");
Object.defineProperty(exports, "classifyConnError", { enumerable: true, get: function () { return connError_helper_1.classifyConnError; } });
Object.defineProperty(exports, "connErrorKey", { enumerable: true, get: function () { return connError_helper_1.connErrorKey; } });
var countries_1 = require("./constants/countries");
Object.defineProperty(exports, "COUNTRIES", { enumerable: true, get: function () { return countries_1.COUNTRIES; } });
var i18n_1 = require("./i18n");
Object.defineProperty(exports, "SUPPORTED_LOCALES", { enumerable: true, get: function () { return i18n_1.SUPPORTED_LOCALES; } });
Object.defineProperty(exports, "DEFAULT_LOCALE", { enumerable: true, get: function () { return i18n_1.DEFAULT_LOCALE; } });
Object.defineProperty(exports, "FALLBACK_LOCALE", { enumerable: true, get: function () { return i18n_1.FALLBACK_LOCALE; } });
Object.defineProperty(exports, "RTL_LOCALES", { enumerable: true, get: function () { return i18n_1.RTL_LOCALES; } });
Object.defineProperty(exports, "LOCALE_LABELS", { enumerable: true, get: function () { return i18n_1.LOCALE_LABELS; } });
Object.defineProperty(exports, "isRTL", { enumerable: true, get: function () { return i18n_1.isRTL; } });
Object.defineProperty(exports, "resolveLocale", { enumerable: true, get: function () { return i18n_1.resolveLocale; } });
Object.defineProperty(exports, "resources", { enumerable: true, get: function () { return i18n_1.resources; } });
Object.defineProperty(exports, "createI18n", { enumerable: true, get: function () { return i18n_1.createI18n; } });
Object.defineProperty(exports, "COMMON_NS", { enumerable: true, get: function () { return i18n_1.COMMON_NS; } });
