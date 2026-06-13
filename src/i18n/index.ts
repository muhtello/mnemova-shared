// Explicit named re-exports (NOT `export *`) — same release-safety reason as
// the root barrel: export * compiles to a runtime for-in loop that can bind
// names to undefined under Hermes/R8. See src/index.ts header.

export type { Locale } from "./config";
export {
  SUPPORTED_LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE, RTL_LOCALES,
  LOCALE_LABELS, isRTL, resolveLocale,
} from "./config";

export type { TranslationBundle } from "./resources";
export { resources, COMMON_NS } from "./resources";

export type { CreateI18nOptions, AppResources } from "./createInstance";
export { createI18n } from "./createInstance";
