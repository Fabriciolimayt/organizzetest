import { createElement } from "react";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DecisionPanel from "@/components/dashboard/DecisionPanel";
import EmptyState from "@/components/dashboard/EmptyState";
import TourOverlay from "@/components/dashboard/TourOverlay";
import { GLOBAL_TOUR_STEPS, TourProvider, useTour } from "@/components/tour/TourProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster as SonnerToaster, toast as sonnerToast } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import NotFound from "@/pages/NotFound";
import { describe, expect, it, vi } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const pageHeader = readFileSync(resolve(process.cwd(), "src/components/dashboard/PageHeader.tsx"), "utf8");
const metricStrip = readFileSync(resolve(process.cwd(), "src/components/dashboard/MetricStrip.tsx"), "utf8");
const financialRow = readFileSync(resolve(process.cwd(), "src/components/dashboard/FinancialRow.tsx"), "utf8");
const emptyState = readFileSync(resolve(process.cwd(), "src/components/dashboard/EmptyState.tsx"), "utf8");
const dashboardCard = readFileSync(resolve(process.cwd(), "src/components/dashboard/DashboardCard.tsx"), "utf8");
const decisionPanel = readFileSync(resolve(process.cwd(), "src/components/dashboard/DecisionPanel.tsx"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
const taskFiveMetadataSources = [
  "src/components/LandingHeader.tsx",
  ...readdirSync(resolve(process.cwd(), "src/components/landing"))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => `src/components/landing/${file}`),
  "src/pages/Index.tsx",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));
const tourProviderSource = readFileSync(resolve(process.cwd(), "src/components/tour/TourProvider.tsx"), "utf8");
const tourOverlaySource = readFileSync(resolve(process.cwd(), "src/components/dashboard/TourOverlay.tsx"), "utf8");
const sonnerBaseCss = readFileSync(resolve(process.cwd(), "node_modules/sonner/dist/styles.css"), "utf8");

const TourTestSurface = () => {
  const { start } = useTour();
  const location = useLocation();

  return createElement(
    "main",
    null,
    createElement("button", { id: "tour-launcher", type: "button", onClick: start }, "Iniciar tour"),
    createElement("output", { "data-testid": "tour-path" }, location.pathname),
    createElement("div", { "data-tour": "salario" }, "Rendimento"),
    createElement("div", { "data-tour": "orcamento" }, "Categorias"),
    createElement("div", { "data-tour": "despesas" }, "Despesas"),
    createElement("div", { "data-tour": "planos" }, "Planos"),
  );
};

const renderProductionTour = (initialEntry = "/dashboard") => render(
  createElement(
    MemoryRouter,
    {
      initialEntries: [initialEntry],
      future: { v7_startTransition: true, v7_relativeSplatPath: true },
    },
    createElement(
      TourProvider,
      null,
      createElement(
        Routes,
        null,
        createElement(Route, { path: "*", element: createElement(TourTestSurface) }),
      ),
    ),
  ),
);

describe("Organizze Invisible Ledger design system", () => {
  it("uses the approved dark functional tokens and financial typography", () => {
    expect(css).toContain("--void: var(--page-canvas)");
    expect(css).toContain("--intelligence: var(--brand-intelligence)");
    expect(css).toContain("font-variant-numeric: tabular-nums lining-nums");
    expect(css).toContain(".functional-panel");
  });

  it("binds every retained color alias directly to the approved palette", () => {
    const expectedAliases = {
      void: "page-canvas",
      background: "page-canvas",
      foreground: "text-primary",
      card: "surface-functional",
      "card-foreground": "text-primary",
      popover: "surface-functional",
      "popover-foreground": "text-primary",
      primary: "brand-intelligence",
      "primary-hover": "brand-intelligence",
      "primary-foreground": "page-canvas",
      secondary: "surface-raised",
      "secondary-foreground": "text-primary",
      muted: "surface-functional",
      "muted-foreground": "text-secondary",
      border: "hairline",
      input: "hairline",
      ring: "brand-intelligence",
      intelligence: "brand-intelligence",
      "intelligence-soft": "brand-intelligence",
      "financial-income": "status-income",
      "financial-expense": "status-expense",
      "financial-warning": "status-warning",
      "sidebar-background": "page-canvas",
      "sidebar-foreground": "text-primary",
      "sidebar-accent": "surface-raised",
      "sidebar-border": "hairline",
      accent: "surface-raised",
      "accent-foreground": "text-primary",
      destructive: "status-expense",
      "destructive-foreground": "text-primary",
      warning: "status-warning",
      "warning-foreground": "page-canvas",
      "success-wash": "status-income",
      "warning-wash": "status-warning",
      "data-blue": "brand-intelligence",
      "data-violet": "brand-intelligence",
      marker: "brand-intelligence",
      "ink-panel": "page-canvas",
      "sidebar-primary": "brand-intelligence",
      "sidebar-primary-foreground": "page-canvas",
      "sidebar-accent-foreground": "text-primary",
      "sidebar-ring": "brand-intelligence",
      "app-bg": "page-canvas",
    } as const;
    const declarations = new Map<string, string>();

    postcss.parse(css).walkRules(":root", (rule) => {
      rule.walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value);
      });
    });

    for (const [alias, foundation] of Object.entries(expectedAliases)) {
      const expectedValue =
        alias === "primary-hover"
          ? "var(--brand-intelligence) / 0.84"
          : `var(--${foundation})`;

      expect(declarations.get(`--${alias}`), alias).toBe(expectedValue);
    }

    expect(declarations.get("--primary-hover")).not.toBe(
      declarations.get("--primary"),
    );
  });

  it("keeps semantic Button variants with tactile motion treatments", () => {
    const defaultClasses = buttonVariants({ variant: "default" });
    const outlineClasses = buttonVariants({ variant: "outline" });
    const glassClasses = buttonVariants({ variant: "glass" });
    const gradientClasses = buttonVariants({ variant: "gradient" });
    const goldClasses = buttonVariants({ variant: "gold" });

    expect(defaultClasses).toContain("bg-primary");
    expect(defaultClasses).toContain("hover:bg-primary-hover");
    expect(outlineClasses).toContain("border-border");
    expect(glassClasses).toContain("bg-card");
    expect(gradientClasses).not.toContain("gradient");
    expect(goldClasses).toContain("bg-warning-wash");
  });

  it("renders skeletons as static muted loading placeholders", () => {
    const { container } = render(createElement(Skeleton));

    const skeleton = container.firstElementChild;
    expect(skeleton).not.toBeNull();
    expect(skeleton).toHaveClass("bg-muted", "opacity-60");
    expect(skeleton).not.toHaveClass("animate-pulse");
  });

  it("renders an actionable empty state with a semantic heading", () => {
    render(
      createElement(EmptyState, {
        message: "Ainda não existem movimentos.",
        description: "Regista a primeira despesa para começar.",
        action: createElement(Button, null, "Registar despesa"),
      }),
    );

    expect(screen.getByRole("heading", { level: 3, name: "Ainda não existem movimentos." })).toBeInTheDocument();
    expect(screen.getByText("Regista a primeira despesa para começar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registar despesa" })).toHaveClass("min-h-11");
  });

  it("returns unknown routes to the public landing page without logging a false error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      render(createElement(
        MemoryRouter,
        {
          initialEntries: ["/endereco-inexistente"],
          future: { v7_startTransition: true, v7_relativeSplatPath: true },
        },
        createElement(NotFound),
      ));
      expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalledWith(
        "404 Warning: User attempted to access non-existent route:",
        "/endereco-inexistente",
      );
    } finally {
      consoleError.mockRestore();
      consoleWarn.mockRestore();
    }
  });

  it("renders Sonner's close action with a 44px target and accessible label", async () => {
    const utilities = await postcss([
      tailwindcss({
        content: [{ raw: '<button class="size-11 !h-11 !w-11"></button>', extension: "html" }],
        corePlugins: { preflight: false },
      }),
    ]).process("@tailwind utilities;", { from: undefined });
    const style = document.createElement("style");
    style.textContent = `${sonnerBaseCss}\n${utilities.css}`;
    document.head.append(style);

    render(createElement(SonnerToaster, { duration: Infinity }));

    try {
      act(() => {
        sonnerToast.error("Não foi possível guardar");
      });

      const close = await screen.findByRole("button", { name: "Close toast" });
      expect(close).toHaveClass("size-11", "!h-11", "!w-11");
      expect(close).toHaveClass("inline-flex", "items-center", "justify-center");

      const computed = getComputedStyle(close);
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const toPixels = (value: string) => value.endsWith("rem")
        ? Number.parseFloat(value) * rootFontSize
        : Number.parseFloat(value);

      expect(toPixels(computed.height)).toBe(44);
      expect(toPixels(computed.width)).toBe(44);

      close.classList.remove("size-11", "!h-11", "!w-11");
      expect(getComputedStyle(close).height).toBe("20px");
      expect(getComputedStyle(close).width).toBe("20px");
    } finally {
      act(() => sonnerToast.dismiss());
      style.remove();
    }
  });

  it("announces toast status with semantic icons and readable content", () => {
    const { container } = render(
      createElement(
        ToastProvider,
        null,
        createElement(
          Toast,
          { open: true, variant: "destructive" },
          createElement(ToastTitle, null, "Não foi possível guardar"),
          createElement(ToastDescription, null, "Tenta novamente dentro de instantes."),
        ),
        createElement(ToastViewport),
      ),
    );

    expect(container.querySelector("[data-toast-status-icon]")).toHaveClass("text-financial-danger");
    expect(screen.getByText("Não foi possível guardar")).toBeInTheDocument();
    expect(screen.getByText("Tenta novamente dentro de instantes.")).toBeInTheDocument();
  });

  it("keeps the tour dialog named and its controls comfortably actionable", () => {
    render(
      createElement(TourOverlay, {
        open: true,
        onClose: vi.fn(),
        steps: [
          { title: "Visão geral", body: "Vê o essencial do mês." },
          { title: "Próxima decisão", body: "Sabe quanto ainda podes gastar." },
        ],
      }),
    );

    expect(screen.getByRole("dialog", { name: "Visão geral" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar tour" })).toHaveClass("size-11");
    expect(screen.getByRole("button", { name: "Anterior" })).toHaveClass("min-h-11");
    const next = screen.getByRole("button", { name: "Vamos lá" });
    expect(next).toHaveClass("min-h-11");

    fireEvent.click(next);
    expect(screen.getByRole("dialog", { name: "Próxima decisão" })).toBeInTheDocument();
  });

  it("traps forward and reverse focus inside the standalone tour", () => {
    render(
      createElement(TourOverlay, {
        open: true,
        onClose: vi.fn(),
        steps: [{ title: "Visão geral", body: "Vê o essencial do mês." }],
      }),
    );

    const close = screen.getByRole("button", { name: "Fechar tour" });
    const finish = screen.getByRole("button", { name: "Concluir" });

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(finish).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
  });

  it("starts the production tour, traps focus, and closes without marking completion", async () => {
    window.localStorage.clear();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });

    try {
      renderProductionTour();
      const launcher = screen.getByRole("button", { name: "Iniciar tour" });
      launcher.focus();
      fireEvent.click(launcher);

      const dialog = await screen.findByRole("dialog", { name: GLOBAL_TOUR_STEPS[0].title });
      const close = within(dialog).getByRole("button", { name: "Fechar tour" });
      const next = within(dialog).getByRole("button", { name: "Começar" });

      close.focus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(next).toHaveFocus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(close).toHaveFocus();

      fireEvent.click(close);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(window.localStorage.getItem("organizze.tourCompleted")).toBeNull();
      expect(launcher).toHaveFocus();
    } finally {
      window.localStorage.clear();
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    }
  });

  it("auto-starts for first-run users without changing the storage contract", async () => {
    window.localStorage.clear();
    window.localStorage.setItem("organizze.firstRun", "1");

    try {
      renderProductionTour();
      expect(await screen.findByRole("dialog", { name: GLOBAL_TOUR_STEPS[0].title }, { timeout: 1600 })).toBeInTheDocument();
      expect(window.localStorage.getItem("organizze.firstRun")).toBe("1");
      expect(window.localStorage.getItem("organizze.tourCompleted")).toBeNull();
    } finally {
      window.localStorage.clear();
    }
  });

  it("navigates the production steps and marks completion only on the last step", async () => {
    window.localStorage.clear();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });

    try {
      renderProductionTour();
      fireEvent.click(screen.getByRole("button", { name: "Iniciar tour" }));
      await screen.findByRole("dialog", { name: GLOBAL_TOUR_STEPS[0].title });

      for (let index = 1; index < GLOBAL_TOUR_STEPS.length; index += 1) {
        fireEvent.click(screen.getByRole("button", { name: index === 1 ? "Começar" : "Seguinte" }));
        await screen.findByRole("dialog", { name: GLOBAL_TOUR_STEPS[index].title }, { timeout: 3000 });
        expect(screen.getByTestId("tour-path")).toHaveTextContent(GLOBAL_TOUR_STEPS[index].route ?? "/dashboard");
        expect(window.localStorage.getItem("organizze.tourCompleted")).toBeNull();
      }

      fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
      await screen.findByRole("dialog", { name: GLOBAL_TOUR_STEPS.at(-2)?.title ?? "WhatsApp" }, { timeout: 3000 });
      expect(screen.getByTestId("tour-path")).toHaveTextContent(GLOBAL_TOUR_STEPS.at(-2)?.route ?? "/dashboard");

      fireEvent.click(screen.getByRole("button", { name: "Seguinte" }));
      await screen.findByRole("dialog", { name: GLOBAL_TOUR_STEPS.at(-1)?.title ?? "Ajuda sempre à mão" }, { timeout: 3000 });
      fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(window.localStorage.getItem("organizze.tourCompleted")).toBe("1");
      expect(window.localStorage.getItem("organizze.firstRun")).toBeNull();
    } finally {
      window.localStorage.clear();
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    }
  }, 15000);

  it("avoids layout-property transitions in both tour highlights", () => {
    expect(tourOverlaySource).not.toContain("transition-[top,left,width,height]");
    expect(tourProviderSource).not.toContain("transition-[top,left,width,height]");
  });

  it("avoids smooth target scrolling when reduced motion is preferred", () => {
    const target = document.createElement("div");
    target.dataset.tour = "reduced-motion-target";
    const scrollIntoView = vi.fn();
    Object.defineProperty(target, "scrollIntoView", { configurable: true, value: scrollIntoView });
    document.body.append(target);

    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    try {
      render(
        createElement(TourOverlay, {
          open: true,
          onClose: vi.fn(),
          steps: [{
            title: "Movimentos",
            body: "Consulta tudo num único lugar.",
            target: '[data-tour="reduced-motion-target"]',
          }],
        }),
      );
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
    } finally {
      target.remove();
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
    }
  });

  it("exposes a production diagnostics verification command", () => {
    expect(packageJson.scripts["verify:production-diagnostics"]).toBeDefined();
  });

  it("exposes reusable financial primitives with stable interfaces", () => {
    expect(pageHeader).toContain("title: string");
    expect(metricStrip).toContain("items: MetricItem[]");
    expect(financialRow).toContain("amount?: ReactNode");
    expect(emptyState).toContain("description");
    expect(dashboardCard).toContain("DashboardCard");
  });

  it("keeps DashboardCard item headings by default and supports page-level regions", () => {
    const { rerender } = render(
      createElement(DashboardCard, { title: "Movimento", children: createElement("p", null, "Conteúdo") }),
    );

    expect(screen.getByRole("heading", { level: 3, name: "Movimento" })).toBeInTheDocument();

    rerender(
      createElement(
        DashboardCard,
        { title: "Extrato", headingLevel: 2, children: createElement("p", null, "Conteúdo") },
      ),
    );

    expect(screen.getByRole("heading", { level: 2, name: "Extrato" })).toBeInTheDocument();
  });

  it("keeps shared secondary text AA-ready on card surfaces", () => {
    expect(metricStrip).not.toContain("text-muted-foreground/80");
    expect(financialRow).not.toContain("text-muted-foreground/80");
    expect(metricStrip).toContain("text-body-small text-muted-foreground");
    expect(financialRow).toContain("text-body-small text-muted-foreground");
  });

  it("uses the named 12px-or-larger metadata scale on the Task 5 landing", () => {
    taskFiveMetadataSources.forEach((source) => {
      expect(source).not.toMatch(/text-\[(?:9|10)px\]/);
    });
  });

  it("exposes the signature next-decision primitive", () => {
    expect(decisionPanel).toContain("type DecisionPanelProps");
    expect(decisionPanel).toContain('tone?: "intelligence" | "warning" | "neutral"');
    expect(decisionPanel).toContain("intelligence-panel");
  });

  it("renders named interactive primitives with 44px minimum targets", () => {
    const { container } = render(
      createElement(
        "div",
        null,
        createElement(Button, { size: "sm" }, "Ação compacta"),
        createElement(Input, { "aria-label": "Campo compacto" }),
        createElement(
          Select,
          { defaultValue: "principal" },
          createElement(SelectTrigger, { "aria-label": "Conta compacta" }, createElement(SelectValue)),
        ),
        createElement(
          Tabs,
          { defaultValue: "resumo" },
          createElement(TabsList, null, createElement(TabsTrigger, { value: "resumo" }, "Resumo")),
        ),
      ),
    );

    const primitives = within(container);
    const compactButton = primitives.getByRole("button", { name: "Ação compacta" });
    const compactInput = primitives.getByLabelText("Campo compacto");
    const compactSelect = primitives.getByRole("combobox", { name: "Conta compacta" });
    const compactTab = primitives.getByRole("tab", { name: "Resumo" });

    render(
      createElement(
        Dialog,
        { open: true },
        createElement(DialogContent, null, createElement(DialogTitle, null, "Limite mensal")),
      ),
    );

    const targetClasses = [
      compactButton.classList.contains("min-h-11"),
      compactInput.classList.contains("min-h-11"),
      compactSelect.classList.contains("min-h-11"),
      compactTab.classList.contains("min-h-11"),
      screen.getByRole("button", { name: "Fechar" }).classList.contains("size-11"),
    ];

    expect(targetClasses).toEqual([true, true, true, true, true]);
  });

  it("renders required decision content with the default intelligence tone", () => {
    const { container } = render(
      createElement(DecisionPanel, {
        eyebrow: "Próxima decisão",
        title: "Podes gastar 96 € em lazer.",
      }),
    );

    expect(screen.getByText("Próxima decisão")).toHaveClass("text-intelligence");
    expect(screen.getByRole("heading", { name: "Podes gastar 96 € em lazer.", level: 2 })).toBeInTheDocument();
    expect(container.querySelector("section")).toHaveClass("intelligence-panel");
    expect(container.querySelectorAll("section > p")).toHaveLength(1);
  });

  it("allows a lower decision heading level without changing the default", () => {
    const { rerender } = render(
      createElement(DecisionPanel, {
        eyebrow: "Próxima decisão",
        title: "Mantém o plano atual.",
      }),
    );

    expect(screen.getByRole("heading", { name: "Mantém o plano atual.", level: 2 })).toBeInTheDocument();

    rerender(
      createElement(DecisionPanel, {
        eyebrow: "Próxima decisão",
        title: "Mantém o plano atual.",
        headingLevel: 3,
      }),
    );

    expect(screen.getByRole("heading", { name: "Mantém o plano atual.", level: 3 })).toBeInTheDocument();
  });

  it("renders optional decision content with the warning tone", () => {
    const { container } = render(
      createElement(DecisionPanel, {
        eyebrow: "Atenção ao limite",
        title: "Restam 24 €.",
        description: "Mantém as próximas escolhas abaixo deste valor.",
        action: createElement(Button, null, "Rever despesas"),
        tone: "warning",
      }),
    );

    expect(screen.getByText("Atenção ao limite")).toHaveClass("text-financial-warning");
    expect(screen.getByText("Mantém as próximas escolhas abaixo deste valor.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rever despesas" })).toBeInTheDocument();
    expect(container.querySelector("section")).toHaveClass("border-financial-warning/45");
    expect(container.querySelector("section")).not.toHaveClass("intelligence-panel");
  });

  it("renders the neutral decision tone without an emphasized panel border", () => {
    const { container } = render(
      createElement(DecisionPanel, {
        eyebrow: "Contexto",
        title: "Sem alterações necessárias.",
        tone: "neutral",
      }),
    );

    expect(screen.getByText("Contexto")).toHaveClass("text-intelligence");
    expect(container.querySelector("section")).not.toHaveClass("intelligence-panel");
    expect(container.querySelector("section")).not.toHaveClass("border-financial-warning/45");
  });

  it("keeps loading static under reduced motion and errors actionable", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
    const empty = readFileSync(resolve(process.cwd(), "src/components/dashboard/EmptyState.tsx"), "utf8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(empty).toContain("action");
    expect(empty).toContain("description");
  });
});
