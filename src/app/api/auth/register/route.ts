import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { apiError, requireSameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(10).max(128) });

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    if (!rateLimit(`register:${ip}`, 8, 15 * 60_000).ok) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    const input = schema.parse(await request.json());
    if (await db.user.findUnique({ where: { email: input.email } })) return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 409 });
    const user = await db.user.create({ data: { name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12) } });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
