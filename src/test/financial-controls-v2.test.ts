import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BudgetPlanInput, FinancialGoalInput, SpendingLimitInput } from "@/hooks/useFinancialControlsV2";

const testState = vi.hoisted(() => ({
  financial: {
    data: {
      spaceId: "space-1",
      userId: "user-1",
      currency: "EUR",
      locale: "pt-PT",
      timezone: "UTC",
      canWrite: true,
      categories: [{ id: "food", name: "Alimentação", kind: "expense", color: "#dc2626", icon: null }],
    },
    isLoading: false,
    error: null as Error | null,
  },
  plans: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  limits: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  spending: { data: {} as Record<string, number>, isLoading: false, error: null as Error | null },
  goals: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  activatePlan: vi.fn(),
  duplicatePlan: vi.fn(),
  deletePlan: vi.fn(),
  createLimit: vi.fn(),
  updateLimit: vi.fn(),
  deleteLimit: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/hooks/useFinancialContext", () => ({
  useFinancialContext: () => testState.financial,
}));

vi.mock("@/integrations/supabase/v2", () => ({
  supabaseV2: {},
}));

vi.mock("@/hooks/useFinancialControlsV2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useFinancialControlsV2")>();
  return {
    ...actual,
    useBudgetPlansV2: () => testState.plans,
    useCreateBudgetPlanV2: () => ({ mutateAsync: testState.createPlan, isPending: false }),
    useUpdateBudgetPlanV2: () => ({ mutateAsync: testState.updatePlan, isPending: false }),
    useActivateBudgetPlanV2: () => ({ mutate: testState.activatePlan, isPending: false }),
    useDuplicateBudgetPlanV2: () => ({ mutate: testState.duplicatePlan, isPending: false }),
    useDeleteBudgetPlanV2: () => ({ mutate: testState.deletePlan, isPending: false }),
    useSpendingLimitsV2: () => testState.limits,
    useLimitSpendingV2: () => testState.spending,
    useCreateSpendingLimitV2: () => ({ mutateAsync: testState.createLimit, isPending: false }),
    useUpdateSpendingLimitV2: () => ({ mutateAsync: testState.updateLimit, isPending: false }),
    useDeleteSpendingLimitV2: () => ({ mutate: testState.deleteLimit, isPending: false }),
    useFinancialGoalsV2: () => testState.goals,
    useCreateFinancialGoalV2: () => ({ mutateAsync: testState.createGoal, isPending: false }),
    useUpdateFinancialGoalV2: () => ({ mutateAsync: testState.updateGoal, isPending: false }),
    useDeleteFinancialGoalV2: () => ({ mutate: testState.deleteGoal, isPending: false }),
  };
});

vi.mock("@/hooks/useSubscriptionV2", () => ({
  useSubscriptionV2: () => ({
    data: { status: "active", current_period_end: "2099-12-31T00:00:00.000Z" },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: testState.toast }));

import {
  calculateGoalProgress,
  calculateLimitProgress,
  validateGoalInput,
  validateBudgetPlanInput,
  validateLimitInput,
  limitPeriodRange,
} from "@/hooks/useFinancialControlsV2";
import DashboardLimiteGastos from "@/pages/DashboardLimiteGastos";
import DashboardObjetivos from "@/pages/DashboardObjetivos";
import DashboardPlanos from "@/pages/DashboardPlanos";

const renderPage = (page: "plans" | "limits" | "goals") => {
  const Page = page === "plans" ? DashboardPlanos : page === "limits" ? DashboardLimiteGastos : DashboardObjetivos;
  return render(createElement(MemoryRouter, null, createElement(Page)));
};

const expectOrder = (...elements: HTMLElement[]) => {
  for (let index = 1; index < elements.length; index += 1) {
    expect(elements[index - 1].compareDocumentPosition(elements[index]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
};

type MutationCallbacks = {
  onSuccess?: () => void;
  onError?: (reason: unknown) => void;
};

const planFixture = () => ({
  id: "plan-1",
  space_id: "space-1",
  created_by: "user-1",
  name: "Plano base",
  expected_income: 2_000,
  period_start: "2026-08-01",
  period_end: "2026-08-31",
  currency: "EUR",
  is_active: false,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  allocations: [],
});

const limitFixture = () => ({
  id: "limit-1",
  space_id: "space-1",
  category_id: "food",
  amount: 100,
  currency: "EUR",
  period: "monthly",
  starts_on: "2026-08-01",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
});

const goalFixture = () => ({
  id: "goal-1",
  space_id: "space-1",
  created_by: "user-1",
  name: "Fundo de emergência",
  target_amount: 5_000,
  current_amount: 1_000,
  currency: "EUR",
  target_date: "2027-01-01",
  is_completed: false,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
});

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  testState.financial.data.canWrite = true;
  testState.financial.error = null;
  testState.plans.error = null;
  testState.limits.error = null;
  testState.goals.error = null;
  testState.plans.data = [planFixture()];
  testState.limits.data = [limitFixture()];
  testState.spending.data = { "limit-1": 80 };
  testState.goals.data = [goalFixture()];

  testState.updatePlan.mockImplementation(async ({ id, ...input }: { id: string } & BudgetPlanInput) => {
    testState.plans.data = testState.plans.data.map((plan) => plan.id === id ? {
      ...plan,
      name: input.name,
      expected_income: input.expectedIncome,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      currency: input.currency,
    } : plan);
  });
  testState.duplicatePlan.mockImplementation((_plan: unknown, callbacks?: MutationCallbacks) => callbacks?.onSuccess?.());
  testState.deletePlan.mockImplementation((id: string, callbacks?: MutationCallbacks) => {
    testState.plans.data = testState.plans.data.filter((plan) => plan.id !== id);
    callbacks?.onSuccess?.();
  });
  testState.updateLimit.mockImplementation(async ({ id, ...input }: { id: string } & SpendingLimitInput) => {
    testState.limits.data = testState.limits.data.map((limit) => limit.id === id ? {
      ...limit,
      category_id: input.categoryId,
      amount: input.amount,
      currency: input.currency,
      period: input.period,
      starts_on: input.startsOn,
    } : limit);
  });
  testState.deleteLimit.mockImplementation((id: string, callbacks?: MutationCallbacks) => {
    testState.limits.data = testState.limits.data.filter((limit) => limit.id !== id);
    callbacks?.onSuccess?.();
  });
  testState.updateGoal.mockImplementation(async ({ id, ...input }: { id: string } & FinancialGoalInput) => {
    testState.goals.data = testState.goals.data.map((goal) => goal.id === id ? {
      ...goal,
      name: input.name,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      currency: input.currency,
      target_date: input.targetDate,
    } : goal);
  });
  testState.deleteGoal.mockImplementation((id: string, callbacks?: MutationCallbacks) => {
    testState.goals.data = testState.goals.data.filter((goal) => goal.id !== id);
    callbacks?.onSuccess?.();
  });
});

describe("financial controls V2", () => {
  it("renders dense desktop tables with dedicated mobile rows", () => {
    for (const page of ["DashboardPlanos.tsx", "DashboardLimiteGastos.tsx", "DashboardObjetivos.tsx"]) {
      const source = readFileSync(resolve(process.cwd(), `src/pages/${page}`), "utf8");
      expect(source, page).toContain("<table");
      expect(source, page).toContain("md:block");
      expect(source, page).toContain("md:hidden");
    }
  });

  it("renders plan regions and both responsive action callback surfaces", () => {
    renderPage("plans");

    expect(screen.getByRole("heading", { level: 2, name: "Planos disponíveis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Plano base" })).toBeInTheDocument();

    const activateButtons = screen.getAllByRole("button", { name: "Ativar" });
    expect(activateButtons).toHaveLength(2);
    fireEvent.click(activateButtons[0]);
    fireEvent.click(activateButtons[1]);
    expect(testState.activatePlan).toHaveBeenCalledTimes(2);

    const duplicateButtons = screen.getAllByRole("button", { name: "Duplicar Plano base" });
    expect(duplicateButtons).toHaveLength(2);
    fireEvent.click(duplicateButtons[0]);
    fireEvent.click(duplicateButtons[1]);
    expect(testState.duplicatePlan).toHaveBeenCalledTimes(2);

    for (const button of screen.getAllByRole("button", { name: "Editar Plano base" })) {
      expect(button).toHaveClass("size-11");
      expect(button).not.toHaveClass("size-10");
    }
  });

  it("submits the plan dialog without changing its field order", async () => {
    renderPage("plans");
    fireEvent.click(screen.getByRole("button", { name: "Novo plano" }));

    const name = screen.getByLabelText("Nome");
    const income = screen.getByLabelText("Rendimento previsto (EUR)");
    const start = screen.getByLabelText("Início");
    const end = screen.getByLabelText("Fim");
    expectOrder(name, income, start, end);

    fireEvent.change(name, { target: { value: "Plano de setembro" } });
    fireEvent.change(income, { target: { value: "2500" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar plano" }));

    await waitFor(() => expect(testState.createPlan).toHaveBeenCalledWith(expect.objectContaining({
      name: "Plano de setembro",
      expectedIncome: 2_500,
      currency: "EUR",
    })));
  });

  it("edits a plan through both responsive callbacks and renders each result", async () => {
    renderPage("plans");

    fireEvent.click(screen.getAllByRole("button", { name: "Editar Plano base" })[0]);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Plano revisto" } });
    fireEvent.change(screen.getByLabelText("Rendimento previsto (EUR)"), { target: { value: "2400" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar plano" }));

    await waitFor(() => expect(screen.getAllByText("Plano revisto")).toHaveLength(2));
    expect(testState.updatePlan).toHaveBeenLastCalledWith(expect.objectContaining({
      id: "plan-1",
      name: "Plano revisto",
      expectedIncome: 2_400,
    }));

    fireEvent.click(screen.getAllByRole("button", { name: "Editar Plano revisto" })[1]);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Plano final" } });
    fireEvent.change(screen.getByLabelText("Rendimento previsto (EUR)"), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar plano" }));

    await waitFor(() => expect(screen.getAllByText("Plano final")).toHaveLength(2));
    expect(testState.updatePlan).toHaveBeenCalledTimes(2);
    expect(testState.plans.data[0]).toMatchObject({ name: "Plano final", expected_income: 3_000 });
  });

  it("deletes a plan through both responsive callbacks and renders the empty state", async () => {
    for (const copyIndex of [0, 1]) {
      testState.plans.data = [planFixture()];
      renderPage("plans");

      fireEvent.click(screen.getAllByRole("button", { name: "Eliminar Plano base" })[copyIndex]);
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

      await screen.findByText("Ainda não existe nenhum plano de orçamento neste espaço.");
      cleanup();
    }

    expect(testState.deletePlan).toHaveBeenCalledTimes(2);
    expect(testState.deletePlan.mock.calls.map(([id]) => id)).toEqual(["plan-1", "plan-1"]);
  });

  it("submits the limit dialog without changing its field order", async () => {
    renderPage("limits");
    expect(screen.getByRole("heading", { level: 2, name: "Limites ativos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Alimentação" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Novo limite" }));

    const category = screen.getByLabelText("Categoria");
    const amount = screen.getByLabelText("Limite (EUR)");
    const period = screen.getByLabelText("Periodicidade");
    const start = screen.getByLabelText("A partir de");
    expectOrder(category, amount, period, start);

    fireEvent.change(amount, { target: { value: "350" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar limite" }));

    await waitFor(() => expect(testState.createLimit).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: null,
      amount: 350,
      currency: "EUR",
    })));
  });

  it("edits a limit through both responsive callbacks and renders recalculated progress", async () => {
    renderPage("limits");

    fireEvent.click(screen.getAllByRole("button", { name: "Editar limite" })[0]);
    fireEvent.change(screen.getByLabelText("Limite (EUR)"), { target: { value: "125" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar limite" }));

    await waitFor(() => expect(screen.getAllByLabelText("64% do limite utilizado")).toHaveLength(2));
    expect(testState.updateLimit).toHaveBeenLastCalledWith(expect.objectContaining({ id: "limit-1", amount: 125 }));

    fireEvent.click(screen.getAllByRole("button", { name: "Editar limite" })[1]);
    fireEvent.change(screen.getByLabelText("Limite (EUR)"), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar limite" }));

    await waitFor(() => expect(screen.getAllByLabelText("40% do limite utilizado")).toHaveLength(2));
    expect(testState.updateLimit).toHaveBeenCalledTimes(2);
    expect(testState.limits.data[0]).toMatchObject({ amount: 200 });
  });

  it("deletes a limit through both responsive callbacks and renders the empty state", async () => {
    for (const copyIndex of [0, 1]) {
      testState.limits.data = [limitFixture()];
      renderPage("limits");

      fireEvent.click(screen.getAllByRole("button", { name: "Eliminar limite" })[copyIndex]);
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

      await screen.findByText("Ainda não definiste limites de gastos.");
      cleanup();
    }

    expect(testState.deleteLimit).toHaveBeenCalledTimes(2);
    expect(testState.deleteLimit.mock.calls.map(([id]) => id)).toEqual(["limit-1", "limit-1"]);
  });

  it("submits the goal dialog without changing its field order", async () => {
    renderPage("goals");
    expect(screen.getByRole("heading", { level: 2, name: "Objetivos ativos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Fundo de emergência" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Novo objetivo" }));

    const name = screen.getByLabelText("Objetivo");
    const target = screen.getByLabelText("Valor alvo (EUR)");
    const current = screen.getByLabelText("Progresso atual (EUR)");
    const date = screen.getByLabelText("Data alvo (opcional)");
    expectOrder(name, target, current, date);

    fireEvent.change(name, { target: { value: "Entrada da casa" } });
    fireEvent.change(target, { target: { value: "30000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar objetivo" }));

    await waitFor(() => expect(testState.createGoal).toHaveBeenCalledWith(expect.objectContaining({
      name: "Entrada da casa",
      targetAmount: 30_000,
      currency: "EUR",
    })));
  });

  it("edits a goal through both responsive callbacks and renders recalculated progress", async () => {
    renderPage("goals");

    fireEvent.click(screen.getAllByRole("button", { name: "Editar Fundo de emergência" })[0]);
    fireEvent.change(screen.getByLabelText("Objetivo"), { target: { value: "Reserva revista" } });
    fireEvent.change(screen.getByLabelText("Progresso atual (EUR)"), { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar objetivo" }));

    await waitFor(() => expect(screen.getAllByRole("progressbar", { name: "Reserva revista: 40% concluído" })).toHaveLength(2));
    expect(testState.updateGoal).toHaveBeenLastCalledWith(expect.objectContaining({
      id: "goal-1",
      name: "Reserva revista",
      currentAmount: 2_000,
    }));

    fireEvent.click(screen.getAllByRole("button", { name: "Editar Reserva revista" })[1]);
    fireEvent.change(screen.getByLabelText("Objetivo"), { target: { value: "Reserva final" } });
    fireEvent.change(screen.getByLabelText("Progresso atual (EUR)"), { target: { value: "2500" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar objetivo" }));

    await waitFor(() => expect(screen.getAllByRole("progressbar", { name: "Reserva final: 50% concluído" })).toHaveLength(2));
    expect(testState.updateGoal).toHaveBeenCalledTimes(2);
    expect(testState.goals.data[0]).toMatchObject({ name: "Reserva final", current_amount: 2_500 });
  });

  it("deletes a goal through both responsive callbacks and renders the empty state", async () => {
    for (const copyIndex of [0, 1]) {
      testState.goals.data = [goalFixture()];
      renderPage("goals");

      fireEvent.click(screen.getAllByRole("button", { name: "Eliminar Fundo de emergência" })[copyIndex]);
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

      await screen.findByText("Ainda não definiste nenhum objetivo financeiro.");
      cleanup();
    }

    expect(testState.deleteGoal).toHaveBeenCalledTimes(2);
    expect(testState.deleteGoal.mock.calls.map(([id]) => id)).toEqual(["goal-1", "goal-1"]);
  });

  it("renders permission and retry states through the mocked controls", () => {
    testState.financial.data.canWrite = false;
    renderPage("plans");
    expect(screen.getByRole("button", { name: "Novo plano" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Editar Plano base" }).every((button) => button.hasAttribute("disabled"))).toBe(true);

    cleanup();
    testState.financial.data.canWrite = true;
    testState.plans.error = new Error("offline");
    renderPage("plans");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(testState.plans.refetch).toHaveBeenCalledTimes(1);
  });

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
