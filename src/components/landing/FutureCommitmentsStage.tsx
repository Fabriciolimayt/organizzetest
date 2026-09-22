import { CalendarDays, CheckCircle2, ChevronDown, CircleAlert, CircleMinus, Repeat2 } from "lucide-react";
import { useState } from "react";

import LandingScene from "./LandingScene";
import { formatLandingMoney } from "./formatLandingMoney";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";
import ProductSurface from "./ProductSurface";
import PixelReveal from "./PixelReveal";

export type FutureCommitmentsStageProps = {
  demo: LandingDemo;
  locale?: PublicLocale;
};

const statusPresentation = {
  safe: { Icon: CheckCircle2, className: "text-financial-income", trackClass: "bg-financial-income" },
  warning: { Icon: CircleAlert, className: "text-financial-warning", trackClass: "bg-financial-warning" },
  expense: { Icon: CircleMinus, className: "text-financial-expense", trackClass: "bg-financial-expense" },
};

const usageFormatters: Record<PublicLocale, Intl.NumberFormat> = {
  "pt-PT": new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }),
  "pt-BR": new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }),
};

const futureCopy = {
  "pt-PT": {
    statuses: { safe: "Dentro do previsto", warning: "A acompanhar", expense: "Comprometido" },
    limits: { safe: "Dentro do limite", warning: "Próximo do limite", expense: "Ultrapassado" },
    spending: "Despesas do mês",
    noCategories: "Sem despesas por categoria.",
    recurringNote: "Incluído nas despesas variáveis do mês",
  },
  "pt-BR": {
    statuses: { safe: "Dentro do planejado", warning: "Acompanhar", expense: "Comprometido" },
    limits: { safe: "Dentro do limite", warning: "Próximo do limite", expense: "Excedido" },
    spending: "Gastos do mês",
    noCategories: "Sem gastos por categoria.",
    recurringNote: "Incluído nos gastos variáveis do mês",
  },
};

const FutureCommitmentsStage = ({ demo, locale = "pt-PT" }: FutureCommitmentsStageProps) => {
  const [showLimits, setShowLimits] = useState(false);
  const copy = getLandingCopy(locale);
  const labels = futureCopy[locale];
  const money = (amount: number) => formatLandingMoney(amount, demo.currency, locale);
  const recurringSources = demo.sources.filter(
    (source) => localizeDemoLabel(source.label, locale) === copy.sourceLabels.recurring,
  );

  return (
    <LandingScene
      id="future"
      scene="future"
      labelledBy="future-title"
      className="reference-future reference-band"
      innerClassName="reference-band__inner"
    >
      <div data-motion="future-heading" className="reference-heading reference-heading--left">
        <p className="public-label text-intelligence">{copy.scenes.future.eyebrow}</p>
        <PixelReveal as="h2" id="future-title" text={copy.scenes.future.title} />
        <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
          {copy.scenes.future.description}
        </p>
      </div>

      <div data-motion="future-stage" data-future-expanded={showLimits} className="mt-12 min-w-0 sm:mt-16">
        <ProductSurface className="min-w-0 overflow-hidden [overflow-wrap:anywhere]">
          <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
            <span className="flex min-w-0 items-center gap-3 text-sm font-medium">
              <CalendarDays className="size-4 shrink-0 text-intelligence" aria-hidden="true" />
              {copy.scenes.future.eyebrow}
            </span>
            <span className="public-label text-muted-foreground">Dados demonstrativos</span>
          </header>

          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section aria-labelledby="future-agenda-title" className="min-w-0 px-5 py-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
                <h3 id="future-agenda-title" className="text-lg font-semibold">Agenda de compromissos</h3>
                <dl>
                  <dt className="text-xs text-muted-foreground">Total comprometido</dt>
                  <dd className="financial-value mt-2 text-2xl">{money(demo.committed)}</dd>
                </dl>
              </div>
              <ul className="divide-y divide-border">
                {demo.upcoming.map((item) => {
                  const { Icon, className } = statusPresentation[item.status];
                  return (
                    <li key={`${item.label}-${item.date}`} data-status={item.status} data-motion="future-commitment" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="min-w-0">
                        <p className="financial-value text-xs text-muted-foreground">{item.date}</p>
                        <p className="mt-2 text-sm font-medium">{localizeDemoLabel(item.label, locale)}</p>
                      </div>
                      <div className="min-w-0 sm:text-right">
                        <p className="financial-value text-base">{money(item.amount)}</p>
                        <span className={`mt-2 inline-flex max-w-full items-start gap-2 text-xs ${className}`}>
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          {labels.statuses[item.status]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {demo.upcoming.length === 0 && <p className="py-6 text-sm text-muted-foreground">Sem compromissos previstos.</p>}
              {recurringSources.map((source) => (
                <div key={source.label} className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-t border-border pt-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm"><Repeat2 className="size-4 shrink-0 text-intelligence" aria-hidden="true" />{copy.sourceLabels.recurring}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{labels.recurringNote}</p>
                  </div>
                  <p className="financial-value max-w-full text-sm">{money(source.amount)}</p>
                </div>
              ))}
            </section>

            <button type="button" className="reference-limits-toggle" aria-expanded={showLimits} aria-controls="future-limits" onClick={() => setShowLimits(!showLimits)}>Limites por categoria<ChevronDown size={15} aria-hidden="true" style={{ transform: showLimits ? "rotate(180deg)" : undefined }} /></button>
            <section id="future-limits" aria-labelledby="future-limits-title" className="min-w-0 border-t border-border bg-card px-5 py-6 sm:p-8 lg:border-l lg:border-t-0">
              <h3 id="future-limits-title" className="text-lg font-semibold">Limites por categoria</h3>
              <p className="mt-2 text-sm text-muted-foreground">{labels.spending}</p>
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {demo.categories.map((category) => {
                  const label = localizeDemoLabel(category.label, locale);
                  const limit = demo.limits?.find((item) => item.category === category.label);
                  if (!limit || !Number.isFinite(limit.amount) || limit.amount <= 0) {
                    return (
                      <li key={category.label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                        <p className="min-w-0 text-sm">{label}</p>
                        <p className="financial-value max-w-full text-sm">{money(category.amount)}</p>
                        <p className="w-full text-xs text-muted-foreground">Limite não definido</p>
                      </li>
                    );
                  }

                  // Match calculateLimitProgress's rounding and thresholds without
                  // loading the private dependencies of useFinancialControlsV2.
                  const percentage = Number(((Math.max(0, category.amount) / limit.amount) * 100).toFixed(2));
                  const status = percentage > 100 ? "expense" : percentage >= 80 ? "warning" : "safe";
                  const usage = `${usageFormatters[locale].format(percentage)}% utilizado`;
                  const { Icon, className, trackClass } = statusPresentation[status];

                  return (
                    <li key={category.label} data-status={status} className="min-w-0 py-4">
                      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                        <p className="min-w-0 text-sm font-medium">{label}</p>
                        <p className="financial-value max-w-full text-sm">
                          {money(category.amount)} <span className="text-muted-foreground">de {money(limit.amount)}</span>
                        </p>
                      </div>
                      <meter
                        aria-label={label}
                        min={0}
                        max={100}
                        value={Math.min(percentage, 100)}
                        aria-valuetext={`${money(category.amount)} de ${money(limit.amount)} (${usage})`}
                        className="sr-only"
                      />
                      <div aria-hidden="true" className="mt-3 h-1.5 w-full overflow-hidden bg-border">
                        <div className={`h-full ${trackClass}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                      <div className={`mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 text-xs ${className}`}>
                        <span className="inline-flex items-start gap-2"><Icon className="size-4 shrink-0" aria-hidden="true" />{labels.limits[status]}</span>
                        <span className="financial-value max-w-full">{usage}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {demo.categories.length === 0 && <p className="py-5 text-sm text-muted-foreground">{labels.noCategories}</p>}
              <p className="mt-5 text-sm leading-6 text-muted-foreground">Valores fictícios, apenas para demonstração.</p>
            </section>
          </div>
        </ProductSurface>
      </div>
    </LandingScene>
  );
};

export default FutureCommitmentsStage;
