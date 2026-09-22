import { describe, expect, it } from "vitest";

import { landingDemo, localizeDemoLabel } from "@/components/landing/landingDemo";

describe("public landing demonstration data", () => {
  it("keeps the available amount and source totals internally consistent", () => {
    expect(
      landingDemo.income -
        landingDemo.committed -
        landingDemo.variable -
        landingDemo.reserved,
    ).toBe(landingDemo.available);
    expect(
      landingDemo.sources.reduce((sum, source) => sum + source.amount, 0),
    ).toBe(landingDemo.variable);
    expect(
      landingDemo.categories.reduce((sum, category) => sum + category.amount, 0),
    ).toBe(landingDemo.variable);
  });

  it("contains the complete, frozen EUR presentation fixture", () => {
    expect(landingDemo.currency).toBe("EUR");
    expect(landingDemo.sources).toHaveLength(5);
    expect(landingDemo.categories).toHaveLength(6);
    expect(landingDemo.upcoming).toHaveLength(4);
    expect(landingDemo.goals).toHaveLength(2);
    expect(landingDemo.monthlySeries).toHaveLength(12);
    expect(Object.isFrozen(landingDemo)).toBe(true);
    expect(Object.isFrozen(landingDemo.sources)).toBe(true);
  });

  it("contains no customer or real-world identifiers", () => {
    expect(JSON.stringify(landingDemo)).not.toMatch(
      /@|\+\d{8}|user_id|space_id|receipt_path/i,
    );
  });

  it("localizes the finite demo vocabulary without changing neutral or unknown labels", () => {
    const translations = [
      ["Registo manual", "Lançamento manual"],
      ["Recibo", "Comprovante"],
      ["Espaço partilhado", "Espaço compartilhado"],
      ["Transportes", "Transporte"],
      ["Renda", "Aluguel"],
      ["Ginásio", "Academia"],
    ] as const;

    for (const [source, translated] of translations) {
      expect(localizeDemoLabel(source, "pt-PT")).toBe(source);
      expect(localizeDemoLabel(source, "pt-BR")).toBe(translated);
    }
    expect(localizeDemoLabel("Casa", "pt-BR")).toBe("Casa");
    expect(localizeDemoLabel("Energia", "pt-BR")).toBe("Energia");
    expect(localizeDemoLabel("Rótulo sentinela", "pt-BR")).toBe("Rótulo sentinela");
  });
});
