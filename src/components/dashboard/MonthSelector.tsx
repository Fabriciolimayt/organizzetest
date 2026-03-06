import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month?: string;
  className?: string;
}

const MonthSelector = ({ month = "Março 2026", className = "" }: MonthSelectorProps) => (
  <div className={`flex items-center justify-center gap-4 ${className}`}>
    <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
      <ChevronLeft size={20} />
    </button>
    <span className="font-semibold text-foreground text-base min-w-[140px] text-center">{month}</span>
    <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
      <ChevronRight size={20} />
    </button>
  </div>
);

export default MonthSelector;
