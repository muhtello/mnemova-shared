import type { AgentTokenUsage, AiProvider, BillingSummary, Level } from "../../types/aiAgentType";
export interface DetectKeywordsRequest {
    content: string;
    keyword_count?: number;
    provider: AiProvider;
    level: Level;
}
export interface DetectedKeyword {
    text: string;
    start: number;
    end: number;
    count: number;
}
export interface DetectKeywordsResponse {
    keywords: DetectedKeyword[];
    rejected_count: number;
    chunk_count: number;
    provider: AiProvider;
    level: Level;
    model_id: string;
    usage: AgentTokenUsage;
    billing: BillingSummary;
}
