import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const DashboardCard = ({ title, description, headerRight, children, className = "", noPadding }: DashboardCardProps) => (
  <section className={cn("surface-panel overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:border-foreground/50", className)}>
    {title && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="editorial-display text-xl font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-1 text-body-small text-muted-foreground">{description}</p>}
        </div>
        {headerRight}
      </div>
    )}
    <div className={noPadding ? "" : "p-5"}>{children}</div>
  </section>
);

export default DashboardCard;
