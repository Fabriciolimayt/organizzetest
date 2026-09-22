import { describe, expect, it } from "vitest";

import {
  getLandingCopy,
  resolvePublicLocale,
  type SceneId,
} from "@/components/landing/landingCopy";

const sceneIds: SceneId[] = [
  "prelude",
  "promise",
  "month",
  "sources",
  "whatsapp",
  "available",
  "future",
  "planning",
  "trust",
  "plans",
  "signature",
];

describe("public landing locale", () => {
  it("prioritizes an explicit supported locale, then browser language, then PT-PT", () => {
    expect(resolvePublicLocale("pt-BR", "pt-PT")).toBe("pt-BR");
    expect(resolvePublicLocale("pt-PT", "pt-BR")).toBe("pt-PT");
    expect(resolvePublicLocale(null, "pt-BR")).toBe("pt-BR");
    expect(resolvePublicLocale(undefined, "PT-br-u-nu-latn")).toBe("pt-BR");
    expect(resolvePublicLocale(null, "en-US")).toBe("pt-PT");
    expect(resolvePublicLocale("en-US", "pt-BR")).toBe("pt-BR");
  });

  it("provides complete PT-PT and PT-BR copy for every public scene", () => {
    for (const locale of ["pt-PT", "pt-BR"] as const) {
      const copy = getLandingCopy(locale);

      expect(Object.keys(copy.scenes)).toEqual(sceneIds);
      expect(Object.values(copy.header).every(Boolean)).toBe(true);
      expect(Object.values(copy.sourceLabels).every(Boolean)).toBe(true);
      expect(Object.values(copy.planNames).every(Boolean)).toBe(true);

      for (const scene of Object.values(copy.scenes)) {
        expect(scene.eyebrow.trim()).not.toBe("");
        expect(scene.title.trim()).not.toBe("");
        expect(scene.description.trim()).not.toBe("");
      }
    }
  });

  it("keeps the required calls to action and dialect-specific promise", () => {
    expect(getLandingCopy("pt-PT").primaryCta).toBe("Começar 15 dias grátis");
    expect(getLandingCopy("pt-PT").secondaryCta).toBe("Ver como funciona");
    expect(getLandingCopy("pt-BR").promiseTitle).toContain("você");
    expect(getLandingCopy("pt-PT").finalStatement).toBe(
      "É tempo de ver o mês antes que ele aconteça.",
    );
  });

  it("does not make absolute financial guarantees", () => {
    const publicCopy = JSON.stringify([
      getLandingCopy("pt-PT"),
      getLandingCopy("pt-BR"),
    ]);

    expect(publicCopy).not.toMatch(
      /garantimos|resultado garantido|controlo total|controle total|sem risco|nunca falha/i,
    );
  });
});
