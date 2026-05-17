import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { imageBase64, currency } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'imageBase64 required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM + (currency ? `\nMoeda preferida: ${currency}.` : '') },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrai os itens deste recibo. Devolve só JSON.' },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `AI ${res.status}: ${t}` }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { parsed = { items: [], total: null }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
