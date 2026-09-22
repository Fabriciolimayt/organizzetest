import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import SelectableCard from "@/components/onboarding/SelectableCard";

const currencies = [
  { code: "EUR", name: "Euro", example: "1 250,00 €" },
  { code: "BRL", name: "Real", example: "R$ 1.250,00" },
  { code: "MZN", name: "Metical", example: "1 250,00 MT" },
  { code: "USD", name: "Dólar", example: "$1,250.00" },
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
      step={3}
      totalSteps={4}
      icon={<Coins size={22} />}
      title="Como apresentamos os valores?"
      subtitle="Esta será a moeda principal do teu espaço financeiro."
      onBack={() => navigate("/onboarding/idioma")}
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="flex max-w-xl flex-col gap-3">
        {currencies.map((c) => (
          <SelectableCard
            key={c.code}
            selected={selected === c.code}
            onClick={() => setSelected(c.code)}
            layout="horizontal"
          >
            <span className="financial-value w-12 shrink-0 text-xs font-semibold text-primary">{c.code}</span>
            <span className="min-w-0 flex-1 pr-8 text-sm font-semibold text-foreground">{c.name}</span>
            <span className="financial-value hidden shrink-0 pr-9 text-xs text-muted-foreground sm:block">{c.example}</span>
          </SelectableCard>
        ))}
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingMoeda;
