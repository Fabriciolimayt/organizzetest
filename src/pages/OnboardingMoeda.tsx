import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import SelectableCard from "@/components/onboarding/SelectableCard";

const currencies = [
  { code: "EUR", symbol: "€", flag: "🇪🇺", name: "Euro", country: "Portugal, Europa" },
  { code: "BRL", symbol: "R$", flag: "🇧🇷", name: "Real", country: "Brasil" },
  { code: "MZN", symbol: "Mt", flag: "🇲🇿", name: "Metical", country: "Moçambique" },
  { code: "USD", symbol: "$", flag: "🇺🇸", name: "Dólar", country: "Estados Unidos" },
];

const OnboardingMoeda = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(
    () => localStorage.getItem("organizze.currency") || "EUR"
  );

  const handleContinue = () => {
    localStorage.setItem("organizze.currency", selected);
    navigate("/onboarding/whatsapp");
  };

  return (
    <OnboardingWizardLayout
      step={2}
      icon={<Coins size={22} />}
      title="Qual é a tua moeda?"
      subtitle="Usada para apresentar todos os valores. Podes mudar mais tarde nas definições."
      onBack={() => navigate("/onboarding/idioma")}
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="flex flex-col gap-3">
        {currencies.map((c) => (
          <SelectableCard
            key={c.code}
            selected={selected === c.code}
            onClick={() => setSelected(c.code)}
            layout="horizontal"
          >
            <span className="text-2xl">{c.flag}</span>
            <span className="text-xl font-bold text-primary w-10 text-center">
              {c.symbol}
            </span>
            <div className="flex-1">
              <div className="font-bold text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.country}</div>
            </div>
          </SelectableCard>
        ))}
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingMoeda;
