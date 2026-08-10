import type { AiModelTier } from "../types/aiGenerateType";
import type { ExerciseType } from "../types/exerciseType";
export declare const MODEL_PRICING_PER_MILLION: Record<AiModelTier, {
    input: number;
    output: number;
}>;
export declare const OUTPUT_TOKEN_WEIGHT = 5;
export declare function computeWeightedTokens(inputTokens: number, outputTokens: number): number;
export declare const BASE_TOKENS_PER_CREDIT_DRAFT = 100;
export declare function tokensPerCredit(tier: AiModelTier): number;
export declare function creditsForUsage(tier: AiModelTier, inputTokens: number, outputTokens: number): number;
export declare const PRICE_PER_CREDIT_HUNDREDTH_CENTS = 10;
export declare const MIN_PURCHASE_CENTS = 500;
export declare const CREDITS_PER_PURCHASE_UNIT = 100;
export declare function amountCentsForCredits(credits: number): number;
export declare function minCreditsForMinPurchase(): number;
export declare function pricePerHundredCreditsUsd(): number;
export declare const STARTER_GRANT_CREDITS = 450;
export declare const OUTPUT_TOKENS_PER_TYPE: Record<ExerciseType, {
    low: number;
    high: number;
}>;
export declare function estimateInputTokens(sourceText: string, keywordTexts: string[], instructions: string): number;
export interface CreditEstimateRange {
    low: number;
    high: number;
}
export declare function estimateCreditsRange(tier: AiModelTier, estimatedInputTokens: number, exerciseCount: number, exerciseTypes: ExerciseType[]): CreditEstimateRange;
