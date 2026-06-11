"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSyncMessage = exports.updateProfile = exports.ensureProfile = exports.syncSessionHistory = exports.syncStudyData = exports.syncDecks = void 0;
// Re-exports for backwards compatibility — import from '@mnemova/shared' or the sub-files
// directly. Explicit `export { x }` (not `export *`) so names survive Hermes/R8 release
// builds; see src/index.ts for the full rationale.
var decks_1 = require("./sync/decks");
Object.defineProperty(exports, "syncDecks", { enumerable: true, get: function () { return decks_1.syncDecks; } });
var study_1 = require("./sync/study");
Object.defineProperty(exports, "syncStudyData", { enumerable: true, get: function () { return study_1.syncStudyData; } });
var sessionHistory_1 = require("./sync/sessionHistory");
Object.defineProperty(exports, "syncSessionHistory", { enumerable: true, get: function () { return sessionHistory_1.syncSessionHistory; } });
var profile_1 = require("./sync/profile");
Object.defineProperty(exports, "ensureProfile", { enumerable: true, get: function () { return profile_1.ensureProfile; } });
Object.defineProperty(exports, "updateProfile", { enumerable: true, get: function () { return profile_1.updateProfile; } });
var log_1 = require("./sync/log");
Object.defineProperty(exports, "buildSyncMessage", { enumerable: true, get: function () { return log_1.buildSyncMessage; } });
