// ─── AI Generation Pricing Config ────────────────────────────────────────────
// Single source of truth for AI-credit economics — read by the web server
// (real billing), the web client (pre-generation estimates), and eventually
// mobile once it grows an equivalent AI-generate feature. Everything here is
// a plain exported constant so pricing/margin can be retuned without hunting
// through call sites — bump a number here, republish, both apps pick it up.
//
// Model: users buy "credits" (Stripe). Each generation consumes credits
// proportional to REAL Anthropic token usage, weighted so the charge tracks
// real cost regardless of model tier or output length — not a flat
// per-generation fee. See mnemova-web/app/lib/ai/creditPricing.ts for the
// worked-example margin math behind these numbers.
import type { AiModelTier } from "../types/aiGenerateType";
import type { ExerciseType } from "../types/exerciseType";

// USD per 1M tokens, Anthropic's real billed rate per tier. This is the one
// number that must be kept in sync with Anthropic's actual pricing page —
// everything else below is derived from it.
export const MODEL_PRICING_PER_MILLION: Record<AiModelTier, { input: number; output: number }> = {
  draft: { input: 1, output: 5 }, // Haiku 4.5
  standard: { input: 3, output: 15 }, // Sonnet 5
  premium: { input: 5, output: 25 }, // Opus 4.8
};

// Output tokens cost 5x input tokens for every tier above (5/1, 15/3, 25/5) —
// weighting output by this factor turns "input + output" into a single
// "weighted tokens" number whose real-dollar cost is just
// weightedTokens * MODEL_PRICING_PER_MILLION[tier].input / 1_000_000,
// with no separate output term needed.
export const OUTPUT_TOKEN_WEIGHT = 5;

export function computeWeightedTokens(inputTokens: number, outputTokens: number): number {
  return inputTokens + OUTPUT_TOKEN_WEIGHT * outputTokens;
}

// How many weighted tokens equal 1 credit, on the draft tier. Raise this to
// make credits go further (cheaper generations in credit terms); lower it to
// make each generation cost more credits.
export const BASE_TOKENS_PER_CREDIT_DRAFT = 100;

// Derived per-tier rate: standard/premium tokens cost more in real dollars,
// so fewer of them make up 1 credit — keeps the $/credit margin roughly
// constant no matter which model tier the user picks. Recomputes
// automatically if MODEL_PRICING_PER_MILLION or the draft base changes.
export function tokensPerCredit(tier: AiModelTier): number {
  const tierMultiplier = MODEL_PRICING_PER_MILLION[tier].input / MODEL_PRICING_PER_MILLION.draft.input;
  return BASE_TOKENS_PER_CREDIT_DRAFT / tierMultiplier;
}

// Real credits consumed by an actual (post-generation) usage figure. Always
// rounds UP — the app never eats a fractional-credit loss on rounding.
export function creditsForUsage(tier: AiModelTier, inputTokens: number, outputTokens: number): number {
  const weighted = computeWeightedTokens(inputTokens, outputTokens);
  return Math.ceil(weighted / tokensPerCredit(tier));
}

// ─── Stripe purchase pricing ────────────────────────────────────────────────
// Price per credit, in hundredths of a cent (i.e. 1 unit = $0.00001), so the
// very small credit unit above doesn't force fractional-cent constants.
// Calibrated so a $5 pack buys ~5,000 credits ≈ ~33 draft-tier generations —
// matching the pre-token-billing pricing's economics, so existing users don't
// see a de-facto repricing. Raise/lower to change margin.
export const PRICE_PER_CREDIT_HUNDREDTH_CENTS = 10; // = $0.001 / credit

export const MIN_PURCHASE_CENTS = 500; // $5 minimum purchase (business rule)

// Stripe Checkout (mode: 'payment') rejects fractional-cent unit prices
// outright — even via unit_amount_decimal, "more than 2 decimal places" in a
// line item is a hard error. A single credit is sub-cent, so it can never be
// its own Stripe line item; credits must be sold in blocks priced at a whole
// number of cents. This is that block size — Stripe quantity = credits /
// CREDITS_PER_PURCHASE_UNIT, unit price = amountCentsForCredits(this) cents.
// Must stay large enough that amountCentsForCredits(this) rounds to at least
// 1 cent; raise it if PRICE_PER_CREDIT_HUNDREDTH_CENTS is ever lowered enough
// that 100 credits would round to 0 cents.
export const CREDITS_PER_PURCHASE_UNIT = 100;

export function amountCentsForCredits(credits: number): number {
  return Math.round((credits * PRICE_PER_CREDIT_HUNDREDTH_CENTS) / 100);
}

// Smallest credit count whose amountCentsForCredits() actually clears
// MIN_PURCHASE_CENTS, rounded to a whole number of purchase units (Stripe
// can only sell in CREDITS_PER_PURCHASE_UNIT blocks — see above).
// amountCentsForCredits() rounds to the nearest cent, so the true boundary
// can sit a little below the analytic estimate — start a safe margin below
// it and walk up in whole-unit steps to the real boundary against the
// actual charging function, not just the formula.
export function minCreditsForMinPurchase(): number {
  const estimate = Math.ceil((MIN_PURCHASE_CENTS * 100) / PRICE_PER_CREDIT_HUNDREDTH_CENTS);
  const safeFloor = Math.floor(estimate / CREDITS_PER_PURCHASE_UNIT) * CREDITS_PER_PURCHASE_UNIT;
  let credits = Math.max(CREDITS_PER_PURCHASE_UNIT, safeFloor - 10 * CREDITS_PER_PURCHASE_UNIT);
  while (amountCentsForCredits(credits) < MIN_PURCHASE_CENTS) credits += CREDITS_PER_PURCHASE_UNIT;
  return credits;
}

// A single credit is now sub-cent, so "$/credit" reads as "$0.00" in the UI.
// Display pricing per 100 credits instead — still derived from the one knob
// above, so it can't drift out of sync if the rate changes.
export function pricePerHundredCreditsUsd(): number {
  return amountCentsForCredits(100) / 100;
}

// New-account starter grant, in the new (small) credit unit. Chosen to be
// worth roughly the same as the old flat "3 free generations" starter grant
// (draft tier: 3 * ~150 credits/generation ≈ 450).
export const STARTER_GRANT_CREDITS = 450;

// ─── Pre-generation estimate ────────────────────────────────────────────────
// Output tokens can't be known before the call completes — this gives a
// credits RANGE to show the user ("≈ X-Y credits") before they click
// Generate, not an exact number. Real cost/credits are always computed from
// Anthropic's actual `usage` after the call.
//
// Range already spans "shortest plausible" (no explanation, minimal fields)
// to "longest plausible" (explanation included, longest fields for that
// type — e.g. order-sentence's full word-split sentence) per exercise type,
// so `includeExplanation` doesn't need its own knob here.
export const OUTPUT_TOKENS_PER_TYPE: Record<ExerciseType, { low: number; high: number }> = {
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
export function estimateInputTokens(
  sourceText: string,
  keywordTexts: string[],
  instructions: string,
): number {
  const extraText = [...keywordTexts, instructions].join(" ");
  return (
    PROMPT_OVERHEAD_TOKENS +
    Math.ceil(sourceText.trim().length / 4) +
    Math.ceil(extraText.trim().length / 4)
  );
}

export interface CreditEstimateRange {
  low: number;
  high: number;
}

export function estimateCreditsRange(
  tier: AiModelTier,
  estimatedInputTokens: number,
  exerciseCount: number,
  exerciseTypes: ExerciseType[],
): CreditEstimateRange {
  // Empty selection means "all types" (see useExerciseTypeSelection) — span
  // every type's range in that case too.
  const types = exerciseTypes.length > 0 ? exerciseTypes : (Object.keys(OUTPUT_TOKENS_PER_TYPE) as ExerciseType[]);
  const perExerciseLow = Math.min(...types.map((t) => OUTPUT_TOKENS_PER_TYPE[t].low));
  const perExerciseHigh = Math.max(...types.map((t) => OUTPUT_TOKENS_PER_TYPE[t].high));

  const outputLow = exerciseCount * perExerciseLow;
  const outputHigh = exerciseCount * perExerciseHigh;
  return {
    low: creditsForUsage(tier, estimatedInputTokens, outputLow),
    high: creditsForUsage(tier, estimatedInputTokens, outputHigh),
  };
}
