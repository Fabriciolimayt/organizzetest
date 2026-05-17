// Twilio WhatsApp inbound webhook.
// Receives form-urlencoded POST from Twilio Sandbox / Production WhatsApp number,
// processes text or media (receipt photo), writes to `expenses` table, replies via TwiML.
//
// Configure in Twilio Console (Sandbox or your WhatsApp Sender):
//   When a message comes in -> https://<project-ref>.functions.supabase.co/whatsapp-webhook  (POST)
//
// verify_jwt = false (set in supabase/config.toml). Auth is implicit through phone number
// lookup in whatsapp_links. For production, add Twilio signature validation.

import { createClient } from "npm:@supabase/supabase-js@2";

const TWIML_HEADERS = { "Content-Type": "text/xml; charset=utf-8" };
const GATEWAY = "https://connector-gateway.lovable.dev/twilio";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const twiml = (text: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc(text)}</Message></Response>`;

const CATEGORY_MAP: Record<string, string> = {
  "Alimentação": "necessidades",
  "Alimentacao": "necessidades",
  "Transporte": "necessidades",
  "Casa": "necessidades",
  "Saúde": "necessidades",
  "Saude": "necessidades",
  "Lazer": "lazer",
  "Outros": "subscricoes",
};
const mapCat = (c?: string) => (c && CATEGORY_MAP[c]) || "subscricoes";

async function callAI(messages: unknown) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI ${res.status} ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return String(json?.choices?.[0]?.message?.content ?? "");
}

function safeJson<T = any>(raw: string): T | null {
  try { return JSON.parse(raw.replace(/```json\n?|```/g, "").trim()) as T; } catch { return null; }
}

async function ocrReceipt(dataUrl: string) {
  const content = await callAI([
    { role: "system", content: 'Extrai itens de um recibo. Responde APENAS JSON válido no formato: {"items":[{"name":string,"amount":number,"category":"Alimentação|Transporte|Casa|Saúde|Lazer|Outros"}],"total":number}' },
    { role: "user", content: [
      { type: "text", text: "Lista todos os itens deste recibo com o valor (números, sem moeda)." },
      { type: "image_url", image_url: { url: dataUrl } },
    ] },
  ]);
  const json = safeJson<{ items?: Array<{ name: string; amount: number; category: string }>; total?: number }>(content);
  const items = (json?.items ?? []).filter((i) => i?.name && Number(i?.amount) > 0)
    .map((i) => ({ name: String(i.name), amount: Number(i.amount), category: String(i.category ?? "Outros") }));
  return items;
}

async function parseExpenseText(text: string) {
  const content = await callAI([
    { role: "system", content: 'Extrai uma despesa do texto. Responde APENAS JSON: {"description":string,"amount":number,"category":"Alimentação|Transporte|Casa|Saúde|Lazer|Outros"}. Se não detectares despesa, devolve {"amount":0}.' },
    { role: "user", content: text },
  ]);
  return safeJson<{ description?: string; amount?: number; category?: string }>(content);
}

async function fetchTwilioMedia(mediaUrl: string): Promise<{ dataUrl: string } | null> {
  // mediaUrl example: https://api.twilio.com/2010-04-01/Accounts/ACxxxx/Messages/MMxxx/Media/MExxx
  // The gateway already injects /2010-04-01/Accounts/{Sid}, so strip that part.
  const m = mediaUrl.match(/\/Accounts\/[^/]+(\/.+)$/);
  const path = m ? m[1] : null;
  if (!path) return null;
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const twKey = Deno.env.get("TWILIO_API_KEY");
  if (!lovKey || !twKey) throw new Error("Missing LOVABLE_API_KEY or TWILIO_API_KEY");

  const res = await fetch(`${GATEWAY}${path}`, {
    headers: { Authorization: `Bearer ${lovKey}`, "X-Connection-Api-Key": twKey },
    redirect: "follow",
  });
  if (!res.ok) {
    console.error("Twilio media fetch failed", res.status, await res.text());
    return null;
  }
  const ct = res.headers.get("content-type") || "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  // base64 encode
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + CHUNK)) as any);
  }
  const b64 = btoa(bin);
  return { dataUrl: `data:${ct};base64,${b64}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response(twiml("Use POST."), { headers: TWIML_HEADERS });

  const form = await req.formData();
  const from = String(form.get("From") ?? ""); // "whatsapp:+351912345678"
  const body = String(form.get("Body") ?? "").trim();
  const numMedia = parseInt(String(form.get("NumMedia") ?? "0"), 10) || 0;
  const phone = from.replace(/^whatsapp:/, "").replace(/^\+/, "");

  console.log("inbound", { phone, body: body.slice(0, 80), numMedia });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 1) Verification code path
  if (body.startsWith("moedas-verify-")) {
    const { data: pending } = await sb
      .from("whatsapp_links")
      .select("*")
      .eq("verify_code", body)
      .is("verified_at", null)
      .maybeSingle();
    if (!pending) {
      return new Response(twiml("❌ Código inválido ou já usado. Gera um novo na app."), { headers: TWIML_HEADERS });
    }
    await sb.from("whatsapp_links")
      .update({ verified_at: new Date().toISOString(), phone })
      .eq("id", pending.id);
    return new Response(twiml('✅ WhatsApp ligado ao Moedas!\n\nAgora podes:\n📸 Enviar fotos de recibos\n✍️ Escrever "Gastei 12€ no almoço"\n\nVais ver tudo no dashboard em tempo real.'), { headers: TWIML_HEADERS });
  }

  // 2) Lookup user by phone
  const { data: link } = await sb
    .from("whatsapp_links")
    .select("user_id, verified_at")
    .eq("phone", phone)
    .maybeSingle();

  if (!link || !link.verified_at) {
    return new Response(twiml("Olá! Não conheço este número. Abre a app Moedas → WhatsApp e envia-me o teu código de verificação."), { headers: TWIML_HEADERS });
  }

  try {
    // 3a) Receipt photo
    if (numMedia > 0) {
      const mediaUrl = String(form.get("MediaUrl0") ?? "");
      const media = await fetchTwilioMedia(mediaUrl);
      if (!media) return new Response(twiml("❌ Não consegui descarregar a foto."), { headers: TWIML_HEADERS });
      const items = await ocrReceipt(media.dataUrl);
      if (!items.length) return new Response(twiml("Não consegui ler nenhum item neste recibo. Tenta outra foto?"), { headers: TWIML_HEADERS });
      const rows = items.map((it) => ({
        user_id: link.user_id, name: it.name, amount: it.amount, category: mapCat(it.category), source: "whatsapp",
      }));
      const { error } = await sb.from("expenses").insert(rows);
      if (error) throw error;
      const total = items.reduce((s, i) => s + i.amount, 0);
      const lines = items.map((i) => `• ${i.name} — €${i.amount.toFixed(2)}`).join("\n");
      return new Response(twiml(`✅ ${items.length} item(ns) registado(s)!\n${lines}\n💰 Total: €${total.toFixed(2)}`), { headers: TWIML_HEADERS });
    }

    // 3b) Text expense
    if (body) {
      const parsed = await parseExpenseText(body);
      const amount = Number(parsed?.amount ?? 0);
      if (!amount) return new Response(twiml('Não percebi o valor. Tenta algo como "Gastei 12€ no almoço".'), { headers: TWIML_HEADERS });
      const desc = parsed?.description?.toString() || "Despesa";
      const cat = parsed?.category?.toString();
      const { error } = await sb.from("expenses").insert({
        user_id: link.user_id, name: desc, amount, category: mapCat(cat), source: "whatsapp",
      });
      if (error) throw error;
      return new Response(twiml(`✅ Registado: ${desc} — €${amount.toFixed(2)} (${cat ?? "Outros"})`), { headers: TWIML_HEADERS });
    }
  } catch (e) {
    console.error("processing error", e);
    return new Response(twiml("❌ Algo correu mal a processar. Tenta de novo."), { headers: TWIML_HEADERS });
  }

  return new Response(twiml("Envia uma despesa em texto ou foto de recibo 📸"), { headers: TWIML_HEADERS });
});
