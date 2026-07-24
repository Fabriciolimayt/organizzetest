# Estética Aave adaptada — verde esmeralda + glassmorphism total

Aplicar a linguagem visual do Aave (glassmorphism denso, gradientes conic, blobs animados, cards translúcidos, tipografia moderna) mantendo a paleta verde esmeralda + gold já existente. Intensidade máxima: blobs animados, blur pesado, glow, gradientes conic.

## Design system (base de tudo)

Atualizar `src/index.css` e `tailwind.config.ts`:

- **Fundo**: gradiente radial esmeralda profundo → quase preto (`#050f0a → #0a1f14 → #0d2a1c`) com blobs coloridos fixos no `body::before/::after` (verde-primary, gold, cyan-teal) desfocados a ~180px, animados lentamente (`float`, 20s).
- **Novos tokens**:
  - `--glass-bg`: `rgba(255,255,255,0.04)`
  - `--glass-border`: `rgba(245,240,224,0.08)`
  - `--glass-highlight`: gradiente linear no topo dos cards
  - `--gradient-mesh`: conic esmeralda/gold/teal
  - `--gradient-primary`: `linear-gradient(135deg, hsl(primary), hsl(primary-glow))`
  - `--gradient-gold`: gold → cream sutil
  - `--glow-primary`, `--glow-gold`: box-shadows coloridos difusos
- **Tipografia**: manter Instrument Serif (display) + Work Sans (body); adicionar variante "display gigante" (clamp 3–8rem, tracking apertado) para hero Aave-style.
- **Utilities**: classes `.glass-card`, `.glass-panel`, `.glow-primary`, `.mesh-bg`, `.blob`, `.text-gradient-gold`.
- **Keyframes novos**: `blob-float` (translate + scale), `shimmer` (para bordas de cards), `pulse-glow`.

## Componentes partilhados

- **`src/components/Blobs.tsx` (novo)**: 3–4 blobs SVG/div posicionados absolutamente, animados, reutilizável em landing/dashboard/onboarding.
- **`DashboardCard.tsx`**: converter para glass (bg translúcido, border sutil, backdrop-blur, highlight no topo, hover glow).
- **`SelectableCard.tsx`**: glass + selected state com gradiente + glow verde.
- **`InputField.tsx`**: input glass (bg 4% branco, border sutil, focus com glow verde).
- **`SocialLoginButton.tsx`**: glass button.
- **Botão `ui/button`**: adicionar variantes `glass` e `gradient` (primary→glow com sombra colorida).

## Landing page (`src/pages/Index.tsx` + `LandingHeader.tsx`)

- **Header**: glass sticky com blur, borda inferior sutil, logo com glow suave.
- **Hero Aave-style**: título display gigante em serif com palavras-chave em gradiente gold; subtítulo em Work Sans muted; CTAs — primário gradient com glow, secundário glass; mockup WhatsApp num cartão glass flutuante com blob verde por trás.
- **Seções**: cada bloco com blobs de fundo próprios, cards de features em grid glass com ícone em círculo gradient, seção de planos com o card destacado usando border-gradient animado (shimmer) e glow forte.
- **Footer**: glass panel escuro com links em muted-foreground.

## Signup + Onboarding

- **`Signup.tsx`**: fundo mesh + blobs, cartão central glass grande com backdrop-blur pesado, inputs glass, botão gradient, social buttons glass.
- **`OnboardingWizardLayout.tsx`**: header glass em vez de sólido primary, barra de progresso com gradiente animado, footer glass com blur, ícone da etapa em círculo gradient com glow.
- **Onboarding pages** (Nome / Idioma / Moeda / WhatsApp): usar `SelectableCard` glass; adicionar 1–2 blobs de fundo.

## Dashboard

- **`DashboardLayout.tsx`**:
  - Header: substituir `bg-primary` sólido por glass escuro com backdrop-blur + borda sutil; NavLinks ativos com pill gradient + glow em vez de bold branco.
  - Banner promo: glass em vez de amber sólido, botão "Ativar" gradient gold.
  - Status sub-header: glass panel.
  - Main: adicionar `<Blobs />` fixo de fundo.
  - Floating buttons: glass circular com glow no hover.
- **`Dashboard.tsx`** e outras páginas dashboard: KPI cards e donut chart em glass; números grandes em serif com gradiente gold sutil; sparklines/áreas com fill gradient verde translúcido.
- **`MonthSelector.tsx`**, `EmptyState.tsx`, `QuickActionButton.tsx`: variante glass.

## Detalhes técnicos

- Todos os `bg-card`, `bg-primary`, `border-border` das superfícies principais migram para as novas utilities glass (via classes ou tokens) — sem quebrar semântica shadcn.
- Blur pesado (`backdrop-blur-2xl`) apenas em superfícies primárias; blur médio em cards para performance.
- Animações respeitam `prefers-reduced-motion` (desativar blobs e shimmer).
- Zero cores hardcoded — tudo via tokens HSL em `index.css`.
- Sem alterações de lógica/backend: apenas CSS, tokens, e presentational components.

## Ordem de execução

1. Tokens + utilities + keyframes (`index.css`, `tailwind.config.ts`).
2. Componentes partilhados (`Blobs`, botões, inputs, cards).
3. Landing + header.
4. Signup + Onboarding wizard.
5. Dashboard layout + páginas.
6. Passagem final de polish (glows, spacing, tipografia hero).
