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
    aria-pressed={selected}
    className={`focus-ring interactive-control relative min-h-16 w-full rounded-md border px-4 py-3 text-left ${
      selected
        ? "border-primary/70 bg-primary/10"
        : "border-border bg-card hover:border-foreground/45 hover:bg-muted/55"
    } ${layout === "vertical" ? "flex flex-col items-center text-center" : "flex items-center gap-4"} ${className}`}
  >
    {selected && (
      <span className="absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </span>
    )}
    {children}
  </button>
);

export default SelectableCard;
