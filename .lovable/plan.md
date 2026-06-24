## Novo Logo Animado ORGANIZZE

Substituir o componente `Logo` atual (círculo verde "O" + texto) por uma versão neon ciano sobre fundo escuro, inspirada no GIF anexado, com animação ao passar o rato.

### Visual

- Container escuro arredondado (`bg-[#0a1520]`) com padding interno — sempre escuro, independente do tema do app.
- Texto "ORGA" em cima e "NIZZE" em baixo, fonte mono/condensada com `letter-spacing` largo, gradiente ciano→azul (`#22d3ee` → `#3b82f6`).
- Quadrado SVG fino traçado a ciano sobreposto ao centro das duas linhas (como no GIF).
- Pequeno glow (`drop-shadow`) ciano permanente subtil.

### Animação no hover

- Estado idle: "ORGA" deslocado para a esquerda (-20px, opacity 0.6), "NIZZE" deslocado para a direita (+20px, opacity 0.6), quadrado com `stroke-dashoffset` parcial.
- Hover: ambas as linhas deslizam para a posição central (translateX 0, opacity 1) com `transition-all duration-500 ease-out`, e o quadrado completa o traçado (stroke-dashoffset 0) — efeito "letras encaixam + caixa fecha".
- Glow intensifica no hover.
- Versões compactas (header) reduzem proporcionalmente; versão grande (landing hero) pode ser usada com prop `size`.

### Onde aplica

Substituição global — `src/components/Logo.tsx` é importado por:
- `LandingHeader`, `Index` (hero / footer)
- `DashboardLayout`, `Auth`, `Signup`, fluxos de Onboarding

Todos passam a mostrar o novo logo neon automaticamente (header das páginas claras manterá o logo num "chip" escuro arredondado, o que dá ainda mais destaque à marca).

### Detalhes técnicos

- Reescrever `src/components/Logo.tsx`:
  - Props: `size?: 'sm' | 'md' | 'lg'` (default `md`), `white?: boolean` mantida por compatibilidade mas ignorada (o chip é sempre escuro).
  - Estrutura: `<div class="group inline-flex ... bg-[#0a1520] rounded-lg px-4 py-3">` com SVG do quadrado em posição absoluta e duas `<span>` para ORGA / NIZZE.
  - Transições via Tailwind (`group-hover:translate-x-0`, `group-hover:opacity-100`, `group-hover:[stroke-dashoffset:0]`).
  - Sem dependências novas — CSS puro + Tailwind.
- Sem alterações em `index.css` nem `tailwind.config.ts` (cores hardcoded no chip são intencionais porque o fundo do logo é fixo, não segue o tema).
- Sem alterações de lógica/backend.