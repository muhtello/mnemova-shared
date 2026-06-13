"use strict";
// Supported UI languages for Mnemova — the single source of truth shared by
// web and mobile. The RTL list drives layout direction (dir="rtl" on web,
// I18nManager.forceRTL on mobile), which each platform applies in its own glue.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTL_LOCALES = exports.LOCALE_LABELS = exports.FALLBACK_LOCALE = exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = void 0;
exports.isRTL = isRTL;
exports.resolveLocale = resolveLocale;
exports.SUPPORTED_LOCALES = ["en", "ar", "de"];
exports.DEFAULT_LOCALE = "en";
// Missing keys in the active locale resolve against this one.
exports.FALLBACK_LOCALE = "en";
// Native display name per locale, for language-switcher UI. Shared so the
// labels aren't duplicated between web and mobile.
exports.LOCALE_LABELS = {
    en: "English",
    ar: "العربية",
    de: "Deutsch",
};
// Locales rendered right-to-left.
exports.RTL_LOCALES = ["ar"];
function isRTL(locale) {
    return exports.RTL_LOCALES.includes(locale);
}
// Narrows any raw language tag (e.g. a device locale like "ar-EG" or
// "en-US") down to a Locale we actually ship, falling back to the default.
function resolveLocale(input) {
    if (!input)
        return exports.DEFAULT_LOCALE;
    const base = input.toLowerCase().split("-")[0];
    return exports.SUPPORTED_LOCALES.includes(base) ? base : exports.DEFAULT_LOCALE;
}
