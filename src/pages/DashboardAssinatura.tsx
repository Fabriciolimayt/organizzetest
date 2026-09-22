import { useMemo, useState } from "react";
import { Check, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PageHeader from "@/components/dashboard/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import { capabilitiesForSubscription, isSubscriptionCurrent } from "@/lib/finance/capabilities";
import { SUBSCRIPTION_OFFERS } from "@/lib/subscription/offers";

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
  const subscriptionTone = lifetimeAccess || (current && isSubscriptionCurrent(current))
    ? "positive"
    : current?.status === "past_due" || current?.status === "unpaid"
      ? "negative"
      : current?.status === "trialing"
        ? "warning"
        : "default";

  if (subscription.isLoading || financial.isLoading) return <PageState loading message="A consultar dados da assinatura..." />;
  if (subscription.error || financial.error) return <PageState message="Não foi possível consultar a assinatura." action={<Button variant="outline" onClick={() => { void subscription.refetch(); void financial.refetch(); }}>Tentar novamente</Button>} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PaymentTestModeBanner />
      <PageHeader
        eyebrow="Partilhar e automatizar"
        title="Assinatura e planos"
        description="Consulta o acesso atual, as capacidades disponíveis e as opções de subscrição."
      />

      <section className="functional-panel grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Estado da subscrição">
        <Status
          label="Estado da subscrição"
          value={
            lifetimeAccess
              ? "Acesso vitalício"
              : current
              ? current.status === "trialing" && !isSubscriptionCurrent(current)
                ? "Período experimental terminado"
                : STATUS_LABELS[current.status] ?? current.status
              : "Plano gratuito"
          }
          tone={subscriptionTone}
        />
        <Status
          label="Data de Renovação"
          value={
            lifetimeAccess
              ? "Acesso permanente"
              : current?.current_period_end
              ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(current.current_period_end))
              : "Sem renovação agendada"
          }
          tone={current?.cancel_at_period_end ? "warning" : "default"}
        />
        <Status
          label="Ambiente"
          value={current?.environment === "live" ? "Produção Segura" : current?.environment ?? "Produção"}
          tone={current?.environment && current.environment !== "live" ? "warning" : "default"}
        />
      </section>

      <section className="functional-panel min-w-0 p-5" aria-labelledby="active-capabilities-title">
        <div className="flex min-w-0 items-start gap-3">
          <div className="surface-quiet flex size-10 shrink-0 items-center justify-center text-intelligence">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-label uppercase text-muted-foreground">Acesso efetivo</p>
            <h2 id="active-capabilities-title" className="mt-1 break-words text-panel-title text-foreground">Capacidades ativas do espaço</h2>
          </div>
        </div>
        <dl className="mt-5 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Capability label="Automação WhatsApp" value={capabilities.whatsapp ? "Ativa" : "Indisponível"} available={capabilities.whatsapp} />
          <Capability label="Planos" value={capabilities.unlimitedPlans ? "Ilimitados" : "1 plano"} available={capabilities.unlimitedPlans} />
          <Capability label="Espaços familiares" value={capabilities.unlimitedGroups ? "Ilimitados" : "1 espaço"} available={capabilities.unlimitedGroups} />
        </dl>
      </section>

      {!lifetimeAccess && (
        <section aria-labelledby="available-plans-title">
          <div className="mb-4">
            <p className="font-mono text-label uppercase text-muted-foreground">Opções disponíveis</p>
            <h2 id="available-plans-title" className="mt-1 text-panel-title text-foreground">Escolher plano</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {SUBSCRIPTION_OFFERS.map((offer) => {
            const priceId = `${offer.lookupPrefix}_${currency.toLocaleLowerCase("en-US")}`;
            const currentOffer = current?.price_id?.includes(offer.id) && (current.status === "active" || current.status === "trialing");
            const isFeatured = offer.id === "premium";

            return (
              <section
                key={offer.id}
                className={`functional-panel relative flex min-w-0 flex-col p-5 sm:p-6 ${
                  isFeatured
                    ? "border-intelligence/55"
                    : "border-border"
                }`}
              >
                {isFeatured && (
                  <span className="mb-3 font-mono text-label font-semibold uppercase text-intelligence">
                    Recomendado
                  </span>
                )}
                <div className="mb-5 min-w-0">
                  <h3 className="flex items-center gap-2 text-panel-title text-foreground">
                    {offer.name}
                    {isFeatured && <Sparkles size={17} className="shrink-0 text-intelligence" aria-hidden="true" />}
                  </h3>
                  <p className="mt-2 text-body-small leading-relaxed text-muted-foreground">{offer.description}</p>
                </div>
                <ul className="mb-6 flex-1 divide-y divide-border border-y border-border">
                  {offer.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 py-3 text-body-small text-muted-foreground">
                      <Check size={15} className="mt-0.5 shrink-0 text-financial-income" aria-hidden="true" />
                      <span className="min-w-0 break-words">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Dialog
                  open={checkoutPriceId === priceId}
                  onOpenChange={(open) => {
                    if (!open) setCheckoutPriceId(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant={isFeatured ? "default" : "outline"}
                      disabled={Boolean(currentOffer)}
                      onClick={() => setCheckoutPriceId(priceId)}
                      className={`w-full gap-2 ${
                        isFeatured
                          ? "font-semibold"
                          : ""
                      }`}
                    >
                      <CreditCard size={15} />
                      {currentOffer ? "Plano Atual" : `Assinar ${offer.name}`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-modal="true" className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="border-b border-border pb-4 pr-10 text-left">
                      <p className="font-mono text-label uppercase text-muted-foreground">Checkout seguro</p>
                      <DialogTitle className="break-words text-panel-title text-foreground">
                        Finalizar subscrição com Stripe
                      </DialogTitle>
                      <DialogDescription>
                        Confirma os dados de pagamento no ambiente seguro do Stripe.
                      </DialogDescription>
                    </DialogHeader>
                    {checkoutPriceId && (
                      <div className="functional-panel min-w-0 p-3 sm:p-5">
                        <StripeEmbeddedCheckout
                          priceId={checkoutPriceId}
                          userId={user?.id}
                          customerEmail={user?.email ?? undefined}
                          returnUrl={returnUrl}
                        />
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </section>
            );
          })}
          </div>
        </section>
      )}

      {current?.cancel_at_period_end && (
        <div className="flex items-start gap-3 border border-financial-warning/40 bg-financial-warning/10 p-4 text-body-small text-financial-warning" role="status">
          <span className="font-semibold">Renovação desativada.</span>
          <span>A subscrição permanece ativa até ao fim do ciclo corrente.</span>
        </div>
      )}

    </div>
  );
}

function Status({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "warning" | "negative" }) {
  const toneClass = tone === "positive"
    ? "text-financial-income"
    : tone === "warning"
      ? "text-financial-warning"
      : tone === "negative"
        ? "text-financial-expense"
        : "text-foreground";
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <p className="font-mono text-label uppercase text-muted-foreground">{label}</p>
      <p className={`mt-2 break-words text-body-small font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Capability({ label, value, available }: { label: string; value: string; available: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 sm:block sm:px-4">
      <dt className="text-body-small text-muted-foreground">{label}</dt>
      <dd className={`text-body-small font-semibold sm:mt-1 ${available ? "text-financial-income" : "text-muted-foreground"}`}>{value}</dd>
    </div>
  );
}

function PageState({ message, loading, action }: { message: string; loading?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      {loading && <Loader2 size={20} className="animate-spin text-primary" />}
      <p>{message}</p>
      {action}
    </div>
  );
}
