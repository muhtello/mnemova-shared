// Agent paths, written the way the apps already pass them to their agent proxies
// (no leading slash, e.g. useAgentOptions("generate-exercises/options")).
export const DETECT_KEYWORDS_PATH = "generate-keywords";
export const DETECT_KEYWORDS_OPTIONS_PATH = "generate-keywords/options";

// Size of one 'chars_10k' price unit. Mirrors CHARS_PER_BILLING_UNIT in mnemova-agent
// (routes/generate_keywords/generate_keywords_utils.py); both must change together.
export const KEYWORD_PRICE_UNIT_CHARS = 10_000;

// Request limits enforced by the agent's Pydantic model; checking them client-side
// avoids a billed round-trip that can only end in a 422.
export const KEYWORD_CONTENT_MAX_LENGTH = 300_000;
export const KEYWORD_COUNT_DEFAULT = 20;
export const KEYWORD_COUNT_MIN = 1;
export const KEYWORD_COUNT_MAX = 200;

// Suggested exercises per keyword, as the agent clamps them.
export const DETECTED_KEYWORD_COUNT_MIN = 1;
export const DETECTED_KEYWORD_COUNT_MAX = 3;
