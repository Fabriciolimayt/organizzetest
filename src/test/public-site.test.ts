import { describe, expect, it } from "vitest";
import { PUBLIC_SITE_URL, publicHomeDestination } from "@/lib/public-site";

describe("one public Organizze home", () => {
  it.each([
    ["", ""], ["?utm_source=whatsapp", "#metodo"],
    ["?next=https://untrusted.example", "#planos"],
  ])("uses the canonical site without forwarding parameters", (search, hash) => {
    expect(publicHomeDestination(search, hash)).toBe(PUBLIC_SITE_URL);
  });
  it.each([
    ["?code=test-code", ""], ["", "#access_token=test&refresh_token=test"],
    ["?token_hash=test&type=email", ""], ["?error=access_denied", ""],
    ["", "#error_code=otp_expired"],
  ])("keeps auth callbacks on the financial app", (search, hash) => {
    expect(publicHomeDestination(search, hash)).toBe(`/auth${search}${hash}`);
  });
});
