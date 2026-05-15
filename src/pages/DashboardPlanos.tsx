import { useState } from "react";
import { Plus, Plane, Wallet, PiggyBank, Check } from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";

const initialPlans = [
  { id: 1, name: "Mês normal", icon: Wallet, split: "50/30/20", income: 1800, active: true },
  { id: 2, name: "Mês de férias", icon: Plane, split: "40/40/20", income: 1800, active: false },
  { id: 3, name: "Modo poupança", icon: PiggyBank, split: "55/15/30", income: 1800, active: false },
];

const DashboardPlanos = () => {
  const [plans, setPlans] = useState(initialPlans);

  const activate = (id: number) =>
    setPlans(plans.map((p) => ({ ...p, active: p.id === id })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Planos de orçamento</h2>
          <p className="text-sm text-muted-foreground">
            Crie cenários diferentes e alterne entre eles instantaneamente.
          </p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Novo plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const Icon = p.icon;
          return (
            <DashboardCard key={p.id} className={p.active ? "ring-2 ring-primary" : ""}>
              <div className="space-y-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon size={20} />
                  </div>
                  {p.active && (
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <Check size={12} /> Ativo
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.split} · R$ {p.income.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant={p.active ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => activate(p.id)}
                  disabled={p.active}
                >
                  {p.active ? "Em uso" : "Ativar plano"}
                </Button>
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPlanos;
