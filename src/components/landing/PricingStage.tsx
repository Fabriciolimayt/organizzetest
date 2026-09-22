import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { PointerEvent } from "react";

import { SUBSCRIPTION_OFFERS } from "@/lib/subscription/offers";
import { cn } from "@/lib/utils";

import LandingScene from "./LandingScene";
import PixelReveal from "./PixelReveal";
import Logo from "@/components/Logo";
import ProductSurface from "./ProductSurface";
import { getLandingCopy, type PublicLocale } from "./landingCopy";

export type PricingStageProps = { locale?: PublicLocale };

const pricingLabels = {
  "pt-PT": {
    billing: "Subscrição mensal",
    price: "Preço apresentado no checkout",
    priceDetail: "Confirma o valor na moeda da tua conta antes de subscrever.",
    trial: "Novas contas começam com 15 dias de período experimental.",
    lifetime: "Acesso vitalício já atribuído à conta mantém-se, sem renovação.",
    test: "Modo de teste, quando ativo, é identificado na página de assinatura.",
  },
  "pt-BR": {
    billing: "Assinatura mensal",
    price: "Preço apresentado no checkout",
    priceDetail: "Confira o valor na moeda da sua conta antes de assinar.",
    trial: "Novas contas começam com 15 dias de período de teste.",
    lifetime: "Acesso vitalício já atribuído à conta é mantido, sem renovação.",
    test: "Modo de teste, quando ativo, é identificado na página de assinatura.",
  },
} satisfies Record<PublicLocale, Record<string, string>>;

const reflect = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--reflection", `${20 + ((event.clientX - bounds.left) / bounds.width) * 60}%`);
};

const PricingStage = ({ locale = "pt-PT" }: PricingStageProps) => {
  const copy = getLandingCopy(locale);
  const labels = pricingLabels[locale];

  return (
    <LandingScene
      id="plans"
      scene="plans"
      labelledBy="plans-title"
      className="reference-plans"
    >
      <header className="reference-heading" data-motion="plans-heading">
        <PixelReveal as="h2" id="plans-title" text={copy.scenes.plans.title} />
        <p>
          {copy.scenes.plans.description}
        </p>
      </header>

      <div className="reference-trial" data-motion="plans-trial" onPointerMove={reflect}
        onPointerLeave={(event) => event.currentTarget.style.removeProperty("--reflection")}>
        <div className="reference-trial__metal">
          <Logo size="sm" />
          <p className="reference-trial__days">15<span>dias</span></p>
          <p>{locale === "pt-BR" ? "O seu mês, mais claro." : "O teu mês, mais claro."}</p>
        </div>
        <Link to="/auth" className="reference-trial__link">{copy.primaryCta}<ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
      <p className="reference-caption reference-trial__note">{labels.trial}</p>

      <div className="mt-12 min-w-0 sm:mt-16" data-motion="plans-stage">
        <ProductSurface className="reference-plan-comparison grid min-w-0 overflow-hidden md:grid-cols-2">
          {SUBSCRIPTION_OFFERS.map((offer) => {
            const featured = offer.id === "premium";

            return (
              <article
                key={offer.id}
                aria-labelledby={`plan-${offer.id}-title`}
                className={cn(
                  "flex min-w-0 flex-col p-6 [overflow-wrap:anywhere] sm:p-8",
                  featured
                    ? "border-t border-border md:border-l md:border-t-0"
                    : "",
                )}
              >
                <p className="public-label text-muted-foreground">{labels.billing}</p>
                <h3
                  id={`plan-${offer.id}-title`}
                  className={cn("mt-4 font-semibold leading-tight text-foreground", featured ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}
                >
                  {offer.name}
                </h3>
                <p className="public-body mt-4 text-muted-foreground">{offer.description}</p>
                <ul className="my-8 flex-1 divide-y divide-border border-y border-border">
                  {offer.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 py-4 text-body text-foreground">
                      <Check className="mt-1 size-4 shrink-0 text-financial-income" aria-hidden="true" />
                      <span className="min-w-0">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-body font-semibold text-foreground">{labels.price}</p>
                <p className="public-body mt-2 text-muted-foreground">{labels.priceDetail}</p>
              </article>
            );
          })}
        </ProductSurface>
      </div>

      <div className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 sm:gap-10">
        <p className="public-body text-muted-foreground">{labels.lifetime}</p>
        <p className="public-body text-muted-foreground">{labels.test}</p>
      </div>
    </LandingScene>
  );
};

export default PricingStage;
