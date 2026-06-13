import en from "./locales/en.json";
import ar from "./locales/ar.json";
import de from "./locales/de.json";
import type { Locale } from "./config";

// i18next expects { [locale]: { [namespace]: bundle } }. Shared strings live in
// the "common" namespace; each app merges its own namespaces (e.g. "web",
// "mobile") on top at init via createI18n. `en` is the reference shape; other
// locales are cast to it so a missing key falls back at runtime rather than
// failing the build.
export const COMMON_NS = "common";

export type TranslationBundle = typeof en;

export const resources: Record<Locale, { common: TranslationBundle }> = {
  en: { common: en },
  ar: { common: ar as TranslationBundle },
  de: { common: de as TranslationBundle },
};
