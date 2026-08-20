import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month?: string;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
}

const MonthSelector = ({ month = "Março 2026", className = "", onPrevious, onNext, disableNext = false }: MonthSelectorProps) => (
  <div className={`flex items-center justify-center gap-2 ${className}`}>
    <button type="button" aria-label="Mês anterior" title="Mês anterior" onClick={onPrevious} disabled={!onPrevious} className="focus-ring interactive-control flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
      <ChevronLeft size={20} />
    </button>
    <span className="min-w-[140px] text-center text-base font-semibold text-foreground">{month}</span>
    <button type="button" aria-label="Mês seguinte" title="Mês seguinte" onClick={onNext} disabled={!onNext || disableNext} className="focus-ring interactive-control flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
      <ChevronRight size={20} />
    </button>
  </div>
);

export default MonthSelector;
