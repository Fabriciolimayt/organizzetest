import type { PublicLocale } from "./landingCopy";
import type { LandingDemo } from "./landingDemo";

const formatters: Record<PublicLocale, Intl.NumberFormat> = {
  "pt-PT": new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }),
  "pt-BR": new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR" }),
};

export const formatLandingMoney = (value: number, _currency: LandingDemo["currency"], locale: PublicLocale) =>
  formatters[locale].format(value);
