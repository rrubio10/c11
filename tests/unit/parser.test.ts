import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parseMaster } from "@/lib/importer/parser";
import { importMasterText } from "@/lib/importer/import-db";
import { db } from "@/lib/db";

const fixture = `[SET]
set_id=TEST_FIXTURE_P2
section=UOE
part=2
type=open_cloze
level=C1
title=Fixture title
source_pdf_pages=1
transcription_status=verified
notes=
item_count=2
text_begin
Part 2
Use one word.

Fixture title
This is (9) ........ example with a second (10) ........ gap.
text_end
[/SET]

[ITEM]
id=TEST_FIXTURE_P2_Q09
set_id=TEST_FIXTURE_P2
number=9
correct_answer=AN
accepted_answers=AN | ONE
max_points=1
error_category=open_cloze
explanation=Article.
[/ITEM]

[ITEM]
id=TEST_FIXTURE_P2_Q10
set_id=TEST_FIXTURE_P2
number=10
correct_answer=SMALL
accepted_answers=SMALL
max_points=1
error_category=open_cloze
explanation=Adjective.
[/ITEM]`;

afterAll(async () => {
  const set = await db.exerciseSet.findUnique({ where: { externalId: "TEST_FIXTURE_P2" } });
  if (set) await db.exerciseSet.delete({ where: { id: set.id } });
  await db.importRun.deleteMany({ where: { sourceName: "fixture.txt" } });
  await db.$disconnect();
});

describe("master TXT parser", () => {
  it("reads SET and ITEM blocks, multiline text and accepted variants", () => {
    const result = parseMaster(fixture);
    expect(result.errors).toEqual([]);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].fullText).toContain("second (10)");
    expect(result.sets[0].items[0].acceptedAnswers).toEqual(["AN", "ONE"]);
  });

  it("uses explicit prompt, options, keyword and base_word fields", () => {
    const source = `[SET]
set_id=EXPLICIT_P1
section=UOE
part=1
type=multiple_choice_cloze
level=C1
title=Explicit options
source_pdf_pages=1
transcription_status=verified
notes=
item_count=1
text_begin
For questions 1-1, choose A, B, C or D.
Text with (1) ______ gap.
text_end
[/SET]

[ITEM]
id=EXPLICIT_P1_Q01
set_id=EXPLICIT_P1
number=1
prompt=Text with (1) ______ gap.
options={"A":"alpha","B":"beta","C":"gamma","D":"delta"}
correct_answer=D
accepted_answers=D
max_points=1
error_category=multiple_choice_cloze
explanation=Test.
[/ITEM]`;
    const result = parseMaster(source);
    expect(result.errors).toEqual([]);
    expect(result.sets[0].items[0].prompt).toContain("Text with");
    expect(result.sets[0].items[0].options).toEqual([
      { key: "A", label: "alpha" },
      { key: "B", label: "beta" },
      { key: "C", label: "gamma" },
      { key: "D", label: "delta" },
    ]);
  });

  it("detects mismatched item_count", () => {
    const result = parseMaster(fixture.replace("item_count=2", "item_count=3"));
    expect(result.errors.some((error) => error.includes("item_count=3"))).toBe(true);
  });

  it("detects duplicate identifiers", () => {
    const duplicate = `${fixture}\n${fixture.match(/\[ITEM\][\s\S]*?\[\/ITEM\]/)?.[0] ?? ""}`;
    expect(parseMaster(duplicate).errors.some((error) => error.includes("Duplicate item id"))).toBe(true);
  });

  it("parses the supplied master source completely", async () => {
    const source = await readFile(path.join(process.cwd(), "data/import/C1_exercises_master.txt"), "utf8");
    const result = parseMaster(source);
    expect(result.errors).toEqual([]);
    expect(result.sets).toHaveLength(106);
    expect(result.sets.reduce((sum, set) => sum + set.items.length, 0)).toBe(815);
  });

  it("is idempotent when the same source is imported twice", async () => {
    await importMasterText(fixture, "fixture.txt");
    await importMasterText(fixture, "fixture.txt");
    const set = await db.exerciseSet.findUnique({ where: { externalId: "TEST_FIXTURE_P2" }, include: { items: true } });
    expect(set?.items).toHaveLength(2);
    expect(await db.exerciseSet.count({ where: { externalId: "TEST_FIXTURE_P2" } })).toBe(1);
  });
});

it("replaces the damaged Test 1 Reading OCR with structured verified content", async () => {
  const source = await readFile(path.join(process.cwd(), "data/import/C1_exercises_master.txt"), "utf8");
  const result = parseMaster(source);
  const part5 = result.sets.find((set) => set.setId === "ADV5_T1_P5");
  const part6 = result.sets.find((set) => set.setId === "ADV5_T1_P6");
  const part7 = result.sets.find((set) => set.setId === "ADV5_T1_P7");
  const part8 = result.sets.find((set) => set.setId === "ADV5_T1_P8");

  expect(part5?.transcriptionStatus).toBe("verified_from_source_scan");
  expect(part5?.fullText).toContain("an octopus named Inky");
  expect(part5?.items[0].prompt).toContain("octopuses");
  expect(part5?.items[0].options).toHaveLength(4);

  expect(part6?.fullText).toContain("A\nWhat I love about architecture");
  expect(part6?.items[0].options.map((option) => option.key)).toEqual(["A", "B", "C", "D"]);

  expect(part7?.fullText).toContain("[[41]]");
  expect(part7?.items[0].options).toHaveLength(7);
  expect(part7?.items[0].options[0].label.length).toBeGreaterThan(100);

  expect(part8?.fullText).toContain("A\nA student is researching scholarly material");
  expect(part8?.items[0].prompt).toContain("rule change");
  expect(part8?.items[0].options.map((option) => option.key)).toEqual(["A", "B", "C", "D"]);
});


it("loads repaired new Part 3 and all new Reading sets without OCR fallbacks", async () => {
  const source = await readFile(path.join(process.cwd(), "data/import/C1_exercises_master.txt"), "utf8");
  const result = parseMaster(source);
  expect(result.errors).toEqual([]);

  const part3 = result.sets.find((set) => set.setId === "BOOSTER_W1_P3");
  expect(part3?.fullText).toContain("whether the course is (1) ........ or offers hands-on experience");
  expect(part3?.items.map((item) => item.baseWord)).toEqual([
    "THEORY", "DEPEND", "SATISFY", "COMPLAIN", "PROVIDE", "CLEAR", "SURE", "REAL",
  ]);

  const part5 = result.sets.find((set) => set.setId === "CAE1_T1_P5");
  expect(part5?.fullText).toContain("[[SCAN:/reading-scans/cae1-t1-p5-p014.webp]]");
  expect(part5?.items[0].prompt).toContain("Piaget");
  expect(part5?.items[0].options).toHaveLength(4);

  const part6 = result.sets.find((set) => set.setId === "BOOSTER_W2_P6");
  expect(part6?.fullText).toContain("[[SCAN:/reading-scans/booster-w2-p6-p044.webp]]");
  expect(part6?.items[0].options.map((option) => option.key)).toEqual(["A", "B", "C", "D"]);

  const part7 = result.sets.find((set) => set.setId === "CAE1_T1_P7");
  expect(part7?.fullText.match(/\[\[4[1-6]\]\]/g)).toHaveLength(6);
  expect(part7?.items[0].options).toHaveLength(7);
  expect(part7?.items[0].options[0].label.length).toBeGreaterThan(80);

  const part8 = result.sets.find((set) => set.setId === "BOOSTER_W3_P8");
  expect(part8?.fullText).toContain("[[SCAN:/reading-scans/booster-w3-p8-p058.webp]]");
  expect(part8?.items[0].prompt.length).toBeGreaterThan(20);
  expect(part8?.items[0].options.map((option) => option.key)).toEqual(["A", "B", "C", "D"]);
});
