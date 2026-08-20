# Organizze

SaaS de finanças pessoais com registo de gastos via WhatsApp (texto + OCR de faturas), dashboard editorial, orçamento 50/30/20, planos multi-moeda via Stripe e integração MCP para agentes de IA.

**Stack:** React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router · Supabase (Postgres + Auth + Edge Functions) · Stripe Embedded Checkout · Gemini 3.5 Flash-Lite · Evolution API 2.3.7 local (Baileys).

---

## 1. Requisitos

- **Node.js** ≥ 20 e **bun** (ou npm/pnpm)
- Conta **Supabase** (ou Lovable Cloud)
- Conta **Stripe** (modo sandbox para testes)
- Docker Engine com Docker Compose v2, para a integração WhatsApp local
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

### WhatsApp local — Evolution API
| Secret | Descrição |
|---|---|
| `WHATSAPP_BRIDGE_SECRET` | Segredo HMAC partilhado entre bridge e Edge Function `whatsapp-ingest` |

`SUPABASE_SERVICE_ROLE_KEY` e `EVOLUTION_API_KEY` pertencem apenas ao ambiente privado do bridge. Nunca entram no `.env` do frontend, em logs ou no Git.

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

A migration V2 adiciona o schema `app_v2` sem remover as tabelas legadas. No dashboard do Supabase, em **Settings → API**, exponha explicitamente `app_v2` no Data API. As tabelas financeiras, membros, vínculos WhatsApp, jobs e relatórios mensais mantêm RLS por espaço.

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
npx supabase functions deploy whatsapp-ingest
npx supabase functions deploy whatsapp-process
```

Config de auth por função está em `supabase/config.toml` (webhooks e checkout usam `verify_jwt = false`).

---

## 7. Configurar o WhatsApp

O WhatsApp usa uma Evolution API `2.3.7` local em modo Baileys. Suba a stack privada, sem portas expostas no host:

```bash
cd infra/whatsapp
cp .env.example .env
docker compose config
docker compose up -d --build
docker compose exec bridge npm run instance:create -- organizze-bot
```

Crie `organizze-bot` uma única vez e leia o QR apenas no terminal interativo. Cada vínculo gerado por `app_v2.create_whatsapp_link(phone_e164, space_id)` usa essa mesma instância; o isolamento de cada espaço acontece pela combinação `instance_name + phone_e164` no Supabase, não por instâncias por usuário. O bridge recebe eventos locais, assina-os e chama `whatsapp-ingest`; `whatsapp-process` processa jobs financeiros e o bridge envia respostas pela Evolution.

Relatórios mensais opt-in são criados pela RPC `app_v2.enqueue_whatsapp_monthly_reports` e entregues por jobs `send_message`. Recibos são enviados diretamente ao Storage privado durante o ingest; `download_media` permanece deliberadamente não suportado. Para detalhes de segurança, QR e operação, consulte [infra/whatsapp/README.md](infra/whatsapp/README.md) e [docs/organizze-v2-deploy.md](docs/organizze-v2-deploy.md).

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
