import type { PublicLocale } from "./landingCopy";

export type DemoAmount = { label: string; amount: number };

export type LandingDemo = {
  currency: "EUR";
  income: number;
  committed: number;
  variable: number;
  reserved: number;
  available: number;
  sources: readonly DemoAmount[];
  categories: readonly DemoAmount[];
  limits?: readonly { category: string; amount: number }[];
  upcoming: readonly (DemoAmount & {
    date: string;
    status: "safe" | "warning" | "expense";
  })[];
  goals: readonly (DemoAmount & { target: number })[];
  monthlySeries: readonly number[];
};

const ptBrDemoLabels: Readonly<Record<string, string>> = Object.freeze({
  "Registo manual": "Lançamento manual",
  Recibo: "Comprovante",
  "Espaço partilhado": "Espaço compartilhado",
  Transportes: "Transporte",
  Renda: "Aluguel",
  Ginásio: "Academia",
});

export const localizeDemoLabel = (
  label: string,
  locale: PublicLocale,
): string => (locale === "pt-BR" ? (ptBrDemoLabels[label] ?? label) : label);

const sources = Object.freeze([
  Object.freeze({ label: "Registo manual", amount: 310 }),
  Object.freeze({ label: "Recibo", amount: 245 }),
  Object.freeze({ label: "Regra recorrente", amount: 210 }),
  Object.freeze({ label: "Espaço partilhado", amount: 155 }),
  Object.freeze({ label: "WhatsApp", amount: 200 }),
]);

const categories = Object.freeze([
  Object.freeze({ label: "Casa", amount: 310 }),
  Object.freeze({ label: "Alimentação", amount: 260 }),
  Object.freeze({ label: "Transportes", amount: 180 }),
  Object.freeze({ label: "Saúde", amount: 120 }),
  Object.freeze({ label: "Lazer", amount: 150 }),
  Object.freeze({ label: "Outros", amount: 100 }),
]);

const limits = Object.freeze([
  Object.freeze({ category: "Casa", amount: 400 }),
  Object.freeze({ category: "Alimentação", amount: 280 }),
  Object.freeze({ category: "Transportes", amount: 150 }),
]);

const upcoming = Object.freeze([
  Object.freeze({ label: "Renda", amount: 950, date: "05 set", status: "expense" as const }),
  Object.freeze({ label: "Energia", amount: 120, date: "09 set", status: "warning" as const }),
  Object.freeze({ label: "Ginásio", amount: 45, date: "14 set", status: "safe" as const }),
  Object.freeze({ label: "Seguro anual", amount: 535, date: "22 set", status: "warning" as const }),
]);

const goals = Object.freeze([
  Object.freeze({ label: "Fundo de emergência", amount: 250, target: 3000 }),
  Object.freeze({ label: "Viagem", amount: 150, target: 1800 }),
]);

const monthlySeries = Object.freeze([
  2780, 2910, 2860, 3040, 2975, 3120, 3090, 3260, 3180, 3340, 3290, 3470,
]);

const income = 4200;
const committed = upcoming.reduce((sum, item) => sum + item.amount, 0);
const variable = sources.reduce((sum, source) => sum + source.amount, 0);
const reserved = goals.reduce((sum, goal) => sum + goal.amount, 0);

export const landingDemo: LandingDemo = Object.freeze({
  currency: "EUR",
  income,
  committed,
  variable,
  reserved,
  available: income - committed - variable - reserved,
  sources,
  categories,
  limits,
  upcoming,
  goals,
  monthlySeries,
});
