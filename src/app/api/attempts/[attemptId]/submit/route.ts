import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError, requireSameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { gradeAnswer } from "@/lib/scoring/grade";
import { inferWordLimit } from "@/lib/scoring/word-limit";

const schema = z.object({ elapsedSeconds: z.number().int().min(0).max(200000).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    requireSameOrigin(request);
    const user = await requireUser(); const { attemptId } = await params;
    if (!rateLimit(`submit:${user.id}`, 20, 60_000).ok) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    const input = schema.parse(await request.json().catch(() => ({})));
    const result = await db.$transaction(async (tx) => {
      const attempt = await tx.attempt.findFirst({ where: { id: attemptId, userId: user.id }, include: { answers: true } });
      if (!attempt) throw new Error("NOT_FOUND");
      if (attempt.status === "SUBMITTED") return attempt;
      const items = await tx.exerciseItem.findMany({ where: { active: true, exerciseSet: attempt.exerciseSetId ? { id: attempt.exerciseSetId } : { testGroup: attempt.testGroup ?? "" } }, include: { answerVariants: true, exerciseSet: { select: { part: true, instructions: true } } } });
      const answers = new Map(attempt.answers.map((a) => [a.exerciseItemId, a]));
      let rawScore = 0; let maximumScore = 0;
      for (const item of items) {
        maximumScore += item.maximumPoints;
        const answer = answers.get(item.id);
        const graded = gradeAnswer({ answer: answer?.answer ?? "", variants: item.answerVariants.map((v) => ({ answer: v.answer, points: v.points })), maximumPoints: item.maximumPoints, part: item.exerciseSet.part, keyword: item.keyword, wordLimit: item.keyword ? inferWordLimit(item.exerciseSet.instructions) : null });
        rawScore += graded.awardedPoints;
        await tx.userAnswer.upsert({ where: { attemptId_exerciseItemId: { attemptId, exerciseItemId: item.id } }, create: { attemptId, exerciseItemId: item.id, answer: "", normalizedAnswer: "", awardedPoints: graded.awardedPoints, isCorrect: graded.isCorrect, correctionStatus: graded.status }, update: { normalizedAnswer: graded.normalizedAnswer, awardedPoints: graded.awardedPoints, isCorrect: graded.isCorrect, correctionStatus: graded.status } });
      }
      return tx.attempt.update({ where: { id: attemptId }, data: { status: "SUBMITTED", submittedAt: new Date(), timeSpentSeconds: input.elapsedSeconds ?? attempt.timeSpentSeconds, rawScore, maximumScore, percentage: maximumScore ? (rawScore / maximumScore) * 100 : 0 } });
    }, { timeout: 60_000 });
    return NextResponse.json({ ok: true, attemptId: result.id });
  } catch (error) { return apiError(error); }
}
