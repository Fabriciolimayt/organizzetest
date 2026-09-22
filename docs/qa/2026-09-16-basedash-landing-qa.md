# Basedash Landing QA - 2026-09-16

## Scope And Status

Branch: `codex/invisible-ledger`. Runtime candidate: `c72a0e7`.

Tasks 1-8 are implemented. Task 9 verification is delivered for the user's visual review; the rendered-landing approval checkpoint remains open. Tasks 10-16 have not started in this phase. This is not a claim that the whole application redesign or production deployment is complete.

Public content is synthetic. No customer records, database schemas, private API secrets, Edge Functions, payments or WhatsApp messages were modified. `src/hooks`, `src/lib/finance`, `supabase` and `infra` have no diff against the continuation baseline `de1b388`.

## Automated Verification

| Check | Result |
| --- | --- |
| `pnpm exec vitest run --maxWorkers=2` | PASS: 31 files, 337 tests |
| `pnpm exec tsc -p tsconfig.app.json --noEmit` | PASS |
| `pnpm run build` | PASS; existing large-chunk warning remains |
| `pnpm run lint` | PASS: 0 errors, 27 existing Fast Refresh warnings |
| React Doctor changed scope against `de1b388` | PASS: 0 errors, 0 warnings |
| `pnpm run verify:production-diagnostics` | PASS: react-grab/react-scan absent from production bundle |
| `git diff --check` | PASS |

Baseline Node localStorage and React Router future-flag warnings remain in Vitest. Lint includes an ignored older QA harness as well as existing shared components; these warnings were not suppressed.

## Browser Verification

Production preview: `http://127.0.0.1:56784/`, real headless Chromium via Playwright.

PT-PT: 375x812, 768x1024, 1280x800, 1280x450. Reduced-motion runs at 375x812 and 1280x800. Supplemental PT-BR runs at widths 375, 768 and 1280, including dynamic reduced-motion changes.

Verified:

- All eleven scenes render in the approved order, without horizontal overflow or page errors.
- Opening is fully legible, with no overlapping financial planes. Mobile and short desktop keep optional detail behind a keyboard-accessible disclosure.
- Next-scene start: y=670.2 at 375x812, y=647.4 at 768x1024, y=635.8 at 1280x800, y=359.6 at 1280x450.
- Four monthly tabs are functional and keyboard-operable; scene height is identical between panels at every tested size.
- Mobile menu focuses its first item, closes with Escape and restores focus to the trigger.
- Signature does not complete its animation offscreen; it reveals when reached. Nested interpretation/planning elements receive their own triggers.
- Reduced motion removes animation transforms and opacity changes, including when toggled after load.
- Main CTA navigates to `/auth`; back navigation restores all eleven scenes. No credentials were submitted.
- `/auth` renders the email field. `/signup` and unauthenticated `/onboarding/nome` preserve the existing redirect to `/auth`.

Screenshots were inspected for opening, data density, WhatsApp interpretation, pricing and responsive layouts. Some full-element screenshots contain the fixed header in the middle of a tall section: this is the capture geometry, not a header positioned inside that section. Viewport opening screenshots provide the actual above-fold layout.

## Performance: Measured Debt

Lighthouse 12.8.2, three sequential runs per profile against the production build, no artificial removal of Stripe or other runtime dependencies. Results below are medians, not production field measurements.

| Profile | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop 1280x800 | 99 | 100 | 78 | 100 | 0.887 s | 0.00378 |
| Mobile simulated | 61 | 100 | 79 | 100 | 4.162 s | 0 |

The all-100 target is **not met**. Mobile loading is outside the desired budget. The existing eager application bundle includes protected-route dependencies, and the existing Stripe import starts its SDK on the public route. Stripe third-party-cookie diagnostics caused Best Practices to vary between 78/79 and 100. This was observed, not hidden with request blocking or a changed audit threshold.

Build sizes: main JS 1,454.55 kB / 405.37 kB gzip; CSS 90.85 kB / 16.34 kB gzip. GSAP and ScrollTrigger are separate dynamic chunks, 70.83 and 43.98 kB raw respectively. Fonts are bundled locally.

Next performance work should isolate route/checkout dependencies and remeasure all entry, protected and payment flows. This requires targeted regression coverage; it was not folded silently into a presentation-only milestone.

## Independent Review

Three scoped implementation agents and a separate read-only integration review were used. Review found no business-flow, checkout, data-exposure, locale or keyboard regression. Two motion findings were corrected and re-reviewed: offscreen signature completion and skipped nested reveals. A JSDOM-only reduced-motion test synchronization issue was also fixed; the final full suite is green.

## Evidence And Remaining Limits

Local evidence is in `/tmp/organizze-landing-qa/`; its preserved copy is `.continuacao-local/evidencias/` inside the Desktop handoff directory. It includes desktop/mobile/extra JSON, screenshots, Lighthouse reports and the verification scripts.

- No live authenticated CRUD, payment, QR, receipt processing or Railway availability check was performed. Existing unit/integration tests are not evidence of current remote availability.
- No deployment or push was performed.
- User approval of this rendered landing is still required before the next design phase.
- Mobile performance and Stripe's early load remain explicit follow-up work.
- Continuation instructions, private-file handling and exact paths are in `CODEX_HANDOFF.md`.
