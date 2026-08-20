import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Receipt, MessageSquare, Calendar, SkipForward, ChevronDown } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseV2 } from "@/integrations/supabase/v2";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WA_COUNTRIES,
  countryForCurrency,
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
  const [loading, setLoading] = useState(false);

  const valid = validatePhone(country, phone);

  const startVerification = async () => {
    if (!valid || loading) return;

    setLoading(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Inicia sessão para ligar o WhatsApp.");

      const { data: memberships, error: membershipError } = await supabaseV2
        .from("space_members")
        .select("space_id, role")
        .eq("user_id", auth.user.id);
      if (membershipError) throw membershipError;

      const administrable = memberships?.find(
        ({ role }) => role === "owner" || role === "admin",
      );
      const membership = administrable ?? memberships?.[0];
      if (!membership) throw new Error("Não encontrámos um espaço financeiro para esta conta.");

      const spaceId = membership.space_id;
      const fullPhone = `${country.ddi}${onlyDigits(phone)}`;
      const { data: links, error: linkError } = await supabaseV2
        .rpc("create_whatsapp_link", { phone_e164: fullPhone, space_id: spaceId });
      if (linkError) {
        if (!administrable) {
          throw new Error("Só um proprietário ou administrador pode ligar o WhatsApp neste espaço.");
        }
        throw linkError;
      }

      const link = links?.[0];
      if (!link) throw new Error("Não foi possível criar a ligação. Tenta novamente.");

      localStorage.setItem("organizze.waVerification", JSON.stringify({
        code: link.code,
        phone: fullPhone,
        instanceName: link.instance_name,
        expiresAt: link.expires_at,
        spaceId,
        countryCode: country.code,
        countryName: country.name,
        ddi: country.ddi,
        status: "pending" as const,
      }));
      navigate("/onboarding/whatsapp/verificar");
    } catch (error) {
      toast({
        title: "Não foi possível iniciar a ligação",
        description: error instanceof Error ? error.message : "Tenta novamente dentro de instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      canContinue={valid && !loading}
      continueLabel={loading ? "A preparar ligação..." : "Verificar com WhatsApp"}
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
          disabled={!valid || loading}
          onClick={startVerification}
          className="w-full gap-2"
          variant={valid ? "default" : "secondary"}
        >
          <MessageCircle size={16} /> {loading ? "A preparar ligação..." : "Verificar com WhatsApp"}
        </Button>
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingWhatsApp;
