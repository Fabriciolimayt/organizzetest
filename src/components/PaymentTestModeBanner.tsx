import { AlertTriangle, FlaskConical } from "lucide-react";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="flex min-w-0 items-start gap-3 border border-financial-expense/40 bg-financial-expense/10 px-4 py-3 text-body-small text-financial-expense" role="status">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p><span className="font-semibold">Pagamentos indisponíveis.</span> A produção ainda não está configurada. Conclui a activação no painel Lovable para aceitar pagamentos reais.</p>
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="flex min-w-0 items-start gap-3 border border-financial-warning/40 bg-financial-warning/10 px-4 py-3 text-body-small text-financial-warning" role="status">
        <FlaskConical size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p><span className="font-semibold">Modo de teste.</span> Nenhum pagamento é cobrado no preview.</p>
      </div>
    );
  }
  return null;
}
