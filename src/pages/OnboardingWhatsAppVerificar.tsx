import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, MessageCircle, Check, ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { WA_BOT_NUMBER } from "@/lib/countries";
import { supabaseV2 } from "@/integrations/supabase/v2";

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
          setTimeout(() => navigate("/dashboard"), 600);
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
    return () => { stop = true; clearInterval(id); };
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
    <div className="min-h-screen flex flex-col bg-app-bg">
      <header className="bg-primary py-4 px-6"><Logo white /></header>

      <main className="flex-1 px-6 py-6 max-w-2xl w-full mx-auto pb-12">
        <button
          onClick={() => navigate("/onboarding/whatsapp")}
          className="flex items-center gap-1 text-sm text-foreground hover:text-primary mb-6"
        >
          <ArrowLeft size={16} /> Trocar número
        </button>

        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
          <MessageCircle size={22} />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-serif">
          Liga o WhatsApp num passo
        </h1>
        <p className="text-muted-foreground mb-6">
          Envia o código ao número dedicado do Organizze. A ligação é feita pela
          nossa integração Evolution local.
        </p>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="font-bold text-foreground">Envia o teu código de verificação</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Envia esta mensagem para o nosso WhatsApp <strong className="text-foreground">{botDisplay}</strong>:
          </p>

          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <code className="font-mono text-base font-bold text-primary truncate">{verification.code}</code>
            <button onClick={() => copy(verification.code, "Código")}
              className="shrink-0 w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary">
              {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
          </div>

          <a href={expired ? undefined : waLinkVerify} target="_blank" rel="noopener noreferrer">
            <Button disabled={expired} className="w-full gap-2 h-12 text-base font-semibold">
              <MessageCircle size={18} /> Abrir WhatsApp com o código
            </Button>
          </a>
          <p className="text-xs text-muted-foreground text-center">
            Vamos detetar a tua mensagem automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center py-2">
          {expired ? (
            <span>Este código expirou.</span>
          ) : verifying ? (
            <><Loader2 size={14} className="animate-spin" /> À espera da tua mensagem...</>
          ) : (
            <><Check size={14} className="text-primary" /> Verificado!</>
          )}
        </div>

        {expired && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/onboarding/whatsapp", { replace: true })}
          >
            Recomeçar ligação
          </Button>
        )}

        <div className="text-center mt-4">
          <button onClick={() => navigate("/dashboard")} className="text-xs text-muted-foreground hover:underline">
            Saltar e ligar mais tarde
          </button>
        </div>
      </main>
    </div>
  );
};

export default OnboardingWhatsAppVerificar;
