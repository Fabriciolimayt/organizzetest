import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Home,
  Layers,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import DecisionPanel from "@/components/dashboard/DecisionPanel";
import FinancialRow from "@/components/dashboard/FinancialRow";
import MetricStrip from "@/components/dashboard/MetricStrip";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useBudgetPlanV2 } from "@/hooks/useBudgetsV2";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useDeleteTransactionV2, useTransactionsV2 } from "@/hooks/useTransactionsV2";
import {
  categoryKeyFromV2Name,
  mapActiveDashboardExpenses,
  type DashboardCategoryKey,
  type DashboardExpenseV2,
} from "@/lib/dashboard-v2";
import { calendarDateInTimeZone, monthRange } from "@/lib/finance/month";

type CategoryKey = DashboardCategoryKey;

interface Category {
  key: CategoryKey;
  label: string;
  pct: number;
  icon: React.ReactNode;
}

type Expense = DashboardExpenseV2;

const DEFAULT_CATEGORIES: Category[] = [
  { key: "necessidades", label: "Necessidades", pct: 40, icon: <Home size={15} /> },
  { key: "fundo", label: "Fundo Emergência", pct: 10, icon: <PiggyBank size={15} /> },
  { key: "investimentos", label: "Investimentos", pct: 10, icon: <TrendingUp size={15} /> },
  { key: "lazer", label: "Lazer & Cultura", pct: 25, icon: <Sparkles size={15} /> },
  { key: "subscricoes", label: "Subscrições", pct: 10, icon: <Layers size={15} /> },
  { key: "objetivo", label: "Objetivos", pct: 5, icon: <Target size={15} /> },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  BRL: "R$",
  USD: "$",
  MZN: "Mt",
};

const formatMoney = (n: number, sym: string) =>
  `${n < 0 ? "-" : ""}${sym}${Math.abs(n).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const useLocalState = <T,>(key: string, initial: T): [T, (v: T) => void] => {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      // Keep the in-memory dashboard state when storage is unavailable.
    }
  }, [key, v]);
  return [v, setV];
};

const Dashboard = () => {
  const financialContext = useFinancialContext();
  const context = financialContext.data;
  const [localCurrency] = useLocalState<string>("organizze.currency", "EUR");
  const currency = context?.currency ?? localCurrency;
  const sym = CURRENCY_SYMBOLS[currency] ?? "€";

  const [name] = useLocalState<string>("organizze.name", "");
  const currentRange = useMemo(() => monthRange(new Date(), context?.timezone ?? "UTC"), [context?.timezone]);
  const budgetQuery = useBudgetPlanV2(currentRange);
  const transactionQuery = useTransactionsV2(currentRange, { search: "", type: "expense", categoryId: "all", status: "all" });
  const deleteTransaction = useDeleteTransactionV2();
  const categoryNames = useMemo(
    () => new Map((context?.categories ?? []).map((category) => [category.id, category.name])),
    [context?.categories],
  );
  const expenses = useMemo(
    () => mapActiveDashboardExpenses(transactionQuery.data ?? [], categoryNames),
    [categoryNames, transactionQuery.data],
  );
  const cats = useMemo(() => {
    const percentages = new Map<CategoryKey, number>();
    for (const allocation of budgetQuery.data?.allocations ?? []) {
      const key = categoryKeyFromV2Name(categoryNames.get(allocation.category_id));
      percentages.set(key, (percentages.get(key) ?? 0) + Number(allocation.percentage));
    }
    return DEFAULT_CATEGORIES.map((category) => ({ ...category, pct: percentages.get(category.key) ?? 0 }));
  }, [budgetQuery.data?.allocations, categoryNames]);
  const salary = Number(budgetQuery.data?.expected_income ?? 0);
  const allocatedPercentage = cats.reduce((total, category) => total + category.pct, 0);
  const [activeCat, setActiveCat] = useState<CategoryKey>("subscricoes");
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const spentByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.category] = (m[e.category] ?? 0) + e.amount;
    return m;
  }, [expenses]);

  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSubscricoes = spentByCat.subscricoes ?? 0;
  const orcamentoSubs = (salary * (cats.find((c) => c.key === "subscricoes")?.pct ?? 0)) / 100;
  const saldo = salary - totalDespesas;

  const activeCategory = cats.find((c) => c.key === activeCat) ?? cats[0];
  const activeOrcamento = (salary * activeCategory.pct) / 100;
  const activeGasto = spentByCat[activeCat] ?? 0;
  const filteredExpenses = expenses.filter((e) => e.category === activeCat);
  const spendingRhythm = useMemo(() => {
    const totals = new Map<string, { date: string; day: string; amount: number }>();
    for (const expense of expenses) {
      const date = calendarDateInTimeZone(new Date(expense.date), context?.timezone ?? "UTC");
      const entry = totals.get(date) ?? { date, day: date.slice(-2), amount: 0 };
      entry.amount += expense.amount;
      totals.set(date, entry);
    }
    return [...totals.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [context?.timezone, expenses]);
  const peakSpendingDay = spendingRhythm.reduce<(typeof spendingRhythm)[number] | null>(
    (peak, day) => (!peak || day.amount > peak.amount ? day : peak),
    null,
  );
  const locale = context?.locale ?? "pt-PT";
  const timezone = context?.timezone ?? "UTC";
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: timezone }).format(
    new Date(currentRange.start),
  );

  const removeExpense = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      setExpenseToDelete(null);
      toast({ title: "Despesa eliminada com sucesso" });
    } catch (error) {
      toast({
        title: "Não foi possível eliminar",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
  })();

  if (financialContext.isLoading || transactionQuery.isLoading || budgetQuery.isLoading) {
    return <DashboardDataState message="A sincronizar as tuas finanças com precisão..." />;
  }
  if (financialContext.error || transactionQuery.error || budgetQuery.error) {
    return (
      <DashboardDataState
        message="Não foi possível carregar os dados financeiros."
        action={
          <Button
            variant="outline"
            className="border-border hover:bg-muted/65"
            onClick={() => {
              void financialContext.refetch();
              void transactionQuery.refetch();
              void budgetQuery.refetch();
            }}
          >
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="product-dashboard mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Visão mensal"
        title={monthLabel.charAt(0).toLocaleUpperCase(locale) + monthLabel.slice(1)}
        description={`${greeting}${name ? `, ${name}` : ""}. Fluxo de caixa, limites e decisões do período atual.`}
        actions={
          <Button asChild className="rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary-hover">
            <Link to="/dashboard/lancamentos" className="gap-2">
              <Plus size={16} /> Novo lançamento
            </Link>
          </Button>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Disponível",
            value: formatMoney(saldo, sym),
            detail: "Após os lançamentos do mês",
            variant: saldo < 0 ? "negative" : "positive",
          },
          {
            label: "Despesas",
            value: formatMoney(totalDespesas, sym),
            detail: `${expenses.length} lançamento${expenses.length === 1 ? "" : "s"}`,
            variant: "negative",
          },
          {
            label: "Rendimento",
            value: formatMoney(salary, sym),
            detail:
              salary === 0 ? (
                <Link to="/dashboard/orcamento" className="text-primary hover:underline">
                  Configurar rendimento
                </Link>
              ) : (
                "Rendimento orçamentado"
              ),
            variant: "default",
          },
          {
            label: "Limite de subscrições",
            value: formatMoney(orcamentoSubs, sym),
            detail: `${formatMoney(totalSubscricoes, sym)} utilizados`,
            variant: totalSubscricoes > orcamentoSubs && orcamentoSubs > 0 ? "negative" : "accent",
          },
        ]}
        featured
      />

      <div className="product-dashboard__band grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
        <section className="functional-panel min-w-0 p-5 sm:p-6" aria-labelledby="spending-rhythm-title">
          <header className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div className="min-w-0">
              <p className="font-mono text-label uppercase text-muted-foreground">Mês corrente</p>
              <h2 id="spending-rhythm-title" className="mt-1 text-panel-title text-foreground">
                Ritmo de despesas
              </h2>
            </div>
            <p className="financial-value text-body-small font-semibold text-financial-expense">
              {formatMoney(totalDespesas, sym)}
            </p>
          </header>
          <p id="spending-rhythm-summary" className="mt-4 text-body-small text-muted-foreground">
            {spendingRhythm.length === 0
              ? "Ainda não existem despesas registadas neste mês."
              : `${spendingRhythm.length} dia${spendingRhythm.length === 1 ? "" : "s"} com despesas${
                  peakSpendingDay ? `; maior valor diário de ${formatMoney(peakSpendingDay.amount, sym)} no dia ${peakSpendingDay.day}` : ""
                }.`}
          </p>
          {spendingRhythm.length === 0 ? (
            <div className="mt-4 flex h-56 items-center justify-center border-t border-dashed border-border text-center text-body-small text-muted-foreground">
              O gráfico será preenchido com os lançamentos do período.
            </div>
          ) : (
            <div
              className="mt-3 h-56 min-w-0"
              role="img"
              aria-label="Despesas por dia do mês"
              aria-describedby="spending-rhythm-summary"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingRhythm} margin={{ top: 12, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} width={48} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "6px",
                      color: "hsl(var(--foreground))",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [formatMoney(value, sym), "Despesas"]}
                    labelFormatter={(day) => `Dia ${day}`}
                  />
                  <Bar dataKey="amount" name="Despesas" fill="hsl(var(--financial-expense))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <DecisionPanel
          eyebrow="Próxima decisão"
          title={
            salary === 0
              ? "Configurar primeiro orçamento."
              : activeGasto > activeOrcamento
                ? `Rever categoria ${activeCategory.label.toLowerCase()}.`
                : `Acompanhar categoria ${activeCategory.label.toLowerCase()}.`
          }
          description={
            salary === 0
              ? "Define o rendimento mensal para contextualizar as despesas e os limites."
              : `${formatMoney(Math.abs(activeOrcamento - activeGasto), sym)} ${
                  activeGasto > activeOrcamento ? "acima do teto" : "ainda disponíveis no teto"
                }. ${allocatedPercentage.toLocaleString(locale, { maximumFractionDigits: 1 })}% do rendimento está distribuído.`
          }
          tone={activeGasto > activeOrcamento && salary > 0 ? "warning" : "intelligence"}
          action={
            <Button asChild variant="outline" className="w-full justify-between" data-tour="salario">
              <Link to="/dashboard/orcamento">
                {salary > 0 ? "Aceder ao orçamento" : "Criar orçamento"}
                <ArrowRight size={15} />
              </Link>
            </Button>
          }
        />
      </div>

      <div className="product-dashboard__band grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section className="functional-panel min-w-0 p-5" data-tour="despesas" aria-labelledby="recent-transactions-title">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 id="recent-transactions-title" className="text-panel-title text-foreground">Lançamentos recentes</h2>
              <p className="mt-1 text-body-small text-muted-foreground">Categoria ativa: {activeCategory.label}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/lancamentos">
                <Plus size={14} /> Adicionar
              </Link>
            </Button>
          </header>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar lançamentos por categoria">
            {cats.map((category) => (
              <button
                key={category.key}
                type="button"
                aria-pressed={activeCat === category.key}
                onClick={() => setActiveCat(category.key)}
                className={`focus-ring interactive-control flex min-h-11 items-center gap-2 rounded-md border px-3 text-body-small font-medium ${
                  activeCat === category.key
                    ? "border-intelligence/55 bg-intelligence/10 text-intelligence"
                    : "border-border bg-muted/25 text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
          {filteredExpenses.length === 0 ? (
            <div className="mt-4 flex min-h-40 flex-col items-center justify-center gap-2 border-t border-dashed border-border px-4 text-center">
              <Layers size={28} className="text-muted-foreground/40" />
              <p className="text-body-small font-semibold text-foreground">Sem lançamentos em {activeCategory.label}</p>
              <p className="text-body-small text-muted-foreground">Nenhuma despesa associada a este grupo no mês.</p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {filteredExpenses.map((expense) => (
                <FinancialRow
                  key={expense.id}
                  icon={activeCategory.icon}
                  title={expense.name}
                  meta={new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: timezone }).format(new Date(expense.date))}
                  amount={`-${formatMoney(expense.amount, sym)}`}
                  amountTone="negative"
                  action={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 hover:bg-financial-expense/10"
                      aria-label={`Eliminar ${expense.name}`}
                      onClick={() => setExpenseToDelete(expense)}
                    >
                      <Trash2 size={15} className="text-muted-foreground hover:text-financial-expense" />
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="functional-panel min-w-0 p-5" data-tour="orcamento" aria-labelledby="category-limits-title">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 id="category-limits-title" className="text-panel-title text-foreground">Limites por categoria</h2>
              <p className="mt-1 text-body-small text-muted-foreground">Planeado e utilizado no mês</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/orcamento">Ajustar</Link>
            </Button>
          </header>
          <div className="mt-2 divide-y divide-border">
            {cats.map((category) => {
              const budgeted = (salary * category.pct) / 100;
              const spent = spentByCat[category.key] ?? 0;
              const remaining = budgeted - spent;
              const percentage = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;
              const exceeded = remaining < 0;
              return (
                <button
                  key={category.key}
                  type="button"
                  aria-pressed={activeCat === category.key}
                  onClick={() => setActiveCat(category.key)}
                  className="focus-ring interactive-control w-full min-w-0 py-3 text-left hover:bg-muted/25"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="surface-quiet flex size-9 shrink-0 items-center justify-center text-intelligence">{category.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="product-category-limit__summary flex min-w-0 items-center justify-between gap-3">
                        <span className="truncate text-body-small font-semibold text-foreground">{category.label}</span>
                        <span className={`product-category-limit__amount financial-value text-body-small font-semibold ${exceeded ? "text-financial-expense" : "text-foreground"}`}>
                          {formatMoney(spent, sym)} / {formatMoney(budgeted, sym)}
                        </span>
                      </span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-sm bg-muted">
                        <span className={`block h-full ${exceeded ? "bg-financial-expense" : "bg-intelligence"}`} style={{ width: `${percentage}%` }} />
                      </span>
                      <span className={`mt-1 block text-label ${exceeded ? "text-financial-expense" : "text-muted-foreground"}`}>
                        {exceeded ? `${formatMoney(Math.abs(remaining), sym)} acima do limite` : `${formatMoney(remaining, sym)} disponíveis`}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="product-dashboard__plan functional-panel" data-tour="planos" aria-labelledby="active-plan-title">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="surface-quiet flex size-10 shrink-0 items-center justify-center text-intelligence"><Wallet size={18} /></span>
            <div className="min-w-0">
              <p className="font-mono text-label uppercase text-muted-foreground">Plano ativo</p>
              <h2 id="active-plan-title" className="truncate text-compact-title text-foreground">
                {budgetQuery.data?.name ?? "Sem plano associado"}
              </h2>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard/orcamento">
              <Plus size={15} /> Gerir plano
            </Link>
          </Button>
        </div>
        {salary === 0 && (
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-t border-financial-warning/35 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="surface-quiet flex size-10 shrink-0 items-center justify-center text-financial-warning"><Calendar size={18} /></span>
              <div className="min-w-0">
                <p className="text-body-small font-semibold text-foreground">Define o teu rendimento mensal</p>
                <p className="text-body-small text-muted-foreground">Necessário para contextualizar categorias e limites.</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-financial-warning/50 text-financial-warning hover:bg-financial-warning/10">
              <Link to="/dashboard/orcamento"><Target size={14} /> Definir agora</Link>
            </Button>
          </div>
        )}
      </section>

      <AlertDialog
        open={Boolean(expenseToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteTransaction.isPending) setExpenseToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar despesa?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              A despesa será removida dos cálculos e relatórios de fluxo do mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTransaction.isPending} className="border-border bg-muted/45 text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTransaction.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (expenseToDelete) void removeExpense(expenseToDelete.id);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const DashboardDataState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
  <div className="mx-auto flex min-h-[360px] max-w-3xl flex-col items-center justify-center gap-4 text-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <p className="text-sm font-medium text-muted-foreground">{message}</p>
    {action}
  </div>
);

export default Dashboard;
