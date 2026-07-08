import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { safeJsonParse } from "@/lib/utils";
export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireUser(); const { attemptId } = await params;
    const attempt = await db.attempt.findFirst({ where: { id: attemptId, userId: user.id, status: "SUBMITTED" }, include: { answers: { include: { exerciseItem: { include: { exerciseSet: true, answerVariants: true } } }, orderBy: { exerciseItem: { displayOrder: "asc" } } } } });
    if (!attempt) throw new Error("NOT_FOUND");
    return NextResponse.json({ attempt: { id: attempt.id, rawScore: attempt.rawScore, maximumScore: attempt.maximumScore, percentage: attempt.percentage, timeSpentSeconds: attempt.timeSpentSeconds, submittedAt: attempt.submittedAt }, answers: attempt.answers.map((a) => ({ id: a.id, answer: a.answer, awardedPoints: a.awardedPoints, isCorrect: a.isCorrect, correctionStatus: a.correctionStatus, item: { externalId: a.exerciseItem.externalId, number: a.exerciseItem.number, prompt: a.exerciseItem.prompt, options: safeJsonParse(a.exerciseItem.optionsJson, []), keyword: a.exerciseItem.keyword, baseWord: a.exerciseItem.baseWord, correctAnswer: a.exerciseItem.correctAnswer, acceptedAnswers: safeJsonParse(a.exerciseItem.acceptedJson, []), maximumPoints: a.exerciseItem.maximumPoints, explanation: a.exerciseItem.explanation, set: { externalId: a.exerciseItem.exerciseSet.externalId, title: a.exerciseItem.exerciseSet.title, part: a.exerciseItem.exerciseSet.part, section: a.exerciseItem.exerciseSet.section } } })) });
  } catch (error) { return apiError(error); }
}
