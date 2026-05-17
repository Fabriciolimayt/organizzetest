import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Download,
  CreditCard,
  Wallet,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import QuickActionButton from "@/components/dashboard/QuickActionButton";
import EmptyState from "@/components/dashboard/EmptyState";
import TourOverlay, { TourStep } from "@/components/dashboard/TourOverlay";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const tourSteps: TourStep[] = [
  { emoji: "👋", title: "Bem-vindo às tuas finanças!", body: "Vamos mostrar-te como funciona em menos de 1 minuto. Podes saltar a qualquer momento." },
  { emoji: "💰", title: "Define o teu rendimento", body: "Começa aqui. Indica quanto recebes por mês, depois de impostos — é a base de todo o orçamento.", target: '[data-tour="quick-receita"]' },
  { emoji: "📊", title: "Divide o teu dinheiro", body: "Escolhe como distribuir o teu salário pelas categorias. Usa um plano pronto ou personaliza.", target: '[data-tour="nav-orcamento"]' },
  { emoji: "📋", title: "Regista despesas fixas", body: "Adiciona despesas mensais fixas — renda, subscrições, ginásio. O dashboard atualiza em tempo real.", target: '[data-tour="quick-despesa"]' },
  { emoji: "🔀", title: "Planos de orçamento", body: "Simula meses com rendimentos diferentes — freelance, férias. Alterna com um clique.", target: '[data-tour="nav-planos"]' },
  { emoji: "👥", title: "Orçamento partilhado", body: "Cria um grupo com o teu parceiro, família ou colega de casa. Partilham o mesmo orçamento e despesas.", target: '[data-tour="nav-grupos"]' },
  { emoji: "📱", title: "Integração WhatsApp", body: "Liga o teu WhatsApp ou vê os registos feitos pelo WhatsApp aqui. Um toque para ligar, uma mensagem para registar.", target: '[data-tour="nav-whatsapp"]' },
  { emoji: "❓", title: "Precisas de ajuda?", body: "Este botão fica sempre aqui. Clica a qualquer momento para repetir este tutorial do início.", target: '[data-tour="help"]' },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <DashboardCard className="lg:col-span-2">
          <div className="py-2">
            <h2 className="text-lg font-bold text-foreground">Boa tarde, Usuário!</h2>
            <div className="flex flex-wrap gap-6 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Receitas no mês atual</p>
                <p className="text-xl font-bold text-primary">R$ 0,00</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas no mês atual</p>
                <p className="text-xl font-bold text-destructive">R$ 0,00</p>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard title="Acesso rápido">
          <div className="flex items-center justify-around py-2">
            <QuickActionButton icon={<ArrowDownCircle size={20} />} label="Despesa" />
            <QuickActionButton icon={<ArrowUpCircle size={20} />} label="Receita" />
            <QuickActionButton icon={<ArrowLeftRight size={20} />} label="Transf." />
            <QuickActionButton icon={<Download size={20} />} label="Importar" />
          </div>
        </DashboardCard>
      </div>

      {/* Row 2 - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Minhas contas */}
        <DashboardCard
          title="Minhas contas"
          headerRight={<span className="text-sm text-muted-foreground">Saldo geral</span>}
        >
          <EmptyState
            icon={<Wallet size={40} />}
            message="Adicione sua primeira conta"
            action={
              <Button variant="outline" size="sm">
                Gerenciar contas
              </Button>
            }
          />
        </DashboardCard>

        {/* Meus cartões */}
        <DashboardCard
          title="Meus cartões"
          headerRight={<span className="text-sm text-muted-foreground">Todas as faturas</span>}
        >
          <EmptyState
            icon={<CreditCard size={40} />}
            message="Adicione seu primeiro cartão"
            action={
              <Button variant="outline" size="sm">
                Gerenciar cartões
              </Button>
            }
          />
        </DashboardCard>

        {/* Contas a pagar */}
        <DashboardCard title="Contas a pagar">
          <EmptyState message="No momento você não possui contas a pagar" />
        </DashboardCard>

        {/* Maiores gastos */}
        <DashboardCard title="Maiores gastos do mês atual">
          <EmptyState message="Nenhum gasto registrado neste mês" />
        </DashboardCard>

        {/* Contas a receber */}
        <DashboardCard title="Contas a receber">
          <EmptyState message="No momento você não possui contas a receber" />
        </DashboardCard>

        {/* Limite de gastos */}
        <DashboardCard title="Limite de gastos de Março">
          <EmptyState message="Nenhum limite de gasto definido" />
        </DashboardCard>
      </div>

      {/* Blog Content */}
      <DashboardCard title="Conteúdos do blog">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Como organizar suas finanças em 2026
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Descubra dicas práticas para começar o ano com o pé direito nas suas finanças pessoais.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                5 hábitos financeiros para adotar agora
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Pequenas mudanças no dia a dia que fazem toda a diferença no final do mês.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DashboardCard>
    </div>
  );
};

export default Dashboard;
