import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Receipt, MessageSquare, Calendar, SkipForward } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import { Button } from "@/components/ui/button";

const ddiByCurrency: Record<string, { ddi: string; flag: string }> = {
  EUR: { ddi: "+351", flag: "🇵🇹" },
  BRL: { ddi: "+55", flag: "🇧🇷" },
  MZN: { ddi: "+258", flag: "🇲🇿" },
  USD: { ddi: "+1", flag: "🇺🇸" },
};

const features = [
  { icon: Receipt, title: "Digitalizar recibo", desc: "Foto → despesa" },
  { icon: MessageSquare, title: "Texto rápido", desc: '"Gastei 45€"' },
  { icon: Calendar, title: "Relatório mensal", desc: "Dia 25 de cada mês" },
];

const OnboardingWhatsApp = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const currency = useMemo(
    () => localStorage.getItem("organizze.currency") || "EUR",
    []
  );
  const { ddi, flag } = ddiByCurrency[currency] ?? ddiByCurrency.EUR;

  const finish = () => {
    if (phone.trim()) {
      localStorage.setItem("organizze.whatsapp", `${ddi}${phone.trim()}`);
    }
    navigate("/dashboard?tour=1");
  };

  const valid = phone.replace(/\D/g, "").length >= 8;

  return (
    <OnboardingWizardLayout
      step={3}
      icon={<MessageCircle size={22} />}
      title="Conectar WhatsApp"
      subtitle={
        <>
          Envia fotos de recibos e recebe o resumo mensal do teu orçamento no dia 25 —{" "}
          <strong className="text-foreground">automaticamente.</strong>
        </>
      }
      onBack={() => navigate("/onboarding/moeda")}
      onContinue={finish}
      canContinue={valid}
      continueLabel="Verificar com WhatsApp"
      extraFooter={
        <div className="text-center space-y-1">
          <button
            onClick={finish}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <SkipForward size={14} /> Saltar por agora
          </button>
          <p className="text-xs text-muted-foreground">
            Opcional — podes conectar mais tarde nas definições
          </p>
        </div>
      }
    >
      {/* Mini features */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="text-center">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Icon size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">Conectar WhatsApp</div>
            <div className="text-xs text-muted-foreground">Envia recibos via WhatsApp</div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold tracking-wider text-muted-foreground">
            NÚMERO WHATSAPP
          </label>
          <div className="flex gap-2 mt-1.5">
            <div className="flex items-center gap-1.5 px-3 rounded-lg border border-border bg-background text-sm font-medium shrink-0">
              <span>{flag}</span>
              <span>{ddi}</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="912345678"
              maxLength={15}
              className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Número completo:{" "}
            <span className="font-semibold text-foreground">
              {ddi} {phone || "..."}
            </span>
          </p>
        </div>

        <Button
          disabled={!valid}
          onClick={finish}
          className="w-full gap-2"
          variant={valid ? "default" : "secondary"}
        >
          <MessageCircle size={16} /> Verificar com WhatsApp
        </Button>
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingWhatsApp;
