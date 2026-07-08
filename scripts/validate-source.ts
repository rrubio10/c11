import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseMaster } from "../src/lib/importer/parser";
import { normalizeAnswer } from "../src/lib/scoring/normalize";

const root = path.join(process.cwd(), "data/import");
const masterText = await readFile(path.join(root, "C1_exercises_master.txt"), "utf8");
const master = parseMaster(masterText);
const errors = [...master.errors];
const warnings = [...master.warnings];
const masterSets = new Map(master.sets.map((set) => [set.setId, set]));

const partFiles = [
  "UOE_P1_multiple_choice_cloze.txt",
  "UOE_P2_open_cloze.txt",
  "UOE_P3_word_formation.txt",
  "UOE_P4_key_word_transformations.txt",
  "READING_P5_multiple_choice.txt",
  "READING_P6_cross_text_multiple_matching.txt",
  "READING_P7_gapped_text.txt",
  "READING_P8_multiple_matching.txt",
];
for (const file of partFiles) {
  const parsed = parseMaster(await readFile(path.join(root, file), "utf8"));
  errors.push(...parsed.errors.map((e) => `${file}: ${e}`));
  for (const set of parsed.sets) {
    const canonical = masterSets.get(set.setId);
    if (!canonical) errors.push(`${file}: set ${set.setId} is absent from master`);
    else if (canonical.items.length !== set.items.length) errors.push(`${file}: item count differs for ${set.setId}`);
  }
}

const indexText = await readFile(path.join(root, "ANSWER_INDEX.tsv.txt"), "utf8");
const rows = indexText.trim().split(/\r?\n/);
const header = rows.shift()?.split("\t") ?? [];
const idx = Object.fromEntries(header.map((name, i) => [name, i]));
const itemMap = new Map(master.sets.flatMap((set) => set.items.map((item) => [item.id, item] as const)));
for (const line of rows) {
  const cols = line.split("\t");
  const id = cols[idx.id];
  const item = itemMap.get(id);
  if (!item) { errors.push(`ANSWER_INDEX: unknown id ${id}`); continue; }
  const correct = cols[idx.correct_answer] ?? "";
  const accepted = (cols[idx.accepted_answers] ?? "").split(/\s*\|\s*/).filter(Boolean);
  const points = Number(cols[idx.max_points]);
  if (normalizeAnswer(correct) !== normalizeAnswer(item.correctAnswer)) errors.push(`ANSWER_INDEX: correct answer mismatch for ${id}`);
  const expected = item.acceptedAnswers.map(normalizeAnswer).sort().join("|");
  const actual = accepted.map(normalizeAnswer).sort().join("|");
  if (expected !== actual) errors.push(`ANSWER_INDEX: accepted answers mismatch for ${id}`);
  if (points !== item.maxPoints) errors.push(`ANSWER_INDEX: max points mismatch for ${id}`);
}
if (rows.length !== itemMap.size) errors.push(`ANSWER_INDEX rows ${rows.length} != master items ${itemMap.size}`);

console.log(JSON.stringify({ sets: master.sets.length, items: itemMap.size, partFiles: partFiles.length, answerIndexRows: rows.length, errors, warnings }, null, 2));
if (errors.length) process.exit(1);
