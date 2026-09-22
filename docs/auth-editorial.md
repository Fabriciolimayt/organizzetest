# Auth and Onboarding: Editorial Product Edition

Date: 2026-09-21

## Scope

Visual-only implementation of the Editorial Product Edition at the top of
`DESIGN.md`, coordinated with the shared root palette and Logo integration.
The existing uncommitted auth behavior and public-site redirects were retained.

Files changed by this task:

- `src/pages/Auth.tsx`: scoped entry class, decorative original ledger picture,
  responsive poster source, dark-header Logo variant. All `.auth-paper` hooks remain.
- `src/pages/auth-paper.css`: scoped mineral surfaces, dark structural headers,
  editorial headings, responsive document-flow layout, input and focus styling,
  onboarding layout and reduced-motion overrides.
- `src/components/onboarding/OnboardingWizardLayout.tsx`: shared presentation
  classes for the existing header, progress, main content and action footer.
- `src/pages/OnboardingWhatsApp.tsx`: scoped labels, responsive phone fields,
  wrapping country names and matching portal surface.
- `src/pages/OnboardingWhatsAppVerificar.tsx`: matching header, title, code,
  status and footer presentation.
- `public/images/auth/organizze-ledger.webp` and
  `public/images/auth/organizze-ledger-mobile.webp`: original poster files copied
  with `cp` from the adjacent Organizze Site `public/media` directory.
- `docs/auth-editorial.md`: this handoff.

No changes to `DESIGN.md`, `index.css`, `product-edition.css`, shared Logo,
dashboard, `main.tsx`, backend, routing or tests were made by this task.
Existing paper-cut assets were left in place, but Auth no longer references them.

## Presentation

Auth is an unframed, full-page composition: dark header, opaque mineral form
area and an original ledger still. The poster becomes a shallow band on narrow
screens. There is no video, ambient animation, nested card or new dependency.
The document owns scrolling; content and enlarged text can increase page height.

Onboarding uses the same dark header and mineral canvas, compact regular serif
titles, fine dividers and existing state-driven controls. Headings consume
`var(--font-editorial)` with the same system-serif fallback. The scoped
`.entry-editorial` rules do not set root theme variables.

All handlers, state, input fields, validation, OAuth, safe `next`, route targets,
storage keys, WhatsApp polling and timers are unchanged. The existing progress
semantics, status announcements and keyboard behavior remain intact.

Integration review identified React Doctor's actual warning on the decorative
`picture[aria-hidden]`, not the Logo. The unsupported attribute was removed;
the image retains `alt=""` and remains decorative. The brand link and shared
Logo retain their accessible names. No auth behavior changed.

## Verification Run

All of the following were run against the shared worktree after integration:

```sh
npm test -- src/test/auth-paper.test.tsx src/test/onboarding-invisible-ledger.test.ts src/test/whatsapp-onboarding-v2.test.ts src/test/public-site.test.ts
npx tsc --noEmit -p tsconfig.app.json
npx eslint src/pages/Auth.tsx src/pages/OnboardingWhatsApp.tsx src/pages/OnboardingWhatsAppVerificar.tsx src/components/onboarding/OnboardingWizardLayout.tsx
git diff --check
```

- 68 tests passed across four files: auth 42, onboarding 15, WhatsApp contract 3,
  public-site redirects 8. No assertion changes were necessary.
- TypeScript, scoped ESLint and whitespace checks passed with exit code 0.
- Vitest emitted only the Node experimental localStorage warning.
- Both copied posters match their Site originals byte-for-byte (SHA-256).

## Browser QA

Chromium for Testing with Playwright, against the existing dev server at
`http://127.0.0.1:56788`. Browser storage and contexts were isolated. External
requests were blocked; auth failure and WhatsApp pending responses were mocked.
Protected onboarding screens used an intercepted synthetic `useAuth` module.
No real account, message, financial record or backend preference was created.

70 layout cases passed: login, signup, name, language, currency, WhatsApp and
verification, each at 320/375/768/1440/1920px and 100%/200% root text size.
Every case checked document overflow, 44px minimum control targets, horizontal
control bounds and clipped control text. No failures or page runtime errors.

Three additional browser scenarios passed:

- Auth alias, retained values across modes, password visibility, mocked loading
  and error recovery, Google disabled during submission, and reduced-motion
  spinner. All eight focusable auth controls showed visible keyboard outlines
  in the expected order.
- Phone validation, country popover and Escape dismissal, pending and expired
  verification states, disabled expired WhatsApp action and reduced-motion status.
- Blocked poster download: the opaque form remained visible and usable.

Desktop/mobile screenshots were captured and representative auth, WhatsApp,
verification and country-menu states were visually inspected. The ledger
loads, form text remains independent of the art, and no overlapping controls
were found in the inspected states.

Temporary QA harness: `/tmp/organizze-entry-editorial-qa.mjs`.
Results and screenshots: `/tmp/organizze-entry-editorial-qa/`, including
`results.json` with 73 recorded cases/scenarios and zero problems. These are
local temporary artifacts, not tracked project files. The separate all-route
integration harness is owned by the coordinating task.

## Limits

This verifies rendering and simulated client states, not live OAuth, account
creation, WhatsApp delivery or a real verified-connection journey. Successful
auth and redirect contracts are covered by the existing mocked unit tests.
No new production Lighthouse measurement, React Doctor run or full production
build was performed by this task; integration build/lint results were reported
separately by the coordinating task. No production performance score is claimed.
Native screen readers and physical mobile devices were not tested.

No commit or publication was made.
