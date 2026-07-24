import { Check } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  layout?: "vertical" | "horizontal";
  className?: string;
}

const SelectableCard = ({
  selected,
  onClick,
  children,
  layout = "vertical",
  className = "",
}: Props) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative w-full text-left rounded-2xl transition-all p-4 backdrop-blur-xl border ${
      selected
        ? "border-primary/60 bg-gradient-to-br from-primary/15 to-primary/5 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)]"
        : "border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] hover:border-primary/40 hover:bg-[hsl(var(--glass-highlight))]"
    } ${layout === "vertical" ? "flex flex-col items-center text-center" : "flex items-center gap-4"} ${className}`}
  >
    {selected && (
      <span className="absolute top-3 right-3 w-6 h-6 rounded-full btn-gradient flex items-center justify-center">
        <Check size={14} strokeWidth={3} />
      </span>
    )}
    {children}
  </button>
);

export default SelectableCard;
