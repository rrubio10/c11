import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/scoring/grade";
import { containsKeywordUnchanged, countWords, normalizeAnswer } from "@/lib/scoring/normalize";
import { inferWordLimit } from "@/lib/scoring/word-limit";

describe("answer normalization", () => {
  it("normalizes case, outside whitespace, repeated spaces and apostrophes", () => {
    expect(normalizeAnswer("  didn’t   have  ")).toBe("DIDN'T HAVE");
  });
  it("counts words and preserves exact grammar", () => {
    expect(countWords("had not been for")).toBe(4);
    expect(normalizeAnswer("has gone")).not.toBe(normalizeAnswer("had gone"));
  });
});

describe("server grading", () => {
  it("accepts verified variants case-insensitively", () => {
    const result = gradeAnswer({ answer: "  all ", variants: [{ answer: "EVERY", points: 1 }, { answer: "ALL", points: 1 }], maximumPoints: 1, part: 2 });
    expect(result.awardedPoints).toBe(1);
  });
  it("awards the variant-specific number of points", () => {
    const result = gradeAnswer({ answer: "partial variant", variants: [{ answer: "partial variant", points: 1 }], maximumPoints: 2, part: 4 });
    expect(result.awardedPoints).toBe(1);
    expect(result.isCorrect).toBe(false);
    expect(result.status).toBe("PARTIAL");
  });
  it("rejects answers outside a Part 4 word limit", () => {
    const result = gradeAnswer({ answer: "did understand", variants: [{ answer: "did understand", points: 2 }], maximumPoints: 2, part: 4, keyword: "DID", wordLimit: { min: 3, max: 6 } });
    expect(result.awardedPoints).toBe(0);
    expect(result.validation.wordLimitValid).toBe(false);
  });
  it("requires the unchanged keyword", () => {
    expect(containsKeywordUnchanged("did I understand", "DID")).toBe(true);
    const result = gradeAnswer({ answer: "I understood fully", variants: [{ answer: "I understood fully", points: 2 }], maximumPoints: 2, part: 4, keyword: "DID", wordLimit: { min: 3, max: 6 } });
    expect(result.awardedPoints).toBe(0);
  });
  it("does not use semantic or fuzzy matching", () => {
    const result = gradeAnswer({ answer: "roughly right", variants: [{ answer: "exactly right", points: 1 }], maximumPoints: 1, part: 3 });
    expect(result.awardedPoints).toBe(0);
  });
});

describe("word limits", () => {
  it("reads written number ranges from instructions", () => {
    expect(inferWordLimit("You must use between three and six words, including the word given.")).toEqual({ min: 3, max: 6 });
  });
  it("returns null when a source does not state a range", () => {
    expect(inferWordLimit("Complete the sentence.")).toBeNull();
  });
});
