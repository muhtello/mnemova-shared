export type Locale = "en" | "ar" | "de";
export declare const SUPPORTED_LOCALES: readonly Locale[];
export declare const DEFAULT_LOCALE: Locale;
export declare const FALLBACK_LOCALE: Locale;
export declare const LOCALE_LABELS: Record<Locale, string>;
export declare const RTL_LOCALES: readonly Locale[];
export declare function isRTL(locale: string): boolean;
export declare function resolveLocale(input: string | null | undefined): Locale;
