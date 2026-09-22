import { CalendarDays, ChartNoAxesCombined, Ellipsis, PanelLeft, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandingScene from "./LandingScene";
import PixelReveal from "./PixelReveal";
import { DemoBars, DemoLineChart } from "./DemoCharts";
import { formatLandingMoney } from "./formatLandingMoney";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";

export type MonthlyDashboardStageProps = { demo: LandingDemo; locale?: PublicLocale };
const tabs = [{ value: "overview", label: "Visão mensal" }, { value: "categories", label: "Categorias" }, { value: "commitments", label: "Compromissos" }, { value: "goals", label: "Objetivos" }];

export default function MonthlyDashboardStage({ demo, locale = "pt-PT" }: MonthlyDashboardStageProps) {
  const copy = getLandingCopy(locale).scenes.month;
  const money = (amount: number) => formatLandingMoney(amount, demo.currency, locale);
  const status = locale === "pt-BR" ? { safe: "Dentro do planejado", warning: "Acompanhar", expense: "Comprometido" } : { safe: "Dentro do previsto", warning: "A acompanhar", expense: "Comprometido" };
  const total = demo.categories.reduce((sum, category) => sum + category.amount, 0);
  return <LandingScene id="month" scene="month" labelledBy="month-title" className="reference-month">
    <div className="reference-heading" data-motion="scene-heading"><PixelReveal id="month-title" as="h2" text={copy.title} /><p>{copy.description}</p></div>
    <Tabs defaultValue="overview" className="reference-dashboard-tabs">
      <TabsList aria-label="Navegação do mês demonstrativo" className="reference-tab-list">{tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}</TabsList>
      <div className="reference-dashboard reference-surface" data-motion="month-dashboard">
        <div className="reference-windowbar"><span><PanelLeft size={14} aria-hidden="true" /> Organizze <Ellipsis size={15} aria-hidden="true" /></span><span>Setembro · EUR</span><span>Dados demonstrativos</span></div>
        <div className="reference-dashboard-content"><h3>{locale === "pt-BR" ? "O mês em perspectiva" : "O mês em perspetiva"}</h3>
          <TabsContent value="overview" className="reference-tab-panel">
            <div className="reference-chart-grid">
              <section className="reference-chart-main" aria-label="Evolução das despesas"><p>Despesas do mês</p><strong className="financial-value">{money(demo.variable)}</strong><span className="reference-caption"> Total organizado</span><DemoLineChart values={demo.monthlySeries} label="Despesas ao longo do ano" /></section>
              <section className="reference-chart-bars" aria-label="Distribuição por categoria"><p>Distribuição por categoria</p><strong className="financial-value">{demo.categories.length} categorias</strong><DemoBars values={demo.categories.map(category => category.amount)} label="Despesas por categoria" firstLabel={demo.categories[0]?.label ?? ""} lastLabel={demo.categories[demo.categories.length - 1]?.label ?? ""} /></section>
              <dl className="reference-small-metrics">{[{label:"Disponível",value:demo.available},{label:"Comprometido",value:demo.committed},{label:"Reservado",value:demo.reserved},{label:"Categorias",value:demo.categories.length}].map(item => <div key={item.label}><dt>{item.label}</dt><dd className="financial-value">{item.label === "Categorias" ? item.value : money(item.value)}</dd></div>)}</dl>
              <section className="reference-ledger" aria-label="Próximos compromissos"><h4><CalendarDays size={14} aria-hidden="true" /> Próximos compromissos</h4><div className="reference-ledger-head"><span>Descrição</span><span>Data</span><span>Valor</span></div>{demo.upcoming.map(item => <div key={item.label} className="reference-ledger-row"><span>{localizeDemoLabel(item.label, locale)}</span><span>{item.date}</span><span className="financial-value">{money(item.amount)}</span></div>)}</section>
            </div>
          </TabsContent>
          <TabsContent value="categories" className="reference-tab-panel"><div className="reference-categories">{demo.categories.map(item => <article key={item.label}><h4>{localizeDemoLabel(item.label, locale)}</h4><span className="financial-value">{money(item.amount)}</span><div className="reference-track" aria-hidden="true"><i style={{transform:`scaleX(${total > 0 ? item.amount / total : 0})`}} /></div></article>)}</div></TabsContent>
          <TabsContent value="commitments" className="reference-tab-panel">{demo.upcoming.map(item => <article key={item.label} className="reference-commitment-row"><CalendarDays size={16} aria-hidden="true" /><div><h4>{localizeDemoLabel(item.label, locale)}</h4><p>{item.date} · {status[item.status]}</p></div><span className="financial-value">{money(item.amount)}</span></article>)}</TabsContent>
          <TabsContent value="goals" className="reference-tab-panel"><p className="reference-goal-total"><Target size={16} aria-hidden="true" /> Reservado para objetivos <strong className="financial-value">{money(demo.reserved)}</strong></p>{demo.goals.map(goal => <article key={goal.label} className="reference-goal-row"><h4>{goal.label}</h4><p>{money(goal.amount)} de {money(goal.target)}</p><div className="reference-track" aria-hidden="true"><i style={{transform:`scaleX(${goal.target > 0 ? Math.min(1, Math.max(0, goal.amount / goal.target)) : 0})`}} /></div></article>)}</TabsContent>
        </div>
        <div className="reference-dashboard-foot"><ChartNoAxesCombined size={14} aria-hidden="true" /><span>{locale === "pt-BR" ? "Seu mês, em um só lugar." : "O teu mês, num só lugar."}</span></div>
      </div>
    </Tabs>
  </LandingScene>;
}
