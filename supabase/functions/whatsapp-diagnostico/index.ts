// WhatsApp diagnostic endpoint (auth-gated)
// GET  -> returns secret presence + last 10 events for the calling user
// POST -> sends a test WhatsApp text to the user's linked number via Datafy
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const WA_TOKEN = Deno.env.get("DATAFY_TOKEN") ?? Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";
const GRAPH = "https://cloud.datafyapi.com.br/v1";

function secretStatus() {
  return {
    DATAFY_TOKEN: !!Deno.env.get("DATAFY_TOKEN"),
    DATAFY_WEBHOOK_SECRET: !!Deno.env.get("DATAFY_WEBHOOK_SECRET"),
    WHATSAPP_VERIFY_TOKEN: !!Deno.env.get("WHATSAPP_VERIFY_TOKEN"),
    WHATSAPP_PHONE_ID: !!Deno.env.get("WHATSAPP_PHONE_ID"),
    GEMINI_API_KEY: !!Deno.env.get("GEMINI_API_KEY"),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "missing auth" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  if (req.method === "GET") {
    const { data: events } = await admin
      .from("whatsapp_events")
      .select("id, event_type, phone, success, summary, error, created_at")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: link } = await admin
      .from("whatsapp_users")
      .select("phone, linked_at")
      .eq("user_id", user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      secrets: secretStatus(),
      linkedPhone: link?.phone ?? null,
      linkedAt: link?.linked_at ?? null,
      events: events ?? [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    const { data: link } = await admin
      .from("whatsapp_users")
      .select("phone")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!link?.phone) {
      return new Response(JSON.stringify({ error: "WhatsApp não está ligado." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!WA_TOKEN || !PHONE_ID) {
      return new Response(JSON.stringify({ error: "Secrets Datafy em falta." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: link.phone,
          type: "text",
          text: { preview_url: false, body: "🧪 Teste do Organizze — se vês esta mensagem, a ligação está OK." },
        }),
      });
      const ok = res.ok;
      const text = await res.text();
      await admin.from("whatsapp_events").insert({
        user_id: user.id, phone: link.phone, event_type: "test_send",
        success: ok, summary: ok ? "Mensagem de teste enviada" : null,
        error: ok ? null : text.slice(0, 500),
      });
      return new Response(JSON.stringify({ ok, status: res.status }), {
        status: ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("whatsapp_events").insert({
        user_id: user.id, phone: link.phone, event_type: "test_send",
        success: false, error: msg.slice(0, 500),
      });
      return new Response(JSON.stringify({ ok: false, error: "Falha de rede" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});
