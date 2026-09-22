import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import postcss from "postcss";

import AvailableAmountStage from "@/components/landing/AvailableAmountStage";
import availableSource from "@/components/landing/AvailableAmountStage?raw";
import WhatsAppDecisionStage from "@/components/landing/WhatsAppDecisionStage";
import interpretationSource from "@/components/landing/WhatsAppDecisionStage?raw";
import { getLandingCopy, type PublicLocale } from "@/components/landing/landingCopy";
import { landingDemo, type LandingDemo } from "@/components/landing/landingDemo";

const money = (amount: number, locale: PublicLocale = "pt-PT") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" })
    .format(amount)
    .replace(/\s/g, " ");

const sentinelDemo: LandingDemo = {
  ...landingDemo,
  income: 2350.95,
  committed: 975.25,
  variable: 321.15,
  reserved: 122.45,
  available: 932.1,
  sources: [{ label: "WhatsApp", amount: 321.15 }],
  categories: [{ label: "Transportes", amount: 321.15 }],
};

describe("public interpretation and available amount scenes", () => {
  it("exposes the ordered financial sequence with semantic headings and motion hooks", () => {
    const { container } = render(<WhatsAppDecisionStage demo={landingDemo} />);
    const scene = screen.getByRole("region", { name: getLandingCopy("pt-PT").scenes.whatsapp.title });
    const sequence = within(scene).getByRole("list", { name: "Da origem ao disponível" });
    const steps = within(sequence).getAllByRole("listitem");

    expect(scene).toHaveAttribute("id", "whatsapp");
    expect(scene).toHaveAttribute("data-scene", "whatsapp");
    expect(steps.map((step) => step.dataset.step)).toEqual([
      "input", "interpretation", "category", "transaction", "available",
    ]);
    for (const [index, title] of ["WhatsApp", "Interpretação", "Categoria", "Lançamento", "Disponível"].entries()) {
      expect(within(steps[index]).getByRole("heading", { name: title, level: 3 })).toBeVisible();
      expect(steps[index]).toHaveAttribute("data-motion", `whatsapp-${steps[index].dataset.step}`);
    }
    expect(container.querySelector('[data-motion="whatsapp-stage"]')).not.toBeNull();
  });

  it("shows synthetic text and receipt artifacts for one expense, never a conversation", () => {
    const { container } = render(<WhatsAppDecisionStage demo={landingDemo} />);
    const source = landingDemo.sources.find((item) => item.label === "WhatsApp")!;
    const text = screen.getByRole("figure", { name: "Texto de exemplo" });
    const receipt = screen.getByRole("figure", { name: "Recibo sintético" });

    expect(within(text).getByText(new RegExp(money(source.amount)))).toBeVisible();
    expect(within(receipt).getByText(money(source.amount))).toBeVisible();
    expect(screen.getByText("Exemplo sintético")).toBeVisible();
    expect(screen.getByText(/duas formas da mesma despesa/i)).toBeVisible();
    expect(screen.getByText("Proposta a confirmar")).toBeVisible();
    expect(container.querySelector('[role="log"], textarea, input, button')).toBeNull();
    expect(interpretationSource).not.toMatch(/chat-bubble|read receipt|message transcript|MessageCircle|CheckCheck/i);
  });

  it("surrounds one interpretation panel with source planes and three unframed results", () => {
    const { container } = render(<WhatsAppDecisionStage demo={landingDemo} />);
    const sequence = screen.getByRole("list", { name: "Da origem ao disponível" });
    const panel = sequence.querySelector<HTMLElement>(".interpretation-panel")!;
    const planes = sequence.querySelectorAll<HTMLElement>("[data-context-shift]");
    const results = sequence.querySelectorAll<HTMLElement>(".interpretation-result");

    expect(sequence.children).toHaveLength(5);
    expect(panel).toHaveAttribute("data-step", "interpretation");
    expect(planes).toHaveLength(2);
    for (const plane of planes) {
      expect(plane.closest('[data-step="input"]')).not.toBeNull();
      expect(plane).not.toHaveAttribute("data-motion");
      expect(plane.querySelector("figure[data-motion] > figcaption")).not.toBeNull();
    }
    expect(Array.from(results, (result) => result.dataset.step)).toEqual(["category", "transaction", "available"]);
    for (const result of results) expect(result.parentElement).toBe(sequence);
    expect(panel.querySelector("[data-scan-beam]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".interpretation-panel")).toHaveLength(1);
    expect(interpretationSource).not.toContain("ProductSurface");
  });

  it.each<PublicLocale>(["pt-PT", "pt-BR"])("retains accessible PixelReveal headings in %s", (locale) => {
    const { container } = render(<>
      <WhatsAppDecisionStage demo={landingDemo} locale={locale} />
      <AvailableAmountStage demo={landingDemo} locale={locale} />
    </>);
    for (const scene of ["whatsapp", "available"] as const) {
      const heading = screen.getByRole("heading", { level: 2, name: getLandingCopy(locale).scenes[scene].title });
      expect(heading).toHaveAttribute("id", `${scene}-title`);
      expect(heading).toHaveClass("interpretation-title", "pixel-reveal");
      expect(heading.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
      expect(container.querySelector(`#${scene}`)).toHaveAttribute("aria-labelledby", heading.id);
    }
  });

  it.each<PublicLocale>(["pt-PT", "pt-BR"])("uses supplied values throughout the %s sequence without deducting twice", (locale) => {
    const { container } = render(<WhatsAppDecisionStage demo={sentinelDemo} locale={locale} />);
    const category = container.querySelector<HTMLElement>('[data-step="category"]')!;
    const transaction = container.querySelector<HTMLElement>('[data-step="transaction"]')!;
    const available = container.querySelector<HTMLElement>('[data-step="available"]')!;
    const label = locale === "pt-BR" ? "Transporte" : "Transportes";

    expect(screen.getByRole("heading", { level: 2, name: getLandingCopy(locale).scenes.whatsapp.title })).toBeVisible();
    expect(within(category).getByText(label)).toBeVisible();
    expect(within(transaction).getByText(money(321.15, locale))).toBeVisible();
    expect(within(available).getByText(money(1253.25, locale))).toBeVisible();
    expect(within(available).getByText(money(932.1, locale))).toBeVisible();
    expect(screen.queryByText(money(1030, locale))).not.toBeInTheDocument();
    expect(screen.getByRole("figure", {
      name: locale === "pt-BR" ? "Comprovante sintético" : "Recibo sintético",
    })).toBeVisible();
  });

  it.each<PublicLocale>(["pt-PT", "pt-BR"])("labels every term and the auditable equation in %s", (locale) => {
    const { container } = render(<AvailableAmountStage demo={sentinelDemo} locale={locale} />);
    const copy = getLandingCopy(locale).scenes.available;
    const scene = screen.getByRole("region", { name: copy.title });
    const terms = [
      [locale === "pt-BR" ? "Rendas esperadas" : "Rendimentos esperados", 2350.95],
      ["Custos comprometidos", 975.25],
      [locale === "pt-BR" ? "Gastos variáveis" : "Despesas variáveis", 321.15],
      ["Objetivos reservados", 122.45],
      ["Disponível", 932.1],
    ] as const;

    expect(scene).toHaveAttribute("data-scene", "available");
    expect(scene).toHaveAttribute("id", "available");
    for (const [label, value] of terms) {
      const term = within(scene).getByText(label, { selector: "dt" });
      expect(within(term.parentElement!).getByText(money(value, locale), { selector: "dd" })).toBeVisible();
    }
    const equation = within(scene).getByRole("math");
    expect(equation).toHaveAccessibleName(/menos.*menos.*menos.*igual a/);
    expect(equation).toHaveTextContent(
      `${money(2350.95, locale)} − ${money(975.25, locale)} − ${money(321.15, locale)} − ${money(122.45, locale)} = ${money(932.1, locale)}`,
    );
    expect(screen.getByText(/Se faltarem movimentos ou compromissos, o disponível pode mudar/)).toBeVisible();
    expect(container.querySelector('[data-motion="available-stage"]')).not.toBeNull();
    expect(container.querySelector('[data-motion="available-value"]')).not.toBeNull();
  });

  it("keeps a negative available result explicit instead of clamping it to zero", () => {
    render(<AvailableAmountStage demo={{ ...sentinelDemo, income: 1000, available: -418.85 }} />);
    const term = screen.getByText("Disponível", { selector: "dt" });
    expect(within(term.parentElement!).getByText(money(-418.85), { selector: "dd" })).toBeVisible();
    expect(screen.getByRole("math")).toHaveTextContent(money(-418.85));
  });

  it("keeps context terms separate from the focused answer and animates real content leaves", () => {
    const { container } = render(<AvailableAmountStage demo={sentinelDemo} />);
    const context = screen.getByRole("group", { name: "Componentes do cálculo" });
    const planes = context.querySelectorAll<HTMLElement>("[data-context-shift]");
    const answer = container.querySelector<HTMLElement>(".available-answer")!;

    expect(planes).toHaveLength(4);
    for (const plane of planes) {
      expect(plane.tagName).toBe("DL");
      expect(plane).not.toHaveAttribute("data-motion");
      const row = plane.querySelector<HTMLElement>("[data-motion]")!;
      expect(row.children[0].tagName).toBe("DT");
      expect(row.children[1].tagName).toBe("DD");
      expect(row.querySelector("[data-motion]")).toBeNull();
    }
    expect(answer.parentElement).toBe(context.parentElement);
    expect(answer).toHaveAttribute("data-motion", "available-value");
    expect(within(answer).getByText(money(sentinelDemo.available))).toBeVisible();
    expect(container.querySelector("[data-scan-beam]")).toBeNull();
    expect(availableSource).not.toContain("ProductSurface");
  });

  it("retains an explicitly supplied available value rather than replacing the fixture's arithmetic", () => {
    const { container } = render(<AvailableAmountStage demo={{ ...sentinelDemo, available: 0 }} />);
    expect(within(container.querySelector<HTMLElement>(".available-answer")!).getByText(money(0))).toBeVisible();
    expect(screen.getByRole("math")).toHaveTextContent(`= ${money(0)}`);
    expect(screen.getByText(/não é uma garantia de saldo bancário/)).toBeVisible();
  });

  it("does not fabricate an expense when a supplied fixture has no source or category", () => {
    render(<WhatsAppDecisionStage demo={{ ...landingDemo, sources: [], categories: [] }} />);
    expect(screen.getByText("Sem exemplo de despesa neste conjunto demonstrativo.")).toBeVisible();
    expect(screen.queryByRole("figure", { name: "Recibo sintético" })).not.toBeInTheDocument();
    expect(screen.getByText(money(landingDemo.available))).toBeVisible();
  });

  it.each([
    { sources: [], categories: sentinelDemo.categories },
    { sources: sentinelDemo.sources, categories: [] },
    { sources: [{ label: "WhatsApp", amount: 0 }], categories: sentinelDemo.categories },
    { sources: sentinelDemo.sources, categories: [{ label: "Transportes", amount: 0 }] },
  ])("does not suggest completed interpretation for an empty expense variant: %j", (values) => {
    const { container } = render(<WhatsAppDecisionStage demo={{ ...sentinelDemo, ...values }} locale="pt-BR" />);
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    expect(container.querySelector("[data-scan-beam]")).toBeNull();
    expect(screen.getByText("Sem categoria")).toBeVisible();
    expect(screen.getByText("Sem lançamento")).toBeVisible();
    expect(screen.getByText(money(sentinelDemo.available, "pt-BR"))).toBeVisible();
  });

  it("caps the synthetic example by its category without changing the supplied month", () => {
    const { container } = render(<WhatsAppDecisionStage demo={{
      ...sentinelDemo,
      sources: [{ label: "WhatsApp", amount: 500 }],
      categories: [{ label: "Transportes", amount: 100 }],
    }} />);
    expect(within(container.querySelector<HTMLElement>('[data-step="transaction"]')!).getByText(money(100))).toBeVisible();
    expect(within(container.querySelector<HTMLElement>('[data-step="available"]')!).getByText(money(1032.1))).toBeVisible();
    expect(within(container.querySelector<HTMLElement>('[data-step="available"]')!).getByText(money(932.1))).toBeVisible();
  });

  it("scopes every style to these landing scenes and leaves mobile content in document flow", () => {
    const interpretationCss = readFileSync("src/components/landing/interpretation.css", "utf8");
    const css = postcss.parse(interpretationCss);
    css.walkRules((rule) => {
      for (const selector of rule.selectors) {
        expect(selector).toMatch(/^\.landing-page \.(?:interpretation-|available-)/);
      }
    });
    const mobile: string[] = [];
    css.walkAtRules("media", (rule) => {
      if (rule.params === "(max-width: 599px)") mobile.push(rule.toString());
    });
    expect(mobile.join("\n")).toMatch(/available-context-terms[^}]*grid-area: auto/);
    expect(mobile.join("\n")).toMatch(/available-answer[^}]*grid-area: auto/);
    expect(interpretationCss).not.toMatch(/blur\(|display:\s*none|visibility:\s*hidden|font-size:[^;]*vw/);
    expect(interpretationCss).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps both components presentation-only with no private data, live hooks or side effects", () => {
    for (const source of [interpretationSource, availableSource]) {
      expect(source).not.toMatch(/@\/(?:hooks|integrations)|supabase|useQuery|useMutation|fetch\(|localStorage|sessionStorage|useEffect|phone|receipt_path|user_id|space_id/);
      expect(source).not.toMatch(/import\s*\{[^}]*\blandingDemo\b/);
    }
  });
});
