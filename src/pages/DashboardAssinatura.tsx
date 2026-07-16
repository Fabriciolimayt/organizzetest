import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

type Currency = "EUR" | "BRL" | "USD" | "MZN";

const currencyMeta: Record<Currency, { symbol: string; flag: string; label: string }> = {
  EUR: { symbol: "€", flag: "🇪🇺", label: "Euro" },
  BRL: { symbol: "R$", flag: "🇧🇷", label: "Real" },
  USD: { symbol: "$", flag: "🇺🇸", label: "Dólar" },
  MZN: { symbol: "MT", flag: "🇲🇿", label: "Metical" },
};

const plans = [
  {
    id: "free",
    name: "Grátis",
    tagline: "Para começar a organizar-te.",
    priceIds: {} as Record<Currency, string>,
    prices: { EUR: "0", BRL: "0", USD: "0", MZN: "0" } as Record<Currency, string>,
    features: ["Dashboard completo", "Orçamento 50/30/20", "1 plano", "1 grupo"],
    cta: "Estás no plano Grátis",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Automação por WhatsApp e planos ilimitados.",
    priceIds: {
      EUR: "pro_monthly_eur",
      BRL: "pro_monthly_brl",
      USD: "pro_monthly_usd",
      MZN: "pro_monthly_mzn",
    },
    prices: { EUR: "9", BRL: "49", USD: "9,99", MZN: "599" },
    features: [
      "Tudo do Grátis",
      "Lançamento por WhatsApp",
      "Planos ilimitados",
      "Grupos ilimitados",
      "Relatório mensal automático",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "OCR avançado de facturas e suporte prioritário.",
    priceIds: {
      EUR: "premium_monthly_eur",
      BRL: "premium_monthly_brl",
      USD: "premium_monthly_usd",
      MZN: "premium_monthly_mzn",
    },
    prices: { EUR: "19", BRL: "99", USD: "19,99", MZN: "1.199" },
    features: [
      "Tudo do Pro",
      "OCR premium de facturas",
      "Relatórios PDF",
      "Suporte prioritário",
      "Acesso antecipado a novidades",
    ],
    cta: "Assinar Premium",
    highlight: false,
  },
];

export default function DashboardAssinatura() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("organizze.currency")) || "EUR";
    return (["EUR", "BRL", "USD", "MZN"].includes(stored) ? stored : "EUR") as Currency;
  });
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const returnUrl = useMemo(
    () => `${window.location.origin}/dashboard/assinatura?session_id={CHECKOUT_SESSION_ID}`,
    []
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PaymentTestModeBanner />

      <header className="mb-8 mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-accent font-medium mb-2">Assinatura</p>
        <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight">
          Escolhe o plano que <em className="text-accent not-italic">acompanha o teu ritmo</em>.
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Todos os planos incluem cancelamento a qualquer momento. Preços em {currencyMeta[currency].label}.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(currencyMeta) as Currency[]).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              currency === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            {currencyMeta[c].flag} {c}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const priceId = plan.priceIds[currency];
          const isFree = plan.id === "free";
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-accent/50 bg-gradient-to-b from-accent/5 to-transparent shadow-[0_0_60px_-15px_hsl(var(--accent)/0.35)]"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 bg-accent text-accent-foreground text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Sparkles size={12} /> Mais popular
                </span>
              )}
              <h3 className="font-display text-2xl text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{plan.tagline}</p>
              <div className="mb-6">
                <span className="font-display text-5xl text-foreground">
                  {currencyMeta[currency].symbol} {plan.prices[currency]}
                </span>
                {!isFree && <span className="text-muted-foreground text-sm ml-1">/mês</span>}
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-foreground/90">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                disabled={isFree}
                onClick={() => priceId && setCheckoutPriceId(priceId)}
                className={`w-full ${
                  plan.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""
                }`}
                variant={plan.highlight ? "default" : "outline"}
              >
                {isFree ? plan.cta : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      {checkoutPriceId && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-foreground">Finalizar assinatura</h2>
              <button
                onClick={() => setCheckoutPriceId(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4">
              <StripeEmbeddedCheckout
                priceId={checkoutPriceId}
                userId={user?.id}
                customerEmail={user?.email ?? undefined}
                returnUrl={returnUrl}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
