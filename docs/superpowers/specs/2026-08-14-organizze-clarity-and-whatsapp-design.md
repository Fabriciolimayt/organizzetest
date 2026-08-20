# Organizze: Clareza Humana e WhatsApp de Produção

## Objetivo

Redesenhar integralmente o Organizze para que a landing, autenticação, onboarding e área financeira pareçam partes do mesmo produto: simples, confiável e agradável de usar todos os dias. Em paralelo, substituir o protótipo híbrido de WhatsApp por uma arquitetura segura, idempotente e baseada no Supabase.

O mercado inicial é Portugal. A interface usa pt-PT, euro por padrão e formatos locais; outras moedas continuam possíveis no perfil, sem tornar a primeira versão globalmente complexa.

## Direção visual aprovada

A direção escolhida é **Clareza humana**.

- O produto operacional usa superfícies claras, fundo cinza-esverdeado muito suave, texto carvão e verde profundo como cor de marca.
- Verde vivo, azul, âmbar e coral aparecem como sinais semânticos, não como decoração dominante.
- A landing pode manter momentos escuros e editoriais para criar reconhecimento, mas autenticação, onboarding e dashboard priorizam leitura e comparação.
- `Work Sans` permanece como fonte de interface. `Instrument Serif` fica restrita a títulos de marketing e momentos editoriais; valores, tabelas e títulos operacionais usam a fonte de interface.
- Componentes usam raio de 6-8 px, bordas discretas e sombras curtas. Vidro, brilhos, fundos com blobs e gradientes decorativos deixam de ser linguagem padrão.
- Ícones Lucide acompanham comandos e navegação. Emojis deixam de funcionar como ícones de produto.
- O sistema respeita contraste WCAG AA, foco visível, redução de movimento e alvos de toque de pelo menos 44 px.

## Estrutura da experiência

### Landing e autenticação

- A primeira dobra apresenta o nome Organizze, a proposta literal de orçamento pessoal e uma demonstração legível do produto/WhatsApp.
- A navegação aponta apenas para secções reais; links vazios são removidos ou recebem conteúdo.
- Prova do produto, recursos e planos usam hierarquia mais curta, menos cartões e textos consistentes em pt-PT.
- Login e criação de conta partilham o mesmo shell visual, validam campos em contexto e mostram estados de envio, erro e sucesso sem deslocar a página.

### Onboarding

- O fluxo é apresentado como uma sequência única de cinco passos: nome, idioma, moeda, WhatsApp e confirmação.
- A progressão usa um stepper textual e uma ação principal estável; voltar, saltar WhatsApp e recuperar erros ficam sempre previsíveis.
- Cada passo explica somente a decisão atual. A configuração é persistida no perfil Supabase, com cache local apenas para evitar perda durante a navegação.

### Dashboard

- Desktop usa sidebar fixa compacta e cabeçalho contextual. Mobile usa barra inferior para destinos principais e menu para itens secundários.
- A página inicial prioriza: saldo disponível, gastos do mês, orçamento restante, tendência e lançamentos recentes.
- Uma ação global “Adicionar lançamento” abre fluxo consistente para despesa ou receita.
- Relatórios, orçamento, planos, grupos, limites e WhatsApp reutilizam cabeçalhos, filtros, estados vazios, tabelas e feedbacks do mesmo sistema.
- Promoções e tutorial não competem com tarefas financeiras; aparecem de forma contextual e dispensável.
- Estados carregando, vazio, erro, offline e sucesso são definidos para todas as consultas e mutações.

## Dados e arquitetura de aplicação

- Postgres/Supabase passa a ser a fonte única para perfil, moeda, categorias, orçamento, despesas, grupos e vínculo WhatsApp.
- React Query centraliza leitura, cache, invalidação e estados assíncronos. `localStorage` permanece apenas para preferências de interface e rascunhos temporários.
- As categorias recebem identificadores estáveis e uma taxonomia única compartilhada por dashboard, OCR, parser de texto e WhatsApp.
- As operações financeiras são protegidas por RLS e sempre associadas ao utilizador autenticado; respostas do banco são verificadas antes de confirmar sucesso na UI ou no WhatsApp.
- A migração do estado local importa dados existentes uma única vez, com confirmação e proteção contra duplicação.

## WhatsApp

O alvo recomendado é a **Meta WhatsApp Cloud API direta**, isolada atrás de um adapter de provedor. Datafy não será mantida como caminho implícito; só poderá ser reintroduzida com contrato e documentação validados.

### Escopo inicial

- Um número por conta.
- Entrada por texto e fotografia de recibo; PDF, áudio e múltiplos números ficam fora da primeira entrega.
- A despesa identificada é gravada automaticamente e a resposta inclui resumo e opção clara de corrigir ou anular.
- O resumo mensal é opt-in, enviado no dia 25 no timezone Europe/Lisbon por template aprovado.
- Imagens são mantidas somente durante o processamento e eliminadas depois; payloads e logs guardam dados mínimos e redigidos.

### Fluxo técnico

1. O webhook valida a assinatura Meta, percorre todos os eventos e grava cada mensagem com chave idempotente do provedor.
2. O receptor responde rapidamente; processamento de media, IA e persistência financeira ocorre num worker separado.
3. O worker resolve o vínculo, normaliza o conteúdo, grava a despesa numa transação e envia a resposta pelo adapter.
4. Mensagens enviadas, entregues, lidas ou falhadas atualizam o estado interno; retries usam backoff e eventos irrecuperáveis seguem para uma fila de falhas.
5. O diagnóstico global fica restrito a administradores. Cada utilizador vê apenas o estado e os eventos redigidos do próprio vínculo.

### Segurança e configuração

- Códigos de vínculo são únicos, armazenados como hash, vinculados ao telefone solicitado, expiram e só podem ser consumidos uma vez.
- Secrets ficam no gestor de secrets do Supabase; `.env` e artefactos locais nunca são versionados.
- Webhook, media e IA têm limites de tamanho, tempo, frequência e quota por plano.
- A ativação em produção exige WABA, Phone Number ID, system-user token, App Secret, verify token e templates aprovados fornecidos pelo proprietário da conta Meta.

## Qualidade e validação

- Testes unitários cobrem tokens visuais, formatação monetária, taxonomia, normalização E.164, códigos de vínculo, assinaturas e idempotência.
- Testes de componentes cobrem navegação, formulários, feedback, estados vazios/erro e responsividade.
- Testes de integração cobrem RLS, importação de dados locais, transações financeiras, retries e isolamento entre utilizadores.
- E2E cobre criar conta, concluir onboarding, adicionar/editar/anular lançamento, configurar orçamento e vincular/enviar texto/fotografia pelo sandbox da Meta.
- A UI é verificada em 390x844, 768x1024, 1440x900 e 1920x1080, incluindo contraste, foco por teclado e ausência de sobreposição.
- Build, lint e testes devem passar antes da entrega. Os erros de lint existentes fazem parte da estabilização inicial.

## Entrega em fases

1. Fundamentos: tokens, tipografia, shell responsivo, componentes e correções de lint/segurança de configuração.
2. Experiência: landing, autenticação, onboarding e todas as áreas do dashboard na nova linguagem.
3. Dados: hooks React Query, perfil e finanças no Supabase, taxonomia e importação segura do `localStorage`.
4. WhatsApp: modelo de eventos, adapter Meta, vínculo seguro, worker, respostas, templates e diagnóstico.
5. Validação: testes completos, QA visual responsivo, acessibilidade, observabilidade e preparação de produção.

## Critérios de aceitação

- Todas as rotas existentes continuam acessíveis e coerentes em desktop e mobile.
- Nenhuma informação financeira nova depende apenas do navegador para persistir.
- O mesmo lançamento aparece de forma consistente no dashboard e no WhatsApp, sem duplicação em retries.
- O utilizador entende saldo, gastos e orçamento em poucos segundos e encontra a ação principal sem depender do tutorial.
- A interface usa pt-PT de forma consistente e não contém links, botões ou promessas sem implementação correspondente.
