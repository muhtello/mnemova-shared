import type { AiKeyword } from "../../types/aiGenerateType";
import type { WeightedKeyword } from "../../types/aiAgentType";
import type { DetectedKeyword } from "./aiKeywords.types";
export declare function validateDetectedKeywords(content: string, keywords: DetectedKeyword[]): DetectedKeyword[];
export declare function toWeightedKeywords(detected: DetectedKeyword[]): WeightedKeyword[];
export declare function toAiKeywords(detected: DetectedKeyword[], createId?: () => string): AiKeyword[];
export declare function mergeKeywords(existing: AiKeyword[], detected: DetectedKeyword[], createId?: () => string): AiKeyword[];
