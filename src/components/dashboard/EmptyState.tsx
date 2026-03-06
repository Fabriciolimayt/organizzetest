import { FileSearch } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, message, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
    <div className="text-muted-foreground/40">
      {icon || <FileSearch size={48} />}
    </div>
    <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    {action}
  </div>
);

export default EmptyState;
