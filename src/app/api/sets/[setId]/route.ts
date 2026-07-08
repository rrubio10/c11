import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ setId: string }> }) {
  try {
    await requireUser();
    const { setId } = await params;
    const set = await db.exerciseSet.findFirst({ where: { externalId: setId, active: true }, select: { id: true, externalId: true, section: true, part: true, type: true, level: true, title: true, instructions: true, sourcePages: true, transcriptionStatus: true, notes: true, itemCount: true, testGroup: true, items: { where: { active: true }, select: { maximumPoints: true } } } });
    if (!set) throw new Error("NOT_FOUND");
    return NextResponse.json({ set: { ...set, maximumScore: set.items.reduce((n, i) => n + i.maximumPoints, 0), items: undefined } });
  } catch (error) { return apiError(error); }
}
