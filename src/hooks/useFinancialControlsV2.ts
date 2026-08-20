import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/hooks/finance-query-keys";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { supabaseV2, type V2Row } from "@/integrations/supabase/v2";
import { calendarDateBoundaryToUtc, calendarDateInTimeZone } from "@/lib/finance/month";

type BudgetPlan = V2Row<"budget_plans">;
type BudgetAllocation = V2Row<"budget_allocations">;
type SpendingLimit = V2Row<"spending_limits">;
type FinancialGoal = V2Row<"financial_goals">;

export type LimitProgressState = "safe" | "warning" | "exceeded";
export type RecurrencePeriod = "daily" | "weekly" | "monthly" | "yearly";

export type BudgetPlanWithAllocations = BudgetPlan & { allocations: BudgetAllocation[] };

export type BudgetPlanInput = {
  name: string;
  expectedIncome: number;
  periodStart: string;
  periodEnd: string;
  currency: string;
};

export type SpendingLimitInput = {
  categoryId: string | null;
  amount: number;
  currency: string;
  period: RecurrencePeriod;
  startsOn: string;
};

export type FinancialGoalInput = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
};

export function calculateLimitProgress(spent: number, limit: number) {
  const percentage = limit > 0 ? Number(((Math.max(0, spent) / limit) * 100).toFixed(2)) : 0;
  const state: LimitProgressState = percentage > 100 ? "exceeded" : percentage >= 80 ? "warning" : "safe";
  return { percentage, state };
}

export function calculateGoalProgress(current: number, target: number) {
  if (target <= 0) return 0;
  return Number(Math.min(100, Math.max(0, (current / target) * 100)).toFixed(2));
}

export function validateLimitInput(
  input: Pick<SpendingLimitInput, "amount" | "currency">,
  spaceCurrency: string,
) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "Indica um limite superior a zero.";
  if (input.currency.toUpperCase() !== spaceCurrency.toUpperCase()) {
    return "A moeda deve corresponder ao espaço financeiro ativo.";
  }
  return null;
}

export function validateGoalInput(
  input: Pick<FinancialGoalInput, "targetAmount" | "currentAmount" | "currency">,
  spaceCurrency: string,
) {
  if (!Number.isFinite(input.targetAmount) || input.targetAmount <= 0) {
    return "Indica um objetivo superior a zero.";
  }
  if (!Number.isFinite(input.currentAmount) || input.currentAmount < 0) {
    return "O progresso atual não pode ser negativo.";
  }
  if (input.currency.toUpperCase() !== spaceCurrency.toUpperCase()) {
    return "A moeda deve corresponder ao espaço financeiro ativo.";
  }
  return null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateBudgetPlanInput(input: BudgetPlanInput, spaceCurrency: string) {
  if (!input.name.trim()) return "Indica um nome para o plano.";
  if (!Number.isFinite(input.expectedIncome) || input.expectedIncome < 0) return "Indica um rendimento válido.";
  if (!ISO_DATE.test(input.periodStart) || !ISO_DATE.test(input.periodEnd)) return "Indica datas válidas para o plano.";
  if (input.periodEnd < input.periodStart) return "A data final deve ser posterior à data inicial.";
  if (input.currency.toUpperCase() !== spaceCurrency.toUpperCase()) return "A moeda deve corresponder ao espaço financeiro ativo.";
  return null;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addUtcDays = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return isoDate(value);
};

export function limitPeriodRange(period: RecurrencePeriod, startsOn: string, now: Date, timeZone: string) {
  const today = calendarDateInTimeZone(now, timeZone);
  const calendar = new Date(`${today}T12:00:00.000Z`);
  let periodStart = today;
  let periodEnd = addUtcDays(today, 1);
  if (period === "weekly") {
    periodStart = addUtcDays(today, -((calendar.getUTCDay() + 6) % 7));
    periodEnd = addUtcDays(periodStart, 7);
  } else if (period === "monthly") {
    periodStart = `${today.slice(0, 7)}-01`;
    const next = new Date(`${periodStart}T12:00:00.000Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    periodEnd = isoDate(next);
  } else if (period === "yearly") {
    periodStart = `${today.slice(0, 4)}-01-01`;
    periodEnd = `${Number(today.slice(0, 4)) + 1}-01-01`;
  }
  const effectiveStart = startsOn > periodStart ? startsOn : periodStart;
  return {
    start: calendarDateBoundaryToUtc(effectiveStart, timeZone).toISOString(),
    endExclusive: calendarDateBoundaryToUtc(periodEnd, timeZone).toISOString(),
    key: `${period}:${effectiveStart}:${timeZone}`,
  };
}

function assertWritableContext(context: ReturnType<typeof useFinancialContext>) {
  const data = context.data;
  if (!data?.canWrite) throw new Error("Não tens permissão para alterar este espaço financeiro.");
  return data;
}

async function invalidateFinancialData(queryClient: ReturnType<typeof useQueryClient>, spaceId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.transactions(spaceId) }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.dashboard(spaceId) }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.reports(spaceId) }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.budgets(spaceId) }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.plans(spaceId) }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.limits(spaceId) }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.goals(spaceId) }),
  ]);
}

export function useBudgetPlansV2() {
  const context = useFinancialContext();
  const spaceId = context.data?.spaceId;

  return useQuery({
    queryKey: financeQueryKeys.plans(spaceId),
    enabled: Boolean(spaceId),
    queryFn: async (): Promise<BudgetPlanWithAllocations[]> => {
      if (!spaceId) return [];
      const { data: plans, error: plansError } = await supabaseV2
        .from("budget_plans")
        .select("*")
        .eq("space_id", spaceId)
        .order("period_start", { ascending: false })
        .order("created_at", { ascending: false });
      if (plansError) throw plansError;

      const planIds = (plans ?? []).map((plan) => plan.id);
      if (!planIds.length) return [];

      const { data: allocations, error: allocationsError } = await supabaseV2
        .from("budget_allocations")
        .select("*")
        .eq("space_id", spaceId)
        .in("budget_plan_id", planIds);
      if (allocationsError) throw allocationsError;

      const allocationsByPlan = new Map<string, BudgetAllocation[]>();
      for (const allocation of allocations ?? []) {
        const values = allocationsByPlan.get(allocation.budget_plan_id) ?? [];
        values.push(allocation);
        allocationsByPlan.set(allocation.budget_plan_id, values);
      }

      return (plans ?? []).map((plan) => ({ ...plan, allocations: allocationsByPlan.get(plan.id) ?? [] }));
    },
  });
}

export function useCreateBudgetPlanV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BudgetPlanInput) => {
      const data = assertWritableContext(context);
      const validationError = validateBudgetPlanInput(input, data.currency);
      if (validationError) throw new Error(validationError);

      const { data: plan, error } = await supabaseV2
        .from("budget_plans")
        .insert({
          space_id: data.spaceId,
          created_by: data.userId,
          name: input.name.trim(),
          expected_income: input.expectedIncome,
          period_start: input.periodStart,
          period_end: input.periodEnd,
          currency: data.currency.toUpperCase(),
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      return plan;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useUpdateBudgetPlanV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BudgetPlanInput & { id: string }) => {
      const data = assertWritableContext(context);
      const validationError = validateBudgetPlanInput(input, data.currency);
      if (validationError) throw new Error(validationError);

      const { data: updated, error } = await supabaseV2.rpc("update_budget_plan", {
        target_plan_id: id,
        plan_name: input.name.trim(),
        plan_expected_income: input.expectedIncome,
        plan_period_start: input.periodStart,
        plan_period_end: input.periodEnd,
        plan_currency: data.currency,
      });
      if (error) throw error;
      if (updated.space_id !== data.spaceId) throw new Error("O plano não pertence ao espaço financeiro ativo.");
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useDeleteBudgetPlanV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const data = assertWritableContext(context);
      const { error } = await supabaseV2
        .from("budget_plans")
        .delete()
        .eq("id", id)
        .eq("space_id", data.spaceId)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useActivateBudgetPlanV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: BudgetPlan) => {
      const data = assertWritableContext(context);
      if (plan.space_id !== data.spaceId) throw new Error("O plano não pertence ao espaço financeiro ativo.");
      const { error } = await supabaseV2.rpc("activate_budget_plan", { target_plan_id: plan.id });
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useDuplicateBudgetPlanV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: BudgetPlanWithAllocations) => {
      const data = assertWritableContext(context);
      if (plan.space_id !== data.spaceId) throw new Error("O plano não pertence ao espaço financeiro ativo.");
      const { data: duplicate, error } = await supabaseV2.rpc("duplicate_budget_plan", { target_plan_id: plan.id });
      if (error) throw error;
      return duplicate;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useSpendingLimitsV2() {
  const context = useFinancialContext();
  const spaceId = context.data?.spaceId;

  return useQuery({
    queryKey: financeQueryKeys.limits(spaceId),
    enabled: Boolean(spaceId),
    queryFn: async (): Promise<SpendingLimit[]> => {
      if (!spaceId) return [];
      const { data, error } = await supabaseV2
        .from("spending_limits")
        .select("*")
        .eq("space_id", spaceId)
        .order("starts_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLimitSpendingV2(limits: SpendingLimit[]) {
  const context = useFinancialContext();
  const spaceId = context.data?.spaceId;
  const timeZone = context.data?.timezone ?? "UTC";
  const ranges = limits.map((limit) => [limit.id, limitPeriodRange(limit.period as RecurrencePeriod, limit.starts_on, new Date(), timeZone)] as const);
  const limitScope = ranges.map(([id, range]) => `${id}:${range.key}:${range.start}:${range.endExclusive}`).join("|");

  return useQuery({
    queryKey: [...financeQueryKeys.limits(spaceId), "spending", limitScope],
    enabled: Boolean(spaceId) && limits.length > 0,
    queryFn: async (): Promise<Record<string, number>> => {
      if (!spaceId || !limits.length) return {};
      const rangesById = new Map(ranges);
      const earliestStart = ranges.reduce((earliest, [, range]) => range.start < earliest ? range.start : earliest, ranges[0][1].start);
      const latestEnd = ranges.reduce((latest, [, range]) => range.endExclusive > latest ? range.endExclusive : latest, ranges[0][1].endExclusive);
      const { data: transactions, error } = await supabaseV2
        .from("transactions")
        .select("category_id, amount, occurred_at")
        .eq("space_id", spaceId)
        .eq("transaction_type", "expense")
        .neq("status", "void")
        .is("deleted_at", null)
        .gte("occurred_at", earliestStart)
        .lt("occurred_at", latestEnd);
      if (error) throw error;

      return Object.fromEntries(limits.map((limit) => {
        const range = rangesById.get(limit.id);
        if (!range) return [limit.id, 0];
        const spent = (transactions ?? [])
          .filter((transaction) => transaction.occurred_at >= range.start && transaction.occurred_at < range.endExclusive)
          .filter((transaction) => !limit.category_id || transaction.category_id === limit.category_id)
          .reduce((total, transaction) => total + transaction.amount, 0);
        return [limit.id, spent];
      }));
    },
  });
}

export function useCreateSpendingLimitV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SpendingLimitInput) => {
      const data = assertWritableContext(context);
      const validationError = validateLimitInput(input, data.currency);
      if (validationError) throw new Error(validationError);
      if (input.categoryId && !data.categories.some((category) => category.id === input.categoryId && category.transaction_type === "expense")) {
        throw new Error("A categoria deve ser uma categoria de despesa deste espaço.");
      }

      const { data: limit, error } = await supabaseV2
        .from("spending_limits")
        .insert({
          space_id: data.spaceId,
          category_id: input.categoryId,
          amount: input.amount,
          currency: data.currency.toUpperCase(),
          period: input.period,
          starts_on: input.startsOn,
        })
        .select()
        .single();
      if (error) throw error;
      return limit;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useUpdateSpendingLimitV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: SpendingLimitInput & { id: string }) => {
      const data = assertWritableContext(context);
      const validationError = validateLimitInput(input, data.currency);
      if (validationError) throw new Error(validationError);
      if (input.categoryId && !data.categories.some((category) => category.id === input.categoryId && category.transaction_type === "expense")) {
        throw new Error("A categoria deve ser uma categoria de despesa deste espaço.");
      }

      const { error } = await supabaseV2
        .from("spending_limits")
        .update({
          category_id: input.categoryId,
          amount: input.amount,
          currency: data.currency.toUpperCase(),
          period: input.period,
          starts_on: input.startsOn,
        })
        .eq("id", id)
        .eq("space_id", data.spaceId)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useDeleteSpendingLimitV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const data = assertWritableContext(context);
      const { error } = await supabaseV2
        .from("spending_limits")
        .delete()
        .eq("id", id)
        .eq("space_id", data.spaceId)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useFinancialGoalsV2() {
  const context = useFinancialContext();
  const spaceId = context.data?.spaceId;

  return useQuery({
    queryKey: financeQueryKeys.goals(spaceId),
    enabled: Boolean(spaceId),
    queryFn: async (): Promise<FinancialGoal[]> => {
      if (!spaceId) return [];
      const { data, error } = await supabaseV2
        .from("financial_goals")
        .select("*")
        .eq("space_id", spaceId)
        .order("is_completed")
        .order("target_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateFinancialGoalV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FinancialGoalInput) => {
      const data = assertWritableContext(context);
      const validationError = validateGoalInput(input, data.currency);
      if (validationError) throw new Error(validationError);
      if (!input.name.trim()) throw new Error("Indica um nome para o objetivo.");

      const { data: goal, error } = await supabaseV2
        .from("financial_goals")
        .insert({
          space_id: data.spaceId,
          created_by: data.userId,
          name: input.name.trim(),
          target_amount: input.targetAmount,
          current_amount: input.currentAmount,
          currency: data.currency.toUpperCase(),
          target_date: input.targetDate,
          is_completed: input.currentAmount >= input.targetAmount,
        })
        .select()
        .single();
      if (error) throw error;
      return goal;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useUpdateFinancialGoalV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: FinancialGoalInput & { id: string }) => {
      const data = assertWritableContext(context);
      const validationError = validateGoalInput(input, data.currency);
      if (validationError) throw new Error(validationError);
      if (!input.name.trim()) throw new Error("Indica um nome para o objetivo.");

      const { error } = await supabaseV2
        .from("financial_goals")
        .update({
          name: input.name.trim(),
          target_amount: input.targetAmount,
          current_amount: input.currentAmount,
          currency: data.currency.toUpperCase(),
          target_date: input.targetDate,
          is_completed: input.currentAmount >= input.targetAmount,
        })
        .eq("id", id)
        .eq("space_id", data.spaceId)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}

export function useDeleteFinancialGoalV2() {
  const context = useFinancialContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const data = assertWritableContext(context);
      const { error } = await supabaseV2
        .from("financial_goals")
        .delete()
        .eq("id", id)
        .eq("space_id", data.spaceId)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data) await invalidateFinancialData(queryClient, context.data.spaceId);
    },
  });
}
