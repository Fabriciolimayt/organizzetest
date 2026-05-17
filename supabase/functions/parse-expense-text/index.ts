import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM = `Extrai despesas a partir de mensagens de texto curtas (em PT, BR ou EN). Devolve SOMENTE JSON válido:
{ "amount": number, "currency": "EUR"|"BRL"|"USD"|"MZN"|null, "category": "Alimentação"|"Transporte"|"Lazer"|"Casa"|"Saúde"|"Outros", "description": string }
Exemplos: "Gastei 45€ no mercado" → { amount:45, currency:"EUR", category:"Alimentação", description:"Mercado" }.
"R$ 20 uber" → { amount:20, currency:"BRL", category:"Transporte", description:"Uber" }.
Se a moeda não vier, assume a moeda pedida no system input.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { text, currency } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM + (currency ? `\nMoeda preferida: ${currency}.` : '') },
          { role: 'user', content: text },
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
    try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { parsed = {}; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
