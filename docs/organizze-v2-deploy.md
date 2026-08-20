# Organizze V2: deploy e operacao

Este guia liga o schema `app_v2`, as Edge Functions e a Evolution API local. Nao coloque service role, chave Evolution, segredo HMAC, QR ou media em arquivos versionados.

## 1. Aplicar o Supabase

```bash
npx supabase login
npx supabase link --project-ref mvnpfnmplnsdfkufghgh
npx supabase db push
npx supabase test db
```

No dashboard do projeto, em **Settings > API**, confirme que `app_v2` esta entre os schemas expostos. A configuracao local equivalente esta em `supabase/config.toml`.

Regere os tipos depois da migration aplicada:

```bash
npx supabase gen types typescript --linked --schema public,app_v2 > /tmp/database.types.ts
```

Compare o arquivo gerado com `src/integrations/supabase/types.ts` antes de substituir, pois o projeto ainda mantem tipos legados de `public`.

## 2. Publicar as funcoes

```bash
npx supabase secrets set \
  WHATSAPP_BRIDGE_SECRET='<segredo-aleatorio-forte>' \
  GEMINI_API_KEY='<chave-do-google-ai-studio>'

npx supabase functions deploy whatsapp-ingest
npx supabase functions deploy whatsapp-process
npx supabase functions deploy parse-expense-text
npx supabase functions deploy parse-receipt
npx supabase functions deploy monthly-summary
```

`WHATSAPP_BRIDGE_SECRET` deve ser exatamente o mesmo no Supabase e em `infra/whatsapp/.env`. `GEMINI_API_KEY` existe somente nos secrets das Edge Functions. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sao fornecidos pelo runtime hospedado e nunca vao para o browser.

## 3. Iniciar o WhatsApp local

```bash
cd infra/whatsapp
cp .env.example .env
docker compose config
docker compose up -d --build
docker compose ps
```

Preencha o `.env` local com uma API key Evolution, credenciais do PostgreSQL/Redis, URL e service role do Supabase e o mesmo segredo HMAC. A Evolution, Redis, PostgreSQL e bridge nao publicam portas no host.

## 4. Criar a instancia compartilhada e ler o QR

Provisione `organizze-bot` somente uma vez por stack local. Execute interativamente:

```bash
docker compose exec bridge npm run instance:create -- organizze-bot
```

O QR e mostrado somente no stdout dessa execucao. Nao redirecione a saida, nao cole em tickets e limpe o terminal depois da leitura. Para cada utilizador, chame `app_v2.create_whatsapp_link(phone_e164, space_id)` autenticado e entregue apenas o codigo retornado. O vinculo usa a mesma instancia `organizze-bot`; o roteamento multi-tenant e feito por `instance_name + phone_e164`, nunca por uma instancia `organizze-<space-id>`.

O webhook usa `base64: true` apenas para transportar recibos no envelope HMAC; QR e removido durante a normalizacao e nunca segue para o Supabase. Para JIDs modernos `@lid`, a normalizacao usa `remoteJidAlt` quando este contem um JID telefonico valido. Sem esse mapeamento confiavel, o evento e ignorado de forma segura e redigida; nunca tente inferir um telefone a partir de um LID.

## 5. Validar o fluxo

```bash
pnpm run test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run build

cd infra/whatsapp/bridge
node --test
```

Teste com um numero dedicado:

1. Vinculo correto, codigo expirado e tentativas excedidas.
2. Texto como `12,50 almoco` criando uma unica transacao e uma resposta.
3. Recibo JPEG/PNG/WebP criando media privada temporaria, transacao e limpeza.
4. Reenvio do mesmo webhook sem duplicar mensagem, job ou transacao.
5. Bridge desligado e retomado, incluindo lease expirado e retry.
6. Eventos `read/delivered` fora de ordem sem regressao de status.
7. Mensagem com `remoteJid` `@lid` e `remoteJidAlt` telefonico; e um evento `@lid` sem alternativo, que deve ser ignorado sem dados sensiveis em logs.
8. Relatorio mensal opt-in enfileirado pela RPC `app_v2.enqueue_whatsapp_monthly_reports` e entregue por um job `send_message`.

Antes de producao, execute os advisors de seguranca/performance no dashboard e confirme que o bucket `whatsapp-inbox` continua privado.

## Limites operacionais

- Evolution/Baileys e uma integracao nao oficial do WhatsApp Web. Use numero dedicado, volume moderado e aceite reconexoes ou bloqueios.
- A entrega outbound reduz duplicatas com recibo e fencing, mas nao oferece garantia exactly-once entre Evolution e Supabase.
- A maquina Docker precisa estar ligada para receber e responder mensagens.
- Relatorios mensais sao enfileirados pela RPC `app_v2.enqueue_whatsapp_monthly_reports` e enviados como jobs `send_message`. Recibos usam upload direto, privado e duravel durante o ingest; `download_media` permanece sem worker por nao ser necessario nesse fluxo.
