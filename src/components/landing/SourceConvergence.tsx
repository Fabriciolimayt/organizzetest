import { MessageCircle, PenLine, ReceiptText, Repeat2, UsersRound, WalletCards } from "lucide-react";
import type { ComponentType, CSSProperties, SVGProps } from "react";
import Logo from "@/components/Logo";
import LandingScene from "./LandingScene";
import PixelReveal from "./PixelReveal";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import { localizeDemoLabel, type LandingDemo } from "./landingDemo";
import { formatLandingMoney } from "./formatLandingMoney";

export type SourceConvergenceProps = { demo: LandingDemo; locale?: PublicLocale };
const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "Registo manual": PenLine, Recibo: ReceiptText, "Regra recorrente": Repeat2,
  "Espaço partilhado": UsersRound, WhatsApp: MessageCircle,
};

const SourceConvergence = ({ demo, locale = "pt-PT" }: SourceConvergenceProps) => {
  const copy = getLandingCopy(locale).scenes.sources;
  const money = (amount: number) => formatLandingMoney(amount, demo.currency, locale);
  const total = demo.sources.reduce((sum, item) => sum + item.amount, 0);
  const angleStep = 360 / Math.max(1, demo.sources.length);
  return (
    <LandingScene id="sources" scene="sources" labelledBy="sources-title" className="reference-sources">
      <div className="reference-heading" data-motion="scene-heading">
        <PixelReveal as="h2" id="sources-title" text={copy.title} />
        <p>{copy.description}</p>
      </div>
      <div className="source-network" aria-label="Origens das despesas" data-motion="source-ledger">
        <div className="source-network__lines" aria-hidden="true">
          {demo.sources.map((source, index) => <span key={source.label} style={{ "--source-angle": `${index * angleStep - 90}deg` } as CSSProperties} />)}
        </div>
        <div className="source-network__mark" data-source-mark aria-hidden="true"><Logo markOnly /></div>
        {demo.sources.map((source, index) => {
          const Icon = icons[source.label] ?? WalletCards;
          const angle = (index * angleStep - 90) * Math.PI / 180;
          return <article key={source.label} className="source-network__node" data-source-node
            style={{ "--source-x": Math.cos(angle), "--source-y": Math.sin(angle) } as CSSProperties}>
            <Icon aria-hidden="true" />
            <h3>{localizeDemoLabel(source.label, locale)}</h3>
            <p className="financial-value">{money(source.amount)}</p>
          </article>;
        })}
      </div>
      <dl className="source-network__totals" data-motion="source-totals">
        <div><dt>Total consolidado</dt><dd>{money(total)}</dd></div>
        <div><dt>Disponível depois de organizar</dt><dd>{money(demo.available)}</dd></div>
      </dl>
      <p className="reference-caption">Dados demonstrativos</p>
    </LandingScene>
  );
};
export default SourceConvergence;
