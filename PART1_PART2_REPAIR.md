# Part 1 and Part 2 repair

This revision repairs the fourteen newly imported Part 1 and Part 2 sets:

- C1 Advanced 1 Tests 1–4, Parts 1–2.
- Exam Booster Worksheets 1–3, Parts 1–2.

## Changes

- Proofread the passages against the original PDF pages.
- Restored every numbered gap exactly once.
- Corrected duplicated or missing gap numbers in Tests 2–4.
- Removed OCR debris, repeated instructions and broken characters.
- Preserved all verified answer keys.
- Preserved and verified four A–D options for every Part 1 item.
- Added runtime overrides so stale Neon records display the repaired text and options immediately after deployment.
- Made the inline renderer accept both dotted gaps and bare numbered gap markers.
- Added a fallback answer area if a future source contains an unpositioned gap.
- Added importer warnings for missing Part 1 options and missing Part 1/2 gap markers.

## Production update

Deploying the code fixes the runtime presentation through content overrides. Reimporting the master TXT is still recommended so the corrected content is stored permanently in PostgreSQL:

```bash
pnpm run prisma:generate:pg && pnpm run db:migrate:pg && pnpm run db:import && pnpm run db:validate && pnpm run build
```
