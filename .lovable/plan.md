# Plano de melhorias — Organizze

## 1. Pagamentos Stripe (multi-moeda)

Ativar **Lovable Payments (Stripe)** — sem chave BYOK, com compliance gerido.

**Catálogo:**
- `Free` — €0 (sem checkout, plano padrão)
- `Pro` — €9 / mês
- `Premium` — €19 / mês

**Multi-moeda:** cada preço criado nas 4 moedas (EUR, BRL, USD, MZN) com conversão aproximada:
- Pro: €9 / R$49 / $9.99 / 599 MZN
- Premium: €19 / R$99 / $19.99 / 1.199 MZN

A moeda apresentada no checkout segue a escolhida no onboarding (`organizze.currency` → localStorage).

**Fluxo técnico:**
- `enable_stripe_payments` + `batch_create_product` (3 preços × 4 moedas)
- Nova página `/dashboard/planos-assinatura` com 3 cards → botão "Assinar" chama edge function `create-checkout`
- Edge function `stripe-webhook` regista status em nova tabela `subscriptions (user_id, plan, status, current_period_end, currency)`
- Hook `useSubscription()` para gating de features Pro/Premium

## 2. Tour obrigatório para novos utilizadores

Regra: qualquer novo signup (Email, Google, futuro Apple) marca `firstRun=1` → ao aterrar em `/dashboard`, o `TourProvider` inicia automaticamente.

**Comportamento:**
- Overlay com passo-a-passo por todas as tabs (Overview → Lançamentos → Orçamento → Planos → Grupos → WhatsApp)
- Botão **"Saltar"** disponível em cada passo
- Se saltar sem chegar ao fim: `tourCompleted` fica `false` → volta no próximo login
- Só desaparece definitivamente ao clicar **"Concluir"** no último passo (`tourCompleted=true`)

**Implementação:**
- Detecção de "novo user" no `AuthProvider`: comparar `created_at` do user com `last_sign_in_at`; se iguais → set `firstRun=1`
- Isto cobre Google/Email/qualquer provider, sem depender do formulário de signup
- `TourProvider` já existe — adicionar lógica de re-arme por login enquanto `!tourCompleted`

## 3. Redesign visual — Editorial Verde Escuro

**Design tokens (index.css):**
```
--background: 155 45% 6%      /* #0a1f14 */
--foreground: 45 40% 92%      /* #f5f0e0 cream */
--primary:    162 82% 27%     /* #0d7a5f esmeralda */
--accent:     45 55% 54%      /* #c9a84c dourado */
--card:       155 40% 9%
--muted:      155 20% 15%
```
Tipografia: **Instrument Serif** (headings/hero) + **Work Sans** (body/UI). Substituir Fraunces/Inter no `index.css` e `tailwind.config.ts`.

**Páginas atualizadas:**
- **Landing (`Index.tsx`)** — hero com serif grande + kicker dourado, mockup em cartão escuro com borda dourada fina, secções com muito whitespace, divisores sutis em `--accent/20`
- **Header** — transparente sobre hero, sticky escuro após scroll
- **Auth** — cartão escuro sobre fundo esverdeado, foco no CTA dourado
- **Onboarding wizard** — header verde escuro, progresso dourado, tipografia serif nos títulos
- **Dashboard** — cards com `bg-card`, headings serif, KPI numbers grandes em Instrument Serif; donut e gráficos com paleta esmeralda→dourado
- **Nova página de Assinatura** — 3 cards, o do meio (Pro) com destaque dourado + selo "Mais popular"

**Micro-interações:** hover suave (`transition-all duration-300`), underline animado nos links do nav, cards com `hover:border-accent/40`.

## Detalhes técnicos

**Ficheiros a criar:**
- `src/pages/DashboardAssinatura.tsx`
- `src/hooks/useSubscription.tsx`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- Migration: tabela `subscriptions` com RLS + GRANT

**Ficheiros a editar:**
- `src/index.css` + `tailwind.config.ts` (paleta + fontes)
- `src/pages/Index.tsx` (redesign completo landing)
- `src/pages/Auth.tsx`, `OnboardingNome.tsx`, `OnboardingIdioma.tsx`, `OnboardingMoeda.tsx`, `OnboardingWhatsApp.tsx`
- `src/components/onboarding/OnboardingWizardLayout.tsx`
- `src/components/LandingHeader.tsx`
- `src/pages/Dashboard.tsx` + restantes páginas do dashboard (tokens semânticos, sem hardcode)
- `src/hooks/useAuth.tsx` (deteção de novo user via `created_at===last_sign_in_at`)
- `src/components/tour/TourProvider.tsx` (skip + re-arme)
- `src/App.tsx` (rota `/dashboard/assinatura`)
- `src/components/dashboard/DashboardLayout.tsx` (link Assinatura)

**Ordem de execução:**
1. Redesign de tokens + fontes (base visual)
2. Atualizar landing, auth, onboarding e dashboard para novos tokens
3. Lógica de tour obrigatório com skip
4. Ativar Stripe + produtos + página de assinatura + webhook
