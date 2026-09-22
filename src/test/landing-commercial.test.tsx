import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import BrandSignature from "@/components/landing/BrandSignature";
import PricingStage from "@/components/landing/PricingStage";
import { getLandingCopy, type PublicLocale } from "@/components/landing/landingCopy";
import { landingDemo, type LandingDemo } from "@/components/landing/landingDemo";
import { SUBSCRIPTION_OFFERS } from "@/lib/subscription/offers";

afterEach(cleanup);

const originalOffers = [
  {
    id: "pro",
    name: "Pro",
    lookupPrefix: "pro_monthly",
    description: "Ideal para gestão pessoal inteligente e automação total.",
    features: ["Lançamentos ilimitados pelo WhatsApp", "Planos e orçamentos múltiplos", "Espaços familiares compartilhados", "Resumo mensal automatizado"],
  },
  {
    id: "premium",
    name: "Premium Elite",
    lookupPrefix: "premium_monthly",
    description: "Para quem exige leitura profunda e acompanhamento de ponta.",
    features: ["Todas as funcionalidades do Pro", "Leitura avançada de recibos por IA", "Relatórios e comparativos trimestrais", "Suporte prioritário e auditoria"],
  },
];

const renderCommercial = (locale?: PublicLocale, demo: LandingDemo = landingDemo) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PricingStage locale={locale} />
      <BrandSignature demo={demo} locale={locale} />
    </MemoryRouter>,
  );

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("shared subscription offers", () => {
  it("preserves every existing commercial field exactly, without adding a price", () => {
    expect(SUBSCRIPTION_OFFERS).toEqual(originalOffers);
  });

  it("keeps shared metadata in the authenticated checkout with its original lookup and return URL", () => {
    const dashboard = source("src/pages/DashboardAssinatura.tsx");
    expect(dashboard).toContain('import { SUBSCRIPTION_OFFERS } from "@/lib/subscription/offers"');
    expect(dashboard).toContain("SUBSCRIPTION_OFFERS.map((offer)");
    expect(dashboard).toContain('`${offer.lookupPrefix}_${currency.toLocaleLowerCase("en-US")}`');
    expect(dashboard).toContain("/dashboard/assinatura?session_id={CHECKOUT_SESSION_ID}");
    expect(dashboard).toContain("onClick={() => setCheckoutPriceId(priceId)}");
    expect(dashboard).not.toMatch(/const OFFERS\s*=/);
  });
});

describe.each<PublicLocale>(["pt-PT", "pt-BR"])("public commercial scenes in %s", (locale) => {
  it("renders both authentic offers in one comparison and explains checkout pricing", () => {
    const { container } = renderCommercial(locale);
    const plans = container.querySelector<HTMLElement>('[data-scene="plans"]')!;
    const copy = getLandingCopy(locale);

    expect(plans).toHaveAttribute("id", "plans");
    expect(plans).toHaveAccessibleName(copy.scenes.plans.title);
    expect(within(plans).getByRole("heading", { level: 2, name: copy.scenes.plans.title })).toBeInTheDocument();
    for (const offer of originalOffers) {
      const plan = within(plans).getByRole("article", { name: offer.name });
      expect(within(plan).getByRole("heading", { level: 3, name: offer.name })).toBeInTheDocument();
      expect(within(plan).getByText(offer.description)).toBeInTheDocument();
      for (const feature of offer.features) {
        expect(within(plan).getByText(feature)).toBeInTheDocument();
      }
      expect(within(plan).getByText("Preço apresentado no checkout")).toBeInTheDocument();
    }
    expect(within(plans).getAllByText(locale === "pt-BR" ? "Assinatura mensal" : "Subscrição mensal")).toHaveLength(2);
    expect(plans).toHaveTextContent("Acesso vitalício");
    expect(plans).toHaveTextContent("Modo de teste");
    expect(plans.textContent).not.toMatch(/€|R\$|\$\d|últimas vagas|só hoje|mais popular/i);
    expect(plans.querySelector('[data-motion="plans-stage"]')).not.toBeNull();
  });

  it("keeps the exact trial CTA and every public link directed to authentication", () => {
    renderCommercial(locale);
    const trialLinks = screen.getAllByRole("link", { name: "Começar 15 dias grátis" });
    expect(trialLinks).toHaveLength(2);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/auth");
    }
    expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument();
  });

  it("closes with the approved promise, original mark and financial chart", () => {
    const { container } = renderCommercial(locale);
    const signature = container.querySelector<HTMLElement>('[data-scene="signature"]')!;
    expect(signature).toHaveAttribute("id", "signature");
    expect(signature).toHaveAccessibleName(getLandingCopy(locale).finalStatement);
    expect(within(signature).getByRole("heading", { level: 2, name: getLandingCopy(locale).finalStatement })).toBeInTheDocument();
    expect(signature.querySelector('[data-motion="signature-graph"] svg polyline')).not.toBeNull();
    expect(signature.querySelector('[data-motion="signature-mark"] svg path')).toHaveAttribute(
      "d",
      "M3 4h6v4H3V4Zm12 0h6v4h-6V4ZM5 10h5v4H5v-4Zm9 0h5v4h-5v-4Zm-5 6h6v4H9v-4Z",
    );
    expect(signature.querySelector('[data-motion="signature-wordmark"]')).toHaveTextContent("Organizze");
    expect(within(signature).getByText("Dados demonstrativos")).toBeInTheDocument();
  });
});

describe("static financial signature", () => {
  it("uses the supplied demo for metrics, every chart point and its accessible summary", () => {
    const demo: LandingDemo = {
      ...landingDemo,
      income: 9876.54,
      committed: 1234.56,
      available: 7654.32,
      monthlySeries: [125.25, 500.5, 250.25],
    };
    const { container } = renderCommercial("pt-BR", demo);
    const signature = container.querySelector<HTMLElement>('[data-scene="signature"]')!;
    const money = (amount: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: demo.currency }).format(amount);
    for (const value of [demo.income, demo.committed, demo.available]) {
      expect(signature).toHaveTextContent(money(value).replace(/\s/g, " "));
    }
    const chart = within(signature).getByRole("img", { name: "Evolução dos gastos demonstrativos" });
    const summary = document.getElementById(chart.getAttribute("aria-describedby")!);
    for (const value of demo.monthlySeries) {
      expect(summary).toHaveTextContent(money(value).replace(/\s/g, " "));
    }
    const points = chart.querySelector("polyline")!.getAttribute("points")!.split(" ").map(point => point.split(",").map(Number));
    expect(points).toHaveLength(demo.monthlySeries.length);
    expect(points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(points[0][0]).toBeLessThan(points[1][0]);
    expect(points[1][1]).toBeLessThan(points[0][1]);
    expect(points[2][1]).toBeGreaterThan(points[1][1]);
    expect(signature).not.toHaveTextContent("1.030,00");
  });

  it.each([
    { label: "empty", series: [] },
    { label: "single zero", series: [0] },
    { label: "flat", series: [100, 100, 100] },
  ])("keeps a $label demo series finite", ({ series }) => {
    const { container } = renderCommercial("pt-PT", { ...landingDemo, monthlySeries: series });
    const graph = container.querySelector('[data-motion="signature-graph"] svg')!;
    expect(graph.outerHTML).not.toMatch(/NaN|Infinity/);
    expect(graph).toHaveAttribute("width");
    expect(graph).toHaveAttribute("height");
  });

  it("defaults to PT-PT and keeps customer, payment and viewport-sized type code out of public components", () => {
    renderCommercial();
    expect(screen.getByRole("heading", { name: getLandingCopy("pt-PT").finalStatement })).toBeInTheDocument();
    for (const file of ["PricingStage", "BrandSignature"]) {
      const component = source(`src/components/landing/${file}.tsx`);
      expect(component).not.toMatch(/useAuth|useFinancialContext|useSubscription|supabase|StripeEmbeddedCheckout|fetch\(|localStorage/);
      expect(component).not.toMatch(/\d(?:\.\d+)?vw/);
    }
    expect(source("src/components/landing/BrandSignature.tsx")).toContain("<Logo markOnly");
  });
});
