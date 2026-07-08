import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
if (!url.startsWith("file:")) throw new Error("db:setup currently initializes the local SQLite DATABASE_URL.");
const rawPath = url.slice(5);
const dbPath = path.resolve(process.cwd(), rawPath);
mkdirSync(path.dirname(dbPath), { recursive: true });
const migration = await readFile(path.join(process.cwd(), "prisma/migrations/20260708153000_init/migration.sql"), "utf8");
const client = createClient({ url: `file:${dbPath}` });
await client.executeMultiple(migration);
client.close();
for (const command of [["tsx", "scripts/validate-source.ts"], ["tsx", "scripts/seed.ts"], ["tsx", "scripts/import.ts"], ["tsx", "scripts/validate-data.ts"]]) {
  const result = spawnSync("npx", command, { stdio: "inherit", env: process.env, shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Database ready at ${dbPath}${existsSync(dbPath) ? "" : " (creation failed)"}`);
