import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => ({}),
}));

vi.mock("@/integrations/supabase/v2", () => ({
  supabaseV2: {},
}));

import {
  calculateGoalProgress,
  calculateLimitProgress,
  validateGoalInput,
  validateBudgetPlanInput,
  validateLimitInput,
  limitPeriodRange,
} from "@/hooks/useFinancialControlsV2";

describe("financial controls V2", () => {
  it("marks a limit at eighty percent as a warning", () => {
    expect(calculateLimitProgress(80, 100)).toEqual({ percentage: 80, state: "warning" });
  });

  it("marks a limit above its amount as exceeded", () => {
    expect(calculateLimitProgress(120, 100)).toEqual({ percentage: 120, state: "exceeded" });
  });

  it("keeps a lower limit usage safe", () => {
    expect(calculateLimitProgress(79.99, 100)).toEqual({ percentage: 79.99, state: "safe" });
  });

  it("clamps goal progress between zero and one hundred", () => {
    expect(calculateGoalProgress(-50, 1_000)).toBe(0);
    expect(calculateGoalProgress(500, 1_000)).toBe(50);
    expect(calculateGoalProgress(1_500, 1_000)).toBe(100);
  });

  it("rejects non-positive limit amounts and mismatched currencies", () => {
    expect(validateLimitInput({ amount: 0, currency: "EUR" }, "EUR")).toBe("Indica um limite superior a zero.");
    expect(validateLimitInput({ amount: 100, currency: "USD" }, "EUR")).toBe("A moeda deve corresponder ao espaço financeiro ativo.");
  });

  it("rejects invalid goal amounts and accepts the active space currency", () => {
    expect(validateGoalInput({ targetAmount: 0, currentAmount: 0, currency: "EUR" }, "EUR")).toBe("Indica um objetivo superior a zero.");
    expect(validateGoalInput({ targetAmount: 1_000, currentAmount: 100, currency: "EUR" }, "EUR")).toBeNull();
  });

  it("validates plan money and ISO calendar dates", () => {
    expect(validateBudgetPlanInput({ name: "Plano", expectedIncome: Number.NaN, periodStart: "2026-08-01", periodEnd: "2026-08-31", currency: "EUR" }, "EUR")).toContain("rendimento");
    expect(validateBudgetPlanInput({ name: "Plano", expectedIncome: 1000, periodStart: "", periodEnd: "2026-08-31", currency: "EUR" }, "EUR")).toContain("datas");
    expect(validateBudgetPlanInput({ name: "Plano", expectedIncome: 1000, periodStart: "2026-09-01", periodEnd: "2026-08-31", currency: "EUR" }, "EUR")).toContain("final");
  });

  it("builds timezone-aware, half-open limit periods", () => {
    expect(limitPeriodRange("daily", "2020-01-01", new Date("2026-08-20T12:00:00Z"), "Europe/Lisbon")).toEqual({
      start: "2026-08-19T23:00:00.000Z",
      endExclusive: "2026-08-20T23:00:00.000Z",
      key: "daily:2026-08-20:Europe/Lisbon",
    });
    expect(limitPeriodRange("monthly", "2026-08-15", new Date("2026-08-20T12:00:00Z"), "Europe/Lisbon").start).toBe("2026-08-14T23:00:00.000Z");
  });
});
