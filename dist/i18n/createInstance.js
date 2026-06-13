"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createI18n = createI18n;
const i18next_1 = __importDefault(require("i18next"));
const react_i18next_1 = require("react-i18next");
const resources_1 = require("./resources");
const config_1 = require("./config");
// Shallow-merges app namespaces into the shared bundles per locale. Each
// namespace is a whole bundle, so namespace-level merge is all we need.
function mergeResources(base, extra) {
    if (!extra)
        return base;
    const out = {};
    const locales = new Set([...Object.keys(base), ...Object.keys(extra)]);
    for (const lng of locales) {
        out[lng] = Object.assign(Object.assign({}, base[lng]), extra[lng]);
    }
    return out;
}
// Builds a configured, isolated i18next instance from the shared resources plus
// any app-specific namespaces. Owns only the config that must be identical on
// every platform; detection, persistence, and RTL stay in each app.
function createI18n(options = {}) {
    const { language = config_1.DEFAULT_LOCALE, withReact = true, resources: extra, defaultNS = resources_1.COMMON_NS } = options;
    const merged = mergeResources(resources_1.resources, extra);
    const namespaces = Array.from(new Set(Object.values(merged).flatMap((bundle) => Object.keys(bundle))));
    const instance = i18next_1.default.createInstance();
    if (withReact)
        instance.use(react_i18next_1.initReactI18next);
    // Synchronous: resources are bundled (no async backend), so the instance is
    // ready the moment this returns.
    instance.init({
        resources: merged,
        lng: language,
        fallbackLng: config_1.FALLBACK_LOCALE,
        ns: namespaces,
        defaultNS,
        fallbackNS: resources_1.COMMON_NS, // unprefixed keys missing in defaultNS fall back to shared
        interpolation: { escapeValue: false }, // React escapes for us
        returnNull: false,
    });
    return instance;
}
