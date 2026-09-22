import { CheckCircle2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptSpaceInvitationV2 } from "@/hooks/useSpacesV2";

const unavailableMessage = "Este convite está inválido, expirou ou já não está disponível.";
const pendingTokenKey = "organizze.pendingInvitationToken";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const acceptInvitation = useAcceptSpaceInvitationV2();
  const queryToken = searchParams.get("token")?.trim() ?? "";
  const [token] = useState(() => queryToken || sessionStorage.getItem(pendingTokenKey)?.trim() || "");
  const loginPath = `/auth?next=${encodeURIComponent("/convite")}`;

  useEffect(() => {
    if (!queryToken) return;
    sessionStorage.setItem(pendingTokenKey, queryToken);
    navigate("/convite", { replace: true });
  }, [navigate, queryToken]);

  useEffect(() => {
    if (acceptInvitation.isSuccess) sessionStorage.removeItem(pendingTokenKey);
  }, [acceptInvitation.isSuccess]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-app-bg px-5 py-10">
      <section className="functional-panel w-full max-w-md p-6 sm:p-8" aria-labelledby="invitation-heading">
        <Logo size="sm" />
        <div className="mt-8 flex size-11 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary" aria-hidden="true">
          {acceptInvitation.isSuccess ? <CheckCircle2 size={22} /> : <Users size={22} />}
        </div>
        <p className="mt-6 font-mono text-[11px] font-semibold uppercase text-data-blue">Espaço financeiro partilhado</p>
        <h1 id="invitation-heading" className="editorial-display mt-3 text-2xl font-semibold leading-tight text-foreground">
          {acceptInvitation.isSuccess ? "Convite aceite" : "Participar num espaço"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {acceptInvitation.isSuccess
            ? "O espaço foi adicionado à tua conta."
            : "Aceita este convite para partilhar o orçamento familiar."}
        </p>
        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">A verificar sessão...</p>
          ) : acceptInvitation.isSuccess ? (
            <Button asChild className="w-full">
              <Link to="/dashboard/grupos">Abrir os meus espaços</Link>
            </Button>
          ) : !token ? (
            <p role="alert" className="text-sm leading-6 text-muted-foreground">{unavailableMessage}</p>
          ) : !user ? (
            <Button asChild className="w-full">
              <Link to={loginPath}>Entrar para aceitar</Link>
            </Button>
          ) : (
            <>
              {acceptInvitation.isError && (
                <p role="alert" className="text-sm leading-6 text-destructive">{unavailableMessage}</p>
              )}
              <Button
                className="w-full"
                disabled={acceptInvitation.isPending}
                onClick={() => acceptInvitation.mutate(token)}
              >
                {acceptInvitation.isPending ? "A aceitar..." : "Aceitar convite"}
              </Button>
            </>
          )}
        </div>
        <Link to="/" className="focus-ring mt-5 inline-flex text-sm font-medium text-muted-foreground hover:text-foreground">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
};

export default AcceptInvitation;
