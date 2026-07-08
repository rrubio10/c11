# C1 Practice Lab

Independent web application for practising **Cambridge C1 Advanced Reading and Use of English** with the supplied TXT exercise corpus. The application imports the real exercise data, protects answer keys until submission, autosaves work, grades on the server, stores attempt history and provides administrative content tools.

> Independent educational platform. Not affiliated with or officially endorsed by Cambridge University Press & Assessment.

## Implemented scope

- Use of English Parts 1–4 with part-specific interfaces.
- Reading Parts 5–8 with split reading/question layouts on desktop and sequential responsive layouts on smaller screens.
- Individual parts, full test groups, standalone Key Word Transformations and the 81-item Mega Test.
- Registration, sign-in, persistent database-backed sessions and sign-out.
- Automatic saving, resuming, marking questions, elapsed time and protected submission.
- Server-only objective correction with imported answer variants and imported `max_points`.
- Results, per-part scores, answer review, attempt history, progress by part and frequent-error categories.
- Exercise library filters for section, part, mode and completion state.
- Protected administration for TXT import, OCR text correction, instructions, activation, accepted variants and partial-point variants.
- SQLite development setup and PostgreSQL production schema/adapter support.
- Unit tests, HTTP integration smoke test and Playwright end-to-end suite.

## Source content

The importer uses `data/import/C1_exercises_master.txt` as its primary source and validates it against:

- `ANSWER_INDEX.tsv.txt`
- the eight part-specific TXT files
- `README_FORMAT.txt`
- `QC_REPORT.txt`

The supplied dataset currently imports **50 exercise sets, 423 items and 555 weighted points**. Re-importing is idempotent: records are upserted by external identifiers, and existing attempts are not deleted.

## Requirements

- Node.js 20 or later
- npm
- For local development: no external database is required
- For production with PostgreSQL: a reachable PostgreSQL database

## Quick start with SQLite

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000`.

Local administrator credentials are read from `.env`:

```text
admin@example.local
ChangeMe-123!
```

Change these values before sharing or deploying the application.

`npm run db:setup` performs all of the following:

1. Applies the local SQLite migration.
2. Validates the source TXT files.
3. Creates or updates the administrator account.
4. Imports all exercise data.
5. Validates database counts, identifiers and scores.

## Environment variables

Copy `.env.example` for SQLite development:

```bash
cp .env.example .env
```

Important variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally or a PostgreSQL connection string in production |
| `SESSION_COOKIE_NAME` | Name of the HTTP-only session cookie |
| `SESSION_TTL_DAYS` | Persistent session lifetime |
| `ADMIN_EMAIL` | Administrator created by the seed script |
| `ADMIN_PASSWORD` | Administrator password; use a long random value in production |
| `NEXT_PUBLIC_APP_NAME` | User-facing application name |

No real credentials are stored in the repository.

## PostgreSQL production setup

The repository includes `prisma/schema.postgresql.prisma`, a PostgreSQL migration and a PostgreSQL Prisma adapter. Set a PostgreSQL `DATABASE_URL`, then run:

```bash
cp .env.production.example .env
npm install
npm run prisma:generate:pg
npm run db:migrate:pg
npm run db:seed
npm run db:import
npm run db:validate
npm run build
npm run start
```

The runtime selects PostgreSQL automatically when `DATABASE_URL` starts with `postgres://` or `postgresql://`; otherwise it uses the local libSQL/SQLite adapter.

For a hosted deployment, configure HTTPS, a persistent PostgreSQL database, strong administrator credentials and platform-level rate limiting in addition to the in-process basic limiter.

## Importing or updating TXT content

Place the files in `data/import/` and run:

```bash
npm run source:validate
npm run db:import
npm run db:validate
```

An administrator can also upload a master TXT file from **Admin → Import TXT**.

The parser:

- reads UTF-8;
- extracts `[SET]` and `[ITEM]` blocks;
- preserves multiline `text_begin` / `text_end` content;
- splits `accepted_answers` on `|`;
- validates unique identifiers and `item_count`;
- records warnings and errors in `ImportRun`;
- stores OCR transcription status;
- performs upserts rather than destructive replacement.

## Correction model

Correction happens only in server routes. Before submission, public attempt responses intentionally omit:

- `correctAnswer`
- `acceptedAnswers`
- answer variants
- explanations that reveal the key

Normalisation performs Unicode normalisation, case folding, typographic-apostrophe conversion, trimming and repeated-space reduction. It does not use fuzzy or semantic matching.

Parts 1, 5, 6, 7 and 8 compare the selected option exactly. Parts 2, 3 and 4 compare the normalised response with imported accepted variants. Every item uses its imported `maximumPoints`; no score is inferred from the part number.

For Part 4, imported variants initially receive the full item value. Administrators can add explicit lower-point variants later. The system never invents partial credit.

## Main routes

| Route | Screen |
|---|---|
| `/dashboard` | Overview, continue attempt, full tests and recent results |
| `/library` | Filterable exercise library |
| `/progress` | Weighted performance, part accuracy, errors and history |
| `/sets/[setId]` | Exercise preview |
| `/attempt/[attemptId]` | Exercise runner |
| `/attempt/[attemptId]/results` | Submitted score |
| `/attempt/[attemptId]/review` | Protected answer review |
| `/admin` | Protected administration |
| `/admin/import` | TXT importer |
| `/admin/sets/[setId]` | OCR/content and answer-variant editor |

## Testing and validation

Run the local automated checks:

```bash
npm run source:validate
npm run db:validate
npm run typecheck
npm run lint
npm test
npm run build
```

Run the HTTP integration smoke test while the app is running on port 3100:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
# in another terminal
npm run test:smoke
```

Run browser end-to-end tests:

```bash
npm run test:e2e:install
npm run test:e2e
```

The E2E suite covers authentication, starting an attempt, solution secrecy, autosave, resume, submission, review, mobile layout and admin route protection.

## Security decisions

- Passwords are hashed with bcrypt using a work factor of 12.
- Session tokens are random, stored only as SHA-256 hashes and sent through HTTP-only, SameSite cookies.
- Production cookies use the `Secure` flag.
- Routes verify ownership and roles on the server.
- Inputs are validated with Zod.
- Prisma parameterises database queries.
- Submission and grading run in a transaction and are idempotent.
- Saved answers cannot be modified after submission.
- Correct answers are not rendered, serialised or sent over the pre-submission API.
- Basic rate limits protect authentication and submission. Distributed production deployments should replace the in-memory limiter with Redis or an equivalent shared store.

## Accessibility and responsive behaviour

The interface uses semantic headings, forms and fieldsets, keyboard-operable controls, visible focus states, accessible labels, responsive split panes, touch-sized controls, screen-reader-only legends and reduced-motion support. Reading panes stack on mobile and the fixed question navigator remains horizontally scrollable.

## Visual design

The supplied screenshots were used as the visual reference for the exam runner: a restrained white/grey canvas, teal selection state, compact header, inline numbered gaps, split reading panes and a fixed bottom part navigator. Official Cambridge branding and logos were deliberately not reproduced. See `VISUAL_QA.md` for the screen-by-screen mapping and limitations.

## Technical decisions

- **Next.js App Router** keeps UI and protected server routes in one deployable application.
- **TypeScript strict mode** and **Zod** provide compile-time and runtime validation.
- **Prisma** keeps the data model and transactional grading explicit.
- **SQLite/libSQL** makes local setup one command; a parallel PostgreSQL schema supports production.
- Imported options and accepted answers remain JSON text in normalised parent records while partial-credit variants use a dedicated relational table.
- Database sessions were chosen over browser JWTs so sessions can be revoked and no answer-related state is trusted from the client.

## Known limitations

- Password-reset email is not included because no transactional email provider was supplied. Registration, login, logout and persistent sessions are complete.
- The in-memory rate limiter is appropriate for one local process, not a multi-instance production deployment.
- OCR source text is preserved rather than silently rewritten; flagged text requires administrator review.
- The runner reproduces the supplied interaction and layout closely but does not use protected Cambridge logos, typefaces or proprietary assets.
- Automated screenshot comparison depends on a runnable Chromium installation. The Playwright tests and reference viewport are included, but execution may be restricted in locked-down environments.

## Project structure

```text
prisma/                  SQLite schema and migration
prisma/postgresql-*      PostgreSQL production migration/configuration
scripts/                 setup, import, validation, seed and smoke tests
src/app/                 App Router pages and API routes
src/components/exam/     part-specific exam runner
src/lib/importer/        TXT parser and idempotent importer
src/lib/scoring/         exact normalisation and grading
src/lib/auth/            database-backed sessions
src/generated/           generated SQLite and PostgreSQL Prisma clients
tests/unit/              parser, scoring and secrecy tests
tests/e2e/               Playwright workflows
data/import/              supplied exercise corpus and QA files
data/reference-part*.png visual references
```
