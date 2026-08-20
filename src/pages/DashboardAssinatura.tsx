import { useMemo, useState } from "react";
import { Check, CreditCard, Loader2, ShieldCheck, X } from "lucide-react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/dashboard/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import { capabilitiesForSubscription, isSubscriptionCurrent } from "@/lib/finance/capabilities";

const OFFERS = [
  { id: "pro", name: "Pro", lookupPrefix: "pro_monthly", features: ["Lançamentos pelo WhatsApp", "Planos ilimitados", "Grupos ilimitados", "Resumo mensal"] },
  { id: "premium", name: "Premium", lookupPrefix: "premium_monthly", features: ["Tudo do Pro", "Leitura avançada de recibos", "Relatórios completos", "Suporte prioritário"] },
] as const;

const STATUS_LABELS: Record<string, string> = {
  incomplete: "Configuração incompleta",
  trialing: "Período experimental",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  unpaid: "Pagamento em falta",
};

export default function DashboardAssinatura() {
  const { user } = useAuth();
  const financial = useFinancialContext();
  const subscription = useSubscriptionV2();
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const locale = financial.data?.locale ?? "pt-PT";
  const currency = financial.data?.currency ?? "EUR";
  const current = subscription.data;
  const lifetimeAccess = current?.provider === "complimentary" && current.status === "active" && !current.current_period_end;
  const capabilities = capabilitiesForSubscription(current);
  const returnUrl = useMemo(() => `${window.location.origin}/dashboard/assinatura?session_id={CHECKOUT_SESSION_ID}`, []);

  if (subscription.isLoading || financial.isLoading) return <PageState loading message="A carregar a assinatura..." />;
  if (subscription.error || financial.error) return <PageState message="Não foi possível consultar a assinatura." action={<Button variant="outline" onClick={() => { void subscription.refetch(); void financial.refetch(); }}>Tentar novamente</Button>} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PaymentTestModeBanner />
      <PageHeader eyebrow="Partilhar e automatizar" title="Assinatura" description="Consulta o estado atual e escolhe as funcionalidades adequadas ao teu uso." />

      <section className="grid gap-4 border-y border-border py-5 sm:grid-cols-3">
        <Status label="Estado" value={lifetimeAccess ? "Acesso vitalício" : current ? (current.status === "trialing" && !isSubscriptionCurrent(current) ? "Período experimental terminado" : STATUS_LABELS[current.status] ?? current.status) : "Plano gratuito"} />
        <Status label="Renovação" value={lifetimeAccess ? "Acesso permanente" : current?.current_period_end ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(current.current_period_end)) : "Sem renovação agendada"} />
        <Status label="Ambiente" value={current?.environment === "live" ? "Produção" : current?.environment ?? "Produção"} />
      </section>

      <div className="rounded-md border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 text-primary" /><div><p className="font-medium">Capacidades atuais</p><p className="mt-1 text-sm text-muted-foreground">WhatsApp {capabilities.whatsapp ? "ativo" : "indisponível"} · Planos {capabilities.unlimitedPlans ? "ilimitados" : "limitados"} · Grupos {capabilities.unlimitedGroups ? "ilimitados" : "limitados"}</p></div></div>
      </div>

      {!lifetimeAccess && <div className="grid gap-4 md:grid-cols-2">
        {OFFERS.map((offer) => {
          const priceId = `${offer.lookupPrefix}_${currency.toLocaleLowerCase("en-US")}`;
          const currentOffer = current?.price_id?.includes(offer.id) && (current.status === "active" || current.status === "trialing");
          return <section key={offer.id} className="flex flex-col rounded-md border border-border bg-card p-5"><div className="mb-5"><h2 className="font-serif text-xl font-semibold">{offer.name}</h2><p className="mt-1 text-sm text-muted-foreground">O valor final e os impostos são confirmados com segurança no checkout.</p></div><ul className="mb-6 flex-1 space-y-2">{offer.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check size={15} className="text-primary" />{feature}</li>)}</ul><Button variant={offer.id === "pro" ? "default" : "outline"} disabled={Boolean(currentOffer)} onClick={() => setCheckoutPriceId(priceId)}><CreditCard size={16} />{currentOffer ? "Plano atual" : `Escolher ${offer.name}`}</Button></section>;
        })}
      </div>}

      {current?.cancel_at_period_end && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">A assinatura está ativa até ao fim do período atual e não será renovada automaticamente.</p>}

      {checkoutPriceId && <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95"><div className="mx-auto max-w-3xl p-4 sm:p-8"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-xl font-semibold">Finalizar assinatura</h2><Button variant="ghost" size="icon" title="Fechar checkout" onClick={() => setCheckoutPriceId(null)}><X size={18} /></Button></div><div className="rounded-md border border-border bg-card p-4"><StripeEmbeddedCheckout priceId={checkoutPriceId} userId={user?.id} customerEmail={user?.email ?? undefined} returnUrl={returnUrl} /></div></div></div>}
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function PageState({ message, loading, action }: { message: string; loading?: boolean; action?: React.ReactNode }) {
  return <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">{loading && <Loader2 size={20} className="animate-spin" />}<p>{message}</p>{action}</div>;
}
