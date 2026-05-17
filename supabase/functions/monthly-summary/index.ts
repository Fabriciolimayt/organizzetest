import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { expenses, currency, month } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const prompt = `Resume estas despesas em português europeu, tom amigável, formato WhatsApp (com emojis e bullets). Moeda: ${currency || 'EUR'}. Mês: ${month || 'atual'}.
Despesas (JSON): ${JSON.stringify(expenses).slice(0, 6000)}
Inclui: total, top 3 categorias, dia mais caro, e uma dica curta.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `AI ${res.status}: ${t}` }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
