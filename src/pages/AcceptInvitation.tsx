import { CheckCircle2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><Logo /></div>
        <Card className="rounded-lg border-border/80 shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {acceptInvitation.isSuccess ? <CheckCircle2 size={24} /> : <Users size={24} />}
            </div>
            <CardTitle>{acceptInvitation.isSuccess ? "Convite aceite" : "Participar num espaço"}</CardTitle>
            <CardDescription>
              {acceptInvitation.isSuccess
                ? "O espaço foi adicionado à tua conta."
                : "Aceita o convite para partilhar o orçamento familiar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="py-3 text-center text-sm text-muted-foreground">A verificar sessão...</p>
            ) : acceptInvitation.isSuccess ? (
              <Button asChild className="w-full">
                <Link to="/dashboard/grupos">Abrir os meus espaços</Link>
              </Button>
            ) : !token ? (
              <p role="alert" className="text-center text-sm text-muted-foreground">{unavailableMessage}</p>
            ) : !user ? (
              <Button asChild className="w-full">
                <Link to={loginPath}>Entrar para aceitar</Link>
              </Button>
            ) : (
              <>
                {acceptInvitation.isError && (
                  <p role="alert" className="text-center text-sm text-destructive">{unavailableMessage}</p>
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AcceptInvitation;
