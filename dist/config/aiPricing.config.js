"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT_TOKENS_PER_TYPE = exports.STARTER_GRANT_AI_TOKENS = exports.AI_TOKENS_PER_PURCHASE_UNIT = exports.MIN_PURCHASE_CENTS = exports.PRICE_PER_AI_TOKEN_HUNDREDTH_CENTS = exports.BASE_RAW_TOKENS_PER_AI_TOKEN_DRAFT = exports.OUTPUT_TOKEN_WEIGHT = exports.MODEL_PRICING_PER_MILLION = void 0;
exports.computeWeightedTokens = computeWeightedTokens;
exports.rawTokensPerAiToken = rawTokensPerAiToken;
exports.aiTokensForUsage = aiTokensForUsage;
exports.amountCentsForAiTokens = amountCentsForAiTokens;
exports.minAiTokensForMinPurchase = minAiTokensForMinPurchase;
exports.pricePerHundredAiTokensUsd = pricePerHundredAiTokensUsd;
exports.estimateInputTokens = estimateInputTokens;
exports.estimateBaseAiTokenRange = estimateBaseAiTokenRange;
// USD per 1M raw tokens, Anthropic's real billed rate per tier. This is the
// one number that must be kept in sync with Anthropic's actual pricing page —
// everything else below is derived from it.
exports.MODEL_PRICING_PER_MILLION = {
    draft: { input: 1, output: 5 }, // Haiku 4.5
    standard: { input: 3, output: 15 }, // Sonnet 5
    premium: { input: 5, output: 25 }, // Opus 4.8
};
// Output tokens cost 5x input tokens for every tier above (5/1, 15/3, 25/5) —
// weighting output by this factor turns "input + output" into a single
// "weighted raw tokens" number whose real-dollar cost is just
// weightedTokens * MODEL_PRICING_PER_MILLION[tier].input / 1_000_000,
// with no separate output term needed.
exports.OUTPUT_TOKEN_WEIGHT = 5;
function computeWeightedTokens(inputTokens, outputTokens) {
    return inputTokens + exports.OUTPUT_TOKEN_WEIGHT * outputTokens;
}
// How many weighted raw tokens equal 1 AI token, on the draft tier. Raise
// this to make AI tokens go further (cheaper generations in AI-token terms);
// lower it to make each generation cost more AI tokens.
exports.BASE_RAW_TOKENS_PER_AI_TOKEN_DRAFT = 100;
// Derived per-tier rate: standard/premium raw tokens cost more in real
// dollars, so fewer of them make up 1 AI token — keeps the $/AI-token margin
// roughly constant no matter which model tier the user picks. Recomputes
// automatically if MODEL_PRICING_PER_MILLION or the draft base changes.
function rawTokensPerAiToken(tier) {
    const tierMultiplier = exports.MODEL_PRICING_PER_MILLION[tier].input / exports.MODEL_PRICING_PER_MILLION.draft.input;
    return exports.BASE_RAW_TOKENS_PER_AI_TOKEN_DRAFT / tierMultiplier;
}
// Real AI tokens consumed by an actual (post-generation) usage figure. Always
// rounds UP — the app never eats a fractional-AI-token loss on rounding.
function aiTokensForUsage(tier, inputTokens, outputTokens) {
    const weighted = computeWeightedTokens(inputTokens, outputTokens);
    return Math.ceil(weighted / rawTokensPerAiToken(tier));
}
// ─── Stripe purchase pricing ────────────────────────────────────────────────
// Price per AI token, in hundredths of a cent (i.e. 1 unit = $0.00001), so
// the very small AI-token unit above doesn't force fractional-cent constants.
// Calibrated so a $5 pack buys ~5,000 AI tokens ≈ ~33 draft-tier generations —
// matching the pre-token-billing pricing's economics, so existing users don't
// see a de-facto repricing. Raise/lower to change margin.
exports.PRICE_PER_AI_TOKEN_HUNDREDTH_CENTS = 10; // = $0.001 / AI token
exports.MIN_PURCHASE_CENTS = 500; // $5 minimum purchase (business rule)
// Stripe Checkout (mode: 'payment') rejects fractional-cent unit prices
// outright — even via unit_amount_decimal, "more than 2 decimal places" in a
// line item is a hard error. A single AI token is sub-cent, so it can never
// be its own Stripe line item; AI tokens must be sold in blocks priced at a
// whole number of cents. This is that block size — Stripe quantity = AI
// tokens / AI_TOKENS_PER_PURCHASE_UNIT, unit price =
// amountCentsForAiTokens(this) cents. Must stay large enough that
// amountCentsForAiTokens(this) rounds to at least 1 cent; raise it if
// PRICE_PER_AI_TOKEN_HUNDREDTH_CENTS is ever lowered enough that 100 AI
// tokens would round to 0 cents.
exports.AI_TOKENS_PER_PURCHASE_UNIT = 100;
function amountCentsForAiTokens(aiTokens) {
    return Math.round((aiTokens * exports.PRICE_PER_AI_TOKEN_HUNDREDTH_CENTS) / 100);
}
// Smallest AI-token count whose amountCentsForAiTokens() actually clears
// MIN_PURCHASE_CENTS, rounded to a whole number of purchase units (Stripe
// can only sell in AI_TOKENS_PER_PURCHASE_UNIT blocks — see above).
// amountCentsForAiTokens() rounds to the nearest cent, so the true boundary
// can sit a little below the analytic estimate — start a safe margin below
// it and walk up in whole-unit steps to the real boundary against the
// actual charging function, not just the formula.
function minAiTokensForMinPurchase() {
    const estimate = Math.ceil((exports.MIN_PURCHASE_CENTS * 100) / exports.PRICE_PER_AI_TOKEN_HUNDREDTH_CENTS);
    const safeFloor = Math.floor(estimate / exports.AI_TOKENS_PER_PURCHASE_UNIT) * exports.AI_TOKENS_PER_PURCHASE_UNIT;
    let aiTokens = Math.max(exports.AI_TOKENS_PER_PURCHASE_UNIT, safeFloor - 10 * exports.AI_TOKENS_PER_PURCHASE_UNIT);
    while (amountCentsForAiTokens(aiTokens) < exports.MIN_PURCHASE_CENTS)
        aiTokens += exports.AI_TOKENS_PER_PURCHASE_UNIT;
    return aiTokens;
}
// A single AI token is now sub-cent, so "$/AI token" reads as "$0.00" in the
// UI. Display pricing per 100 AI tokens instead — still derived from the one
// knob above, so it can't drift out of sync if the rate changes.
function pricePerHundredAiTokensUsd() {
    return amountCentsForAiTokens(100) / 100;
}
// New-account starter grant, in AI tokens. Chosen to be worth roughly the
// same as the old flat "3 free generations" starter grant (draft tier:
// 3 * ~150 AI tokens/generation ≈ 450).
exports.STARTER_GRANT_AI_TOKENS = 450;
// ─── Pre-generation estimate ────────────────────────────────────────────────
// Output tokens can't be known before the call completes — this gives an AI
// tokens RANGE to show the user ("≈ X-Y AI tokens") before they click
// Generate, not an exact number. Real cost/AI-tokens are always computed from
// Anthropic's actual `usage` after the call.
//
// Range already spans "shortest plausible" (no explanation, minimal fields)
// to "longest plausible" (explanation included, longest fields for that
// type — e.g. order-sentence's full word-split sentence) per exercise type,
// so `includeExplanation` doesn't need its own knob here.
exports.OUTPUT_TOKENS_PER_TYPE = {
    flashcard: { low: 40, high: 100 }, // question + answer, no explanation field
    "fill-in-the-blank": { low: 50, high: 140 },
    "word-pick": { low: 60, high: 160 }, // adds a distractors array
    mcq: { low: 70, high: 200 }, // 2-6 options + answers array
    "order-sentence": { low: 70, high: 220 }, // full sentence split into a words array
};
// Fixed scaffolding sent every request regardless of source text length
// (system prompt instructions, JSON-schema output format) — matters mostly
// for small generations where it isn't dwarfed by the source text itself.
const PROMPT_OVERHEAD_TOKENS = 150;
// Adds keywords + free-text instructions to the input-token estimate — both
// get concatenated into the actual prompt (see generateExercises.ts), so
// omitting them under-counts input tokens for generations that use them.
function estimateInputTokens(sourceText, keywordTexts, instructions) {
    const extraText = [...keywordTexts, instructions].join(" ");
    return (PROMPT_OVERHEAD_TOKENS +
        Math.ceil(sourceText.trim().length / 4) +
        Math.ceil(extraText.trim().length / 4));
}
// Base estimate from source-text/keyword size alone — mnemova-web's
// tokenPricing.ts wraps this to add its own explanation-field surcharge, so
// this stays the un-surcharged base rather than the final displayed range.
function estimateBaseAiTokenRange(tier, estimatedInputTokens, exerciseCount, exerciseTypes) {
    // Empty selection means "all types" (see useExerciseTypeSelection) — span
    // every type's range in that case too.
    const types = exerciseTypes.length > 0 ? exerciseTypes : Object.keys(exports.OUTPUT_TOKENS_PER_TYPE);
    const perExerciseLow = Math.min(...types.map((t) => exports.OUTPUT_TOKENS_PER_TYPE[t].low));
    const perExerciseHigh = Math.max(...types.map((t) => exports.OUTPUT_TOKENS_PER_TYPE[t].high));
    const outputLow = exerciseCount * perExerciseLow;
    const outputHigh = exerciseCount * perExerciseHigh;
    return {
        low: aiTokensForUsage(tier, estimatedInputTokens, outputLow),
        high: aiTokensForUsage(tier, estimatedInputTokens, outputHigh),
    };
}
