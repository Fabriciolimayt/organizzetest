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
const FALLBACK_COLORS = ["#0f766e", "#2563eb", "#d97706", "#be123c", "#7c3aed", "#475569"];

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

  if (loading) return <ReportState loading message="A preparar os relatórios..." />;
  if (error) return <ReportState message="Não foi possível carregar os relatórios." action={<Button variant="outline" onClick={() => { void financial.refetch(); void current.refetch(); void previous.refetch(); }}>Tentar novamente</Button>} />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Acompanhar" title="Relatórios" description="Percebe como o teu dinheiro se move e compara este mês com o anterior." />
      <MonthSelector month={monthLabel} onPrevious={() => setAnchor((value) => shiftMonth(value, -1, timeZone))} onNext={() => setAnchor((value) => shiftMonth(value, 1, timeZone))} />
      <MetricStrip items={[
        { label: "Rendimentos", value: formatCurrency(summary.income, currency, locale), detail: comparison.incomeChangePercentage == null ? undefined : `${comparison.incomeChangePercentage.toLocaleString(locale, { maximumFractionDigits: 1 })}% vs. mês anterior`, variant: "positive" },
        { label: "Despesas", value: formatCurrency(summary.expenses, currency, locale), detail: comparison.expenseChangePercentage == null ? undefined : `${comparison.expenseChangePercentage.toLocaleString(locale, { maximumFractionDigits: 1 })}% vs. mês anterior`, variant: "negative" },
        { label: "Saldo", value: formatCurrency(summary.balance, currency, locale), variant: summary.balance >= 0 ? "positive" : "negative" },
        { label: "Taxa de poupança", value: `${summary.savingsRate.toLocaleString(locale, { maximumFractionDigits: 1 })}%`, variant: summary.savingsRate >= 0 ? "accent" : "negative" },
      ]} />
      <DashboardCard>
        <Tabs defaultValue="categorias">
          <TabsList className="w-full justify-start"><TabsTrigger value="categorias">Categorias</TabsTrigger><TabsTrigger value="fluxo">Entradas e saídas</TabsTrigger></TabsList>
          <TabsContent value="categorias" className="mt-5">
            {categoryData.length ? (
              <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="h-[300px] min-w-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={2}>{categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value, currency, locale)} /></PieChart></ResponsiveContainer></div>
                <div className="space-y-3">{categoryData.map((entry) => <div key={entry.name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} /><span className="min-w-0 flex-1 truncate text-sm">{entry.name}</span><span className="text-sm font-semibold tabular-nums">{formatCurrency(entry.value, currency, locale)}</span></div>)}</div>
              </div>
            ) : <EmptyReport />}
          </TabsContent>
          <TabsContent value="fluxo" className="mt-5">
            {dailyData.length ? (
              <div className="h-[330px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} width={52} /><Tooltip formatter={(value: number) => formatCurrency(value, currency, locale)} /><Bar dataKey="income" name="Entradas" fill="#0f766e" radius={[3, 3, 0, 0]} /><Bar dataKey="expenses" name="Saídas" fill="#e11d48" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
            ) : <EmptyReport />}
          </TabsContent>
        </Tabs>
      </DashboardCard>
    </div>
  );
}

function EmptyReport() {
  return <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center"><WalletCards size={32} className="text-muted-foreground/50" /><p className="text-sm font-medium">Ainda não há movimentos neste período</p><p className="text-xs text-muted-foreground">Os gráficos aparecem assim que registares uma entrada ou despesa.</p></div>;
}

function ReportState({ message, loading, action }: { message: string; loading?: boolean; action?: React.ReactNode }) {
  return <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">{loading && <Loader2 size={20} className="animate-spin" />}<p>{message}</p>{action}</div>;
}

function titleCase(value: string) {
  return value.charAt(0).toLocaleUpperCase("pt-PT") + value.slice(1);
}
