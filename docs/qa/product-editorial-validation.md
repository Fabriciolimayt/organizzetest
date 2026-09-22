# Product Editorial Browser QA

## Run

From the invisible-ledger worktree, with the shared app already running:

```sh
QA_URL=http://127.0.0.1:56788 node scripts/qa-product-editorial.mjs
```

The harness does not start, stop or modify the shared server. It uses the same
external Playwright module and Chromium executable as `scripts/qa-auth-paper.mjs`.
No package installation is needed. `CHROME_PATH` can override the executable.
The default output is `artifacts/product-editorial/validation/`.

```sh
# Screenshot-only route baseline, before interaction testing.
QA_URL=http://127.0.0.1:56788 QA_RUN=baseline-new node scripts/qa-product-editorial.mjs --baseline

# Complete run in a separate artifact directory.
QA_URL=http://127.0.0.1:56788 QA_RUN=final node scripts/qa-product-editorial.mjs

# Focused rerun, explicitly reported as partial coverage.
QA_URL=http://127.0.0.1:56788 QA_RUN=focus QA_ONLY=transactions-interaction@375 node scripts/qa-product-editorial.mjs
```

`QA_ONLY` matches a substring of the case name and width; comma-separated values
are OR selections (for example `navigation-keyboard@768,account-direct`). An unmatched selection
fails rather than passing an empty suite. `QA_RUN` accepts a plain directory name.
Use distinct run names to retain earlier evidence. Assertions are accumulated;
one failing route does not stop other routes. Exit status is 1 for failures,
uncovered fixtures, runtime errors or the 12-minute overall deadline. Actions
normally time out after 3.5 seconds; navigations after 12 seconds. Query-error
scenarios allow the existing React Query retries to finish, without changing hooks.

## Isolation

- Each case has a fresh non-persistent browser context. No CDP connection,
  existing profile, saved cookies, HAR, trace, video or storage-state export.
- A synthetic `sb-<project-ref>-auth-token` is inserted before application code.
  The session, identity, email, names, IDs, amounts and dates are artificial. The
  JWT signature is deliberately invalid. Token contents are never logged.
- The public project reference is extracted in memory from the locally served
  browser client module. No `.env`, secret file or user browser state is read.
  For a production preview without that module, provide `QA_PROJECT_REF`, which
  is a public project reference, not an API key or session token.
- `QA_URL` must be loopback. Only GET/HEAD requests to that exact origin can
  reach the server. Local fonts and artwork are allowed. Other HTTP requests
  fail closed through a context guard, including popup first requests.
- `page.route("https://*.supabase.co/**")` serves known read fixtures. Unknown
  paths, schemas, projections, filter columns/operators and orders return a
  synthetic error and are included in `uncovered` in `results.json`.
- All financial/account writes, RPCs, checkout, messages and uploads are blocked.
  The only explicitly simulated POST is a held password-login request returning
  a synthetic 400 error. It cannot authenticate or reach Supabase.
- Service workers are blocked. All WebSockets, including Vite HMR, are closed.
  Application source can still change between separate navigations on the shared
  server; runs record start/end timestamps and are not immutable build audits.
- Reports contain method, redacted target class, endpoint path and query-key
  names only. No request/response bodies, headers, credential values or tokens.

## Fixtures

`scripts/product-editorial-fixtures.mjs` mirrors the current read shapes in
`useFinancialContext`, `useTransactionsV2`, `useBudgetsV2`,
`useFinancialControlsV2`, `useSpacesV2` and `useSubscriptionV2`.

Covered reads: `spaces`, `space_members`, `profiles`, `space_invitations`,
`categories`, `transactions`, `budget_plans`, `budget_allocations`,
`spending_limits`, `financial_goals`, `subscriptions`, `whatsapp_connections`,
`GET /auth/v1/user` and `GET /functions/v1/whatsapp-diagnostico`.

The fixture engine applies the requested comparisons, date intervals, ordering,
limit, offset, projection and object/array response shape. It does not return a
generic success for unknown requests. The fake active subscription enables the
readable product surfaces without invoking checkout. The diagnostic configuration
contains synthetic booleans only, never secret values.

The browser clock is fixed at 2026-09-21 12:00 UTC; locale is pt-PT and timezone
Europe/Lisbon. Timers still run. Data includes long names, million-scale amounts,
five current-month transactions, a prior-month transaction, confirmed/pending/
void statuses, income/expense/transfer types, a budget, limits and a goal.

## Coverage

| Surface | Widths | Evidence |
| --- | --- | --- |
| Primitive showcase | 375, 768, 1440 | Route-specific ready heading and screenshots |
| `/dashboard` | 320, 375, 768, 1440, 1920 | Populated read fixtures, geometry, screenshots |
| All ten dashboard routes | Same five widths | lancamentos, relatorios, limite-de-gastos, orcamento, planos, objetivos, grupos, whatsapp, diagnostico-whatsapp, assinatura |
| Onboarding | Same five widths | nome, idioma, moeda; blank-name disabled state, keyboard continuation/language/currency selection |
| Auth | Same five widths | Login/signup presentation, alias, unauthenticated redirect, persistent labels, keyboard focus, password visibility, retained email, held loading and synthetic error |
| Navigation | Same five widths | Skip-link focus, all destinations, mobile five-item bar, modal keyboard containment, Escape restoration, desktop fixed sidebar, light account-menu portal |
| Transactions | Same five widths | Table/mobile rows, search/type/category/status filters, light select portal, create/edit/delete dialogs, keyboard containment, Escape and cancel; never save/delete |
| Text at 200% | 320 and 1440 | Every route above and transaction dialog; computed font and line-height doubled together, not native browser zoom |
| Empty/loading/error | 320 and 1440 | Dashboard and transactions, held loading release and retry recovery |
| Session redirects | 375 | Synthetic existing session, safe local `next`, rejected external `next` |

All widths use reduced motion and a device scale factor of 1. Narrow/tablet
viewports are 844px tall; wide viewports 960px. The scroll-owning dashboard main
also gets bottom screenshots at 320 and 1440; a full-page browser screenshot
alone does not expand an internal scroll container.

Geometry checks document/main horizontal overflow, visible content beyond the
viewport, control text clipping and broken local images. Native input content
may scroll horizontally, but input box boundaries are still checked. Truly
screen-reader-only elements are excluded unless focused. Transformed progress
segments and intentional horizontal table scrolling are not page overflow.
Small targets are recorded for review rather than universally failed. At 200%,
word wrapping alone is review-only, not evidence of missing content.

This is not a WCAG certification, contrast audit, screen-reader test, native zoom
test, cross-browser audit or performance measurement. There are no Lighthouse
claims from this development-server harness. Successful live signup/OAuth,
checkout, receipt processing, WhatsApp linking/sending, invitations, viewer
permissions and multi-space switching remain untested. Empty/loading/error are
not exhaustive across all nested routes. Read-fixture success does not establish
backend, authorization, calculation or production-service correctness.

## Evidence And Classification

- `artifacts/product-editorial/baseline/`: original 81 screenshots before the
  mobile fixes. Its original 55 layout failures include the subsequently corrected
  sr-only/native-input/progress detector noise; do not treat that count as 55 app bugs.
- `artifacts/product-editorial/validation/`: intermediate full run during shared
  edits, before final timing waits and text-line-height refinement. It is not the
  final acceptance report.
- `artifacts/product-editorial/focus-confirmation/`: independent 375px transaction
  focus rerun with a 1.5-second restoration wait. Confirmed missing trigger focus.
- `artifacts/product-editorial/final/`: refreshed complete matrix with refined
  detectors. `progress.json` updates after each case; `results.json` and `report.md`
  are written at completion. Final findings are summarized below after review.

No application source, provider, hook, data file, dependency or secret was changed
by this QA task. No commits were created.

## Latest Verified State

**Closed 2026-09-21 03:39:51 UTC:** `artifacts/product-editorial/closure/` has
11 targeted cases, **77 passing checks, zero failures**, 17 screenshots and
four review-only amount-wrapping observations. The final pass took 20 seconds.
It covers the last changed mobile screens, dashboard at 200%, the corrected
subscription heading, and account Escape at 768px with and without the nav sheet.
There were no uncovered fixtures or financial/account mutations. Two external
resource requests were blocked by the guard; no external requests went live.

The complete `final/` run happened before the last application fixes. Its 18
failures are classified below; do not treat its aggregate as the current bug count.
Targeted reruns deliberately replace affected cases instead of repeating a
four-minute matrix. This is combined evidence, not one atomic build certification.

| Earlier result | Classification | Latest evidence |
| --- | --- | --- |
| Five auth-state timeouts | Harness read the dashboard heading before the unauthenticated redirect completed. Explicit URL wait fixed; no assertion removed. | `final-auth/`: 5 cases, 65 passed, zero failures |
| Five transaction Escape focus failures | Real missing restoration, still reproducible after a 1.5-second wait. Application owner fixed trigger capture/restoration. | `latest-fixes/`: transaction flows pass all five widths |
| Three transaction layout failures | Real type-segment clipping at 320 normal/200% and 1440 at 200%. Owner changed the type grid. | `latest-fixes/`: all transaction dialog screenshots pass |
| Four dashboard/subscription 200% layout failures | Real internal scroll overflow/control clipping, not harmless word wrapping. Owner fixed metric/category layout and subscription rows/heading. | `closure/`: dashboard passes 320/1440, subscription passes 320; no content loss |
| One account Escape failure at 768 | Real interaction sequence: after nav sheet close, account tooltip `instant-open` and dropdown `open` coexist. First Escape closes only tooltip, leaving menu focused/open beyond 3.5s. Direct mouse/keyboard opening in fresh contexts did not fail. | `exact-diagnostics/` isolates cause; owner controls tooltip while menu open. `menu-fixed/`: 3 cases, 18 passed, zero failures |

Normal-scale presentation is clean across the 55 dashboard-route/width pairs,
15 onboarding pairs and auth login/signup at all five widths in `final/`.
Primitive screenshots pass at 375/768/1440. Empty/loading/error/retry checks pass
for dashboard and transactions at 320/1440. There are no uncovered fixture
requests or attempted financial/account mutations in these runs.

### Resolved Subscription Reproduction

Subscription at 320px, text at 200%: `h2#active-capabilities-title`, text
"Capacidades ativas do espaco". Its border box begins at x=89, is 194px wide,
and the first text line is 250px wide, ending at x=339. Main client width is
320; scroll width 339. This is the 19px overrun; the document itself remains
contained. The source was the capability heading beside its icon, not plan
buttons. Historical evidence: `subscription-element/results.json`,
`intrinsicOverflow` and `overflowText`. The owner added word breaking to the
heading. The `closure/` rerun confirms main client/scroll width both 320px at
the top and bottom, with no overflow. A scoped rerun command is:

```sh
QA_RUN=subscription-fixed QA_ONLY=text200-dashboard-assinatura@320 node scripts/qa-product-editorial.mjs
```

### Review-Only Observations

At 200%, long words and amounts can wrap while remaining reachable. Those are
recorded as review observations, not silently treated as absent or as automatic
WCAG failures. The enlarged desktop wordmark is clipped by the fixed sidebar in
some screenshots; the link retains its accessible name and the product remains
identifiable. This cosmetic stress limitation is separate from lost controls,
horizontal content overflow or focus failures. No normal-scale logo clipping
was observed. Full keyboard/screen-reader certification remains out of scope.
