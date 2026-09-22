import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import LandingScene from "./LandingScene";
import { formatLandingMoney as formatMoney } from "./formatLandingMoney";
import type { PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";

import "./opening.css";

export type FinancialPreludeProps = { demo: LandingDemo; locale?: PublicLocale };
type UpcomingStatus = LandingDemo["upcoming"][number]["status"];
type PreludePresentation = {
  sceneLabel: string;
  contextLabel: string;
  primaryLabel: string;
  detailsLabel: string;
  monthlyView: string;
  demoData: string;
  metrics: { income: string; committed: string; variable: string; reserved: string };
  available: string;
  availableExplanation: string;
  spendingRhythm: string;
  seriesSummary: string;
  chartLabel: string;
  categoryAllocation: string;
  upcomingCommitments: string;
  detailsAction: string;
  upcomingCount: (count: number) => string;
  statuses: Record<UpcomingStatus, string>;
};

const preludePresentation: Record<PublicLocale, PreludePresentation> = {
  "pt-PT": {
    sceneLabel: "Visão financeira demonstrativa da Organizze",
    contextLabel: "Contexto financeiro demonstrativo",
    primaryLabel: "Resumo demonstrativo do mês",
    detailsLabel: "Categorias e compromissos demonstrativos",
    monthlyView: "Visão mensal",
    demoData: "Dados demonstrativos",
    metrics: { income: "Rendimentos", committed: "Compromissos", variable: "Despesas variáveis", reserved: "Reservado" },
    available: "Disponível",
    availableExplanation: "Depois de compromissos, despesas variáveis e objetivos reservados.",
    spendingRhythm: "Ritmo das despesas",
    seriesSummary: "Série demonstrativa de despesas",
    chartLabel: "Ritmo das despesas demonstrativo",
    categoryAllocation: "Distribuição por categoria",
    upcomingCommitments: "Próximos compromissos",
    detailsAction: "Detalhes do mês",
    upcomingCount: (count) => `${count} ${count === 1 ? "previsto" : "previstos"}`,
    statuses: { safe: "Dentro do previsto", warning: "A acompanhar", expense: "Comprometido" },
  },
  "pt-BR": {
    sceneLabel: "Visão financeira demonstrativa da Organizze",
    contextLabel: "Contexto financeiro demonstrativo",
    primaryLabel: "Resumo demonstrativo do mês",
    detailsLabel: "Categorias e compromissos demonstrativos",
    monthlyView: "Visão mensal",
    demoData: "Dados demonstrativos",
    metrics: { income: "Receitas", committed: "Compromissos", variable: "Gastos variáveis", reserved: "Reservado" },
    available: "Disponível",
    availableExplanation: "Depois de compromissos, gastos variáveis e objetivos reservados.",
    spendingRhythm: "Ritmo dos gastos",
    seriesSummary: "Série demonstrativa de gastos",
    chartLabel: "Ritmo dos gastos demonstrativo",
    categoryAllocation: "Distribuição por categoria",
    upcomingCommitments: "Próximos compromissos",
    detailsAction: "Detalhes do mês",
    upcomingCount: (count) => `${count} ${count === 1 ? "previsto" : "previstos"}`,
    statuses: { safe: "Dentro do planejado", warning: "Acompanhar", expense: "Comprometido" },
  },
};

const chartWidth = 720;
const chartHeight = 208;
const chartTones = ["#A0A0A0", "#888888", "#737373", "#606060", "#4D4D4D", "#3A3A3A"];

const seriesPoints = (series: readonly number[]) => {
  const minimum = Math.min(...series);
  const maximum = Math.max(...series);
  const range = Math.max(maximum - minimum, 1);
  const lastIndex = Math.max(series.length - 1, 1);
  return series.map((value, index) => {
    const x = (index / lastIndex) * chartWidth;
    const y = chartHeight - ((value - minimum) / range) * (chartHeight - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
};

const FinancialPrelude = ({ demo, locale = "pt-PT" }: FinancialPreludeProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const labels = preludePresentation[locale];
  const categoryTotal = demo.categories.reduce((sum, category) => sum + category.amount, 0);
  const categoryMaximum = Math.max(1, ...demo.categories.map((category) => category.amount));
  const seriesSummary = demo.monthlySeries.map((value) => formatMoney(value, demo.currency, locale)).join(", ");
  const metrics = [
    { label: labels.metrics.income, value: demo.income },
    { label: labels.metrics.committed, value: demo.committed },
    { label: labels.metrics.variable, value: demo.variable },
    { label: labels.metrics.reserved, value: demo.reserved },
  ];
  let allocationOffset = 0;

  return (
    <LandingScene id="prelude" scene="prelude" labelledBy="prelude-title" className="opening-prelude" innerClassName="opening-prelude__content">
      <p id="prelude-title" className="sr-only">{labels.sceneLabel}</p>
      <div className="opening-prelude__window">
        <div data-motion="prelude-stage" className="opening-prelude__stage">
          <div data-prelude-layer="context" data-motion="prelude-context" className="opening-prelude__context">
            <section aria-label={labels.contextLabel} className="opening-chart-plane opening-chart-plane--donut">
              <p className="opening-chart-plane__label">{labels.monthlyView}</p>
              <div className="opening-prelude__donut">
                <svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label={labels.categoryAllocation} aria-describedby="prelude-category-summary">
                  {demo.categories.map((category, index) => {
                    const share = categoryTotal > 0 ? category.amount / categoryTotal * 100 : 0;
                    const offset = allocationOffset;
                    allocationOffset += share;
                    return <circle key={category.label} cx="100" cy="100" r="78" pathLength="100" fill="none" stroke={chartTones[index % chartTones.length]} strokeWidth="27" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" />;
                  })}
                </svg>
                <div className="opening-prelude__donut-value" aria-hidden="true">
                  <span className="financial-value">{formatMoney(demo.variable, demo.currency, locale)}</span>
                  <span>{labels.metrics.variable}</span>
                </div>
              </div>
            </section>
            <dl className="opening-prelude__context-values">
              {metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd className="financial-value">{formatMoney(metric.value, demo.currency, locale)}</dd></div>)}
            </dl>
          </div>

          <div data-prelude-layer="primary" data-motion="prelude-primary" className="opening-prelude__primary">
            <section aria-label={labels.primaryLabel} className="opening-chart-plane opening-chart-plane--line">
              <div className="opening-prelude__metric">
                <p className="opening-chart-plane__label">{labels.available}</p>
                <p className="financial-value opening-prelude__available">{formatMoney(demo.available, demo.currency, locale)}</p>
                <p className="sr-only">{labels.availableExplanation}</p>
              </div>
              <div data-prelude-chart className="opening-prelude__line">
                <div className="opening-prelude__line-label">
                  <p>{labels.spendingRhythm}</p>
                  <span className="financial-value">{formatMoney(demo.monthlySeries[demo.monthlySeries.length - 1] ?? 0, demo.currency, locale)}</span>
                </div>
                <p id="spending-series-summary" className="sr-only">{labels.seriesSummary}: {seriesSummary}.</p>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width={chartWidth} height={chartHeight} preserveAspectRatio="none" role="img" aria-label={labels.chartLabel} aria-describedby="spending-series-summary">
                  {[52, 104, 156, 207].map((y) => <line key={y} x1="0" x2={chartWidth} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" vectorEffect="non-scaling-stroke" />)}
                  <polyline points={seriesPoints(demo.monthlySeries)} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <span className="opening-prelude__demo-label">{labels.demoData}</span>
            </section>
            <button type="button" aria-expanded={detailsExpanded} aria-controls="prelude-details-content" className="focus-ring opening-prelude__details-toggle" onClick={() => setDetailsExpanded((expanded) => !expanded)}>
              {labels.detailsAction}
              <ChevronDown aria-hidden="true" className={cn("size-3.5", detailsExpanded && "rotate-180")} />
            </button>
          </div>

          <div data-prelude-layer="details" data-motion="prelude-details" className="opening-prelude__categories">
            <section aria-label={labels.detailsLabel} className="opening-chart-plane opening-chart-plane--bars">
              <p className="opening-chart-plane__label">{labels.metrics.variable}</p>
              <svg viewBox="0 0 240 196" width="240" height="196" aria-hidden="true" className="opening-prelude__bars">
                {demo.categories.map((category, index) => {
                  const step = 240 / Math.max(demo.categories.length, 1);
                  const height = category.amount / categoryMaximum * 176;
                  return <rect key={category.label} x={index * step + step * 0.2} y={196 - height} width={step * 0.36} height={height} fill={chartTones[index % chartTones.length]} />;
                })}
              </svg>
              <p className="opening-prelude__upcoming-count">{labels.upcomingCount(demo.upcoming.length)}</p>
            </section>
          </div>
        </div>
      </div>

      <div id="prelude-details-content" data-expanded={detailsExpanded} className={detailsExpanded ? "opening-prelude__details" : "sr-only"}>
        <section aria-labelledby="category-allocation-title">
          <h2 id="category-allocation-title" className="opening-prelude__details-title">{labels.categoryAllocation}</h2>
          <dl id="prelude-category-summary" className="opening-prelude__category-list">
            {demo.categories.map((category) => <div key={category.label}><dt>{localizeDemoLabel(category.label, locale)}</dt><dd className="financial-value">{formatMoney(category.amount, demo.currency, locale)}</dd></div>)}
          </dl>
        </section>
        <section aria-labelledby="upcoming-commitments-title">
          <h2 id="upcoming-commitments-title" className="opening-prelude__details-title">{labels.upcomingCommitments}</h2>
          <div className="opening-prelude__commitments">
            {demo.upcoming.map((commitment) => {
              const label = localizeDemoLabel(commitment.label, locale);
              return (
                <article key={`${label}-${commitment.date}`} aria-label={label}>
                  <div><span>{label}</span><span className="financial-value">{formatMoney(commitment.amount, demo.currency, locale)}</span></div>
                  <div className="opening-prelude__commitment-meta"><span>{commitment.date}</span><span>{labels.statuses[commitment.status]}</span></div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </LandingScene>
  );
};

export default FinancialPrelude;
