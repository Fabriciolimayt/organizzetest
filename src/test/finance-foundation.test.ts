import { describe, expect, it } from "vitest";

import { summarizeTransactions } from "@/lib/finance/reports";
import { calendarDateToUtcPreservingInstant, monthRange, shiftMonth } from "@/lib/finance/month";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/finance/money";
import { selectPreferredMembership } from "@/hooks/useFinancialContext";
import { financeQueryKeys } from "@/hooks/finance-query-keys";

describe("financial V2 foundation", () => {
  it("uses the space timezone for month boundaries, including daylight saving time", () => {
    expect(monthRange(new Date("2026-08-20T12:00:00Z"), "Europe/Lisbon")).toEqual({
      start: "2026-07-31T23:00:00.000Z",
      endExclusive: "2026-08-31T23:00:00.000Z",
      key: "2026-08",
      year: 2026,
      month: 8,
    });

    expect(monthRange(new Date("2026-01-20T12:00:00Z"), "Europe/Lisbon")).toMatchObject({
      start: "2026-01-01T00:00:00.000Z",
      endExclusive: "2026-02-01T00:00:00.000Z",
    });
    expect(monthRange(new Date("2026-03-15T12:00:00Z"), "Europe/Lisbon")).toMatchObject({
      start: "2026-03-01T00:00:00.000Z",
      endExclusive: "2026-03-31T23:00:00.000Z",
    });
    expect(monthRange(new Date("2026-10-15T12:00:00Z"), "Europe/Lisbon")).toMatchObject({
      start: "2026-09-30T23:00:00.000Z",
      endExclusive: "2026-11-01T00:00:00.000Z",
    });
  });

  it("moves between calendar months without drifting at year boundaries", () => {
    const december = new Date("2026-12-15T12:00:00Z");
    expect(monthRange(shiftMonth(december, 1, "Europe/Lisbon"), "Europe/Lisbon").key).toBe("2027-01");
    expect(monthRange(shiftMonth(december, -12, "Europe/Lisbon"), "Europe/Lisbon").key).toBe("2025-12");
  });

  it("parses localized currency without confusing grouping and decimal separators", () => {
    expect(parseCurrencyInput("1.234,56", "pt-PT")).toBe(1234.56);
    expect(parseCurrencyInput("1,234.56", "en-US")).toBe(1234.56);
    expect(Number.isNaN(parseCurrencyInput("abc", "pt-PT"))).toBe(true);
    expect(parseCurrencyInput("−12,50", "pt-PT")).toBe(-12.5);
    expect(formatCurrency(1234.5, "EUR", "pt-PT")).toContain("1 234,50");
    expect(formatCurrencyInput(1234.56, "pt-PT")).toBe("1234,56");
    expect(formatCurrencyInput(1234.56, "en-US")).toBe("1234.56");
  });

  it("preserves the original instant when an edit keeps the same calendar date", () => {
    const original = "2026-08-20T07:43:21.000Z";
    expect(calendarDateToUtcPreservingInstant("2026-08-20", "Europe/Lisbon", original).toISOString()).toBe(original);
    expect(calendarDateToUtcPreservingInstant("2026-08-21", "Europe/Lisbon", original).toISOString()).toBe("2026-08-21T11:00:00.000Z");
  });

  it("summarizes positive transaction amounts by type and category", () => {
    const summary = summarizeTransactions([
      { transaction_type: "income", amount: 2000, category_id: null },
      { transaction_type: "expense", amount: 45, category_id: "food" },
      { transaction_type: "expense", amount: 17.5, category_id: "food" },
      { transaction_type: "transfer", amount: 300, category_id: null },
      { transaction_type: "expense", amount: 999, category_id: "food", status: "void" },
    ], new Map([["food", "Alimentação"]]));

    expect(summary).toEqual({
      income: 2000,
      expenses: 62.5,
      balance: 1937.5,
      savingsRate: 96.875,
      categoryTotals: { Alimentação: 62.5 },
    });
  });

  it("rounds monetary aggregation to the schema's two decimal places", () => {
    const summary = summarizeTransactions([
      { transaction_type: "income", amount: 0.3, category_id: null },
      { transaction_type: "expense", amount: 0.1, category_id: "food" },
      { transaction_type: "expense", amount: 0.2, category_id: "food" },
    ], new Map([["food", "Alimentação"]]));

    expect(summary.expenses).toBe(0.3);
    expect(summary.balance).toBe(0);
    expect(summary.categoryTotals.Alimentação).toBe(0.3);

    const negative = summarizeTransactions([
      { transaction_type: "income", amount: 0.1, category_id: null },
      { transaction_type: "expense", amount: 0.3, category_id: "food" },
    ], new Map([["food", "Alimentação"]]));
    expect(negative.balance).toBe(-0.2);
  });

  it("respects an available selection and otherwise prioritizes writable roles", () => {
    const memberships = [
      { space_id: "viewer-space", role: "viewer" as const },
      { space_id: "member-space", role: "member" as const },
      { space_id: "owner-space", role: "owner" as const },
    ];

    expect(selectPreferredMembership(memberships, "viewer-space")?.space_id).toBe("viewer-space");
    expect(selectPreferredMembership(memberships, "missing")?.space_id).toBe("owner-space");
    expect(selectPreferredMembership([
      { space_id: "z-space", role: "owner" },
      { space_id: "a-space", role: "owner" },
    ])?.space_id).toBe("a-space");
  });

  it("uses exact period bounds in list query keys while preserving a space root", () => {
    const bounds = { start: "2026-07-31T23:00:00.000Z", endExclusive: "2026-08-31T23:00:00.000Z" };
    expect(financeQueryKeys.transactions("space-1")).toEqual(["finance-v2", "transactions", "space-1"]);
    expect(financeQueryKeys.transactions("space-1", "2026-08", bounds)).toEqual([
      "finance-v2", "transactions", "space-1", "2026-08", bounds,
    ]);
  });
});
