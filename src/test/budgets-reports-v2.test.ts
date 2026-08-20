import { describe, expect, it } from "vitest";

import { periodDates, validateAllocations } from "@/hooks/useBudgetsV2";
import { compareMonthlySummaries, summarizeTransactions } from "@/lib/finance/reports";

describe("V2 budgets and reports", () => {
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
