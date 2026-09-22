# Invisible Ledger QA

> Verification date: 2026-08-25
> Branch: `codex/invisible-ledger`
> Reference baseline: `11731d7`
> Scope: visual-system replacement with routes, handlers, Supabase, WhatsApp, Stripe, trial, permissions, and financial calculations preserved.

## Automated Verification

| Gate | Result | Measured evidence |
| --- | --- | --- |
| Vitest | PASS | 22 files and 253 tests passed, including the onboarding cleanup, both zero-allocation boundaries, and 44 px desktop-navigation regressions. |
| TypeScript | PASS | `tsc -p tsconfig.app.json --noEmit` exited with zero errors. |
| Production build | PASS | Vite transformed 2,752 modules and emitted the production assets listed under Performance Measurements. |
| ESLint | PASS WITH WARNINGS | Zero errors and 10 existing Fast Refresh export-shape warnings. |
| Diff integrity | PASS | `git diff --check` produced no output. |
| React Doctor | PARTIAL | The score service was unavailable. Full scope reported 141 findings; changed scope reported 76. The one actionable onboarding timeout cleanup was fixed and regression-tested. Remaining reported errors are a generated carousel cleanup warning and a false positive on the onboarding effect whose interval, timeout, and asynchronous exits are covered by tests. |
| Independent review | PASS | The branch-wide review found three issues; all were corrected. A fresh focused reviewer verified both zero-allocation boundaries, the 44 px desktop navigation target, and the corrected QA wording, then approved with no direct regression. |

React Doctor also flagged client-side Supabase authorization and an old service-role policy. Manual review found that `whatsapp_connections.created_by` is enforced by the `app_v2` RLS policy against `auth.uid()`, while the legacy `public.subscriptions` policy is outside this redesign and service-role traffic bypasses RLS. No schema or authorization behavior was changed for this visual project.

## Route Matrix

Legend:

- **Real PASS**: production/local route was inspected in the browser.
- **Harness PASS**: the real production component was mounted with inert boundary data; no route or handler was replaced.
- **Rendered PASS**: Testing Library drove the real page and handlers at the DOM level; this is workflow evidence, not viewport evidence.
- **Not run live**: the protected route required a safe authenticated disposable session that was not available.

| Route | 375 px | 768 px | 1280 px | Focus / reduced motion | Console evidence |
| --- | --- | --- | --- | --- | --- |
| `/` | Real PASS | Real PASS | Real PASS | CTA/menu focus exercised; reduced motion contract-tested, not browser-emulated | Production preview: 0 warnings, 0 errors |
| `/auth` | Real PASS | Not run | Real PASS | Password focus ring and 48 px controls measured | No route-specific error recorded |
| `/onboarding/nome` | Harness PASS | Harness PASS | Harness PASS | Rendered navigation and semantics PASS | Network/console audit not exhaustive |
| `/onboarding/idioma` | Harness PASS | Harness PASS | Harness PASS | Selection, storage, and navigation PASS | Network/console audit not exhaustive |
| `/onboarding/moeda` | Harness PASS | Harness PASS | Harness PASS | Selection, storage, and navigation PASS | Network/console audit not exhaustive |
| `/onboarding/whatsapp` | Harness PASS | Harness PASS | Harness PASS | Continue/skip, normalization, and RPC boundary PASS | Expected inert-backend error state inspected |
| `/onboarding/whatsapp/verificar` | Harness PASS | Harness PASS | Harness PASS | Pending/error/expired and timer cleanup PASS; live active state rendered in tests | Network/console audit not exhaustive |
| `/dashboard` | Harness PASS | Harness PASS | Harness PASS | Drawer Escape/focus restoration and five mobile destinations PASS | No harness error recorded |
| `/dashboard/lancamentos` | Not run live | Not run live | Not run live | Create/edit/void/delete behavior Rendered PASS; live focus/viewport not run | Not run live |
| `/dashboard/relatorios` | Not run live | Not run live | Not run live | Filters, summaries, and chart text Rendered PASS | Not run live |
| `/dashboard/orcamento` | Not run live | Not run live | Not run live | Allocation reading order and dialog behavior Rendered PASS | Not run live |
| `/dashboard/planos` | Not run live | Not run live | Not run live | Create/edit/delete behavior Rendered PASS | Not run live |
| `/dashboard/limite-de-gastos` | Not run live | Not run live | Not run live | Create/edit/delete and recalculation Rendered PASS | Not run live |
| `/dashboard/objetivos` | Not run live | Not run live | Not run live | Create/edit/delete and progress update Rendered PASS | Not run live |
| `/dashboard/grupos` | Not run live | Harness PASS | Not run live | Pending/expired invitation states PASS at 768 px | Harness: 0 errors |
| `/dashboard/whatsapp` | Harness PASS | Harness PASS | Harness PASS | Composer, auto-follow, and reduced motion `auto` behavior PASS | Harness: 0 errors at all measured widths |
| `/dashboard/diagnostico-whatsapp` | Not run live | Not run live | Harness PASS | Missing-secret/error state PASS | Harness: 0 errors |
| `/dashboard/assinatura` | Harness PASS | Not run live | Harness PASS | Checkout modal, Escape, close, and focus restoration PASS | Harness: 0 errors |

Protected-route navigation itself was verified: without authentication, the router correctly redirected dashboard and onboarding acceptance attempts to `/auth`. No real financial record was created or altered solely for visual QA.

## Core Workflow Results

| Workflow | Result | Evidence |
| --- | --- | --- |
| Login and signup toggle | PASS | Browser toggle at 375 px plus rendered entry tests; labels remained visible and controls measured 48 px. |
| Name/language/currency onboarding | PASS | Rendered route tests drive selections, exact local-storage payloads, and unchanged destinations. |
| WhatsApp skip and verification | PASS WITH LIVE GAP | Skip, link RPC arguments, pending, expiry, active response, storage, preference RPC, interval cleanup, timeout cleanup, and redirect are covered. A live active-number screenshot was not repeated. |
| Dashboard navigation/account menu | PASS | All 10 desktop destinations, exactly five mobile destinations, drawer close, Escape, focus restoration, tour event, sign-out, and subscription links are rendered-tested. |
| Transactions | PASS RENDERED | Create, edit, void, delete, refetch, filters, month navigation, rows, and totals are driven through the real hooks with mocked service boundaries. Live Supabase CRUD was intentionally not performed. |
| Budget, plans, limits, goals | PASS RENDERED | Dialog order, responsive action surfaces, create/edit/delete callbacks, progress, and recalculation pass across 20 financial-control tests. |
| Reports and filters | PASS RENDERED | Current-month totals, chart summaries, accessible chart text, category mapping, and filters pass. |
| Space invitations | PASS | Fifteen invitation tests cover authenticated/anonymous, pending, accepted, expired, error, and token handling; pending/expired UI was inspected at 768 px. |
| WhatsApp workspace | PASS IN HARNESS | Free/disconnected/active states were inspected; the production composer parsed `Gastei 12€ no almoço` into `€12.00`, cleared, and followed the new result. |
| Subscription/test mode | PASS IN HARNESS | Trial/test, lifetime, expired, and paid checkout states were inspected. Modal name, focus containment, Escape, explicit close, and focus restoration pass. |

## Responsive Results

- Landing production preview matched viewport width at 375, 768, and 1280 px. The product stage had equal `scrollWidth` and `clientWidth`, with no heading or visual overlap.
- Onboarding real components were inspected at all three widths. No checked route clipped controls or overflowed horizontally; the 375 px WhatsApp page used normal document scrolling.
- Dashboard shell real components were inspected at all three widths. The desktop rail measured 228 px, mobile navigation exposed five destinations, and the dashboard main remained the sole page-content scroll owner.
- WhatsApp active state was inspected at all three widths; measured document width equaled viewport width and no incoherent overlap was found.
- Auth was directly inspected at 375 and 1280 px. A separate 768 px auth capture was not produced.
- A short-height/200% zoom desktop-rail pass remains unmeasured because the browser service became unavailable during that task.
- Protected financial pages have DOM-level desktop/mobile copies and callback coverage, but no authenticated 375/768/1280 screenshots. This is the principal visual acceptance gap.

## Accessibility And Reduced Motion

- Audited navigation, drawer, dialog, toast, and action controls use a 44 px minimum target; auth controls measured 48 px. The final review corrected desktop navigation from 36 px to 44 px and added a rendered regression test.
- The actual Sonner stylesheet plus compiled Tailwind cascade measures the toast close action at 44 x 44 px. The test proves it falls back to 20 x 20 px when the protection classes are removed.
- Tour overlays expose named dialogs, focus trapping, Escape close, focus restoration, scroll locking, and reduced-motion-aware target scrolling.
- The dashboard drawer and subscription checkout restore focus to the initiating control.
- Financial values use tabular lining numerals; charts include text summaries and tooltips have rendered behavior coverage.
- Landing secondary text measured a 5.94:1 contrast ratio after correction.
- The WhatsApp history production component was browser-exercised with reduced motion and used `scrollIntoView({ behavior: "auto" })`.
- Landing reduced motion and static loading/tour fallbacks are contract/rendered-tested, but the final browser session could not emulate every route under the media query.

## Performance Measurements

Production build output:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| HTML | 1.71 kB | 0.65 kB |
| CSS | 81.42 kB | 14.71 kB |
| ScrollTrigger async chunk | 43.98 kB | 18.26 kB |
| Landing motion async chunk | 70.83 kB | 27.95 kB |
| Main application JavaScript | 1,396.04 kB | 394.18 kB |

GSAP and ScrollTrigger remain dynamically imported from the landing motion boundary and are emitted as separate production chunks. The main application chunk above 500 kB is pre-existing accepted debt and still triggers Vite's chunk-size warning.

Fresh LCP, CLS, and INP/TBT medians were **not measured**. After an initial refused local connection, the in-app browser converted the local page into an internal data-error surface and subsequently blocked local navigation under its URL safety policy. No alternate URL or policy workaround was attempted. Runtime Web Vitals therefore remain a release gate rather than being inferred from static bundle output.

## Console And Network Errors

- Landing production browser run: zero warnings and zero errors after the final landing fixes.
- Task 10 component-harness matrix: zero console errors at 375, 768, and 1280 px, including reduced motion.
- Earlier development runs showed only React Router v7 future-flag warnings; these were not present in the recorded landing production pass.
- The onboarding inert harness intentionally reached its existing polling error state because it had no live connection identity; that is not evidence of a production backend failure.
- The 404 state now emits `console.warn` instead of a false application `console.error`, and its recovery route is `/`.
- Post-fix Task 11 console/browser revalidation was blocked by the local URL safety policy. Rendered tests cover the 404 diagnostic and production state components.
- The Node 25 test workers print an experimental `localStorage` warning when no `--localstorage-file` is supplied. A deterministic memory fallback prevents functional failures; this warning is not produced by the browser app.

## Accepted Debt

1. Run one authenticated disposable-account browser pass across every protected route at 375, 768, and 1280 px, including safe create/edit/void/delete and tooltip checks.
2. Capture mobile and desktop production LCP, CLS, and INP/TBT medians when browser policy permits local preview access.
3. Verify the desktop navigation at an effective 1280 x 450 viewport or 200% zoom.
4. Complete disposable-environment integration smokes for live WhatsApp linking/ingestion and Stripe checkout completion before releasing those workflows.
5. Split the 1.396 MB main application chunk in a dedicated performance change; it predates and is independent of this visual redesign.
6. Resolve 10 Fast Refresh export-shape warnings only through a separate component-module refactor.
7. React Doctor's remote score could not be obtained; rerun when its score service is available.

## Final Decision

**APPROVED FOR DESIGN INTEGRATION; CONDITIONAL FOR PUBLIC RELEASE.**

The automated functional gate passes, the approved Invisible Ledger visual contract is implemented, and every changed public or authenticated surface has either real-browser, real-component harness, or rendered behavioral evidence. No known functional regression remains.

Public-release approval still requires the external checks that could not be completed safely in this session: an authenticated disposable-account browser smoke test for protected financial routes, fresh production Web Vitals/zoom measurements, and disposable live WhatsApp/Stripe integration smokes. These are verification gaps, not known product defects.
