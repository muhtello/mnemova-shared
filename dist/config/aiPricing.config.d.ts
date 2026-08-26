import type { AiModelTier } from "../types/aiGenerateType";
import type { ExerciseType } from "../types/exerciseType";
export declare const MODEL_PRICING_PER_MILLION: Record<AiModelTier, {
    input: number;
    output: number;
}>;
export declare const OUTPUT_TOKEN_WEIGHT = 5;
export declare function computeWeightedTokens(inputTokens: number, outputTokens: number): number;
export declare const BASE_RAW_TOKENS_PER_AI_TOKEN_DRAFT = 100;
export declare function rawTokensPerAiToken(tier: AiModelTier): number;
export declare function aiTokensForUsage(tier: AiModelTier, inputTokens: number, outputTokens: number): number;
export declare const PRICE_PER_AI_TOKEN_HUNDREDTH_CENTS = 10;
export declare const MIN_PURCHASE_CENTS = 500;
export declare const AI_TOKENS_PER_PURCHASE_UNIT = 100;
export declare function amountCentsForAiTokens(aiTokens: number): number;
export declare function minAiTokensForMinPurchase(): number;
export declare function pricePerHundredAiTokensUsd(): number;
export declare const STARTER_GRANT_AI_TOKENS = 450;
export declare const OUTPUT_TOKENS_PER_TYPE: Record<ExerciseType, {
    low: number;
    high: number;
}>;
export declare function estimateInputTokens(sourceText: string, keywordTexts: string[], instructions: string): number;
export interface AiTokenEstimateRange {
    low: number;
    high: number;
}
export declare function estimateBaseAiTokenRange(tier: AiModelTier, estimatedInputTokens: number, exerciseCount: number, exerciseTypes: ExerciseType[]): AiTokenEstimateRange;
