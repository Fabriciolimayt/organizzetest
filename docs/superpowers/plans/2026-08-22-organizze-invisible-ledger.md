# Organizze Invisible Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complete Organizze visual layer with the approved Invisible Ledger system while preserving every existing route, handler, data result, permission, WhatsApp flow, and subscription behavior.

**Architecture:** Keep business logic in the current hooks, Supabase clients, and page handlers. Introduce a dark functional token system and a small set of reusable presentation components; pages compose those components without moving data access into them. Landing-only cinematic motion is isolated from authenticated routes and loaded only on the public page.

**Tech Stack:** Vite 5, React 18, TypeScript 5.8, Tailwind CSS 3, shadcn/Radix UI, Lucide React, Recharts, Vitest, Testing Library, GSAP with ScrollTrigger loaded only by the landing route.

**Spec:** `docs/superpowers/specs/2026-08-22-organizze-invisible-ledger-design.md`

## Global Constraints

- Do not change route paths, protected-route behavior, form validation, Supabase schema, RLS, RPCs, financial calculations, WhatsApp processing, subscription eligibility, Stripe synchronization, trial behavior, or permanent entitlements.
- Preserve all existing hooks and event handlers; visual components receive values and callbacks through props.
- Use `#050607`, `#12161B`, `#0E1115`, `#252B33`, `#F5F7FA`, `#89929E`, `#69D7FF`, and `#BCEEFF` as the approved core palette.
- Use `#66DFA6`, `#FF7C6B`, and `#F4C56A` only for financial and status semantics.
- Do not add gradients, decorative blobs, glassmorphism, nested cards, ambient loops, fake urgency, or a simulated WhatsApp conversation.
- Animate only `transform`, `opacity`, and `filter`; every sequence must have a `prefers-reduced-motion` path.
- Validate 375 px, 768 px, and 1280 px widths with no horizontal overflow or incoherent overlap.
- Preserve the current dirty worktree before creating an isolated worktree. Never include the unrelated untracked `omniroute/` directory.
- Every task ends with focused tests and a commit before the next task starts.

---

### Task 1: Preserve The Verified Baseline

**Files:**
- Modify: tracked files currently reported by `git status --short`
- Exclude: `omniroute/`
- Test: existing `src/test/*.test.ts`

**Interfaces:**
- Consumes: current working tree verified in the prior design pass.
- Produces: a clean Git baseline containing the current functional app and the Ledger Edition work, ready for a new worktree.

- [ ] **Step 1: Record the exact working-tree boundary**

Run:

```bash
git status --short
git diff --check
```

Expected: tracked Organizze changes are listed; `omniroute/` remains untracked; `git diff --check` prints nothing.

- [ ] **Step 2: Re-run the functional baseline**

Run:

```bash
pnpm run test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run build
pnpm exec eslint src tailwind.config.ts vite.config.ts
```

Expected: 147 or more tests pass, TypeScript exits 0, build exits 0, and ESLint reports zero errors. Existing Fast Refresh warnings may remain.

- [ ] **Step 3: Commit only the verified tracked baseline**

Run:

```bash
git add -u
git commit -m "feat: preserve verified ledger interface baseline"
```

Expected: the commit contains tracked Organizze files only. Confirm with:

```bash
git status --short
```

Expected remaining output: `?? omniroute/` only.

---

### Task 2: Lock The Invisible Ledger Contract In Tests

**Files:**
- Create: `src/test/invisible-ledger-contract.test.ts`
- Modify: `src/test/design-system-v3.test.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: approved spec token names and preservation constraints.
- Produces: source-level design assertions used by every later task.

- [ ] **Step 1: Write the failing contract test**

Create `src/test/invisible-ledger-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Invisible Ledger visual contract", () => {
  it("defines the approved dark functional tokens", () => {
    const css = read("src/index.css");
    expect(css).toContain("--void: 210 17% 2%");
    expect(css).toContain("--intelligence: 196 100% 71%");
    expect(css).toContain("--financial-income: 153 65% 64%");
    expect(css).toContain("--financial-expense: 7 100% 71%");
    expect(css).toContain("--financial-warning: 40 87% 69%");
  });

  it("documents functional preservation and reduced motion", () => {
    const design = read("DESIGN.md");
    expect(design).toContain("Invisible Ledger");
    expect(design).toContain("Functional Preservation");
    expect(design).toContain("prefers-reduced-motion");
  });

  it("keeps landing motion isolated from the app shell", () => {
    const app = read("src/App.tsx");
    const landingMotion = read("src/components/landing/useLandingMotion.ts");
    expect(app).not.toContain('from "gsap"');
    expect(landingMotion).toContain('import("gsap")');
    expect(landingMotion).toContain("prefers-reduced-motion");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm exec vitest run src/test/invisible-ledger-contract.test.ts
```

Expected: FAIL because the new tokens, documentation section, and landing motion module do not exist.

- [ ] **Step 3: Replace the old Ledger Edition contract in `DESIGN.md`**

Write the approved system from the spec into `DESIGN.md` with these exact sections:

```markdown
# Organizze Design System — Invisible Ledger
## 1. Direction
## 2. Color
## 3. Typography
## 4. Layout
## 5. Primitives
## 6. Motion And Interaction
## 7. Functional Preservation
## 8. Responsive And Accessibility
## 9. Accepted Debt
```

Under `## 7. Functional Preservation`, enumerate routes, handlers, Supabase, WhatsApp, payments, trials, and permissions as immutable behavior contracts. Copy the approved token values and responsive widths verbatim from the spec.

- [ ] **Step 4: Update the old design-system test description**

In `src/test/design-system-v3.test.ts`, rename the suite and replace mineral-paper expectations:

```ts
describe("Organizze Invisible Ledger design system", () => {
  it("uses the approved dark functional tokens and financial typography", () => {
    expect(css).toContain("--void: 210 17% 2%");
    expect(css).toContain("--intelligence: 196 100% 71%");
    expect(css).toContain("font-variant-numeric: tabular-nums lining-nums");
    expect(css).toContain(".functional-panel");
  });
});
```

- [ ] **Step 5: Keep the test red for the implementation task**

Run:

```bash
pnpm exec vitest run src/test/invisible-ledger-contract.test.ts src/test/design-system-v3.test.ts
```

Expected: documentation assertions pass; CSS and motion module assertions still fail.

- [ ] **Step 6: Commit the contract**

```bash
git add DESIGN.md src/test/invisible-ledger-contract.test.ts src/test/design-system-v3.test.ts
git commit -m "test: lock invisible ledger design contract"
```

---

### Task 3: Implement Tokens, Typography, And Motion Infrastructure

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`
- Create: `src/components/landing/useLandingMotion.ts`

**Interfaces:**
- Consumes: CSS variables named in Task 2.
- Produces: `useLandingMotion(scope: RefObject<HTMLElement>): void`, dark functional utility classes, and landing-only GSAP loading.

- [ ] **Step 1: Install the proven scroll-motion engine**

Run:

```bash
pnpm add gsap
```

Expected: `package.json` and `pnpm-lock.yaml` record GSAP without changing React or Vite versions.

- [ ] **Step 2: Implement the approved CSS variables**

Replace the light default token block in `src/index.css` with HSL equivalents of the approved palette:

```css
:root {
  --void: 210 17% 2%;
  --background: 210 17% 2%;
  --foreground: 210 33% 97%;
  --card: 213 20% 8%;
  --card-foreground: 210 33% 97%;
  --popover: 213 20% 8%;
  --popover-foreground: 210 33% 97%;
  --primary: 196 100% 71%;
  --primary-hover: 195 100% 78%;
  --primary-foreground: 200 63% 5%;
  --secondary: 216 21% 10%;
  --secondary-foreground: 210 33% 97%;
  --muted: 216 17% 13%;
  --muted-foreground: 213 9% 58%;
  --border: 214 16% 17%;
  --input: 214 16% 17%;
  --ring: 196 100% 71%;
  --intelligence: 196 100% 71%;
  --intelligence-soft: 196 100% 87%;
  --financial-income: 153 65% 64%;
  --financial-expense: 7 100% 71%;
  --financial-warning: 40 87% 69%;
  --sidebar-background: 210 20% 3%;
  --sidebar-foreground: 210 23% 94%;
  --sidebar-accent: 214 24% 9%;
  --sidebar-border: 214 16% 17%;
  --radius-control: 0.5rem;
  --radius-panel: 0.75rem;
  --motion-micro: 140ms;
  --motion-standard: 220ms;
  --motion-scene: 720ms;
}
```

Replace the Google Fonts import with the neo-grotesk and financial pairing:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap");
```

Use `Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif` for body and display text. Remove Fraunces from the default hierarchy and retain IBM Plex Mono for financial values.

Add these reusable classes:

```css
.functional-panel {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-panel);
}

.intelligence-panel {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--intelligence) / 0.42);
  border-radius: var(--radius-panel);
}

.financial-value {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-variant-numeric: tabular-nums lining-nums;
}

[data-scene] {
  will-change: transform, opacity;
}
```

Retain the existing global reduced-motion rule and change `html { color-scheme: dark; }`.

- [ ] **Step 3: Update Tailwind semantic aliases**

In `tailwind.config.ts`, map:

```ts
intelligence: {
  DEFAULT: "hsl(var(--intelligence))",
  soft: "hsl(var(--intelligence-soft))",
},
financial: {
  income: "hsl(var(--financial-income))",
  expense: "hsl(var(--financial-expense))",
  warning: "hsl(var(--financial-warning))",
},
```

Remove `print` shadow and keep only a low-opacity menu shadow. Replace editorial display sizes with neutral product display sizes and preserve tabular mono values.

- [ ] **Step 4: Implement landing-only motion loading**

Create `src/components/landing/useLandingMotion.ts`:

```ts
import { useEffect, type RefObject } from "react";

export function useLandingMotion(scope: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.querySelectorAll<HTMLElement>("[data-scene]").forEach((node) => {
        node.style.opacity = "1";
        node.style.transform = "none";
      });
      return;
    }

    let cancelled = false;
    let cleanup = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, triggerModule]) => {
      const gsap = gsapModule.default;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-scene]").forEach((scene) => {
          gsap.fromTo(scene, { autoAlpha: 0, y: 28 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: { trigger: scene, start: "top 82%", once: true },
          });
        });
      }, root);
      cleanup = () => context.revert();
      if (cancelled) cleanup();
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [scope]);
}
```

- [ ] **Step 5: Run focused tests**

```bash
pnpm exec vitest run src/test/invisible-ledger-contract.test.ts src/test/design-system-v3.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Measure the build boundary**

```bash
pnpm run build
```

Expected: a separate GSAP/landing chunk or an async chunk referenced by the landing bundle; authenticated app code does not import GSAP statically.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/index.css tailwind.config.ts src/components/landing/useLandingMotion.ts
git commit -m "feat: add invisible ledger visual foundation"
```

---

### Task 4: Rebuild The Primitive Layer And Showcase

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/ui/chart.tsx`
- Modify: `src/components/dashboard/DashboardCard.tsx`
- Modify: `src/components/dashboard/MetricStrip.tsx`
- Modify: `src/components/dashboard/FinancialRow.tsx`
- Create: `src/components/dashboard/DecisionPanel.tsx`
- Modify: `src/components/design-system/PrimitiveShowcase.tsx`
- Test: `src/test/design-system-v3.test.ts`

**Interfaces:**
- Consumes: Task 3 tokens.
- Produces: backward-compatible shadcn variants and `DecisionPanelProps` with `eyebrow`, `title`, `description`, `action`, and `tone`.

- [ ] **Step 1: Add failing primitive assertions**

Append to `src/test/design-system-v3.test.ts`:

```ts
const decisionPanel = readFileSync(resolve(process.cwd(), "src/components/dashboard/DecisionPanel.tsx"), "utf8");

it("exposes the signature next-decision primitive", () => {
  expect(decisionPanel).toContain("type DecisionPanelProps");
  expect(decisionPanel).toContain('tone?: "intelligence" | "warning" | "neutral"');
  expect(decisionPanel).toContain("intelligence-panel");
});
```

- [ ] **Step 2: Verify the assertion fails**

```bash
pnpm exec vitest run src/test/design-system-v3.test.ts
```

Expected: FAIL because `DecisionPanel.tsx` is missing.

- [ ] **Step 3: Implement `DecisionPanel`**

Create `src/components/dashboard/DecisionPanel.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DecisionPanelProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "intelligence" | "warning" | "neutral";
};

export default function DecisionPanel({ eyebrow, title, description, action, tone = "intelligence" }: DecisionPanelProps) {
  return (
    <section className={cn("functional-panel p-5 sm:p-6", tone === "intelligence" && "intelligence-panel", tone === "warning" && "border-financial-warning/45")}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", tone === "warning" ? "text-financial-warning" : "text-intelligence")}>{eyebrow}</p>
      <h2 className="mt-6 max-w-lg text-2xl font-semibold leading-tight text-foreground">{title}</h2>
      {description && <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
```

- [ ] **Step 4: Restyle primitives without changing APIs**

For each listed shadcn file:

- Keep exported names, props, Radix composition, keyboard behavior, and variant keys.
- Use 8 px controls and 12 px data panels.
- Use `bg-card`, `border-border`, `text-foreground`, and `shadow-menu` only for elevated menus/dialogs.
- Map legacy `glass`, `gradient`, and `gold` button variants to solid semantic surfaces without gradients so callers do not break.
- Use `text-financial-expense`, `text-financial-income`, and `text-financial-warning` only for semantic states.

- [ ] **Step 5: Expand the primitive showcase**

In `PrimitiveShowcase.tsx`, render labeled groups for:

```tsx
<DecisionPanel
  eyebrow="Próxima decisão"
  title="Podes gastar 96 € em lazer."
  description="Sem ultrapassar o limite deste mês."
/>
```

Also render default, hover-capable, disabled, loading, error, warning, selected, empty, and long-Portuguese-label examples for the existing button, input, select, tabs, metric, row, table, and dialog primitives.

- [ ] **Step 6: Run primitive tests and typecheck**

```bash
pnpm exec vitest run src/test/design-system-v3.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 7: Browser-check the showcase**

Run the dev server and inspect `/__design-system` at 375, 768, and 1280 px. Verify no clipped labels, nested cards, low-contrast text, or inaccessible focus states.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui src/components/dashboard/DashboardCard.tsx src/components/dashboard/MetricStrip.tsx src/components/dashboard/FinancialRow.tsx src/components/dashboard/DecisionPanel.tsx src/components/design-system/PrimitiveShowcase.tsx src/test/design-system-v3.test.ts
git commit -m "feat: rebuild invisible ledger primitives"
```

---

### Task 5: Implement The Six-Scene Landing Narrative

**Files:**
- Create: `src/components/landing/LandingScene.tsx`
- Create: `src/components/landing/AutomationSequence.tsx`
- Create: `src/components/landing/ExpenseConsolidation.tsx`
- Create: `src/components/landing/DecisionPreview.tsx`
- Modify: `src/components/landing/ProductStage.tsx`
- Modify: `src/components/LandingHeader.tsx`
- Modify: `src/components/Logo.tsx`
- Modify: `src/pages/Index.tsx`
- Create: `src/test/landing-invisible-ledger.test.ts`

**Interfaces:**
- Consumes: `useLandingMotion`, core tokens, existing `/auth` and section anchors.
- Produces: six semantic landing scenes and the unchanged navigation destinations.

- [ ] **Step 1: Write the failing narrative test**

Create `src/test/landing-invisible-ledger.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const index = readFileSync(resolve(process.cwd(), "src/pages/Index.tsx"), "utf8");

describe("Invisible Ledger landing", () => {
  it("implements the approved six-scene decision path", () => {
    expect(index).toContain("Tudo entra. O mês responde.");
    expect(index).toContain("As despesas deixam de viver espalhadas.");
    expect(index).toContain("Não mostra apenas quanto gastaste.");
    expect(index).toContain("Envia pelo WhatsApp. Continua no Organizze.");
    expect(index).toContain("Vê tudo. Decide uma coisa de cada vez.");
    expect(index).toContain("O teu dinheiro deixa de te apanhar de surpresa.");
  });

  it("uses the approved calls to action and no simulated chat", () => {
    expect(index).toContain("Organizar o meu mês");
    expect(index).toContain("Ver como funciona");
    expect(index).not.toContain("chat-bubble");
  });
});
```

- [ ] **Step 2: Verify the test fails**

```bash
pnpm exec vitest run src/test/landing-invisible-ledger.test.ts
```

Expected: FAIL on the new narrative copy.

- [ ] **Step 3: Build semantic scene components**

Implement `LandingScene` with this interface:

```tsx
type LandingSceneProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  align?: "center" | "split";
};
```

The root must be a `<section data-scene>` with a constrained inner layout and no card wrapper around the section.

Implement `AutomationSequence` as three visible stages: WhatsApp/receipt origin, Organizze interpretation, and month update. Do not render a conversation transcript.

Implement `ExpenseConsolidation` using receipt, recurring, manual, and total values. Implement `DecisionPreview` with available amount, limit status, and a plain-language next decision.

- [ ] **Step 4: Recompose `Index.tsx` in the approved order**

Use a root `ref` passed to `useLandingMotion`. Preserve existing header links and `/auth` destinations. Render exactly these scene IDs:

```tsx
<main ref={landingRef}>
  <LandingScene id="inicio" ... />
  <LandingScene id="tudo-junto" ... />
  <LandingScene id="decisoes" ... />
  <LandingScene id="whatsapp" ... />
  <LandingScene id="produto" ... />
  <LandingScene id="comecar" ... />
</main>
```

The first viewport must show the hero and a visible hint of `AutomationSequence` at 375 and 1280 px.

- [ ] **Step 5: Run the landing test and typecheck**

```bash
pnpm exec vitest run src/test/landing-invisible-ledger.test.ts src/test/design-system-v3.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 6: Verify landing interactions**

In a real browser at 375, 768, and 1280 px:

- Open and close the mobile menu.
- Activate both hero CTAs.
- Confirm `Ver como funciona` reaches the automation scene.
- Confirm `Organizar o meu mês` reaches `/auth`.
- Emulate reduced motion and verify scenes are immediately visible.
- Check the console for errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing src/components/LandingHeader.tsx src/components/Logo.tsx src/pages/Index.tsx src/test/landing-invisible-ledger.test.ts
git commit -m "feat: tell the invisible ledger landing story"
```

---

### Task 6: Restyle Authentication, OAuth, And Invitation Entry

**Files:**
- Modify: `src/pages/Auth.tsx`
- Modify: `src/pages/OAuthConsent.tsx`
- Modify: `src/pages/AcceptInvitation.tsx`
- Modify: `src/components/InputField.tsx`
- Modify: `src/components/SocialLoginButton.tsx`
- Create: `src/test/entry-design.test.ts`

**Interfaces:**
- Consumes: existing auth handlers, `InputField` props, and Supabase/Lovable clients.
- Produces: visually unified login, signup mode, OAuth consent, and invitation surfaces with unchanged behavior.

- [ ] **Step 1: Write the failing preservation test**

Create `src/test/entry-design.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const auth = readFileSync(resolve(process.cwd(), "src/pages/Auth.tsx"), "utf8");

describe("Invisible Ledger entry flow", () => {
  it("keeps auth mechanics while applying the approved copy", () => {
    expect(auth).toContain("supabase.auth.signUp");
    expect(auth).toContain("supabase.auth.signInWithPassword");
    expect(auth).toContain('lovable.auth.signInWithOAuth("google"');
    expect(auth).toContain("Continua de onde paraste.");
    expect(auth).toContain("Privado por espaço financeiro");
  });
});
```

- [ ] **Step 2: Verify the test fails on copy only**

```bash
pnpm exec vitest run src/test/entry-design.test.ts
```

Expected: auth mechanics assertions pass; approved copy assertions fail.

- [ ] **Step 3: Recompose `Auth.tsx` without touching handlers**

Keep `handleSubmit`, `handleGoogle`, schemas, redirect calculation, session effect, state names, and mode toggle unchanged. Replace only returned JSX/classes with:

- Dark functional split layout on desktop.
- Compact brand header on mobile.
- Heading `Continua de onde paraste.` in login mode.
- Heading `Começa com o teu mês organizado.` in signup mode.
- Trust note `Privado por espaço financeiro.`
- Existing Google, email, password, submit, and mode-toggle controls.

- [ ] **Step 4: Apply the same entry surface to OAuth and invitations**

Keep authorization and invitation handlers unchanged. Use one un-nested `functional-panel`, concise heading, explicit permission/invitation text, primary action, and secondary refusal/back action.

- [ ] **Step 5: Run focused tests**

```bash
pnpm exec vitest run src/test/entry-design.test.ts src/test/spaces-invitations-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 6: Browser-check both auth modes**

At 375 and 1280 px, toggle login/signup without submitting. Verify fields stay at least 44 px tall, labels remain visible, password text does not overflow, and keyboard focus is visible.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Auth.tsx src/pages/OAuthConsent.tsx src/pages/AcceptInvitation.tsx src/components/InputField.tsx src/components/SocialLoginButton.tsx src/test/entry-design.test.ts
git commit -m "feat: redesign organizze entry surfaces"
```

---

### Task 7: Transform The Existing Onboarding Sequence

**Files:**
- Create: `src/components/onboarding/AutomationDiagram.tsx`
- Modify: `src/components/onboarding/OnboardingWizardLayout.tsx`
- Modify: `src/components/onboarding/SelectableCard.tsx`
- Modify: `src/pages/OnboardingNome.tsx`
- Modify: `src/pages/OnboardingIdioma.tsx`
- Modify: `src/pages/OnboardingMoeda.tsx`
- Modify: `src/pages/OnboardingWhatsApp.tsx`
- Modify: `src/pages/OnboardingWhatsAppVerificar.tsx`
- Modify: `src/lib/countries.ts`
- Modify: `src/test/whatsapp-onboarding-v2.test.ts`
- Create: `src/test/onboarding-invisible-ledger.test.ts`

**Interfaces:**
- Consumes: current localStorage keys, navigation paths, `create_whatsapp_link`, and verification polling.
- Produces: `AutomationDiagram` with no external state and a shared one-question-per-screen visual shell.

- [ ] **Step 1: Write failing route and behavior assertions**

Create `src/test/onboarding-invisible-ledger.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Invisible Ledger onboarding", () => {
  it("keeps the existing route transitions", () => {
    expect(read("src/pages/OnboardingNome.tsx")).toContain('/onboarding/idioma');
    expect(read("src/pages/OnboardingIdioma.tsx")).toContain('/onboarding/moeda');
    expect(read("src/pages/OnboardingMoeda.tsx")).toContain('/onboarding/whatsapp');
    expect(read("src/pages/OnboardingWhatsApp.tsx")).toContain('/onboarding/whatsapp/verificar');
  });

  it("presents WhatsApp as automation rather than chat", () => {
    const source = read("src/pages/OnboardingWhatsApp.tsx");
    expect(source).toContain("AutomationDiagram");
    expect(source).not.toContain("chat-bubble");
  });
});
```

- [ ] **Step 2: Verify only the new visual assertion fails**

```bash
pnpm exec vitest run src/test/onboarding-invisible-ledger.test.ts
```

Expected: route assertions pass and `AutomationDiagram` fails.

- [ ] **Step 3: Implement the shared onboarding shell**

Keep the current `OnboardingWizardLayout` callback props. Change its visual structure to:

- Stable top brand and segmented progress line.
- One heading and explanation region.
- One unframed content region.
- Footer with back, continue, and existing extra action.
- Enter-key continuation only where the existing page already permits submission.

- [ ] **Step 4: Implement `AutomationDiagram`**

Create a presentational component:

```tsx
type AutomationDiagramProps = {
  sourceLabel?: string;
  resultLabel?: string;
};
```

Render three semantic stages with Lucide icons: received via WhatsApp, interpreted by Organizze, categorized in the month. Do not render message bubbles or animated layout properties.

- [ ] **Step 5: Recompose each onboarding page**

- `OnboardingNome`: preserve `organizze.userName` and navigation; use one large name input.
- `OnboardingIdioma`: preserve options and localStorage; use compact selectable rows with language codes.
- `OnboardingMoeda`: preserve currency choices and localStorage; use code, name, and example amount.
- `OnboardingWhatsApp`: preserve membership lookup, RPC, verification payload, skip path, country validation, and phone storage; replace feature cards with `AutomationDiagram`.
- `OnboardingWhatsAppVerificar`: preserve polling, expiration, preferences RPC, localStorage, and redirect; restyle code and status states.

- [ ] **Step 6: Run onboarding and WhatsApp tests**

```bash
pnpm exec vitest run src/test/onboarding-invisible-ledger.test.ts src/test/whatsapp-onboarding-v2.test.ts src/test/dashboard-whatsapp-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 7: Browser-check all states**

At 375 and 768 px, inspect name, language, currency, WhatsApp, verification pending, expired, loading, and error states. Verify progress never shifts layout and all controls fit Portuguese labels.

- [ ] **Step 8: Commit**

```bash
git add src/components/onboarding src/pages/OnboardingNome.tsx src/pages/OnboardingIdioma.tsx src/pages/OnboardingMoeda.tsx src/pages/OnboardingWhatsApp.tsx src/pages/OnboardingWhatsAppVerificar.tsx src/lib/countries.ts src/test/onboarding-invisible-ledger.test.ts src/test/whatsapp-onboarding-v2.test.ts
git commit -m "feat: create focused invisible ledger onboarding"
```

---

### Task 8: Replace The Dashboard Shell Without Changing Routes

**Files:**
- Modify: `src/components/dashboard/DashboardLayout.tsx`
- Modify: `src/components/dashboard/DashboardNav.tsx`
- Modify: `src/components/dashboard/PageHeader.tsx`
- Modify: `src/components/dashboard/MonthSelector.tsx`
- Modify: `src/components/Logo.tsx`
- Modify: `src/test/dashboard-shell-v3.test.ts`

**Interfaces:**
- Consumes: current `primaryNavGroups`, `mobilePrimaryLinks`, account menu callbacks, and `Outlet`.
- Produces: dark functional desktop/sidebar, tablet drawer, mobile header, and five-item bottom navigation.

- [ ] **Step 1: Extend the shell test before styling**

Add to `src/test/dashboard-shell-v3.test.ts`:

```ts
it("keeps all destinations inside the dark functional shell", () => {
  expect(source).toContain("bg-sidebar");
  expect(source).toContain("Navegação principal");
  expect(source).toContain("Navegação móvel");
  expect(source).toContain("Abrir menu da conta");
  expect(source).toContain("restartTour");
});
```

- [ ] **Step 2: Run the shell test**

```bash
pnpm exec vitest run src/test/dashboard-shell-v3.test.ts
```

Expected: preservation assertions pass; any new surface assertion fails until classes are updated.

- [ ] **Step 3: Restyle `DashboardLayout`**

Preserve `useAuth`, `useFinancialContext`, `useSubscriptionV2`, sign-out, tour event, links, dropdown items, drawer behavior, and `<Outlet />`. Apply:

- 218–232 px matte sidebar on desktop.
- `100dvh`, one content scroll owner, and `min-h-0` grid children.
- Compact tablet/mobile header.
- Stable mobile bottom navigation.
- Blue active marker and neutral inactive labels.
- Carbon dropdowns/dialogs using existing Radix components.

- [ ] **Step 4: Restyle navigation and shared header controls**

Keep `primaryNavGroups` destinations and mobile link count unchanged. Ensure the mobile label `Registos` continues to route to `/dashboard/lancamentos`. Keep `MonthSelector` handlers and date logic unchanged.

- [ ] **Step 5: Run shell and auth tests**

```bash
pnpm exec vitest run src/test/dashboard-shell-v3.test.ts src/test/dashboard-v2.test.ts src/test/subscription-v2.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 6: Browser-check navigation**

At 375, 768, and 1280 px, navigate to every dashboard route, open/close the drawer, open the account menu, and confirm the main content is the only scroll owner.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/DashboardLayout.tsx src/components/dashboard/DashboardNav.tsx src/components/dashboard/PageHeader.tsx src/components/dashboard/MonthSelector.tsx src/components/Logo.tsx src/test/dashboard-shell-v3.test.ts
git commit -m "feat: install dark functional dashboard shell"
```

---

### Task 9: Recompose Dashboard Overview And Financial Pages

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/DashboardLancamentos.tsx`
- Modify: `src/pages/DashboardRelatorios.tsx`
- Modify: `src/pages/DashboardOrcamento.tsx`
- Modify: `src/pages/DashboardPlanos.tsx`
- Modify: `src/pages/DashboardLimiteGastos.tsx`
- Modify: `src/pages/DashboardObjetivos.tsx`
- Modify: `src/components/finance/BudgetEditor.tsx`
- Modify: `src/components/finance/TransactionDialog.tsx`
- Modify: `src/components/finance/TransactionFilters.tsx`
- Modify: `src/components/finance/PlanDialog.tsx`
- Modify: `src/components/finance/LimitDialog.tsx`
- Modify: `src/components/finance/GoalDialog.tsx`
- Modify: `src/test/dashboard-v2.test.ts`
- Modify: `src/test/transactions-v2.test.ts`
- Modify: `src/test/budgets-reports-v2.test.ts`
- Modify: `src/test/financial-controls-v2.test.ts`

**Interfaces:**
- Consumes: existing financial hooks, dialogs, filters, handlers, `DecisionPanel`, `MetricStrip`, and `FinancialRow`.
- Produces: approved dashboard reading order and consistent dark data surfaces.

- [ ] **Step 1: Add overview structure assertions**

Extend `src/test/dashboard-v2.test.ts`:

```ts
it("renders the approved monthly reading order", () => {
  const source = readFileSync(resolve(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");
  expect(source.indexOf("<PageHeader")).toBeLessThan(source.indexOf("<MetricStrip"));
  expect(source.indexOf("<MetricStrip")).toBeLessThan(source.indexOf("<DecisionPanel"));
  expect(source).toContain("Próxima decisão");
});
```

- [ ] **Step 2: Run the overview test and verify it fails**

```bash
pnpm exec vitest run src/test/dashboard-v2.test.ts
```

Expected: FAIL until `DecisionPanel` is used.

- [ ] **Step 3: Recompose `Dashboard.tsx` around existing values**

Do not change calculations or handlers. Render in this order:

1. `PageHeader` with current month and existing new-transaction action.
2. `MetricStrip` for available, expenses, income, and limits.
3. Spending rhythm chart and `DecisionPanel` side by side on desktop, stacked on mobile.
4. Recent transactions and category limits.
5. Existing plan controls and dialogs.

Use the existing computed values as props; do not duplicate calculations in visual components.

- [ ] **Step 4: Restyle transactions and reports**

- Keep all CRUD, filters, month navigation, chart datasets, tooltips, and empty states.
- Use one functional panel per actual filter/tool/data region.
- Tables remain tables on desktop and readable rows on mobile.
- Recharts colors use semantic tokens; add textual chart summaries where absent.

- [ ] **Step 5: Restyle budgets, plans, limits, and goals**

Keep all hook calls, form schemas, submit callbacks, and optimistic/refetch behavior. Replace visual wrappers only. Ensure dialogs use the same field order and labels.

- [ ] **Step 6: Run the financial suite**

```bash
pnpm exec vitest run src/test/dashboard-v2.test.ts src/test/transactions-v2.test.ts src/test/budgets-reports-v2.test.ts src/test/financial-controls-v2.test.ts src/test/finance-foundation.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 7: Exercise CRUD in the browser**

Using a safe test account or disposable records:

- Create, edit, and void a transaction.
- Change month filters.
- Create/edit a plan, limit, and goal.
- Open report tabs and tooltips.
- Verify the same database results and totals before and after the visual changes.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/DashboardLancamentos.tsx src/pages/DashboardRelatorios.tsx src/pages/DashboardOrcamento.tsx src/pages/DashboardPlanos.tsx src/pages/DashboardLimiteGastos.tsx src/pages/DashboardObjetivos.tsx src/components/finance src/test/dashboard-v2.test.ts src/test/transactions-v2.test.ts src/test/budgets-reports-v2.test.ts src/test/financial-controls-v2.test.ts
git commit -m "feat: unify invisible ledger financial views"
```

---

### Task 10: Restyle Shared Spaces, WhatsApp, Diagnostics, And Subscription

**Files:**
- Modify: `src/pages/DashboardGrupos.tsx`
- Modify: `src/pages/DashboardWhatsApp.tsx`
- Modify: `src/pages/DashboardDiagnosticoWhatsApp.tsx`
- Modify: `src/pages/DashboardAssinatura.tsx`
- Modify: `src/components/PaymentTestModeBanner.tsx`
- Modify: `src/components/StripeEmbeddedCheckout.tsx`
- Modify: `src/test/dashboard-whatsapp-v2.test.ts`
- Modify: `src/test/subscription-v2.test.ts`
- Modify: `src/test/new-user-trial.test.ts`
- Modify: `src/test/spaces-invitations-v2.test.ts`

**Interfaces:**
- Consumes: current group/invitation RPCs, WhatsApp connection and expense handlers, subscription hooks, and Stripe checkout.
- Produces: dark functional automation and commercial surfaces with unchanged access behavior.

- [ ] **Step 1: Add explicit preservation assertions**

In the relevant existing tests, assert that source still contains:

```ts
expect(whatsAppSource).toContain('.eq("linked_user_id", user.id)');
expect(whatsAppSource).toContain('.eq("status", "active")');
expect(whatsAppSource).toContain('source: "app"');
expect(subscriptionSource).toContain("capabilitiesForSubscription");
expect(subscriptionSource).toContain("PaymentTestModeBanner");
```

- [ ] **Step 2: Run the tests before styling**

```bash
pnpm exec vitest run src/test/dashboard-whatsapp-v2.test.ts src/test/subscription-v2.test.ts src/test/new-user-trial.test.ts src/test/spaces-invitations-v2.test.ts
```

Expected: PASS before visual edits.

- [ ] **Step 3: Restyle shared spaces**

Preserve invitation creation, acceptance, roles, owner/admin restrictions, and RPC calls. Present members and invitations as data rows with one primary action, not nested cards.

- [ ] **Step 4: Restyle WhatsApp without changing its mechanics**

Keep:

- Connection query using `linked_user_id` and `active`.
- Local verification fallback.
- Photo upload, Gemini analysis, manual text parsing, category creation, and transaction insertion.
- Currency, `created_by`, `source`, and Supabase V2 fields.
- Subscription gating and trial access.

Visually present connection state, automation capability, and latest processed items. Do not introduce a public landing-style chat simulation. Existing interactive testing bubbles may remain inside the authenticated testing tool, but must read as a diagnostic workspace rather than a fake messaging app.

- [ ] **Step 5: Restyle diagnostics and subscription**

Keep all polling, health data, checkout callbacks, test-mode behavior, Stripe components, and permanent entitlement logic. Use semantic status colors with text labels.

- [ ] **Step 6: Run the complete feature suite**

```bash
pnpm exec vitest run src/test/dashboard-whatsapp-v2.test.ts src/test/subscription-v2.test.ts src/test/new-user-trial.test.ts src/test/spaces-invitations-v2.test.ts src/test/whatsapp-v2-types.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 7: Browser-check protected states**

Inspect free, trial, paid, test-mode, disconnected, pending, active, expired, and error states using safe existing accounts or mocked local UI state. Do not modify production entitlements during visual QA.

- [ ] **Step 8: Commit**

```bash
git add src/pages/DashboardGrupos.tsx src/pages/DashboardWhatsApp.tsx src/pages/DashboardDiagnosticoWhatsApp.tsx src/pages/DashboardAssinatura.tsx src/components/PaymentTestModeBanner.tsx src/components/StripeEmbeddedCheckout.tsx src/test/dashboard-whatsapp-v2.test.ts src/test/subscription-v2.test.ts src/test/new-user-trial.test.ts src/test/spaces-invitations-v2.test.ts
git commit -m "feat: polish automation and subscription surfaces"
```

---

### Task 11: Complete Tours, Empty States, Errors, And Motion Details

**Files:**
- Modify: `src/components/tour/TourProvider.tsx`
- Modify: `src/components/dashboard/TourOverlay.tsx`
- Modify: `src/components/dashboard/EmptyState.tsx`
- Modify: `src/pages/NotFound.tsx`
- Modify: `src/components/ui/skeleton.tsx`
- Modify: `src/components/ui/toast.tsx`
- Modify: `src/components/ui/sonner.tsx`
- Test: `src/test/design-system-v3.test.ts`

**Interfaces:**
- Consumes: existing tour route sequence and completion localStorage keys.
- Produces: visually complete system states and reduced-motion-compatible feedback.

- [ ] **Step 1: Add state coverage assertions**

Append to `src/test/design-system-v3.test.ts`:

```ts
it("keeps loading static under reduced motion and errors actionable", () => {
  const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
  const empty = readFileSync(resolve(process.cwd(), "src/components/dashboard/EmptyState.tsx"), "utf8");
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(empty).toContain("action");
  expect(empty).toContain("description");
});
```

- [ ] **Step 2: Preserve tour mechanics while restyling overlays**

Keep `GLOBAL_TOUR_STEPS`, route navigation, target selectors, completion keys, previous/next behavior, and auto-start logic. Use a carbon panel, blue focus ring, readable progress, and non-pill controls.

- [ ] **Step 3: Complete empty, loading, error, success, and 404 states**

- Skeletons remain static muted placeholders.
- Empty states state what is absent and expose one recovery action.
- Toasts use semantic icon, title, description, and status color.
- 404 offers a clear route back to the product or landing.
- No emoji icons; use Lucide only.

- [ ] **Step 4: Run focused tests**

```bash
pnpm exec vitest run src/test/design-system-v3.test.ts src/test/dashboard-shell-v3.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: PASS.

- [ ] **Step 5: Drive state interactions in the browser**

Open/close the tour, move through steps, trigger a safe validation error, open a dialog, display an empty state, and emulate reduced motion. Verify focus restoration and no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/tour/TourProvider.tsx src/components/dashboard/TourOverlay.tsx src/components/dashboard/EmptyState.tsx src/pages/NotFound.tsx src/components/ui/skeleton.tsx src/components/ui/toast.tsx src/components/ui/sonner.tsx src/test/design-system-v3.test.ts
git commit -m "feat: finish invisible ledger interaction states"
```

---

### Task 12: Final Functional, Visual, Accessibility, And Performance Gate

**Files:**
- Modify: `DESIGN.md` only if measured debt differs from the approved contract
- Create: `docs/qa/2026-08-22-invisible-ledger-qa.md`

**Interfaces:**
- Consumes: all previous task deliverables.
- Produces: fresh verification evidence and a release-ready branch.

- [ ] **Step 1: Run the complete automated suite**

```bash
pnpm run test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run build
pnpm exec eslint src tailwind.config.ts vite.config.ts
git diff --check
```

Expected: all tests pass, TypeScript and build exit 0, ESLint has zero errors, and diff check prints nothing.

- [ ] **Step 2: Run React diagnostics**

```bash
pnpm exec react-doctor
```

Expected: no new actionable React errors. If the local Node version cannot run oxlint, record the exact version limitation in the QA document and rely on the explicit ESLint command already run.

- [ ] **Step 3: Perform real-browser route QA**

At 375, 768, and 1280 px, inspect:

```text
/
/auth
/onboarding/nome
/onboarding/idioma
/onboarding/moeda
/onboarding/whatsapp
/onboarding/whatsapp/verificar
/dashboard
/dashboard/lancamentos
/dashboard/relatorios
/dashboard/orcamento
/dashboard/planos
/dashboard/limite-de-gastos
/dashboard/objetivos
/dashboard/grupos
/dashboard/whatsapp
/dashboard/diagnostico-whatsapp
/dashboard/assinatura
```

For each route, record screenshot status, overflow status, keyboard focus status, reduced-motion status, and console errors in `docs/qa/2026-08-22-invisible-ledger-qa.md`.

- [ ] **Step 4: Exercise core workflows**

Record pass/fail evidence for:

- Login and signup-mode toggle.
- Name/language/currency onboarding navigation.
- WhatsApp skip and verification states.
- Dashboard navigation and account menu.
- Transaction create/edit/void.
- Budget, plan, limit, and goal dialogs.
- Reports and filters.
- Space invitation UI.
- WhatsApp connection and authenticated testing UI.
- Subscription and test-mode surfaces.

- [ ] **Step 5: Measure production performance**

Serve the production build:

```bash
pnpm run preview -- --host 127.0.0.1 --port 56800
```

Use real Playwright Chromium to audit mobile and desktop medians for the landing and dashboard. Record LCP, CLS, INP/TBT proxy, accessibility findings, bundle sizes, and whether GSAP remains landing-only. Do not remove approved content or motion merely to improve a score; fix loading boundaries and rendering causes.

- [ ] **Step 6: Review against the approved reference**

Compare fresh screenshots with the approved companion mockups and the Basedash reference for rhythm only. Confirm:

- Organizze content remains primary.
- WhatsApp is an origin, not a copied chat interface.
- Product screens are dark functional and readable.
- Blue is scarce and meaningful.
- There are no gradients, decorative blobs, nested cards, or ambient loops.

- [ ] **Step 7: Write the QA record**

Create `docs/qa/2026-08-22-invisible-ledger-qa.md` with:

```markdown
# Invisible Ledger QA

## Automated Verification
## Route Matrix
## Core Workflow Results
## Responsive Results
## Accessibility And Reduced Motion
## Performance Measurements
## Console And Network Errors
## Accepted Debt
## Final Decision
```

Every section contains measured values or explicit pass/fail results; do not use placeholders.

- [ ] **Step 8: Commit final evidence**

```bash
git add DESIGN.md docs/qa/2026-08-22-invisible-ledger-qa.md
git commit -m "docs: record invisible ledger verification"
```

- [ ] **Step 9: Review branch integration options**

Run:

```bash
git status --short
git log --oneline --decorate -15
```

Expected: clean worktree except the unrelated `omniroute/` directory, with one focused commit per completed task.
