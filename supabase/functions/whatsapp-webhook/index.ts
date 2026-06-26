// WhatsApp Cloud API webhook — Invoice Scanner
// - GET: Meta verification handshake
// - POST: receives messages, OCR via Gemini 2.0 Flash, stores in pending/expenses
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
// Datafy API token (sk_live_xxx). Fallback to legacy WHATSAPP_TOKEN if present.
const WA_TOKEN     = Deno.env.get("DATAFY_TOKEN") ?? Deno.env.get("WHATSAPP_TOKEN")!;
const PHONE_ID     = Deno.env.get("WHATSAPP_PHONE_ID")!;
const GEMINI_KEY   = Deno.env.get("GEMINI_API_KEY")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Webhook signing secret. Datafy issues its own; falls back to Meta APP_SECRET.
const APP_SECRET   = Deno.env.get("DATAFY_WEBHOOK_SECRET") ?? Deno.env.get("WHATSAPP_APP_SECRET") ?? "";

// Datafy mirrors Meta Cloud API 1:1. Swap base URL + token, payloads identical.
const GRAPH = "https://cloud.datafyapi.com.br/v1";

const ALLOWED_CATEGORIES = new Set([
  "Alimentação", "Transportes", "Saúde", "Lazer",
  "Casa", "Tecnologia", "Restauração", "Outro",
]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function truncate(s: unknown, n: number): string | null {
  if (s == null) return null;
  const str = String(s);
  return str.length > n ? str.slice(0, n) : str;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 ? "0" + hex : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

async function verifyMetaSignature(rawBody: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET || !header || !header.startsWith("sha256=")) return false;
  const provided = hexToBytes(header.slice(7).trim());
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)),
  );
  return timingSafeEqual(provided, sig);
}

async function sendText(to: string, body: string) {
  try {
    await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body },
      }),
    });
  } catch (e) {
    console.error("sendText failed", e);
  }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

async function extractInvoiceWithGemini(base64: string, mimeType: string) {
  const prompt = `You are an expert at reading invoices and receipts. Extract the following fields from this image and return ONLY a valid JSON object, no markdown, no explanation:
{"merchant": "store name", "amount": 0.00, "date": "YYYY-MM-DD", "category": "one of: Alimentação|Transportes|Saúde|Lazer|Casa|Tecnologia|Restauração|Outro", "description": "brief description of main items"}
If a field cannot be determined, use null. Amount must be the total paid.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.1 },
      }),
    },
  );
  const data = await res.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  let parsed: any = null;
  try {
    const m = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(m ? m[0] : rawText);
  } catch (_) {
    parsed = null;
  }
  return { parsed, rawText };
}

Deno.serve(async (req) => {
  // ── Meta verification (GET) ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const logEvent = async (input: {
    user_id?: string | null; phone?: string | null; event_type: string;
    success?: boolean; summary?: string | null; error?: string | null;
  }) => {
    try {
      await supabase.from("whatsapp_events").insert({
        user_id: input.user_id ?? null,
        phone: input.phone ?? null,
        event_type: input.event_type,
        success: input.success ?? true,
        summary: input.summary ?? null,
        error: input.error ?? null,
      });
    } catch (e) { console.error("logEvent failed", e); }
  };

  // Read raw body and verify Meta signature on every POST
  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256");
  const sigOk = await verifyMetaSignature(rawBody, sigHeader);
  if (!sigOk) {
    console.warn("invalid or missing x-hub-signature-256");
    await logEvent({ event_type: "signature_invalid", success: false, error: "Bad or missing x-hub-signature-256" });
    return new Response("Forbidden", { status: 403 });
  }

  let body: any;
  try { body = JSON.parse(rawBody); } catch { return new Response("OK"); }

  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];
  if (!message) return new Response("OK");

  const from: string = message.from;

  // ── Verification handshake: detect "moedas-verify-XXXX" before any auth lookup ──
  const incomingText: string | undefined =
    message.type === "text" ? (message.text?.body ?? "").trim() : undefined;
  const verifyMatch = incomingText?.match(/moedas-verify-[A-Z0-9]+/i)?.[0];
  if (verifyMatch) {
    const code = verifyMatch.toLowerCase().replace("moedas-verify-", "moedas-verify-");
    const { data: link } = await supabase
      .from("whatsapp_links")
      .select("id, user_id, verified_at")
      .ilike("verify_code", verifyMatch)
      .maybeSingle();

    if (link?.user_id) {
      await supabase
        .from("whatsapp_links")
        .update({ verified_at: new Date().toISOString(), phone: from })
        .eq("id", link.id);

      await supabase
        .from("whatsapp_users")
        .upsert({ user_id: link.user_id, phone: from }, { onConflict: "phone" });

      await sendText(from, "✅ WhatsApp ligado à tua conta Organizze! Envia uma foto de uma fatura para começar.");
      await logEvent({ user_id: link.user_id, phone: from, event_type: "verify_ok", summary: "Número ligado à conta" });
      return new Response("OK");
    }

    await sendText(from, "⚠️ Código inválido ou expirado. Tenta novamente a partir da app.");
    await logEvent({ phone: from, event_type: "verify_invalid", success: false, error: "Código não encontrado" });
    return new Response("OK");
  }

  // Resolve WhatsApp number → user_id
  const { data: waUser, error: waErr } = await supabase
    .from("whatsapp_users")
    .select("user_id")
    .eq("phone", from)
    .maybeSingle();

  if (waErr) console.error("waUser query", waErr);

  if (!waUser) {
    await sendText(
      from,

  // Resolve WhatsApp number → user_id
  const { data: waUser, error: waErr } = await supabase
    .from("whatsapp_users")
    .select("user_id")
    .eq("phone", from)
    .maybeSingle();

  if (waErr) console.error("waUser query", waErr);

  if (!waUser) {
    await sendText(
      from,
      "⚠️ Número não associado a nenhuma conta. Acede às definições do teu perfil em organizzetest.lovable.app para ligar o teu WhatsApp.",
    );
    return new Response("OK");
  }
  const userId: string = waUser.user_id;

  // ── IMAGE → invoice ──
  if (message.type === "image") {
    const mediaId = message.image?.id;
    if (!mediaId) return new Response("OK");

    try {
      await sendText(from, "📸 Recebi a tua fatura! A processar...");

      // 1. Media URL
      const metaRes = await fetch(`${GRAPH}/${mediaId}`, {
        headers: { Authorization: `Bearer ${WA_TOKEN}` },
      });
      const metaData = await metaRes.json();

      // 2. Download binary
      const imgRes = await fetch(metaData.url, {
        headers: { Authorization: `Bearer ${WA_TOKEN}` },
      });
      const imgBuffer = await imgRes.arrayBuffer();
      const base64 = arrayBufferToBase64(imgBuffer);
      const mimeType = message.image?.mime_type ?? "image/jpeg";

      // 3. Gemini extraction
      const { parsed, rawText } = await extractInvoiceWithGemini(base64, mimeType);

      if (!parsed || typeof parsed !== "object") {
        await sendText(from, "❌ Não consegui ler a fatura. Por favor envia uma imagem mais nítida.");
        return new Response("OK");
      }

      const merchant = truncate(parsed.merchant, 255);
      const amountRaw = parsed.amount != null ? Number(parsed.amount) : NaN;
      const amount = Number.isFinite(amountRaw) && amountRaw > 0 && amountRaw < 1_000_000
        ? Math.round(amountRaw * 100) / 100
        : null;
      const rawDate = typeof parsed.date === "string" ? parsed.date : "";
      const date = DATE_RE.test(rawDate) && !isNaN(Date.parse(rawDate))
        ? rawDate
        : new Date().toISOString().slice(0, 10);
      const rawCategory = typeof parsed.category === "string" ? parsed.category : "";
      const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : "Outro";
      const description = truncate(parsed.description, 500);

      if (!amount || isNaN(amount)) {
        await sendText(from, "❌ Não consegui identificar o valor total da fatura. Tenta outra foto.");
        return new Response("OK");
      }

      // Save as pending (for audit)
      const { data: pending } = await supabase
        .from("pending_expenses")
        .insert({
          user_id: userId,
          phone: from,
          merchant,
          amount,
          date,
          category,
          description,
          raw_ai_response: rawText,
        })
        .select("id")
        .single();

      // Auto-confirm into expenses (with realtime → dashboard updates live)
      await supabase.from("expenses").insert({
        user_id: userId,
        merchant,
        name: merchant ?? description ?? "Despesa WhatsApp",
        amount,
        date,
        category,
        description,
        source: "whatsapp_scan",
      });

      // Confirmation message
      const fmt = (n: number) => n.toFixed(2).replace(".", ",");
      const lines = [
        "✅ Fatura registada no teu dashboard!",
        "",
        `🏪 ${merchant ?? "—"}`,
        `💶 ${fmt(amount)}`,
        `📅 ${date}`,
        `🏷️ ${category}`,
      ];
      if (description) lines.push(`📝 ${description}`);
      lines.push("", "Responde *cancelar* se foi um engano.");
      await sendText(from, lines.join("\n"));

      // Clean up pending after success
      if (pending?.id) {
        await supabase.from("pending_expenses").delete().eq("id", pending.id);
      }
    } catch (e) {
      console.error("image processing error", e);
      await sendText(from, "❌ Ocorreu um erro ao processar a imagem. Tenta novamente.");
    }
    return new Response("OK");
  }

  // ── TEXT ──
  if (message.type === "text") {
    const txt = (message.text?.body ?? "").trim().toLowerCase();

    if (txt === "cancelar") {
      // delete latest whatsapp_scan expense
      const { data: last } = await supabase
        .from("expenses")
        .select("id, merchant, amount")
        .eq("user_id", userId)
        .eq("source", "whatsapp_scan")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last) {
        await supabase.from("expenses").delete().eq("id", last.id);
        await sendText(from, `↩️ Última despesa cancelada (${last.merchant ?? ""} ${last.amount}).`);
      } else {
        await sendText(from, "Não encontrei nenhuma despesa recente para cancelar.");
      }
      return new Response("OK");
    }

    if (txt === "ajuda" || txt === "help" || txt === "/start") {
      await sendText(
        from,
        "👋 Olá! Envia-me uma *foto* da tua fatura ou recibo e eu adiciono a despesa ao teu dashboard automaticamente.\n\nComandos:\n• *cancelar* — anula a última despesa\n• *ajuda* — mostra esta mensagem",
      );
      return new Response("OK");
    }

    await sendText(
      from,
      "📸 Envia-me uma foto de um recibo/fatura para registar uma despesa. Escreve *ajuda* para ver os comandos.",
    );
    return new Response("OK");
  }

  // Other types: ignore politely
  await sendText(from, "Só consigo processar fotos de faturas por agora. 📸");
  return new Response("OK");
});
