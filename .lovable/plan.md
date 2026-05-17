## Migrar WhatsApp para Meta Cloud API (oficial)

Substituir o webhook Twilio pelo webhook oficial da **Meta WhatsApp Cloud API**. Mais robusto, sem sandbox, grátis até 1000 conversas/mês.

### 1. O que precisas de ter na Meta (faço-te um guia passo-a-passo no chat depois de aprovares)

- Conta **Meta Business** (business.facebook.com)
- App no **developers.facebook.com** → produto "WhatsApp"
- **Número de telefone de teste** (a Meta dá um grátis) ou o teu próprio número verificado
- Recolher 4 valores:
  - `META_WA_TOKEN` — System User Access Token (permanente) ou token temporário de 24h para testar
  - `META_WA_PHONE_NUMBER_ID` — ID do número que envia mensagens
  - `META_WA_VERIFY_TOKEN` — string aleatória que tu inventas (ex: `moedas-webhook-2026`)
  - `META_WA_APP_SECRET` — para validar assinatura `X-Hub-Signature-256`

### 2. Mudanças no código

**`supabase/functions/whatsapp-webhook/index.ts`** — reescrever:
- `GET` → responde ao handshake da Meta (`hub.challenge` se `hub.verify_token` bater certo)
- `POST` → valida HMAC-SHA256 do body com `META_WA_APP_SECRET`, faz parse do JSON do Cloud API (estrutura `entry[].changes[].value.messages[]`)
- Texto: `messages[0].text.body` → `parse-expense-text` → insere em `expenses`
- Imagem: `messages[0].image.id` → GET `/{media_id}` para obter URL → download com Bearer token → base64 → `parse-receipt` → insere itens
- Código de verificação: igual ao atual (`moedas-verify-XXXX`)
- **Resposta** ao utilizador: POST para `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages` com `{ messaging_product: "whatsapp", to, type: "text", text: { body } }`

**`src/lib/countries.ts`** — trocar `WA_BOT_NUMBER` (14155238886 sandbox Twilio) pelo número Meta que vamos usar.

**`supabase/config.toml`** — já tem `verify_jwt = false` para `whatsapp-webhook`, fica.

### 3. Secrets a pedir (via add_secret depois de aprovares)

`META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`, `META_WA_VERIFY_TOKEN`, `META_WA_APP_SECRET`

### 4. Configuração no painel Meta (passo final, eu dou as instruções)

- Webhook URL: `https://lxlsrnysjtojnlhvjjew.supabase.co/functions/v1/whatsapp-webhook`
- Verify Token: o mesmo que puseste em `META_WA_VERIFY_TOKEN`
- Subscribe to: `messages`

### 5. Limpeza

Remover referências a Twilio (gateway, `TWILIO_API_KEY`) do webhook. Conexão Twilio do connector pode ficar inativa ou ser desligada.

---

**Confirma e eu começo:** quero ir buscar os secrets primeiro (eu peço com `add_secret`), depois reescrevo o webhook e atualizo o número. Tens já uma app criada no Meta for Developers ou queres que te guie a criar?
