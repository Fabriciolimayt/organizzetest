import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import postcss from "postcss";
import { describe, expect, it, vi } from "vitest";
import DashboardRouteBoundary from "@/components/dashboard/DashboardRouteBoundary";
import MetricStrip from "@/components/dashboard/MetricStrip";
import PageHeader from "@/components/dashboard/PageHeader";
import FinancialRow from "@/components/dashboard/FinancialRow";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const css = read("src/product-edition.css");
const tokens = new Map<string, string>();
postcss.parse(css).walkRules(":root", rule => {
  rule.walkDecls(declaration => { tokens.set(declaration.prop, declaration.value); });
});

describe("Editorial product identity", () => {
  it("loads the application palette after legacy styles and covers portaled controls", () => {
    const entry = read("src/main.tsx");
    expect(entry.indexOf('import "./product-edition.css"')).toBeGreaterThan(entry.indexOf('import "./index.css"'));
    expect(tokens.get("--page-canvas")).toBe("180 10% 96%");
    expect(tokens.get("--surface-functional")).toBe("0 0% 100%");
    expect(tokens.get("--sidebar-background")).toBe("192 13% 8%");
    expect(tokens.get("--primary-foreground")).toBe("0 0% 100%");
    expect(css).toContain("color-scheme: light");
    expect(css).not.toMatch(/font-size:\s*[^;]*vw/);
  });

  it("keeps actions, title semantics and financial amounts unchanged", () => {
    render(<>
      <PageHeader title="Lançamentos" description="Movimentos do mês" actions={<button>Adicionar</button>} />
      <MetricStrip featured items={[
        { label: "Disponível", value: "-1 250,50 €", variant: "negative" },
        { label: "Receitas", value: "0,00 €", variant: "positive" },
      ]} />
      <FinancialRow title="Supermercado" amount="-42,90 €" amountTone="negative" />
    </>);
    expect(screen.getByRole("heading", { level: 1, name: "Lançamentos" })).toHaveClass("editorial-display");
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
    expect(screen.getByText("-1 250,50 €")).toHaveClass("text-financial-expense");
    expect(screen.getByText("-42,90 €")).toHaveAttribute("data-row-amount");
  });

  it("keeps motion and diagnostics out of the normal product experience", () => {
    expect(css).not.toMatch(/animation:|@keyframes|position:\s*fixed/);
    const entry = read("src/main.tsx");
    expect(entry).toContain("import.meta.env.DEV");
    expect(entry).toContain('has("diagnostics")');
  });

  it("loads financial pages inside the existing protected shell without bundling charts into login", () => {
    const app = read("src/App.tsx");
    for (const name of ["Dashboard", "DashboardRelatorios", "DashboardAssinatura"]) {
      expect(app).toContain(`const ${name} = lazy(() => import("./pages/${name}"))`);
      expect(app).not.toContain(`import ${name} from`);
    }
    expect(read("src/components/dashboard/DashboardLayout.tsx")).toContain('<Suspense fallback={<p role="status"');
  });

  it("contains page loading failures and recovers when navigating elsewhere", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const BrokenPage = () => { throw new Error("Synthetic chunk failure"); };
    try {
      const { rerender } = render(<>
        <nav aria-label="Finanças">Navegação disponível</nav>
        <DashboardRouteBoundary key="failed"><BrokenPage /></DashboardRouteBoundary>
      </>);
      expect(screen.getByRole("navigation", { name: "Finanças" })).toBeVisible();
      expect(screen.getByRole("alert")).toHaveTextContent("Esta página não carregou.");
      expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeEnabled();
      rerender(<DashboardRouteBoundary key="another-route"><h1>Objetivos</h1></DashboardRouteBoundary>);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Objetivos" })).toBeVisible();
    } finally {
      consoleError.mockRestore();
    }
  });
});
