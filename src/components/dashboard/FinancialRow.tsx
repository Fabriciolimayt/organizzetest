import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type FinancialRowProps = {
  icon?: ReactNode;
  title: string;
  meta?: ReactNode;
  amount?: ReactNode;
  amountTone?: "default" | "positive" | "negative";
  action?: ReactNode;
  onClick?: () => void;
};

const FinancialRow = ({ icon, title, meta, amount, amountTone = "default", action, onClick }: FinancialRowProps) => {
  const content = (
    <>
      <span className="surface-quiet flex size-10 shrink-0 items-center justify-center text-primary" aria-hidden={!icon}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-body-small font-semibold text-foreground">{title}</span>
        {meta && <span className="block truncate text-body-small text-muted-foreground">{meta}</span>}
      </span>
      {amount !== undefined && (
        <span
          className={`financial-value shrink-0 text-body-small font-semibold ${
            amountTone === "positive" ? "text-data-blue" : amountTone === "negative" ? "text-destructive" : "text-foreground"
          }`}
        >
          {amount}
        </span>
      )}
      {action ?? (onClick ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null)}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="focus-ring interactive-control flex min-h-16 w-full min-w-0 items-center gap-3 px-4 text-left hover:bg-muted">
        {content}
      </button>
    );
  }

  return <div className="flex min-h-16 min-w-0 items-center gap-3 px-4">{content}</div>;
};

export type { FinancialRowProps };
export default FinancialRow;
