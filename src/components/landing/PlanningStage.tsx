import { Goal, UsersRound, WalletCards } from "lucide-react";

import LandingScene from "./LandingScene";
import { formatLandingMoney } from "./formatLandingMoney";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";
import ProductSurface from "./ProductSurface";
import PixelReveal from "./PixelReveal";

export type PlanningStageProps = {
  demo: LandingDemo;
  locale?: PublicLocale;
};

const planningCopy = {
  "pt-PT": {
    income: "Rendimentos esperados", variable: "Despesas variáveis",
    spaces: "Espaços partilhados", sharedAmount: "Despesas com origem partilhada",
    sharedNote: "Incluído nas despesas variáveis do mês, sem somar duas vezes.",
    emptySpaces: "Sem despesas partilhadas neste mês.",
    budgetNote: "Com os rendimentos, despesas e reservas deste mês demonstrativo.",
  },
  "pt-BR": {
    income: "Receitas esperadas", variable: "Gastos variáveis",
    spaces: "Espaços compartilhados", sharedAmount: "Gastos com origem compartilhada",
    sharedNote: "Incluído nos gastos variáveis do mês, sem somar duas vezes.",
    emptySpaces: "Sem gastos compartilhados neste mês.",
    budgetNote: "Com as receitas, gastos e reservas deste mês demonstrativo.",
  },
};

const PlanningStage = ({ demo, locale = "pt-PT" }: PlanningStageProps) => {
  const copy = getLandingCopy(locale);
  const labels = planningCopy[locale];
  const money = (amount: number) => formatLandingMoney(amount, demo.currency, locale);
  const sharedSources = demo.sources.filter(
    (source) => localizeDemoLabel(source.label, locale) === copy.sourceLabels.shared,
  );
  const budget = [
    { label: labels.income, amount: demo.income, tone: "text-financial-income" },
    { label: "Compromissos", amount: demo.committed, tone: "text-financial-expense" },
    { label: labels.variable, amount: demo.variable, tone: "text-financial-expense" },
    { label: "Reservado para objetivos", amount: demo.reserved, tone: "text-intelligence" },
  ];

  return (
    <LandingScene
      id="planning"
      scene="planning"
      labelledBy="planning-title"
      className="reference-planning reference-band"
    >
      <div data-motion="planning-heading" className="reference-heading">
        <p className="public-label text-intelligence">{copy.scenes.planning.eyebrow}</p>
        <PixelReveal as="h2" id="planning-title" text={copy.scenes.planning.title} />
        <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">{copy.scenes.planning.description}</p>
      </div>

      <div data-motion="planning-stage" data-planning-surface className="mt-12 min-w-0 sm:mt-16">
        <ProductSurface className="min-w-0 overflow-hidden [overflow-wrap:anywhere]">
          <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
            <span className="text-sm font-medium">{copy.scenes.planning.eyebrow}</span>
            <span className="public-label text-muted-foreground">Dados demonstrativos</span>
          </header>

          <section aria-labelledby="planning-budget-title" data-motion="planning-budget" className="grid min-w-0 gap-6 px-5 py-6 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <div className="min-w-0">
              <WalletCards className="size-5 text-intelligence" aria-hidden="true" />
              <h3 id="planning-budget-title" className="mt-4 text-xl font-semibold">Orçamento do mês</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{labels.budgetNote}</p>
            </div>
            <dl className="min-w-0 divide-y divide-border">
              {budget.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-3 first:pt-0">
                  <dt className="text-sm text-muted-foreground">{item.label}</dt>
                  <dd className={`financial-value max-w-full text-base ${item.tone}`}>{money(item.amount)}</dd>
                </div>
              ))}
              <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-4 pt-5">
                <dt className="text-sm font-medium">Disponível</dt>
                <dd className="financial-value max-w-full text-2xl text-foreground">{money(demo.available)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="planning-goals-title" data-motion="planning-goals" className="grid min-w-0 gap-6 border-t border-border bg-card px-5 py-6 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <div className="min-w-0">
              <Goal className="size-5 text-intelligence" aria-hidden="true" />
              <h3 id="planning-goals-title" className="mt-4 text-xl font-semibold">Objetivos</h3>
              <dl className="mt-4">
                <dt className="text-sm text-muted-foreground">Reservado neste mês</dt>
                <dd className="financial-value mt-2 text-xl text-intelligence">{money(demo.reserved)}</dd>
              </dl>
            </div>
            <ul className="min-w-0 divide-y divide-border">
              {demo.goals.map((goal) => {
                const label = localizeDemoLabel(goal.label, locale);
                const hasTarget = goal.target > 0;
                const boundedAmount = hasTarget ? Math.max(0, Math.min(goal.amount, goal.target)) : 0;
                return (
                  <li key={goal.label} className="min-w-0 py-5 first:pt-0 last:pb-0">
                    <h4 className="text-sm font-medium">{label}</h4>
                    <p className="financial-value mt-2 text-sm text-muted-foreground">{money(goal.amount)}{hasTarget && <> de {money(goal.target)}</>}</p>
                    {hasTarget ? (
                      <>
                        <meter aria-label={label} min={0} max={goal.target} value={boundedAmount} aria-valuetext={`${money(goal.amount)} de ${money(goal.target)}`} className="sr-only" />
                        <div aria-hidden="true" className="mt-4 h-1.5 w-full overflow-hidden bg-border">
                          <div className="h-full bg-intelligence" style={{ width: `${(boundedAmount / goal.target) * 100}%` }} />
                        </div>
                      </>
                    ) : <p className="mt-3 text-xs text-muted-foreground">Meta não definida</p>}
                  </li>
                );
              })}
              {demo.goals.length === 0 && <li className="text-sm text-muted-foreground">Sem objetivos definidos.</li>}
            </ul>
          </section>

          <section aria-labelledby="planning-spaces-title" data-motion="planning-spaces" className="grid min-w-0 gap-6 border-t border-border px-5 py-6 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <div className="min-w-0">
              <UsersRound className="size-5 text-intelligence" aria-hidden="true" />
              <h3 id="planning-spaces-title" className="mt-4 text-xl font-semibold">{labels.spaces}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{labels.sharedNote}</p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{labels.sharedAmount}</p>
              {sharedSources.length ? (
                <dl className="mt-5 divide-y divide-border border-y border-border">
                  {sharedSources.map((source) => (
                    <div key={source.label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-4 py-4">
                      <dt className="text-sm font-medium">{localizeDemoLabel(source.label, locale)}</dt>
                      <dd className="financial-value max-w-full text-xl">{money(source.amount)}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="mt-4 text-sm text-muted-foreground">{labels.emptySpaces}</p>}
            </div>
          </section>
        </ProductSurface>
      </div>
    </LandingScene>
  );
};

export default PlanningStage;
