import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, MessageCircle, SkipForward } from "lucide-react";
import AutomationDiagram from "@/components/onboarding/AutomationDiagram";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import { Input } from "@/components/ui/input";
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
  const phoneInvalid = phone.length > 0 && !valid;

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
      step={4}
      totalSteps={4}
      icon={<MessageCircle size={22} />}
      title="Queres ligar o WhatsApp?"
      subtitle="As despesas que enviares são interpretadas e organizadas no teu mês."
      onBack={() => navigate("/onboarding/moeda")}
      onContinue={startVerification}
      canContinue={valid && !loading}
      continueLabel={loading ? "A preparar ligação..." : "Verificar com WhatsApp"}
      extraFooter={
        <div className="text-center">
          <button
            type="button"
            onClick={skip}
            className="focus-ring interactive-control inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <SkipForward size={14} aria-hidden="true" /> Saltar por agora
          </button>
        </div>
      }
    >
      <AutomationDiagram />

      <div className="entry-editorial__phone-fields">
        <div className="min-w-0">
          <label htmlFor="whatsapp-country" className="entry-editorial__field-label text-label">
            País e indicativo
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                id="whatsapp-country"
                type="button"
                aria-expanded={open}
                className="entry-editorial__country focus-ring interactive-control mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-input bg-card px-3.5 text-sm hover:border-foreground/45 hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-label">{country.code}</span>
                  <span className="min-w-0 break-words text-left font-medium">{country.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  {country.ddi}
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="entry-editorial entry-editorial__countries w-[var(--radix-popover-trigger-width)] p-1" align="start">
              {WA_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                  }}
                  aria-current={c.code === country.code ? "true" : undefined}
                  className={`focus-ring flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${
                    c.code === country.code ? "bg-secondary" : ""
                  }`}
                >
                  <span className="font-mono text-label">{c.code}</span>
                  <span className="min-w-0 flex-1 break-words font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.ddi}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="min-w-0">
          <label htmlFor="whatsapp-phone" className="entry-editorial__field-label text-label">
            Número de WhatsApp
          </label>
          <div className="mt-2 flex min-w-0 gap-2">
            <div className="flex min-h-12 shrink-0 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
              {country.ddi}
            </div>
            <Input
              id="whatsapp-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder={country.placeholder}
              maxLength={18}
              aria-invalid={phoneInvalid}
              aria-describedby={phoneInvalid ? "whatsapp-phone-hint whatsapp-phone-error" : "whatsapp-phone-hint"}
              className="h-12 min-w-0 flex-1 text-base"
            />
          </div>
          <p id="whatsapp-phone-hint" className="mt-2 text-xs leading-5 text-muted-foreground">
            Introduz o número nacional, sem repetir o indicativo.
          </p>
          {phoneInvalid && (
            <p id="whatsapp-phone-error" role="alert" className="mt-2 text-body-small text-financial-expense">
              O número de {country.name} precisa de pelo menos {country.minDigits} dígitos.
            </p>
          )}
        </div>
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingWhatsApp;
