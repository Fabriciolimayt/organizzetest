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
    className={`relative w-full text-left rounded-2xl border-2 transition-all p-4 ${
      selected
        ? "border-primary bg-primary/5"
        : "border-border bg-card hover:border-primary/40"
    } ${layout === "vertical" ? "flex flex-col items-center text-center" : "flex items-center gap-4"} ${className}`}
  >
    {selected && (
      <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
        <Check size={14} strokeWidth={3} />
      </span>
    )}
    {children}
  </button>
);

export default SelectableCard;
