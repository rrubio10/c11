import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.postgresql.prisma",
  migrations: { path: "prisma/postgresql-migrations", seed: "tsx scripts/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
