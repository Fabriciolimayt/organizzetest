## Tornar o logo legível no header escuro

**Problema:** No header verde-escuro do dashboard, o texto "ORGANIZZE" está com contraste muito baixo (cinza sobre verde escuro), tornando-se ilegível.

**Causa:** A prop `white` do `Logo` usa `text-primary-foreground`, que no tema atual não tem contraste suficiente contra o fundo `bg-primary` do header.

### Mudança

Em `src/components/Logo.tsx`:
- Quando `white={true}`, usar `text-white` puro (branco sólido) em vez de `text-primary-foreground`, e o traço do quadrado SVG também em `text-white` — garante contraste alto sobre o verde-escuro do header.
- Aumentar o peso para `font-bold` apenas na variante `white` para reforçar legibilidade em letter-spacing largo.
- Manter tudo no modo claro (variante padrão) exatamente como está.

Sem alterações noutros ficheiros.
