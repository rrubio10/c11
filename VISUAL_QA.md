# Visual QA mapping

The eight supplied screenshots were reviewed separately and copied to `data/reference-part1.png` through `data/reference-part8.png` for local comparison.

| Reference | Implemented treatment |
|---|---|
| Part 1 | Inline numbered select controls inside a long cloze passage; teal active ring; compact exam header and bottom question strip |
| Part 2 | Inline one-word uppercase fields with the same passage rhythm and numbered navigation |
| Part 3 | Inline transformed-word fields plus a clearly separated base-word list |
| Part 4 | One transformation at a time, highlighted keyword, long answer line, word count and keyword validation |
| Part 5 | Two-pane desktop reading layout with independently scrollable text and current multiple-choice question |
| Part 6 | Reviewer texts on the left and current matching statement on the right |
| Part 7 | Article and numbered gaps on the left, reusable visual option cards on the right; duplicate use is prevented by the answer-selection model when options are unique |
| Part 8 | Consultant/section text on the left and matching statements on the right; options may be reused |

## Shared visual system

- 68px white exam header.
- Light grey-blue application canvas.
- Thin neutral borders and minimal shadows.
- Teal `#007f86` as the primary interactive state.
- Fixed 76px bottom navigator with part groups, answered counts, current question outline and previous/next buttons.
- Desktop reference viewport in Playwright: 1782 × 857.
- Responsive breakpoint stacks reading text and questions below desktop width.
- Official logos and protected brand assets are not reproduced.

## Comparison status

The component geometry, spacing and state hierarchy were implemented from the references. Playwright screenshot/trace configuration is included. In the delivery environment, Chromium navigation to local pages was blocked by a system-wide managed URL policy, so a complete automated pixel-diff run could not be executed there. The application itself was rendered and verified through server-side build, HTTP rendering and integration requests.
