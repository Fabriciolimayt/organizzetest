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

const FinancialRow = ({
  icon,
  title,
  meta,
  amount,
  amountTone = "default",
  action,
  onClick,
}: FinancialRowProps) => {
  const content = (
    <>
      <span
        data-row-icon
        className="surface-quiet flex size-9 shrink-0 items-center justify-center text-primary"
        aria-hidden={!icon}
      >
        {icon}
      </span>
      <span data-row-copy className="min-w-0 flex-1 text-left">
        <span className="block break-words text-body-small font-semibold text-foreground">{title}</span>
        {meta && <span className="block break-words text-body-small text-muted-foreground">{meta}</span>}
      </span>
      {amount !== undefined && (
        <span
          data-row-amount
          className={`financial-value shrink-0 text-sm font-semibold ${
            amountTone === "positive"
              ? "text-financial-income"
              : amountTone === "negative"
              ? "text-financial-expense"
              : "text-foreground"
          }`}
        >
          {amount}
        </span>
      )}
      {action ?? (onClick ? <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" /> : null)}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="product-financial-row focus-ring group interactive-control flex min-h-14 w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted/45"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="product-financial-row flex min-h-14 min-w-0 items-center gap-3 rounded-md px-3 py-2">
      {content}
    </div>
  );
};

export type { FinancialRowProps };
export default FinancialRow;
