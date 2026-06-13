import en from "./locales/en.json";
import type { Locale } from "./config";
export declare const COMMON_NS = "common";
export type TranslationBundle = typeof en;
export declare const resources: Record<Locale, {
    common: TranslationBundle;
}>;
