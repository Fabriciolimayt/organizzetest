import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import LandingHeader from "@/components/LandingHeader";
import CentralPromise from "@/components/landing/CentralPromise";
import FinancialPrelude from "@/components/landing/FinancialPrelude";
import MonthlyDashboardStage from "@/components/landing/MonthlyDashboardStage";
import SourceConvergence from "@/components/landing/SourceConvergence";
import { getLandingCopy, type PublicLocale } from "@/components/landing/landingCopy";
import { landingDemo, type LandingDemo } from "@/components/landing/landingDemo";

const copy = getLandingCopy("pt-PT");
const sentinelDemo: LandingDemo = {
  currency: "EUR",
  income: 11_222.1,
  committed: 1_666.65,
  variable: 432.1,
  reserved: 357.92,
  available: 8_765.43,
  sources: [
    { label: "Fonte manual sentinela", amount: 100.1 },
    { label: "Recibo sentinela", amount: 200 },
    { label: "Regra sentinela", amount: 132 },
  ],
  categories: [
    { label: "Habitação sentinela", amount: 111.11 },
    { label: "Mercado sentinela", amount: 222.22 },
    { label: "Transporte sentinela", amount: 98.77 },
  ],
  upcoming: [
    {
      label: "Compromisso seguro sentinela",
      amount: 444.44,
      date: "01 out",
      status: "safe",
    },
    {
      label: "Compromisso alerta sentinela",
      amount: 555.55,
      date: "13 nov",
      status: "warning",
    },
    {
      label: "Compromisso confirmado sentinela",
      amount: 666.66,
      date: "24 dez",
      status: "expense",
    },
  ],
  goals: [
    { label: "Objetivo um sentinela", amount: 123.45, target: 1_234.5 },
    { label: "Objetivo dois sentinela", amount: 234.47, target: 2_344.7 },
  ],
  monthlySeries: [707.07, 808.08, 909.09],
};

const renderPrelude = (demo: LandingDemo, locale?: PublicLocale) =>
  render(createElement(FinancialPrelude, { demo, locale }));

const renderMonth = (demo: LandingDemo, locale?: PublicLocale) =>
  render(createElement(MonthlyDashboardStage, { demo, locale }));

const renderSources = (demo: LandingDemo, locale?: PublicLocale) =>
  render(createElement(SourceConvergence, { demo, locale }));

const renderOpening = () =>
  render(
    createElement(
      MemoryRouter,
      { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      createElement(LandingHeader, { copy }),
      createElement(
        "main",
        null,
        createElement(FinancialPrelude, { demo: landingDemo }),
        createElement(CentralPromise, { copy }),
      ),
    ),
  );

describe("Organizze Basedash-fidelity landing opening", () => {
  it("renders three coordinated sibling planes with stable motion hooks", () => {
    const { container } = renderOpening();
    const prelude = container.querySelector<HTMLElement>('[data-scene="prelude"]');
    const stage = prelude?.querySelector<HTMLElement>('[data-motion="prelude-stage"]');
    const layers = Array.from(
      prelude?.querySelectorAll<HTMLElement>("[data-prelude-layer]") ?? [],
    );

    expect(prelude).not.toBeNull();
    expect(prelude).toHaveAttribute("id", "prelude");
    expect(stage).not.toBeNull();
    expect(layers.map((layer) => layer.dataset.preludeLayer)).toEqual([
      "context",
      "primary",
      "details",
    ]);
    expect(layers.map((layer) => layer.dataset.motion)).toEqual([
      "prelude-context",
      "prelude-primary",
      "prelude-details",
    ]);
    expect(layers.every((layer) => layer.parentElement === stage)).toBe(true);
    expect(
      within(prelude!).getByLabelText("Contexto financeiro demonstrativo"),
    ).toBeInTheDocument();
    expect(
      within(prelude!).getByLabelText("Resumo demonstrativo do mês"),
    ).toBeInTheDocument();
    expect(
      within(prelude!).getByLabelText("Categorias e compromissos demonstrativos"),
    ).toBeInTheDocument();
    expect(within(prelude!).getByText("Disponível")).toBeInTheDocument();
    expect(within(prelude!).getByText("Ritmo das despesas")).toBeInTheDocument();
    expect(within(prelude!).getByText("Dentro do previsto")).toBeInTheDocument();
    expect(within(prelude!).getByText("Distribuição por categoria")).toBeInTheDocument();
    expect(within(prelude!).getByText("Próximos compromissos")).toBeInTheDocument();
  });

  it("renders a complete PT-BR prelude exclusively from the supplied demo", () => {
    const { container } = renderPrelude(sentinelDemo, "pt-BR");
    const prelude = container.querySelector<HTMLElement>('[data-scene="prelude"]');
    const context = prelude?.querySelector<HTMLElement>('[data-prelude-layer="context"]');
    const primary = prelude?.querySelector<HTMLElement>('[data-prelude-layer="primary"]');
    const details = prelude?.querySelector<HTMLElement>('[data-prelude-layer="details"]');

    expect(prelude).not.toBeNull();
    expect(context).not.toBeNull();
    expect(primary).not.toBeNull();
    expect(details).not.toBeNull();
    expect(within(prelude!).getByText("Ritmo dos gastos")).toBeInTheDocument();
    expect(within(prelude!).getByText("Dentro do planejado")).toBeInTheDocument();
    expect(within(primary!).getByText("€ 8.765,43")).toBeInTheDocument();
    expect(within(primary!).getByText("€ 909,09")).toBeInTheDocument();
    expect(within(details!).getByText("3 previstos")).toBeInTheDocument();

    const contextMetrics = [
      ["Receitas", "€ 11.222,10"],
      ["Compromissos", "€ 1.666,65"],
      ["Gastos variáveis", "€ 432,10"],
      ["Reservado", "€ 357,92"],
    ] as const;

    for (const [label, value] of contextMetrics) {
      const term = within(context!).getByText(label, { selector: "dt" });
      expect(within(term.parentElement!).getByText(value, { selector: "dd" })).toBeInTheDocument();
    }

    for (const category of sentinelDemo.categories) {
      expect(within(prelude!).getByText(category.label)).toBeInTheDocument();
      expect(
        within(prelude!).getByText(
          {
            111.11: "€ 111,11",
            222.22: "€ 222,22",
            98.77: "€ 98,77",
          }[category.amount],
        ),
      ).toBeInTheDocument();
    }

    const statusLabels = {
      safe: "Dentro do planejado",
      warning: "Acompanhar",
      expense: "Comprometido",
    } as const;
    const commitmentAmounts: Record<string, string> = {
      "Compromisso seguro sentinela": "€ 444,44",
      "Compromisso alerta sentinela": "€ 555,55",
      "Compromisso confirmado sentinela": "€ 666,66",
    };

    for (const commitment of sentinelDemo.upcoming) {
      const row = within(prelude!).getByRole("article", { name: commitment.label });
      expect(within(row).getByText(commitmentAmounts[commitment.label])).toBeInTheDocument();
      expect(within(row).getByText(commitment.date)).toBeInTheDocument();
      expect(within(row).getByText(statusLabels[commitment.status])).toBeInTheDocument();
    }

    const chart = within(prelude!).getByRole("img", {
      name: "Ritmo dos gastos demonstrativo",
    });
    const summaryId = chart.getAttribute("aria-describedby");
    const summary = summaryId ? prelude!.querySelector(`#${summaryId}`) : null;
    expect(summary).toHaveTextContent(
      "Série demonstrativa de gastos: € 707,07, € 808,08, € 909,09.",
    );
    expect(within(prelude!).queryByText("€ 1.030,00")).not.toBeInTheDocument();
  });

  it("localizes the real demonstration vocabulary for PT-BR", () => {
    const { container } = renderPrelude(landingDemo, "pt-BR");
    const prelude = container.querySelector<HTMLElement>('[data-scene="prelude"]');

    expect(prelude).not.toBeNull();
    expect(within(prelude!).getByRole("article", { name: "Academia" })).toBeInTheDocument();
    expect(within(prelude!).getByText("Academia")).toBeInTheDocument();
    expect(within(prelude!).queryByRole("article", { name: "Ginásio" })).not.toBeInTheDocument();
    expect(within(prelude!).queryByText("Ginásio")).not.toBeInTheDocument();
  });

  it("renders the approved central promise and CTA destinations", () => {
    const { container } = renderOpening();
    const promise = container.querySelector<HTMLElement>('[data-scene="promise"]');

    expect(promise).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: /tudo o que.*organizado/i }),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", {
      name: "Começar 15 dias grátis",
    })) {
      expect(link).toHaveAttribute("href", "/auth");
    }
    expect(
      screen.getByRole("link", { name: "Ver como funciona" }),
    ).toHaveAttribute("href", "#month");
  });

  it("keeps the copy-driven public header accessible on mobile", () => {
    renderOpening();
    const trigger = screen.getByRole("button", { name: "Abrir menu" });

    expect(trigger).toHaveClass("size-11");
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/auth",
    );

    trigger.focus();
    fireEvent.click(trigger);

    const closeTrigger = screen.getByRole("button", { name: "Fechar menu" });
    const mobileNav = screen.getByRole("navigation", { name: "Menu público" });
    expect(closeTrigger).toHaveClass("size-11");
    expect(
      within(mobileNav).getByRole("link", { name: copy.header.method }),
    ).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("navigation", { name: "Menu público" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders an inspectable month with keyboard-operable tabs", () => {
    const { container } = renderMonth(landingDemo, "pt-PT");
    const month = container.querySelector<HTMLElement>('[data-scene="month"]');

    expect(month).not.toBeNull();
    expect(month).toHaveAttribute("id", "month");
    expect(within(month!).getByRole("tab", { name: "Visão mensal" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      within(month!).getByRole("tabpanel", { name: "Visão mensal" }),
    ).toBeInTheDocument();
    expect(
      within(month!).queryByRole("tabpanel", { name: "Categorias" }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(within(month!).getByRole("tab", { name: "Categorias" }), { key: "Enter" });

    expect(within(month!).getByRole("tab", { name: "Categorias" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      within(month!).getByRole("tabpanel", { name: "Categorias" }),
    ).toBeInTheDocument();
    expect(
      within(month!).queryByRole("tabpanel", { name: "Visão mensal" }),
    ).not.toBeInTheDocument();
  });

  it("shows every source converging into one ledger and the same available total", () => {
    const { container } = renderSources(landingDemo, "pt-BR");
    const sources = container.querySelector<HTMLElement>('[data-scene="sources"]');

    expect(sources).not.toBeNull();
    expect(sources).toHaveAttribute("id", "sources");
    for (const source of landingDemo.sources) {
      expect(
        within(sources!).getByRole("heading", { name:
          ({
            "Registo manual": "Lançamento manual",
            Recibo: "Comprovante",
            "Espaço partilhado": "Espaço compartilhado",
          }[source.label] ?? source.label),
        }),
      ).toBeInTheDocument();
    }
    expect(within(sources!).getByText("Total consolidado")).toBeInTheDocument();
    expect(within(sources!).getByText("€ 1.120,00")).toBeInTheDocument();
    expect(within(sources!).getByText("Disponível depois de organizar")).toBeInTheDocument();
    expect(within(sources!).getByText("€ 1.030,00")).toBeInTheDocument();
  });

  it("assigns a distinct position to every source when the fixture grows", () => {
    const demo = { ...landingDemo, sources: [...landingDemo.sources, { label: "Outro registo", amount: 10 }] };
    const { container } = renderSources(demo, "pt-PT");
    const positions = Array.from(container.querySelectorAll<HTMLElement>("[data-source-node]"), node =>
      `${node.style.getPropertyValue("--source-x")}:${node.style.getPropertyValue("--source-y")}`,
    );
    expect(positions).toHaveLength(6);
    expect(new Set(positions).size).toBe(6);
  });
});
