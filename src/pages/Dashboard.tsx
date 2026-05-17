import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Tour handled globally by TourProvider

// ---- Types & helpers ----
type CategoryKey =
  | "necessidades"
  | "fundo"
  | "investimentos"
  | "lazer"
  | "subscricoes"
  | "objetivo";

interface Category {
  key: CategoryKey;
  label: string;
  pct: number;
  color: string;
  icon: React.ReactNode;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: CategoryKey;
  fixed: boolean;
  date: string;
}

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
  `${sym}${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
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
  const [params, setParams] = useSearchParams();


  const [currency] = useLocalState<string>("organizze.currency", "EUR");
  const sym = CURRENCY_SYMBOLS[currency] ?? "€";

  const [name] = useLocalState<string>("organizze.name", "");
  const [salary, setSalary] = useLocalState<number>("organizze.salary", 0);
  const [categories, setCategories] = useLocalState<Category[]>(
    "organizze.categories",
    DEFAULT_CATEGORIES,
  );
  // Ensure icons (lost via JSON) are restored
  const cats = useMemo(
    () => categories.map((c) => ({ ...c, icon: DEFAULT_CATEGORIES.find((d) => d.key === c.key)?.icon })),
    [categories],
  );

  const [expenses, setExpenses] = useLocalState<Expense[]>("organizze.expenses", []);
  const [activeCat, setActiveCat] = useState<CategoryKey>("subscricoes");

  // Dialog state
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState("");
  const [expOpen, setExpOpen] = useState(false);
  const [expDraft, setExpDraft] = useState({ name: "", amount: "", category: "subscricoes" as CategoryKey, fixed: true });

  // Tour is now handled globally by TourProvider — local triggers removed.


  // Sync expenses when WhatsApp bot adds new ones
  useEffect(() => {
    const onUpdate = (e: Event) => {
      try {
        const fresh = JSON.parse(localStorage.getItem("organizze.expenses") || "[]");
        setExpenses(fresh);
        const detail = (e as CustomEvent).detail;
        if (detail?.source === "whatsapp") {
          import("@/hooks/use-toast").then(({ toast }) =>
            toast({ title: "✅ Despesa registada via WhatsApp", description: `${detail.added?.length ?? 0} novo(s) item(s)` })
          );
        }
      } catch {}
    };
    window.addEventListener("organizze:expenses-updated", onUpdate);
    return () => window.removeEventListener("organizze:expenses-updated", onUpdate);
  }, [setExpenses]);

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
  const filteredExpenses = expenses.filter((e) => e.category === activeCat && e.fixed);

  const saveSalary = () => {
    const v = Number(salaryDraft.replace(",", "."));
    if (!Number.isNaN(v) && v >= 0) setSalary(v);
    setSalaryOpen(false);
  };

  const addExpense = () => {
    const amt = Number(expDraft.amount.replace(",", "."));
    if (!expDraft.name || Number.isNaN(amt)) return;
    setExpenses([
      ...expenses,
      { id: crypto.randomUUID(), name: expDraft.name, amount: amt, category: expDraft.category, fixed: expDraft.fixed, date: new Date().toISOString() },
    ]);
    setExpDraft({ name: "", amount: "", category: activeCat, fixed: true });
    setExpOpen(false);
  };

  const removeExpense = (id: string) => setExpenses(expenses.filter((e) => e.id !== id));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
  })();

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Global tour overlay is rendered by TourProvider */}

      {/* Greeting */}
      <div className="px-1">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{greeting}</p>
        <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">
          {name || "Olá"}, vamos cuidar do teu dinheiro.
        </h1>
      </div>

      {/* Quick action row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-card border border-border rounded-full px-1 py-1 shadow-sm">
          <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="text-xs font-bold">{(name || "U").slice(0, 1).toUpperCase()}</span>
          </button>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <Button
          data-tour="salario"
          onClick={() => { setSalaryDraft(salary ? String(salary) : ""); setSalaryOpen(true); }}
          className="ml-auto rounded-full shadow-sm gap-2"
        >
          <Sparkles size={16} />
          {salary > 0 ? "Editar salário" : "O meu salário"}
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Rendimento Mensal"
          value={formatMoney(salary, sym)}
          hint={
            salary === 0 ? (
              <button onClick={() => setSalaryOpen(true)} className="text-[11px] font-medium text-amber-600 hover:underline flex items-center gap-1">
                Configura primeiro o teu rendimento <ArrowRight size={12} />
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">Base do orçamento</span>
            )
          }
        />
        <KpiCard
          label="Total de Despesas"
          value={formatMoney(totalDespesas, sym)}
          valueClassName="text-destructive"
          hint={<span className="text-[11px] text-muted-foreground">{expenses.length} despesa{expenses.length === 1 ? "" : "s"} registada{expenses.length === 1 ? "" : "s"}</span>}
        />
        <KpiCard
          label="Subscrições"
          value={formatMoney(totalSubscricoes, sym)}
          hint={<span className="text-[11px] text-muted-foreground">Orçamento: {formatMoney(orcamentoSubs, sym)}</span>}
        />
        <KpiCard
          label="Saldo Disponível"
          value={formatMoney(saldo, sym)}
          valueClassName={saldo < 0 ? "text-destructive" : "text-foreground"}
          hint={<span className="text-[11px] text-muted-foreground">Após todas as despesas</span>}
        />
      </div>

      {/* Plans pill row */}
      <div data-tour="planos" className="flex items-center justify-between bg-card border border-border rounded-full px-2 py-1.5 shadow-sm">
        <button className="flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold rounded-full px-3 py-1.5">
          <Layers size={14} /> Default
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-dashed border-border rounded-full">
          <Plus size={14} /> Novo
        </button>
      </div>

      {/* Salary CTA banner */}
      {salary === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ArrowRight size={18} />
          </div>
          <div className="flex-1">
            <p className="font-serif font-semibold text-foreground">Começa por definir o teu salário</p>
            <p className="text-xs text-muted-foreground">Sem isso, não conseguimos calcular o teu orçamento.</p>
          </div>
          <Button onClick={() => setSalaryOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg gap-2 shrink-0">
            <Target size={16} /> Definir agora
          </Button>
        </div>
      )}

      {/* Budget card */}
      <div data-tour="orcamento" className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">O teu orçamento mensal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Selecciona uma categoria para ver os gastos →</p>
          </div>
          <Button variant="default" size="sm" className="rounded-full gap-1.5 shrink-0">
            <BarChart3 size={14} /> Dividir
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Donut data={cats.map((c) => ({ value: c.pct, color: c.color }))} size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">do salário</span>
              <span className="font-serif text-xl font-semibold">100%</span>
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

      {/* Fixed expenses card */}
      <div data-tour="despesas" className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif text-xl font-semibold leading-tight">Despesas fixas mensais</h2>
            <span className="bg-orange-100 text-orange-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {activeCategory.label}
            </span>
          </div>
          <Button
            onClick={() => { setExpDraft({ ...expDraft, category: activeCat }); setExpOpen(true); }}
            size="sm"
            className="rounded-lg gap-1.5 shrink-0"
          >
            <Plus size={14} /> Adicionar Despesa
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ← Clica numa categoria à esquerda <br />
          <span className="text-primary">●</span> A mostrar apenas despesas mensais fixas
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

        <div className="bg-app-bg rounded-xl p-4">
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
            <p className="text-sm text-muted-foreground">Sem despesas fixas em {activeCategory.label}</p>
            <p className="text-xs text-muted-foreground">Adiciona uma despesa recorrente (mensal)</p>
            <button
              onClick={() => { setExpDraft({ ...expDraft, category: activeCat, fixed: true }); setExpOpen(true); }}
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1 mt-1"
            >
              <Plus size={14} /> Adicionar despesa fixa
            </button>
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
                <button onClick={() => removeExpense(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Salary Dialog */}
      <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Define o teu rendimento mensal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="salary">Valor líquido por mês</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{sym}</span>
              <Input
                id="salary"
                inputMode="decimal"
                value={salaryDraft}
                onChange={(e) => setSalaryDraft(e.target.value)}
                placeholder="0,00"
                className="pl-9 text-lg font-semibold"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">Usaremos este valor para calcular o orçamento de cada categoria.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSalaryOpen(false)}>Cancelar</Button>
            <Button onClick={saveSalary}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Nova despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-name">Descrição</Label>
              <Input id="exp-name" value={expDraft.name} onChange={(e) => setExpDraft({ ...expDraft, name: e.target.value })} placeholder="Ex.: Netflix" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{sym}</span>
                <Input
                  id="exp-amount"
                  inputMode="decimal"
                  value={expDraft.amount}
                  onChange={(e) => setExpDraft({ ...expDraft, amount: e.target.value })}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={expDraft.category} onValueChange={(v) => setExpDraft({ ...expDraft, category: v as CategoryKey })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={expDraft.fixed}
                onChange={(e) => setExpDraft({ ...expDraft, fixed: e.target.checked })}
                className="rounded border-border"
              />
              Despesa fixa mensal (recorrente)
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExpOpen(false)}>Cancelar</Button>
            <Button onClick={addExpense}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  valueClassName = "",
  hint,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className={`font-serif text-2xl font-semibold mt-0.5 tabular-nums ${valueClassName}`}>{value}</p>
    <div className="mt-1">{hint}</div>
  </div>
);

export default Dashboard;
