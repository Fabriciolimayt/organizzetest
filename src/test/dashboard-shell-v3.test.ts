import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => {
  const absolutePath = resolve(process.cwd(), path);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
};

const source = [
  readSource("src/components/dashboard/DashboardNav.tsx"),
  readSource("src/components/dashboard/DashboardLayout.tsx"),
].join("\n");

describe("dashboard shell v3", () => {
  it("groups desktop navigation and limits mobile primary navigation to five destinations", () => {
    expect(source).toContain('label: "Acompanhar"');
    expect(source).toContain('label: "Planear"');
    expect(source).toContain('label: "Partilhar e automatizar"');
    expect(source).toContain("mobilePrimaryLinks");
    expect(source).toContain('aria-label="Navegação principal"');
    expect(source).toContain('aria-label="Navegação móvel"');
  });
});
