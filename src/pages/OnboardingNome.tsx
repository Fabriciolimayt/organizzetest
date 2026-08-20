import Logo from "@/components/Logo";
import InputField from "@/components/InputField";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import onboardingIllustration from "@/assets/onboarding-illustration.png";

const OnboardingNome = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!name.trim()) return;
    localStorage.setItem("organizze.name", name.trim());
    navigate("/onboarding/idioma");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="w-full border-b border-border bg-card px-6 py-4">
        <Logo />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="surface-panel w-full max-w-3xl overflow-hidden grid md:grid-cols-2">
          {/* Left */}
          <div className="p-8 flex flex-col justify-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Começando sua jornada!</h1>
              <p className="text-muted-foreground text-sm">
                Estamos felizes em ter você aqui. Vamos configurar sua conta em poucos passos.
              </p>
            </div>
            <InputField
              label="Como podemos te chamar?"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              onClick={handleContinue}
              disabled={!name.trim()}
              size="lg"
              variant={name.trim() ? "default" : "secondary"}
              className="w-full py-6 text-base"
            >
              Continuar
            </Button>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center justify-center bg-accent p-6">
            <img
              src={onboardingIllustration}
              alt="Ilustração de boas-vindas"
              className="w-full max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* Chat icon */}
      <div className="fixed bottom-6 left-6">
        <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <MessageCircle size={22} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default OnboardingNome;
