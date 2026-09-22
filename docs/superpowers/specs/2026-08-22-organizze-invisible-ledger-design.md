# Organizze Invisible Ledger Design

Date: 2026-08-22
Status: Approved design direction
Reference: Basedash visual rhythm, adapted to Organizze content and Apple-style product storytelling

## 1. Objective

Redesign the complete Organizze experience without changing its existing functionality or mechanics. The landing page, authentication, onboarding, dashboard shell, financial pages, WhatsApp presentation, subscription screens, dialogs, loading states, and responsive layouts may change visually. Authentication behavior, routes, validation, Supabase access, financial calculations, WhatsApp processing, subscription logic, permissions, and data contracts must remain operationally equivalent.

The new direction is named **Invisible Ledger**. Its central promise is:

> Organizze organizes everything the customer sends, gathers all expenses in one place, and shows how much is still safe to spend, so money stops being a surprise.

Public-facing copy should avoid absolute financial guarantees. Prefer "O teu dinheiro deixa de te apanhar de surpresa" over claims such as "Nunca mais serás surpreendido".

## 2. Audience And Positioning

The primary audience is an individual who wants control of personal finances without manually maintaining spreadsheets or filling repetitive forms. Shared spaces and family features remain available but are secondary in the public narrative.

Organizze is positioned as **silent financial intelligence**:

- More personal than a corporate business intelligence tool.
- More sophisticated than a traditional expense tracker.
- Less speculative than a crypto or trading product.
- More actionable than a passive dashboard.

The product is not defined by green. Its identity uses deep neutral surfaces and glacial blue as the intelligence signal.

## 3. Visual Direction

### 3.1 Character

- Deep, cinematic, restrained, and precise.
- Apple-style product storytelling: one idea per scene, real product as the hero, disciplined typography, purposeful motion, and generous negative space.
- Basedash contributes depth, dashboard-led proof, and scroll rhythm, but not its brand, copy, information architecture, colors, or database-product language.
- Luxury comes from proportion, pacing, rendering quality, and restraint rather than ornamental effects.

### 3.2 Palette

Core tokens:

- `void-black`: `#050607` for page depth.
- `carbon-surface`: `#12161B` for daily-use panels.
- `deep-panel`: `#0E1115` for nested functional surfaces.
- `hairline`: `#252B33` for structure.
- `primary-text`: `#F5F7FA`.
- `secondary-text`: `#89929E`.
- `intelligence-blue`: `#69D7FF`.
- `intelligence-blue-soft`: `#BCEEFF`.

Financial colors remain semantic rather than decorative:

- Income and safe status: `#66DFA6`.
- Expense and destructive status: `#FF7C6B`.
- Warning and approaching limit: `#F4C56A`.

Glacial blue identifies intelligence, context, active navigation, and system interpretation. It must not recolor the whole product. Avoid gradients, decorative color blobs, excessive glow, and glassmorphism.

### 3.3 Typography

Use a high-quality neo-grotesk system inspired by Apple product typography, with a monospaced companion for monetary data. The final implementation may use a licensed or open equivalent if SF Pro cannot be shipped.

- Display: controlled weight, tight optical spacing, large but not oversized inside product surfaces.
- Body: neutral, highly legible, conversational.
- Financial values: tabular numerals and lining figures.
- Metadata: compact uppercase labels with positive tracking only.
- No viewport-width font scaling.

Typography must remain readable before web fonts load through robust fallbacks.

## 4. Landing Narrative

The landing page follows six scenes. Each scene has one job in the visitor's decision path.

### Scene 1: Automation Invisible

Job: capture attention and demonstrate value before listing features.

Headline direction:

> Tudo entra. O mês responde.

Show a receipt or expense entering, being understood by Organizze, and updating the month. The product interface is the primary visual, not atmospheric artwork.

Primary CTA: **Organizar o meu mês**.

Secondary CTA: **Ver como funciona**.

Supporting copy should state that setup is fast and WhatsApp is included during the trial without artificial urgency.

### Scene 2: One Place

Job: establish that receipts, manual entries, recurring expenses, and WhatsApp entries become one financial view.

Do not use a generic integrations logo wall. Demonstrate consolidation through actual financial values and sources.

### Scene 3: Context And Decision

Job: move from historical tracking to action.

The primary proof is not only how much was spent, but how much remains safe to spend and which limit is closest.

### Scene 4: WhatsApp Origin

Job: explain WhatsApp as an input channel.

- Mention WhatsApp explicitly and use its mark discreetly where legally appropriate.
- Do not reproduce a WhatsApp conversation window.
- Show the flow `receipt/message -> Organizze interpretation -> categorized transaction -> updated month`.
- Organizze owns the intelligence and result; WhatsApp is only the origin.

### Scene 5: Complete Month

Job: prove breadth without becoming a feature grid.

Reports, budgets, limits, goals, subscriptions, and shared spaces are shown as parts of one monthly system. Use real product screens and progressive disclosure.

### Scene 6: Conversion

Job: convert after proof.

Headline direction:

> O teu dinheiro deixa de te apanhar de surpresa.

Use the same primary CTA label as the hero. Avoid countdowns, fake scarcity, exaggerated guarantees, or aggressive persuasion.

## 5. Product System

### 5.1 Dark Functional Shell

The product remains dark but optimized for daily use:

- Matte navigation surface.
- Carbon content panels.
- Thin structural borders.
- High-contrast text and tabular financial values.
- Controlled blue highlights.
- Minimal shadow and glow.

Desktop keeps the existing sidebar navigation model. Tablet uses a compact header and drawer. Mobile keeps a stable bottom navigation and menu access. Navigation labels, routes, permissions, and destinations remain unchanged.

### 5.2 Dashboard Priority

The dashboard reads in this order:

1. Current month and context.
2. Primary action: create a transaction.
3. Available amount.
4. Expenses, income, and limits.
5. Spending rhythm.
6. Next financial decision.
7. Recent transactions and category limits.

The "next decision" is a signature Organizze primitive. It converts current data into a concise, explainable action. It must never claim certainty beyond the underlying data.

### 5.3 Reusable Primitives

The redesign should be implemented through reusable components rather than page-specific screenshots:

- `ProductShell`
- `PublicScene`
- `AutomationSequence`
- `FinancialMetric`
- `DecisionPanel`
- `DataPanel`
- `TransactionRow`
- `LimitTrack`
- `MonthContext`
- `ProductStage`
- `StatefulAction`

Existing shadcn/Radix primitives remain the accessibility foundation. Visual variants may change while component APIs stay compatible wherever possible.

No cards inside cards. Page sections are unframed or full-width. Panels frame actual tools, metrics, dialogs, repeated items, and data regions.

## 6. Authentication And Onboarding

The current route sequence and behavior remain unchanged:

- Authentication.
- Name.
- Language.
- Currency.
- Optional WhatsApp connection and verification.

Visual rules:

- One dominant question per screen.
- Progress is always visible and stable.
- Fewer decorative containers.
- Large, direct input treatment where appropriate.
- Continue controls keep identical meaning across mouse, touch, and keyboard.
- WhatsApp onboarding uses an automation diagram rather than a chat preview.
- Skip and connect-later actions remain available.

All loading, focus, validation, error, success, expired-code, and reconnect states receive complete visual treatment.

## 7. Motion And Interaction

Landing motion is cinematic but explanatory. Product motion is restrained and state-driven.

Approved mechanisms:

- Reveal: opacity and small vertical transform for scene entry.
- Connect: clip and opacity sequence for receipt-to-data transformation.
- Update: rolling or cross-fading tabular digits when values genuinely change.
- Orient: shared-layout movement for active navigation, tabs, and selection.

Rules:

- Animate only `transform`, `opacity`, and `filter`.
- Spatial movement uses interruptible spring behavior.
- Color and opacity use short easing transitions.
- No ambient motion on non-interactive product elements.
- No looping charts solely for decoration.
- Motion cannot block input or delay content.
- `prefers-reduced-motion: reduce` replaces spatial sequences with immediate or opacity-only state changes.

The reference mechanics should be derived from the nearest beui.dev patterns before implementation. Candidate mechanisms include `scroll-animation`, `number`, `shared-layout-bg`, `button`, and `action-swap`.

## 8. Functional Preservation

The redesign must not alter:

- Route paths or protected-route behavior.
- Supabase schema, RLS policies, RPC behavior, or data ownership.
- Authentication providers or session handling.
- Financial calculations, filtering, CRUD behavior, imports, or recurring logic.
- WhatsApp connection, linking, receipt processing, message ingestion, or job behavior.
- Subscription eligibility, trial behavior, Stripe synchronization, or permanent account entitlements.
- Existing form validation and error semantics.

Presentation components may wrap existing hooks and handlers. Business logic must not move into animation or visual components.

Any type mismatch discovered during implementation may be corrected only to match the already deployed V2 schema and must be covered by existing or new tests.

## 9. Responsive Behavior

Required validation widths:

- Mobile: 375 px.
- Tablet: 768 px.
- Desktop: 1280 px and wider.

Requirements:

- No horizontal page overflow.
- No truncated primary navigation labels without an intentional compact label.
- No text overlapping charts, metrics, or controls.
- Mobile bottom navigation has stable dimensions.
- Tables become readable lists or scroll within owned containers rather than breaking the page.
- Hero content reveals a hint of the next scene.
- Product visuals remain inspectable and do not become illegible decorative thumbnails.

## 10. Accessibility

- WCAG AA contrast minimum for body text and controls.
- Visible keyboard focus on every interactive element.
- Semantic landmarks and heading order.
- Accessible names for icon-only buttons.
- Minimum practical touch target of 44 px.
- Status is never communicated by color alone.
- Charts have textual summaries or accessible equivalents.
- Reduced-motion mode is verified in the real browser.
- Error messages identify what happened and how to recover.

## 11. Performance

- Product functionality and primary content render without waiting for cinematic assets.
- Landing scenes load progressively near the viewport.
- Avoid autoplay video when a GPU-composited product reconstruction communicates the same information more efficiently.
- Heavy visuals must not ship inside authenticated dashboard routes unless used there.
- Preserve fast input response and scrolling.
- Production build must pass the existing build and type checks.
- Bundle growth from motion libraries must be measured and justified in `DESIGN.md` before adoption.

## 12. Verification

The redesign is complete only when all of the following pass:

1. Existing Vitest suites remain green.
2. TypeScript passes with no errors.
3. Production build succeeds.
4. ESLint has zero errors.
5. Landing, authentication, onboarding, dashboard, transactions, reports, budgets, limits, goals, spaces, WhatsApp, diagnostics, and subscription routes are visually inspected.
6. Browser QA is completed at 375, 768, and 1280 px.
7. Navigation, forms, dialogs, loading, empty, error, success, and destructive states are exercised.
8. Reduced motion is inspected.
9. Browser console contains no application errors.
10. Key workflows produce the same data results before and after the redesign.

## 13. Delivery Sequence

Implementation should proceed in isolated visual layers:

1. Update `DESIGN.md` and tokens.
2. Build and verify primitives in the design-system showcase.
3. Implement the public landing scenes.
4. Implement authentication and onboarding.
5. Implement dashboard shell and shared product primitives.
6. Migrate dashboard pages without changing their handlers or hooks.
7. Add approved motion and reduced-motion fallbacks.
8. Run functional, visual, accessibility, responsive, and performance verification.

Each layer must remain runnable and testable before the next begins.

## 14. Accepted Constraints

- The shipped font may differ from SF Pro due to licensing; the substitute must preserve the approved typographic character.
- WhatsApp branding is discrete and subordinate to Organizze.
- The current large JavaScript bundle is existing technical debt. The redesign must not worsen it without explicit justification.
- Existing Fast Refresh warnings are not redesign blockers when production lint has zero errors, but new warnings should not be introduced.
