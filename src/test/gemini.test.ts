import { describe, expect, it } from "vitest";

describe("Gemini chat request", () => {
  it("targets the Google OpenAI-compatible endpoint with the stable Flash-Lite model", async () => {
    const aiHelpers = await import("../../supabase/functions/_shared/whatsapp-process.ts");
    const createGeminiChatRequest = (
      aiHelpers as Record<string, unknown>
    ).createGeminiChatRequest;

    const request = typeof createGeminiChatRequest === "function"
      ? createGeminiChatRequest("test-api-key", {
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: "Extrai a despesa" }],
          response_format: { type: "json_object" },
        }) as Request
      : new Request("https://invalid.example");

    expect(request).toBeInstanceOf(Request);
    expect(request?.url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(request?.method).toBe("POST");
    expect(request?.headers.get("authorization")).toBe("Bearer test-api-key");
    expect(request?.headers.get("content-type")).toBe("application/json");
    await expect(request?.json()).resolves.toEqual({
      model: "gemini-3.5-flash-lite",
      messages: [{ role: "user", content: "Extrai a despesa" }],
      response_format: { type: "json_object" },
    });
  });
});
