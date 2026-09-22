# Login E Cadastro: Paper Edition

Implementacao local em 2026-09-20, na worktree `codex/invisible-ledger`.
Previa de desenvolvimento: http://127.0.0.1:56788/auth.
Previa do build: http://127.0.0.1:56784/auth.
Esta alteracao nao foi publicada no Lovable nem no Sites.

## Entrega

- Composicao clara inspirada no papel recortado da referencia do utilizador.
- Recibos, calendario e categorias substituem folhas e elementos botanicos.
- Mesma pagina funcional para login/cadastro, com Google e e-mail/senha.
- Estilos isolados em `src/pages/auth-paper.css`; nenhuma mudanca global de tema.
- Visibilidade da senha, autocomplete contextual, foco e carregamento acessiveis.
- Arte WebP local: 30 KB no layout compacto, 78 KB no amplo.
- Prompt, origem e caminhos: [auth-paper-assets.md](auth-paper-assets.md).

## Preservacao

Nenhuma alteracao nas chamadas Supabase/OAuth, nas validacoes, nas flags locais,
nos redirecionamentos, nas rotas, no onboarding, nos dados ou nas assinaturas.
`/signup` continua sendo o alias existente para `/auth`; o cadastro e escolhido
no botao Criar conta. Nao foram criadas contas nem executado OAuth real nos testes.

## Verificacao

- 395 testes Vitest passaram, incluindo 42 novos testes de autenticacao.
- TypeScript e build de producao aprovados.
- ESLint: zero erros; 27 avisos Fast Refresh preexistentes fora desta alteracao.
- React Doctor das mudancas: zero erros e zero avisos.
- 13 verificacoes Playwright: login/cadastro a 320, 375, 768, 1440 e 1920 pixels;
  alias, senha visivel, retencao dos campos, teclado, carregamento, erro simulado,
  movimento reduzido, texto ampliado e formulario com imagem indisponivel.
- Capturas e relatorios completos em `artifacts/auth-paper/`.
- Revisao independente dos handlers sem regressao encontrada. Revisao visual
  corrigiu contraste de placeholder (5,58:1), contorno do campo (3,15:1) e
  incluiu inputs na ampliacao de texto a 200%.
- Uma primeira suite completa, simultanea ao Lighthouse, excedeu o timeout
  de um teste de dashboard. A repeticao com dois workers passou integralmente,
  sem mudar o teste ou seu timeout.

## Medicoes De Producao

Lighthouse via Playwright/Chromium, tres execucoes por perfil, servidor local.
Sem remover conteudo, esconder a arte ou simular respostas para melhorar notas.

| Perfil | Performance | Acessibilidade | SEO | LCP mediano | TBT mediano | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Celular | 77 / 78 / 79 | 100 / 100 / 100 | 100 / 100 / 100 | 3,45 s | 312 ms | 0 |
| Desktop | 100 / 93 / 99 | 100 / 100 / 100 | 100 / 100 / 100 | 0,71 s | 64,5 ms | 0 |

O objetivo de 100 em todas as categorias nao foi atingido. O bundle geral
existente carrega aproximadamente 1,45 MB de JavaScript (408 KB gzip); separar
rotas e bibliotecas do dashboard e uma melhoria arquitetural futura, fora desta
mudanca visual. Best Practices variou entre 78 e 100: os relatorios identificam
um cookie de terceiros do Stripe em `https://m.stripe.com/6`. Pagamentos e esse
carregamento existente foram preservados. Os resultados sao sinteticos locais,
nao medidas de utilizadores reais nem verificacao do backend em producao.

Os scripts `scripts/qa-auth-paper.mjs` e `scripts/audit-auth-paper.mjs` usam os
runtimes Playwright/Chromium disponiveis nesta maquina. Os testes funcionais
Vitest usam mocks de SDK; o teste de erro no navegador intercepta a solicitacao.
