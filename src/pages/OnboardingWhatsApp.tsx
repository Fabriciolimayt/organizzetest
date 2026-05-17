import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Receipt, MessageSquare, Calendar, SkipForward, ChevronDown } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WA_COUNTRIES,
  countryForCurrency,
  generateVerifyCode,
  onlyDigits,
  validatePhone,
  type WaCountry,
} from "@/lib/countries";

const features = [
  { icon: Receipt, title: "Foto de fatura", desc: "OCR automático" },
  { icon: MessageSquare, title: "Texto rápido", desc: '"Gastei 45€"' },
  { icon: Calendar, title: "Resumo mensal", desc: "Dia 25" },
];

const OnboardingWhatsApp = () => {
  const navigate = useNavigate();
  const currency = useMemo(
    () => localStorage.getItem("organizze.currency") || "EUR",
    []
  );
  const [country, setCountry] = useState<WaCountry>(() => countryForCurrency(currency));
  const [phone, setPhone] = useState("");
  const [open, setOpen] = useState(false);

  const valid = validatePhone(country, phone);

  const startVerification = async () => {
    const code = generateVerifyCode();
    const ddiDigits = country.ddi.replace(/\D/g, "");
    const fullPhone = ddiDigits + onlyDigits(phone);
    const data = {
      code,
      phone: fullPhone,
      countryCode: country.code,
      ddi: country.ddi,
      status: "pending" as const,
      startedAt: Date.now(),
    };
    localStorage.setItem("organizze.waVerification", JSON.stringify(data));

    // Persist the pending link so the webhook can find it
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        // upsert by phone
        await supabase.from("whatsapp_links").upsert(
          { user_id: auth.user.id, phone: fullPhone, verify_code: code, verified_at: null },
          { onConflict: "phone" }
        );
      }
    } catch (e) {
      console.error("save link failed", e);
    }
    navigate("/onboarding/whatsapp/verificar");
  };


  const skip = () => navigate("/dashboard?tour=1");

  return (
    <OnboardingWizardLayout
      step={3}
      icon={<MessageCircle size={22} />}
      title="Conectar WhatsApp"
      subtitle={
        <>
          Envia fotos de recibos e recebe o resumo mensal —{" "}
          <strong className="text-foreground">automaticamente.</strong>
        </>
      }
      onBack={() => navigate("/onboarding/moeda")}
      onContinue={startVerification}
      canContinue={valid}
      continueLabel="Verificar com WhatsApp"
      extraFooter={
        <div className="text-center space-y-1">
          <button
            onClick={skip}
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
            PAÍS
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full mt-1.5 h-11 px-3 rounded-lg border border-border bg-background flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                  <span className="text-muted-foreground">{country.ddi}</span>
                </span>
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
              {WA_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-secondary text-left ${
                    c.code === country.code ? "bg-secondary" : ""
                  }`}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="font-medium flex-1">{c.name}</span>
                  <span className="text-muted-foreground">{c.ddi}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-[11px] font-semibold tracking-wider text-muted-foreground">
            NÚMERO WHATSAPP
          </label>
          <div className="flex gap-2 mt-1.5">
            <div className="flex items-center gap-1.5 px-3 rounded-lg border border-border bg-background text-sm font-medium shrink-0">
              <span>{country.flag}</span>
              <span>{country.ddi}</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder={country.placeholder}
              maxLength={18}
              className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Número completo:{" "}
            <span className="font-semibold text-foreground">
              {country.ddi} {phone || "..."}
            </span>
          </p>
        </div>

        <Button
          disabled={!valid}
          onClick={startVerification}
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
