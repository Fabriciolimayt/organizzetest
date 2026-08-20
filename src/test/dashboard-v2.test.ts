import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { categoryKeyFromV2Name, mapActiveDashboardExpenses, mapV2TransactionToExpense } from "@/lib/dashboard-v2";

describe("Dashboard app_v2 transactions", () => {
  it("uses the shared financial hierarchy", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");
    expect(source).toContain("<MetricStrip");
    expect(source).toContain("<PageHeader");
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
