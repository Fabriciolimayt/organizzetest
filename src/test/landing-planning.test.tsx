import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FutureCommitmentsStage from "@/components/landing/FutureCommitmentsStage";
import PlanningStage from "@/components/landing/PlanningStage";
import TrustStage from "@/components/landing/TrustStage";
import { getLandingCopy, type PublicLocale } from "@/components/landing/landingCopy";
import { landingDemo, localizeDemoLabel, type LandingDemo } from "@/components/landing/landingDemo";

afterEach(cleanup);

const money = (value: number, locale: PublicLocale = "pt-PT") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: landingDemo.currency }).format(value);
const normalized = (value: string) => value.replace(/\s/g, " ");

describe.each(["pt-PT", "pt-BR"] as const)("planning landing scenes in %s", (locale) => {
  it("uses the existing scene copy, semantic headings and motion targets", () => {
    const { container } = render(<>
      <FutureCommitmentsStage demo={landingDemo} locale={locale} />
      <PlanningStage demo={landingDemo} locale={locale} />
      <TrustStage locale={locale} />
    </>);

    for (const scene of ["future", "planning", "trust"] as const) {
      const section = container.querySelector(`[data-scene="${scene}"]`);
      expect(section).toHaveAttribute("aria-labelledby", `${scene}-title`);
      expect(screen.getByRole("heading", { level: 2, name: getLandingCopy(locale).scenes[scene].title })).toBeVisible();
      expect(section?.querySelector("[data-motion]")).not.toBeNull();
    }
    expect(screen.getAllByText("Dados demonstrativos")).toHaveLength(2);
  });

  it("renders every due date and labels each fixture status without inventing overdue debt", () => {
    render(<FutureCommitmentsStage demo={landingDemo} locale={locale} />);
    const agenda = screen.getByRole("region", { name: "Agenda de compromissos" });
    const statuses = locale === "pt-PT"
      ? { safe: "Dentro do previsto", warning: "A acompanhar", expense: "Comprometido" }
      : { safe: "Dentro do planejado", warning: "Acompanhar", expense: "Comprometido" };

    for (const item of landingDemo.upcoming) {
      const row = within(agenda).getByText(localizeDemoLabel(item.label, locale)).closest("li");
      expect(row).toHaveAttribute("data-status", item.status);
      expect(row).toHaveTextContent(item.date);
      expect(row).toHaveTextContent(normalized(money(item.amount, locale)));
      expect(row).toHaveTextContent(statuses[item.status]);
      expect(row).not.toHaveTextContent(/atrasad|ultrapassad|excedid/i);
    }
  });

  it("shows spend, cap, usage and factual status for each defined category limit", () => {
    render(<FutureCommitmentsStage demo={landingDemo} locale={locale} />);
    const limits = screen.getByRole("region", { name: "Limites por categoria" });
    const examples = [
      { category: "Casa", spent: 310, cap: 400, percentage: 77.5, status: "safe", label: "Dentro do limite" },
      { category: "Alimentação", spent: 260, cap: 280, percentage: 92.86, status: "warning", label: "Próximo do limite" },
      { category: "Transportes", spent: 180, cap: 150, percentage: 120, status: "expense", label: locale === "pt-PT" ? "Ultrapassado" : "Excedido" },
    ];
    for (const example of examples) {
      const label = localizeDemoLabel(example.category, locale);
      const row = within(limits).getByText(label).closest("li")!;
      const percentage = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(example.percentage);
      expect(row).toHaveTextContent(normalized(money(example.spent, locale)));
      expect(row).toHaveTextContent(normalized(money(example.cap, locale)));
      expect(row).toHaveTextContent(example.label);
      expect(row).toHaveTextContent(`${percentage}% utilizado`);
      expect(row).toHaveAttribute("data-status", example.status);
      const meter = within(row).getByRole("meter", { name: label });
      expect(meter.tagName).toBe("METER");
      expect(meter).toHaveAttribute("value", String(Math.min(100, example.percentage)));
      expect(meter).toHaveAttribute("max", "100");
      expect(meter).toHaveAttribute("aria-valuetext", `${money(example.spent, locale)} de ${money(example.cap, locale)} (${percentage}% utilizado)`);
      expect(meter.nextElementSibling).toHaveAttribute("aria-hidden", "true");
      expect(meter.nextElementSibling?.firstElementChild).toHaveStyle({ width: `${Math.min(100, example.percentage)}%` });
    }
    expect(within(limits).getAllByText("Limite não definido")).toHaveLength(3);
    expect(within(limits).getAllByRole("meter")).toHaveLength(3);
    expect(within(limits).getByText("Valores fictícios, apenas para demonstração.")).toBeVisible();
  });

  it("supports legacy demo fixtures that omit category limits", () => {
    const legacyDemo: LandingDemo = { ...landingDemo };
    delete legacyDemo.limits;
    render(<FutureCommitmentsStage demo={legacyDemo} locale={locale} />);
    const limits = screen.getByRole("region", { name: "Limites por categoria" });
    for (const category of legacyDemo.categories) {
      const row = within(limits).getByText(localizeDemoLabel(category.label, locale)).closest("li");
      expect(row).toHaveTextContent(normalized(money(category.amount, locale)));
      expect(row).toHaveTextContent("Limite não definido");
      expect(row).not.toHaveAttribute("data-status");
    }
    expect(within(limits).queryByRole("meter")).not.toBeInTheDocument();
  });

  it("connects the budget, reserved goals and shared origin in one product surface", () => {
    const { container } = render(<PlanningStage demo={landingDemo} locale={locale} />);
    for (const name of ["Orçamento do mês", "Objetivos", locale === "pt-PT" ? "Espaços partilhados" : "Espaços compartilhados"]) {
      expect(screen.getByRole("heading", { level: 3, name })).toBeVisible();
    }
    expect(container.querySelectorAll("[data-planning-surface]")).toHaveLength(1);
    const budget = screen.getByRole("region", { name: "Orçamento do mês" });
    for (const value of [landingDemo.income, landingDemo.committed, landingDemo.variable, landingDemo.reserved, landingDemo.available]) {
      expect(budget).toHaveTextContent(normalized(money(value, locale)));
    }
    for (const goal of landingDemo.goals) {
      const meter = screen.getByRole("meter", { name: goal.label });
      expect(meter.tagName).toBe("METER");
      expect(meter).toHaveAttribute("value", String(goal.amount));
      expect(meter).toHaveAttribute("max", String(goal.target));
      expect(meter.nextElementSibling).toHaveAttribute("aria-hidden", "true");
      expect(meter).toHaveAttribute("aria-valuetext", `${money(goal.amount, locale)} de ${money(goal.target, locale)}`);
    }
    const shared = landingDemo.sources.find((source) => source.label === "Espaço partilhado")!;
    const spaces = screen.getByRole("region", { name: locale === "pt-PT" ? "Espaços partilhados" : "Espaços compartilhados" });
    expect(spaces).toHaveTextContent(normalized(money(shared.amount, locale)));
    expect(spaces).toHaveTextContent(locale === "pt-PT" ? "Incluído nas despesas variáveis" : "Incluído nos gastos variáveis");
  });

  it("keeps trust claims factual, scoped and free from customer identifiers", () => {
    const { container } = render(<TrustStage locale={locale} />);
    expect(screen.getByRole("heading", { level: 3, name: "Espaços financeiros privados" })).toBeVisible();
    const privacy = screen.getByRole("region", { name: "Privacidade nos detalhes" });
    expect(privacy).toHaveTextContent("Código e imagem do QR");
    expect(privacy).toHaveTextContent("Ocultos nos diagnósticos");
    expect(privacy).toHaveTextContent("WhatsApp");
    expect(privacy.textContent).not.toMatch(/tokens|eventos de atualização/i);
    expect(container).toHaveTextContent("armazenamento privado");
    expect(container).toHaveTextContent("Membros autorizados");
    expect(container).toHaveTextContent(locale === "pt-PT" ? "Terminar sessão" : "Sair da conta");
    expect(container).toHaveTextContent("QR");
    expect(container.textContent).not.toMatch(/SOC\s*2|ISO\s*27001|GDPR|RGPD|LGPD|bancári|99[.,]9|ponta a ponta|100%|@|user_id|space_id|storage_path/i);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("public planning data boundaries", () => {
  it("provides frozen synthetic caps without changing the existing financial totals", () => {
    expect(landingDemo.limits).toEqual([
      { category: "Casa", amount: 400 },
      { category: "Alimentação", amount: 280 },
      { category: "Transportes", amount: 150 },
    ]);
    expect(Object.isFrozen(landingDemo.limits)).toBe(true);
    for (const limit of landingDemo.limits ?? []) {
      expect(Object.isFrozen(limit)).toBe(true);
      expect(landingDemo.categories.some((category) => category.label === limit.category)).toBe(true);
    }
    expect(landingDemo.available).toBe(landingDemo.income - landingDemo.committed - landingDemo.variable - landingDemo.reserved);
  });

  it.each([
    [0, "safe", 0],
    [79.99, "safe", 79.99],
    [79.999, "warning", 80],
    [80, "warning", 80],
    [100, "warning", 100],
    [100.001, "warning", 100],
    [100.01, "expense", 100.01],
    [120, "expense", 120],
  ] as const)("matches the existing rounded thresholds for %s spent against 100", (spent, status, percentage) => {
    render(<FutureCommitmentsStage demo={{ ...landingDemo, categories: [{ label: "Categoria sentinela", amount: spent }], limits: [{ category: "Categoria sentinela", amount: 100 }] }} />);
    expect(screen.getByText("Categoria sentinela").closest("li")).toHaveAttribute("data-status", status);
    const meter = screen.getByRole("meter", { name: "Categoria sentinela" });
    expect(meter).toHaveAttribute("value", String(Math.min(100, percentage)));
    expect(meter).toHaveAttribute("aria-valuetext", `${money(spent)} de ${money(100)} (${new Intl.NumberFormat("pt-PT").format(percentage)}% utilizado)`);
  });

  it.each([0, -100, Number.NaN, Number.POSITIVE_INFINITY])("leaves an invalid cap of %s undefined", (amount) => {
    const { container } = render(<FutureCommitmentsStage demo={{ ...landingDemo, categories: [{ label: "Categoria sentinela", amount: 20 }], limits: [{ category: "Categoria sentinela", amount }] }} />);
    expect(screen.getByText("Categoria sentinela").closest("li")).toHaveTextContent("Limite não definido");
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("uses changed props instead of embedded fixture values", () => {
    const demo: LandingDemo = {
      ...landingDemo,
      income: 900, committed: 200, variable: 100, reserved: 50, available: 550,
      upcoming: [{ label: "Compromisso alternativo", date: "27 out", amount: 200, status: "warning" }],
      categories: [{ label: "Categoria alternativa", amount: 100 }],
      goals: [{ label: "Objetivo alternativo", amount: 50, target: 700 }],
      sources: [{ label: "Espaço partilhado", amount: 100 }],
    };
    render(<><FutureCommitmentsStage demo={demo} /><PlanningStage demo={demo} /></>);
    expect(screen.getByText("Compromisso alternativo").closest("li")).toHaveTextContent("27 out");
    expect(screen.getByText("Categoria alternativa").closest("li")).toHaveTextContent(normalized(money(100)));
    expect(screen.getByRole("meter", { name: "Objetivo alternativo" })).toHaveAttribute("max", "700");
    expect(screen.getByRole("region", { name: "Orçamento do mês" })).toHaveTextContent(normalized(money(550)));
    expect(screen.queryByText("Renda")).not.toBeInTheDocument();
    expect(screen.queryByText("Fundo de emergência")).not.toBeInTheDocument();
  });

  it("handles empty fixtures and zero targets without fabricated data or invalid meters", () => {
    const demo: LandingDemo = {
      ...landingDemo, income: 0, committed: 0, variable: 0, reserved: 0, available: 0,
      upcoming: [], categories: [], sources: [], goals: [{ label: "Sem meta", amount: 0, target: 0 }],
    };
    const { container } = render(<><FutureCommitmentsStage demo={demo} /><PlanningStage demo={demo} /></>);
    expect(screen.getByText("Sem compromissos previstos.")).toBeVisible();
    expect(screen.getByText("Sem despesas por categoria.")).toBeVisible();
    expect(screen.getByText("Sem despesas partilhadas neste mês.")).toBeVisible();
    expect(screen.getByText("Meta não definida")).toBeVisible();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("keeps goal meters bounded while preserving the actual amount", () => {
    render(<PlanningStage demo={{ ...landingDemo, goals: [{ label: "Meta atingida", amount: 800, target: 700 }] }} />);
    const meter = screen.getByRole("meter", { name: "Meta atingida" });
    expect(meter).toHaveAttribute("value", "700");
    expect(meter).toHaveAttribute("aria-valuetext", `${money(800)} de ${money(700)}`);
  });

  it("preserves semantic row identity when demonstration items reorder", () => {
    const scenes = (demo: LandingDemo) => <><FutureCommitmentsStage demo={demo} /><PlanningStage demo={demo} /></>;
    const { rerender } = render(scenes(landingDemo));
    const labels = ["Casa", "Alimentação", "Renda", "Energia", "Viagem", "Fundo de emergência"];
    const rows = labels.map((label) => screen.getByText(label).closest("li"));
    rerender(scenes({
      ...landingDemo,
      categories: [...landingDemo.categories].reverse(),
      upcoming: [...landingDemo.upcoming].reverse(),
      goals: [...landingDemo.goals].reverse(),
    }));
    labels.forEach((label, index) => expect(screen.getByText(label).closest("li")).toBe(rows[index]));
  });

  it("has no live hooks, backend clients, hardcoded fixture import or private paths", () => {
    for (const component of ["FutureCommitmentsStage", "PlanningStage", "TrustStage"]) {
      const source = readFileSync(resolve(process.cwd(), `src/components/landing/${component}.tsx`), "utf8");
      expect(source).not.toMatch(/from\s+["'][^"']*(?:hooks\/|integrations\/|supabase)|\bfetch\(|use(?:Auth|Query|FinancialContext)|import\s*\{\s*landingDemo\s*[,}]/);
      expect(source).not.toMatch(/receipt_path|storage_path|service_role|space_id|user_id|#[0-9a-fA-F]{6}\b/);
    }
  });
});
