export type DashboardCategoryKey =
  | "necessidades"
  | "fundo"
  | "investimentos"
  | "lazer"
  | "subscricoes"
  | "objetivo";

export interface DashboardExpenseV2 {
  id: string;
  name: string;
  amount: number;
  category: DashboardCategoryKey;
  fixed: boolean;
  date: string;
}

interface TransactionSummary {
  id: string;
  amount: number;
  description: string | null;
  merchant: string | null;
  category_id: string | null;
  occurred_at: string;
}

interface DashboardTransactionSummary extends TransactionSummary {
  status?: "pending" | "cleared" | "void";
}

const normalizeCategoryName = (name: string | null | undefined) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-PT");

export function categoryKeyFromV2Name(name: string | null | undefined): DashboardCategoryKey {
  const normalized = normalizeCategoryName(name);

  if (normalized.includes("subscr") || normalized.includes("assinatura") || normalized.includes("subscription")) {
    return "subscricoes";
  }
  if (normalized.includes("lazer") || normalized.includes("entretenimento")) return "lazer";
  if (normalized.includes("invest")) return "investimentos";
  if (normalized.includes("fundo") || normalized.includes("emergencia")) return "fundo";
  if (normalized.includes("objetivo") || normalized.includes("meta")) return "objetivo";

  return "necessidades";
}

export function mapV2TransactionToExpense(
  transaction: TransactionSummary,
  categoryNames: ReadonlyMap<string, string>,
): DashboardExpenseV2 {
  const categoryName = transaction.category_id
    ? categoryNames.get(transaction.category_id)
    : undefined;

  return {
    id: transaction.id,
    name: transaction.description ?? transaction.merchant ?? "Despesa",
    amount: Number(transaction.amount),
    category: categoryKeyFromV2Name(categoryName),
    fixed: false,
    date: transaction.occurred_at,
  };
}

export function mapActiveDashboardExpenses(
  transactions: DashboardTransactionSummary[],
  categoryNames: ReadonlyMap<string, string>,
): DashboardExpenseV2[] {
  return transactions
    .filter((transaction) => transaction.status !== "void")
    .map((transaction) => mapV2TransactionToExpense(transaction, categoryNames));
}
