import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface DashboardCardProps {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const DashboardCard = ({ title, headerRight, children, className = "", noPadding }: DashboardCardProps) => (
  <Card className={`shadow-sm border-border/50 ${className}`}>
    {title && (
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {headerRight}
      </CardHeader>
    )}
    <CardContent className={noPadding ? "p-0" : ""}>{children}</CardContent>
  </Card>
);

export default DashboardCard;
