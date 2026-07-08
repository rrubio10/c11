import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError, requireSameOrigin } from "@/lib/http";

const schema = z.union([z.object({ setId: z.string().min(1), testGroup: z.never().optional() }), z.object({ testGroup: z.string().min(1), setId: z.never().optional() })]);
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const user = await requireUser();
    const input = schema.parse(await request.json());
    const set = "setId" in input ? await db.exerciseSet.findFirst({ where: { externalId: input.setId, active: true }, include: { items: { where: { active: true }, orderBy: { displayOrder: "asc" }, take: 1 } } }) : null;
    if ("setId" in input && !set) throw new Error("NOT_FOUND");
    const existing = await db.attempt.findFirst({ where: { userId: user.id, status: "IN_PROGRESS", ...(set ? { exerciseSetId: set.id } : { testGroup: input.testGroup }) }, orderBy: { startedAt: "desc" } });
    if (existing) return NextResponse.json({ attemptId: existing.id, resumed: true });
    const firstSet = set ?? await db.exerciseSet.findFirst({ where: { testGroup: input.testGroup, active: true }, include: { items: { where: { active: true }, orderBy: { displayOrder: "asc" }, take: 1 } }, orderBy: { part: "asc" } });
    if (!firstSet) throw new Error("NOT_FOUND");
    const attempt = await db.attempt.create({ data: { userId: user.id, exerciseSetId: set?.id, testGroup: set ? undefined : input.testGroup, currentItemExternalId: firstSet.items[0]?.externalId } });
    return NextResponse.json({ attemptId: attempt.id, resumed: false });
  } catch (error) { return apiError(error); }
}
