import { db } from "../src/lib/db";
const sets = await db.exerciseSet.findMany({ include: { items: true } });
const errors: string[] = [];
for (const set of sets) {
  if (set.itemCount !== set.items.filter((i) => i.active).length) errors.push(`${set.externalId}: expected ${set.itemCount}, got ${set.items.length}`);
  for (const item of set.items) {
    if (!item.correctAnswer || !JSON.parse(item.acceptedJson).length) errors.push(`${item.externalId}: missing answer`);
  }
}
const duplicateIds = await db.$queryRaw<Array<{ externalId: string; c: number }>>`SELECT externalId, COUNT(*) c FROM ExerciseItem GROUP BY externalId HAVING c > 1`;
if (duplicateIds.length) errors.push(`Duplicate item ids: ${JSON.stringify(duplicateIds)}`);
console.log(JSON.stringify({ setCount: sets.length, itemCount: sets.reduce((n, s) => n + s.items.length, 0), errors }, null, 2));
await db.$disconnect();
if (errors.length) process.exit(1);
