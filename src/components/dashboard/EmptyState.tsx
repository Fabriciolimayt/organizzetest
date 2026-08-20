import { FileSearch } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, message, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
    <div className="text-muted-foreground/50">
      {icon || <FileSearch size={48} />}
    </div>
    <div className="max-w-sm">
      <p className="text-sm font-semibold text-foreground">{message}</p>
      {description && <p className="mt-1 text-body-small text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

export default EmptyState;
