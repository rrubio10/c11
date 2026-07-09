# Reading and review interface patch

## Corrected in this version

- Part 1 answer review now shows both the selected letter and the option text, for example `D — unlikely`.
- Part 3 has a dedicated word-formation layout: compact article flow, no duplicated base words and a separate ordered `Words given` panel.
- Part 5 has a dedicated reading-comprehension renderer with the article on the left and the complete current question and A–D options on the right.
- Part 6 presents the four labelled texts as separate cards and displays the complete matching statement.
- Part 7 places gaps inside the article, shows the full A–G paragraph bank and prevents the same paragraph being used twice.
- Part 8 presents labelled sections separately and derives the allowed options from the exercise instead of always inventing an extra option.
- Matching-question parsing now recognises questions whose number appears at the end or in the middle of a wrapped statement.
- Test 1 Reading Parts 5–8 were manually reconstructed from the supplied scan and are imported as `verified_from_source_scan`.
- Previously audited answer corrections and accepted-answer variants were applied to the master data and answer index.

## Verification completed

- Source validation: 50 sets, 423 items, 8 part files and 423 answer-index rows; zero errors.
- Database setup/import/validation: passed with 50 sets and 423 items.
- TypeScript strict check: passed.
- ESLint: passed.
- Vitest: 20 tests passed.
- HTTP smoke test: registration, authentication, protected exercise data, autosave, resume, submission, review and idempotent resubmission passed.
- Production build: passed.

## Visual test limitation

The supplied system Chromium is controlled by a managed policy and returns `net::ERR_BLOCKED_BY_ADMINISTRATOR` for local URLs. The Playwright visual screenshot run therefore could not start in this environment. The application was still validated through compilation, server rendering, HTTP integration tests and the production build.

## Remaining content limitation

Some scanned Reading passages outside Test 1 still contain imperfect OCR in the original data. The new renderers display structured content correctly when prompts, sections and paragraph options are available, and show a transcription warning for unverified OCR sets. Those remaining passages should be proofread from their source pages through the protected admin editor.
