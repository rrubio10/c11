# Reading repair

This package repairs the Reading interfaces and source content that previously displayed raw OCR.

## Repaired C1 Advanced 5 sets

- Test 2: Parts 5, 6, 7 and 8
- Test 3: Parts 5, 6, 7 and 8
- Test 4: Parts 5, 6, 7 and 8

Each set now uses a verified photograph of the original page instead of damaged OCR. Questions and answer options are supplied as structured data. Part 7 shows selectable A-G paragraphs and prevents reuse.

## Existing new-PDF repairs retained

The package also retains the corrected seven new Part 3 sets and the 28 Reading sets extracted from the two supplied PDFs.

## Deployment

Push the project to GitHub and let Vercel deploy it. Runtime content overrides repair existing Neon records without requiring deletion or re-creation of attempts.

For permanent database/admin content, run the importer once after deployment:

pnpm run prisma:generate:pg && pnpm run db:migrate:pg && pnpm run db:import && pnpm run db:validate && pnpm run build

After that, return the Vercel build command to:

pnpm run prisma:generate:pg && pnpm run db:migrate:pg && pnpm run build

## Verification

- Source validation: 106 sets, 815 items, no errors or warnings.
- Database import and validation: 106 sets, 815 items, no errors.
- Unit tests: 28 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build was not completed in the sandbox because the copied node_modules directory is an external symlink, which Turbopack rejects. This packaging issue does not apply after a normal dependency installation on Vercel or Codespaces.
