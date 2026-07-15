import type { AiModelTier, AiTokenUsage, AiKeyword } from "../types/aiGenerateType";
import type { Exercise } from "../types/exerciseType";

// --- Pricing (USD per 1M tokens) ------------------------------------------
// Client-side ESTIMATE only, for UX hints and the session summary. Authoritative
// cost is computed server-side from Anthropic's `usage` response. Keep in sync
// with the server pricing table when the AI layer is wired.
const PRICING: Record<AiModelTier, { input: number; output: number }> = {
  draft: { input: 1, output: 5 }, // Haiku 4.5
  standard: { input: 3, output: 15 }, // Sonnet 5
  premium: { input: 5, output: 25 }, // Opus 4.8
};

// Rough heuristic: ~4 characters per token. Good enough for pre-call estimates;
// never used for billing.
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

export function estimateCostUsd(usage: AiTokenUsage, model: AiModelTier): number {
  const rate = PRICING[model];
  return (
    (usage.inputTokens / 1_000_000) * rate.input +
    (usage.outputTokens / 1_000_000) * rate.output
  );
}

export function formatUsd(amount: number): string {
  // Sub-cent precision — generations are cheap, so show enough digits to matter.
  return `$${amount < 0.01 ? amount.toFixed(4) : amount.toFixed(3)}`;
}

export function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Collapses extra spaces and blank lines to save tokens before sending text
// to the model.
export function trimSourceText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// A run of text that is either plain or covered by one keyword highlight.
export interface KeywordSegment {
  text: string;
  keywordId: string | null;
}

// Splits `text` into segments at each keyword's start/end so a renderer can
// wrap highlighted runs without touching the underlying string.
export function buildKeywordSegments(text: string, keywords: AiKeyword[]): KeywordSegment[] {
  const sorted = [...keywords].sort((a, b) => a.start - b.start);
  const segments: KeywordSegment[] = [];
  let cursor = 0;

  for (const kw of sorted) {
    if (kw.start < cursor || kw.start >= kw.end) continue; // skip overlaps/invalid
    if (kw.start > cursor) segments.push({ text: text.slice(cursor, kw.start), keywordId: null });
    segments.push({ text: text.slice(kw.start, kw.end), keywordId: kw.id });
    cursor = kw.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), keywordId: null });

  return segments;
}

// One-line answer/content preview per exercise type, for a generation review list.
export function previewFor(exercise: Exercise): string {
  switch (exercise.type) {
    case "flashcard":
      return exercise.answer;
    case "fill-in-the-blank":
      return (exercise.blanks ?? [exercise.blank]).filter(Boolean).join(", ");
    case "word-pick":
      return exercise.blanks.join(", ");
    case "mcq":
      return exercise.answers.join(", ");
    case "order-sentence":
      return exercise.words.join(" ");
    default:
      return "";
  }
}
