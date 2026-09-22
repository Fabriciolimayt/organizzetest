import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DecisionPanelProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "intelligence" | "warning" | "neutral";
  headingLevel?: 2 | 3 | 4;
};

export default function DecisionPanel({
  eyebrow,
  title,
  description,
  action,
  tone = "intelligence",
  headingLevel = 2,
}: DecisionPanelProps) {
  const Heading = headingLevel === 3 ? "h3" : headingLevel === 4 ? "h4" : "h2";

  return (
    <section
      data-tone={tone}
      className={cn(
        "product-decision functional-panel p-5 sm:p-6",
        tone === "intelligence" && "intelligence-panel",
        tone === "warning" && "border-financial-warning/45",
      )}
    >
      <p
        className={cn(
          "text-label uppercase tracking-[0.12em]",
          tone === "warning" ? "text-financial-warning" : "text-intelligence",
        )}
      >
        {eyebrow}
      </p>
      <Heading className="mt-6 max-w-lg text-2xl font-semibold leading-tight text-foreground">{title}</Heading>
      {description && <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
