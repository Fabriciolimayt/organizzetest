import { ReactNode } from "react";

interface QuickActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

const QuickActionButton = ({ icon, label, onClick }: QuickActionButtonProps) => (
  <button
    onClick={onClick}
    type="button"
    className="focus-ring group flex min-h-20 min-w-20 flex-col items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/45 active:scale-[0.98]"
  >
    <div className="surface-quiet flex h-12 w-12 items-center justify-center text-primary transition-colors group-hover:border-primary/45">
      {icon}
    </div>
    <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
      {label}
    </span>
  </button>
);

export default QuickActionButton;
