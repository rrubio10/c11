import { describe, expect, it } from "vitest";
import { formatChoiceAnswer, formatReviewPrompt } from "@/lib/exam-display";

describe("answer review display", () => {
  it("shows the selected letter and the option text", () => {
    expect(
      formatChoiceAnswer("d", [
        { key: "A", label: "uncertain" },
        { key: "D", label: "unlikely" },
      ]),
    ).toBe("D — unlikely");
  });

  it("keeps a plain answer when no option label exists", () => {
    expect(formatChoiceAnswer("C", [])).toBe("C");
  });

  it("formats a key word transformation prompt", () => {
    expect(formatReviewPrompt(JSON.stringify({ original: "First sentence", second: "Second sentence" }), "KEY")).toBe(
      "First sentence\nKEY\nSecond sentence",
    );
  });
});
