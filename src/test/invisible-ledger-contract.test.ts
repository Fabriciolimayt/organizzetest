import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Invisible Ledger visual contract", () => {
  it("defines the approved dark functional tokens", () => {
    const css = read("src/index.css");
    expect(css).toContain("--void: var(--page-canvas)");
    expect(css).toContain("--intelligence: var(--brand-intelligence)");
    expect(css).toContain("--financial-income: var(--status-income)");
    expect(css).toContain("--financial-expense: var(--status-expense)");
    expect(css).toContain("--financial-warning: var(--status-warning)");
  });

  it("documents functional preservation and reduced motion", () => {
    const design = read("DESIGN.md");
    expect(design).toContain("Intelligence In Silence");
    expect(design).toContain("Functional Preservation");
    expect(design).toContain("prefers-reduced-motion");
  });

  it("keeps landing motion isolated from the app shell", () => {
    const app = read("src/App.tsx");
    const landingMotion = read("src/components/landing/useLandingMotion.ts");
    expect(app).not.toContain('from "gsap"');
    expect(landingMotion).toContain('import("gsap")');
    expect(landingMotion).toContain("prefers-reduced-motion");
  });

  it("mounts landing motion from public scene sections", () => {
    const landing = read("src/pages/Index.tsx");
    const landingScene = read("src/components/landing/LandingScene.tsx");
    expect(landing).toContain('useRef');
    expect(landing).toContain('import { useLandingMotion } from "@/components/landing/useLandingMotion"');
    expect(landing).toContain("useLandingMotion(landingRef)");
    expect(landing).toContain("<FinancialPrelude");
    expect(landing).toContain("<BrandSignature");
    expect(landingScene).toContain("data-scene");
  });
});
