import { useRef, useState } from "react";

import LandingHeader from "@/components/LandingHeader";
import AvailableAmountStage from "@/components/landing/AvailableAmountStage";
import BrandSignature from "@/components/landing/BrandSignature";
import CentralPromise from "@/components/landing/CentralPromise";
import FinancialPrelude from "@/components/landing/FinancialPrelude";
import FutureCommitmentsStage from "@/components/landing/FutureCommitmentsStage";
import MonthlyDashboardStage from "@/components/landing/MonthlyDashboardStage";
import PlanningStage from "@/components/landing/PlanningStage";
import PricingStage from "@/components/landing/PricingStage";
import SourceConvergence from "@/components/landing/SourceConvergence";
import TrustStage from "@/components/landing/TrustStage";
import WhatsAppDecisionStage from "@/components/landing/WhatsAppDecisionStage";
import { getLandingCopy, resolvePublicLocale } from "@/components/landing/landingCopy";
import { landingDemo } from "@/components/landing/landingDemo";
import { useLandingMotion } from "@/components/landing/useLandingMotion";
import "@/components/landing/reference.css";

function initialLocale() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem("organizze.locale");
  } catch {
    // Private browsing can disable storage while the public page remains usable.
  }
  return resolvePublicLocale(stored === "pt" ? "pt-PT" : stored, navigator.language);
}

const Index = () => {
  const landingRef = useRef<HTMLElement>(null);
  const [locale] = useState(initialLocale);
  const copy = getLandingCopy(locale);
  useLandingMotion(landingRef);

  return (
    <div className="landing-page min-h-screen bg-background text-foreground" lang={locale}>
      <LandingHeader copy={copy} />
      <main ref={landingRef}>
        <FinancialPrelude demo={landingDemo} locale={locale} />
        <CentralPromise copy={copy} />
        <div id="metodo" className="scroll-mt-20">
          <MonthlyDashboardStage demo={landingDemo} locale={locale} />
        </div>
        <WhatsAppDecisionStage demo={landingDemo} locale={locale} />
        <AvailableAmountStage demo={landingDemo} locale={locale} />
        <SourceConvergence demo={landingDemo} locale={locale} />
        <PricingStage locale={locale} />
        <FutureCommitmentsStage demo={landingDemo} locale={locale} />
        <PlanningStage demo={landingDemo} locale={locale} />
        <div id="privacidade" className="scroll-mt-20">
          <TrustStage locale={locale} />
        </div>
        <BrandSignature demo={landingDemo} locale={locale} />
      </main>
    </div>
  );
};

export default Index;
