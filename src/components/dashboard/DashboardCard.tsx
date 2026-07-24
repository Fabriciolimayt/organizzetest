import { ReactNode } from "react";

interface DashboardCardProps {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const DashboardCard = ({ title, headerRight, children, className = "", noPadding }: DashboardCardProps) => (
  <div className={`glass-card transition-shadow hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.35)] ${className}`}>
    {title && (
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h3 className="font-serif text-lg font-semibold text-foreground tracking-tight">{title}</h3>
        {headerRight}
      </div>
    )}
    <div className={noPadding ? "" : "p-5"}>{children}</div>
  </div>
);

export default DashboardCard;
