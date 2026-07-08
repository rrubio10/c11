import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

const email = (process.env.ADMIN_EMAIL ?? "admin@example.local").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "ChangeMe-123!";
const passwordHash = await bcrypt.hash(password, 12);
await db.user.upsert({ where: { email }, create: { email, name: "Administrator", passwordHash, role: "ADMIN" }, update: { role: "ADMIN", passwordHash } });
console.log(`Admin ready: ${email}`);
await db.$disconnect();
