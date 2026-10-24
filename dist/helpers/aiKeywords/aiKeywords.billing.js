"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordBillingUnits = keywordBillingUnits;
exports.keywordPrice = keywordPrice;
const aiKeywords_constants_1 = require("./aiKeywords.constants");
// Started 10K-character blocks: 0-10,000 chars = 1 unit, 10,001 = 2.
// Mirrors billing_units() in mnemova-agent so the price shown equals the price charged.
function keywordBillingUnits(contentLength) {
    return Math.max(1, Math.ceil(contentLength / aiKeywords_constants_1.KEYWORD_PRICE_UNIT_CHARS));
}
// AI tokens a detection costs, known before the call: the level's price (ai_tokens from
// GET generate-keywords/options) x started 10K blocks. The agent charges 0 instead
// when no keyword could be grounded in the text, so this is the most it can cost.
function keywordPrice(aiTokensPerUnit, contentLength) {
    return aiTokensPerUnit * keywordBillingUnits(contentLength);
}
