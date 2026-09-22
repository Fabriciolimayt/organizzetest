import OnboardingWizardLayout from "@/components/onboarding/OnboardingWizardLayout";
import { Input } from "@/components/ui/input";
import { UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const OnboardingNome = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!name.trim()) return;
    localStorage.setItem("organizze.name", name.trim());
    navigate("/onboarding/idioma");
  };

  return (
    <OnboardingWizardLayout
      step={1}
      totalSteps={4}
      icon={<UserRound size={21} />}
      title="Como te devemos chamar?"
      subtitle="Este nome identifica o teu espaço e pode ser alterado mais tarde."
      onContinue={handleContinue}
      canContinue={!!name.trim()}
    >
      <div className="max-w-xl">
        <label htmlFor="onboarding-name" className="font-mono text-label uppercase text-muted-foreground">
          O teu nome
        </label>
        <Input
          id="onboarding-name"
          name="name"
          autoComplete="name"
          placeholder="Ex.: Fabricio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-3 h-16 px-4 text-xl sm:text-2xl"
        />
        <p className="mt-3 text-sm text-muted-foreground">Usaremos o nome introduzido nas mensagens da app.</p>
      </div>
    </OnboardingWizardLayout>
  );
};

export default OnboardingNome;
