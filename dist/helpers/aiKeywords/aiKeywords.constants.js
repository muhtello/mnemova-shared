"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETECTED_KEYWORD_COUNT_MAX = exports.DETECTED_KEYWORD_COUNT_MIN = exports.KEYWORD_COUNT_MAX = exports.KEYWORD_COUNT_MIN = exports.KEYWORD_COUNT_DEFAULT = exports.KEYWORD_CONTENT_MAX_LENGTH = exports.KEYWORD_PRICE_UNIT_CHARS = exports.DETECT_KEYWORDS_OPTIONS_PATH = exports.DETECT_KEYWORDS_PATH = void 0;
// Agent paths, written the way the apps already pass them to their agent proxies
// (no leading slash, e.g. useAgentOptions("generate-exercises/options")).
exports.DETECT_KEYWORDS_PATH = "generate-keywords";
exports.DETECT_KEYWORDS_OPTIONS_PATH = "generate-keywords/options";
// Size of one 'chars_10k' price unit. Mirrors CHARS_PER_BILLING_UNIT in mnemova-agent
// (routes/generate_keywords/generate_keywords_utils.py); both must change together.
exports.KEYWORD_PRICE_UNIT_CHARS = 10000;
// Request limits enforced by the agent's Pydantic model; checking them client-side
// avoids a billed round-trip that can only end in a 422.
exports.KEYWORD_CONTENT_MAX_LENGTH = 300000;
exports.KEYWORD_COUNT_DEFAULT = 20;
exports.KEYWORD_COUNT_MIN = 1;
exports.KEYWORD_COUNT_MAX = 200;
// Suggested exercises per keyword, as the agent clamps them.
exports.DETECTED_KEYWORD_COUNT_MIN = 1;
exports.DETECTED_KEYWORD_COUNT_MAX = 3;
