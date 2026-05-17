import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import SelectableCard from "@/components/onboarding/SelectableCard";

const languages = [
  { code: "pt", flag: "🇵🇹", name: "Português", short: "PT" },
  { code: "en", flag: "🇬🇧", name: "English", short: "EN" },
];

const OnboardingIdioma = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(
    () => localStorage.getItem("organizze.locale") || "pt"
  );

  const handleContinue = () => {
    localStorage.setItem("organizze.locale", selected);
    navigate("/onboarding/moeda");
  };

  return (
    <OnboardingWizardLayout
      step={1}
      icon={<Globe size={22} />}
      title="Qual é a tua língua?"
      subtitle="A app vai usar esta língua em todo o lado. Podes mudar mais tarde nas definições."
      onBack={() => navigate("/onboarding/nome")}
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => (
          <SelectableCard
            key={lang.code}
            selected={selected === lang.code}
            onClick={() => setSelected(lang.code)}
          >
            <div className="text-4xl mb-3">{lang.flag}</div>
            <div className="font-bold text-foreground">{lang.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{lang.short}</div>
          </SelectableCard>
        ))}
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingIdioma;
