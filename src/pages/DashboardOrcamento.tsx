import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";

import BudgetEditor from "@/components/finance/BudgetEditor";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PageHeader from "@/components/dashboard/PageHeader";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { equalAllocations, useBudgetPlanV2, useSaveBudgetPlanV2, validateAllocations, type AllocationDraft } from "@/hooks/useBudgetsV2";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useTransactionsV2 } from "@/hooks/useTransactionsV2";
import { monthRange, shiftMonth } from "@/lib/finance/month";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/finance/money";

const titleCase = (value: string) => value.charAt(0).toLocaleUpperCase("pt-PT") + value.slice(1);

export default function DashboardOrcamento() {
  const [anchor, setAnchor] = useState(new Date());
  const financial = useFinancialContext();
  const context = financial.data;
  const range = useMemo(() => monthRange(anchor, context?.timezone ?? "UTC"), [anchor, context?.timezone]);
  const budget = useBudgetPlanV2(range);
  const transactions = useTransactionsV2(range, { search: "", type: "expense", categoryId: "all", status: "all" });
  const saveBudget = useSaveBudgetPlanV2(range);
  const categories = useMemo(() => (context?.categories ?? []).filter((category) => category.transaction_type === "expense"), [context?.categories]);
  const [name, setName] = useState("Plano mensal");
  const [incomeInput, setIncomeInput] = useState("0");
  const [allocations, setAllocations] = useState<AllocationDraft[]>([]);

  useEffect(() => {
    if (!categories.length || budget.isLoading) return;
    if (budget.data) {
      setName(budget.data.name);
      setIncomeInput(formatCurrencyInput(Number(budget.data.expected_income), context?.locale ?? "pt-PT"));
      setAllocations(categories.map((category) => ({ categoryId: category.id, percentage: budget.data?.allocations.find((allocation) => allocation.category_id === category.id)?.percentage ?? 0 })));
    } else {
      setName("Plano mensal");
      setIncomeInput("0");
      setAllocations(equalAllocations(categories));
    }
  }, [budget.data, budget.isLoading, categories, context?.locale, range.key]);

  const locale = context?.locale ?? "pt-PT";
  const currency = context?.currency ?? "EUR";
  const income = parseCurrencyInput(incomeInput, locale);
  const validation = validateAllocations(allocations);
  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const transaction of transactions.data ?? []) {
      if (transaction.status === "void" || !transaction.category_id) continue;
      totals.set(transaction.category_id, (totals.get(transaction.category_id) ?? 0) + Number(transaction.amount));
    }
    return totals;
  }, [transactions.data]);
  const totalSpent = [...spentByCategory.values()].reduce((sum, value) => sum + value, 0);
  const monthLabel = titleCase(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: context?.timezone ?? "UTC" }).format(anchor));

  const save = async () => {
    try {
      await saveBudget.mutateAsync({ id: budget.data?.id, name, expectedIncome: income, allocations });
      toast({ title: "Orçamento guardado", description: `${monthLabel} está atualizado.` });
    } catch (error) {
      toast({ title: "Não foi possível guardar", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  if (financial.isLoading || budget.isLoading || transactions.isLoading) return <State message="A carregar orçamento..." loading />;
  if (financial.error || budget.error || transactions.error) return <State message="Não foi possível carregar o orçamento." action={<Button variant="outline" onClick={() => { void financial.refetch(); void budget.refetch(); void transactions.refetch(); }}>Tentar novamente</Button>} />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Planear" title="Orçamento" description="Define o rendimento previsto e distribui cada euro pelas categorias do mês." />
      <MonthSelector month={monthLabel} onPrevious={() => setAnchor((current) => shiftMonth(current, -1, context?.timezone ?? "UTC"))} onNext={() => setAnchor((current) => shiftMonth(current, 1, context?.timezone ?? "UTC"))} />
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <DashboardCard title="Plano do mês">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="budget-name">Nome</Label><Input id="budget-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="budget-income">Rendimento previsto ({currency})</Label><Input id="budget-income" inputMode="decimal" value={incomeInput} onChange={(event) => setIncomeInput(event.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2"><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Gasto</p><p className="font-semibold tabular-nums">{formatCurrency(totalSpent, currency, locale)}</p></div><div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Disponível</p><p className="font-semibold tabular-nums">{formatCurrency((Number.isFinite(income) ? income : 0) - totalSpent, currency, locale)}</p></div></div>
            </div>
          </DashboardCard>
          <DashboardCard title="Modelos">
            <div className="grid gap-2"><Button variant="outline" onClick={() => setAllocations(equalAllocations(categories))}>Divisão equilibrada</Button><Button variant="outline" onClick={() => setAllocations(weightedPreset(categories))}>Base 50/30/20</Button></div>
          </DashboardCard>
        </div>
        <DashboardCard title="Divisão por categoria">
          <BudgetEditor categories={categories} allocations={allocations} income={Number.isFinite(income) ? income : 0} spentByCategory={spentByCategory} currency={currency} locale={locale} disabled={!context?.canWrite || saveBudget.isPending} onChange={setAllocations} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className={`text-sm ${validation.valid ? "text-muted-foreground" : "text-destructive"}`}>{validation.valid ? "A divisão soma 100%." : validation.message}</p>
            <Button onClick={() => void save()} disabled={!context?.canWrite || !validation.valid || !Number.isFinite(income) || saveBudget.isPending}>{saveBudget.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar orçamento</Button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function weightedPreset(categories: Array<{ id: string }>): AllocationDraft[] {
  if (categories.length < 3) return equalAllocations(categories);
  const boundaries = [Math.ceil(categories.length / 2), categories.length - 1];
  const groups = [categories.slice(0, boundaries[0]), categories.slice(boundaries[0], boundaries[1]), categories.slice(boundaries[1])];
  const weights = [50, 30, 20];
  return groups.flatMap((group, groupIndex) => {
    let assigned = 0;
    return group.map((category, index) => {
      const percentage = index === group.length - 1 ? weights[groupIndex] - assigned : Math.floor((weights[groupIndex] / group.length) * 100) / 100;
      assigned += percentage;
      return { categoryId: category.id, percentage };
    });
  });
}

function State({ message, loading, action }: { message: string; loading?: boolean; action?: React.ReactNode }) {
  return <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">{loading && <Loader2 size={20} className="animate-spin" />}<p>{message}</p>{action}</div>;
}
