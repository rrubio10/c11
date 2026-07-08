# Delivery verification report

Verification date: 2026-07-08

## Imported data

- Source sets parsed: **50**
- Items parsed/imported: **423**
- Weighted maximum points: **555**
- Part-specific source files checked: **8**
- Answer-index rows checked: **423**
- Duplicate set identifiers: **0**
- Duplicate item identifiers: **0**
- Master/part-file answer mismatches: **0**
- Master/TSV index mismatches: **0**

## Checks completed successfully

- `npm run source:validate`
- `npm run db:setup`
- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test`: **16 tests passed** across parser, idempotent import, scoring, normalisation, solution secrecy and same-origin protection
- `npm run test:smoke`: passed authentication, protected content, autosave, resume, server submission, post-submission review and idempotent double submission
- `npm run build`: production build completed successfully

## Playwright E2E status

The Playwright suite is implemented in `tests/e2e/app.spec.ts` and was invoked with the installed system Chromium. All three tests were prevented from starting by the delivery environment, which returned:

```text
net::ERR_BLOCKED_BY_ADMINISTRATOR
```

The system Chromium is governed by `/etc/chromium/policies/managed/000_policy_merge.json`; its managed URL blocklist also applies to local addresses. Consequently, browser navigation, automated screenshots and pixel-diff comparison could not be completed in this container. The failures occurred at the first `page.goto()` call, before application assertions ran. No claim is made that the E2E suite passed here.

Run `npm run test:e2e:install && npm run test:e2e` in a normal workstation or CI runner without that managed policy.

## Dependency audit

After applying non-breaking audit updates, `npm audit --omit=dev` reports **0 critical, 0 high and 5 moderate** transitive advisories. The remaining advisories are in the current Next.js/Prisma dependency graph; the automated forced remediation proposed incompatible downgrades, so it was not applied. Review and update these dependencies before an internet-facing production release.

## Functional limitations

- Password recovery is not configured because no transactional email provider was supplied.
- Basic rate limiting is process-local and should use Redis or another shared store in a horizontally scaled deployment.
- OCR-labelled passages are preserved and may still require human proofreading through the protected admin editor.
- Proprietary Cambridge logos, protected brand assets and claims of official affiliation were intentionally excluded.
- Automated browser visual comparison was blocked by the managed Chromium policy described above.
