import { describe, expect, it } from "vitest";
import {
  keywordBillingUnits, keywordPrice, validateDetectedKeywords,
  toWeightedKeywords, toAiKeywords, mergeKeywords,
} from "../src/helpers/aiKeywords";
import type { AiKeyword } from "../src/types/aiGenerateType";

const content = "The cell wall protects the cell. Mitochondria make energy for the cell.";
const at = (text: string, from = 0) => {
  const start = content.indexOf(text, from);
  return { text, start, end: start + text.length };
};
const sequentialIds = () => {
  let next = 0;
  return () => `id${++next}`;
};

describe("keywordBillingUnits", () => {
  // Must match billing_units in mnemova-agent (test_generate_keywords_billing.py).
  it("counts started 10K-character blocks, at least 1", () => {
    expect([0, 1, 10_000, 10_001, 72_000].map(keywordBillingUnits)).toEqual([1, 1, 1, 2, 8]);
  });
});

describe("keywordPrice", () => {
  it("is the per-unit price x started blocks", () => {
    expect(keywordPrice(20, 4_800)).toBe(20);
    expect(keywordPrice(20, 71_800)).toBe(160);
    expect(keywordPrice(180, 300_000)).toBe(5_400);
  });
});

describe("validateDetectedKeywords", () => {
  it("drops entries whose offsets don't point at their text", () => {
    const good = { ...at("cell wall"), count: 2 };
    const shifted = { text: "Mitochondria", start: 0, end: 12, count: 1 };
    const outOfRange = { text: "x", start: 500, end: 501, count: 1 };
    const empty = { text: "", start: 3, end: 3, count: 1 };
    expect(validateDetectedKeywords(content, [shifted, good, outOfRange, empty])).toEqual([good]);
  });

  it("de-dupes case-insensitively: first occurrence wins, highest count kept", () => {
    const first = { ...at("cell"), count: 1 };
    const later = { ...at("cell", first.end), count: 3 };
    expect(validateDetectedKeywords(content, [later, first])).toEqual([{ ...first, count: 3 }]);
  });

  it("returns text order and clamps counts to 1-3", () => {
    const energy = { ...at("energy"), count: 9 };
    const wall = { ...at("wall"), count: 0 };
    expect(validateDetectedKeywords(content, [energy, wall])).toEqual([
      { ...wall, count: 1 },
      { ...energy, count: 3 },
    ]);
  });
});

describe("toWeightedKeywords", () => {
  it("keeps text and count, without auto", () => {
    expect(toWeightedKeywords([{ ...at("energy"), count: 2 }])).toEqual([{ text: "energy", count: 2 }]);
  });
});

describe("toAiKeywords", () => {
  it("keeps offsets and adds fresh ids", () => {
    const detected = { ...at("energy"), count: 2 };
    expect(toAiKeywords([detected], sequentialIds())).toEqual([{ id: "id1", ...detected }]);
  });
});

describe("mergeKeywords", () => {
  const userWall: AiKeyword = { id: "user1", ...at("cell wall"), count: 3 };

  it("keeps the user's keywords and adds only non-overlapping detected ones", () => {
    const overlapping = { ...at("wall"), count: 1 };
    const energy = { ...at("energy"), count: 2 };
    const merged = mergeKeywords([userWall], [energy, overlapping], sequentialIds());
    expect(merged).toEqual([userWall, { id: "id1", ...energy }]);
  });

  it("treats touching ranges as non-overlapping and skips overlapping detections", () => {
    const the = { ...at("The"), count: 1 }; // ends where " cell wall" begins
    const mito = { ...at("Mitochondria"), count: 1 };
    const mitoPart = { ...at("chondria"), count: 1 };
    const merged = mergeKeywords([userWall], [mitoPart, mito, the], sequentialIds());
    expect(merged.map((keyword) => keyword.text)).toEqual(["The", "cell wall", "Mitochondria"]);
  });

  it("returns the user's keywords unchanged when nothing is detected", () => {
    expect(mergeKeywords([userWall], [])).toEqual([userWall]);
  });
});
