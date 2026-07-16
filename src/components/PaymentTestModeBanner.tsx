const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/20 border-b border-destructive/40 px-4 py-2 text-center text-sm text-destructive-foreground">
        Pagamentos em produção ainda não estão configurados. Conclui a activação no painel Lovable para aceitar pagamentos reais.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-accent/20 border-b border-accent/40 px-4 py-2 text-center text-sm text-accent">
        Modo de teste — nenhum pagamento é cobrado no preview.
      </div>
    );
  }
  return null;
}
