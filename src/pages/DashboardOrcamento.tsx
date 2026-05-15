import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DashboardCard from "@/components/dashboard/DashboardCard";
import MonthSelector from "@/components/dashboard/MonthSelector";
import { Input } from "@/components/ui/input";
import { Home, Utensils, Car, Heart, Gamepad2, GraduationCap, PiggyBank } from "lucide-react";

const categories = [
  { name: "Moradia", icon: Home, group: "necessidades", spent: 0 },
  { name: "Alimentação", icon: Utensils, group: "necessidades", spent: 0 },
  { name: "Transporte", icon: Car, group: "necessidades", spent: 0 },
  { name: "Saúde", icon: Heart, group: "necessidades", spent: 0 },
  { name: "Lazer", icon: Gamepad2, group: "desejos", spent: 0 },
  { name: "Educação", icon: GraduationCap, group: "desejos", spent: 0 },
  { name: "Poupança", icon: PiggyBank, group: "poupanca", spent: 0 },
];

const presets = [
  { label: "50/30/20", values: [50, 30, 20] },
  { label: "60/20/20", values: [60, 20, 20] },
  { label: "40/30/30", values: [40, 30, 30] },
];

const DashboardOrcamento = () => {
  const [income, setIncome] = useState(1800);
  const [split, setSplit] = useState([50, 30, 20]);

  const setSlider = (idx: number, val: number) => {
    const next = [...split];
    next[idx] = val;
    setSplit(next);
  };

  const total = split[0] + split[1] + split[2];
  const necessidades = (income * split[0]) / 100;
  const desejos = (income * split[1]) / 100;
  const poupanca = (income * split[2]) / 100;

  return (
    <div className="space-y-6">
      <MonthSelector />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard title="Renda mensal">
          <div className="space-y-3 py-2">
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value) || 0)}
              className="text-2xl font-bold h-14"
            />
            <p className="text-xs text-muted-foreground">
              Sua renda líquida mensal. Tudo é calculado a partir daqui.
            </p>
          </div>
        </DashboardCard>

        <DashboardCard title="Modelos de divisão" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 py-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setSplit(p.values)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  split.join("/") === p.values.join("/")
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Divisão do orçamento">
        <div className="space-y-6 py-2">
          {[
            { label: "Necessidades", value: split[0], idx: 0, amount: necessidades, color: "bg-primary" },
            { label: "Desejos", value: split[1], idx: 1, amount: desejos, color: "bg-amber-500" },
            { label: "Poupança", value: split[2], idx: 2, amount: poupanca, color: "bg-blue-500" },
          ].map((row) => (
            <div key={row.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground">
                  {row.value}% · R$ {row.amount.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[row.value]}
                onValueChange={(v) => setSlider(row.idx, v[0])}
                max={100}
                step={5}
              />
            </div>
          ))}
          {total !== 100 && (
            <p className="text-xs text-destructive">
              Total: {total}% — ajuste para somar 100%.
            </p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Categorias (7)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {categories.map((c) => {
            const Icon = c.icon;
            const limit =
              c.group === "necessidades"
                ? necessidades / 4
                : c.group === "desejos"
                ? desejos / 2
                : poupanca;
            const pct = limit ? (c.spent / limit) * 100 : 0;
            return (
              <div key={c.name} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    R$ {c.spent.toFixed(2)} / R$ {limit.toFixed(2)}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
        <div className="pt-4">
          <Button className="w-full sm:w-auto">Salvar orçamento</Button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default DashboardOrcamento;
