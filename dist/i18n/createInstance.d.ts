import { type i18n } from "i18next";
import { type Locale } from "./config";
export type AppResources = Partial<Record<Locale, Record<string, object>>>;
export interface CreateI18nOptions {
    language?: Locale;
    withReact?: boolean;
    resources?: AppResources;
    defaultNS?: string;
}
export declare function createI18n(options?: CreateI18nOptions): i18n;
