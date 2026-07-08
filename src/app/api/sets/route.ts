import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const section = url.searchParams.get("section") ?? undefined;
    const part = url.searchParams.get("part");
    const sets = await db.exerciseSet.findMany({
      where: { active: true, ...(section ? { section } : {}), ...(part ? { part: Number(part) } : {}) },
      select: { id: true, externalId: true, section: true, part: true, type: true, level: true, title: true, itemCount: true, testGroup: true, transcriptionStatus: true, items: { where: { active: true }, select: { maximumPoints: true } }, attempts: { where: { userId: user.id }, select: { id: true, status: true, percentage: true, startedAt: true, submittedAt: true }, orderBy: { startedAt: "desc" }, take: 1 } },
      orderBy: [{ testGroup: "asc" }, { part: "asc" }],
    });
    return NextResponse.json({ sets: sets.map(({ items, ...set }) => ({ ...set, maximumScore: items.reduce((n, i) => n + i.maximumPoints, 0) })) });
  } catch (error) { return apiError(error); }
}
