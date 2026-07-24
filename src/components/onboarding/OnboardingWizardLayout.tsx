import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import Blobs from "@/components/Blobs";
import { Button } from "@/components/ui/button";

interface Props {
  step: 1 | 2 | 3;
  totalSteps?: number;
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  extraFooter?: ReactNode;
  children: ReactNode;
}

const OnboardingWizardLayout = ({
  step,
  totalSteps = 3,
  icon,
  title,
  subtitle,
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = "Continuar",
  extraFooter,
  children,
}: Props) => {
  const navigate = useNavigate();
  const progress = (step / totalSteps) * 100;

  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 -z-10">
        <Blobs />
      </div>

      {/* Glass header */}
      <header className="glass-panel py-4 px-6 border-b border-[hsl(var(--glass-border))]">
        <Logo />
      </header>

      {/* Progress bar w/ gradient */}
      <div className="h-1 w-full bg-[hsl(var(--glass-bg))]">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-glow)), hsl(var(--gold)))",
            boxShadow: "0 0 12px hsl(var(--primary-glow) / 0.6)",
          }}
        />
      </div>

      <div className="px-6 py-4 flex items-center justify-between text-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-foreground/80 hover:text-primary-glow transition-colors"
        >
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 === step
                  ? "w-6 bg-gradient-to-r from-primary to-primary-glow"
                  : i + 1 < step
                  ? "w-1.5 bg-primary/80"
                  : "w-1.5 bg-[hsl(var(--glass-border))]"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground font-medium">
          {step} / {totalSteps}
        </span>
      </div>

      <main className="flex-1 px-6 pb-32 max-w-2xl w-full mx-auto">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground mb-5 glow-primary"
          style={{ background: "var(--gradient-primary)" }}
        >
          {icon}
        </div>
        <h1 className="text-4xl md:text-5xl font-normal text-foreground tracking-tight mb-3 font-serif leading-[1.05]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mb-8 text-lg">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </main>

      {/* Sticky glass footer */}
      <div className="fixed bottom-0 inset-x-0 glass-panel border-t border-[hsl(var(--glass-border))] px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="btn-glass w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              aria-label="Voltar"
            >
              <ChevronLeft size={18} />
            </button>
            <Button
              size="lg"
              onClick={onContinue}
              disabled={!canContinue}
              className="flex-1 h-12 text-base font-semibold rounded-full gap-2"
            >
              {continueLabel} <ChevronRight size={18} />
            </Button>
          </div>
          {extraFooter}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizardLayout;
