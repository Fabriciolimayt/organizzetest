import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month?: string;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
}

const MonthSelector = ({
  month = "Março 2026",
  className = "",
  onPrevious,
  onNext,
  disableNext = false,
}: MonthSelectorProps) => (
  <div className={`flex min-w-0 items-center justify-center gap-2 ${className}`}>
    <button
      type="button"
      aria-label="Mês anterior"
      title="Mês anterior"
      onClick={onPrevious}
      disabled={!onPrevious}
      className="focus-ring interactive-control flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-foreground/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      <ChevronLeft size={16} />
    </button>
    <span className="min-w-32 select-none truncate text-center text-body-small font-semibold text-foreground sm:min-w-36">
      {month}
    </span>
    <button
      type="button"
      aria-label="Mês seguinte"
      title="Mês seguinte"
      onClick={onNext}
      disabled={!onNext || disableNext}
      className="focus-ring interactive-control flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-foreground/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      <ChevronRight size={16} />
    </button>
  </div>
);

export default MonthSelector;
