import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("solution secrecy", () => {
  it("the pre-submission attempt serializer does not include answer-key fields", async () => {
    const source = await readFile(path.join(process.cwd(), "src/lib/attempts.ts"), "utf8");
    const publicMapping = source.slice(source.indexOf("sets: sets.map"));
    expect(publicMapping).not.toContain("correctAnswer:");
    expect(publicMapping).not.toContain("acceptedJson:");
    expect(publicMapping).not.toContain("answerVariants:");
  });
});

import { requireSameOrigin } from "@/lib/http";

describe("same-origin protection", () => {
  it("accepts same-origin writes and rejects a foreign origin", () => {
    expect(() => requireSameOrigin(new Request("https://practice.example/api/attempts", { headers: { origin: "https://practice.example" } }))).not.toThrow();
    expect(() => requireSameOrigin(new Request("https://practice.example/api/attempts", { headers: { origin: "https://attacker.example" } }))).toThrow("FORBIDDEN");
  });
});
