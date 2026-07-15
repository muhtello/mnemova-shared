export type AiModelTier = "draft" | "standard" | "premium";
export interface AiKeyword {
    id: string;
    text: string;
    start: number;
    end: number;
    count: number;
}
export interface SubDocument {
    id: string;
    label: string;
    text: string;
    keywords: AiKeyword[];
}
export interface AiTokenUsage {
    inputTokens: number;
    outputTokens: number;
}
export interface AiSessionCostEntry {
    id: string;
    date: string;
    subDocumentId: string;
    model: AiModelTier;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
}
