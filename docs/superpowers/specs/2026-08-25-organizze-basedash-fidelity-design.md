# Organizze Basedash Fidelity Design

Date: 2026-08-25
Status: Approved design contract, pending written-spec review
Reference assets:

- `/Users/fabriciolima/Downloads/basedash.mp4`
- `/Users/fabriciolima/Downloads/basedash.jpg`

This document supersedes the visual direction in `2026-08-22-organizze-invisible-ledger-design.md` wherever the two conflict, including landing length, desktop navigation, brand mark, typography candidate, and fidelity target. The earlier document's functional-preservation rules remain in force and are repeated here.

## 1. Objective

Reconstruct the complete Organizze presentation layer with perceptual fidelity to the supplied Basedash reference while preserving Organizze as the product, brand, content owner, and functional system.

"Literal" means that the implementation follows the reference's composition, scene cadence, scale relationships, dark material treatment, dashboard-led proof, negative space, typography character, and motion choreography as closely as the different product content permits. It does not mean copying Basedash source code, copy, logo, proprietary fonts, screenshots, illustrations, or product assets.

The result must be recognizable as Organizze at first glance and must remain a personal-finance product rather than a business-intelligence or database product.

## 2. Approved Decisions

The grill interview established these decisions:

- Scope: landing, authentication, onboarding, dashboard shell, every protected page, dialogs, loading, empty, error, tour, and commercial states.
- Desktop navigation: replace the visible left rail with a restrained top product bar and an icon-triggered full navigation panel.
- Mobile navigation: retain a stable bottom navigation plus menu access.
- Color: deep black/white foundation with semantic accents: blue for intelligence, green for income/safe status, coral for expense/destructive status, and amber for warnings.
- Public data: use realistic demonstration data, visibly separated from live customer data.
- Motion: cinematic on the public landing; fast and state-driven inside the product.
- Primary CTA: `Começar 15 dias grátis`.
- WhatsApp: a dedicated cinematic section showing financial input and interpretation without a fake conversation UI.
- Pricing: current plans and checkout behavior composed in one staged comparison, with the higher-value plan visually emphasized without hiding the alternative.
- Delivery: landing first, then entry/onboarding, then shell/dashboard, then remaining protected pages.
- Locale: automatic PT-PT/PT-BR public copy with manual language choice preserved.
- Brand: create a new original Organizze symbol.
- Landing length: retain the long reference cadence with 9-11 major scenes.
- Mobile: retain every scene with adapted composition and lighter movement.
- Existing visual layer: presentation components may be replaced completely; all behavior and data contracts remain immutable.

## 3. Brand Translation

### 3.1 Organizze Promise

The public narrative is built around four connected facts:

1. Organizze gathers expenses from manual entries, receipts, recurring rules, and WhatsApp.
2. It organizes what the customer sends.
3. It shows how much remains available to spend.
4. It surfaces limits and future commitments before they become surprises.

Public copy must avoid absolute financial guarantees. Prefer language such as `O teu dinheiro deixa de te apanhar de surpresa` or its PT-BR equivalent over `Nunca mais terás surpresas`.

### 3.2 Original Symbol

The new Organizze mark is based on dispersed financial entries converging into one ordered balance.

Construction direction:

- A compact grid or ledger made from four to seven geometric cells.
- Outer cells suggest multiple sources; central alignment suggests organization.
- One controlled interruption or open cell suggests movement and incoming data.
- The silhouette must remain identifiable at 16 px and work in one color.
- It must not resemble the Basedash hash mark, WhatsApp mark, bank logos, a crypto token, or an abstract letter `O` alone.
- The wordmark remains `Organizze` and uses the approved neo-grotesk family.

The mark may be implemented as an original SVG because it is a brand asset, not a substitute for a familiar interface icon.

## 4. Visual Contract

### 4.1 Material And Depth

The reference hierarchy is translated through:

- Near-black page canvas: `#050505`.
- Raised product surface: `#0B0C0E`.
- Functional panel: `#111316`.
- Hairline structure: `#24272C`.
- Primary text: `#F5F7FA`.
- Secondary text: `#8E949D`.
- Intelligence blue: `#69D7FF`.
- Income/safe: `#66DFA6`.
- Expense/destructive: `#FF7C6B`.
- Warning: `#F4C56A`.

Depth comes from scale, occlusion, controlled shadow, opacity, filter, panel contrast, and subtle raster texture. Do not use decorative gradient blobs, bokeh orbs, glassmorphism, or a gradient hero background. Lighting must remain attached to real product surfaces or data states.

### 4.2 Typography

Target character: the precise, wide, neo-grotesk feeling of the reference.

- Display/body candidate: Geist Sans or a verified equivalent with the required redistribution rights.
- Financial/utility candidate: Geist Mono or a verified equivalent.
- Product values use tabular lining numerals.
- Headlines use controlled line breaks and balanced width rather than viewport-width font scaling.
- Interface labels remain at least 12 px; body text remains at least 15 px on public surfaces and 14 px in dense product contexts.
- Letter spacing is zero for normal text and non-negative for utility uppercase labels.

Fonts must be self-hosted or bundled through the project, preload only the required initial weights, and retain robust system fallbacks.

Public locale resolution uses this priority: an explicit stored/user selection first, then the browser language, then the current project fallback. Automatic detection must never overwrite a manual choice.

### 4.3 Geometry

- Public content maximum: approximately 1180-1240 px, adjusted per scene.
- Product stages may extend beyond the content column but must not create horizontal page overflow.
- Product panels use 4-8 px corner radii; no pill-shaped text containers unless the control is semantically a pill, tag, or status.
- Borders are predominantly 1 px hairlines.
- Negative space is deliberate and large between public scenes.
- Internal product spacing is denser and work-focused.
- Cards do not contain other decorative cards. Nested visual regions must represent real tool or data ownership.

## 5. Landing Architecture

The landing follows eleven scenes. The reference controls rhythm and composition; Organizze controls meaning and content.

### Scene 1: Financial Prelude

Purpose: establish product quality before the value proposition.

- A layered dashboard composition occupies the upper viewport.
- Real Organizze demo surfaces show available amount, spending rhythm, category allocation, and upcoming commitments.
- Panels enter as one orchestrated sequence, not independent floating decorations.
- Header contains the new symbol/wordmark, `Entrar`, and the primary CTA.
- The first viewport reveals a hint of Scene 2.

### Scene 2: Central Promise

Headline direction:

> Tudo o que gastas, organizado. O que podes gastar, claro.

PT-BR adaptation:

> Tudo o que você gasta, organizado. O que ainda pode gastar, claro.

Supporting copy explains consolidation and prediction in plain language. Primary CTA is `Começar 15 dias grátis` and preserves the current `/auth` destination; secondary action is `Ver como funciona` and scrolls to the product explanation.

### Scene 3: One Complete Month

- A large inspectable monthly dashboard is the hero object.
- Tabs switch between month overview, categories, commitments, and goals.
- Demonstration figures are plausible and clearly non-personal.
- Data visuals use semantic colors and textual summaries.

### Scene 4: Every Expense, One Place

- Manual entry, receipt, recurring rule, shared-space item, and WhatsApp appear as source labels around one consolidated ledger.
- This is not an integrations logo wall.
- The visual concludes in a single month total and available amount.

### Scene 5: WhatsApp To Decision

- Show the sequence `message or receipt -> interpretation -> category -> transaction -> updated available amount`.
- Do not render WhatsApp bubbles, a chat transcript, read receipts, or a copied WhatsApp shell.
- WhatsApp is the origin; Organizze owns the interpretation and result.
- The sequence must work with text input and receipt-photo examples.

### Scene 6: What Can I Spend?

- The primary value is the available amount, not raw historical spending.
- Supporting values explain the calculation: expected income, committed costs, variable spending, and reserved goals.
- Copy avoids certainty when the data is incomplete.

### Scene 7: No More Late Surprises

- Upcoming subscriptions, recurring expenses, category limits, and warning states form a forward-looking stage.
- Warnings are factual and calm; no alarmist language or fake urgency.
- The visual demonstrates the difference between within limit, approaching limit, and exceeded.

### Scene 8: Plans, Goals, And Shared Spaces

- A staged product montage connects budgets, scenarios, goals, and household spaces.
- Progressive disclosure replaces a generic feature-card grid.
- Each feature is shown through an actual Organizze interface surface.

### Scene 9: Trust And System Quality

- Explain privacy boundaries, private receipt storage, user-controlled spaces, and clear account ownership using concise evidence.
- Do not claim certifications or security properties that are not implemented and verified.
- Technical language remains subordinate to customer outcomes.

### Scene 10: Plans

- Current plans appear in one shared stage.
- One option may be emphasized through scale and contrast, not through fake scarcity.
- Prices, trial rules, paid access, lifetime entitlement, test mode, and checkout destinations remain unchanged.
- Primary CTA remains `Começar 15 dias grátis` where eligibility allows; authenticated state uses the existing appropriate action.

### Scene 11: Final Signature

- A final financial graph or month surface enters with perspective and shallow depth.
- Headline direction: `É tempo de ver o mês antes que ele aconteça.`
- Primary CTA repeats exactly.
- The new Organizze wordmark becomes the final large-format graphic.

## 6. Product Shell

### 6.1 Desktop Top Bar

Replace the visible 228 px sidebar with a stable top product bar.

The bar contains:

- New Organizze mark and wordmark.
- Current section/breadcrumb.
- Space selector.
- Month context where relevant.
- Global quick-add transaction action.
- Navigation menu trigger.
- Account/subscription trigger.

The full navigation panel preserves every existing destination and grouping. It opens from the menu trigger, supports Escape, traps focus when modal, restores focus to the trigger, and exposes the same route destinations and permission behavior as the current shell.

### 6.2 Mobile Navigation

- Keep exactly five stable primary destinations in the bottom navigation.
- Use icon plus compact visible label.
- Full route access remains available through the menu.
- Safe-area insets are respected.
- No label truncation at 375 px.

### 6.3 Daily-Use Motion

- Product navigation and dialogs use 140-220 ms state transitions.
- Financial result changes may cross-fade or roll only when the value genuinely changes.
- No scroll hijacking, cinematic pinning, parallax, custom cursor, or ambient animation inside authenticated routes.
- Loading indicators stop when work stops.

## 7. Route Coverage

Every existing route remains available and receives the new visual system:

- `/`
- `/auth`
- `/onboarding/nome`
- `/onboarding/idioma`
- `/onboarding/moeda`
- `/onboarding/whatsapp`
- `/onboarding/whatsapp/verificar`
- `/dashboard`
- `/dashboard/lancamentos`
- `/dashboard/relatorios`
- `/dashboard/orcamento`
- `/dashboard/planos`
- `/dashboard/limite-de-gastos`
- `/dashboard/objetivos`
- `/dashboard/grupos`
- `/dashboard/whatsapp`
- `/dashboard/diagnostico-whatsapp`
- `/dashboard/assinatura`

Also covered: OAuth consent, invitation acceptance, 404, checkout overlay, dialogs, menus, tooltips, toasts, loading, empty, error, free, trial, paid, lifetime, test-mode, pending, expired, disconnected, and active states.

## 8. Page-Family Translation

### 8.1 Authentication And Onboarding

- Retain one decision per screen.
- Use a product fragment or financial preview as environmental proof rather than a marketing split card.
- Preserve all fields, providers, validation, storage, routes, timers, polling, skip, and reconnect behavior.
- Progress remains stable and accessible.

### 8.2 Dashboard And Financial Pages

- Begin with context and the primary decision, then supporting evidence.
- Use wide data bands and framed tools instead of decorative card grids.
- Tables retain desktop density and become purposeful mobile rows.
- Chart color, tooltips, textual summaries, filters, month selection, and mutation feedback remain accessible.
- Available amount, next commitment, and nearest limit are visually prioritized where the existing data supports them.

### 8.3 WhatsApp And Diagnostics

- Authenticated WhatsApp remains an activity and testing workspace, not a fake consumer chat.
- Connection, free/trial/paid gating, local verification fallback, message parsing, receipt processing, auto-follow, diagnostics, retries, and error behavior remain unchanged.
- Technical events are redacted as currently implemented.

### 8.4 Spaces And Subscription

- Space membership, invitations, roles, pending/expired states, and RPC boundaries remain unchanged.
- Subscription comparison uses one stage, while checkout remains an accessible modal owned by its initiating trigger.
- Permanent entitlement and the designated lifetime account remain unchanged.

## 9. Functional Preservation

The redesign must not alter:

- Route paths, redirects, protected-route rules, query parameters, or invitation-token behavior.
- Authentication providers, Supabase sessions, user creation, or email behavior.
- Supabase schemas, RLS, RPC names/arguments, data ownership, grants, or migrations.
- Financial calculations, date periods, category mapping, filtering, CRUD semantics, recurring behavior, imports, or totals.
- WhatsApp connection, linking, instance identity, phone normalization, message ingestion, receipt processing, media handling, job processing, retries, monthly reports, or bridge behavior.
- Subscription eligibility, 15-day trial, paid access, test mode, Stripe synchronization, checkout, or lifetime entitlement.
- Form validation, disabled/loading behavior, error semantics, toasts, or recovery destinations.

Existing hooks and handlers remain the source of truth. Presentation components receive values and callbacks through props. Animation modules cannot perform financial, authorization, payment, or messaging work.

## 10. Motion Contract

Landing motion is implemented with GSAP and ScrollTrigger already present in the project.

Allowed mechanisms:

- Timeline-based panel entrance.
- Scroll-linked opacity, filter, and transform.
- Pinned public scenes when content remains fully reachable.
- Perspective and `translate3d` for product-stage depth.
- Clip-path reveal only when verified smooth and with a non-animated fallback.
- Staggered data rows when they communicate assembly or consolidation.

Rules:

- Prefer transform, opacity, and filter; do not animate layout dimensions or document flow.
- No continuous decorative loops.
- Every sequence has a `prefers-reduced-motion` path.
- Motion never delays navigation, input, or access to content.
- Mobile retains narrative order but reduces pinning, depth, and simultaneous layers.
- Landing motion remains code-split away from authenticated routes.

## 11. Responsive And Accessibility Contract

Required widths: 375, 768, and 1280 px. Also verify an effective 1280 x 450 viewport or 200% zoom for top-navigation and menu access.

- WCAG AA contrast for text and controls.
- Minimum practical target: 44 x 44 px.
- Visible focus on every interactive element.
- Modal focus trap, Escape close, and focus restoration.
- Semantic landmarks and logical headings.
- Text summaries for charts.
- Status never communicated by color alone.
- Currency and long Portuguese labels cannot break containers.
- No horizontal document overflow.
- All scenes remain present on mobile; compositions stack rather than shrink into illegible thumbnails.
- Reduced motion is driven in a real browser for public and product representative flows.

## 12. Demonstration Data And Privacy

- Public demo values live in static presentation fixtures, separate from hooks that read customer data.
- Demo fixtures never contain real names, phones, receipts, emails, space IDs, or transaction IDs.
- Demo values are internally consistent across totals, categories, available amount, and charts.
- Protected pages never fall back to demo data when live data is unavailable.
- No secrets, service-role keys, bridge secrets, payment keys, or private storage paths enter the browser bundle.

## 13. Performance Contract

- Public motion and heavy visual code remain route-isolated.
- Initial public fonts and hero product surfaces are preloaded conservatively.
- No preloader may hold the page after usable content is ready.
- CLS target: below 0.1.
- LCP target: below 2.5 s on the measured local production profile where tooling permits.
- Interaction feedback target: visually immediate, with no animation blocking handler execution.
- Incremental motion code must be measured separately from the pre-existing main-bundle debt.
- Expensive pointer effects, custom cursors, WebGL, and smooth-scroll hijacking are out of scope.

## 14. Delivery Sequence

### Phase 1: Reference Contract And Brand Foundation

- Extract representative video frames and motion timecodes.
- Record geometry, type, material, motion, and responsive assumptions.
- Create and approve the new Organizze symbol.
- Update `DESIGN.md` and contract tests.

### Phase 2: Landing

- Implement all eleven scenes and responsive variants.
- Present the local landing for user approval before changing entry or protected screens.
- Validate reference fidelity at 375, 768, and 1280 px.

### Phase 3: Entry And Onboarding

- Apply the system to auth, OAuth, invitations, name, language, currency, WhatsApp connection, and verification states.
- Preserve route order and all handlers.

### Phase 4: Shell And Dashboard

- Replace the visual sidebar with the top bar and navigation panel.
- Preserve all route destinations and account behavior.
- Redesign the dashboard overview around the approved product hierarchy.

### Phase 5: Financial Pages

- Transactions, reports, budget, plans, limits, and goals.
- Exercise create, edit, void, delete, filters, tooltips, month changes, and recalculated states.

### Phase 6: Commercial And Automation Pages

- Spaces, WhatsApp, diagnostics, subscription, checkout, and entitlement states.

### Phase 7: Final Gate

- Full automated suite, exact TypeScript, build, lint, and React diagnostics.
- Real-browser route matrix, representative integrations, reduced motion, 200% zoom, and performance measurements.
- Independent review before integration.

## 15. Fidelity Acceptance

Landing approval requires side-by-side comparison with the supplied reference, evaluated by scene rather than by copied pixels.

For every scene, verify:

- Relative scale of headline, product surface, and negative space.
- Product-first hierarchy.
- Alignment and border geometry.
- Layer depth and controlled lighting.
- Scroll timing and reveal order.
- CTA placement and prominence.
- Mobile composition retains the same narrative job.

The implementation fails fidelity acceptance if it merely uses a black background and generic dashboard cards. It must reproduce the reference's defining rhythm: product prelude, centered editorial promise, large inspectable stages, long quiet intervals, precise motion, and monumental closing brand moment.

## 16. Accepted Constraints

- Different product content prevents literal pixel equality with Basedash.
- Original Organizze panels replace all Basedash screenshots and database concepts.
- A redistributable font equivalent may replace the reference font.
- Browser safety or authenticated-state availability may limit a specific local capture; such gaps must be recorded, never silently marked as passed.
- The pre-existing main application bundle remains separate performance debt unless this redesign worsens it.

## 17. Definition Of Done

The redesign is complete only when:

1. Every route and named state uses the approved visual system.
2. All existing handlers, data results, permissions, trials, payments, WhatsApp flows, and routes remain operationally equivalent.
3. The landing passes user approval after the dedicated Phase 2 checkpoint.
4. Automated tests, TypeScript, build, and lint pass with zero errors.
5. Browser QA covers 375, 768, 1280, reduced motion, keyboard focus, overflow, and console behavior, with explicit gaps where external state prevents execution.
6. The final branch receives an independent code and visual-contract review.
