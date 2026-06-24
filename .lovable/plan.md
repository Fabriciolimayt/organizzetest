## Objetivo

O backend (`supabase/functions/whatsapp-webhook/index.ts`) já está 100% em Meta WhatsApp Cloud API (verificação `hub.challenge`, assinatura `x-hub-signature-256`, envio via `graph.facebook.com`, secrets `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` já configuradas). O que ainda fala em "Twilio Sandbox" é só o frontend de onboarding. Esta mudança é apenas de UI/copy + número do bot.

## Mudanças

### 1. `src/lib/countries.ts`
- Renomear `WA_BOT_NUMBER` para passar a representar o número Meta da Organizze (placeholder configurável). Como o número real do Meta ainda não está definido, expor via `import.meta.env.VITE_WHATSAPP_BOT_NUMBER` com fallback para um placeholder claro (`"000000000000"`) e adicionar comentário a explicar.
- Manter resto do ficheiro intacto.

### 2. `src/pages/OnboardingWhatsAppVerificar.tsx`
- Remover todo o bloco "Twilio Sandbox":
  - Tirar o `<details>` com instruções Twilio.
  - Tirar o passo 1 "join &lt;código&gt;" — Meta Cloud API não exige opt-in sandbox.
- Reescrever para fluxo Meta em **1 passo**:
  - Mostra o código de verificação.
  - Botão "Abrir WhatsApp com o código" usando `wa.me/<numero>?text=<codigo>`.
  - Texto explicativo: "Envia este código para o nosso WhatsApp. Vamos detetar a tua mensagem automaticamente."
- Manter o polling do Supabase (já compatível — webhook Meta já grava `verified_at`).
- Manter o `<details>` técnico mas trocar instruções de Twilio para Meta: URL do webhook + `WHATSAPP_VERIFY_TOKEN`, a configurar em *Meta for Developers → WhatsApp → Configuration → Webhook* (apenas para o dono da app).

### 3. `src/pages/OnboardingWhatsApp.tsx`
- Sem alterações funcionais (já é agnóstico de provider). Apenas remover qualquer menção textual a "Twilio" se existir (não existe atualmente).

### 4. `src/pages/DashboardWhatsApp.tsx`
- Usar o novo `WA_BOT_NUMBER` no cabeçalho do chat (já importa, nada a mudar além do valor que vem do lib).

### 5. Backend
- Nenhuma alteração. Já está em Meta.

## Detalhes técnicos

- **Polling de verificação**: continua a usar `whatsapp_links.verify_code` → `verified_at`. O webhook Meta, ao receber a primeira mensagem com o código, faz `update` desta linha (já implementado na versão Meta do webhook — confirmar/ajustar se necessário num passo de implementação).
- **Número do bot Meta**: precisa ser definido pelo dono da app. Será lido de `VITE_WHATSAPP_BOT_NUMBER` (não-secret, pode ir no `.env` quando o utilizador fornecer). Até lá, UI mostra placeholder e instrução clara.
- **Sem nova secret necessária** — todas as secrets Meta já existem.

## Pergunta antes de implementar

Tens o **número de telefone WhatsApp Business** que aparece no Meta for Developers (o número associado ao `WHATSAPP_PHONE_ID`) para colocar como número do bot que os utilizadores vão contactar? Se sim, partilha-o no formato internacional (ex: `351912345678`, sem `+`).
