import i18next, { type i18n, type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import { resources as common, COMMON_NS } from "./resources";
import { DEFAULT_LOCALE, FALLBACK_LOCALE, type Locale } from "./config";

// App-specific bundles, keyed by locale then namespace, e.g.
// { en: { web: { home: { title: "…" } } } }. Merged on top of the shared
// "common" namespace so each app keeps its own screens' strings local.
export type AppResources = Partial<Record<Locale, Record<string, object>>>;

export interface CreateI18nOptions {
  // Initial language. Each platform detects this and passes it in.
  language?: Locale;
  // Skip the react-i18next plugin for non-React usage (scripts, tests).
  withReact?: boolean;
  // The app's own namespaces, merged with the shared "common" namespace.
  resources?: AppResources;
  // Namespace used for unprefixed keys. Defaults to "common"; an app passes
  // its own (e.g. "web") so t("home.title") resolves locally first.
  defaultNS?: string;
}

// Shallow-merges app namespaces into the shared bundles per locale. Each
// namespace is a whole bundle, so namespace-level merge is all we need.
function mergeResources(base: typeof common, extra?: AppResources): Resource {
  if (!extra) return base as Resource;
  const out: Resource = {};
  const locales = new Set([...Object.keys(base), ...Object.keys(extra)]);
  for (const lng of locales) {
    out[lng] = {
      ...(base as Record<string, object>)[lng],
      ...(extra as Record<string, object>)[lng],
    };
  }
  return out;
}

// Builds a configured, isolated i18next instance from the shared resources plus
// any app-specific namespaces. Owns only the config that must be identical on
// every platform; detection, persistence, and RTL stay in each app.
export function createI18n(options: CreateI18nOptions = {}): i18n {
  const { language = DEFAULT_LOCALE, withReact = true, resources: extra, defaultNS = COMMON_NS } = options;
  const merged = mergeResources(common, extra);
  const namespaces = Array.from(
    new Set(Object.values(merged).flatMap((bundle) => Object.keys(bundle))),
  );

  const instance = i18next.createInstance();
  if (withReact) instance.use(initReactI18next);
  // Synchronous: resources are bundled (no async backend), so the instance is
  // ready the moment this returns.
  instance.init({
    resources: merged,
    lng: language,
    fallbackLng: FALLBACK_LOCALE,
    ns: namespaces,
    defaultNS,
    fallbackNS: COMMON_NS, // unprefixed keys missing in defaultNS fall back to shared
    interpolation: { escapeValue: false }, // React escapes for us
    returnNull: false,
  });
  return instance;
}
