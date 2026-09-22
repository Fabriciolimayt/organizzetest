import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";
import { formatLandingMoney } from "./formatLandingMoney";
import type { FinancialSceneModel, FinancialSceneController } from "./financialSceneRenderer";
import "./financial-scene.css";

export type FinancialSceneProps = {
  demo: LandingDemo;
  locale?: PublicLocale;
  className?: string;
};

export function FinancialScene({ demo, locale = "pt-PT", className }: FinancialSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const historyId = useId();
  const chartLabel = locale === "pt-BR" ? "Evolu\u00e7\u00e3o dos gastos demonstrativos" : "Evolu\u00e7\u00e3o das despesas demonstrativas";
  const [ready, setReady] = useState(false);
  const model = useMemo<FinancialSceneModel>(() => {
    const money = (value: number) => formatLandingMoney(value, demo.currency, locale);
    return {
      money,
      title: locale === "pt-BR" ? "O m\u00eas em perspectiva" : "O m\u00eas em perspetiva",
      demonstration: "Dados de demonstra\u00e7\u00e3o",
      historyLabel: "Hist\u00f3rico",
      availableLabel: "Dispon\u00edvel para gastar",
      categoriesLabel: "Despesas por categoria",
      sequenceLabel: "Sequ\u00eancia do hist\u00f3rico",
      referenceLabel: "Refer\u00eancias do m\u00eas",
      emptyLabel: "Sem valores neste per\u00edodo",
      available: demo.available,
      variable: demo.variable,
      history: [...demo.monthlySeries],
      categories: demo.categories.map((item) => ({ ...item, label: localizeDemoLabel(item.label, locale) })),
      references: [
        { label: locale === "pt-BR" ? "Receitas" : "Rendimentos", amount: demo.income, color: "#66DFA6" },
        { label: "Compromissos", amount: demo.committed, color: "#F4C56A" },
        { label: "Despesas", amount: demo.variable, color: "#FF7C6B" },
      ],
    };
  }, [demo, locale]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let started = false;
    let controller: FinancialSceneController | undefined;
    setReady(false);

    const load = async () => {
      if (cancelled || started) return;
      started = true;
      try {
        const { createFinancialScene } = await import("./financialSceneRenderer");
        if (cancelled) return;
        controller = createFinancialScene({
          host,
          model,
          onReady: () => { if (!cancelled) setReady(true); },
          onError: () => { if (!cancelled) setReady(false); },
        });
      } catch {
        if (!cancelled) setReady(false);
      }
    };

    const nearby = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          nearby?.disconnect();
          void load();
        }
      },
      { rootMargin: "320px 0px" },
    );
    if (nearby) nearby.observe(host);
    else void load();

    return () => {
      cancelled = true;
      nearby?.disconnect();
      controller?.dispose();
    };
  }, [model]);

  const values = [...model.history, ...model.references.map((item) => item.amount), 0];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values, 1);
  const y = (value: number) => 190 - ((value - minimum) / (maximum - minimum)) * 170;
  const points = model.history.map((value, index) =>
    `${32 + (index / Math.max(1, model.history.length - 1)) * 516},${y(value)}`,
  ).join(" ");
  const maxCategory = Math.max(1, ...model.categories.map((item) => item.amount));

  return (
    <figure className={["financial-scene", className].filter(Boolean).join(" ")} data-financial-scene data-ready={ready} aria-label={`${model.title}. ${model.demonstration}.`}>
      <div ref={hostRef} className="financial-scene__viewport" aria-hidden="true" />
      <div className="financial-scene__fallback">
        <div className="financial-scene__history">
          <p className="financial-scene__eyebrow">Organizze / {model.demonstration}</p>
          <h3>{model.title}</h3>
          <svg width="580" height="224" viewBox="0 0 580 224" role="img" aria-label={chartLabel} aria-describedby={historyId}>
            {[20, 76, 133, 190].map((line) => <line key={line} x1="32" x2="548" y1={line} y2={line} stroke="#232323" />)}
            {model.references.map((item) => <line key={item.label} x1="32" x2="548" y1={y(item.amount)} y2={y(item.amount)} stroke={item.color} strokeWidth="2" strokeDasharray="4 5" />)}
            <polyline points={points} fill="none" stroke="#69D7FF" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {model.history.map((value, index) => <circle key={index} cx={32 + (index / Math.max(1, model.history.length - 1)) * 516} cy={y(value)} r="2.5" fill="#69D7FF" />)}
          </svg>
          <p className="financial-scene__eyebrow">{model.sequenceLabel} / {model.referenceLabel}</p>
          <dl className="financial-scene__legend">
            <div><dt><i style={{ background: "#69D7FF" }} />{model.historyLabel}</dt><dd>{model.history.length ? model.money(model.history[model.history.length - 1]) : model.emptyLabel}</dd></div>
            {model.references.map((item) => <div key={item.label}><dt><i style={{ background: item.color }} />{item.label}</dt><dd>{model.money(item.amount)}</dd></div>)}
          </dl>
          <ol id={historyId} className="financial-scene__accessible" aria-label={model.historyLabel}>
            {model.history.map((value, index) => <li key={index}>{index + 1}: {model.money(value)}</li>)}
          </ol>
        </div>
        <div className="financial-scene__available">
          <h3>{model.availableLabel}</h3>
          <p className="financial-scene__value">{model.money(model.available)}</p>
          <p className="financial-scene__eyebrow">{model.demonstration}</p>
        </div>
        <div className="financial-scene__categories">
          <h3>{model.categoriesLabel}</h3>
          <p className="financial-scene__subtotal">{model.money(model.variable)}</p>
          <dl className="financial-scene__bars">
            {model.categories.map((item, index) => <div key={`${item.label}-${index}`}>
              <dt>{item.label}</dt><dd>{model.money(item.amount)}</dd>
              <span aria-hidden="true" style={{ width: `${Math.max(0, item.amount / maxCategory) * 100}%` }} />
            </div>)}
          </dl>
          {!model.categories.length && <p>{model.emptyLabel}</p>}
        </div>
      </div>
    </figure>
  );
}

export default FinancialScene;
