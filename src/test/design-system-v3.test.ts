import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const pageHeader = readFileSync(resolve(process.cwd(), "src/components/dashboard/PageHeader.tsx"), "utf8");
const metricStrip = readFileSync(resolve(process.cwd(), "src/components/dashboard/MetricStrip.tsx"), "utf8");
const financialRow = readFileSync(resolve(process.cwd(), "src/components/dashboard/FinancialRow.tsx"), "utf8");
const emptyState = readFileSync(resolve(process.cwd(), "src/components/dashboard/EmptyState.tsx"), "utf8");
const dashboardCard = readFileSync(resolve(process.cwd(), "src/components/dashboard/DashboardCard.tsx"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));

describe("Organizze neo-editorial design system", () => {
  it("uses the approved editorial tokens and removes legacy glass effects", () => {
    expect(css).toContain("--background: 48 42% 96%");
    expect(css).toContain("--primary: 158 72% 21%");
    expect(css).toContain("--marker: 75 96% 56%");
    expect(css).toContain("--ink-panel: 164 36% 9%");
    expect(css).toContain("font-family: 'DM Sans'");
    expect(css).toContain("font-family: 'Fraunces'");
    expect(css).toContain("font-family: 'IBM Plex Mono'");
    expect(css).not.toContain(".glass-card");
    expect(css).not.toContain("gradient-mesh");
    expect(css).not.toContain("animate-blob");
  });

  it("keeps every legacy Button variant on documented semantic light treatments", () => {
    const defaultClasses = buttonVariants({ variant: "default" });
    const outlineClasses = buttonVariants({ variant: "outline" });
    const glassClasses = buttonVariants({ variant: "glass" });
    const gradientClasses = buttonVariants({ variant: "gradient" });
    const goldClasses = buttonVariants({ variant: "gold" });

    expect(defaultClasses).toContain("bg-primary");
    expect(defaultClasses).toContain("hover:bg-primary-hover");
    expect(outlineClasses).toContain("border-border");
    expect(outlineClasses).toContain("bg-card");
    expect(glassClasses).toContain("border-border");
    expect(glassClasses).toContain("bg-card");
    expect(gradientClasses).toContain("bg-primary");
    expect(goldClasses).toContain("bg-warning-wash");

    for (const classes of [defaultClasses, outlineClasses, glassClasses, gradientClasses, goldClasses]) {
      expect(classes).not.toMatch(/btn-(gradient|glass)|bg-gradient|glow-gold|var\(--gold\)/);
    }
  });

  it("renders skeletons as static muted loading placeholders", () => {
    const { container } = render(createElement(Skeleton));

    const skeleton = container.firstElementChild;
    expect(skeleton).not.toBeNull();
    expect(skeleton).toHaveClass("bg-muted", "opacity-60");
    expect(skeleton).not.toHaveClass("animate-pulse");
  });

  it("exposes a production diagnostics verification command", () => {
    expect(packageJson.scripts["verify:production-diagnostics"]).toBeDefined();
  });

  it("exposes reusable financial primitives with stable interfaces", () => {
    expect(pageHeader).toContain("title: string");
    expect(metricStrip).toContain("items: MetricItem[]");
    expect(financialRow).toContain("amount?: ReactNode");
    expect(emptyState).toContain("description");
    expect(dashboardCard).not.toContain("glass-card");
  });
});
