import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const auth = readFileSync(resolve(process.cwd(), "src/pages/Auth.tsx"), "utf8");
const oauthConsent = readFileSync(resolve(process.cwd(), "src/pages/OAuthConsent.tsx"), "utf8");

describe("Invisible Ledger entry flow", () => {
  it("keeps auth mechanics while applying the approved copy", () => {
    expect(auth).toContain("supabase.auth.signUp");
    expect(auth).toContain("supabase.auth.signInWithPassword");
    expect(auth).toContain('lovable.auth.signInWithOAuth("google"');
    expect(auth).toContain("Continua de onde paraste.");
    expect(auth).toContain("Privado por espaço financeiro");
  });

  it("announces OAuth loading failures assertively", () => {
    expect(oauthConsent).toMatch(/<p role="alert"[^>]*>\{error\}<\/p>/);
  });
});
