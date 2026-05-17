## Objetivo

Substituir o passo atual "Conectar WhatsApp" do onboarding (e a tab `/dashboard/whatsapp`) por um fluxo realista, igual ao do vídeo:

1. Utilizador escolhe país (🇧🇷 BRA · 🇵🇹 PT · 🇬🇧 UK · 🇲🇿 MOZ) e mete o número.
2. App gera um código `moedas-verify-XXXXXXXX` e abre o WhatsApp pré-preenchido para o número do "bot Moedas".
3. Ecrã de espera com instruções + botão "Já enviei o código" (modo mock — sem Twilio/Meta).
4. Após confirmar, o WhatsApp aparece como **Verificado** e o utilizador pode:
   - **Enviar foto de fatura** → Lovable AI Vision (Gemini) extrai itens, total e moeda → grava no localStorage `organizze.expenses` → dashboard atualiza automaticamente.
   - **Escrever texto** ("Gastei 45€ no mercado") → Gemini extrai valor + categoria → grava igualmente.
5. Resumo mensal "no dia 25" mostrado in-app (sem envio real).

## Países suportados

| País | Flag | DDI | Exemplo |
|---|---|---|---|
| Brasil | 🇧🇷 | +55 | 11 99999-9999 |
| Portugal | 🇵🇹 | +351 | 912 345 678 |
| Reino Unido | 🇬🇧 | +44 | 7700 900123 |
| Moçambique | 🇲🇿 | +258 | 84 123 4567 |

Default deriva da moeda escolhida no passo anterior (EUR→PT, BRL→BR, MZN→MZ, USD→UK fallback).

## Telas e ficheiros

### 1. `src/lib/countries.ts` (novo)
Array exportado `WA_COUNTRIES` com `{code, flag, ddi, name, mask}` para os 4 países. Helper `formatPhone(ddi, raw)` e `validatePhone(ddi, raw)` (mínimo de dígitos por país).

### 2. `src/pages/OnboardingWhatsApp.tsx` (reescrita do conteúdo do form)
- Substituir o "DDI derivado da moeda" por um **dropdown de país** com bandeira + nome + DDI, usando `WA_COUNTRIES`.
- Input com máscara/placeholder por país.
- Botão "Verificar com WhatsApp" → gera código `moedas-verify-${crypto.randomUUID().slice(0,8).toUpperCase()}`, guarda em `localStorage.organizze.waVerification = { code, phone, country, status: 'pending', startedAt }` e navega para `/onboarding/whatsapp/verificar`.
- Mantém "Saltar por agora".

### 3. `src/pages/OnboardingWhatsAppVerificar.tsx` (novo)
Tela igual ao print do vídeo:
- Card com o código grande copiável `moedas-verify-XXXXXXXX` + botão Copiar.
- Botão verde grande **"Abrir WhatsApp"** → `https://wa.me/16812765536?text=moedas-verify-XXXXXXXX` (número de bot fixo configurável).
- Texto: "Envia este código ao nosso bot. Assim que recebermos, o teu WhatsApp fica ligado."
- Estado em polling visual: "À espera da mensagem..." com spinner.
- Botão secundário **"Já enviei — confirmar"** (modo mock) → marca `status: 'verified'`, guarda `organizze.whatsapp = { phone, country, verifiedAt }` e navega para `/dashboard?tour=1&wa=ok`.
- Link "Trocar número" volta para o passo anterior.

### 4. `src/pages/DashboardWhatsApp.tsx` (refatorizada)
Quando `organizze.whatsapp.verifiedAt` existe, a tab mostra o **simulador de chat** (sem precisar de telefone), espelhando o vídeo:

- Header verde com nome do bot "Moedas" + número.
- Lista de bolhas (estado local persistido em `localStorage.organizze.waMessages[]`).
- Mensagens iniciais pré-povoadas (boas-vindas, "Podes agora: enviar fotos / escrever despesa / receberes resumo dia 25").
- Composer com 3 ações:
  - **📷 Anexar foto** (input file accept="image/*") → mostra a bolha do utilizador com a thumb → bolha do bot "Recibo recebido! A extrair os itens..." → chama edge function `parse-receipt` → quando responde, bolha "✅ N itens registados!" listando linhas e total → injeta cada item em `localStorage.organizze.expenses` (despacha `window.dispatchEvent('organizze:expenses-updated')`).
  - **💬 Escrever texto** → bolha utilizador → chama `parse-expense-text` → idem.
  - Botão "Ver resumo do mês" → chama `monthly-summary` (gera texto a partir das despesas locais enviadas no body) → bolha do bot.

Quando ainda não verificado, mostra CTA "Ligar WhatsApp" que abre `/onboarding/whatsapp`.

### 5. `src/pages/Dashboard.tsx` (pequeno ajuste)
- Ler `localStorage.organizze.expenses` (já existe) e ouvir o evento `organizze:expenses-updated` para re-render imediato após receber dados do bot.
- Mostrar toast "✅ Nova despesa registada via WhatsApp" quando o evento dispara com origem `whatsapp`.

### 6. `src/App.tsx`
Adicionar rota `/onboarding/whatsapp/verificar`.

## Backend (Lovable Cloud + 3 Edge Functions)

Ativar Lovable Cloud (necessário para edge functions; sem base de dados nesta fase — tudo continua em localStorage para não complicar).

### `supabase/functions/parse-receipt/index.ts`
- POST `{ imageBase64: string, currency: string }`
- Usa AI SDK + Gateway com `google/gemini-3-flash-preview` e `Output.object` (zod):
  ```
  { items: [{ name, amount, category }], total, currency, merchant?, date? }
  ```
- Categorias permitidas: `Alimentação | Transporte | Lazer | Casa | Saúde | Outros`.
- Devolve JSON; o frontend grava localmente.

### `supabase/functions/parse-expense-text/index.ts`
- POST `{ text, currency }`
- Mesmo modelo, schema `{ amount, category, description }`.

### `supabase/functions/monthly-summary/index.ts`
- POST `{ expenses, currency, month }`
- `generateText` com Gemini → devolve `{ summary: string }` no formato do print (tópicos por categoria + total + observação).

Todos com CORS e validação Zod, sem JWT (uso anónimo nesta fase).

## Detalhes técnicos

- **Número do bot mock**: constante `WA_BOT_NUMBER = "16812765536"` (mesmo do vídeo) em `src/lib/countries.ts`. Trocável depois.
- **Link wa.me**: `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(code)}`.
- **Imagens**: convertidas a base64 no frontend antes de chamar a edge function (limite ~5 MB, comprimir com canvas se necessário — usar helper simples `fileToBase64(file, maxWidth=1280)`).
- **Persistência**: continua tudo em `localStorage` (chaves `organizze.*`). Não criamos tabelas neste passo — fica preparado para migrar depois.
- **Tokens de design**: reutilizar `primary`, `card`, `border`, `muted-foreground`. Sem cores hard-coded.
- **Responsivo**: mobile-first (chat ocupa altura `calc(100dvh - header)` no mobile, max-w-2xl no desktop).

## Fora deste plano

- Envio real de mensagens WhatsApp (Twilio/Meta) — fica para uma segunda fase quando quiseres publicar.
- Cron real no dia 25 — por agora só o botão "Ver resumo".
- Migrar despesas para tabela Supabase — fica como TODO assim que a app for multi-device.
