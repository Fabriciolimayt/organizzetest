import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const SYSTEM = `És um extrator de dados de faturas/recibos. Recebes a imagem de um recibo (em qualquer idioma) e devolves SOMENTE um objeto JSON válido, sem markdown nem comentários, com o esquema:
{
  "merchant": string|null,
  "currency": "EUR"|"BRL"|"USD"|"MZN"|null,
  "total": number|null,
  "date": string|null,
  "items": [{ "name": string, "amount": number, "category": "Alimentação"|"Transporte"|"Lazer"|"Casa"|"Saúde"|"Outros" }]
}
Sempre que o recibo for de restaurante, take-away, supermercado ou bebidas → "Lazer" ou "Alimentação".
Combustível, transportes, parking, uber → "Transporte". Renda, luz, água, internet → "Casa".
Farmácia, médico → "Saúde". O resto → "Outros".
Se algo não estiver visível, usa null. Os valores são números (não strings).`;

const ALLOWED_CURRENCIES = ['EUR', 'BRL', 'USD', 'MZN'] as const;

const BodySchema = z.object({
  imageBase64: z.string().min(20).max(8_000_000),
  currency: z.enum(ALLOWED_CURRENCIES).optional(),
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonResponse({ error: 'Unauthorized' }, 401);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claims?.claims) return jsonResponse({ error: 'Unauthorized' }, 401);

    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return jsonResponse({ error: 'Invalid request' }, 400);
    const { imageBase64, currency } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return jsonResponse({ error: 'AI not configured' }, 500);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Moeda preferida: ${currency ?? 'EUR'}. Extrai os itens deste recibo. Devolve só JSON.` },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error('AI gateway error', res.status, t);
      return jsonResponse({ error: 'AI service temporarily unavailable' }, 502);
    }
    const data = await res.json();
    const raw2 = data.choices?.[0]?.message?.content ?? '{}';
    let out: unknown;
    try { out = typeof raw2 === 'string' ? JSON.parse(raw2) : raw2; }
    catch { out = { items: [], total: null }; }

    return jsonResponse(out);
  } catch (e) {
    console.error('parse-receipt error', e);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
