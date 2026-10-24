// ─── mnemova-agent shared shapes ─────────────────────────────────────────────
// Mirrors the agent's Pydantic models used by every billed feature
// (routes/feature_pricing/feature_pricing_types.py, billing/guard/guard.py).
// Web and mobile each had local copies; these are the canonical versions.

// Users pick a LEVEL (never a model) and pay that level's fixed price.
export type Level = "fast" | "balanced" | "best";

// The company behind an answer, shown to users by brand ("Claude"), never the model.
export type AiProvider = "anthropic" | "openai" | "google_genai";

export interface LevelOption {
  level: Level;
  // Price per the feature's unit: call, exercise, or started 10K characters.
  ai_tokens: number;
  pro_only: boolean;
}

export interface ProviderOption {
  provider: AiProvider;
  levels: LevelOption[];
}

// GET /<feature>/options: the AIs the user can pick, each with its levels + fixed price.
export interface FeatureOptions {
  providers: ProviderOption[];
}

// Returned with every billed call so the apps can update the token counter.
export interface BillingSummary {
  ai_tokens_charged: number;
  free_remaining: number;
  balance: number;
}

// Real provider usage the agent reports (users pay the fixed price, not this).
export interface AgentTokenUsage {
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
}

// A keyword sent to POST /generate-exercises.
export interface WeightedKeyword {
  text: string;
  // How many exercises to generate about this keyword. Ignored when `auto` is set.
  count: number;
  // The AI decides the count itself, from how much the text has to test.
  auto?: boolean;
}
