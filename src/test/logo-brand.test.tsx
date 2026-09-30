import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "@/components/Logo";

describe("shared Organizze brand", () => {
  it("renders the landing mark and wordmark on every surface", () => {
    const { container, rerender } = render(<Logo white />);
    const brand = screen.getByRole("img", { name: "Organizze" });

    expect(brand).toHaveClass("organizze-brand--md", "text-sidebar-foreground");
    expect(brand.querySelectorAll(".organizze-brand__mark i")).toHaveLength(4);
    expect(screen.getByText("Organizze")).toHaveClass("brand-wordmark");

    rerender(<Logo size="sm" markOnly />);
    expect(container.querySelector(".organizze-brand--sm")).toBeInTheDocument();
    expect(container.querySelectorAll(".organizze-brand__mark i")).toHaveLength(4);
    expect(screen.queryByText("Organizze")).not.toBeInTheDocument();
  });
});
