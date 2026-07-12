import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getExerciseContentOverride } from "@/lib/exercise-content-overrides";
import { apiError } from "@/lib/http";
import { safeJsonParse } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await requireUser();
    const { attemptId } = await params;
    const attempt = await db.attempt.findFirst({
      where: { id: attemptId, userId: user.id, status: "SUBMITTED" },
      include: {
        answers: {
          include: { exerciseItem: { include: { exerciseSet: true, answerVariants: true } } },
          orderBy: { exerciseItem: { displayOrder: "asc" } },
        },
      },
    });
    if (!attempt) throw new Error("NOT_FOUND");

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        rawScore: attempt.rawScore,
        maximumScore: attempt.maximumScore,
        percentage: attempt.percentage,
        timeSpentSeconds: attempt.timeSpentSeconds,
        submittedAt: attempt.submittedAt,
      },
      answers: attempt.answers.map((answer) => {
        const setOverride = getExerciseContentOverride(answer.exerciseItem.exerciseSet.externalId);
        const itemOverride = setOverride?.items[String(answer.exerciseItem.number)];
        return {
          id: answer.id,
          answer: answer.answer,
          awardedPoints: answer.awardedPoints,
          isCorrect: answer.isCorrect,
          correctionStatus: answer.correctionStatus,
          item: {
            externalId: answer.exerciseItem.externalId,
            number: answer.exerciseItem.number,
            prompt: itemOverride?.prompt ?? answer.exerciseItem.prompt,
            options: itemOverride?.options ?? safeJsonParse(answer.exerciseItem.optionsJson, []),
            keyword: itemOverride?.keyword ?? answer.exerciseItem.keyword,
            baseWord: itemOverride?.baseWord ?? answer.exerciseItem.baseWord,
            correctAnswer: answer.exerciseItem.correctAnswer,
            acceptedAnswers: safeJsonParse(answer.exerciseItem.acceptedJson, []),
            maximumPoints: answer.exerciseItem.maximumPoints,
            explanation: answer.exerciseItem.explanation,
            set: {
              externalId: answer.exerciseItem.exerciseSet.externalId,
              title: setOverride?.title ?? answer.exerciseItem.exerciseSet.title,
              part: answer.exerciseItem.exerciseSet.part,
              section: answer.exerciseItem.exerciseSet.section,
            },
          },
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
