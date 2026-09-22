import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  deleteTransaction: vi.fn(),
  toast: vi.fn(),
  financial: {
    data: {
      currency: "EUR",
      locale: "pt-PT",
      timezone: "UTC",
      canWrite: true,
      categories: [{ id: "subscriptions", name: "Subscrições", transaction_type: "expense", color: null }],
    },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  budget: {
    data: {
      id: "budget-1",
      name: "Plano mensal",
      expected_income: 1_000,
      allocations: [{ category_id: "subscriptions", percentage: 10 }],
    },
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  transactions: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => testState.financial,
}));

vi.mock("@/hooks/useBudgetsV2", () => ({
  useBudgetPlanV2: () => testState.budget,
}));

vi.mock("@/hooks/useTransactionsV2", () => ({
  useTransactionsV2: () => testState.transactions,
  useDeleteTransactionV2: () => ({ mutateAsync: testState.deleteTransaction, isPending: false }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: testState.toast }));

vi.mock("recharts", async () => {
  const { createElement, Fragment } = await import("react");
  const Container = ({ children }: { children?: React.ReactNode }) => createElement("div", null, children);
  const Empty = () => createElement(Fragment);
  return {
    Bar: Empty,
    BarChart: Container,
    CartesianGrid: Empty,
    ResponsiveContainer: Container,
    Tooltip: Empty,
    XAxis: Empty,
    YAxis: Empty,
  };
});

import Dashboard from "@/pages/Dashboard";
import { categoryKeyFromV2Name, mapActiveDashboardExpenses, mapV2TransactionToExpense } from "@/lib/dashboard-v2";

const renderDashboard = () => render(createElement(MemoryRouter, null, createElement(Dashboard)));

describe("Dashboard app_v2 transactions", () => {
  beforeEach(() => {
    localStorage.clear();
    testState.deleteTransaction.mockReset();
    testState.deleteTransaction.mockResolvedValue(undefined);
    testState.toast.mockReset();
    testState.financial.error = null;
    testState.budget.error = null;
    testState.transactions.error = null;
    testState.transactions.data = Array.from({ length: 7 }, (_, index) => ({
      id: `transaction-${index + 1}`,
      amount: index + 1,
      description: `Subscrição ${index + 1}`,
      merchant: null,
      category_id: "subscriptions",
      occurred_at: `2026-08-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      status: "cleared",
    }));
  });

  afterEach(() => cleanup());

  it("uses the shared financial hierarchy", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");
    expect(source).toContain("<MetricStrip");
    expect(source).toContain("<PageHeader");
  });

  it("renders the approved monthly reading order", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");
    expect(source.indexOf("<PageHeader")).toBeLessThan(source.indexOf("<MetricStrip"));
    expect(source.indexOf("<MetricStrip")).toBeLessThan(source.indexOf("<DecisionPanel"));
    expect(source).toContain("Próxima decisão");
  });

  it("renders every filtered expense and keeps the last delete callback reachable", async () => {
    renderDashboard();

    expect(screen.getByText("7 lançamentos")).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole("button", { name: /^Eliminar Subscrição/ });
    expect(deleteButtons).toHaveLength(7);

    fireEvent.click(deleteButtons[6]);
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(testState.deleteTransaction).toHaveBeenCalledWith("transaction-7"));
  });

  it("maps WhatsApp expenses into the dashboard model", () => {
    const expense = mapV2TransactionToExpense({
      id: "transaction-1",
      amount: 12.5,
      description: "almoço",
      merchant: null,
      category_id: "category-1",
      occurred_at: "2026-08-20T09:32:13.000Z",
    }, new Map([["category-1", "Alimentação"]]));

    expect(expense).toEqual({
      id: "transaction-1",
      name: "almoço",
      amount: 12.5,
      category: "necessidades",
      fixed: false,
      date: "2026-08-20T09:32:13.000Z",
    });
  });

  it("maps known financial categories and uses necessities as a safe fallback", () => {
    expect(categoryKeyFromV2Name("Subscrições")).toBe("subscricoes");
    expect(categoryKeyFromV2Name("Lazer & Entretenimento")).toBe("lazer");
    expect(categoryKeyFromV2Name("Investimentos")).toBe("investimentos");
    expect(categoryKeyFromV2Name("Categoria nova")).toBe("necessidades");
  });

  it("excludes void transactions from dashboard totals", () => {
    const base = {
      id: "transaction-1",
      amount: 12.5,
      description: "Almoço",
      merchant: null,
      category_id: null,
      occurred_at: "2026-08-20T09:32:13.000Z",
      status: "cleared" as const,
    };
    expect(mapActiveDashboardExpenses([base, { ...base, id: "void-1", status: "void" as const }], new Map()).map((item) => item.id)).toEqual(["transaction-1"]);
  });
});
