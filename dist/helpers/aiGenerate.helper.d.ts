import type { AiModelTier, AiTokenUsage, AiKeyword } from "../types/aiGenerateType";
import type { Exercise } from "../types/exerciseType";
export declare function estimateTokens(text: string): number;
export declare function estimateCostUsd(usage: AiTokenUsage, model: AiModelTier): number;
export declare function formatUsd(amount: number): string;
export declare function makeId(): string;
export declare function trimSourceText(text: string): string;
export interface KeywordSegment {
    text: string;
    keywordId: string | null;
}
export declare function buildKeywordSegments(text: string, keywords: AiKeyword[]): KeywordSegment[];
export declare function previewFor(exercise: Exercise): string;
