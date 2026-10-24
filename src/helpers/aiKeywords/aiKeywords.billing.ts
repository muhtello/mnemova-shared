import { KEYWORD_PRICE_UNIT_CHARS } from "./aiKeywords.constants";

// Started 10K-character blocks: 0-10,000 chars = 1 unit, 10,001 = 2.
// Mirrors billing_units() in mnemova-agent so the price shown equals the price charged.
export function keywordBillingUnits(contentLength: number): number {
  return Math.max(1, Math.ceil(contentLength / KEYWORD_PRICE_UNIT_CHARS));
}

// AI tokens a detection costs, known before the call: the level's price (ai_tokens from
// GET generate-keywords/options) x started 10K blocks. The agent charges 0 instead
// when no keyword could be grounded in the text, so this is the most it can cost.
export function keywordPrice(aiTokensPerUnit: number, contentLength: number): number {
  return aiTokensPerUnit * keywordBillingUnits(contentLength);
}
