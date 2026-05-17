# Plano

## 1. Tour obrigatório para novos registos (global, multi-página)

**Estado atual:** o tour só existe dentro do `/dashboard` (em `Dashboard.tsx`) e só é disparado via `?tour=1` ou pelos botões "Primeiros passos". Não cobre o resto do site e não arranca automaticamente após o registo.

**O que vai mudar:**

- Criar um **TourProvider** global em `src/components/tour/TourProvider.tsx` montado no `App.tsx`, com:
  - Lista única de passos cobrindo **todas as secções** indicadas: Visão geral, Orçamento, Lançamentos, Relatórios, Planos, Grupos, WhatsApp, Limites, botão de ajuda flutuante.
  - Navegação entre rotas dentro do tour (cada passo pode ter um `route`; o provider faz `navigate(route)` antes de medir o `target`).
  - Persistência em `localStorage` (`organizze.tourCompleted`) para não repetir.

- Mover `TourOverlay` para fora do `Dashboard.tsx` e usá-lo a partir do provider, para que o destaque funcione em qualquer página.

- **Trigger automático:** logo após o signup bem-sucedido em `Auth.tsx` (e no fim do onboarding em `OnboardingWhatsAppVerificar.tsx`) marcar `organizze.firstRun=true`. O `TourProvider` deteta esta flag no primeiro render dentro de `/dashboard` e arranca o tour automaticamente.

- Botão "Primeiros passos" e o botão de ajuda flutuante passam a chamar `tour.start()` do provider (continua a funcionar manualmente).

- Manter os atributos `data-tour="…"` que já existem e adicionar os que faltam nas páginas internas (`DashboardLancamentos`, `DashboardRelatorios`, etc.).

## 2. WhatsApp a funcionar a sério

**Estado atual:** o "WhatsApp" é um **simulador** dentro da app (`DashboardWhatsApp.tsx`). Não há ligação real ao WhatsApp — o "código de verificação" e o "bot" são mock. As edge functions `parse-receipt`, `parse-expense-text`, `monthly-summary` já existem e funcionam com Gemini, mas só são chamadas pelo simulador.

Para o utilizador receber/enviar mensagens reais no WhatsApp do telemóvel é obrigatório um **provedor da API oficial do WhatsApp**. Não há forma de o contornar — o WhatsApp não permite bots sem passar por um BSP (Business Solution Provider) ou pela Cloud API da Meta.

### Opções (precisas de escolher uma)

| Opção | Custo | Setup | Notas |
|---|---|---|---|
| **A. Meta WhatsApp Cloud API** (recomendado) | Grátis até 1000 conversas/mês | Conta Meta Business + número dedicado + verificação | Webhook oficial, sem intermediários |
| **B. Twilio WhatsApp** | Sandbox grátis para teste; produção pago | Conta Twilio + sandbox join code | Sandbox arranca em 2 min, ótimo para demo |
| **C. Evolution API / Z-API** (não oficial) | ~10-30€/mês | Servidor próprio ou SaaS | Usa WhatsApp Web, risco de banimento |
| **D. Continuar simulador** | 0 | Já feito | Não envia mensagens reais |

### O que será construído (independente do provedor escolhido)

1. **Tabela `expenses` em Lovable Cloud** (com RLS por `user_id`) — substitui o `localStorage`, para o webhook conseguir escrever e o dashboard ler via Realtime.
2. **Tabela `whatsapp_links`** — guarda `user_id ↔ phone_number ↔ verification_code ↔ verified_at`.
3. **Edge function `whatsapp-webhook`** (`verify_jwt=false`, valida assinatura do provedor):
   - Recebe mensagem do WhatsApp.
   - Procura o `user_id` pelo número.
   - Se for o código `moedas-verify-XXXX` → marca `verified_at` e responde "WhatsApp ligado ✅".
   - Se for texto → chama `parse-expense-text` → insere em `expenses`.
   - Se for imagem → faz download da media, chama `parse-receipt` (Gemini Vision) → insere itens em `expenses`.
   - Envia resposta de confirmação de volta via API do provedor.
4. **Edge function `whatsapp-send`** — usada pelo dashboard para enviar o resumo mensal.
5. **Dashboard com Realtime:** subscreve à tabela `expenses` para atualizar em tempo real quando o webhook insere — não precisa de eventos `localStorage` nem do simulador.
6. **Secrets necessários** (depende da escolha): `META_WHATSAPP_TOKEN` + `META_PHONE_NUMBER_ID` + `META_VERIFY_TOKEN` (opção A) **ou** `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_WHATSAPP_FROM` (opção B). Pedidos via `add_secret` no momento certo.

## Decisões que preciso de ti

1. **Provedor WhatsApp:** A (Meta Cloud), B (Twilio sandbox para já), C (Evolution/Z-API), ou D (manter simulador)?
2. **Tour:** confirmas que o tour automático deve abrir **só uma vez** por utilizador (não a cada login) e cobrir as 8 secções listadas acima?

Depois de responderes implemento numa só passagem.

## Detalhes técnicos (referência)

```text
src/
  components/tour/TourProvider.tsx   (novo, global)
  components/tour/tourSteps.ts       (novo, com route + target por passo)
  App.tsx                            (envolve em <TourProvider>)
  pages/Auth.tsx                     (set firstRun=true após signup)
supabase/
  migrations/...                     (tabelas expenses + whatsapp_links + RLS)
  functions/whatsapp-webhook/        (novo)
  functions/whatsapp-send/           (novo)
```
