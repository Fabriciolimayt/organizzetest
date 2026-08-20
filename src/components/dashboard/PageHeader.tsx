import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

const PageHeader = ({ title, description, eyebrow, actions }: PageHeaderProps) => (
  <header className="editorial-reveal flex flex-wrap items-end justify-between gap-5 border-b border-foreground pb-6">
    <div className="min-w-0">
      {eyebrow && <p className="mb-3 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase text-data-blue"><span className="h-2 w-2 bg-data-blue" />{eyebrow}</p>}
      <h1 className="editorial-display max-w-4xl text-4xl font-semibold leading-[0.98] text-foreground sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-body text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export type { PageHeaderProps };
export default PageHeader;
