"use strict";
// Explicit named re-exports (NOT `export *`) — same release-safety reason as
// the root barrel: export * compiles to a runtime for-in loop that can bind
// names to undefined under Hermes/R8. See src/index.ts header.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createI18n = exports.COMMON_NS = exports.resources = exports.resolveLocale = exports.isRTL = exports.LOCALE_LABELS = exports.RTL_LOCALES = exports.FALLBACK_LOCALE = exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = void 0;
var config_1 = require("./config");
Object.defineProperty(exports, "SUPPORTED_LOCALES", { enumerable: true, get: function () { return config_1.SUPPORTED_LOCALES; } });
Object.defineProperty(exports, "DEFAULT_LOCALE", { enumerable: true, get: function () { return config_1.DEFAULT_LOCALE; } });
Object.defineProperty(exports, "FALLBACK_LOCALE", { enumerable: true, get: function () { return config_1.FALLBACK_LOCALE; } });
Object.defineProperty(exports, "RTL_LOCALES", { enumerable: true, get: function () { return config_1.RTL_LOCALES; } });
Object.defineProperty(exports, "LOCALE_LABELS", { enumerable: true, get: function () { return config_1.LOCALE_LABELS; } });
Object.defineProperty(exports, "isRTL", { enumerable: true, get: function () { return config_1.isRTL; } });
Object.defineProperty(exports, "resolveLocale", { enumerable: true, get: function () { return config_1.resolveLocale; } });
var resources_1 = require("./resources");
Object.defineProperty(exports, "resources", { enumerable: true, get: function () { return resources_1.resources; } });
Object.defineProperty(exports, "COMMON_NS", { enumerable: true, get: function () { return resources_1.COMMON_NS; } });
var createInstance_1 = require("./createInstance");
Object.defineProperty(exports, "createI18n", { enumerable: true, get: function () { return createInstance_1.createI18n; } });
