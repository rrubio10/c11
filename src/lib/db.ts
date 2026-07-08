import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as SqlitePrismaClient } from "@/generated/prisma/client";
import { PrismaClient as PostgresPrismaClient } from "@/generated/prisma-pg/client";

const globalForPrisma = globalThis as unknown as { prisma?: SqlitePrismaClient };

function createClient(): SqlitePrismaClient {
  const configured = process.env.DATABASE_URL ?? "file:./dev.db";
  if (/^postgres(?:ql)?:\/\//i.test(configured)) {
    return new PostgresPrismaClient({ adapter: new PrismaPg(configured) }) as unknown as SqlitePrismaClient;
  }
  const url = configured.startsWith("file:./")
    ? `file:${path.resolve(/* turbopackIgnore: true */ process.cwd(), configured.slice(5))}`
    : configured;
  return new SqlitePrismaClient({ adapter: new PrismaLibSql({ url }) });
}

function getClient() {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

// Keep database adapters lazy: importing server modules during `next build` must not
// open a SQLite/libSQL handle unless a real query is executed.
export const db = new Proxy({} as SqlitePrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
