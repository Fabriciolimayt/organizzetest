## Fluxo de Onboarding Pós-Registro

Após `/signup`, o usuário entra num wizard de 4 passos antes de cair no `/dashboard`. Mantemos a tela de nome já existente como passo 0 e adicionamos 3 novas telas inspiradas no moedas.app.

### Estrutura de rotas

```
/onboarding/nome       → existente (passo 0 — não numerado)
/onboarding/idioma     → 1/3  PT / EN
/onboarding/moeda      → 2/3  EUR (padrão) / BRL / USD / MZN
/onboarding/whatsapp   → 3/3  Conectar WhatsApp (opcional, com "Saltar")
→ redireciona para /dashboard (com query `?tour=1` para disparar o tour de 8 passos depois)
```

### Componente compartilhado: `OnboardingWizardLayout`

Wrapper único para os 3 novos passos, replicando o header verde do moedas.app:

- Header verde fixo com logo `organizze` à esquerda
- Barra de progresso fina verde abaixo do header (preenchimento proporcional ao passo)
- Linha superior com: `< Voltar` à esquerda · indicador de passos (3 pílulas, ativa em verde) ao centro · `N / 3` à direita
- Ícone circular suave (bg verde claro) acima do título
- Título serifado grande + subtítulo cinza
- Slot de conteúdo
- Footer fixo: botão `<` (voltar) + botão verde grande `Continuar >` (full-width no mobile)

Props: `step (1|2|3)`, `icon`, `title`, `subtitle`, `onBack`, `onContinue`, `canContinue`, `children`, `extraFooter` (para o "Saltar por agora").

### Passo 1 — Idioma (`/onboarding/idioma`)

- Grid 2 colunas com cards selecionáveis:
  - 🇵🇹 Português · PT (pré-selecionado, com check verde no canto superior direito)
  - 🇬🇧 English · EN
- Card selecionado: borda verde + fundo `primary/5`; check em badge circular verde
- Estado armazenado em `localStorage` (`organizze.locale`)
- Continuar → `/onboarding/moeda`

### Passo 2 — Moeda (`/onboarding/moeda`)

- Lista vertical de cards (3 itens), cada um:
  - Bandeira (emoji) · símbolo grande verde (€, Mt, $) · Nome em negrito + país em cinza · check verde à direita quando selecionado
- Opções: **Euro** (Portugal, Europa — pré-selecionado), **Real** (Brasil), **Metical** (Moçambique), **Dólar** (Estados Unidos)
- Card selecionado: fundo `primary/5` + borda verde
- Estado em `localStorage` (`organizze.currency`, default `EUR`)
- Continuar → `/onboarding/whatsapp`

### Passo 3 — WhatsApp (`/onboarding/whatsapp`)

- Título "Conectar WhatsApp" + subtítulo: "Envia fotos de recibos e recebe o resumo mensal do teu orçamento no dia 25 — **automaticamente.**"
- Linha de 3 mini-features (ícone + título + descrição):
  - 🧾 Digitalizar recibo · Foto → despesa
  - 💬 Texto rápido · "Gastei 45€"
  - 📅 Relatório mensal · Dia 25 de cada mês
- Card branco com bordas suaves:
  - Header: ícone chat + "Conectar WhatsApp" / "Envia recibos via WhatsApp"
  - Label "NÚMERO WHATSAPP"
  - Linha: seletor de DDI (bandeira + `+351` / `+55` / `+258` / `+1`, derivado da moeda escolhida) + input de telefone
  - Texto "Número completo: +351 ..."
  - Botão `💬 Verificar com WhatsApp` (desabilitado até preencher número válido)
- Footer extra: link central `▷ Saltar por agora` + legenda "Opcional — podes conectar mais tarde nas definições"
- Após verificar OU saltar → `navigate('/dashboard?tour=1')`

### Atualizações em arquivos existentes

- **`src/pages/OnboardingNome.tsx`**: ao clicar Continuar, navegar para `/onboarding/idioma` (hoje não navega).
- **`src/App.tsx`**: registrar as 3 novas rotas.
- **`src/pages/Signup.tsx`**: garantir que o submit final aponte para `/onboarding/nome`.

### Componentes novos

```
src/components/onboarding/
  OnboardingWizardLayout.tsx     ← header verde, progress, voltar, continuar
  SelectableCard.tsx             ← card com check para idioma/moeda
src/pages/
  OnboardingIdioma.tsx
  OnboardingMoeda.tsx
  OnboardingWhatsApp.tsx
```

### Design tokens

Usar exclusivamente tokens semânticos já existentes (`primary`, `primary-foreground`, `muted-foreground`, `border`, `card`, `app-bg`). Tipografia: títulos com fonte serifada (se já houver no projeto, reutilizar; senão usar `font-bold` padrão com tracking apertado para aproximar do moedas.app).

### Responsividade

- Mobile-first (viewport atual 402px). Cards de idioma em 2 colunas mesmo no mobile; moeda em 1 coluna empilhada. Footer de botões sticky no bottom em telas pequenas.

### Fora deste plano

O **tour guiado de 8 passos no dashboard** será feito numa segunda etapa, quando você enviar os prints restantes. Vou apenas deixar preparado: ao chegar em `/dashboard?tour=1`, armazenar uma flag para acionar o tour depois.
