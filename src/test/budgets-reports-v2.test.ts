import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  currentKey: new Date().toISOString().slice(0, 7),
  financial: {
    data: {
      currency: "EUR",
      locale: "pt-PT",
      timezone: "UTC",
      canWrite: true,
      categories: [
        { id: "food", name: "Alimentação", transaction_type: "expense", color: "#69D7FF" },
        { id: "travel", name: "Transportes", transaction_type: "expense", color: "#F4C56A" },
      ],
    },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  current: { data: [] as Array<Record<string, unknown>>, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  previous: { data: [] as Array<Record<string, unknown>>, isLoading: false, error: null as Error | null, refetch: vi.fn() },
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => testState.financial,
}));

vi.mock("@/hooks/useTransactionsV2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useTransactionsV2")>();
  return {
    ...actual,
    useTransactionsV2: (range: { key: string }) => range.key === testState.currentKey ? testState.current : testState.previous,
  };
});

vi.mock("recharts", async () => {
  const { createElement, Fragment } = await import("react");
  const Container = ({ children }: { children?: React.ReactNode }) => createElement("div", null, children);
  const Empty = () => createElement(Fragment);
  const TestTooltip = ({ formatter }: { formatter?: (value: number) => React.ReactNode }) => createElement(
    "output",
    { role: "tooltip", "aria-label": "Valor monetário formatado" },
    formatter?.(1_234.5),
  );
  return {
    Bar: Empty,
    BarChart: Container,
    CartesianGrid: Empty,
    Cell: Empty,
    Pie: Container,
    PieChart: Container,
    ResponsiveContainer: Container,
    Tooltip: TestTooltip,
    XAxis: Empty,
    YAxis: Empty,
  };
});

import BudgetEditor from "@/components/finance/BudgetEditor";
import { periodDates, validateAllocations } from "@/hooks/useBudgetsV2";
import { compareMonthlySummaries, summarizeTransactions } from "@/lib/finance/reports";
import DashboardRelatorios from "@/pages/DashboardRelatorios";

describe("V2 budgets and reports", () => {
  beforeEach(() => {
    testState.current.data = [
      { id: "income", transaction_type: "income", amount: 2_000, category_id: null, status: "cleared", occurred_at: `${testState.currentKey}-01T12:00:00.000Z` },
      { id: "food", transaction_type: "expense", amount: 500, category_id: "food", status: "cleared", occurred_at: `${testState.currentKey}-02T12:00:00.000Z` },
      { id: "travel", transaction_type: "expense", amount: 300, category_id: "travel", status: "cleared", occurred_at: `${testState.currentKey}-03T12:00:00.000Z` },
    ];
    testState.previous.data = [];
    testState.financial.error = null;
    testState.current.error = null;
    testState.previous.error = null;
  });

  afterEach(() => cleanup());

  it("provides textual summaries for both financial charts", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/DashboardRelatorios.tsx"), "utf8");
    expect(source).toContain('id="category-chart-summary"');
    expect(source).toContain('aria-describedby="category-chart-summary"');
    expect(source).toContain('id="flow-chart-summary"');
    expect(source).toContain('aria-describedby="flow-chart-summary"');
  });

  it("keeps the budget summary in a labelled operational region", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/DashboardOrcamento.tsx"), "utf8");
    expect(source).toContain('aria-label="Resumo do orçamento"');
  });

  it("renders chart summaries from the same current-month totals", async () => {
    render(createElement(MemoryRouter, null, createElement(DashboardRelatorios)));

    expect(screen.getByText(/2 categorias com despesas\. A maior é Alimentação/)).toHaveTextContent("500,00 €");
    expect(screen.getByText(/2 categorias com despesas\. A maior é Alimentação/)).toHaveTextContent("800,00 €");
    expect(screen.getByRole("tooltip", { name: "Valor monetário formatado" })).toHaveTextContent("1 234,50 €");

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Fluxo Diário (Entradas e Saídas)" }), { button: 0 });
    const flowSummary = await screen.findByText(/3 dias com movimentos/);
    expect(flowSummary).toHaveTextContent("2 000,00 €");
    expect(flowSummary).toHaveTextContent("800,00 €");
    expect(flowSummary).toHaveTextContent("1 200,00 €");
    expect(screen.getByRole("tooltip", { name: "Valor monetário formatado" })).toHaveTextContent("1 234,50 €");
  });

  it("renders visible and accessible budget threshold status from the existing branches", () => {
    render(createElement(BudgetEditor, {
      categories: [
        { id: "safe", name: "Seguro", color: null },
        { id: "warning", name: "Aviso", color: null },
        { id: "over", name: "Excedido", color: null },
      ],
      allocations: [
        { categoryId: "safe", percentage: 100 },
        { categoryId: "warning", percentage: 100 },
        { categoryId: "over", percentage: 100 },
      ],
      income: 100,
      spentByCategory: new Map([["safe", 50], ["warning", 80], ["over", 101]]),
      currency: "EUR",
      locale: "pt-PT",
      onChange: vi.fn(),
    }));

    expect(screen.getByText("Dentro do orçamento")).toBeInTheDocument();
    expect(screen.getByText("Próximo do limite")).toBeInTheDocument();
    expect(screen.getByText("Acima do orçamento")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Seguro: 50% utilizado, dentro do orçamento" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Aviso: 80% utilizado, próximo do limite" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Excedido: 100% utilizado, acima do orçamento" })).toBeInTheDocument();
  });

  it("distinguishes zero-allocation spending from an unused allocation", () => {
    render(createElement(BudgetEditor, {
      categories: [
        { id: "spent", name: "Sem verba", color: null },
        { id: "unused", name: "Não utilizado", color: null },
      ],
      allocations: [
        { categoryId: "spent", percentage: 0 },
        { categoryId: "unused", percentage: 0 },
      ],
      income: 100,
      spentByCategory: new Map([["spent", 50]]),
      currency: "EUR",
      locale: "pt-PT",
      onChange: vi.fn(),
    }));

    expect(screen.getByText("Acima do orçamento")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", {
      name: "Sem verba: 100% utilizado, acima do orçamento",
    })).toBeInTheDocument();
    expect(screen.getByText("Dentro do orçamento")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", {
      name: "Não utilizado: 0% utilizado, dentro do orçamento",
    })).toBeInTheDocument();
  });

  it("accepts a complete percentage plan and rejects incomplete or duplicated allocations", () => {
    expect(validateAllocations([
      { categoryId: "needs", percentage: 50 },
      { categoryId: "wants", percentage: 30 },
      { categoryId: "saving", percentage: 20 },
    ])).toEqual({ valid: true, total: 100, message: null });

    expect(validateAllocations([
      { categoryId: "needs", percentage: 60 },
      { categoryId: "wants", percentage: 30 },
    ])).toMatchObject({ valid: false, total: 90 });
    expect(validateAllocations([
      { categoryId: "needs", percentage: 50 },
      { categoryId: "needs", percentage: 50 },
    ]).valid).toBe(false);
  });

  it("derives inclusive database dates from a monthly range", () => {
    expect(periodDates({
      start: "2026-07-31T23:00:00.000Z",
      endExclusive: "2026-08-31T23:00:00.000Z",
      key: "2026-08",
      year: 2026,
      month: 8,
    })).toEqual({ start: "2026-08-01", end: "2026-08-31" });
  });

  it("compares current and previous months without dividing by zero", () => {
    const categories = new Map([["food", "Alimentação"]]);
    const current = summarizeTransactions([
      { transaction_type: "income", amount: 2000, category_id: null, status: "cleared" },
      { transaction_type: "expense", amount: 500, category_id: "food", status: "cleared" },
    ], categories);
    const previous = summarizeTransactions([
      { transaction_type: "expense", amount: 400, category_id: "food", status: "cleared" },
    ], categories);

    expect(compareMonthlySummaries(current, previous)).toEqual({
      expenseChangePercentage: 25,
      incomeChangePercentage: null,
      balanceChange: 1900,
    });
  });
});
