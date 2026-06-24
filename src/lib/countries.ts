export type WaCountry = {
  code: "BR" | "PT" | "GB" | "MZ";
  flag: string;
  ddi: string;
  name: string;
  placeholder: string;
  minDigits: number;
};

export const WA_COUNTRIES: WaCountry[] = [
  { code: "PT", flag: "🇵🇹", ddi: "+351", name: "Portugal", placeholder: "912 345 678", minDigits: 9 },
  { code: "BR", flag: "🇧🇷", ddi: "+55", name: "Brasil", placeholder: "11 99999-9999", minDigits: 10 },
  { code: "GB", flag: "🇬🇧", ddi: "+44", name: "Reino Unido", placeholder: "7700 900123", minDigits: 10 },
  { code: "MZ", flag: "🇲🇿", ddi: "+258", name: "Moçambique", placeholder: "84 123 4567", minDigits: 9 },
];

// WhatsApp Business Cloud API (Meta) bot number — internacional, sem "+".
// Configurar via VITE_WHATSAPP_BOT_NUMBER no .env quando o número Meta estiver ativo.
export const WA_BOT_NUMBER =
  (import.meta.env.VITE_WHATSAPP_BOT_NUMBER as string | undefined) || "000000000000";

export const countryForCurrency = (currency: string): WaCountry => {
  const map: Record<string, WaCountry["code"]> = {
    EUR: "PT",
    BRL: "BR",
    MZN: "MZ",
    USD: "GB",
    GBP: "GB",
  };
  const code = map[currency] ?? "PT";
  return WA_COUNTRIES.find((c) => c.code === code) ?? WA_COUNTRIES[0];
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const validatePhone = (country: WaCountry, raw: string) =>
  onlyDigits(raw).length >= country.minDigits;

export const generateVerifyCode = () => {
  const rand = (crypto.randomUUID().replace(/-/g, "").slice(0, 8)).toUpperCase();
  return `moedas-verify-${rand}`;
};

export const waLink = (code: string) =>
  `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(code)}`;
