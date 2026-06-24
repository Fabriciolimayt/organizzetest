## Logo subtil, sem chip escuro

Refazer o `Logo` para integrar-se ao design claro do site (não um bloco neon destacado).

### Mudanças

- **Fundo transparente** — remover `bg-[#0a1520]`, padding interno e `overflow-hidden`. Sem chip.
- **Tamanho compacto** — uma única linha "ORGANIZZE" (não mais duas linhas ORGA/NIZZE empilhadas), altura ~28px no header.
- **Cor adaptada ao tema** — texto em `text-foreground` (cinza-escuro no tema claro do site), com letter-spacing largo (`tracking-[0.25em]`) e peso `font-semibold`. Sem gradiente ciano forte.
- **Marca de quadrado discreta** — SVG fino do quadrado à esquerda do texto (não sobreposto), traço `currentColor` em `text-primary` (verde da marca) com largura ~1px, tamanho ~24×24px. Funciona como ícone-marca.
- **Animação hover subtil** — ao passar o rato:
  - O quadrado completa o traço (`stroke-dashoffset` 30% → 0, duração 500ms).
  - As letras "ORGA" e "NIZZE" partem ligeiramente espaçadas (gap maior via `tracking`) e ao hover encaixam para o `tracking` final — efeito mínimo de "encaixe", sem deslocações grandes.
  - Sem glow, sem drop-shadow.

### Props

Manter `size?: 'sm' | 'md' | 'lg'` e `white?: boolean` (quando `white`, texto fica `text-primary-foreground` para usar sobre fundos escuros como footer).

### Onde aplica

Mesma substituição global — todos os imports existentes de `Logo` recebem automaticamente a nova versão discreta.

### Ficheiro

- Reescrever `src/components/Logo.tsx`. Sem alterações noutros ficheiros, sem novas dependências.