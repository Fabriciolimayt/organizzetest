import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
      <main className="min-h-screen flex items-center justify-center p-6 bg-app-bg">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 space-y-2">
          <h1 className="text-xl font-bold text-foreground">Não foi possível carregar</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-app-bg">
        <p className="text-muted-foreground">A carregar…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "Uma aplicação externa";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-app-bg">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Ligar {clientName} à Organizze</h1>
          <p className="text-sm text-muted-foreground">
            Isto permite que {clientName} aceda às tuas despesas e crie novas em teu nome, usando a tua conta Organizze.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => decide(true)} disabled={busy} size="lg" className="flex-1">
            {busy ? "A processar…" : "Aprovar"}
          </Button>
          <Button onClick={() => decide(false)} disabled={busy} size="lg" variant="outline" className="flex-1">
            Recusar
          </Button>
        </div>
      </div>
    </main>
  );
};

export default OAuthConsent;
