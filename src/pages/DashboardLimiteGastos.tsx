import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import MonthSelector from "@/components/dashboard/MonthSelector";

const DashboardLimiteGastos = () => {
  return (
    <DashboardCard>
      <div className="space-y-6 py-2">
        <MonthSelector />

        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum limite de gasto definido em Março 2026.
          </p>
          <Button>Definir limite de gastos</Button>
        </div>
      </div>
    </DashboardCard>
  );
};

export default DashboardLimiteGastos;
