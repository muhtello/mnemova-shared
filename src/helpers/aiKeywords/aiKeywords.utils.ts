import type { AiKeyword } from "../../types/aiGenerateType";
import type { WeightedKeyword } from "../../types/aiAgentType";
import { makeId } from "../aiGenerate.helper";
import { DETECTED_KEYWORD_COUNT_MAX, DETECTED_KEYWORD_COUNT_MIN } from "./aiKeywords.constants";
import type { DetectedKeyword } from "./aiKeywords.types";

interface Span {
  start: number;
  end: number;
}

// Same key as the agent's _dedup_key: case- and whitespace-insensitive, so "Cell  wall"
// and "cell wall" count as one keyword.
function dedupKey(text: string): string {
  return text.toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}

function clampCount(count: number): number {
  const rounded = Number.isFinite(count) ? Math.round(count) : DETECTED_KEYWORD_COUNT_MIN;
  return Math.min(Math.max(rounded, DETECTED_KEYWORD_COUNT_MIN), DETECTED_KEYWORD_COUNT_MAX);
}

// Half-open ranges [start, end): touching keywords ("cell" + " wall") don't overlap.
function overlaps(first: Span, second: Span): boolean {
  return first.start < second.end && second.start < first.end;
}

// Trust nothing about offsets: the content may have been edited while the request ran,
// and highlights built from stale offsets would mark the wrong text. Keeps entries whose
// offsets still point at their text, drops repeats (first occurrence wins, highest count
// kept, like the agent) and returns them in text order.
export function validateDetectedKeywords(content: string, keywords: DetectedKeyword[]): DetectedKeyword[] {
  const byKey = new Map<string, DetectedKeyword>();
  const inOrder = [...keywords].sort((first, second) => first.start - second.start);

  for (const keyword of inOrder) {
    const { start, end, text } = keyword;
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    if (start < 0 || end <= start || end > content.length) continue;
    if (content.slice(start, end) !== text) continue;

    const key = dedupKey(text);
    if (!key) continue;
    const count = clampCount(keyword.count);
    const existing = byKey.get(key);
    if (!existing) byKey.set(key, { text, start, end, count });
    else if (count > existing.count) byKey.set(key, { ...existing, count });
  }

  return [...byKey.values()].sort((first, second) => first.start - second.start);
}

// Detected keywords → the POST /generate-exercises keyword shape. The AI's suggested
// count is kept, so `auto` stays off.
export function toWeightedKeywords(detected: DetectedKeyword[]): WeightedKeyword[] {
  return detected.map(({ text, count }) => ({ text, count }));
}

// Detected keywords → the AI-generate screen's highlight shape (same offsets, new ids).
export function toAiKeywords(
  detected: DetectedKeyword[],
  createId: () => string = makeId,
): AiKeyword[] {
  return detected.map(({ text, start, end, count }) => ({ id: createId(), text, start, end, count }));
}

// The user's own highlights always win: they stay untouched (same ids, counts, offsets),
// and a detected keyword is added only if its range overlaps none of them nor an earlier
// detected one. Result is in text order.
export function mergeKeywords(
  existing: AiKeyword[],
  detected: DetectedKeyword[],
  createId: () => string = makeId,
): AiKeyword[] {
  const taken: Span[] = existing.map(({ start, end }) => ({ start, end }));
  const added: AiKeyword[] = [];
  const inOrder = [...detected].sort((first, second) => first.start - second.start);

  for (const keyword of inOrder) {
    if (keyword.end <= keyword.start) continue;
    if (taken.some((span) => overlaps(span, keyword))) continue;
    taken.push({ start: keyword.start, end: keyword.end });
    const { text, start, end, count } = keyword;
    added.push({ id: createId(), text, start, end, count });
  }

  return [...existing, ...added].sort((first, second) => first.start - second.start);
}
