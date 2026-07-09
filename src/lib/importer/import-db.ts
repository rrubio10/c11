import { db } from "@/lib/db";
import { normalizeAnswer } from "@/lib/scoring/normalize";
import { parseMaster, sourceHash } from "./parser";

export async function importMasterText(content: string, sourceName = "C1_exercises_master.txt") {
  const report = parseMaster(content);
  if (report.errors.length) {
    await db.importRun.create({ data: { sourceName, sourceHash: sourceHash(content), status: "FAILED", errorsJson: JSON.stringify(report.errors), warningsJson: JSON.stringify(report.warnings) } });
    return report;
  }
  await db.$transaction(async (tx) => {
    for (const set of report.sets) {
      const exerciseSet = await tx.exerciseSet.upsert({
        where: { externalId: set.setId },
        create: {
          externalId: set.setId, section: set.section, part: set.part, type: set.type, level: set.level,
          title: set.title, instructions: set.instructions, fullText: set.fullText, sourcePages: set.sourcePages,
          transcriptionStatus: set.transcriptionStatus, notes: set.notes, itemCount: set.itemCount, testGroup: set.testGroup,
        },
        update: {
          section: set.section, part: set.part, type: set.type, level: set.level, title: set.title,
          instructions: set.instructions, fullText: set.fullText, sourcePages: set.sourcePages,
          transcriptionStatus: set.transcriptionStatus, notes: set.notes, itemCount: set.itemCount, testGroup: set.testGroup,
          contentVersion: { increment: 1 }, active: true,
        },
      });
      const importedExternalIds: string[] = [];
      for (const item of set.items) {
        importedExternalIds.push(item.id);
        const uniqueAcceptedAnswers = Array.from(
          new Map(
            item.acceptedAnswers
              .filter((answer) => answer.trim().length > 0)
              .map((answer) => [normalizeAnswer(answer), answer.trim()]),
          ).values(),
        );
        const row = await tx.exerciseItem.upsert({
          where: { externalId: item.id },
          create: {
            externalId: item.id, exerciseSetId: exerciseSet.id, number: item.number, prompt: item.prompt,
            optionsJson: JSON.stringify(item.options), keyword: item.keyword, baseWord: item.baseWord,
            correctAnswer: item.correctAnswer, acceptedJson: JSON.stringify(uniqueAcceptedAnswers), maximumPoints: item.maxPoints,
            errorCategory: item.errorCategory, explanation: item.explanation, displayOrder: item.number,
          },
          update: {
            exerciseSetId: exerciseSet.id, number: item.number, prompt: item.prompt, optionsJson: JSON.stringify(item.options),
            keyword: item.keyword, baseWord: item.baseWord, correctAnswer: item.correctAnswer,
            acceptedJson: JSON.stringify(uniqueAcceptedAnswers), maximumPoints: item.maxPoints, errorCategory: item.errorCategory,
            explanation: item.explanation, displayOrder: item.number, active: true,
          },
        });
        await tx.answerVariant.deleteMany({ where: { exerciseItemId: row.id, source: "IMPORT" } });
        for (const answer of uniqueAcceptedAnswers) {
          await tx.answerVariant.create({ data: { exerciseItemId: row.id, answer, normalized: normalizeAnswer(answer), points: item.maxPoints, source: "IMPORT" } });
        }
      }
      await tx.exerciseItem.updateMany({ where: { exerciseSetId: exerciseSet.id, externalId: { notIn: importedExternalIds } }, data: { active: false } });
    }
    await tx.importRun.create({ data: { sourceName, sourceHash: sourceHash(content), status: "SUCCESS", setCount: report.sets.length, itemCount: report.sets.reduce((n, s) => n + s.items.length, 0), errorsJson: "[]", warningsJson: JSON.stringify(report.warnings) } });
  }, { timeout: 120_000 });
  return report;
}
