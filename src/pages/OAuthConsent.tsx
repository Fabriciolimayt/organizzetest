import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResponse>;
  approveAuthorization: (id: string) => Promise<OAuthResponse>;
  denyAuthorization: (id: string) => Promise<OAuthResponse>;
};

type OAuthDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string };
};

type OAuthResponse = {
  data: OAuthDetails | null;
  error: { message: string } | null;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Falta authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não devolveu redirect.");
      return;
    }
    window.location.href = target;
  };

  if (error) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-app-bg px-5 py-10">
        <section className="functional-panel w-full max-w-md p-6 sm:p-8" aria-labelledby="oauth-error-heading">
          <Logo size="sm" />
          <h1 id="oauth-error-heading" className="editorial-display mt-8 text-2xl font-semibold text-foreground">Não foi possível carregar</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
        </section>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-app-bg px-5 py-10">
        <section className="functional-panel w-full max-w-md p-6 sm:p-8" aria-live="polite">
          <Logo size="sm" />
          <p className="mt-8 font-mono text-[11px] font-semibold uppercase text-data-blue">Autorização segura</p>
          <p className="mt-3 text-sm text-muted-foreground">A carregar…</p>
        </section>
      </main>
    );
  }

  const clientName = details.client?.name ?? "Uma aplicação externa";

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-app-bg px-5 py-10">
      <section className="functional-panel w-full max-w-md p-6 sm:p-8" aria-labelledby="oauth-consent-heading">
        <Logo size="sm" />
        <div className="mt-8">
          <p className="font-mono text-[11px] font-semibold uppercase text-data-blue">Autorização segura</p>
          <h1 id="oauth-consent-heading" className="editorial-display mt-3 text-2xl font-semibold leading-tight text-foreground">
            Ligar {clientName} à Organizze
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {clientName} poderá aceder às tuas despesas e criar novas em teu nome, usando a tua conta Organizze.
          </p>
        </div>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
          <Button onClick={() => decide(true)} disabled={busy} size="lg" className="flex-1">
            {busy ? "A processar…" : "Aprovar"}
          </Button>
          <Button onClick={() => decide(false)} disabled={busy} size="lg" variant="outline" className="flex-1">
            Recusar
          </Button>
        </div>
      </section>
    </main>
  );
};

export default OAuthConsent;
