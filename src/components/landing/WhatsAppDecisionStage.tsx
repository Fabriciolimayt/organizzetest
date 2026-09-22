import { ArrowDownRight, FileText, ListPlus, ReceiptText, ScanLine, Tag, Wallet, type LucideIcon } from "lucide-react";

import LandingScene from "./LandingScene";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";
import PixelReveal from "./PixelReveal";
import { formatLandingMoney } from "./formatLandingMoney";
import "./interpretation.css";

export type WhatsAppDecisionStageProps = {
  demo: LandingDemo;
  locale?: PublicLocale;
};

const StepTitle = ({ number, title, icon: Icon }: { number: number; title: string; icon: LucideIcon }) => (
  <h3 className="interpretation-step-title">
    <span className="interpretation-step-number" aria-hidden="true">{String(number).padStart(2, "0")}</span>
    <Icon aria-hidden="true" />
    {title}
  </h3>
);

export default function WhatsAppDecisionStage({ demo, locale = "pt-PT" }: WhatsAppDecisionStageProps) {
  const copy = getLandingCopy(locale);
  const scene = copy.scenes.whatsapp;
  const receiptLabel = copy.sourceLabels.receipt;
  const receiptTitle = locale === "pt-BR" ? "Comprovante sintético" : "Recibo sintético";
  const variableLabel = locale === "pt-BR" ? "Gastos variáveis" : "Despesas variáveis";
  const money = (value: number) => formatLandingMoney(value, demo.currency, locale);
  const source = demo.sources.find((item) => item.label === copy.sourceLabels.whatsapp);
  const category = demo.categories.find((item) => item.amount >= (source?.amount ?? 0)) ?? demo.categories[0];

  // The fixture has aggregates, not linked transactions: this is one synthetic expense already included in the month.
  const example = source && category && source.amount > 0 && category.amount > 0
    ? { amount: Math.min(source.amount, category.amount), category: localizeDemoLabel(category.label, locale) }
    : null;
  const before = example ? Math.round((demo.available + example.amount) * 100) / 100 : null;

  return (
    <LandingScene
      id="whatsapp"
      scene="whatsapp"
      labelledBy="whatsapp-title"
      className="interpretation-scene"
      innerClassName="interpretation-inner"
    >
      <header className="interpretation-heading" data-motion="whatsapp-heading">
        <p className="interpretation-eyebrow">{scene.eyebrow}</p>
        <PixelReveal as="h2" id="whatsapp-title" className="interpretation-title" text={scene.title} />
        <p className="interpretation-description">{scene.description}</p>
      </header>

      <div className="interpretation-stage" data-motion="whatsapp-stage">
          <ol aria-label="Da origem ao disponível" className="interpretation-sequence">
            <li data-step="input" data-motion="whatsapp-input" className="interpretation-input">
              <div className="interpretation-input-title" data-motion="whatsapp-source-title">
                <StepTitle number={1} title={copy.sourceLabels.whatsapp} icon={FileText} />
              </div>
              {example ? (
                <>
                  <div className="interpretation-source interpretation-text-plane" data-context-shift="-12">
                    <figure aria-label="Texto de exemplo" data-motion="whatsapp-text">
                      <figcaption className="interpretation-source-label">Texto</figcaption>
                      <p className="interpretation-typed-input">
                        Gastei <span className="interpretation-money">{money(example.amount)}</span> em {example.category}.
                        <span className="interpretation-caret" aria-hidden="true" />
                      </p>
                    </figure>
                  </div>
                  <div className="interpretation-source interpretation-receipt-plane" data-context-shift="12">
                    <figure aria-label={receiptTitle} className="interpretation-receipt" data-motion="whatsapp-receipt">
                      <figcaption className="interpretation-source-label">
                        <ReceiptText aria-hidden="true" />
                        {receiptLabel}
                      </figcaption>
                      <p className="interpretation-receipt-category">{example.category}</p>
                      <dl>
                        <div className="interpretation-receipt-total">
                          <dt>Total</dt>
                          <dd className="interpretation-money">{money(example.amount)}</dd>
                        </div>
                      </dl>
                      <span className="interpretation-receipt-rule" aria-hidden="true" />
                    </figure>
                  </div>
                  <p className="interpretation-input-note" data-motion="whatsapp-source-note">Duas formas da mesma despesa.</p>
                </>
              ) : (
                <p className="interpretation-empty" data-motion="whatsapp-empty">Sem exemplo de despesa neste conjunto demonstrativo.</p>
              )}
            </li>

            <li data-step="interpretation" data-motion="whatsapp-interpretation" className="interpretation-panel">
              <div className="interpretation-panel-meta">
                <p>Organizze / Interpretação</p>
                <p>Exemplo sintético</p>
              </div>
              <StepTitle number={2} title="Interpretação" icon={ScanLine} />
              <dl className="interpretation-extracted">
                <div>
                  <dt>Despesa</dt>
                  <dd className="interpretation-extracted-value">
                    {example ? money(example.amount) : "Sem valor"}
                  </dd>
                </div>
              </dl>
              <p className="interpretation-proposal">
                <ScanLine aria-hidden="true" />
                {example ? "Proposta a confirmar" : "Sem proposta"}
              </p>
              {example && <span className="interpretation-scan" data-scan-beam aria-hidden="true" />}
            </li>

            <li data-step="category" data-motion="whatsapp-category" className="interpretation-result interpretation-category">
              <StepTitle number={3} title="Categoria" icon={Tag} />
              <p className="interpretation-result-value">{example?.category ?? "Sem categoria"}</p>
              <p className="interpretation-result-note">{example ? "Proposta de categoria" : "Sem proposta"}</p>
            </li>

            <li data-step="transaction" data-motion="whatsapp-transaction" className="interpretation-result interpretation-transaction">
              <StepTitle number={4} title="Lançamento" icon={ListPlus} />
              <p className="interpretation-result-value interpretation-money interpretation-expense">
                {example ? money(example.amount) : "Sem valor"}
              </p>
              <p className="interpretation-result-note">{example ? "Após confirmação" : "Sem lançamento"}</p>
              <p className="interpretation-result-note">{variableLabel}</p>
            </li>

            <li data-step="available" data-motion="whatsapp-available" className="interpretation-result interpretation-available">
              <StepTitle number={5} title="Disponível" icon={Wallet} />
              <p className={`interpretation-result-value interpretation-money${demo.available < 0 ? " interpretation-expense" : ""}`}>{money(demo.available)}</p>
              {before !== null && (
                <dl className="interpretation-before">
                  <div>
                    <dt>Antes deste exemplo</dt>
                    <dd className="interpretation-money">{money(before)}</dd>
                  </div>
                </dl>
              )}
              <p className="interpretation-result-note interpretation-confirmed">
                <ArrowDownRight aria-hidden="true" />
                {example ? "Após confirmação" : "Total demonstrativo"}
              </p>
            </li>
          </ol>
        <p className="interpretation-summary" data-motion="whatsapp-summary">
          {example
            ? `Texto e ${receiptLabel.toLocaleLowerCase(locale)} ilustrativos, com valores do mês demonstrativo. A despesa já está incluída no total do mês.`
            : "Dados demonstrativos, sem ligação a uma conta pessoal."}
        </p>
      </div>
    </LandingScene>
  );
}
