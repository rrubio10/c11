# Complete Part 3 and Reading repair

This version repairs the newly imported Cambridge C1 exercises.

## What changed

- All seven new Part 3 sets were proofread against the supplied source scans.
- Every Part 3 gap is explicit and every base word is stored separately.
- All 28 new Reading sets (Parts 5-8) are present.
- Parts 5, 6 and 8 display the verified source pages directly, with zoom controls, so OCR corruption cannot alter the passage.
- Part 7 uses proofread article text, real gap positions and complete A-G paragraph choices.
- All Reading question prompts, options and official answers are stored as structured item data.
- The importer keeps explicit instructions and removes duplicate accepted-answer variants.
- The combined database contains 106 sets and 815 items.

## Apply to an existing Vercel database

Use this Build Command once:

```bash
pnpm run prisma:generate:pg && pnpm run db:migrate:pg && pnpm run db:import && pnpm run db:validate && pnpm run build
```

Redeploy without the old build cache. After the successful import, return to:

```bash
pnpm run prisma:generate:pg && pnpm run db:migrate:pg && pnpm run build
```

The import uses upserts. Existing users, attempts and statistics are not deleted.
