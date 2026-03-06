import { ReactNode } from "react";

interface QuickActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

const QuickActionButton = ({ icon, label, onClick }: QuickActionButtonProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {icon}
    </div>
    <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
      {label}
    </span>
  </button>
);

export default QuickActionButton;
