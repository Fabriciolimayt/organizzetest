import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export type ProductSurfaceProps = ComponentPropsWithoutRef<"div"> & {
  label?: string;
  tone?: "default" | "intelligence" | "income" | "expense" | "warning";
};

const toneClasses: Record<NonNullable<ProductSurfaceProps["tone"]>, string> = {
  default: "border-border",
  intelligence: "border-intelligence/45",
  income: "border-financial-income/45",
  expense: "border-financial-expense/45",
  warning: "border-financial-warning/45",
};

export const ProductSurface = ({
  children,
  className,
  label,
  tone = "default",
  ...props
}: ProductSurfaceProps) => {
  const classes = cn(
    "rounded-lg border bg-[hsl(var(--surface-raised))] text-foreground shadow-[0_24px_80px_hsl(var(--page-canvas)/0.28)]",
    toneClasses[tone],
    className,
  );

  if (label !== undefined) {
    return (
      <section {...props} aria-label={label} className={classes}>
        {children}
      </section>
    );
  }

  return <div {...props} className={classes}>{children}</div>;
};

export default ProductSurface;
