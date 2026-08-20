import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Plus,
  PiggyBank,
  Home,
  TrendingUp,
  Sparkles,
  Layers,
  Target,
  BarChart3,
  MessageCircle,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import MetricStrip from "@/components/dashboard/MetricStrip";
import PageHeader from "@/components/dashboard/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { monthRange } from "@/lib/finance/month";
// Tour handled globally by TourProvider

// ---- Types & helpers ----
type CategoryKey = DashboardCategoryKey;

interface Category {
  key: CategoryKey;
  label: string;
  pct: number;
  color: string;
  icon: React.ReactNode;
}

type Expense = DashboardExpenseV2;

const DEFAULT_CATEGORIES: Category[] = [
  { key: "necessidades", label: "Necessidades", pct: 40, color: "#6b7280", icon: <Home size={16} /> },
  { key: "fundo", label: "Fundo Emergência", pct: 10, color: "#10b981", icon: <PiggyBank size={16} /> },
  { key: "investimentos", label: "Investimentos", pct: 10, color: "#3b82f6", icon: <TrendingUp size={16} /> },
  { key: "lazer", label: "Lazer & Entretenimento", pct: 25, color: "#a855f7", icon: <Sparkles size={16} /> },
  { key: "subscricoes", label: "Subscrições", pct: 10, color: "#ef4444", icon: <Layers size={16} /> },
  { key: "objetivo", label: "Obj. Curto Prazo", pct: 5, color: "#f59e0b", icon: <Target size={16} /> },
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

// ---- Donut chart ----
const Donut = ({ data, size = 160 }: { data: { value: number; color: string }[]; size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2;
  const inner = radius * 0.62;
  let acc = 0;
  const slices = data.map((d, i) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = radius + radius * Math.cos(start);
    const y1 = radius + radius * Math.sin(start);
    const x2 = radius + radius * Math.cos(end);
    const y2 = radius + radius * Math.sin(end);
    const x3 = radius + inner * Math.cos(end);
    const y3 = radius + inner * Math.sin(end);
    const x4 = radius + inner * Math.cos(start);
    const y4 = radius + inner * Math.sin(start);
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
    return <path key={i} d={path} fill={d.color} />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
    </svg>
  );
};

// (tour steps now defined in src/components/tour/TourProvider.tsx)


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

  // Tour is now handled globally by TourProvider — local triggers removed.

  // Derived totals
  const spentByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.category] = (m[e.category] ?? 0) + e.amount;
    return m;
  }, [expenses]);

  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSubscricoes = spentByCat["subscricoes"] ?? 0;
  const orcamentoSubs = (salary * (cats.find((c) => c.key === "subscricoes")?.pct ?? 0)) / 100;
  const saldo = salary - totalDespesas;

  const activeCategory = cats.find((c) => c.key === activeCat)!;
  const activeOrcamento = (salary * activeCategory.pct) / 100;
  const activeGasto = spentByCat[activeCat] ?? 0;
  const filteredExpenses = expenses.filter((e) => e.category === activeCat);

  const removeExpense = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      setExpenseToDelete(null);
      toast({ title: "Despesa eliminada" });
    } catch (error) {
      toast({ title: "Não foi possível eliminar", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
  })();

  if (financialContext.isLoading || transactionQuery.isLoading || budgetQuery.isLoading) {
    return <DashboardDataState message="A carregar os teus dados financeiros..." />;
  }
  if (financialContext.error || transactionQuery.error || budgetQuery.error) {
    return <DashboardDataState message="Não foi possível carregar os dados financeiros." action={<Button variant="outline" onClick={() => { void financialContext.refetch(); void transactionQuery.refetch(); void budgetQuery.refetch(); }}>Tentar novamente</Button>} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Global tour overlay is rendered by TourProvider */}

      {/* Greeting */}
      <PageHeader
        eyebrow={greeting}
        title={`${name || "Olá"}, vamos cuidar do teu dinheiro.`}
        description="Uma leitura simples do que entrou, saiu e ainda está disponível este mês."
        actions={<Button asChild><Link to="/dashboard/lancamentos"><Plus size={16} /> Novo lançamento</Link></Button>}
      />

      {/* KPI grid */}
      <MetricStrip items={[
        { label: "Saldo disponível", value: formatMoney(saldo, sym), detail: "Depois de todas as despesas deste mês", variant: saldo < 0 ? "negative" : "default" },
        { label: "Despesas", value: formatMoney(totalDespesas, sym), detail: `${expenses.length} registada${expenses.length === 1 ? "" : "s"}`, variant: "negative" },
        { label: "Rendimento", value: formatMoney(salary, sym), detail: salary === 0 ? <Link to="/dashboard/orcamento" className="text-primary hover:underline">Configurar rendimento</Link> : "Base do orçamento", variant: "positive" },
        { label: "Subscrições", value: formatMoney(totalSubscricoes, sym), detail: `Orçamento: ${formatMoney(orcamentoSubs, sym)}`, variant: "accent" },
      ]} featured />

      <section className="grid border border-foreground bg-card lg:grid-cols-[minmax(0,1fr)_320px]" aria-label="Decisão financeira do mês">
        <div className="p-5 sm:p-7">
          <p className="font-mono text-[10px] font-semibold uppercase text-data-blue">Leitura do mês / 01</p>
          <h2 className="editorial-display mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            {salary === 0 ? "O teu plano começa por uma referência." : saldo >= 0 ? "Há margem. Agora decide onde ela faz diferença." : "O mês pede uma decisão antes da próxima despesa."}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            {salary === 0 ? "Define o rendimento mensal para transformar lançamentos dispersos numa leitura útil." : `${Math.max(0, allocatedPercentage).toLocaleString(context?.locale ?? "pt-PT", { maximumFractionDigits: 1 })}% do rendimento já está distribuído pelo teu orçamento.`}
          </p>
        </div>
        <div className="ink-panel m-0 rounded-none border-0 p-5 sm:p-7">
          <p className="font-mono text-[10px] font-semibold uppercase text-marker">Próxima decisão</p>
          <p className="editorial-display mt-7 text-2xl font-semibold leading-tight">
            {salary === 0 ? "Dar um ponto de partida ao mês." : activeGasto > activeOrcamento ? `Rever ${activeCategory.label.toLowerCase()}.` : `Acompanhar ${activeCategory.label.toLowerCase()}.`}
          </p>
          <p className="mt-3 text-sm leading-6 text-white/55">{salary === 0 ? "Leva menos de um minuto." : `${formatMoney(Math.abs(activeOrcamento - activeGasto), sym)} ${activeGasto > activeOrcamento ? "acima" : "ainda disponíveis"}.`}</p>
          <Button asChild className="mt-8 w-full border-marker !bg-marker !text-foreground shadow-none hover:!bg-marker/90" data-tour="salario">
            <Link to="/dashboard/orcamento">{salary > 0 ? "Abrir orçamento" : "Criar orçamento"}<ArrowRight size={16} /></Link>
          </Button>
        </div>
      </section>

      {/* Plans pill row */}
      <div data-tour="planos" className="flex items-center justify-between border-y border-border px-1 py-3">
        <button className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-primary">
          <Layers size={14} /> {budgetQuery.data?.name ?? "Sem plano"}
        </button>
        <Link to="/dashboard/orcamento" className="focus-ring flex min-h-11 items-center gap-1.5 px-3 text-sm text-primary hover:underline"><Plus size={14} /> Gerir</Link>
      </div>

      {/* Salary CTA banner */}
      {salary === 0 && (
        <div className="surface-panel flex items-center gap-3 border-warning bg-warning-wash p-4">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ArrowRight size={18} />
          </div>
          <div className="flex-1">
            <p className="font-serif font-semibold text-foreground">Começa por definir o teu salário</p>
            <p className="text-xs text-muted-foreground">Sem isso, não conseguimos calcular o teu orçamento.</p>
          </div>
          <Button asChild variant="gold" className="shrink-0 gap-2"><Link to="/dashboard/orcamento"><Target size={16} /> Definir agora</Link></Button>
        </div>
      )}

      {/* Budget card */}
      <DashboardCard className="space-y-4" noPadding>
        <div data-tour="orcamento" className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">O teu orçamento mensal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Selecciona uma categoria para ver os gastos →</p>
          </div>
          <Button asChild variant="default" size="sm" className="rounded-full gap-1.5 shrink-0"><Link to="/dashboard/orcamento"><BarChart3 size={14} /> Dividir</Link></Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Donut data={cats.map((c) => ({ value: c.pct, color: c.color }))} size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">do salário</span>
              <span className="font-serif text-xl font-semibold">{allocatedPercentage.toLocaleString(context?.locale ?? "pt-PT", { maximumFractionDigits: 1 })}%</span>
            </div>
          </div>
          <ul className="flex-1 space-y-1.5 text-sm">
            {cats.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="truncate">{c.label}</span>
                </span>
                <span className="font-semibold tabular-nums">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-3 space-y-1.5">
          {cats.map((c) => {
            const orc = (salary * c.pct) / 100;
            const gasto = spentByCat[c.key] ?? 0;
            const restante = orc - gasto;
            const isActive = activeCat === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCat(c.key)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  isActive ? "bg-primary/5 ring-1 ring-primary/40" : "hover:bg-muted/60"
                }`}
              >
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: c.color }}>
                  {c.icon}
                </span>
                <span className="flex-1 text-left text-sm font-medium truncate">{c.label}</span>
                <span className="text-sm font-semibold tabular-nums">{formatMoney(gasto, sym)}</span>
                <span className={`text-xs tabular-nums w-16 text-right ${restante < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {restante >= 0 ? "+" : ""}{formatMoney(restante, sym)}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-primary font-medium pt-1">
          Toca numa categoria para ver as suas despesas
        </p>
        </div>
      </DashboardCard>

      {/* Fixed expenses card */}
      <div data-tour="despesas" className="surface-panel space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif text-xl font-semibold leading-tight">Despesas do mês</h2>
            <span className="bg-orange-100 text-orange-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {activeCategory.label}
            </span>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-lg gap-1.5 shrink-0"
          >
            <Link to="/dashboard/lancamentos"><Plus size={14} /> Adicionar despesa</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ← Clica numa categoria à esquerda <br />
          <span className="text-primary">●</span> A mostrar as despesas da categoria selecionada
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5">
            <BarChart3 size={12} /> Ver despesas avulso
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5 text-primary border-primary/30">
            <MessageCircle size={12} /> Liga o WhatsApp
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {cats.slice(0, 4).map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-colors ${
                activeCat === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.icon} {c.label.split(" ")[0]}
            </button>
          ))}
          <button className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground">
            <Calendar size={12} />
          </button>
        </div>

        <div className="surface-quiet p-4">
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <p className="text-xs text-muted-foreground">{activeCategory.label}</p>
              <p className="font-serif text-lg font-semibold">{formatMoney(activeGasto, sym)}</p>
              <p className="text-[11px] text-muted-foreground">orçamento</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className={`font-serif text-lg font-semibold ${activeOrcamento - activeGasto < 0 ? "text-destructive" : "text-primary"}`}>
                {formatMoney(activeOrcamento - activeGasto, sym)}
              </p>
              <p className="text-[11px] text-muted-foreground">Gasto fixo: {formatMoney(activeGasto, sym)}</p>
            </div>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${activeOrcamento > 0 ? Math.min(100, (activeGasto / activeOrcamento) * 100) : 0}%` }}
            />
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Layers size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sem despesas em {activeCategory.label}</p>
            <p className="text-xs text-muted-foreground">Regista uma despesa para este mês.</p>
            <Link to="/dashboard/lancamentos" className="text-primary text-sm font-medium hover:underline flex items-center gap-1 mt-1"><Plus size={14} /> Adicionar despesa</Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredExpenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: activeCategory.color }}>
                  {activeCategory.icon}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{e.name}</span>
                <span className="text-sm font-semibold tabular-nums">{formatMoney(e.amount, sym)}</span>
                <button type="button" aria-label={`Eliminar ${e.name}`} onClick={() => setExpenseToDelete(e)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={Boolean(expenseToDelete)} onOpenChange={(open) => { if (!open && !deleteTransaction.isPending) setExpenseToDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar despesa?</AlertDialogTitle><AlertDialogDescription>A despesa deixa de aparecer nos totais e relatórios, mas permanece no histórico técnico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteTransaction.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteTransaction.isPending} onClick={(event) => { event.preventDefault(); if (expenseToDelete) void removeExpense(expenseToDelete.id); }}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

const DashboardDataState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
  <div className="mx-auto flex min-h-[360px] max-w-3xl flex-col items-center justify-center gap-3 text-center">
    <p className="text-sm text-muted-foreground">{message}</p>
    {action}
  </div>
);

export default Dashboard;
