# Organizze Financial Product V2 Design

## Objective

Transform the existing Organizze dashboard from a collection of local and static screens into a complete financial product backed by the `app_v2` Supabase schema. The result must support daily transaction management, monthly budgeting, reports, scenarios, household collaboration, spending controls, goals, and subscription status without storing financial records in `localStorage`.

## Scope

The delivery has two product stages that share one data-access foundation.

Stage 1 delivers the financial core:

- Resolve the authenticated user's preferred writable space.
- List, search, filter, create, edit, and soft-delete transactions.
- Persist monthly income and category allocations.
- Calculate monthly totals and category reports from live V2 data.
- Keep the overview synchronized with app and WhatsApp transactions.

Stage 2 delivers the advanced product workflows:

- Create, edit, activate, duplicate, and remove budget plans.
- Display spaces and members, and create secure invitations.
- Create and manage spending limits and financial goals.
- Expose subscription status and checkout from a protected dashboard route.
- Enforce plan capabilities in UI and through server-authorized data.

## Architecture

### Financial Context

A shared `useFinancialContext` React Query hook resolves the signed-in user, writable memberships, preferred space, space currency, and active categories. Writable spaces prioritize `owner`, then `admin`, then `member`. Read-only spaces remain visible where useful, but mutations require a writable role.

The selected space is persisted as a UI preference only. Membership and role are always revalidated through Supabase and RLS; a browser preference never grants authorization.

### Data Access

Focused service modules wrap `supabaseV2` queries for transactions, budgets, reports, spaces, limits, goals, and subscriptions. Pages consume typed hooks instead of embedding repeated membership and query logic. Query keys always include `spaceId` and the relevant month or filters.

React Query is responsible for loading, cache, retries, and invalidation. Financial records, profile fields, plans, members, and subscription state are not written to `localStorage`. Existing local finance values remain readable only during transition and are not copied into new writes automatically.

### Transactions

The transaction workflow reads `app_v2.transactions` for the active space and date range, excluding rows with `deleted_at`. Creation validates positive amounts, currency, category membership, type, description, and occurrence date. Editing is limited to mutable business fields. Deletion is soft deletion by setting `deleted_at`, preserving auditability and WhatsApp idempotency.

The list supports month navigation, text search, transaction type, category, and status filters. Summary values are derived from the same filtered month query. Mutations invalidate overview, transaction list, budget progress, and reports.

### Budgeting And Plans

`budget_plans` stores monthly scenarios and expected income. `budget_allocations` stores category percentages or monetary limits. A plan is valid when category percentages total 100, or when every allocation uses explicit amounts. Only one plan is active per space and period.

The budget screen edits a draft and saves atomically from the user's perspective: plan metadata first, then allocations, followed by cache invalidation. Presets populate the draft but do not persist until the user saves.

### Reports

Reports are computed from transaction rows for a selected month. The UI provides expense by category, income versus expenses, savings, budget variance, and previous-month comparison. Calculations live in pure functions with unit tests so visual components only render prepared data.

### Spaces And Invitations

The groups screen lists accessible spaces and their members. Owners and admins can create invitations with an expiry and role. Invitation acceptance uses a token flow and never exposes token hashes. Member management respects the existing RLS ownership model and prevents removal of the final owner.

### Limits And Goals

Spending limits are scoped to space, category, period, and currency. Progress is computed from current-period expenses. Financial goals expose target, current amount, due date, and completion status. The first delivery uses manual progress updates; automatic transfers are outside scope.

### Subscriptions

A protected `/dashboard/assinatura` route displays the normalized `app_v2.subscriptions` state. Checkout uses the existing Edge Function and Stripe component. Plan capabilities are derived from normalized subscription status; price and product identifiers remain server-controlled. Payment secrets never reach the browser.

### WhatsApp Consistency

WhatsApp and app-created transactions share `app_v2.transactions`. The dashboard uses query invalidation, focus refresh, and a bounded polling fallback. Supabase Realtime may be added for lower latency, but correctness cannot depend on a live websocket.

## User Experience

Every financial screen has loading, populated, empty, and actionable error states. Forms use locale-aware currency display while storing numeric decimal values. Month selectors use the space timezone. Destructive actions require confirmation. Buttons are disabled during mutation to prevent duplicate submissions.

Desktop and mobile layouts preserve the existing Organizze visual language while removing mock values such as fixed BRL labels, static March 2026 dates, and fictional members. Charts include textual summaries and do not rely on color alone.

## Error Handling

Service functions throw typed user-safe errors while retaining Supabase details only for internal diagnostics. A failed mutation keeps the form state and shows a toast. Partial plan saves trigger a refetch and a clear retry message. Unauthorized rows remain inaccessible through RLS and are treated as unavailable rather than retried indefinitely.

## Security

- All browser access uses the publishable Supabase key and authenticated session.
- The browser never receives `service_role`, Evolution secrets, Gemini keys, Stripe secrets, or invitation token hashes.
- All queries include the active `space_id`; RLS remains the authoritative isolation boundary.
- Mutations validate writable membership in addition to RLS feedback.
- Financial deletes are soft deletes.
- Checkout and payment-event processing remain server-side.

## Testing

- Unit tests cover currency parsing, monthly ranges, category aggregation, budget validation, variance, and capability rules.
- Hook and source-contract tests cover V2 table usage and cache invalidation.
- Existing migration, WhatsApp, Gemini, and bridge tests must remain green.
- Browser QA covers overview, transactions, budget, reports, plans, groups, limits, goals, and subscription on desktop and mobile.
- Final verification runs Vitest, TypeScript, ESLint, production build, bridge tests, and `git diff --check`.

## Delivery Strategy

Implementation proceeds through shared foundation, Stage 1 pages, Stage 2 pages, independent code review, corrections, and integrated verification. Agents may work on isolated modules, but shared files and interfaces are integrated serially to avoid conflicting assumptions about space selection, query keys, and mutation behavior.
