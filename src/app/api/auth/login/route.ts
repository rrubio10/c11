import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { apiError, requireSameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({ email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    if (!rateLimit(`login:${ip}`, 10, 15 * 60_000).ok) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    const input = schema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
