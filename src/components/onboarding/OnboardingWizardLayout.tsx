import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import "@/pages/auth-paper.css";

interface Props {
  step: 1 | 2 | 3 | 4;
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

  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div className="entry-editorial entry-onboarding">
      <header className="entry-editorial__header">
        <div className="entry-editorial__header-inner">
          <Logo white />
          <span className="entry-editorial__header-note text-label">
            Configuração segura
          </span>
        </div>
      </header>

      <div
        className="entry-editorial__progress"
        role="progressbar"
        aria-label="Progresso da configuração"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={step}
        aria-valuetext={`Passo ${step} de ${totalSteps}`}
      >
        <span className="font-mono text-label text-muted-foreground">
          {String(step).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
        </span>
        <div className="grid grid-flow-col gap-1.5" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-0.5 w-full ${i + 1 <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <main className="entry-editorial__main">
        <div className="editorial-reveal">
          <div className="entry-editorial__icon">
            {icon}
          </div>
          <div className="max-w-2xl">
            <h1 className="entry-editorial__title">
              {title}
            </h1>
            {subtitle && (
              <div className="entry-editorial__description">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="entry-editorial__content">{children}</div>
      </main>

      <footer className="entry-editorial__footer">
        <div className="entry-editorial__footer-inner">
          <div className="entry-editorial__actions">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Voltar"
              className="focus-ring interactive-control inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-foreground/45 hover:bg-muted"
            >
              <ChevronLeft size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <Button
              size="lg"
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className="w-full max-w-xs"
            >
              {continueLabel} <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>
          {extraFooter && <div className="mt-3">{extraFooter}</div>}
        </div>
      </footer>
    </div>
  );
};

export default OnboardingWizardLayout;
