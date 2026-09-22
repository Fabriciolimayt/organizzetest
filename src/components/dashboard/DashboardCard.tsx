import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  headingLevel?: 2 | 3 | 4;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const DashboardCard = ({
  title,
  headingLevel = 3,
  description,
  headerRight,
  children,
  className = "",
  noPadding,
}: DashboardCardProps) => {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-foreground",
        "product-data-section",
        className
      )}
    >
      {title && (
        <div className="product-data-section__header flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <Heading className="product-data-section__heading text-lg font-semibold leading-tight text-foreground">{title}</Heading>
            {description && <p className="mt-0.5 text-body-small text-muted-foreground">{description}</p>}
          </div>
          {headerRight}
        </div>
      )}
      <div className={noPadding ? "" : "product-data-section__body p-5"}>{children}</div>
    </section>
  );
};

export default DashboardCard;
