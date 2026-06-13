// Supported UI languages for Mnemova — the single source of truth shared by
// web and mobile. The RTL list drives layout direction (dir="rtl" on web,
// I18nManager.forceRTL on mobile), which each platform applies in its own glue.

export type Locale = "en" | "ar" | "de";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "ar", "de"] as const;

export const DEFAULT_LOCALE: Locale = "en";

// Missing keys in the active locale resolve against this one.
export const FALLBACK_LOCALE: Locale = "en";

// Native display name per locale, for language-switcher UI. Shared so the
// labels aren't duplicated between web and mobile.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
};

// Locales rendered right-to-left.
export const RTL_LOCALES: readonly Locale[] = ["ar"] as const;

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

// Narrows any raw language tag (e.g. a device locale like "ar-EG" or
// "en-US") down to a Locale we actually ship, falling back to the default.
export function resolveLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const base = input.toLowerCase().split("-")[0] as Locale;
  return SUPPORTED_LOCALES.includes(base) ? base : DEFAULT_LOCALE;
}
