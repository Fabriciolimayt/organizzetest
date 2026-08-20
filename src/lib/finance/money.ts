const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function parseCurrencyInput(value: string, locale: string): number {
  const separators = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = separators.find((part) => part.type === "group")?.value;
  const decimal = separators.find((part) => part.type === "decimal")?.value ?? ".";
  let normalized = value.trim().replace(/[−﹣－]/g, "-");

  if (group) normalized = normalized.replace(new RegExp(escaped(group), "g"), "");
  if (decimal === ",") normalized = normalized.replace(/\./g, "");
  if (decimal === ".") normalized = normalized.replace(/,/g, "");
  normalized = normalized
    .replace(new RegExp(escaped(decimal), "g"), ".")
    .replace(/[^0-9.-]/g, "");

  if (!normalized || normalized === "-" || !/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount).replace(/\u202f/g, "\u00a0");
}

export function formatCurrencyInput(amount: number, locale: string): string {
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";
  return amount.toFixed(2).replace(".", decimal);
}
