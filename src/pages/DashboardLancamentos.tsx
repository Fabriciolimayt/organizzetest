import { Search } from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import MonthSelector from "@/components/dashboard/MonthSelector";
import EmptyState from "@/components/dashboard/EmptyState";

const DashboardLancamentos = () => {
  return (
    <DashboardCard>
      <div className="space-y-6 py-2">
        <MonthSelector />

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Empty state */}
        <EmptyState message="Nenhuma movimentação no período" />

        {/* Footer summary */}
        <div className="flex justify-end gap-8 border-t border-border pt-4 text-sm">
          <div className="text-right">
            <p className="text-muted-foreground">Saldo</p>
            <p className="font-semibold text-foreground">R$ 0,00</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Previsto</p>
            <p className="font-semibold text-foreground">R$ 0,00</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default DashboardLancamentos;
