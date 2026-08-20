type SummaryTransaction = {
  transaction_type: "expense" | "income" | "transfer";
  amount: number;
  category_id: string | null;
  status?: "pending" | "cleared" | "void";
};

export function summarizeTransactions(
  transactions: SummaryTransaction[],
  categoryNames: ReadonlyMap<string, string>,
) {
  let incomeMinor = 0;
  let expenseMinor = 0;
  const categoryMinorTotals: Record<string, number> = {};

  for (const transaction of transactions) {
    if (transaction.status === "void") continue;
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const minorAmount = Math.round(amount * 100);

    if (transaction.transaction_type === "income") {
      incomeMinor += minorAmount;
      continue;
    }
    if (transaction.transaction_type !== "expense") continue;

    expenseMinor += minorAmount;
    const category = transaction.category_id
      ? categoryNames.get(transaction.category_id) ?? "Sem categoria"
      : "Sem categoria";
    categoryMinorTotals[category] = (categoryMinorTotals[category] ?? 0) + minorAmount;
  }

  const income = incomeMinor / 100;
  const expenses = expenseMinor / 100;
  const balance = (incomeMinor - expenseMinor) / 100;
  const categoryTotals = Object.fromEntries(
    Object.entries(categoryMinorTotals).map(([category, amount]) => [category, amount / 100]),
  );
  return {
    income,
    expenses,
    balance,
    savingsRate: incomeMinor > 0 ? ((incomeMinor - expenseMinor) / incomeMinor) * 100 : 0,
    categoryTotals,
  };
}

export function compareMonthlySummaries(current: ReturnType<typeof summarizeTransactions>, previous: ReturnType<typeof summarizeTransactions>) {
  const percentageChange = (value: number, baseline: number) => baseline === 0 ? null : ((value - baseline) / baseline) * 100;
  return {
    expenseChangePercentage: percentageChange(current.expenses, previous.expenses),
    incomeChangePercentage: percentageChange(current.income, previous.income),
    balanceChange: Math.round((current.balance - previous.balance) * 100) / 100,
  };
}
