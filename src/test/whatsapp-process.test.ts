import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildExpenseParserRequest,
  buildReceiptParserRequest,
  parseProcessEnvelope,
  validateAiReceipt,
  validateAiExpense,
} from "../../supabase/functions/_shared/whatsapp-process.ts";
import { verifyBridgeSignature } from "../../supabase/functions/_shared/whatsapp-ingest.ts";

describe("WhatsApp process envelope", () => {
  it("accepts only a positive job id, ISO lease and bounded worker id", () => {
    expect(parseProcessEnvelope({
      jobId: 42,
      lockedAt: "2026-08-14T12:00:00.000Z",
      workerId: "bridge-local-01",
    })).toEqual({
      jobId: 42,
      lockedAt: "2026-08-14T12:00:00.000Z",
      workerId: "bridge-local-01",
    });
  });

  it("accepts the PostgreSQL timestamp format returned by PostgREST", () => {
    expect(parseProcessEnvelope({
      jobId: 83,
      lockedAt: "2026-08-20T09:32:18.123456+00:00",
      workerId: "organizze-local-bridge",
    })).toEqual({
      jobId: 83,
      lockedAt: "2026-08-20T09:32:18.123456+00:00",
      workerId: "organizze-local-bridge",
    });
  });

  it.each([
    null,
    { jobId: 0, lockedAt: "2026-08-14T12:00:00.000Z", workerId: "worker" },
    { jobId: 1.5, lockedAt: "2026-08-14T12:00:00.000Z", workerId: "worker" },
    { jobId: 1, lockedAt: "not-a-date", workerId: "worker" },
    { jobId: 1, lockedAt: "2026-08-14", workerId: "worker" },
    { jobId: 1, lockedAt: "2026-08-14T12:00:00.000Z", workerId: "" },
    { jobId: 1, lockedAt: "2026-08-14T12:00:00.000Z", workerId: "x".repeat(129) },
    { jobId: 1, lockedAt: "2026-08-14T12:00:00.000Z", workerId: "worker", text: "segredo" },
  ])("rejects malformed or sensitive envelopes", (input) => {
    expect(parseProcessEnvelope(input)).toBeNull();
  });
});

describe("AI expense validation", () => {
  it("accepts a bounded expense and falls back to the space currency", () => {
    expect(validateAiExpense({
      amount: 12.34,
      currency: null,
      description: "Almoco",
      category: "Alimentacao",
      merchant: null,
    }, "EUR")).toEqual({
      amount: 12.34,
      currency: "EUR",
      description: "Almoco",
      category: "Alimentacao",
      merchant: null,
    });
  });

  it("allows the valid space currency even when it is outside the parser whitelist", () => {
    expect(validateAiExpense({
      amount: 20,
      currency: "CAD",
      description: "Cafe",
      category: "Outros",
      merchant: "Cafeteria Central",
    }, "CAD")?.currency).toBe("CAD");
  });

  it("asks the text parser for a separate merchant field", () => {
    expect(JSON.stringify(buildExpenseParserRequest("Cafe 5 EUR", "EUR"))).toContain("merchant");
  });

  it.each([
    [{ amount: 0, currency: "EUR", description: "Cafe", category: "Outros", merchant: null }, "EUR"],
    [{ amount: 1_000_000.01, currency: "EUR", description: "Cafe", category: "Outros", merchant: null }, "EUR"],
    [{ amount: Number.POSITIVE_INFINITY, currency: "EUR", description: "Cafe", category: "Outros", merchant: null }, "EUR"],
    [{ amount: 10, currency: "XYZ", description: "Cafe", category: "Outros", merchant: null }, "EUR"],
    [{ amount: 10, currency: "eur", description: "Cafe", category: "Outros", merchant: null }, "EUR"],
    [{ amount: 10, currency: "EUR", description: "", category: "Outros", merchant: null }, "EUR"],
    [{ amount: 10, currency: "EUR", description: "x".repeat(161), category: "Outros", merchant: null }, "EUR"],
    [{ amount: 10, currency: "EUR", description: "Cafe", category: "x".repeat(81), merchant: null }, "EUR"],
    [{ amount: 10, currency: "EUR", description: "Cafe", category: "Outros", merchant: null, phone: "+351911111111" }, "EUR"],
    [{ amount: 10, currency: "EUR", description: "Cafe", category: "Outros", merchant: "x".repeat(161) }, "EUR"],
  ])("rejects unsafe AI output", (input, currency) => {
    expect(validateAiExpense(input, currency)).toBeNull();
  });
});

describe("AI receipt validation", () => {
  it("converts a valid receipt to the canonical parsed expense", () => {
    expect(validateAiReceipt({
      total: 48.9,
      currency: "EUR",
      merchant: "Mercado Central",
      category: "Alimentação",
    }, "EUR")).toEqual({
      amount: 48.9,
      currency: "EUR",
      description: "Mercado Central",
      category: "Alimentação",
      merchant: "Mercado Central",
    });
  });

  it("uses safe receipt and currency fallbacks", () => {
    expect(validateAiReceipt({
      total: 9.5,
      currency: null,
      merchant: null,
      category: "Outros",
    }, "CAD")).toEqual({
      amount: 9.5,
      currency: "CAD",
      description: "Recibo",
      category: "Outros",
      merchant: null,
    });
  });

  it.each([
    [{ total: null, currency: "EUR", merchant: "Loja", category: "Outros" }, "EUR"],
    [{ total: 0, currency: "EUR", merchant: "Loja", category: "Outros" }, "EUR"],
    [{ total: 1_000_001, currency: "EUR", merchant: "Loja", category: "Outros" }, "EUR"],
    [{ total: 10, currency: "XYZ", merchant: "Loja", category: "Outros" }, "EUR"],
    [{ total: 10, currency: "EUR", merchant: "x".repeat(161), category: "Outros" }, "EUR"],
    [{ total: 10, currency: "EUR", merchant: "Loja", category: "Inventada" }, "EUR"],
    [{ total: 10, currency: "EUR", merchant: "Loja", category: "Outros", bytes: "secret" }, "EUR"],
  ])("rejects unsafe receipt output", (input, currency) => {
    expect(validateAiReceipt(input, currency)).toBeNull();
  });

  it("builds an in-memory multimodal request with the existing image_url shape", () => {
    const request = buildReceiptParserRequest("data:image/jpeg;base64,YWJj", "EUR");
    expect(request).toMatchObject({
      messages: [
        { role: "system" },
        {
          role: "user",
          content: [
            { type: "text" },
            { type: "image_url", image_url: { url: "data:image/jpeg;base64,YWJj" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });
    expect(JSON.stringify(request)).toContain("merchant");
  });
});

describe("WhatsApp processor security contract", () => {
  it("uses the same bridge HMAC verification vector as ingest", async () => {
    const rawBody = JSON.stringify({
      jobId: 42,
      lockedAt: "2026-08-14T12:00:00.000Z",
      workerId: "bridge-local-01",
    });
    const timestamp = "1786708800";
    const secret = "test-only-secret";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = new Uint8Array(await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${rawBody}`),
    ));
    const hex = Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");

    await expect(verifyBridgeSignature({
      rawBody,
      secret,
      timestampHeader: timestamp,
      signatureHeader: `sha256=${hex}`,
      nowSeconds: Number(timestamp) + 60,
    })).resolves.toEqual({ ok: true });
  });

  it("keeps sensitive data server-side and completes through the expected RPC", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/whatsapp-process/index.ts"),
      "utf8",
    );
    expect(source).toContain("verifyBridgeSignature");
    expect(source).toContain("readLimitedWebhookBody");
    expect(source).toContain('.schema("app_v2")');
    expect(source).toContain('.eq("job_type", "process_message")');
    expect(source).toContain('.eq("locked_at", envelope.lockedAt)');
    expect(source).toContain('.eq("locked_by", envelope.workerId)');
    expect(source).toContain("body_redacted");
    expect(source).toContain('rpc("complete_whatsapp_processing"');
    expect(source).toContain("job_id: envelope.jobId");
    expect(source).toContain("locked_at: envelope.lockedAt");
    expect(source).toContain("worker_id: envelope.workerId");
    expect(source).toContain("parsed: parsedExpense");
    expect(source).not.toMatch(/from\("whatsapp_messages"\)[\s\S]*update\(\{\s*body_redacted:/);
    expect(source).not.toMatch(/console\.(log|debug|info|warn|error)/);
  });

  it("downloads bounded private receipt media and cleans it only after completion", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/whatsapp-process/index.ts"),
      "utf8",
    );
    const helperSource = readFileSync(
      resolve(process.cwd(), "supabase/functions/_shared/whatsapp-process.ts"),
      "utf8",
    );
    const completion = source.indexOf('rpc("complete_whatsapp_processing"');
    const cleanup = source.indexOf('.from("whatsapp-inbox").remove');

    expect(source).toContain('select("id, body_redacted, message_type")');
    expect(source).toContain('.from("whatsapp_media")');
    expect(source).toContain('.eq("is_valid", true)');
    expect(source).toContain('from("whatsapp-inbox").download');
    expect(source).toMatch(/6 \* 1024 \* 1024/);
    expect(source).toMatch(/image\/jpeg.*image\/png.*image\/webp/s);
    expect(source).toContain("buildReceiptParserRequest");
    expect(helperSource).toContain('image_url');
    expect(source).not.toContain('.update({ is_valid: false })');
    expect(completion).toBeGreaterThan(-1);
    expect(cleanup).toBeGreaterThan(completion);
    expect(source).not.toMatch(/console\.(log|debug|info|warn|error)/);
  });
});
