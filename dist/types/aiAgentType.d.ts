export type Level = "fast" | "balanced" | "best";
export type AiProvider = "anthropic" | "openai" | "google_genai";
export interface LevelOption {
    level: Level;
    ai_tokens: number;
    pro_only: boolean;
}
export interface ProviderOption {
    provider: AiProvider;
    levels: LevelOption[];
}
export interface FeatureOptions {
    providers: ProviderOption[];
}
export interface BillingSummary {
    ai_tokens_charged: number;
    free_remaining: number;
    balance: number;
}
export interface AgentTokenUsage {
    input_tokens: number;
    output_tokens: number;
    cached_input_tokens: number;
}
export interface WeightedKeyword {
    text: string;
    count: number;
    auto?: boolean;
}
