import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricVariant = "default" | "positive" | "negative" | "accent";

type MetricItem = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  variant?: MetricVariant;
};

type MetricStripProps = {
  items: MetricItem[];
  className?: string;
  featured?: boolean;
};

const valueClass: Record<MetricVariant, string> = {
  default: "text-foreground",
  positive: "text-financial-income font-semibold",
  negative: "text-financial-expense font-semibold",
  accent: "text-intelligence font-semibold",
};

const MetricStrip = ({ items, className = "", featured = false }: MetricStripProps) => (
  <dl
    data-count={items.length}
    className={cn(
      "grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card text-foreground",
      "product-metrics",
      featured && "product-metrics--featured",
      featured ? "lg:grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))]" : "sm:grid-cols-4",
      className,
    )}
  >
    {items.map((item, index) => {
      const variant = item.variant ?? "default";
      return (
        <div
          key={item.label}
          data-long-value={typeof item.value === "string" && item.value.length > 12 ? "true" : undefined}
          className={`min-w-0 p-4 ${
            index > 0 ? "border-l border-border pl-4 sm:pl-6" : ""
          } ${index > 1 ? "border-t border-border sm:border-t-0" : ""} ${
            featured && index === 0 ? "col-span-2 sm:col-span-1 lg:p-6" : ""
          }`}
        >
          <dt className="font-mono text-label uppercase text-muted-foreground">
            {item.label}
          </dt>
          <dd
            className={`financial-value mt-2 break-words ${
              featured && index === 0 ? "text-3xl sm:text-4xl lg:text-5xl" : "text-xl sm:text-2xl"
            } ${valueClass[variant]}`}
          >
            {item.value}
          </dd>
          {item.detail && (
            <dd className="mt-1.5 break-words text-body-small text-muted-foreground">
              {item.detail}
            </dd>
          )}
        </div>
      );
    })}
  </dl>
);

export type { MetricItem, MetricStripProps };
export default MetricStrip;
