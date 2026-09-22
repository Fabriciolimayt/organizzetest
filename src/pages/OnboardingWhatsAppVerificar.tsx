import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, Copy, Loader2, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { WA_BOT_NUMBER } from "@/lib/countries";
import { supabaseV2 } from "@/integrations/supabase/v2";
import "./auth-paper.css";

type Verification = {
  code: string;
  phone: string;
  instanceName: string;
  expiresAt: string;
  spaceId: string;
  countryCode: string;
  countryName: string;
  ddi: string;
  status: "pending" | "verified";
};

const formatBotNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "número dedicado do Organizze";
};

const OnboardingWhatsAppVerificar = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [expired, setExpired] = useState(false);

  const verification = useMemo<Verification | null>(() => {
    try { return JSON.parse(localStorage.getItem("organizze.waVerification") || "null"); } catch { return null; }
  }, []);

  useEffect(() => {
    if (!verification) navigate("/onboarding/whatsapp", { replace: true });
  }, [verification, navigate]);

  useEffect(() => {
    if (!verification) return;
    let stop = false;
    let completed = false;
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (stop || completed) return;
      if (Date.now() >= new Date(verification.expiresAt).getTime()) {
        setExpired(true);
        setVerifying(false);
        return;
      }

      try {
        const { data: connection, error } = await supabaseV2
          .from("whatsapp_connections")
          .select("status, verified_at")
          .eq("space_id", verification.spaceId)
          .eq("phone_e164", verification.phone)
          .eq("instance_name", verification.instanceName)
          .maybeSingle();
        if (error) throw error;

        if (!stop && connection?.status === "active" && connection.verified_at) {
          completed = true;
          setVerifying(false);

          const { error: preferencesError } = await supabaseV2.rpc("update_whatsapp_preferences",
            {
              space_id: verification.spaceId,
              monthly_report_opt_in: true,
              preferences: { day: 25, timezone: "Europe/Lisbon" },
            },
          );
          if (stop) return;
          if (preferencesError) {
            toast({
              title: "WhatsApp ligado",
              description: "A preferência do resumo mensal não pôde ser guardada agora.",
              variant: "destructive",
            });
          }

          localStorage.setItem("organizze.whatsapp", JSON.stringify({
            phone: verification.phone,
            ddi: verification.ddi,
            countryCode: verification.countryCode,
            countryName: verification.countryName,
            spaceId: verification.spaceId,
            instanceName: verification.instanceName,
            status: "verified",
            verifiedAt: connection.verified_at,
          }));
          localStorage.setItem("organizze.firstRun", "1");
          localStorage.removeItem("organizze.tourCompleted");
          localStorage.removeItem("organizze.waVerification");
          toast({ title: "WhatsApp ligado!" });
          redirectTimeout = setTimeout(() => navigate("/dashboard"), 600);
        }
      } catch (error) {
        if (!stop) {
          toast({
            title: "Não foi possível verificar a ligação",
            description: error instanceof Error ? error.message : "Vamos tentar novamente automaticamente.",
            variant: "destructive",
          });
        }
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      stop = true;
      clearInterval(id);
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [verification, navigate]);

  if (!verification) return null;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: `${label} copiado` });
    setTimeout(() => setCopied(false), 2000);
  };

  const botDisplay = formatBotNumber(WA_BOT_NUMBER);
  const botNumber = WA_BOT_NUMBER.replace(/\D/g, "");
  const waLinkVerify = `https://wa.me/${botNumber}?text=${encodeURIComponent(verification.code)}`;

  return (
    <div className="entry-editorial entry-onboarding">
      <header className="entry-editorial__header">
        <div className="entry-editorial__header-inner">
          <Logo white />
          <span className="entry-editorial__header-note text-label">
            Ligação segura
          </span>
        </div>
      </header>

      <div
        className="entry-editorial__progress"
        role="progressbar"
        aria-label="Progresso da configuração"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={4}
        aria-valuetext="Passo 4 de 4, verificação"
      >
        <span className="font-mono text-label text-muted-foreground">04 / 04</span>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} className="h-0.5 bg-primary" />
          ))}
        </div>
      </div>

      <main className="entry-editorial__main">
        <button
          type="button"
          onClick={() => navigate("/onboarding/whatsapp")}
          className="focus-ring interactive-control inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Trocar número
        </button>

        <div className="editorial-reveal mt-6">
          <div className="entry-editorial__icon">
            <MessageCircle size={21} aria-hidden="true" />
          </div>
          <h1 className="entry-editorial__title">
            Confirma o teu número.
          </h1>
          <p className="entry-editorial__description">
            Envia o código abaixo para <strong className="font-semibold text-foreground">{botDisplay}</strong>. A confirmação acontece automaticamente.
          </p>
        </div>

        <section aria-labelledby="verification-code-label" className="entry-editorial__verification mt-8 border-y border-border py-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p id="verification-code-label" className="entry-editorial__field-label text-label">
                Código de ligação
              </p>
              <code className="entry-editorial__code financial-value mt-3 block [overflow-wrap:anywhere] text-xl font-semibold sm:text-2xl">
                {verification.code}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copy(verification.code, "Código")}
              className="focus-ring interactive-control inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-foreground/45 hover:bg-muted sm:self-auto"
              aria-label={copied ? "Código copiado" : "Copiar código"}
            >
              {copied ? <Check size={16} className="text-primary" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          {expired ? (
            <Button disabled size="lg" className="mt-6 w-full sm:w-auto">
              <MessageCircle size={18} aria-hidden="true" /> Abrir WhatsApp com o código
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
              <a href={waLinkVerify} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} aria-hidden="true" /> Abrir WhatsApp com o código
              </a>
            </Button>
          )}
        </section>

        <div
          className={`entry-editorial__status mt-6 flex min-h-14 items-center gap-3 border-l-2 px-4 text-sm ${
            expired ? "border-financial-warning text-foreground" : "border-primary text-muted-foreground"
          }`}
          role={expired ? "alert" : "status"}
          aria-live={expired ? "assertive" : "polite"}
        >
          {expired ? (
            <><AlertTriangle size={17} className="shrink-0 text-financial-warning" aria-hidden="true" /><span>Este código expirou. Cria uma nova ligação para continuar.</span></>
          ) : verifying ? (
            <><Loader2 size={17} className="shrink-0 animate-spin text-primary" aria-hidden="true" /> À espera da tua mensagem...</>
          ) : (
            <><Check size={17} className="shrink-0 text-primary" aria-hidden="true" /> Número verificado.</>
          )}
        </div>

        {expired && (
          <Button
            variant="outline"
            size="lg"
            className="mt-4 w-full sm:w-auto"
            onClick={() => navigate("/onboarding/whatsapp", { replace: true })}
          >
            Recomeçar ligação
          </Button>
        )}
      </main>

      <footer className="entry-editorial__footer">
        <div className="entry-editorial__footer-inner flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="focus-ring interactive-control min-h-11 rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Saltar e ligar mais tarde
          </button>
        </div>
      </footer>
    </div>
  );
};

export default OnboardingWhatsAppVerificar;
