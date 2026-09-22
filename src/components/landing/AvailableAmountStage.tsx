import { Equal, Minus, Wallet } from "lucide-react";

import LandingScene from "./LandingScene";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import type { LandingDemo } from "./landingDemo";
import PixelReveal from "./PixelReveal";
import { formatLandingMoney } from "./formatLandingMoney";
import "./interpretation.css";

export type AvailableAmountStageProps = {
  demo: LandingDemo;
  locale?: PublicLocale;
};

export default function AvailableAmountStage({ demo, locale = "pt-PT" }: AvailableAmountStageProps) {
  const scene = getLandingCopy(locale).scenes.available;
  const money = (value: number) => formatLandingMoney(value, demo.currency, locale);
  const terms = [
    { key: "income", label: locale === "pt-BR" ? "Rendas esperadas" : "Rendimentos esperados", amount: demo.income },
    { key: "committed", label: "Custos comprometidos", amount: demo.committed },
    { key: "variable", label: locale === "pt-BR" ? "Gastos variáveis" : "Despesas variáveis", amount: demo.variable },
    { key: "reserved", label: "Objetivos reservados", amount: demo.reserved },
  ];
  const equation = [...terms.map((term) => money(term.amount)), money(demo.available)];
  const equationLabel = `${terms.map((term) => `${term.label}: ${money(term.amount)}`).join(" menos ")} igual a ${money(demo.available)} disponível.`;

  return (
    <LandingScene
      id="available"
      scene="available"
      labelledBy="available-title"
      className="interpretation-scene available-context-scene"
      innerClassName="interpretation-inner"
    >
      <header className="interpretation-heading" data-motion="available-heading">
        <p className="interpretation-eyebrow">{scene.eyebrow}</p>
        <PixelReveal as="h2" id="available-title" className="interpretation-title" text={scene.title} />
        <p className="interpretation-description">{scene.description}</p>
      </header>

      <div className="available-context-stage" data-motion="available-stage">
        <div className="available-context-meta" data-motion="available-context-label">
          <p>Leitura do mês</p>
          <p>Dados demonstrativos</p>
        </div>

        <div className="available-context-composition">
          <div className="available-context-terms" role="group" aria-label="Componentes do cálculo">
            {terms.map((term, index) => (
              <dl key={term.key} className="available-context-plane" data-context-shift={index % 2 === 0 ? "-10" : "10"}>
                <div className="available-context-row" data-motion={`available-${term.key}`}>
                  <dt>
                    <span className="available-context-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {term.label}
                  </dt>
                  <dd className={`interpretation-money${index === 0 ? " available-context-income" : ""}`}>
                    {index > 0 && <Minus aria-hidden="true" />}
                    {money(term.amount)}
                  </dd>
                </div>
              </dl>
            ))}
          </div>

          <div className="available-answer" data-motion="available-value">
            <Wallet className="available-answer-icon" aria-hidden="true" />
            <dl>
              <div className="available-answer-content">
                <dt>Disponível</dt>
                <dd className={`available-answer-value${demo.available < 0 ? " interpretation-expense" : ""}`}>
                  {money(demo.available)}
                </dd>
              </div>
            </dl>
            <p className="available-answer-note">
              {locale === "pt-BR" ? "Com os dados registrados." : "Com os dados registados."}
            </p>
          </div>
        </div>

        <div className="available-context-calculation" data-motion="available-equation">
          <h3>Cálculo do disponível</h3>
          <p role="math" aria-label={equationLabel} className="available-context-equation interpretation-money">
            {equation.map((value, index) => (
              <span key={terms[index]?.key ?? "available"} className="available-context-operand">
                {index > 0 && <span className="available-context-operator" aria-hidden="true">{index === equation.length - 1 ? "=" : "−"}{" "}</span>}
                <span>{value}</span>{" "}
              </span>
            ))}
          </p>
        </div>

        <p className="available-context-note" data-motion="available-note">
          <Equal aria-hidden="true" />
          <span>Se faltarem movimentos ou compromissos, o disponível pode mudar. Este valor não é uma garantia de saldo bancário.</span>
        </p>
      </div>
    </LandingScene>
  );
}
