"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDetectedKeywords = validateDetectedKeywords;
exports.toWeightedKeywords = toWeightedKeywords;
exports.toAiKeywords = toAiKeywords;
exports.mergeKeywords = mergeKeywords;
const aiGenerate_helper_1 = require("../aiGenerate.helper");
const aiKeywords_constants_1 = require("./aiKeywords.constants");
// Same key as the agent's _dedup_key: case- and whitespace-insensitive, so "Cell  wall"
// and "cell wall" count as one keyword.
function dedupKey(text) {
    return text.toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}
function clampCount(count) {
    const rounded = Number.isFinite(count) ? Math.round(count) : aiKeywords_constants_1.DETECTED_KEYWORD_COUNT_MIN;
    return Math.min(Math.max(rounded, aiKeywords_constants_1.DETECTED_KEYWORD_COUNT_MIN), aiKeywords_constants_1.DETECTED_KEYWORD_COUNT_MAX);
}
// Half-open ranges [start, end): touching keywords ("cell" + " wall") don't overlap.
function overlaps(first, second) {
    return first.start < second.end && second.start < first.end;
}
// Trust nothing about offsets: the content may have been edited while the request ran,
// and highlights built from stale offsets would mark the wrong text. Keeps entries whose
// offsets still point at their text, drops repeats (first occurrence wins, highest count
// kept, like the agent) and returns them in text order.
function validateDetectedKeywords(content, keywords) {
    const byKey = new Map();
    const inOrder = [...keywords].sort((first, second) => first.start - second.start);
    for (const keyword of inOrder) {
        const { start, end, text } = keyword;
        if (!Number.isInteger(start) || !Number.isInteger(end))
            continue;
        if (start < 0 || end <= start || end > content.length)
            continue;
        if (content.slice(start, end) !== text)
            continue;
        const key = dedupKey(text);
        if (!key)
            continue;
        const count = clampCount(keyword.count);
        const existing = byKey.get(key);
        if (!existing)
            byKey.set(key, { text, start, end, count });
        else if (count > existing.count)
            byKey.set(key, { ...existing, count });
    }
    return [...byKey.values()].sort((first, second) => first.start - second.start);
}
// Detected keywords → the POST /generate-exercises keyword shape. The AI's suggested
// count is kept, so `auto` stays off.
function toWeightedKeywords(detected) {
    return detected.map(({ text, count }) => ({ text, count }));
}
// Detected keywords → the AI-generate screen's highlight shape (same offsets, new ids).
function toAiKeywords(detected, createId = aiGenerate_helper_1.makeId) {
    return detected.map(({ text, start, end, count }) => ({ id: createId(), text, start, end, count }));
}
// The user's own highlights always win: they stay untouched (same ids, counts, offsets),
// and a detected keyword is added only if its range overlaps none of them nor an earlier
// detected one. Result is in text order.
function mergeKeywords(existing, detected, createId = aiGenerate_helper_1.makeId) {
    const taken = existing.map(({ start, end }) => ({ start, end }));
    const added = [];
    const inOrder = [...detected].sort((first, second) => first.start - second.start);
    for (const keyword of inOrder) {
        if (keyword.end <= keyword.start)
            continue;
        if (taken.some((span) => overlaps(span, keyword)))
            continue;
        taken.push({ start: keyword.start, end: keyword.end });
        const { text, start, end, count } = keyword;
        added.push({ id: createId(), text, start, end, count });
    }
    return [...existing, ...added].sort((first, second) => first.start - second.start);
}
