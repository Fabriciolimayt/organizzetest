import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import LandingScene from "./LandingScene";
import FinancialScene from "./FinancialScene";
import PixelReveal from "./PixelReveal";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import type { LandingDemo } from "./landingDemo";

export type BrandSignatureProps = { demo: LandingDemo; locale?: PublicLocale };

const BrandSignature = ({ demo, locale = "pt-PT" }: BrandSignatureProps) => {
  const copy = getLandingCopy(locale);
  return (
    <LandingScene id="signature" scene="signature" labelledBy="signature-title" className="reference-signature">
      <div className="reference-heading" data-motion="signature-promise">
        <PixelReveal as="h2" id="signature-title" text={copy.finalStatement} />
        <p>{copy.scenes.signature.description}</p>
        <Button asChild className="reference-cta"><Link to="/auth">{copy.primaryCta}<ArrowRight aria-hidden="true" /></Link></Button>
      </div>
      <div className="reference-financial-scene" data-motion="signature-graph">
        <FinancialScene demo={demo} locale={locale} />
        <p className="reference-caption">Dados demonstrativos</p>
      </div>
      <div className="reference-wordmark" data-motion="signature-wordmark">
        <PixelReveal as="p" text="Organizze" />
      </div>
      <footer className="reference-footer">
        <div data-motion="signature-mark"><Logo markOnly size="sm" /></div>
        <span>Organizze</span>
        <Button asChild variant="ghost"><Link to="/auth">{copy.header.signIn}<ArrowRight aria-hidden="true" /></Link></Button>
      </footer>
    </LandingScene>
  );
};
export default BrandSignature;
