import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError, requireSameOrigin } from "@/lib/http";
import { normalizeAnswer } from "@/lib/scoring/normalize";
import { getOwnedAttempt } from "@/lib/attempts";

const schema = z.object({ itemId: z.string().min(1), answer: z.string().max(500), elapsedSeconds: z.number().int().min(0).max(200000).optional(), currentItemExternalId: z.string().optional() });
export async function PUT(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    requireSameOrigin(request);
    const user = await requireUser(); const { attemptId } = await params; const input = schema.parse(await request.json());
    const attempt = await getOwnedAttempt(attemptId, user.id); if (attempt.status !== "IN_PROGRESS") throw new Error("ATTEMPT_SUBMITTED");
    const item = await db.exerciseItem.findFirst({ where: { id: input.itemId, active: true, exerciseSet: attempt.exerciseSetId ? { id: attempt.exerciseSetId } : { testGroup: attempt.testGroup ?? "" } }, select: { id: true } });
    if (!item) throw new Error("FORBIDDEN");
    await db.$transaction([
      db.userAnswer.upsert({ where: { attemptId_exerciseItemId: { attemptId, exerciseItemId: item.id } }, create: { attemptId, exerciseItemId: item.id, answer: input.answer, normalizedAnswer: normalizeAnswer(input.answer), answeredAt: new Date() }, update: { answer: input.answer, normalizedAnswer: normalizeAnswer(input.answer), answeredAt: new Date(), correctionStatus: "UNGRADED", awardedPoints: 0, isCorrect: false } }),
      db.attempt.update({ where: { id: attemptId }, data: { lastActivityAt: new Date(), ...(input.elapsedSeconds !== undefined ? { timeSpentSeconds: input.elapsedSeconds } : {}), ...(input.currentItemExternalId ? { currentItemExternalId: input.currentItemExternalId } : {}) } }),
    ]);
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) { return apiError(error); }
}
