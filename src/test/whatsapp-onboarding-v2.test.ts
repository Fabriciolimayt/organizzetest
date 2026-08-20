import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WA_COUNTRIES, countryForCurrency, validatePhone } from "@/lib/countries";

const readPage = (name: string) =>
  readFileSync(resolve(process.cwd(), "src/pages", name), "utf8");

describe("WhatsApp onboarding app_v2 contract", () => {
  it("supports US WhatsApp numbers for USD spaces", () => {
    const unitedStates = WA_COUNTRIES.find(({ code }) => code === "US");

    expect(unitedStates).toMatchObject({ ddi: "+1", minDigits: 10 });
    expect(countryForCurrency("USD").code).toBe("US");
    expect(validatePhone(unitedStates!, "949 664 9404")).toBe(true);
  });

  it("creates the link through app_v2 for an administrable space", () => {
    const source = readPage("OnboardingWhatsApp.tsx");

    expect(source).toContain('import { supabaseV2 } from "@/integrations/supabase/v2"');
    expect(source).toContain('.from("space_members")');
    expect(source).toMatch(/role\s*===\s*"owner"|\["owner",\s*"admin"\]/);
    expect(source).toContain('.rpc("create_whatsapp_link"');
    expect(source).toContain("phone_e164: fullPhone");
    expect(source).toContain("space_id: spaceId");
    expect(source).toContain('const fullPhone = `${country.ddi}${onlyDigits(phone)}`');
    expect(source).toContain('localStorage.setItem("organizze.waVerification"');
    expect(source).toContain("instanceName");
    expect(source).toContain("expiresAt");

    expect(source).not.toContain("generateVerifyCode");
    expect(source).not.toContain('.from("whatsapp_links")');
    expect(source).not.toContain("console.");
  });

  it("polls the V2 connection without reading the verification token", () => {
    const source = readPage("OnboardingWhatsAppVerificar.tsx");

    expect(source).toContain('import { supabaseV2 } from "@/integrations/supabase/v2"');
    expect(source).toContain('.from("whatsapp_connections")');
    expect(source).toContain('.eq("space_id", verification.spaceId)');
    expect(source).toContain('.eq("phone_e164", verification.phone)');
    expect(source).toContain('.eq("instance_name", verification.instanceName)');
    expect(source).toMatch(/connection\??\.status\s*===\s*"active"/);
    expect(source).toContain("connection.verified_at");
    expect(source).toContain('"update_whatsapp_preferences"');
    expect(source).toContain('supabaseV2.rpc("update_whatsapp_preferences"');
    expect(source).toContain("monthly_report_opt_in: true");
    expect(source).toContain("Europe/Lisbon");
    expect(source).toContain("verification.expiresAt");

    expect(source).not.toContain('.from("whatsapp_links")');
    expect(source).not.toContain("verify_code");
    expect(source).not.toContain("Datafy");
    expect(source).not.toContain("Meta");
    expect(source).not.toContain("webhook");
    expect(source).not.toContain("QR");
    expect(source).not.toContain("PreferencesRpc");
    expect(source).not.toContain("as unknown as");
  });
});
