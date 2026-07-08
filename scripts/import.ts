import { readFile } from "node:fs/promises";
import path from "node:path";
import { importMasterText } from "../src/lib/importer/import-db";
import { db } from "../src/lib/db";

const file = process.argv[2] ?? path.join(process.cwd(), "data/import/C1_exercises_master.txt");
const content = await readFile(file, "utf8");
const result = await importMasterText(content, path.basename(file));
console.log(JSON.stringify({ sets: result.sets.length, items: result.sets.reduce((n, s) => n + s.items.length, 0), errors: result.errors, warnings: result.warnings }, null, 2));
await db.$disconnect();
if (result.errors.length) process.exit(1);
