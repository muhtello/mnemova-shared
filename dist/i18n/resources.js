"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resources = exports.COMMON_NS = void 0;
const en_json_1 = __importDefault(require("./locales/en.json"));
const ar_json_1 = __importDefault(require("./locales/ar.json"));
const de_json_1 = __importDefault(require("./locales/de.json"));
// i18next expects { [locale]: { [namespace]: bundle } }. Shared strings live in
// the "common" namespace; each app merges its own namespaces (e.g. "web",
// "mobile") on top at init via createI18n. `en` is the reference shape; other
// locales are cast to it so a missing key falls back at runtime rather than
// failing the build.
exports.COMMON_NS = "common";
exports.resources = {
    en: { common: en_json_1.default },
    ar: { common: ar_json_1.default },
    de: { common: de_json_1.default },
};
