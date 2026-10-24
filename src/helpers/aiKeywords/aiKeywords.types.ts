import type { AgentTokenUsage, AiProvider, BillingSummary, Level } from "../../types/aiAgentType";

// Mirrors mnemova-agent's keyword models
// (routes/generate_keywords/generate_keywords_detect_types.py).

// Body of the billed POST /generate-keywords.
export interface DetectKeywordsRequest {
  // Whole deck content, exactly as stored: the returned offsets refer to this string.
  content: string;
  // 1..200, the agent defaults to 20 when omitted.
  keyword_count?: number;
  provider: AiProvider;
  level: Level;
}

// `content.slice(start, end) === text`, so it highlights as-is.
export interface DetectedKeyword {
  text: string;
  start: number;
  end: number;
  // Suggested exercises for this concept, 1-3.
  count: number;
}

export interface DetectKeywordsResponse {
  keywords: DetectedKeyword[]; // in text order
  // Quoted by the model but not found in the text (dropped by the agent).
  rejected_count: number;
  chunk_count: number;
  provider: AiProvider;
  level: Level;
  model_id: string;
  usage: AgentTokenUsage;
  billing: BillingSummary;
}
