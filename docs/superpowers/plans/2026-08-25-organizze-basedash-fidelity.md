# Organizze Basedash Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every Organizze presentation surface with the approved Basedash-inspired cinematic system while preserving all existing routes, handlers, financial behavior, WhatsApp flows, trials, payments, permissions, and stored data.

**Architecture:** Keep business behavior in the existing hooks, page handlers, Supabase clients, and Edge Functions. Public scenes use static, internally consistent demo fixtures and landing-only GSAP timelines; authenticated pages continue to consume live hooks through presentation props. Delivery is gated: the eleven-scene landing is completed and approved before entry, onboarding, or protected routes are visually replaced.

**Tech Stack:** Vite 5, React 18, TypeScript 5.8, Tailwind CSS 3, shadcn/Radix UI, Lucide React, Recharts, GSAP 3 with ScrollTrigger, Vitest, Testing Library, Supabase.

**Spec:** `docs/superpowers/specs/2026-08-25-organizze-basedash-fidelity-design.md`

## Delivery Status - 2026-09-16

- Tasks 1-8: implemented on `codex/invisible-ledger`.
- Task 9: landing QA and review checkpoint; see `docs/qa/2026-09-16-basedash-landing-qa.md` for measured results and remaining performance debt.
- Tasks 10-16: pending. Existing entry/protected functionality was preserved; these surfaces have not yet received this Basedash redesign.
- The step checklists below retain the original execution recipe. For completed work and exact resume instructions, use `CODEX_HANDOFF.md` and the local SDD progress ledger.

## Global Constraints

- Do not change route paths, redirects, protected-route rules, query parameters, invitation-token behavior, form validation, Supabase schemas, RLS, RPCs, financial calculations, WhatsApp processing, Stripe synchronization, trial behavior, or lifetime entitlement.
- Preserve existing hooks and event handlers as the source of truth. Presentation components receive values and callbacks through props.
- Public demo data must remain in static fixtures and must never contain customer names, phones, emails, receipts, IDs, or live hook fallbacks.
- Use `#050505`, `#0B0C0E`, `#111316`, `#24272C`, `#F5F7FA`, `#8E949D`, `#69D7FF`, `#66DFA6`, `#FF7C6B`, and `#F4C56A` with accents restricted to their approved meanings.
- Do not copy Basedash code, logo, copy, screenshots, proprietary fonts, or product assets. Match its perceptual rhythm with original Organizze content and surfaces.
- Do not add decorative gradient blobs, bokeh orbs, glassmorphism, fake WhatsApp chat, custom cursors, WebGL, ambient loops, or scroll hijacking.
- Public motion may use transform, opacity, filter, and verified clip paths. Authenticated motion is limited to 140-220 ms state transitions.
- Every sequence must provide a `prefers-reduced-motion` path. All content and controls remain immediately reachable.
- Keep every landing scene at 375, 768, and 1280 px. Verify an effective 1280 x 450 viewport or 200% zoom, 44 x 44 px controls, visible focus, WCAG AA contrast, and no horizontal overflow.
- Use local or self-hosted redistributable fonts. Do not keep a runtime Google Fonts dependency.
- Every task ends with focused verification and a commit. Stop after Task 9 for the required landing approval checkpoint.

## File Structure

Public presentation files are split by narrative responsibility:

```text
src/components/landing/
  FinancialPrelude.tsx       Scene 1 product-first opening
  CentralPromise.tsx         Scene 2 proposition and CTA
  MonthlyDashboardStage.tsx  Scene 3 inspectable month
  SourceConvergence.tsx      Scene 4 source-to-ledger composition
  WhatsAppDecisionStage.tsx  Scene 5 WhatsApp interpretation sequence
  AvailableAmountStage.tsx   Scene 6 remaining-spend calculation
  FutureCommitmentsStage.tsx Scene 7 forward warnings
  PlanningStage.tsx          Scene 8 budgets, goals, and spaces
  TrustStage.tsx             Scene 9 quality and privacy proof
  PricingStage.tsx           Scene 10 current plans and checkout links
  BrandSignature.tsx         Scene 11 closing mark and CTA
  LandingScene.tsx           Shared semantic scene frame
  ProductSurface.tsx         Shared bordered product surface primitive
  landingCopy.ts             PT-PT/PT-BR public copy resolver
  landingDemo.ts             Static, internally consistent public figures
  useLandingMotion.ts        GSAP lifecycle, ScrollTrigger, reduced motion
```

Brand and product-shell files remain shared but behavior-free:

```text
src/components/Logo.tsx
src/components/LandingHeader.tsx
src/components/dashboard/DashboardLayout.tsx
src/components/dashboard/DashboardNav.tsx
src/components/dashboard/ProductTopBar.tsx
```

Tests are grouped by contract rather than screenshots:

```text
src/test/basedash-fidelity-contract.test.ts
src/test/landing-basedash-fidelity.test.ts
src/test/landing-locale.test.ts
src/test/landing-demo-data.test.ts
src/test/entry-basedash-fidelity.test.ts
src/test/product-shell-basedash-fidelity.test.ts
```

---

### Task 1: Lock The Reference And Functional Boundary

**Files:**
- Create: `docs/design/basedash-reference-map.md`
- Create: `src/test/basedash-fidelity-contract.test.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: the approved spec and `/Users/fabriciolima/Downloads/basedash.mp4` plus `/Users/fabriciolima/Downloads/basedash.jpg`.
- Produces: scene IDs `prelude`, `promise`, `month`, `sources`, `whatsapp`, `available`, `future`, `planning`, `trust`, `plans`, and `signature`; an immutable functional boundary for all later tasks.

- [ ] **Step 1: Extract representative reference frames outside the repository**

Use a temporary Swift/AVFoundation extractor in `/tmp` to save frames at the opening, each major scene transition, and the final mark. Record the video duration and exact timestamps. The extractor output is review material and must not be committed.

Run:

```bash
swift /tmp/extract-basedash-frames.swift /Users/fabriciolima/Downloads/basedash.mp4 /tmp/organizzze-basedash-frames
```

Expected: numbered PNG frames exist in `/tmp/organizzze-basedash-frames`, with no repository changes.

- [ ] **Step 2: Write the reference map**

Create `docs/design/basedash-reference-map.md` with one row per Organizze scene:

```markdown
| Scene | Reference timestamp/frame | Organizze job | Geometry | Reveal order | Mobile adaptation |
| --- | --- | --- | --- | --- | --- |
| `prelude` | opening frame | establish product quality | layered dashboard above fold | shell, values, charts | stacked crop, no pin |
| `promise` | first centered statement | explain consolidation and available amount | centered copy with quiet space | eyebrow, headline, copy, CTA | same order, shorter gap |
```

Complete all eleven rows using observed timestamps and include separate notes for typography scale, hairlines, product-surface depth, section spacing, and closing-brand scale.

- [ ] **Step 3: Write the failing contract test**

Create `src/test/basedash-fidelity-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Organizze Basedash fidelity contract", () => {
  it("documents all eleven scene jobs and functional preservation", () => {
    const design = read("DESIGN.md");
    for (const id of ["prelude", "promise", "month", "sources", "whatsapp", "available", "future", "planning", "trust", "plans", "signature"]) {
      expect(design).toContain(`\`${id}\``);
    }
    expect(design).toContain("Functional Preservation");
    expect(design).toContain("Landing Approval Gate");
  });

  it("keeps financial, messaging, and payment work outside presentation modules", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).not.toMatch(/supabase|useTransactions|stripe|invoke\(/i);
  });
});
```

- [ ] **Step 4: Run the contract test red**

Run:

```bash
pnpm exec vitest run src/test/basedash-fidelity-contract.test.ts
```

Expected: FAIL because `DESIGN.md` does not yet contain the approved scene IDs and landing gate.

- [ ] **Step 5: Replace the obsolete visual contract in `DESIGN.md`**

Keep the existing behavior guarantees and rewrite visual sections under these exact headings:

```markdown
# Organizze Design System - Intelligence In Silence
## Brand Mark
## Color And Meaning
## Typography
## Public Scene Contract
## Product Shell Contract
## Motion
## Responsive And Accessibility
## Functional Preservation
## Landing Approval Gate
```

Copy the eleven scene IDs, current route list, token values, motion rules, demo-data separation, and checkpoint order from the approved spec.

- [ ] **Step 6: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/basedash-fidelity-contract.test.ts
git add DESIGN.md docs/design/basedash-reference-map.md src/test/basedash-fidelity-contract.test.ts
git commit -m "test: lock basedash fidelity contract"
```

Expected: focused tests pass and the commit contains documentation/tests only.

---

### Task 2: Build Brand, Typography, Locale, And Demo Foundations

**Files:**
- Create: `src/components/landing/landingCopy.ts`
- Create: `src/components/landing/landingDemo.ts`
- Create: `src/components/landing/ProductSurface.tsx`
- Create: `src/test/landing-locale.test.ts`
- Create: `src/test/landing-demo-data.test.ts`
- Modify: `src/components/Logo.tsx`
- Modify: `src/main.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: `resolvePublicLocale(stored?: string | null, browser?: string): "pt-PT" | "pt-BR"`, `getLandingCopy(locale: PublicLocale): LandingCopy`, `landingDemo: LandingDemo`, and `ProductSurfaceProps { children; className?; label?; tone? }`.
- Consumes: no authenticated hooks or customer data.

- [ ] **Step 1: Write failing locale and fixture tests**

Add these assertions:

```ts
expect(resolvePublicLocale("pt-BR", "pt-PT")).toBe("pt-BR");
expect(resolvePublicLocale(null, "pt-BR")).toBe("pt-BR");
expect(resolvePublicLocale(null, "en-US")).toBe("pt-PT");
expect(getLandingCopy("pt-PT").primaryCta).toBe("Começar 15 dias grátis");
expect(getLandingCopy("pt-BR").promiseTitle).toContain("você");
```

```ts
expect(landingDemo.income - landingDemo.committed - landingDemo.variable - landingDemo.reserved).toBe(landingDemo.available);
expect(landingDemo.sources.reduce((sum, source) => sum + source.amount, 0)).toBe(landingDemo.variable);
expect(JSON.stringify(landingDemo)).not.toMatch(/@|\+\d{8}|user_id|space_id|receipt_path/i);
```

- [ ] **Step 2: Run tests red**

Run:

```bash
pnpm exec vitest run src/test/landing-locale.test.ts src/test/landing-demo-data.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement deterministic public locale resolution**

Use this public interface in `landingCopy.ts`:

```ts
export type PublicLocale = "pt-PT" | "pt-BR";
export type SceneId = "prelude" | "promise" | "month" | "sources" | "whatsapp" | "available" | "future" | "planning" | "trust" | "plans" | "signature";

export type SceneCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

export type LandingCopy = {
  header: { method: string; whatsapp: string; plans: string; signIn: string };
  primaryCta: string;
  secondaryCta: string;
  promiseTitle: string;
  scenes: Record<SceneId, SceneCopy>;
  planNames: { pro: string; premium: string };
  finalStatement: string;
};

export const resolvePublicLocale = (stored?: string | null, browser = "pt-PT"): PublicLocale => {
  if (stored === "pt-BR" || stored === "pt-PT") return stored;
  return browser.toLowerCase().startsWith("pt-br") ? "pt-BR" : "pt-PT";
};

export const getLandingCopy = (locale: PublicLocale): LandingCopy => publicCopy[locale];
```

`LandingCopy` must contain header labels, eleven scene eyebrows/titles/descriptions, CTA labels, source labels, plan labels, privacy language, and the final signature without financial guarantees.

- [ ] **Step 4: Implement internally consistent fixtures**

Define and export these types before the frozen fixture:

```ts
export type DemoAmount = { label: string; amount: number };
export type LandingDemo = {
  currency: "EUR";
  income: number;
  committed: number;
  variable: number;
  reserved: number;
  available: number;
  sources: readonly DemoAmount[];
  categories: readonly DemoAmount[];
  upcoming: readonly (DemoAmount & { date: string; status: "safe" | "warning" | "expense" })[];
  goals: readonly (DemoAmount & { target: number })[];
  monthlySeries: readonly number[];
};
```

Populate currency `EUR`, five source totals, six categories, four upcoming commitments, two goals, and a 12-point monthly series. Export one frozen object and derive displayed totals from it.

- [ ] **Step 5: Replace the logo with the approved original convergence mark**

Keep `LogoProps` compatible and replace only the SVG paths. The mark must use five ledger cells converging toward one aligned center, be readable at 16 px, and keep `aria-label="Organizze"`. Add a `markOnly?: boolean` prop for the monumental final scene and compact top bar.

- [ ] **Step 6: Install and apply bundled Geist fonts plus exact tokens**

Install the redistributable Fontsource variable packages:

```bash
pnpm add @fontsource-variable/geist@5.3.0 @fontsource-variable/geist-mono@5.3.0
```

Import the required variable styles once in `src/main.tsx`:

```ts
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
```

Remove the Google Fonts `@import` and set `Geist Variable`/`Geist Mono Variable` as the primary Tailwind and CSS families with the existing system stacks as fallbacks. The font assets must be emitted by Vite and require no runtime font network request.

Set exact RGB-equivalent HSL variables for the approved palette, retain current semantic aliases, use 4-8 px radii, tabular figures, and stable public type classes. `index.html` may preload only the initial display regular/medium files that exist locally.

- [ ] **Step 7: Add the shared product surface**

Implement `ProductSurface` as a semantic `section` when `label` exists and a `div` otherwise. It may add a border, surface background, 4-8 px radius, controlled shadow, and optional semantic tone; it cannot fetch data or nest decorative cards.

- [ ] **Step 8: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/landing-locale.test.ts src/test/landing-demo-data.test.ts src/test/design-system-v3.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add package.json pnpm-lock.yaml src/main.tsx src/index.css tailwind.config.ts src/components/Logo.tsx src/components/landing/landingCopy.ts src/components/landing/landingDemo.ts src/components/landing/ProductSurface.tsx src/test/landing-locale.test.ts src/test/landing-demo-data.test.ts
git commit -m "feat: establish organizze cinematic foundation"
```

Expected: all focused tests and TypeScript pass; no font URL is loaded at runtime.

---

### Task 3: Build The Product Prelude And Central Promise

**Files:**
- Create: `src/components/landing/FinancialPrelude.tsx`
- Create: `src/components/landing/CentralPromise.tsx`
- Modify: `src/components/landing/LandingScene.tsx`
- Modify: `src/components/LandingHeader.tsx`
- Create: `src/test/landing-basedash-fidelity.test.ts`

**Interfaces:**
- Consumes: `LandingCopy`, `LandingDemo`, `ProductSurface`, and compatible `Logo`.
- Produces: `FinancialPreludeProps { demo: LandingDemo }`, `CentralPromiseProps { copy: LandingCopy }`, and semantic elements marked `data-scene="prelude"` and `data-scene="promise"`.

- [ ] **Step 1: Write the failing scene/header tests**

Render each component and assert:

```ts
expect(screen.getByRole("heading", { name: /tudo o que.*organizado/i })).toBeInTheDocument();
for (const link of screen.getAllByRole("link", { name: "Começar 15 dias grátis" })) {
  expect(link).toHaveAttribute("href", "/auth");
}
expect(screen.getByRole("link", { name: "Ver como funciona" })).toHaveAttribute("href", "#month");
expect(screen.getByLabelText("Resumo demonstrativo do mês")).toBeInTheDocument();
```

Also assert that the header menu controls are 44 px targets and that `Entrar` still points to `/auth`.

- [ ] **Step 2: Run the test red**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts
```

Expected: FAIL because the two new scenes do not exist.

- [ ] **Step 3: Extend `LandingScene` without changing semantics**

Support:

```ts
type LandingSceneProps = {
  id: string;
  scene: SceneId;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  labelledBy?: string;
};
```

Render a full-width `<section>` with `data-scene`, a constrained inner wrapper, and no embedded headline assumptions.

- [ ] **Step 4: Implement Scene 1**

Build one layered stage containing available amount, spending line, category allocation, and upcoming commitments. Every visual value comes from `landingDemo`; include a visually hidden or visible textual summary for charts. The bottom of the viewport must reveal a hint of Scene 2 at common desktop heights.

- [ ] **Step 5: Implement Scene 2 and public header**

Center the approved promise and CTA pair in quiet negative space. Header remains sticky, uses `Logo`, `Entrar`, and `Começar 15 dias grátis`, collapses to an accessible mobile menu, restores focus on close, and contains no pricing/checkout logic.

- [ ] **Step 6: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts src/test/entry-design.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/components/LandingHeader.tsx src/components/landing/LandingScene.tsx src/components/landing/FinancialPrelude.tsx src/components/landing/CentralPromise.tsx src/test/landing-basedash-fidelity.test.ts
git commit -m "feat: add cinematic landing opening"
```

---

### Task 4: Build The Month And Source-Convergence Proof

**Files:**
- Create: `src/components/landing/MonthlyDashboardStage.tsx`
- Create: `src/components/landing/SourceConvergence.tsx`
- Modify: `src/test/landing-basedash-fidelity.test.ts`

**Interfaces:**
- Produces: controlled demo tabs with IDs `overview`, `categories`, `commitments`, `goals`; semantic `data-scene="month"` and `data-scene="sources"`.
- Consumes: static `LandingDemo`; no query hooks.

- [ ] **Step 1: Add failing interaction and consistency tests**

Render `MonthlyDashboardStage`, activate `Categorias`, and assert its labelled panel becomes visible while the overview is hidden. Render `SourceConvergence` and assert all five source labels and the same `available` total from `landingDemo` are present.

- [ ] **Step 2: Run red**

Run `pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts`.

Expected: FAIL on missing components.

- [ ] **Step 3: Implement Scene 3**

Use Radix Tabs or the existing shadcn Tabs. Keep tabs keyboard-operable, product values inspectable, chart summaries accessible, and stage dimensions stable when tabs change. Charts may use SVG/Recharts but must not resize the page.

- [ ] **Step 4: Implement Scene 4**

Place manual, receipt, recurring, shared-space, and WhatsApp sources around a single ledger path. Use Lucide icons and semantic labels. The visual terminates at the consolidated variable-spend and available totals; it must not become a logo wall.

- [ ] **Step 5: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts src/test/landing-demo-data.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/components/landing/MonthlyDashboardStage.tsx src/components/landing/SourceConvergence.tsx src/test/landing-basedash-fidelity.test.ts
git commit -m "feat: add monthly and consolidation proof"
```

---

### Task 5: Build WhatsApp Interpretation And Available-Spend Stages

**Files:**
- Create: `src/components/landing/WhatsAppDecisionStage.tsx`
- Create: `src/components/landing/AvailableAmountStage.tsx`
- Modify: `src/test/landing-basedash-fidelity.test.ts`

**Interfaces:**
- Produces: semantic step list `input -> interpretation -> category -> transaction -> available`; a calculation using `income - committed - variable - reserved = available`.
- Consumes: text and receipt examples from `LandingDemo`, with no phone number or real receipt asset.

- [ ] **Step 1: Add failing anti-chat and calculation tests**

Assert that the stage contains `WhatsApp`, `Interpretação`, `Categoria`, `Lançamento`, and `Disponível`, while its source does not contain `chat-bubble`, `read receipt`, or `message transcript`. Assert all four calculation inputs and the derived available result are visible and labelled.

- [ ] **Step 2: Run red**

Run `pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts`.

- [ ] **Step 3: Implement Scene 5**

Render text and receipt as compact source artifacts, followed by Organizze-owned interpretation surfaces. Use a staged flow line rather than chat bubbles; label demo data explicitly and provide a concise text summary.

- [ ] **Step 4: Implement Scene 6**

Make available amount the largest value. Show expected income, commitments, variable spending, and reserved goals as an auditable equation. Include cautious copy for incomplete data and never promise certainty.

- [ ] **Step 5: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts src/test/whatsapp-ingest.test.ts src/test/whatsapp-process.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/components/landing/WhatsAppDecisionStage.tsx src/components/landing/AvailableAmountStage.tsx src/test/landing-basedash-fidelity.test.ts
git commit -m "feat: visualize whatsapp financial intelligence"
```

Expected: landing and existing WhatsApp contract tests pass unchanged.

---

### Task 6: Build Forward-Looking, Planning, And Trust Stages

**Files:**
- Create: `src/components/landing/FutureCommitmentsStage.tsx`
- Create: `src/components/landing/PlanningStage.tsx`
- Create: `src/components/landing/TrustStage.tsx`
- Modify: `src/test/landing-basedash-fidelity.test.ts`

**Interfaces:**
- Produces: semantic statuses `safe`, `warning`, `expense`; linked budget/goal/space stage; factual system-quality statements derived from implemented behavior.

- [ ] **Step 1: Add failing status and content tests**

Assert warnings have text labels in addition to color, each planning surface has a heading, and trust copy mentions private financial spaces, redacted technical events, and accessible account control without unsupported compliance claims.

- [ ] **Step 2: Run red**

Run `pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts`.

- [ ] **Step 3: Implement Scenes 7-9**

Scene 7 combines upcoming subscriptions, recurring expenses, and category limits into one forward calendar. Scene 8 uses one continuous planning surface for budget, goals, and shared spaces. Scene 9 uses restrained product fragments and short factual statements; do not invent certifications, bank-grade claims, uptime, or encryption guarantees absent from the codebase.

- [ ] **Step 4: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts src/test/financial-controls-v2.test.ts src/test/spaces-invitations-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/components/landing/FutureCommitmentsStage.tsx src/components/landing/PlanningStage.tsx src/components/landing/TrustStage.tsx src/test/landing-basedash-fidelity.test.ts
git commit -m "feat: add proactive planning narrative"
```

---

### Task 7: Build Pricing And Monumental Signature

**Files:**
- Create: `src/components/landing/PricingStage.tsx`
- Create: `src/components/landing/BrandSignature.tsx`
- Create: `src/lib/subscription/offers.ts`
- Modify: `src/pages/DashboardAssinatura.tsx`
- Modify: `src/test/landing-basedash-fidelity.test.ts`

**Interfaces:**
- Consumes: shared plan names, descriptions, features, lookup prefixes, and current `/auth` destination. Checkout remains owned by authenticated subscription code; no public price is invented because amounts are resolved by Stripe checkout rather than stored in the current frontend.
- Produces: two-plan comparison and `data-scene="plans"`, `data-scene="signature"`.

- [ ] **Step 1: Extract and test the current commercial metadata**

Move the existing `OFFERS` array without changing values into `src/lib/subscription/offers.ts` and export it as `SUBSCRIPTION_OFFERS`. Import it back into `DashboardAssinatura.tsx`. Assert the landing renders `Pro`, `Premium Elite`, the existing descriptions/features, and the 15-day trial language. Assert every public CTA still links to `/auth`, no amount is invented, and no Stripe call is present in landing source.

- [ ] **Step 2: Run red**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts src/test/subscription-v2.test.ts src/test/new-user-trial.test.ts
```

Expected: landing assertions fail; existing subscription tests pass.

- [ ] **Step 3: Implement Scene 10**

Compose both existing plans in one wide stage, emphasize the higher-value plan through scale/border hierarchy, and preserve transparent alternative pricing. The primary action starts at `/auth`; do not duplicate checkout logic on the public route.

- [ ] **Step 4: Implement Scene 11**

Render the mark-only `Logo` at monumental scale, the Organizze wordmark, the final approved promise, one CTA, and a restrained footer with real destinations only. Ensure the next section is not needed because this is the closing signature.

- [ ] **Step 5: Run and commit**

Run:

```bash
pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
git add src/components/landing/PricingStage.tsx src/components/landing/BrandSignature.tsx src/lib/subscription/offers.ts src/pages/DashboardAssinatura.tsx src/test/landing-basedash-fidelity.test.ts
git commit -m "feat: complete landing commercial signature"
```

---

### Task 8: Compose Eleven Scenes And Choreograph Motion

**Files:**
- Modify: `src/pages/Index.tsx`
- Modify: `src/components/landing/useLandingMotion.ts`
- Modify: `src/index.css`
- Modify: `src/test/landing-basedash-fidelity.test.ts`
- Modify: `src/test/landing-invisible-ledger.test.ts`
- Delete: `src/components/landing/AutomationSequence.tsx`
- Delete: `src/components/landing/DecisionPreview.tsx`
- Delete: `src/components/landing/ExpenseConsolidation.tsx`
- Delete: `src/components/landing/ProductStage.tsx`

**Interfaces:**
- Consumes: all eleven scene components and `useLandingMotion(scope: RefObject<HTMLElement>): void`.
- Produces: one ordered public narrative; GSAP context cleaned on unmount; mobile and reduced-motion branches.

- [ ] **Step 1: Update the landing-order test before composition**

Assert the rendered `data-scene` values equal exactly:

```ts
[
  "prelude", "promise", "month", "sources", "whatsapp", "available",
  "future", "planning", "trust", "plans", "signature",
]
```

Replace the obsolete six-scene assertions in `src/test/landing-invisible-ledger.test.ts` with the same eleven-scene order, new CTA labels/destinations, and current header anchors. Preserve its anti-chat assertions. Also assert the public route contains no old five-scene component import and no fake chat UI.

- [ ] **Step 2: Run red**

Run `pnpm exec vitest run src/test/landing-basedash-fidelity.test.ts`.

- [ ] **Step 3: Compose `Index.tsx`**

Resolve public locale once using explicit local preference first and `navigator.language` second. Pass only `copy` and `landingDemo` into scenes. Keep `LandingHeader` outside the motion scope and preserve `/auth`, `#month`, and `#whatsapp` destinations.

- [ ] **Step 4: Implement scoped GSAP timelines**

Use dynamic imports and `gsap.context` inside `useEffect`:

```ts
const [{ gsap }, { ScrollTrigger }] = await Promise.all([
  import("gsap"),
  import("gsap/ScrollTrigger"),
]);
gsap.registerPlugin(ScrollTrigger);
const context = gsap.context(() => {
  // Named timelines target data-motion attributes inside scope only.
}, scope);
return () => context.revert();
```

Use `gsap.matchMedia()` for desktop, mobile, and `(prefers-reduced-motion: reduce)`. Desktop may pin only product stages whose full content remains reachable; mobile removes pinning and lowers depth/stagger. No timeline performs routing, fetching, calculations, or state mutation.

- [ ] **Step 5: Remove obsolete landing components and harden CSS**

Delete only components no longer imported. Add scene aspect ratios, stable grid tracks, overflow clipping on visual stages, visible document overflow checks, and no viewport-width font scaling. Keep all landing content in document flow when JavaScript is unavailable.

- [ ] **Step 6: Run the full landing gate**

Run:

```bash
pnpm exec vitest run src/test/basedash-fidelity-contract.test.ts src/test/landing-basedash-fidelity.test.ts src/test/landing-locale.test.ts src/test/landing-demo-data.test.ts src/test/entry-design.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run build
pnpm run lint
```

Expected: all tests pass, TypeScript/build exit 0, lint has zero errors, and only previously accepted Fast Refresh warnings may remain.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Index.tsx src/components/landing src/index.css src/test/landing-basedash-fidelity.test.ts src/test/landing-invisible-ledger.test.ts
git commit -m "feat: deliver eleven-scene organizze landing"
```

---

### Task 9: Perform The Landing Approval Gate

**Files:**
- Create: `docs/qa/2026-08-25-basedash-landing-qa.md`
- Modify: landing files only when a measured defect is found.

**Interfaces:**
- Consumes: production build, reference frames, and the completed landing.
- Produces: explicit pass/fail evidence and a user-visible URL. This task blocks Tasks 10-15.

- [ ] **Step 1: Start a production-like local preview**

Run:

```bash
pnpm run build
pnpm exec vite preview --host 127.0.0.1 --port 56784
```

Expected: the landing is available at `http://127.0.0.1:56784/`.

- [ ] **Step 2: Capture the required viewport matrix**

Using the permitted browser QA tooling, capture `/` at 375 x 812, 768 x 1024, 1280 x 800, and 1280 x 450. Capture reduced-motion at 375 and 1280. Do not use alternate tooling to bypass a browser safety block; record the blocked check explicitly.

- [ ] **Step 3: Compare each scene with the reference map**

For every scene record pass/fail for relative headline/product scale, negative space, product-first hierarchy, hairline geometry, depth, reveal order, CTA prominence, and mobile narrative preservation. Inspect console errors, keyboard focus, menu behavior, horizontal overflow, long Portuguese copy, and chart summaries.

- [ ] **Step 4: Measure the public route**

Record LCP, CLS, public JS transfer, and the incremental GSAP/motion chunk. Targets: LCP below 2.5 s and CLS below 0.1 where local tooling permits. A tooling gap is written as `BLOCKED` with reason rather than `PASS`.

- [ ] **Step 5: Fix and repeat focused checks**

For each defect, write a failing test when automatable, apply the smallest presentation-only fix, rerun the relevant test and viewport, and append the result to the QA file.

- [ ] **Step 6: Commit the evidence and present the checkpoint**

```bash
git add docs/qa/2026-08-25-basedash-landing-qa.md src
git commit -m "test: verify basedash landing fidelity"
```

Stop and present the local URL plus the QA summary. Continue to Task 10 only after explicit user approval of the landing.

---

### Task 10: Redesign Authentication, OAuth, Invitations, And Onboarding

**Files:**
- Modify: `src/pages/Auth.tsx`
- Modify: `src/pages/OAuthConsent.tsx`
- Modify: `src/pages/AcceptInvitation.tsx`
- Modify: `src/pages/OnboardingNome.tsx`
- Modify: `src/pages/OnboardingIdioma.tsx`
- Modify: `src/pages/OnboardingMoeda.tsx`
- Modify: `src/pages/OnboardingWhatsApp.tsx`
- Modify: `src/pages/OnboardingWhatsAppVerificar.tsx`
- Create: `src/components/entry/EntryFrame.tsx`
- Create: `src/components/entry/EntryProductProof.tsx`
- Create: `src/test/entry-basedash-fidelity.test.ts`

**Interfaces:**
- `EntryFrameProps { step?: number; totalSteps?: number; title: string; description?: string; proof?: ReactNode; children: ReactNode }`.
- Existing submit, provider, validation, skip, polling, timer, reconnect, and redirect callbacks remain unchanged.

- [ ] **Step 1: Extend entry tests to fingerprint handlers and destinations**

For each page, assert existing fields, accessible names, disabled/loading branches, callbacks, timer/poll behavior, skip destination, and redirect paths before changing markup.

- [ ] **Step 2: Run the entry suite green before edits**

Run:

```bash
pnpm exec vitest run src/test/entry-design.test.ts src/test/onboarding-invisible-ledger.test.ts src/test/entry-basedash-fidelity.test.ts
```

Expected: existing suites pass; new visual assertions fail.

- [ ] **Step 3: Implement shared entry framing and update pages**

Use one decision per page, a small Organizze financial proof fragment, stable progress, 44 px controls, and compact product-first geometry. Move no state or callbacks into `EntryFrame`; pass existing rendered forms as children.

- [ ] **Step 4: Verify and commit**

Run focused entry tests, `pnpm exec tsc -p tsconfig.app.json --noEmit`, then:

```bash
git add src/components/entry src/pages/Auth.tsx src/pages/OAuthConsent.tsx src/pages/AcceptInvitation.tsx src/pages/Onboarding*.tsx src/test/entry-basedash-fidelity.test.ts
git commit -m "feat: redesign entry and onboarding surfaces"
```

---

### Task 11: Replace The Desktop Rail With The Product Top Bar

**Files:**
- Create: `src/components/dashboard/ProductTopBar.tsx`
- Modify: `src/components/dashboard/DashboardLayout.tsx`
- Modify: `src/components/dashboard/DashboardNav.tsx`
- Create: `src/test/product-shell-basedash-fidelity.test.ts`
- Modify: `src/test/dashboard-shell-v3.test.ts`

**Interfaces:**
- `ProductTopBarProps { currentSpaceName; email; planLabel; navigationOpen; onNavigationOpen; onRestartTour; onSignOut }`.
- `DashboardNav` retains `primaryNavGroups`, `mobilePrimaryLinks`, destinations, active-route behavior, and the current mobile five-item contract.

- [ ] **Step 1: Rewrite shell expectations before markup**

Assert there is no visible desktop aside, the product bar exposes logo/space/account/navigation controls, the full navigation panel contains every current destination, Escape closes it, focus returns to opener, sign-out and tour callbacks fire, and mobile still has exactly five destinations.

- [ ] **Step 2: Run red**

Run `pnpm exec vitest run src/test/dashboard-shell-v3.test.ts src/test/product-shell-basedash-fidelity.test.ts`.

- [ ] **Step 3: Implement top bar and full navigation panel**

Keep `Outlet` and current providers unchanged. Use Radix Sheet/Dialog for the icon-triggered navigation panel. Preserve current account menu, trial label, space label, diagnostics, subscription, tour, and sign-out actions. Keep one content scroll owner and reserve bottom-nav space on mobile.

- [ ] **Step 4: Verify and commit**

Run the two shell tests, TypeScript, and lint; then commit `ProductTopBar`, layout, nav, and tests with message `feat: add organizze product top bar`.

---

### Task 12: Redesign The Dashboard Overview

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/dashboard/DashboardCard.tsx`
- Modify: `src/components/dashboard/MetricStrip.tsx`
- Modify: `src/components/dashboard/DecisionPanel.tsx`
- Modify: `src/components/dashboard/PageHeader.tsx`
- Modify: `src/test/dashboard-v2.test.ts`

**Interfaces:**
- Existing dashboard hooks and mapped transaction model remain unchanged.
- Produces a visual hierarchy of available amount, next commitment, nearest limit, supporting monthly evidence, and current transactions.

- [ ] **Step 1: Preserve behavioral assertions and add reading-order tests**

Assert the same transaction mapping, void exclusion, totals, retry, delete callbacks, and route links. Add DOM-order assertions for context, available amount, next commitment, limit, evidence, and transactions.

- [ ] **Step 2: Run red, redesign presentation, run green**

Use wide data bands and one main decision surface. Avoid decorative card grids and nested cards. Keep all text summaries, error states, quick actions, and mutation feedback.

- [ ] **Step 3: Verify and commit**

Run `src/test/dashboard-v2.test.ts`, `src/test/design-system-v3.test.ts`, TypeScript, and lint; commit with `feat: focus dashboard on the next financial decision`.

---

### Task 13: Redesign Transactions, Reports, And Budget

**Files:**
- Modify: `src/pages/DashboardLancamentos.tsx`
- Modify: `src/pages/DashboardRelatorios.tsx`
- Modify: `src/pages/DashboardOrcamento.tsx`
- Modify: `src/components/dashboard/FinancialRow.tsx`
- Modify: `src/components/dashboard/MonthSelector.tsx`
- Modify: `src/test/transactions-v2.test.ts`
- Modify: `src/test/budgets-reports-v2.test.ts`

**Interfaces:**
- Preserve all query keys, CRUD callbacks, filters, calendar dates, currency parsing, chart data, tooltips, summaries, month handlers, and permission branches.

- [ ] **Step 1: Add visual hierarchy tests without weakening behavior tests**

Assert desktop tables and mobile rows remain distinct, action callbacks remain reachable on both, chart summaries use the same totals, and budget thresholds retain text labels.

- [ ] **Step 2: Run the focused suites green before edits**

Run `pnpm exec vitest run src/test/transactions-v2.test.ts src/test/budgets-reports-v2.test.ts`.

- [ ] **Step 3: Apply wide-band product styling**

Keep tables dense on desktop, convert only at the existing breakpoint, preserve dialogs and form field order, and make filters/month selection stable. Use semantic colors only for actual income, expense, safe, and warning values.

- [ ] **Step 4: Verify and commit**

Run focused suites, TypeScript, lint, then commit with `feat: refine core financial workspaces`.

---

### Task 14: Redesign Plans, Limits, And Goals

**Files:**
- Modify: `src/pages/DashboardPlanos.tsx`
- Modify: `src/pages/DashboardLimiteGastos.tsx`
- Modify: `src/pages/DashboardObjetivos.tsx`
- Modify: `src/test/financial-controls-v2.test.ts`

**Interfaces:**
- Preserve create/edit/delete callbacks, form order, currency/date validation, timezone period boundaries, progress clamping, threshold labels, and permission/retry states.

- [ ] **Step 1: Add DOM-order and accessibility assertions**

Assert each page starts with its primary decision/progress, action controls remain reachable on desktop/mobile, statuses are textual, and dialog focus behavior remains delegated to Radix.

- [ ] **Step 2: Run green baseline, implement, run green again**

Use continuous planning surfaces, compact rows, stable progress geometry, and no nested decorative cards. Do not change hooks or mutation payloads.

- [ ] **Step 3: Verify and commit**

Run `src/test/financial-controls-v2.test.ts`, TypeScript, lint, and commit with `feat: unify financial planning surfaces`.

---

### Task 15: Redesign Spaces, WhatsApp, Diagnostics, Subscription, And Shared States

**Files:**
- Modify: `src/pages/DashboardGrupos.tsx`
- Modify: `src/pages/DashboardWhatsApp.tsx`
- Modify: `src/pages/DashboardDiagnosticoWhatsApp.tsx`
- Modify: `src/pages/DashboardAssinatura.tsx`
- Modify: `src/pages/NotFound.tsx`
- Modify: `src/components/dashboard/EmptyState.tsx`
- Modify: `src/components/dashboard/TourOverlay.tsx`
- Modify: `src/components/ui/sonner.tsx`
- Modify: existing spaces, WhatsApp, subscription, and design-system tests.

**Interfaces:**
- Preserve invitations, roles, RPC boundaries, connection gating, trial/paid/lifetime logic, verification fallback, parsing/receipt flow, diagnostics redaction/retries, checkout modal ownership, toast semantics, tour storage, and recovery destinations.

- [ ] **Step 1: Run all related suites as the behavioral baseline**

Run:

```bash
pnpm exec vitest run src/test/spaces-invitations-v2.test.ts src/test/dashboard-whatsapp-v2.test.ts src/test/whatsapp-onboarding-v2.test.ts src/test/subscription-v2.test.ts src/test/new-user-trial.test.ts src/test/design-system-v3.test.ts
```

- [ ] **Step 2: Add state-coverage assertions**

Cover invitation pending/expired, disconnected/active WhatsApp, free/trial/paid/lifetime/test-mode subscription, diagnostics loading/error/success, checkout open/close/focus return, tour focus trap, actionable empty states, toast close targets, and 404 recovery.

- [ ] **Step 3: Apply the approved visual system**

Keep authenticated WhatsApp as an activity/testing workspace, keep diagnostics technical and redacted, use one staged plan comparison with the current checkout trigger, and preserve all existing handlers verbatim.

- [ ] **Step 4: Verify and commit**

Run the related suites, TypeScript, lint, then commit with `feat: finish organizze product surfaces`.

---

### Task 16: Final Functional, Visual, Performance, And Independent Review Gate

**Files:**
- Create: `docs/qa/2026-08-25-basedash-full-product-qa.md`
- Modify: only files with verified defects.

**Interfaces:**
- Produces: final release evidence for all routes and named states, with external-service gaps explicitly marked.

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
pnpm run test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run build
pnpm run lint
pnpm exec react-doctor@latest . --verbose
node --test infra/whatsapp/bridge/test/*.test.mjs
```

Expected: all tests, TypeScript, build, and bridge tests pass; lint has zero errors; React Doctor regressions are resolved or explicitly documented with unchanged baseline evidence.

- [ ] **Step 2: Exercise the full route and state matrix**

Verify `/`, `/auth`, OAuth consent, invitation acceptance, every onboarding step, every dashboard route, checkout overlay, dialogs, menus, tooltips, toasts, loading, empty, error, trial, paid, lifetime, test-mode, pending, expired, disconnected, and active states. Test keyboard-only use, 200% zoom, reduced motion, 375/768/1280 widths, and no horizontal overflow.

- [ ] **Step 3: Exercise representative live behavior without mutating contracts**

Verify sign-in, onboarding continuation, month changes, transaction create/edit/void/delete, budget recalculation, invitation acceptance, WhatsApp connection/activity/diagnostics, and checkout initiation against the configured environment. Record external credentials, provider limits, or unavailable services as explicit gaps without exposing secrets.

- [ ] **Step 4: Request two independent reviews**

Dispatch one reviewer for functional/security regressions and one for visual-contract/accessibility/performance fidelity. Each reviewer reads the approved spec, this plan, the diff, and QA evidence. Resolve every high/medium finding or document a user-accepted limitation.

- [ ] **Step 5: Re-run affected checks and commit the final evidence**

```bash
git add docs/qa/2026-08-25-basedash-full-product-qa.md src
git commit -m "test: verify complete organizze redesign"
git status --short --branch
```

Expected: clean worktree on the feature branch and a QA report that distinguishes `PASS`, `FAIL`, and `BLOCKED` for every required check.
