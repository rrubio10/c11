import { db } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";

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
    sets: sets.map((set) => ({
      id: set.id,
      externalId: set.externalId,
      section: set.section,
      part: set.part,
      type: set.type,
      level: set.level,
      title: set.title,
      instructions: set.instructions,
      fullText: set.fullText,
      sourcePages: set.sourcePages,
      transcriptionStatus: set.transcriptionStatus,
      notes: set.notes,
      itemCount: set.itemCount,
      testGroup: set.testGroup,
      items: set.items.map((item) => ({
        id: item.id,
        externalId: item.externalId,
        number: item.number,
        prompt: item.prompt,
        options: safeJsonParse<Array<{ key: string; label: string }>>(item.optionsJson, []),
        keyword: item.keyword,
        baseWord: item.baseWord,
        maximumPoints: item.maximumPoints,
        displayOrder: item.displayOrder,
        answer: answerMap.get(item.id)?.answer ?? "",
      })),
    })),
  };
}

export async function getOwnedAttempt(attemptId: string, userId: string) {
  const attempt = await db.attempt.findFirst({ where: { id: attemptId, userId } });
  if (!attempt) throw new Error("NOT_FOUND");
  return attempt;
}
