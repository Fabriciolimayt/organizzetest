# Organizze Financial Product V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect every financial dashboard workflow to Supabase `app_v2` and deliver a coherent product comparable to moedas.app.

**Architecture:** Shared React Query hooks resolve the authenticated space and expose typed V2 services. Pages render and mutate the same transaction, budget, membership, limit, goal, and subscription records, with RLS as the authorization boundary and `localStorage` limited to UI preferences.

**Tech Stack:** React 18, TypeScript, Vite, TanStack React Query, Supabase JS, shadcn/ui, Recharts, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-20-organizze-financial-product-v2-design.md`

## Global Constraints

- Use `supabaseV2`; never expose service-role, Evolution, Gemini, Stripe secret, or invitation hash data.
- Financial records and profile state must not be written to `localStorage`.
- Query keys include `spaceId` and month/filter inputs.
- Every mutation invalidates all dependent overview, transaction, budget, and report queries.
- Transaction deletion is soft deletion through `deleted_at`.
- Preserve the existing Organizze visual language and responsive navigation.
- Keep existing WhatsApp behavior and all current tests green.

---

### Task 1: Shared Financial Foundation

**Files:**
- Create: `src/lib/finance/month.ts`
- Create: `src/lib/finance/money.ts`
- Create: `src/lib/finance/reports.ts`
- Create: `src/hooks/useFinancialContext.ts`
- Create: `src/hooks/finance-query-keys.ts`
- Test: `src/test/finance-foundation.test.ts`

**Interfaces:**
- Produces: `MonthRange`, `monthRange()`, `shiftMonth()`, `formatCurrency()`, `parseCurrencyInput()`, `summarizeTransactions()`, `useFinancialContext()`, `financeQueryKeys`.
- `useFinancialContext()` returns `{ userId, spaceId, role, canWrite, currency, timezone, categories, spaces }`.

- [ ] **Step 1: Write the failing foundation tests**

```ts
expect(monthRange(new Date("2026-08-20T12:00:00Z"), "Europe/Lisbon")).toEqual({
  start: "2026-07-31T23:00:00.000Z",
  endExclusive: "2026-08-31T23:00:00.000Z",
  key: "2026-08",
});
expect(parseCurrencyInput("1.234,56", "pt-PT")).toBe(1234.56);
expect(summarizeTransactions(rows).expenses).toBe(62.5);
```

- [ ] **Step 2: Run `pnpm exec vitest run src/test/finance-foundation.test.ts` and verify failures identify missing exports**

- [ ] **Step 3: Implement pure month, money, and report functions**

Use half-open ranges (`gte occurred_at start`, `lt occurred_at endExclusive`) and positive database amounts. `summarizeTransactions` computes income, expenses, balance, savings rate, category totals, and comparison-ready totals without reading browser state.

- [ ] **Step 4: Implement authenticated context with React Query**

Query `space_members`, prioritize owner/admin/member/viewer, fetch `spaces` and active `categories`, and expose an explicit `canWrite`. Persist only the selected `spaceId` preference.

- [ ] **Step 5: Run the focused test, TypeScript, and commit**

```bash
pnpm exec vitest run src/test/finance-foundation.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/lib/finance src/hooks/useFinancialContext.ts src/hooks/finance-query-keys.ts src/test/finance-foundation.test.ts
git commit -m "feat: add shared financial v2 context"
```

### Task 2: Transaction Management

**Files:**
- Create: `src/hooks/useTransactionsV2.ts`
- Create: `src/components/finance/TransactionDialog.tsx`
- Create: `src/components/finance/TransactionFilters.tsx`
- Modify: `src/components/dashboard/MonthSelector.tsx`
- Replace: `src/pages/DashboardLancamentos.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Test: `src/test/transactions-v2.test.ts`

**Interfaces:**
- Consumes: `useFinancialContext`, `MonthRange`, `parseCurrencyInput`, `financeQueryKeys`.
- Produces: `useTransactionsV2(filters)`, `useCreateTransactionV2()`, `useUpdateTransactionV2()`, `useDeleteTransactionV2()`.

- [ ] **Step 1: Write failing transaction tests**

```ts
expect(transactionRangeQuery).toContain('.gte("occurred_at", range.start)');
expect(transactionRangeQuery).toContain('.lt("occurred_at", range.endExclusive)');
expect(deleteMutation).toContain('deleted_at: new Date().toISOString()');
expect(invalidatedRoots).toEqual(expect.arrayContaining(["transactions", "dashboard", "reports", "budgets"]));
```

- [ ] **Step 2: Verify RED with `pnpm exec vitest run src/test/transactions-v2.test.ts`**

- [ ] **Step 3: Implement typed queries and mutations**

Select non-deleted rows for the active space. Create rows with `created_by`, space currency, `source: "app"`, and validated category ownership. Update only description, merchant, category, type, status, amount, and occurrence date. Soft-delete rows.

- [ ] **Step 4: Implement controlled month selector and transaction UI**

`MonthSelector` receives `value`, `onPrevious`, `onNext`, and optional `disableNext`. The page supports search, type/category/status filters, populated and empty states, create/edit dialogs, deletion confirmation, and monthly income/expense/balance summaries.

- [ ] **Step 5: Make overview consume shared transaction queries**

Remove legacy finance merging from the overview. Continue reading local salary only until Task 3 moves it into budget plans; never write remote transactions into local storage.

- [ ] **Step 6: Verify and commit**

```bash
pnpm exec vitest run src/test/transactions-v2.test.ts src/test/dashboard-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/hooks/useTransactionsV2.ts src/components/finance src/components/dashboard/MonthSelector.tsx src/pages/DashboardLancamentos.tsx src/pages/Dashboard.tsx src/test/transactions-v2.test.ts
git commit -m "feat: connect transaction management to app v2"
```

### Task 3: Budget And Reports

**Files:**
- Create: `src/hooks/useBudgetsV2.ts`
- Create: `src/components/finance/BudgetEditor.tsx`
- Replace: `src/pages/DashboardOrcamento.tsx`
- Replace: `src/pages/DashboardRelatorios.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Test: `src/test/budgets-reports-v2.test.ts`

**Interfaces:**
- Consumes: shared context, month range, transaction hooks, report calculations.
- Produces: `useBudgetPlanV2(month)`, `useSaveBudgetPlanV2()`, `validateAllocations()`, populated report models.

- [ ] **Step 1: Write failing budget and report tests**

```ts
expect(validateAllocations([{ percentage: 50 }, { percentage: 30 }, { percentage: 20 }])).toEqual({ valid: true, total: 100 });
expect(validateAllocations([{ percentage: 60 }, { percentage: 30 }]).valid).toBe(false);
expect(report.categoryTotals.Alimentação).toBe(45);
expect(report.balance).toBe(report.income - report.expenses);
```

- [ ] **Step 2: Verify RED**

Run `pnpm exec vitest run src/test/budgets-reports-v2.test.ts`.

- [ ] **Step 3: Implement budget loading and save mutation**

Load active plans overlapping the selected month and their allocations. Save plan metadata, upsert allocations by `(budget_plan_id, category_id)`, and remove allocations absent from the submitted draft. Reject percentage totals other than 100 before mutation.

- [ ] **Step 4: Replace mock budget UI**

Load income, presets, categories, current spend, percentage sliders, amount equivalents, progress, validation, loading, empty, and failure states from V2 data.

- [ ] **Step 5: Replace empty reports UI**

Render category pie/bar views, income versus expenses, balance, savings rate, budget variance, and previous-month comparison with Recharts and accessible text totals.

- [ ] **Step 6: Update overview income and progress from the active plan, verify, and commit**

```bash
pnpm exec vitest run src/test/budgets-reports-v2.test.ts src/test/dashboard-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/hooks/useBudgetsV2.ts src/components/finance/BudgetEditor.tsx src/pages/DashboardOrcamento.tsx src/pages/DashboardRelatorios.tsx src/pages/Dashboard.tsx src/test/budgets-reports-v2.test.ts
git commit -m "feat: add persistent budgets and financial reports"
```

### Task 4: Plans, Limits, And Goals

**Files:**
- Create: `src/hooks/useFinancialControlsV2.ts`
- Create: `src/components/finance/PlanDialog.tsx`
- Create: `src/components/finance/LimitDialog.tsx`
- Create: `src/components/finance/GoalDialog.tsx`
- Replace: `src/pages/DashboardPlanos.tsx`
- Replace: `src/pages/DashboardLimiteGastos.tsx`
- Create: `src/pages/DashboardObjetivos.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/dashboard/DashboardLayout.tsx`
- Test: `src/test/financial-controls-v2.test.ts`

**Interfaces:**
- Produces CRUD hooks for `budget_plans`, `spending_limits`, and `financial_goals`, plus `calculateLimitProgress()` and `calculateGoalProgress()`.

- [ ] **Step 1: Write failing control tests**

```ts
expect(calculateLimitProgress(80, 100)).toEqual({ percentage: 80, state: "warning" });
expect(calculateLimitProgress(120, 100).state).toBe("exceeded");
expect(calculateGoalProgress(500, 1000)).toBe(50);
```

- [ ] **Step 2: Verify RED, then implement hooks and pure calculations**

Plan activation first disables other plans for the same space and period, then activates the selected row. Duplication creates a new plan and copies allocations. Limits and goals validate positive values and matching space currency.

- [ ] **Step 3: Replace static pages and add goals route**

Implement create/edit/delete dialogs, confirmation for destructive actions, progress indicators, and empty states. Add `/dashboard/objetivos` with a target icon in navigation.

- [ ] **Step 4: Verify and commit**

```bash
pnpm exec vitest run src/test/financial-controls-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/hooks/useFinancialControlsV2.ts src/components/finance src/pages/DashboardPlanos.tsx src/pages/DashboardLimiteGastos.tsx src/pages/DashboardObjetivos.tsx src/App.tsx src/components/dashboard/DashboardLayout.tsx src/test/financial-controls-v2.test.ts
git commit -m "feat: add plans limits and financial goals"
```

### Task 5: Household Spaces And Invitations

**Files:**
- Create: `src/lib/finance/invitations.ts`
- Create: `src/hooks/useSpacesV2.ts`
- Create: `src/pages/AcceptInvitation.tsx`
- Replace: `src/pages/DashboardGrupos.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/spaces-invitations-v2.test.ts`

**Interfaces:**
- Produces: `createInvitationToken()`, `hashInvitationToken()`, space/member/invitation query hooks, and acceptance through `accept_space_invitation`.

- [ ] **Step 1: Write failing invitation tests**

```ts
const token = createInvitationToken();
expect(token).toMatch(/^[A-Za-z0-9_-]{32,}$/);
expect(await hashInvitationToken(token)).toHaveLength(64);
expect(invitationInsert).not.toHaveProperty("token");
```

- [ ] **Step 2: Verify RED, then implement secure token generation**

Generate at least 32 random bytes with Web Crypto, encode base64url, hash with SHA-256, and insert only the PostgreSQL-compatible `bytea` hex value. The raw token exists only long enough to construct `/convite?token=...` for the inviter.

- [ ] **Step 3: Implement spaces, members, invitations, and acceptance UI**

List real spaces and members. Owner/admin can create or revoke invitations and change non-owner roles. The acceptance route invokes the existing RPC and never displays whether a different email owns an invitation.

- [ ] **Step 4: Verify and commit**

```bash
pnpm exec vitest run src/test/spaces-invitations-v2.test.ts src/test/app-v2-migration.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/lib/finance/invitations.ts src/hooks/useSpacesV2.ts src/pages/AcceptInvitation.tsx src/pages/DashboardGrupos.tsx src/App.tsx src/test/spaces-invitations-v2.test.ts
git commit -m "feat: connect household spaces and invitations"
```

### Task 6: Subscription Route And Capabilities

**Files:**
- Create: `src/hooks/useSubscriptionV2.ts`
- Create: `src/lib/finance/capabilities.ts`
- Modify: `src/pages/DashboardAssinatura.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/dashboard/DashboardLayout.tsx`
- Test: `src/test/subscription-v2.test.ts`

**Interfaces:**
- Produces: `useSubscriptionV2()`, `capabilitiesForSubscription(status)`.

- [ ] **Step 1: Write failing capability tests**

```ts
expect(capabilitiesForSubscription(null).whatsapp).toBe(false);
expect(capabilitiesForSubscription("trialing").whatsapp).toBe(true);
expect(capabilitiesForSubscription("active").unlimitedPlans).toBe(true);
expect(capabilitiesForSubscription("past_due").unlimitedPlans).toBe(false);
```

- [ ] **Step 2: Verify RED, then query normalized subscription state**

Select only the signed-in user's latest subscription. Treat `trialing` and `active` as paid capability states and every other status as free.

- [ ] **Step 3: Register `/dashboard/assinatura` and connect the page**

Show current state, renewal date, environment badge, and checkout only for upgrades. Do not hard-code client prices as authorization; the Edge Function remains authoritative.

- [ ] **Step 4: Verify and commit**

```bash
pnpm exec vitest run src/test/subscription-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/hooks/useSubscriptionV2.ts src/lib/finance/capabilities.ts src/pages/DashboardAssinatura.tsx src/App.tsx src/components/dashboard/DashboardLayout.tsx src/test/subscription-v2.test.ts
git commit -m "feat: expose subscription state and capabilities"
```

### Task 7: Independent Review, Corrections, And Integrated Verification

**Files:**
- Modify: only files identified by review findings.
- Test: relevant focused tests for every accepted finding.

**Interfaces:**
- Consumes all prior tasks and produces a reviewed branch with no known blocking finding.

- [ ] **Step 1: Dispatch an independent reviewer**

Review for cross-space data leaks, missing `spaceId` keys, stale caches, amount/date errors, destructive operations, duplicate submits, unsupported subscription assumptions, inaccessible charts, responsive overflow, and regressions in WhatsApp behavior.

- [ ] **Step 2: Convert every accepted finding into a failing regression test**

Run each focused test and confirm it fails for the reported reason before changing production code.

- [ ] **Step 3: Implement minimal corrections and rerun focused tests**

- [ ] **Step 4: Run the full automated gate sequentially**

```bash
pnpm run test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run lint
pnpm run build
pnpm --dir infra/whatsapp/bridge run test
git diff --check
```

- [ ] **Step 5: Run browser QA**

Validate authenticated desktop and mobile flows for `/dashboard`, `/dashboard/lancamentos`, `/dashboard/orcamento`, `/dashboard/relatorios`, `/dashboard/planos`, `/dashboard/grupos`, `/dashboard/limite-de-gastos`, `/dashboard/objetivos`, `/dashboard/assinatura`, and `/dashboard/whatsapp`. Confirm loading, populated, empty, error, form, mutation, and navigation states do not overlap or overflow.

- [ ] **Step 6: Commit final corrections**

```bash
git status --short
git commit -m "fix: address financial product v2 review"
```

Stage only the exact files changed while addressing Task 7 findings before running the commit command.
