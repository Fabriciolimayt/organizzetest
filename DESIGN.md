# Organizze Design System - Intelligence In Silence

## Editorial Product Edition (2026-09-21)

Approved direction: dark navigation, mineral-white financial workspace. This
section supersedes the older dark-product and paper-cut auth visual contracts
below, which remain as history. Behavior and data contracts remain immutable.
The source of visual truth is the published Organizze Site and its DESIGN.md,
not a new external brand. Carry its editorial typography, fine rules, original
ledger imagery, meaningful ice/coral/champagne accents and restrained motion
into a daily-use application, without marketing-sized headings or video loops.

Audience: people reviewing a month, recording expenses and managing shared
finances, often on a phone. Primary task is understanding and acting on real
financial data. Empty/loading/error states never impersonate populated data.

### Product tokens and typography

- Canvas mineral #F4F6F6; paper #FFFFFF; ink #182025; secondary #566268;
  quiet surface #EBEFEF; divider #D4DBDC; input outline #859296.
- Navigation charcoal #111516; navigation text #F4F6F6; secondary #A7B0B2;
  active surface #252D2F; navigation divider #30383A; active marker #82DCE3.
- Primary command charcoal #182025, hover #303B40, white label. Data available
  #176874, income #246641, expense #A84234, future/warning #816022. Dark
  financial highlights use #82DCE3/#A8D6BA/#ED998B/#E0C28C with explicit labels.
- Heading and wordmark: Iowan Old Style / Palatino Linotype / Georgia, regular.
  Body and controls retain bundled Geist; financial values retain Geist Mono.
  Page heading 36px, mobile 30px; section 22px; body 15px, secondary 13px,
  labels 12px; primary metric 36px (30px narrow), support 24px (20px narrow).
  Zero tracking. No viewport-relative type, animated balances or uppercase prose.
- Space unit 4px; content gaps 16/24/32; desktop gutters 40px, tablet 24px,
  narrow 16px. Main width 1360px. Controls 44px minimum, radius 6px. Dialogs
  and framed tools maximum 8px; unframed data sections and metric strips.

### Shared primitives and layout

Retain the current visible side navigation and its route groups, full mobile
menu and five mobile destinations. StyleGallery fixed-sidenav-shell is the
spatial contract: https://github.com/changeroa/StyleGallery/blob/main/patterns/viewport-shell/fixed-sidenav-shell.md.
Desktop navigation stays fixed, #dashboard-main-content owns content scroll,
and the navigation list separately scrolls only when its own height requires
it. Preserve 100dvh, min-height:0 and minmax(0,1fr) containment. Mobile keeps
the dark header/bottom bar and a light financial body. Never hide destinations.

Primitives: editorial Logo; PageHeader with restrained serif title and a wrapping
action cluster; unframed MetricStrip with ruled columns and first-value emphasis;
DashboardCard as a flat data section rather than a floating section-card;
DecisionPanel as a quiet contextual rail; FinancialRow with a consistent icon,
readable description and tabular amount; existing Button/Input/Select/Tabs;
light dialogs, popovers, menus and toasts using root-level semantic tokens so
Radix portals inherit correctly. All retain default, focus, hover, disabled,
loading, error, selected and destructive states. Validate the existing dev-only
primitive showcase before reviewing full routes.

Auth uses the original Site's optimized ledger poster with the same editorial
identity, never the obsolete leaf/paper-cut composition. Form stays on opaque
mineral paper, its fields, providers, mode switch, submit and safe redirects
unchanged. Onboarding shares the light paper, dark structural header and serif
title. No added forms, recovery endpoints, route aliases or new auth semantics.

### Motion, accessibility and verification

Keep existing state-driven 140/220ms motion, no ambient motion, pinning, video
or scroll effects in the app. Retain reduced motion. Persistent labels, keyboard
focus, modal focus restoration and semantic status text are required. Check
320/375/768/1440/1920px, 200% text, long names/amounts, empty/error/loading,
forms, tabs, dialogs and navigation. Color is never the only status cue.

Do not alter hooks, calculations, APIs, permissions, Supabase, Stripe, WhatsApp,
subscriptions, stored data or authentication. Browser QA uses isolated mocked
network responses, not live financial writes. Record what is simulated versus
actually verified. Historical eager app-bundle performance debt remains visible
in measurements; no unrequested backend or routing rewrite to chase scores.
Financial page bundles are lazy-loaded inside the existing dashboard Outlet,
with an accessible loading state and navigation retained while loading. Route
paths, protection and financial hooks are unchanged; charts and checkout code
must not block the login screen.
React diagnostics stay installed and development-only, enabled via ?diagnostics
so their overlays never cover ordinary local previews or enter production.
The routed redesign-skill.md is absent locally; use the existing contracts,
frontend-design and measured browser review instead. Public Site is unchanged.

## Auth Paper Edition (2026-09-20)

Scope: the existing `/auth` login/signup surface only. `/signup` remains its
existing redirect alias. No Supabase, session, OAuth, validation, subscription,
onboarding, invitation, or financial behavior changes.

Reference: user-supplied `b4492ab0d444891b66419c4717283b4f.jpg`. Preserve its
mineral-white paper, layered sculptural cutouts, directional soft shadows,
quiet left-hand form and dark green depth. Replace foliage with original
receipts, a calendar and category columns. The image is decorative, not a
financial statement or a promise of returns. The existing dark app is unchanged.

- Local tokens: paper #F7F8F7, ink #1B302B, secondary #596761, accent #214C40,
  divider #CBD3CE, input outline #809087, white #FFFFFF. Coral/ice/champagne live only in the artwork.
- Geist remains the font. Heading 36px desktop / 30px narrow; body 15px;
  labels 13px; metadata 12px. Letter spacing stays zero.
- Layout follows the [StyleGallery cover pattern](https://github.com/changeroa/StyleGallery/blob/main/patterns/viewport-shell/cover.md):
  header, flexible main, footer; document owns scroll; no fixed-height clipping.
  Form width 380px, left half on wide screens, full available width on narrow
  screens. A full-bleed background connects the form and the paper sculpture.
- Below 900px the artwork becomes a shallow top band and the form sits below
  it on a legible white sheet. No nested card, mockup frame, or horizontal scroll.
- Reuse Logo, InputField, SocialLoginButton and Button. All palette overrides
  are scoped to `.auth-paper`. Input/command radius 8px, controls at least 48px,
  icon targets at least 44px. Password visibility uses a named icon button.
- Keep both modes, Google OAuth, loading/error toasts, form values on mode
  change, safe `next`, login session redirect, signup storage and onboarding.
  Do not add fake password recovery, Microsoft, Facebook or new auth endpoints.
- Motion: existing 140/220ms color/focus feedback only; no ambient or scroll
  animation. Loading icon stops rotating with reduced motion. Artwork has an
  opaque light-canvas fallback; meaningful text and controls are real HTML.
- Accessibility: persistent associated labels, correct autocomplete, visible
  keyboard focus, 200% text reflow, decorative image alt empty, no focus-order
  changes. Native form validation and existing toast reporting are retained.
- QA: real browser login/signup at 320,375,768,1440,1920; password visibility,
  keyboard, mode/value retention, mocked submit/OAuth/error/loading/redirects;
  production build, TS, lint, unit regressions, measured performance.
- Reference limitation: the routed image-to-code-skill.md is absent from the
  installed skill. The supplied image and this explicit contract replace it.
- Accepted debt: existing app-wide eager bundle and auth backend configuration
  are outside this presentation change. Never report live OAuth/account creation
  as tested when only SDK mocks were used.


Organizze is reconstructed through the product-first rhythm, precise geometry, long quiet intervals, and controlled depth observed in the supplied Basedash reference. Organizze keeps its own financial meaning, original brand, routes, handlers, data contracts, permissions, and commercial behavior.

The existing Invisible Ledger implementation remains the behavior-preserving base: this contract replaces its obsolete visual direction without weakening its route, interaction, accessibility, or reduced-motion guarantees.

The public narrative follows four connected facts: Organizze gathers expenses from manual entries, receipts, recurring rules, and WhatsApp; organizes what the customer sends; shows how much remains available to spend; and surfaces limits and future commitments before they become surprises. Public copy must avoid absolute financial guarantees.

The visual foundation is deep black and white with semantic blue, green, coral, and amber. Lighting remains attached to real product surfaces or data states. Do not use decorative gradient blobs, bokeh orbs, glassmorphism, a gradient hero background, nested decorative cards, or generic dashboard-card grids.

**2026-09-17 reference correction.** The user rejected the flat interpretation and requested the supplied image/video's actual composition and movement. This supersedes the previous generic section geometry: use a 1040 px public column, a transparent compact header, a monochrome dashboard behind the centered opening statement, regular-weight 40/52 px display type, narrow 520 px text measures, long black intervals, luminous tab hairlines, an illuminated interpretation surface, source marks converging into the original Organizze mark, a metallic gold trial surface, alternating detail bands, a Three.js financial close and a pixel-resolving wordmark. Content and actions remain Organizze's. No new services, screens, testimonials or integrations are introduced.

Reference-specific public primitives: `.reference-heading` (centered title/copy); `.reference-surface` (one inspectable tool, 6 px radius, hairline); `.reference-band` (unframed full-width feature row); `PixelReveal` (readable DOM text with a one-shot canvas pixel assembly overlay); `FinancialScene` (lazy Three.js chart scene with static fallback, bounded pixel ratio and disposal). Use real vector charts and original generated chart geometry, not a screenshot of Basedash.

Public finish tokens extend, not replace, the semantic product palette: neutral canvas `#030303`, panel `#090909`, outline `#232323`, neutral text `#F1F1F1`, muted `#A0A0A0`; interpretation-only violet `#BBA0FF`; trial metal `#E4B654` with highlight `#FFE8A3` and shaded material `#493512`. White controls replace blue marketing CTAs. Accents belong to interpreted data, status, chart series or the metallic trial object; no gradient hero background.

## Brand Mark

The original Organizze mark represents dispersed financial entries converging into one ordered balance.

- Build the silhouette from a compact grid or ledger of four to seven geometric cells.
- Outer cells suggest multiple sources; central alignment suggests organization.
- One controlled interruption or open cell suggests movement and incoming data.
- The silhouette must remain identifiable at 16 px and work in one color.
- It must not resemble the Basedash hash mark, WhatsApp mark, bank logos, a crypto token, or an abstract letter `O` alone.
- The wordmark remains `Organizze` and uses the approved neo-grotesk family.
- An original SVG is permitted for the mark because it is a brand asset, not a substitute for a familiar interface icon.

## Color And Meaning

| Token | Value | Meaning |
| --- | --- | --- |
| Page canvas | `#050505` | Near-black public and product foundation |
| Raised product surface | `#0B0C0E` | Elevated product stages and shell surfaces |
| Functional panel | `#111316` | Owned tools, metrics, dialogs, and data regions |
| Hairline structure | `#24272C` | Predominantly 1 px borders and dividers |
| Primary text | `#F5F7FA` | Headings, values, and primary labels |
| Secondary text | `#8E949D` | Supporting copy and metadata |
| Intelligence blue | `#69D7FF` | Interpretation, context, and active intelligence |
| Income/safe | `#66DFA6` | Income and safe status only |
| Expense/destructive | `#FF7C6B` | Expense and destructive status only |
| Warning | `#F4C56A` | Warning and approaching-limit status only |

Depth comes from scale, occlusion, controlled shadow, opacity, filter, panel contrast, and subtle raster texture. Product panels use 4-8 px corner radii, borders are predominantly 1 px hairlines, and pill-shaped text containers are reserved for semantic pills, tags, and statuses. Status is never communicated by color alone.

## Typography

The target character is the precise, wide, neo-grotesk feeling of the reference.

- Display and body: Geist Sans or a verified redistributable equivalent, with robust system fallbacks.
- Financial and utility values: Geist Mono or a verified equivalent.
- Product values use tabular lining numerals.
- Headlines use controlled line breaks and balanced width, never viewport-width font scaling.
- Interface labels remain at least 12 px.
- Body text remains at least 15 px on public surfaces and 14 px in dense product contexts.
- Letter spacing is zero for normal text and non-negative for utility uppercase labels.
- Fonts are self-hosted or bundled; preload only the required initial weights.

Public locale resolution uses this priority: an explicit stored or user selection first, then the browser language, then the current project fallback. Automatic detection must never overwrite a manual choice.

## Public Scene Contract

The landing contains these eleven scenes in this order, revised on 2026-09-17 to follow the supplied page composition. The reference controls rhythm and composition; Organizze controls meaning and content. Public content uses a 1040 px inner maximum inside a 1120 px container, while product stages may extend beyond the content column without creating horizontal page overflow.

| ID | Scene job | Required composition and content |
| --- | --- | --- |
| `prelude` | Establish product quality before the value proposition. | A layered Organizze dashboard occupies the upper viewport and shows available amount, spending rhythm, category allocation, and upcoming commitments. The header contains the new mark and wordmark, `Entrar`, and `Começar 15 dias grátis`. The first viewport reveals a hint of `promise`. |
| `promise` | Explain consolidation and available amount. | Center the headline `Tudo o que gastas, organizado. O que podes gastar, claro.` with its PT-BR adaptation, plain-language supporting copy, primary CTA `Começar 15 dias grátis`, and `Ver como funciona` scrolling to the product explanation. |
| `month` | Make one complete month inspectable. | A large monthly dashboard supports tabs for month overview, categories, commitments, and goals. Plausible demonstration figures are clearly non-personal, internally consistent, and accompanied by textual summaries. |
| `whatsapp` | Show financial input becoming a decision. | Present `message or receipt -> interpretation -> category -> transaction -> updated available amount`. Do not use WhatsApp bubbles, a chat transcript, read receipts, or a copied WhatsApp shell. |
| `available` | Answer what can be spent. | The available amount dominates. Expected income, committed costs, variable spending, and reserved goals explain the calculation without claiming certainty when data is incomplete. |
| `sources` | Show every expense becoming one ledger. | Five actual input methods surround the original Organizze mark, with the consolidated month total and available amount below. This is not an integrations logo wall. |
| `plans` | Present current commercial choices in one stage. | A metallic trial pass introduces the existing 15-day trial. Both real plans remain visible, with checkout pricing, lifetime entitlement and test-mode notes unchanged. |
| `future` | Surface commitments before they surprise the customer. | Upcoming subscriptions, recurring expenses, category limits, and factual warning states distinguish within limit, approaching limit, and exceeded without alarmist language. |
| `planning` | Connect plans, goals, and shared spaces. | A staged product montage uses progressive disclosure to connect budgets, scenarios, goals, and household spaces through real interface surfaces rather than a feature-card grid. |
| `trust` | Explain system quality without unsupported claims. | Concise evidence covers privacy boundaries, private receipt storage, user-controlled spaces, and clear account ownership. Do not claim unverified certifications or security properties. |
| `signature` | Close with a monumental Organizze moment. | `É tempo de ver o mês antes que ele aconteça.` and the exact primary CTA introduce a real Three.js financial graph with accessible static fallback, followed by the large-format Organizze wordmark. |

Public demonstration values live in static presentation fixtures, separate from hooks that read customer data. They never contain real names, phones, receipts, emails, space IDs, or transaction IDs. Protected pages never fall back to demo data when live data is unavailable.

## Product Shell Contract

Desktop replaces the visible 228 px sidebar with a stable top product bar containing the Organizze mark and wordmark, current section or breadcrumb, space selector, month context where relevant, global quick-add transaction action, navigation menu trigger, and account or subscription trigger.

The full navigation panel preserves every existing destination, grouping, and permission rule. It supports Escape, traps focus when modal, restores focus to the trigger, and exposes the same route destinations and permission behavior as the current shell.

Mobile keeps exactly five stable primary destinations in the bottom navigation, each with an icon and compact visible label. Full route access remains available through the menu, safe-area insets are respected, and labels do not truncate at 375 px.

Daily-use pages begin with context and the primary decision, then supporting evidence. Use wide data bands and framed tools instead of decorative card grids. Tables retain desktop density and become purposeful mobile rows. Charts preserve color meaning, tooltips, textual summaries, filters, month selection, and mutation feedback.

Authentication and onboarding retain one decision per screen. All existing fields, providers, validation, storage, routes, timers, polling, skip, reconnect, progress, OAuth consent, invitation acceptance, and error behavior remain unchanged.

## Motion

Landing motion uses the GSAP and ScrollTrigger dependencies already present in the project. Product motion remains fast and state-driven.

- Allowed public mechanisms: timeline-based panel entrance; scroll-linked opacity, filter, and transform; pinned public scenes when content remains fully reachable; perspective and `translate3d` for product-stage depth; clip-path reveal only when verified smooth with a non-animated fallback; and staggered data rows when they communicate assembly or consolidation.
- Animate transform, opacity, and filter rather than layout dimensions or document flow.
- Do not add continuous decorative loops.
- Every sequence has a `prefers-reduced-motion` path.
- Motion never delays navigation, input, or access to content.
- Mobile retains narrative order while reducing pinning, depth, and simultaneous layers.
- Landing motion remains code-split away from authenticated routes.
- Product navigation and dialogs use 140-220 ms state transitions.
- Financial result changes may cross-fade or roll only when the value genuinely changes.
- Authenticated routes have no scroll hijacking, cinematic pinning, parallax, custom cursor, or ambient animation.
- Loading indicators stop when work stops.

Reference fidelity motion: pixel assembly completes once in 900 ms without delaying links; scene entrances last 700-1000 ms with `power3.out`; dashboard panels and source rows have 80 ms stagger; chart drawing and context consolidation track native scroll with scrub 0.6; material reflections follow pointer position and reset on leave; the closing financial scene uses Three.js for shallow depth and restrained camera movement. Pause canvas work outside the viewport and on document visibility changes; reduced motion renders the final static state. Decorative perpetual loops remain prohibited. beui's text-animation/tab mechanisms inform state transitions; pixel assembly and financial geometry are project-specific mechanisms grounded in the supplied video.

## Responsive And Accessibility

Required widths are 375, 768, and 1280 px. Also verify an effective 1280 x 450 viewport or 200% zoom for top-navigation and menu access.

- Meet WCAG AA contrast for text and controls.
- Use a minimum practical target of 44 x 44 px.
- Show visible focus on every interactive element.
- Modal interactions trap focus, close on Escape, and restore focus.
- Preserve semantic landmarks and logical heading order.
- Provide text summaries for charts.
- Never communicate status by color alone.
- Keep currency and long Portuguese labels inside their containers.
- Prevent horizontal document overflow.
- Keep all public scenes on mobile; stack compositions instead of shrinking them into illegible thumbnails.
- Drive and verify reduced motion in a real browser for representative public and product flows.

Performance boundaries are CLS below 0.1 and LCP below 2.5 s on the measured local production profile where tooling permits. Public motion and heavy visual code remain route-isolated, font and hero preloads stay conservative, no preloader holds usable content, and interaction feedback remains visually immediate.

## Functional Preservation

The visual reconstruction must not alter any behavior or data contract. Existing hooks and handlers remain the source of truth. Presentation components receive values and callbacks through props. Animation modules cannot perform financial, authorization, payment, or messaging work.

Every declared route retains its current routing behavior:

- `/__design-system` - development-only primitive showcase; it is registered only when `import.meta.env.DEV` is true and is absent from production routing.
- `/` - public landing page.
- `/.lovable/oauth/consent` - OAuth consent route.
- `/auth` - authentication route.
- `/signup` - redirect alias that replaces browser history and resolves to `/auth`.
- `/convite` - invitation acceptance route.
- `/onboarding/nome` - protected onboarding route.
- `/onboarding/idioma` - protected onboarding route.
- `/onboarding/moeda` - protected onboarding route.
- `/onboarding/whatsapp` - protected onboarding route.
- `/onboarding/whatsapp/verificar` - protected onboarding route.
- `/dashboard` - protected dashboard shell and index route.
- `/dashboard/lancamentos` - protected nested dashboard route.
- `/dashboard/relatorios` - protected nested dashboard route.
- `/dashboard/limite-de-gastos` - protected nested dashboard route.
- `/dashboard/orcamento` - protected nested dashboard route.
- `/dashboard/planos` - protected nested dashboard route.
- `/dashboard/objetivos` - protected nested dashboard route.
- `/dashboard/grupos` - protected nested dashboard route.
- `/dashboard/whatsapp` - protected nested dashboard route.
- `/dashboard/diagnostico-whatsapp` - protected nested dashboard route.
- `/dashboard/assinatura` - protected nested dashboard route.
- `*` - catch-all fallback that renders the 404 `NotFound` page for every unmatched path.

Also preserve OAuth consent, invitation acceptance, 404, checkout overlay, dialogs, menus, tooltips, toasts, loading, empty, error, free, trial, paid, lifetime, test-mode, pending, expired, disconnected, and active states.

The following boundaries are immutable:

- Route paths, redirects, protected-route rules, query parameters, and invitation-token behavior.
- Authentication providers, Supabase sessions, user creation, and email behavior.
- Supabase schemas, RLS, RPC names and arguments, data ownership, grants, and migrations.
- Financial calculations, date periods, category mapping, filtering, CRUD semantics, recurring behavior, imports, and totals.
- WhatsApp connection, linking, instance identity, phone normalization, message ingestion, receipt processing, media handling, job processing, retries, monthly reports, and bridge behavior.
- Subscription eligibility, 15-day trial, paid access, test mode, Stripe synchronization, checkout, and lifetime entitlement.
- Form validation, disabled and loading behavior, error semantics, toasts, and recovery destinations.
- Navigation destinations and labels, permission checks, shared-space membership, invitations, roles, pending and expired states, and account ownership.

No secrets, service-role keys, bridge secrets, payment keys, or private storage paths may enter the browser bundle.

## Landing Approval Gate

Delivery proceeds in this checkpoint order:

1. Reference contract and brand foundation: extract representative frames and timecodes, record visual and responsive assumptions, approve the original Organizze symbol, and lock this contract with tests.
2. Landing: implement all eleven scenes and responsive variants, then present the local landing for explicit user approval before changing entry or protected screens.
3. Entry and onboarding: apply the approved system to auth, OAuth, invitations, name, language, currency, WhatsApp connection, and verification states.
4. Shell and dashboard: replace the visual sidebar with the top bar and navigation panel while preserving every destination and account behavior.
5. Financial pages: reconstruct transactions, reports, budget, plans, limits, and goals while exercising all mutations, filters, tooltips, month changes, and recalculated states.
6. Commercial and automation pages: reconstruct spaces, WhatsApp, diagnostics, subscription, checkout, and entitlement states.
7. Final gate: run the full automated suite, exact TypeScript, build, lint, React diagnostics, real-browser route matrix, reduced motion, 200% zoom, performance measurements, and independent review.

Landing approval is scene-based rather than literal pixel equality. For every scene, compare relative headline, product-surface, and negative-space scale; product-first hierarchy; alignment and border geometry; layer depth and controlled lighting; scroll timing and reveal order; CTA placement and prominence; and mobile preservation of the same narrative job.

Approval fails if the result merely combines a black background with generic dashboard cards. The defining rhythm is the product prelude, centered editorial promise, large inspectable stages, long quiet intervals, precise motion, and monumental closing brand moment.

Accepted constraints: different product content prevents literal pixel equality; original Organizze panels replace Basedash screenshots and database concepts; a redistributable font equivalent may replace the reference font; unavailable authenticated or external state is recorded rather than silently passed; and pre-existing main-bundle size remains separate debt unless this reconstruction worsens it.
