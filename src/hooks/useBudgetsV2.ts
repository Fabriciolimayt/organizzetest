import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/hooks/finance-query-keys";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { supabaseV2, type V2Row } from "@/integrations/supabase/v2";
import type { MonthRange } from "@/lib/finance/month";

export type AllocationDraft = { categoryId: string; percentage: number };
export const equalAllocations = (categories: Array<{ id: string }>): AllocationDraft[] => {
  if (!categories.length) return [];
  const base = Math.floor((10000 / categories.length)) / 100;
  let assigned = 0;
  return categories.map((category, index) => {
    const percentage = index === categories.length - 1 ? Math.round((100 - assigned) * 100) / 100 : base;
    assigned += percentage;
    return { categoryId: category.id, percentage };
  });
};
export type BudgetPlanBundle = V2Row<"budget_plans"> & { allocations: V2Row<"budget_allocations">[] };
export type SaveBudgetInput = {
  id?: string;
  name: string;
  expectedIncome: number;
  allocations: AllocationDraft[];
};

export function validateAllocations(allocations: AllocationDraft[]) {
  const total = Math.round(allocations.reduce((sum, allocation) => sum + Number(allocation.percentage || 0), 0) * 100) / 100;
  const uniqueCategories = new Set(allocations.map((allocation) => allocation.categoryId));
  if (!allocations.length) return { valid: false, total, message: "Adiciona pelo menos uma categoria." };
  if (uniqueCategories.size !== allocations.length) return { valid: false, total, message: "Cada categoria só pode aparecer uma vez." };
  if (allocations.some((allocation) => !allocation.categoryId || allocation.percentage < 0 || allocation.percentage > 100)) {
    return { valid: false, total, message: "Revê as percentagens das categorias." };
  }
  if (total !== 100) return { valid: false, total, message: `A divisão deve somar 100%. Neste momento soma ${total}%.` };
  return { valid: true, total, message: null };
}

export function periodDates(range: MonthRange) {
  const lastDay = new Date(Date.UTC(range.year, range.month, 0)).getUTCDate();
  const prefix = `${range.year}-${String(range.month).padStart(2, "0")}`;
  return { start: `${prefix}-01`, end: `${prefix}-${String(lastDay).padStart(2, "0")}` };
}

export function useBudgetPlanV2(range: MonthRange) {
  const context = useFinancialContext();
  const spaceId = context.data?.spaceId;
  const dates = periodDates(range);

  const query = useQuery({
    queryKey: financeQueryKeys.budgets(spaceId, range.key),
    enabled: Boolean(spaceId),
    queryFn: async (): Promise<BudgetPlanBundle | null> => {
      if (!spaceId) return null;
      const { data: plans, error: plansError } = await supabaseV2
        .from("budget_plans")
        .select("*")
        .eq("space_id", spaceId)
        .lte("period_start", dates.end)
        .gte("period_end", dates.start)
        .order("is_active", { ascending: false })
        .order("updated_at", { ascending: false });
      if (plansError) throw plansError;
      const plan = plans?.[0];
      if (!plan) return null;

      const { data: allocations, error: allocationsError } = await supabaseV2
        .from("budget_allocations")
        .select("*")
        .eq("space_id", spaceId)
        .eq("budget_plan_id", plan.id)
        .order("created_at");
      if (allocationsError) throw allocationsError;
      return { ...plan, allocations: allocations ?? [] };
    },
  });

  return { ...query, context };
}

export function useSaveBudgetPlanV2(range: MonthRange) {
  const context = useFinancialContext();
  const client = useQueryClient();
  const dates = periodDates(range);

  return useMutation({
    mutationFn: async (input: SaveBudgetInput) => {
      const financial = context.data;
      if (!financial?.canWrite) throw new Error("Não tens permissão para alterar o orçamento deste espaço.");
      const validation = validateAllocations(input.allocations);
      if (!validation.valid) throw new Error(validation.message ?? "A divisão do orçamento é inválida.");
      if (!input.name.trim()) throw new Error("Indica um nome para o plano.");
      if (!Number.isFinite(input.expectedIncome) || input.expectedIncome < 0) throw new Error("Indica um rendimento válido.");

      const planAllocations = input.allocations.map((allocation) => ({
        category_id: allocation.categoryId,
        percentage: allocation.percentage,
        amount: Math.round((input.expectedIncome * allocation.percentage) / 100 * 100) / 100,
      }));
      const { data: plan, error } = await supabaseV2.rpc("save_budget_plan", {
        target_space_id: financial.spaceId, target_plan_id: input.id ?? null, plan_name: input.name.trim(),
        plan_expected_income: input.expectedIncome, plan_period_start: dates.start, plan_period_end: dates.end,
        plan_currency: financial.currency, plan_allocations: planAllocations,
      });
      if (error) throw error;
      return plan.id;
    },
    onSuccess: async () => {
      if (!context.data?.spaceId) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: financeQueryKeys.budgets(context.data.spaceId) }),
        client.invalidateQueries({ queryKey: financeQueryKeys.dashboard(context.data.spaceId) }),
        client.invalidateQueries({ queryKey: financeQueryKeys.reports(context.data.spaceId) }),
      ]);
    },
  });
}
