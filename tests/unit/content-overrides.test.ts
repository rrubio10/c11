import { describe, expect, it } from "vitest";
import { getExerciseContentOverride } from "@/lib/exercise-content-overrides";

describe("runtime exercise content overrides", () => {
  it("provides complete multiple-choice reading content", () => {
    const set = getExerciseContentOverride("CAE1_T3_P5");
    expect(set?.fullText).toContain("[[SCAN:/reading-scans/cae1-t3-p5-p058.webp]]");
    expect(set?.transcriptionStatus).toContain("verified");
    expect(set?.items["31"].prompt).toContain("Paul Zak");
    expect(set?.items["31"].options).toHaveLength(4);
  });

  it("provides complete cross-text questions", () => {
    const set = getExerciseContentOverride("CAE1_T3_P6");
    expect(set?.items["37"].prompt).not.toBe("Question 37");
    expect(set?.items["37"].options.map((option) => option.key)).toEqual(["A", "B", "C", "D"]);
  });

  it("provides article gaps and full paragraph choices", () => {
    const set = getExerciseContentOverride("CAE1_T2_P7");
    expect(set?.fullText.match(/\[\[4[1-6]\]\]/g)).toHaveLength(6);
    expect(set?.items["41"].options).toHaveLength(7);
    expect(set?.items["41"].options[0].label.length).toBeGreaterThan(80);
  });

  it("provides complete multiple-matching questions", () => {
    const set = getExerciseContentOverride("CAE1_T4_P8");
    expect(set?.fullText).toContain("[[SCAN:/reading-scans/cae1-t4-p8-p086.webp]]");
    expect(set?.items["47"].prompt).toContain("unique appeal");
    expect(set?.items["47"].options).toHaveLength(5);
  });

  it("provides corrected word-formation source text and base words", () => {
    const set = getExerciseContentOverride("BOOSTER_W1_P3");
    expect(set?.fullText).toContain("whether the course is (1) ........ or offers hands-on experience");
    expect(set?.items["1"].baseWord).toBe("THEORY");
  });

  it("repairs the photographed C1 Advanced 5 reading sets", () => {
    const part5 = getExerciseContentOverride("ADV5_T3_P5");
    expect(part5?.fullText).toContain("adv5-t3-p5.webp");
    expect(part5?.items["31"].prompt).toContain("Depot");
    expect(part5?.items["31"].options).toHaveLength(4);

    const part6 = getExerciseContentOverride("ADV5_T3_P6");
    expect(part6?.items["37"].prompt).toContain("current reputation");
    expect(part6?.items["37"].options.map((option) => option.key)).toEqual(["A", "B", "C", "D"]);

    const part7 = getExerciseContentOverride("ADV5_T4_P7");
    expect(part7?.fullText).toContain("adv5-t4-p7.webp");
    expect(part7?.items["41"].options).toHaveLength(7);
    expect(part7?.items["41"].options[0].label.length).toBeGreaterThan(80);

    const part8 = getExerciseContentOverride("ADV5_T2_P8");
    expect(part8?.items["47"].prompt).toContain("commercial idea");
    expect(part8?.items["47"].options).toHaveLength(4);
  });
});
