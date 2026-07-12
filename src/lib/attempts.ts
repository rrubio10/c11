import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { getExerciseContentOverride } from "@/lib/exercise-content-overrides";

export async function findAttemptContent(attemptId: string, userId: string) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, userId },
    include: { answers: true, exerciseSet: true },
  });
  if (!attempt) throw new Error("NOT_FOUND");
  const sets = attempt.exerciseSetId
    ? await db.exerciseSet.findMany({ where: { id: attempt.exerciseSetId, active: true }, include: { items: { where: { active: true }, orderBy: { displayOrder: "asc" } } } })
    : await db.exerciseSet.findMany({ where: { testGroup: attempt.testGroup ?? "", active: true }, include: { items: { where: { active: true }, orderBy: { displayOrder: "asc" } } }, orderBy: { part: "asc" } });
  const answerMap = new Map(attempt.answers.map((a) => [a.exerciseItemId, a]));
  return {
    attempt,
    sets: sets.map((set) => {
      const override = getExerciseContentOverride(set.externalId);
      return {
        id: set.id,
        externalId: set.externalId,
        section: set.section,
        part: set.part,
        type: set.type,
        level: set.level,
        title: override?.title ?? set.title,
        instructions: override?.instructions ?? set.instructions,
        fullText: override?.fullText ?? set.fullText,
        sourcePages: set.sourcePages,
        transcriptionStatus: override?.transcriptionStatus ?? set.transcriptionStatus,
        notes: override?.notes ?? set.notes,
        itemCount: set.itemCount,
        testGroup: set.testGroup,
        items: set.items.map((item) => {
          const itemOverride = override?.items[String(item.number)];
          return {
            id: item.id,
            externalId: item.externalId,
            number: item.number,
            prompt: itemOverride?.prompt ?? item.prompt,
            options: itemOverride?.options ?? safeJsonParse<Array<{ key: string; label: string }>>(item.optionsJson, []),
            keyword: itemOverride?.keyword ?? item.keyword,
            baseWord: itemOverride?.baseWord ?? item.baseWord,
            maximumPoints: item.maximumPoints,
            displayOrder: item.displayOrder,
            answer: answerMap.get(item.id)?.answer ?? "",
          };
        }),
      };
    }),
  };
}

export async function getOwnedAttempt(attemptId: string, userId: string) {
  const attempt = await db.attempt.findFirst({ where: { id: attemptId, userId } });
  if (!attempt) throw new Error("NOT_FOUND");
  return attempt;
}
