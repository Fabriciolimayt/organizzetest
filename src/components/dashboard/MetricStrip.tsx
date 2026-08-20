import type { ReactNode } from "react";

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
  positive: "text-data-blue",
  negative: "text-destructive",
  accent: "text-data-violet",
};

const MetricStrip = ({ items, className = "", featured = false }: MetricStripProps) => (
  <dl className={`grid grid-cols-2 border-y border-foreground ${featured ? "lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]" : "sm:grid-cols-4"} ${className}`}>
    {items.map((item, index) => {
      const variant = item.variant ?? "default";
      return (
        <div
          key={item.label}
          className={`min-w-0 py-5 pr-4 ${index > 0 ? "border-l border-border pl-4" : ""} ${index > 1 ? "border-t sm:border-t-0" : ""} ${featured && index === 0 ? "col-span-2 sm:col-span-1 lg:py-7" : ""}`}
        >
          <dt className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">{item.label}</dt>
          <dd className={`financial-value mt-2 break-words ${featured && index === 0 ? "text-4xl sm:text-5xl lg:text-6xl" : "text-value"} ${valueClass[variant]}`}>{item.value}</dd>
          {item.detail && <dd className="mt-1 text-body-small text-muted-foreground">{item.detail}</dd>}
        </div>
      );
    })}
  </dl>
);

export type { MetricItem, MetricStripProps };
export default MetricStrip;
