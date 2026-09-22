import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

const PageHeader = ({ title, description, eyebrow, actions }: PageHeaderProps) => (
  <header className="product-page-header editorial-reveal flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
    <div className="min-w-0 flex-1">
      {eyebrow && (
        <p className="product-page-header__eyebrow mb-1.5 flex items-center gap-2 font-mono text-label uppercase text-data-blue">
          <span className="h-px w-4 bg-data-blue" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h1 className="editorial-display max-w-4xl break-words text-page-title text-foreground">
        {title}
      </h1>
      {description && (
        <p className="product-page-header__description mt-1.5 max-w-2xl text-body-small text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
  </header>
);

export type { PageHeaderProps };
export default PageHeader;
