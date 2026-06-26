## Migrar webhook do WhatsApp para a Datafy API

A Datafy é um espelho 1:1 da Meta Cloud API — mudam só a URL base e o token. O resto do código (payload do webhook, parsing Gemini, gravação no Supabase) fica igual.

### Mudanças

**1. `supabase/functions/whatsapp-webhook/index.ts`**
- Trocar `const GRAPH = "https://graph.facebook.com/v19.0"` por `const GRAPH = "https://cloud.datafyapi.com.br/v1"`.
- Trocar a env var `WHATSAPP_TOKEN` por `DATAFY_TOKEN` (formato `sk_live_xxx`) — usada como `Authorization: Bearer ...` no `sendText`, no `GET /{mediaId}` e no download do binário da imagem.
- Verificação de assinatura do webhook: a Datafy também envia `x-hub-signature-256`, mas assinada com **o segredo do webhook configurado no painel da Datafy** (não com `WHATSAPP_APP_SECRET` da Meta). Manter a função `verifyMetaSignature` igual e passar a usar a secret `DATAFY_WEBHOOK_SECRET` em vez de `WHATSAPP_APP_SECRET`.
- Handshake GET (`hub.verify_token`) permanece — usa `WHATSAPP_VERIFY_TOKEN` que tu defines igual no painel da Datafy.
- `WHATSAPP_PHONE_ID` continua a ser o `phone_number_id` (mesma semântica na Datafy).

**2. Secrets**
- Adicionar **`DATAFY_TOKEN`** (token `sk_live_xxx` do painel Datafy).
- Adicionar **`DATAFY_WEBHOOK_SECRET`** (segredo do webhook configurado na Datafy — usado para validar `x-hub-signature-256`).
- Manter `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_ID`, `GEMINI_API_KEY`.
- `WHATSAPP_TOKEN` e `WHATSAPP_APP_SECRET` deixam de ser usados (podem ficar ou ser removidas depois).

**3. Frontend**
- Sem alterações de lógica. O número do bot (`WA_BOT_NUMBER` em `src/lib/countries.ts`) continua `351938930953` — é o número conectado na Datafy, igual ao que o utilizador vê.
- O painel de "configuração inicial Meta" em `OnboardingWhatsAppVerificar.tsx` passa a apontar para o painel da Datafy:
  - Callback URL: `https://lxlsrnysjtojnlhvjjew.supabase.co/functions/v1/whatsapp-webhook`
  - Verify token: valor de `WHATSAPP_VERIFY_TOKEN`
  - Texto atualizado: "Configura em **Datafy → Webhooks**" em vez de Meta for Developers.

### O que o utilizador faz no painel Datafy
1. Conecta o número e copia o token `sk_live_xxx`.
2. Em Webhooks: cola a Callback URL acima, o verify token, e copia o **webhook secret** que a Datafy gerar.
3. Subscreve o campo `messages`.

### Pergunta antes de avançar
Confirmas que a Datafy gera um **webhook secret próprio** (para assinar `x-hub-signature-256`)? Se sim, partilha esse valor + o `sk_live_xxx` quando eu pedir via `add_secret`. Se a Datafy reutiliza o `APP_SECRET` da Meta, posso saltar a nova secret e manter `WHATSAPP_APP_SECRET`.