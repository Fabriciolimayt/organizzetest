import { useMemo, useState } from "react";
import { Loader2, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import DashboardCard from "@/components/dashboard/DashboardCard";
import MetricStrip from "@/components/dashboard/MetricStrip";
import MonthSelector from "@/components/dashboard/MonthSelector";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useTransactionsV2 } from "@/hooks/useTransactionsV2";
import { calendarDateInTimeZone, monthRange, shiftMonth } from "@/lib/finance/month";
import { formatCurrency } from "@/lib/finance/money";
import { compareMonthlySummaries, summarizeTransactions } from "@/lib/finance/reports";

const FILTERS = { search: "", type: "all", categoryId: "all", status: "all" } as const;
const FALLBACK_COLORS = ["#10b981", "#38bdf8", "#a78bfa", "#f43f5e", "#fbbf24", "#94a3b8"];

export default function DashboardRelatorios() {
  const [anchor, setAnchor] = useState(new Date());
  const financial = useFinancialContext();
  const context = financial.data;
  const timeZone = context?.timezone ?? "UTC";
  const range = useMemo(() => monthRange(anchor, timeZone), [anchor, timeZone]);
  const previousRange = useMemo(() => monthRange(shiftMonth(anchor, -1, timeZone), timeZone), [anchor, timeZone]);
  const current = useTransactionsV2(range, FILTERS);
  const previous = useTransactionsV2(previousRange, FILTERS);
  const categoryNames = useMemo(() => new Map((context?.categories ?? []).map((category) => [category.id, category.name])), [context?.categories]);
  const categoryColors = useMemo(() => new Map((context?.categories ?? []).map((category) => [category.name, category.color ?? ""])), [context?.categories]);
  const summary = useMemo(() => summarizeTransactions(current.data ?? [], categoryNames), [categoryNames, current.data]);
  const previousSummary = useMemo(() => summarizeTransactions(previous.data ?? [], categoryNames), [categoryNames, previous.data]);
  const comparison = useMemo(() => compareMonthlySummaries(summary, previousSummary), [previousSummary, summary]);
  const categoryData = useMemo(
    () => Object.entries(summary.categoryTotals)
      .map(([name, value], index) => ({ name, value, color: categoryColors.get(name) || FALLBACK_COLORS[index % FALLBACK_COLORS.length] }))
      .sort((a, b) => b.value - a.value),
    [categoryColors, summary.categoryTotals],
  );
  const dailyData = useMemo(() => {
    const totals = new Map<string, { day: string; income: number; expenses: number }>();
    for (const transaction of current.data ?? []) {
      if (transaction.status === "void" || transaction.transaction_type === "transfer") continue;
      const date = calendarDateInTimeZone(new Date(transaction.occurred_at), timeZone);
      const entry = totals.get(date) ?? { day: date.slice(-2), income: 0, expenses: 0 };
      const amount = Number(transaction.amount);
      if (transaction.transaction_type === "income") entry.income += amount;
      if (transaction.transaction_type === "expense") entry.expenses += amount;
      totals.set(date, entry);
    }
    return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [current.data, timeZone]);

  const locale = context?.locale ?? "pt-PT";
  const currency = context?.currency ?? "EUR";
  const monthLabel = titleCase(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone }).format(anchor));
  const loading = financial.isLoading || current.isLoading || previous.isLoading;
  const error = financial.error || current.error || previous.error;

  if (loading) return <ReportState loading message="A preparar os relatórios analíticos..." />;
  if (error) return <ReportState message="Não foi possível carregar os relatórios." action={<Button variant="outline" onClick={() => { void financial.refetch(); void current.refetch(); void previous.refetch(); }}>Tentar novamente</Button>} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Acompanhar"
        title="Relatórios & Análise"
        description="Compreensão profunda do comportamento financeiro e comparativo com o ciclo anterior."
      />
      <MonthSelector
        month={monthLabel}
        onPrevious={() => setAnchor((value) => shiftMonth(value, -1, timeZone))}
        onNext={() => setAnchor((value) => shiftMonth(value, 1, timeZone))}
      />
      <MetricStrip
        items={[
          {
            label: "Rendimentos",
            value: formatCurrency(summary.income, currency, locale),
            detail: comparison.incomeChangePercentage == null ? undefined : `${comparison.incomeChangePercentage.toLocaleString(locale, { maximumFractionDigits: 1 })}% vs. mês anterior`,
            variant: "positive",
          },
          {
            label: "Despesas",
            value: formatCurrency(summary.expenses, currency, locale),
            detail: comparison.expenseChangePercentage == null ? undefined : `${comparison.expenseChangePercentage.toLocaleString(locale, { maximumFractionDigits: 1 })}% vs. mês anterior`,
            variant: "negative",
          },
          {
            label: "Saldo",
            value: formatCurrency(summary.balance, currency, locale),
            variant: summary.balance >= 0 ? "positive" : "negative",
          },
          {
            label: "Taxa de poupança",
            value: `${summary.savingsRate.toLocaleString(locale, { maximumFractionDigits: 1 })}%`,
            variant: summary.savingsRate >= 0 ? "accent" : "negative",
          },
        ]}
      />
      <DashboardCard noPadding>
        <Tabs defaultValue="categorias">
          <div className="border-b border-border p-4">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1">
              <TabsTrigger value="categorias" className="whitespace-nowrap">Distribuição por Categoria</TabsTrigger>
              <TabsTrigger value="fluxo" className="whitespace-nowrap">Fluxo Diário (Entradas e Saídas)</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="categorias" className="m-0 p-5 sm:p-6">
            {categoryData.length ? (
              <div className="space-y-5">
                <p id="category-chart-summary" className="max-w-3xl text-body-small text-muted-foreground">
                  {categoryData.length} categoria{categoryData.length === 1 ? "" : "s"} com despesas. A maior é {categoryData[0].name},
                  com {formatCurrency(categoryData[0].value, currency, locale)} de um total de {formatCurrency(summary.expenses, currency, locale)}.
                </p>
                <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div
                    className="h-[280px] min-w-0 sm:h-[320px]"
                    role="img"
                    aria-label="Distribuição das despesas por categoria"
                    aria-describedby="category-chart-summary"
                  >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={75}
                        outerRadius={115}
                        paddingAngle={3}
                        stroke="hsl(var(--card))"
                        strokeWidth={1}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "6px",
                          color: "hsl(var(--foreground))",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => formatCurrency(value, currency, locale)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="max-h-[320px] divide-y divide-border overflow-y-auto" aria-label="Valores por categoria">
                  {categoryData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex min-w-0 items-center gap-3 px-1 py-3"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{entry.name}</span>
                      <span className="financial-value text-xs font-semibold text-foreground">
                        {formatCurrency(entry.value, currency, locale)}
                      </span>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyReport />
            )}
          </TabsContent>
          <TabsContent value="fluxo" className="m-0 p-5 sm:p-6">
            {dailyData.length ? (
              <div className="space-y-5">
                <p id="flow-chart-summary" className="max-w-3xl text-body-small text-muted-foreground">
                  {dailyData.length} dia{dailyData.length === 1 ? "" : "s"} com movimentos. Entradas de {formatCurrency(summary.income, currency, locale)}
                  e saídas de {formatCurrency(summary.expenses, currency, locale)}, com saldo de {formatCurrency(summary.balance, currency, locale)}.
                </p>
                <div
                  className="h-[300px] min-w-0 sm:h-[340px]"
                  role="img"
                  aria-label="Entradas e saídas por dia"
                  aria-describedby="flow-chart-summary"
                >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "6px",
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => formatCurrency(value, currency, locale)}
                    />
                    <Bar dataKey="income" name="Entradas" fill="hsl(var(--financial-income))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="expenses" name="Saídas" fill="hsl(var(--financial-expense))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyReport />
            )}
          </TabsContent>
        </Tabs>
      </DashboardCard>
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-md bg-transparent border border-dashed border-border text-center p-6">
      <WalletCards size={32} className="text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">Sem movimentações no período</p>
      <p className="text-xs text-muted-foreground">Os gráficos serão gerados automaticamente assim que houver lançamentos.</p>
    </div>
  );
}

function ReportState({ message, loading, action }: { message: string; loading?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      {loading && <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      <p>{message}</p>
      {action}
    </div>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-PT") + value.slice(1);
}
