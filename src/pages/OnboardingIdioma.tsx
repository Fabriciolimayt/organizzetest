import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import SelectableCard from "@/components/onboarding/SelectableCard";

const languages = [
  { code: "pt", name: "Português", short: "PT" },
  { code: "en", name: "English", short: "EN" },
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
      step={2}
      totalSteps={4}
      icon={<Globe size={22} />}
      title="Em que língua continuamos?"
      subtitle="A navegação e as mensagens da app vão usar esta língua."
      onBack={() => navigate("/onboarding/nome")}
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="flex max-w-xl flex-col gap-3">
        {languages.map((lang) => (
          <SelectableCard
            key={lang.code}
            selected={selected === lang.code}
            onClick={() => setSelected(lang.code)}
            layout="horizontal"
          >
            <span className="financial-value flex size-11 shrink-0 items-center justify-center border-r border-border text-sm text-primary">
              {lang.short}
            </span>
            <span className="min-w-0 flex-1 pr-10">
              <span className="block text-sm font-semibold text-foreground">{lang.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Idioma da aplicação</span>
            </span>
          </SelectableCard>
        ))}
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingIdioma;
