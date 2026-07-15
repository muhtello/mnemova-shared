// ─── AI Exercise Generation Types ────────────────────────────────────────────
// Pure TypeScript — no framework dependencies. Shared so mobile can build an
// equivalent AI-generate flow later without re-declaring these shapes.

// Quality tiers map to Claude models server-side (draft→Haiku, standard→Sonnet,
// premium→Opus). Kept abstract so no client ever hardcodes a model id.
export type AiModelTier = "draft" | "standard" | "premium";

// A concept the user wants the AI to focus on, created by highlighting text
// in the source deck. `start`/`end` are character offsets into the source
// deck text (not the working document's own text), so they stay valid no
// matter how the working document is edited.
export interface AiKeyword {
  id: string;
  text: string;
  start: number;
  end: number;
  // How many exercises to generate specifically about this keyword.
  count: number;
}

// The working document: a slice of source text the AI generates from. Kept
// prompt-cache friendly by generating against the same text repeatedly.
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

// One row of the per-session cost ledger, shown in the UI summary.
export interface AiSessionCostEntry {
  id: string;
  date: string; // ISO timestamp
  subDocumentId: string;
  model: AiModelTier;
  inputTokens: number;
  outputTokens: number;
  costUsd: number; // real cost from the server's Anthropic `usage` response
}
