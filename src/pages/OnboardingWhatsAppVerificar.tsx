import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, MessageCircle, Check, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { WA_BOT_NUMBER } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";

type Verification = {
  code: string;
  phone: string;
  countryCode: string;
  ddi: string;
  status: "pending" | "verified";
  startedAt: number;
};

const OnboardingWhatsAppVerificar = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const verification = useMemo<Verification | null>(() => {
    try { return JSON.parse(localStorage.getItem("organizze.waVerification") || "null"); } catch { return null; }
  }, []);

  useEffect(() => {
    if (!verification) navigate("/onboarding/whatsapp", { replace: true });
  }, [verification, navigate]);

  // Poll for verification every 3s
  useEffect(() => {
    if (!verification) return;
    let stop = false;
    const tick = async () => {
      try {
        const { data } = await supabase
          .from("whatsapp_links")
          .select("verified_at")
          .eq("verify_code", verification.code)
          .maybeSingle();
        if (!stop && data?.verified_at) {
          setVerifying(false);
          localStorage.setItem("organizze.whatsapp", JSON.stringify({
            phone: verification.phone, ddi: verification.ddi,
            countryCode: verification.countryCode, verifiedAt: Date.now(),
          }));
          localStorage.setItem("organizze.firstRun", "1");
          localStorage.removeItem("organizze.tourCompleted");
          toast({ title: "✅ WhatsApp ligado!" });
          setTimeout(() => navigate("/dashboard"), 600);
        }
      } catch {}
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

  const sandboxNumberFmt = `+1 ${WA_BOT_NUMBER.slice(1, 4)} ${WA_BOT_NUMBER.slice(4, 7)}-${WA_BOT_NUMBER.slice(7)}`;
  const waLinkVerify = `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(verification.code)}`;

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
          Liga o WhatsApp em 2 passos
        </h1>
        <p className="text-muted-foreground mb-6">
          Estamos a usar o <strong>Twilio Sandbox</strong> para teste. Demora menos de 1 minuto.
        </p>

        {/* Step 1 */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="font-bold text-foreground">Entra no sandbox</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            No teu WhatsApp, envia <strong>uma única vez</strong> a palavra <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">join &lt;teu-código&gt;</code> para:
          </p>
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <code className="font-mono text-sm font-bold text-primary">{sandboxNumberFmt}</code>
            <button onClick={() => copy(`+${WA_BOT_NUMBER}`, "Número")}
              className="shrink-0 w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary">
              <Copy size={16} />
            </button>
          </div>
          <div className="flex gap-2 items-start text-xs text-muted-foreground">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>
              O código <em>"join …"</em> obténs no painel Twilio em <strong>Messaging → Try it out → Send a WhatsApp message</strong>. Só precisas de fazer isto na primeira vez.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="font-bold text-foreground">Envia o teu código de verificação</h3>
          </div>
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <code className="font-mono text-base font-bold text-primary truncate">{verification.code}</code>
            <button onClick={() => copy(verification.code, "Código")}
              className="shrink-0 w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary">
              {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
          </div>

          <a href={waLinkVerify} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 h-12 text-base font-semibold">
              <MessageCircle size={18} /> Abrir WhatsApp com o código
            </Button>
          </a>
          <p className="text-xs text-muted-foreground text-center">
            Vamos detetar a mensagem automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center py-2">
          {verifying ? <><Loader2 size={14} className="animate-spin" /> À espera da tua mensagem...</> : <><Check size={14} className="text-primary" /> Verificado!</>}
        </div>

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
