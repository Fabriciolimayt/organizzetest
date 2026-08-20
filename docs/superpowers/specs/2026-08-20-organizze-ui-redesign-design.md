# Organizze UI Redesign Specification

## Objective

Replace the current dark glassmorphism interface with a clear, modern, minimalist financial workspace called **Livro Financeiro Humano**. Preserve all Supabase, WhatsApp, Gemini, Stripe, routing, and business behavior while redesigning the application shell and every customer-facing route.

## Current-State Audit

- The deep emerald canvas, glows, glass panels, gradients, and blobs compete with financial information.
- The desktop header carries too many destinations; the mobile menu hides the product structure.
- Metrics, charts, category controls, and guidance share similar card treatment, weakening hierarchy.
- Mobile captures show excessive vertical length and repeated dashboard regions.
- Pills, large radii, and floating tutorial actions make the application feel promotional instead of operational.
- Serif typography is used inside compact financial panels where a restrained sans would scan faster.

## Approved Direction

The selected direction is **Livro Financeiro Humano**:

- Light warm canvas and white working surfaces.
- Graphite typography with restrained sage for actions.
- Cobalt and violet only for data semantics.
- Manrope for UI and tabular financial values; Newsreader for rare human guidance.
- Flat structural depth: tonal shifts, crisp dividers, and almost no shadow.
- Quiet, purposeful motion with a complete reduced-motion path.

The complete visual contract is defined in `DESIGN.md`.

## Information Architecture

### Desktop

A persistent left navigation groups destinations into three mental models:

1. **Acompanhar**: Visão geral, Lançamentos, Relatórios.
2. **Planear**: Orçamento, Planos, Limites, Objetivos.
3. **Partilhar e automatizar**: Espaços, WhatsApp, Assinatura.

Diagnostics and account utilities move to a secondary account menu. The sidebar remains fixed; the main product region owns vertical scrolling.

### Mobile

The bottom navigation exposes Visão geral, Lançamentos, Orçamento, Relatórios, and Menu. The top header contains product identity, active-space context, and account access. Secondary routes live in a labeled Sheet, not an expanding header.

## Screen Strategy

### Dashboard

- Replace the introductory card stack with one compact page header and a four-column metric strip.
- Lead with available balance and current-month context.
- Present budget allocation and recent transactions as two coordinated data regions.
- Keep category exploration in one list-detail pattern, with one category selected at a time.
- Replace floating tutorial controls with contextual help inside the account/help menu.

### Transactions

- Desktop: filter toolbar plus scan-friendly table/list with aligned amounts.
- Mobile: grouped financial rows with a persistent, non-obstructive add action.
- Destructive actions remain confirmed and accessible.

### Budget, Plans, Limits, and Goals

- Reuse Page Header, Metric Strip, Data Panel, Financial Row, and segmented controls.
- Keep editing forms in dialogs or sheets according to task length.
- Use explicit progress, remaining amount, and next action; never rely on ring color alone.

### Reports

- Period selector remains stable between tabs.
- Charts use the documented data ramp and always include textual totals.
- Category and cash-flow views share the same controls and alignment.

### Spaces and Invitations

- Make the active space visible in the shell.
- Separate members, invitations, and space actions with full-width sections rather than nested cards.
- Roles use compact badges and labeled menus.

### WhatsApp

- Free state: calm upgrade explanation with one primary action.
- Connected state: status, linked number, message preferences, and recent automation activity.
- The simulator remains clearly labeled and visually separate from the real connection status.

### Subscription

- Compare Pro and Premium with a restrained feature table, not promotional cards.
- Current plan and renewal state appear first.
- Checkout behavior remains unchanged.

### Authentication and Onboarding

- Use a centered, narrow task surface on the warm canvas.
- Each step has one question, one primary action, and visible progress.
- Remove decorative gradients and oversized illustration treatment where it competes with completion.

## Component Architecture

The redesign will first update global tokens and shared primitives, then migrate routes in dependency order:

1. Global CSS tokens, typography, base focus and motion behavior.
2. Button, input, badge, card/panel, tooltip, skeleton, sheet, and navigation states.
3. App shell, Page Header, Metric Strip, Data Panel, Financial Row, Empty State.
4. Dashboard and transactions.
5. Planning and reports.
6. Spaces, WhatsApp, subscription, authentication, and onboarding.

No business hooks or Supabase contracts will be rewritten for visual convenience.

## Responsive Behavior

- Validate at 375px, 768px, and 1280px, plus a wide desktop smoke test.
- Primary content must never overflow horizontally.
- Long currency values use tabular numerals and wrap or scale within their region without changing layout tracks.
- Tables transform into labeled rows on small containers rather than becoming unreadably compressed.
- Fixed shell regions use `100dvh`; scrolling children use `min-height: 0`.

## Accessibility

- Meet WCAG 2.2 AA.
- Preserve semantic landmarks and heading order.
- Provide accessible names and tooltips for every icon-only action.
- Maintain 44px touch targets on mobile.
- Exercise keyboard navigation for shell, dialogs, menus, filters, and destructive confirmations.
- Respect reduced motion and provide chart summaries.

## Verification

- Primitive showcase at 375px, 768px, and 1280px before route migration.
- Vitest, TypeScript, lint, and production build after every migration group.
- Browser QA for every public and dashboard route at all three breakpoints.
- Content-stress checks: empty, populated, long Portuguese labels, large values, and loading/error states.
- Independent review focused on hierarchy, accessibility, navigation clarity, mobile overflow, and accidental behavior changes.
- Performance audit on the production build; no visual feature may be removed merely to improve a score.

## Non-Goals

- No changes to financial calculations, RLS, Supabase schema, WhatsApp delivery, Gemini parsing, or Stripe behavior.
- No new marketing landing page.
- No new charting framework unless the current Recharts implementation cannot meet accessibility requirements.
- Dark-theme completion is deferred until the light system has passed visual QA.

## Success Criteria

- A first-time user can identify balance, spending, budget status, and the next useful action within one viewport.
- Desktop navigation no longer overflows and mobile navigation exposes the five most frequent destinations.
- Repeated surfaces have consistent anatomy and states defined in `DESIGN.md`.
- The UI no longer contains glass panels, glowing borders, gradient blobs, nested cards, or oversized rounded controls.
- All existing functional tests remain green and all major workflows remain usable.
