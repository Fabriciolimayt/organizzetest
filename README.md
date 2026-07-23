# Organizze

SaaS de finanças pessoais com registo de gastos via WhatsApp (texto + OCR de faturas), dashboard editorial, orçamento 50/30/20, planos multi-moeda via Stripe e integração MCP para agentes de IA.

**Stack:** React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router · Supabase (Postgres + Auth + Edge Functions) · Stripe Embedded Checkout · Gemini 2.0 Flash (OCR) · Datafy / Meta WhatsApp Cloud API.

---

## 1. Requisitos

- **Node.js** ≥ 20 e **bun** (ou npm/pnpm)
- Conta **Supabase** (ou Lovable Cloud)
- Conta **Stripe** (modo sandbox para testes)
- Conta **Datafy** (`app.datafyapi.com.br`) OU **Meta for Developers** (WhatsApp Cloud API)
- **Google AI Studio** API key (Gemini) para OCR de faturas

---

## 2. Clonar e instalar

```bash
git clone <URL_DO_REPO>
cd organizze
bun install        # ou: npm install
```

---

## 3. Variáveis de ambiente (frontend)

Cria um ficheiro `.env` na raiz com:

```bash
# Supabase (públicas — vão no bundle)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...       # anon key
VITE_SUPABASE_PROJECT_ID=<project-ref>

# Stripe (pública — publishable key)
VITE_PAYMENTS_CLIENT_TOKEN=pk_test_...            # sandbox
# Em produção (.env.production): pk_live_...
```

> Encontras estes valores em Supabase → *Project Settings → API* e em Stripe → *Developers → API keys*.

---

## 4. Secrets do Supabase (backend / Edge Functions)

Define no dashboard: **Supabase → Project Settings → Edge Functions → Secrets** (ou `supabase secrets set NAME=value`).

### Auto-geridos pelo Supabase (não mexer)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_JWKS`

### IA (OCR de faturas + parsing de texto)
| Secret | Onde obter |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `LOVABLE_API_KEY` | Auto-provisionado pela Lovable (se usares Lovable AI Gateway em vez do Gemini directo) |

### WhatsApp — opção A: Datafy (recomendado, actualmente em uso)
| Secret | Descrição |
|---|---|
| `DATAFY_TOKEN` | Token da API em `app.datafyapi.com.br` → *Configurações → API* |
| `DATAFY_WEBHOOK_SECRET` | Verify token que defines ao criar o webhook na Datafy |

### WhatsApp — opção B: Meta Cloud API (oficial)
| Secret | Descrição |
|---|---|
| `WHATSAPP_TOKEN` | Permanent access token do WhatsApp Business App |
| `WHATSAPP_PHONE_ID` | Phone Number ID do painel Meta |
| `WHATSAPP_APP_SECRET` | App Secret (usado para validar `x-hub-signature-256`) |
| `WHATSAPP_VERIFY_TOKEN` | String arbitrária — colas a mesma no painel Meta |

### Stripe (gateway gerido pela Lovable Cloud)
| Secret | Descrição |
|---|---|
| `STRIPE_SANDBOX_API_KEY` | Auto-provisionado ao activar payments |
| `STRIPE_LIVE_API_KEY` | Criado após go-live |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET` | Auto-provisionado |
| `PAYMENTS_LIVE_WEBHOOK_SECRET` | Após go-live |

> Se **não** usares Lovable Cloud, substitui pelo teu próprio `STRIPE_SECRET_KEY` e adapta `supabase/functions/_shared/stripe.ts` para chamar `api.stripe.com` directamente.

---

## 5. Base de dados — migrações

As migrações estão em `supabase/migrations/`. Aplica com:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Tabelas principais:
- `expenses` — gastos registados (RLS por `user_id`)
- `whatsapp_links` — códigos de verificação + número associado
- `whatsapp_events` — logs de webhook para diagnóstico
- `subscriptions` — estado Stripe por utilizador (função `has_active_subscription`)

---

## 6. Deploy das Edge Functions

```bash
npx supabase functions deploy whatsapp-webhook
npx supabase functions deploy whatsapp-diagnostico
npx supabase functions deploy parse-receipt
npx supabase functions deploy parse-expense-text
npx supabase functions deploy monthly-summary
npx supabase functions deploy create-checkout
npx supabase functions deploy payments-webhook
npx supabase functions deploy mcp
```

Config de auth por função está em `supabase/config.toml` (webhooks e checkout usam `verify_jwt = false`).

---

## 7. Configurar o WhatsApp

### Datafy
1. Login em https://app.datafyapi.com.br
2. **Webhooks → Novo webhook**
   - URL: `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`
   - Verify token: o mesmo valor de `DATAFY_WEBHOOK_SECRET`
   - Eventos: `messages`
3. Salva `DATAFY_TOKEN` e `DATAFY_WEBHOOK_SECRET` como secrets (passo 4).

### Meta Cloud API (alternativa)
1. https://developers.facebook.com → App WhatsApp Business
2. **Configuration → Webhook**
   - Callback URL: `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`
   - Verify token: valor de `WHATSAPP_VERIFY_TOKEN`
   - Subscribe: `messages`
3. Adiciona números de teste em *API Setup*.

Fluxo do utilizador: `/onboarding/whatsapp` gera código `moedas-verify-XXXX` → utilizador envia para `+351 938 930 953` → webhook associa o número ao `user_id`.

---

## 8. Configurar o Stripe

1. Activar payments no dashboard.
2. Produtos já criados: `pro_monthly` e `premium_monthly` em EUR / BRL / USD / MZN.
3. Configurar webhook Stripe:
   - Endpoint: `https://<project-ref>.supabase.co/functions/v1/payments-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`
4. Testar checkout com cartão `4242 4242 4242 4242`.

---

## 9. Rodar em desenvolvimento

```bash
bun run dev
# http://localhost:8080
```

Fluxo de teste:
1. `/signup` → criar conta (email ou Google)
2. Wizard: nome → idioma → moeda → WhatsApp
3. `/dashboard?tour=1` — tour obrigatório para novos utilizadores (persistente até completar)
4. `/dashboard/diagnostico-whatsapp` — verificar secrets e eventos em tempo real
5. `/dashboard/assinatura` — testar checkout Stripe

---

## 10. Build de produção

```bash
bun run build       # gera dist/
bun run preview     # servir dist/ localmente
```

Garante que `.env.production` contém `VITE_PAYMENTS_CLIENT_TOKEN=pk_live_...` antes do build final.

---

## 11. MCP (Agent Integrations)

Servidor MCP exposto em `/functions/v1/mcp` com três tools:
- `list_expenses`
- `create_expense`
- `monthly_summary`

Autenticação via OAuth 2.1 do Supabase. Consent screen em `/.lovable/oauth/consent`. Conectar a partir de ChatGPT, Claude, Cursor ou Codex.

---

## 12. Estrutura do projeto

```
src/
  components/         # UI reutilizável (dashboard, tour, checkout)
  hooks/              # useAuth, useLocalState, useTour
  lib/                # stripe, countries, mcp/tools
  pages/              # Index, Signup, Onboarding*, Dashboard*, Auth
  integrations/supabase/  # cliente auto-gerado (NÃO editar)
supabase/
  functions/          # edge functions (Deno)
  migrations/         # SQL versionado
  config.toml         # config das functions
```

---

## 13. Troubleshooting

| Problema | Solução |
|---|---|
| `Missing Supabase environment variable(s)` | Verificar `.env` e restart do dev server |
| WhatsApp não responde | Ver logs em `/dashboard/diagnostico-whatsapp` + Supabase → Functions → Logs |
| Checkout: `STRIPE_LIVE_API_KEY is not configured` | Completar go-live no painel Stripe/Lovable |
| Google login: `Unsupported provider` | Activar Google em Supabase → Auth → Providers |
| Tour não aparece para novo user | Confirmar que `created_at ≈ last_sign_in_at` no `useAuth` |

---

## Licença

Proprietary — Organizze © 2026.
