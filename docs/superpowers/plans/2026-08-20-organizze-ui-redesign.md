# Organizze UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dark glass interface with the approved light “Livro Financeiro Humano” system across every customer-facing route without changing financial, Supabase, WhatsApp, Gemini, or Stripe behavior.

**Architecture:** Introduce the visual system from `DESIGN.md` at the global token layer, then migrate shared primitives and the application shell before touching product pages. Route groups are migrated in dependency order so each commit remains functional and visually testable.

**Tech Stack:** Vite 5, React 18, TypeScript 5.8, Tailwind CSS 3.4, shadcn/Radix, Lucide, Recharts, Vitest, Testing Library, in-app Chromium QA.

**Spec:** `docs/superpowers/specs/2026-08-20-organizze-ui-redesign-design.md`

## Global Constraints

- `DESIGN.md` is the source of truth for color, typography, spacing, components, motion, depth, and accessibility.
- Preserve all hooks, RPC calls, Supabase schemas, RLS expectations, WhatsApp behavior, Gemini parsing, Stripe behavior, and route URLs.
- Light mode is the release target; dark-theme completion is deferred.
- No gradients, glassmorphism, glow, decorative blobs, nested cards, or panel radii above 8px.
- Use Lucide because it is the project’s installed icon library; every icon-only action needs an accessible name and tooltip.
- Use `100dvh` for the application shell, one named scroll owner, 44px mobile targets, WCAG 2.2 AA, and reduced-motion support.
- Validate at 375px, 768px, and 1280px; primary content must not overflow horizontally.
- Run the complete functional gate after every route group: `pnpm run test`, TypeScript, lint, and build.

---

## File Structure

### Create

- `src/components/dashboard/PageHeader.tsx`: shared page title, context, controls, and action cluster.
- `src/components/dashboard/MetricStrip.tsx`: responsive financial metrics with semantic variants.
- `src/components/dashboard/FinancialRow.tsx`: scan-friendly transaction/category/member/goal row.
- `src/components/dashboard/DashboardNav.tsx`: grouped desktop navigation, mobile bottom navigation, and secondary menu data.
- `src/components/design-system/PrimitiveShowcase.tsx`: internal state harness for the primitive gate.
- `src/test/design-system-v3.test.ts`: source and token contract tests for the redesign.
- `src/test/dashboard-shell-v3.test.ts`: shell and navigation contract tests.

### Modify

- `src/index.css`, `tailwind.config.ts`: global tokens, fonts, base states, surface rules, and reduced motion.
- `src/main.tsx`: dev-only diagnostics wiring if installed tooling requires runtime initialization.
- `src/App.tsx`: dev-only showcase route with no production exposure.
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/badge.tsx`: semantic primitive alignment.
- `src/components/dashboard/DashboardLayout.tsx`, `DashboardCard.tsx`, `EmptyState.tsx`, `MonthSelector.tsx`, `QuickActionButton.tsx`: shell and legacy primitive migration.
- `src/pages/Dashboard*.tsx`: dashboard route groups.
- `src/pages/Auth.tsx`, `AcceptInvitation.tsx`, `Onboarding*.tsx`: public/authenticated onboarding surfaces.

---

### Task 1: Token Foundation and Primitive Showcase

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/design-system/PrimitiveShowcase.tsx`
- Create: `src/test/design-system-v3.test.ts`
- Test: `src/test/design-system-v3.test.ts`

**Interfaces:**
- Produces: semantic CSS tokens from `DESIGN.md`, `.surface-panel`, `.financial-value`, `.focus-ring`, and `PrimitiveShowcase`.
- Consumes: existing Tailwind semantic names and shadcn primitives.

- [ ] **Step 1: Write the failing token contract test**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

describe("Organizze light design system", () => {
  it("uses the approved light tokens and removes legacy glass effects", () => {
    expect(css).toContain("--background: 40 24% 97%");
    expect(css).toContain("--primary: 151 35% 30%");
    expect(css).toContain("font-family: 'Manrope'");
    expect(css).not.toContain(".glass-card");
    expect(css).not.toContain("gradient-mesh");
    expect(css).not.toContain("animate-blob");
  });
});
```

- [ ] **Step 2: Run the contract test and confirm the legacy theme fails it**

Run: `pnpm exec vitest run src/test/design-system-v3.test.ts`

Expected: FAIL because the light tokens are absent and legacy glass selectors remain.

- [ ] **Step 3: Replace the global theme with the documented tokens**

Implement the light HSL palette, Manrope and Newsreader font import, radius values of 6px/8px, tabular numeric utility, tonal surface utility, focus-visible ring, and reduced-motion rules in `src/index.css`. Remove all glass, mesh, glow, shimmer, and blob utilities.

- [ ] **Step 4: Build the primitive state harness**

`PrimitiveShowcase` must render buttons, icon buttons, inputs, badges, metric values, panels, rows, empty/loading/error states, and navigation states. Add a route only when `import.meta.env.DEV` is true:

```tsx
{import.meta.env.DEV && <Route path="/__design-system" element={<PrimitiveShowcase />} />}
```

- [ ] **Step 5: Wire React diagnostics behind the development gate**

Follow `frontend-ui-ux/references/design/react-dev-tooling-skill.md`. Install only dev dependencies and ensure no diagnostic import reaches the production bundle. Verify with `pnpm run build` and `rg "react-scan|react-grab" dist`.

- [ ] **Step 6: Verify primitives visually**

Open `/__design-system` at 375px, 768px, and 1280px. Exercise hover, focus, active, disabled, loading, empty, and error states. Confirm no horizontal overflow and record screenshots under `/tmp/organizze-ui-qa/task-1/`.

- [ ] **Step 7: Run and commit**

Run: `pnpm exec vitest run src/test/design-system-v3.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint && pnpm run build`

Commit: `feat: establish organizze light design foundation`

---

### Task 2: Responsive Application Shell

**Files:**
- Create: `src/components/dashboard/DashboardNav.tsx`
- Modify: `src/components/dashboard/DashboardLayout.tsx`
- Modify: `src/components/Logo.tsx`
- Create: `src/test/dashboard-shell-v3.test.ts`

**Interfaces:**
- Produces: `primaryNavGroups`, `mobilePrimaryLinks`, `DashboardNav`, and the fixed-sidenav/scroll-body shell.
- Consumes: subscription state, React Router navigation, existing account actions, and active-space context.

- [ ] **Step 1: Write the failing navigation contract**

```ts
it("groups desktop navigation and limits mobile primary navigation to five destinations", () => {
  expect(source).toContain('label: "Acompanhar"');
  expect(source).toContain('label: "Planear"');
  expect(source).toContain('label: "Partilhar e automatizar"');
  expect(source).toContain("mobilePrimaryLinks");
  expect(source).toContain('aria-label="Navegação principal"');
  expect(source).toContain('aria-label="Navegação móvel"');
});
```

- [ ] **Step 2: Run the test and confirm the top-header navigation fails it**

Run: `pnpm exec vitest run src/test/dashboard-shell-v3.test.ts`

- [ ] **Step 3: Implement grouped navigation data and reusable navigation items**

Desktop groups: Acompanhar, Planear, Partilhar e automatizar. Mobile destinations: Visão geral, Lançamentos, Orçamento, Relatórios, Menu. Place diagnostics and account utilities inside the secondary menu.

- [ ] **Step 4: Replace the shell layout**

Use a fixed 232px desktop side navigation and a single scrolling `<main>`. At tablet width collapse navigation into a Sheet; at mobile width show the bottom navigation. Remove `Blobs`, floating tutorial buttons, the overflowing horizontal nav, and the separate subscription ribbon.

- [ ] **Step 5: Verify shell behavior**

At each breakpoint, navigate every destination, tab through navigation, open/close the mobile menu, and confirm the active route uses `aria-current="page"`. Stress one long route and confirm only `<main>` scrolls.

- [ ] **Step 6: Run and commit**

Run: `pnpm exec vitest run src/test/dashboard-shell-v3.test.ts src/test/dashboard-v2.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint && pnpm run build`

Commit: `feat: redesign the organizze application shell`

---

### Task 3: Shared Financial Primitives

**Files:**
- Create: `src/components/dashboard/PageHeader.tsx`
- Create: `src/components/dashboard/MetricStrip.tsx`
- Create: `src/components/dashboard/FinancialRow.tsx`
- Modify: `src/components/dashboard/DashboardCard.tsx`
- Modify: `src/components/dashboard/EmptyState.tsx`
- Modify: `src/components/dashboard/MonthSelector.tsx`
- Modify: `src/components/dashboard/QuickActionButton.tsx`
- Modify: `src/test/design-system-v3.test.ts`

**Interfaces:**
- Produces: `PageHeaderProps`, `MetricItem`, `MetricStripProps`, `FinancialRowProps`, and the `DataPanel` behavior through `DashboardCard`.
- Consumes: React nodes, semantic variants, accessible labels, and existing child content.

- [ ] **Step 1: Extend the failing contract test**

```ts
expect(pageHeader).toContain("title: string");
expect(metricStrip).toContain("items: MetricItem[]");
expect(financialRow).toContain("amount?: ReactNode");
expect(emptyState).toContain("description");
expect(dashboardCard).not.toContain("glass-card");
```

- [ ] **Step 2: Run the focused test and confirm the new modules are missing**

Run: `pnpm exec vitest run src/test/design-system-v3.test.ts`

- [ ] **Step 3: Implement the three new primitives**

Use clusters that wrap before collision, tabular financial values, semantic variants that do not rely on color alone, and optional action slots. Keep each file below 140 lines and avoid route-specific assumptions.

- [ ] **Step 4: Migrate legacy dashboard primitives**

Turn `DashboardCard` into the documented Data Panel with full header/body composition, update Empty State to statement + description + action, and replace Month Selector arrows with labeled icon buttons and a stable-width period label.

- [ ] **Step 5: Re-run the primitive showcase**

Add the new primitives to `/__design-system`, then repeat 375px/768px/1280px state QA and keyboard checks.

- [ ] **Step 6: Run and commit**

Run: `pnpm exec vitest run src/test/design-system-v3.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint`

Commit: `feat: add reusable financial interface primitives`

---

### Task 4: Dashboard and Transactions

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/DashboardLancamentos.tsx`
- Modify: `src/components/TransactionDialog.tsx`
- Modify: `src/test/dashboard-v2.test.ts`
- Modify: `src/test/transactions-v2.test.ts`

**Interfaces:**
- Consumes: `PageHeader`, `MetricStrip`, `FinancialRow`, `DashboardCard`, existing finance hooks, and transaction mutations.
- Produces: the primary reference implementation for financial hierarchy and mobile row behavior.

- [ ] **Step 1: Add failing source contracts for hierarchy and safety**

```ts
expect(dashboard).toContain("<MetricStrip");
expect(dashboard).toContain("<FinancialRow");
expect(dashboard).not.toContain("Primeiros passos");
expect(transactions).toContain("<PageHeader");
expect(transactions).toContain("<FinancialRow");
expect(transactions).toContain("AlertDialog");
```

- [ ] **Step 2: Run dashboard and transaction tests and confirm failure**

Run: `pnpm exec vitest run src/test/dashboard-v2.test.ts src/test/transactions-v2.test.ts`

- [ ] **Step 3: Recompose the dashboard**

Keep existing data and mutations. Render a compact Page Header, four-item Metric Strip, budget allocation region, recent transaction region, and one category list-detail region. Remove duplicated mobile blocks, promotional copy, floating help, and nested cards.

- [ ] **Step 4: Recompose transactions and its dialog**

Desktop uses a filter cluster plus aligned rows; mobile uses labeled stacked rows. Preserve month, type, category, editing, deletion confirmation, and permission behavior. Make inputs and actions follow the shared primitive states.

- [ ] **Step 5: Exercise workflows in the browser**

At all breakpoints: switch categories, change month, filter transaction type, open add/edit dialogs, cancel deletion, and confirm no data mutation occurs during visual QA.

- [ ] **Step 6: Run and commit**

Run: `pnpm exec vitest run src/test/dashboard-v2.test.ts src/test/transactions-v2.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint && pnpm run build`

Commit: `feat: redesign dashboard and transaction workflows`

---

### Task 5: Planning and Reports

**Files:**
- Modify: `src/pages/DashboardOrcamento.tsx`
- Modify: `src/pages/DashboardPlanos.tsx`
- Modify: `src/pages/DashboardLimiteGastos.tsx`
- Modify: `src/pages/DashboardObjetivos.tsx`
- Modify: `src/pages/DashboardRelatorios.tsx`
- Modify: `src/components/finance/PlanDialog.tsx`
- Modify: `src/components/finance/SpendingLimitDialog.tsx`
- Modify: `src/components/finance/GoalDialog.tsx`
- Modify: `src/test/budgets-reports-v2.test.ts`
- Modify: `src/test/financial-controls-v2.test.ts`

**Interfaces:**
- Consumes: shared financial primitives and all existing V2 planning hooks.
- Produces: consistent plan, limit, goal, and report page grammar.

- [ ] **Step 1: Add failing contracts for shared page grammar**

Require each route to use `PageHeader`; require reports to retain tabs and period selection; require plans, limits, and goals to use accessible dialogs and explicit progress labels.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `pnpm exec vitest run src/test/budgets-reports-v2.test.ts src/test/financial-controls-v2.test.ts`

- [ ] **Step 3: Migrate budget and plan pages**

Use one income/period header region, one allocation panel, and one template/model region. Keep locale-safe amount formatting and atomic RPC behavior unchanged.

- [ ] **Step 4: Migrate limits and goals**

Replace repeated card grids with responsive financial rows and progress bars that expose numeric labels. Keep create/edit/delete permissions and confirmation behavior unchanged.

- [ ] **Step 5: Migrate reports**

Keep Recharts and existing calculations. Apply the documented data ramp, provide textual totals beside charts, keep period controls stable across tabs, and ensure the chart container has explicit responsive dimensions.

- [ ] **Step 6: Verify, run, and commit**

At 375px/768px/1280px test empty and populated states, long category names, large amounts, dialogs, tabs, and period controls.

Run: `pnpm exec vitest run src/test/budgets-reports-v2.test.ts src/test/financial-controls-v2.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint && pnpm run build`

Commit: `feat: redesign planning and reporting surfaces`

---

### Task 6: Spaces, WhatsApp, and Subscription

**Files:**
- Modify: `src/pages/DashboardGrupos.tsx`
- Modify: `src/pages/DashboardWhatsApp.tsx`
- Modify: `src/pages/DashboardDiagnosticoWhatsApp.tsx`
- Modify: `src/pages/DashboardAssinatura.tsx`
- Modify: `src/test/spaces-invitations-v2.test.ts`
- Modify: `src/test/dashboard-whatsapp-v2.test.ts`
- Modify: `src/test/subscription-v2.test.ts`

**Interfaces:**
- Consumes: active financial context, subscription capabilities, WhatsApp V2 connection state, shared primitives.
- Produces: clear tenant management, automation state, and plan comparison surfaces.

- [ ] **Step 1: Add failing contracts**

Require active-space context, separate member/invitation sections, labeled WhatsApp connection state, simulator labeling, current-plan-first subscription layout, and absence of promotional card grids.

- [ ] **Step 2: Run the three focused suites and confirm failure**

Run: `pnpm exec vitest run src/test/spaces-invitations-v2.test.ts src/test/dashboard-whatsapp-v2.test.ts src/test/subscription-v2.test.ts`

- [ ] **Step 3: Migrate spaces and invitations**

Use full-width sections, Financial Rows for members/invitations, compact role badges, labeled menus, and a persistent active-space indicator. Preserve secure token and permission behavior.

- [ ] **Step 4: Migrate WhatsApp and diagnostics**

Free state has one calm Pro explanation. Connected state leads with status, linked number, preferences, and recent automation activity. Keep the simulator visually labeled and preserve all V2 writes and Edge Function invocations.

- [ ] **Step 5: Migrate subscription**

Show current status and renewal first, then a restrained comparison table for Pro and Premium. Preserve `StripeEmbeddedCheckout`, lookup keys, return URL, and capability logic.

- [ ] **Step 6: Verify, run, and commit**

Run: `pnpm exec vitest run src/test/spaces-invitations-v2.test.ts src/test/dashboard-whatsapp-v2.test.ts src/test/subscription-v2.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint && pnpm run build`

Commit: `feat: redesign shared spaces automation and billing`

---

### Task 7: Authentication, Invitations, and Onboarding

**Files:**
- Modify: `src/pages/Auth.tsx`
- Modify: `src/pages/AcceptInvitation.tsx`
- Modify: `src/pages/OnboardingNome.tsx`
- Modify: `src/pages/OnboardingIdioma.tsx`
- Modify: `src/pages/OnboardingMoeda.tsx`
- Modify: `src/pages/OnboardingWhatsApp.tsx`
- Modify: `src/pages/OnboardingWhatsAppVerificar.tsx`
- Modify: `src/test/whatsapp-onboarding-v2.test.ts`
- Modify: `src/test/spaces-invitations-v2.test.ts`

**Interfaces:**
- Consumes: existing auth hooks, invitation session storage, WhatsApp linking RPCs, and design primitives.
- Produces: one-task-per-screen public experience consistent with the application.

- [ ] **Step 1: Add failing visual-structure contracts**

Require a narrow task surface, explicit progress, one primary action, semantic form labels, and no blob/gradient classes. Preserve the secure invitation token flow assertions.

- [ ] **Step 2: Run onboarding and invitation tests and confirm failure**

Run: `pnpm exec vitest run src/test/whatsapp-onboarding-v2.test.ts src/test/spaces-invitations-v2.test.ts`

- [ ] **Step 3: Recompose auth and invitation acceptance**

Use the warm canvas, one surface, direct copy, accessible fields, and clear loading/error states. Do not alter redirect, signup, OAuth, sessionStorage, or token handling.

- [ ] **Step 4: Recompose each onboarding step**

Each screen asks one question, exposes progress, and has one primary action. Replace decorative gradients and oversized media with the shared task surface; preserve local storage and RPC behavior.

- [ ] **Step 5: Verify full onboarding flows**

Test `/signup`, `/onboarding/nome`, language, currency, WhatsApp, verification, and `/convite` at 375px and 1280px. Check keyboard order, error announcements, long email addresses, and reduced motion.

- [ ] **Step 6: Run and commit**

Run: `pnpm exec vitest run src/test/whatsapp-onboarding-v2.test.ts src/test/spaces-invitations-v2.test.ts && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm run lint && pnpm run build`

Commit: `feat: redesign authentication and onboarding`

---

### Task 8: Full Visual QA, Accessibility Repair, and Release Gate

**Files:**
- Modify: `DESIGN.md` only for accepted debt or genuinely reusable patterns discovered during implementation.
- Modify: affected frontend files for issues discovered by QA.
- Create: `docs/qa/organizze-ui-redesign-review.md`

**Interfaces:**
- Consumes: the complete redesign, production build, authenticated test account, and `DESIGN.md` constraints.
- Produces: objective browser evidence, repaired Critical/Major findings, and the release review.

- [ ] **Step 1: Run the full automated gate**

Run:

```bash
pnpm run test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run lint
pnpm run build
pnpm --dir infra/whatsapp/bridge run test
git diff --check
```

Expected: 0 test failures, 0 TypeScript errors, 0 lint errors, production build exit 0, bridge exit 0, clean diff check.

- [ ] **Step 2: Run route-by-route visual QA**

Capture every public and dashboard route at 375px, 768px, and 1280px. Check empty, populated, loading, error, hover, focus, active, dialog, sheet, menu, tab, and confirmation states. Store screenshots and notes under `/tmp/organizze-ui-qa/final/`.

- [ ] **Step 3: Run content and layout stress checks**

Verify 200% zoom, long Portuguese labels, large currency values, unbroken email/identifier strings, one-item lists, empty lists, dense lists, and mobile safe-area behavior. Confirm the main region is the only shell scroll owner.

- [ ] **Step 4: Run accessibility and heuristic review**

Exercise complete keyboard flows, focus visibility, dialog focus trapping, semantic landmarks, headings, accessible names, chart summaries, status announcements, color-independent semantics, and reduced motion. Walk the tasks “understand this month,” “add a transaction,” “edit a budget,” “invite a member,” and “find WhatsApp status.”

- [ ] **Step 5: Repair every Critical and Major finding, then repeat Steps 1–4**

Document each issue, affected users, exact fix, and fresh evidence in `docs/qa/organizze-ui-redesign-review.md`. Minor deferred issues must be added to `DESIGN.md` Section 8 with an owner and exit condition.

- [ ] **Step 6: Run production performance audit**

Use real Chromium against `pnpm preview`, mobile and desktop, 3 runs each. Diagnose from JSON results. Do not remove useful content or interaction to improve a score; record any environmental limitation precisely.

- [ ] **Step 7: Independent code review**

Request review for behavioral regressions, duplicated markup, accessibility, responsive overflow, token compliance, raw colors, magic radii, and missing tests. Repair all P1/P2 findings and rerun the full gate.

- [ ] **Step 8: Commit the release review**

Commit: `test: complete organizze redesign visual qa`
