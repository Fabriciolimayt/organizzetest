import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/hooks/finance-query-keys";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { supabaseV2, type TransactionInsertV2, type TransactionV2 } from "@/integrations/supabase/v2";
import type { MonthRange } from "@/lib/finance/month";

export type TransactionFilters = {
  search: string;
  type: "all" | "expense" | "income" | "transfer";
  categoryId: "all" | string;
  status: "all" | "pending" | "cleared" | "void";
};

export type TransactionFormValues = {
  description: string;
  merchant: string;
  amount: number;
  categoryId: string | null;
  transactionType: "expense" | "income" | "transfer";
  status: "pending" | "cleared" | "void";
  occurredAt: string;
};

type InsertContext = {
  userId: string;
  spaceId: string;
  currency: string;
  categoryIds: ReadonlySet<string>;
};

export function buildTransactionInsert(
  values: TransactionFormValues,
  context: InsertContext,
): TransactionInsertV2 {
  const description = values.description.trim();
  const merchant = values.merchant.trim();
  const amount = Number(values.amount);
  const occurredAt = new Date(values.occurredAt);

  if (!description) throw new Error("Indica uma descrição para o lançamento.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Indica um valor superior a zero.");
  if (Number.isNaN(occurredAt.getTime())) throw new Error("Indica uma data válida.");
  if (!["pending", "cleared", "void"].includes(values.status)) throw new Error("O estado do lançamento é inválido.");

  const categoryId = values.transactionType === "expense" ? values.categoryId : null;
  if (categoryId && !context.categoryIds.has(categoryId)) {
    throw new Error("A categoria selecionada não pertence a este espaço.");
  }

  return {
    space_id: context.spaceId,
    created_by: context.userId,
    category_id: categoryId,
    transaction_type: values.transactionType,
    source: "app",
    status: values.status,
    amount,
    currency: context.currency,
    description,
    merchant: merchant || null,
    occurred_at: occurredAt.toISOString(),
  };
}

const normalizedSearch = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-PT");

export function filterTransactions(
  rows: TransactionV2[],
  filters: TransactionFilters,
): TransactionV2[] {
  const search = normalizedSearch(filters.search.trim());
  return rows.filter((row) => {
    if (filters.type !== "all" && row.transaction_type !== filters.type) return false;
    if (filters.categoryId !== "all" && row.category_id !== filters.categoryId) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (!search) return true;
    return normalizedSearch(`${row.description ?? ""} ${row.merchant ?? ""}`).includes(search);
  });
}

export function softDeletePatch(now: Date) {
  return { deleted_at: now.toISOString() };
}

export async function invalidateFinancialQueries(client: QueryClient, spaceId: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: financeQueryKeys.transactions(spaceId) }),
    client.invalidateQueries({ queryKey: financeQueryKeys.dashboard(spaceId) }),
    client.invalidateQueries({ queryKey: financeQueryKeys.reports(spaceId) }),
    client.invalidateQueries({ queryKey: financeQueryKeys.budgets(spaceId) }),
  ]);
}

const EMPTY_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  categoryId: "all",
  status: "all",
};

export function useTransactionsV2(range: MonthRange, filters: TransactionFilters = EMPTY_FILTERS) {
  const context = useFinancialContext();
  const spaceId = context.data?.spaceId;
  const query = useQuery({
    queryKey: financeQueryKeys.transactions(spaceId, range.key, { start: range.start, endExclusive: range.endExclusive }),
    enabled: Boolean(spaceId),
    queryFn: async () => {
      if (!spaceId) return [];
      const { data, error } = await supabaseV2
        .from("transactions")
        .select("*")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .gte("occurred_at", range.start)
        .lt("occurred_at", range.endExclusive)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const transactions = useMemo(
    () => filterTransactions(query.data ?? [], filters),
    [filters, query.data],
  );

  return { ...query, data: transactions, allTransactions: query.data ?? [], context };
}

export function useCreateTransactionV2() {
  const context = useFinancialContext();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const financial = context.data;
      if (!financial?.canWrite) throw new Error("Não tens permissão para criar lançamentos neste espaço.");
      const payload = buildTransactionInsert(values, {
        userId: financial.userId,
        spaceId: financial.spaceId,
        currency: financial.currency,
        categoryIds: new Set(financial.categories.map((category) => category.id)),
      });
      const { data, error } = await supabaseV2.from("transactions").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      if (context.data?.spaceId) await invalidateFinancialQueries(client, context.data.spaceId);
    },
  });
}

export function useUpdateTransactionV2() {
  const context = useFinancialContext();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TransactionFormValues }) => {
      const financial = context.data;
      if (!financial?.canWrite) throw new Error("Não tens permissão para editar lançamentos neste espaço.");
      const payload = buildTransactionInsert(values, {
        userId: financial.userId,
        spaceId: financial.spaceId,
        currency: financial.currency,
        categoryIds: new Set(financial.categories.map((category) => category.id)),
      });
      const { data, error } = await supabaseV2
        .from("transactions")
        .update({
          category_id: payload.category_id,
          transaction_type: payload.transaction_type,
          amount: payload.amount,
          description: payload.description,
          merchant: payload.merchant,
          status: payload.status,
          occurred_at: payload.occurred_at,
        })
        .eq("id", id)
        .eq("space_id", financial.spaceId)
        .is("deleted_at", null)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      if (context.data?.spaceId) await invalidateFinancialQueries(client, context.data.spaceId);
    },
  });
}

export function useDeleteTransactionV2() {
  const context = useFinancialContext();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const financial = context.data;
      if (!financial?.canWrite) throw new Error("Não tens permissão para eliminar lançamentos neste espaço.");
      const { error } = await supabaseV2
        .from("transactions")
        .update(softDeletePatch(new Date()))
        .eq("id", id)
        .eq("space_id", financial.spaceId)
        .is("deleted_at", null)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      if (context.data?.spaceId) await invalidateFinancialQueries(client, context.data.spaceId);
    },
  });
}
