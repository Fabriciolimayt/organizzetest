import { Filter, PieChart, BarChart3, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCard from "@/components/dashboard/DashboardCard";
import MonthSelector from "@/components/dashboard/MonthSelector";
import EmptyState from "@/components/dashboard/EmptyState";

const DashboardRelatorios = () => {
  return (
    <DashboardCard>
      <div className="space-y-6 py-2">
        <MonthSelector />

        <Tabs defaultValue="categorias">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="entradas-saidas">Entradas x Saídas</TabsTrigger>
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="categorias">
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Categorias</span>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter size={14} />
                  Filtros
                </Button>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                <button className="p-1.5 rounded text-primary bg-card shadow-sm">
                  <PieChart size={16} />
                </button>
                <button className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <BarChart3 size={16} />
                </button>
              </div>
            </div>

            <EmptyState
              icon={<FileSearch size={56} />}
              message="Nenhum lançamento no período"
            />
          </TabsContent>

          <TabsContent value="entradas-saidas">
            <EmptyState message="Nenhum lançamento no período" />
          </TabsContent>
          <TabsContent value="contas">
            <EmptyState message="Nenhum lançamento no período" />
          </TabsContent>
          <TabsContent value="tags">
            <EmptyState message="Nenhum lançamento no período" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardCard>
  );
};

export default DashboardRelatorios;
