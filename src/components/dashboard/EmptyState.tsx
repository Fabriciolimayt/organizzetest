import { FileSearch } from "lucide-react";
import { ReactNode, useId } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, message, description, action }: EmptyStateProps) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-5 flex size-12 items-center justify-center rounded-md border border-border bg-muted/55 text-muted-foreground [&_svg]:size-5"
      >
        {icon || <FileSearch />}
      </div>
      <div className="max-w-sm">
        <h3 id={titleId} className="text-sm font-semibold text-foreground">
          {message}
        </h3>
        {description && (
          <p className="mt-2 text-body-small leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
};

export default EmptyState;
