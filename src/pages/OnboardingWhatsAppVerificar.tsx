import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, MessageCircle, Check, ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { waLink, WA_BOT_NUMBER } from "@/lib/countries";

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

  const verification = useMemo<Verification | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("organizze.waVerification") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!verification) navigate("/onboarding/whatsapp", { replace: true });
  }, [verification, navigate]);

  if (!verification) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(verification.code);
    setCopied(true);
    toast({ title: "Código copiado" });
    setTimeout(() => setCopied(false), 2000);
  };

  const confirm = () => {
    localStorage.setItem(
      "organizze.whatsapp",
      JSON.stringify({
        phone: verification.phone,
        ddi: verification.ddi,
        countryCode: verification.countryCode,
        verifiedAt: Date.now(),
      })
    );
    localStorage.setItem(
      "organizze.waVerification",
      JSON.stringify({ ...verification, status: "verified" })
    );
    navigate("/dashboard?tour=1&wa=ok");
  };

  const botNumberFormatted = `+1 (${WA_BOT_NUMBER.slice(1, 4)}) ${WA_BOT_NUMBER.slice(4, 7)}-${WA_BOT_NUMBER.slice(7)}`;

  return (
    <div className="min-h-screen flex flex-col bg-app-bg">
      <header className="bg-primary py-4 px-6">
        <Logo white />
      </header>

      <main className="flex-1 px-6 py-6 max-w-2xl w-full mx-auto pb-32">
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
          Confirma no WhatsApp
        </h1>
        <p className="text-muted-foreground mb-6">
          Envia o código abaixo para o bot{" "}
          <span className="font-semibold text-foreground">Moedas</span> ({botNumberFormatted}).
          Assim que recebermos a mensagem, o teu WhatsApp fica ligado a{" "}
          <span className="font-semibold text-foreground">
            {verification.ddi} {verification.phone}
          </span>
          .
        </p>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 mb-4">
          <label className="text-[11px] font-semibold tracking-wider text-muted-foreground">
            O TEU CÓDIGO
          </label>
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <code className="font-mono text-base font-bold text-primary truncate">
              {verification.code}
            </code>
            <button
              onClick={copy}
              className="shrink-0 w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Copiar código"
            >
              {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
          </div>

          <a href={waLink(verification.code)} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 h-12 text-base font-semibold">
              <MessageCircle size={18} /> Abrir WhatsApp
            </Button>
          </a>

          <p className="text-xs text-muted-foreground text-center">
            O WhatsApp vai abrir com a mensagem pronta. Só precisas de carregar em enviar.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center py-2">
          <Loader2 size={14} className="animate-spin" />
          À espera da tua mensagem...
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-app-bg/95 backdrop-blur border-t border-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="secondary"
            onClick={confirm}
            className="w-full h-12 text-base font-semibold rounded-full gap-2"
          >
            <Check size={18} /> Já enviei — confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWhatsAppVerificar;
