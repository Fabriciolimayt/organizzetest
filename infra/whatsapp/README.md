# Organizze WhatsApp local

Stack local e privada para receber eventos WhatsApp pela Evolution API `v2.3.7` em modo Baileys e encaminhar somente envelopes normalizados e assinados ao Supabase.

## Topologia

- `evolution`: sessão Baileys e API REST; sem porta publicada.
- `postgres`: dados exclusivos da Evolution; sem dados financeiros do Organizze.
- `redis`: cache e estado efêmero da Evolution.
- `bridge`: recebe webhooks, assina o envelope para `whatsapp-ingest` e processa jobs de envio; não publica nenhuma porta no host.

Evolution e bridge usam uma rede de saída para alcançar WhatsApp e Supabase. PostgreSQL e Redis ficam somente na rede Docker interna. Nenhum serviço desta stack deve receber tráfego da internet.

## Pré-requisitos

1. Docker Engine com Docker Compose v2.
2. Migration `app_v2` aplicada no Supabase e schema exposto no Data API.
3. Edge Function `whatsapp-ingest` publicada com `WHATSAPP_BRIDGE_SECRET` igual ao valor local.
4. Um número WhatsApp dedicado, sem campanhas, spam ou disparos em massa.

## Configuração

```bash
cd infra/whatsapp
cp .env.example .env
```

Preencha `.env` com segredos aleatórios e credenciais do projeto. A senha PostgreSQL deve ser URL-safe porque integra a connection string da Evolution. `SUPABASE_SERVICE_ROLE_KEY`, `EVOLUTION_API_KEY` e `WHATSAPP_BRIDGE_SECRET` nunca podem entrar no frontend, em logs ou no Git.

`GEMINI_API_KEY` existe somente nos secrets das Edge Functions do Supabase. Não adicione essa chave ao `.env` do bridge nem ao Docker Compose.

Valide e inicie:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose exec bridge node -e "fetch('http://127.0.0.1:3000/health').then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)})"
```

`docker compose ps` também deve mostrar o bridge como `healthy`. O webhook e o health endpoint existem somente dentro das redes Docker; não há endpoint local utilizável como oráculo de assinatura HMAC.

O webhook global da Evolution aponta para `http://bridge:3000/webhooks/evolution` e habilita apenas QR, conexão e mensagens upsert/update. A stack usa uma única instância compartilhada, `organizze-bot`; mantenha `EVOLUTION_INSTANCE_PREFIX=organizze-` para aceitar somente instâncias do Organizze.

## Instância e QR Code

Crie `organizze-bot` uma única vez pelo CLI interno:

```bash
docker compose exec bridge npm run instance:create -- organizze-bot
```

O CLI valida `EVOLUTION_INSTANCE_PREFIX` e chama `POST /instance/create` com `integration: WHATSAPP-BAILEYS`, `qrcode: true` e `webhook: { enabled, url, events, base64: true }`. Nao crie uma instancia por espaco ou por vinculo. O Supabase associa cada mensagem ao tenant por `instance_name + phone_e164`; `organizze-bot` e compartilhada por todos os vinculos. Evolution, bridge e CLI continuam sem portas no host.

O valor QR retornado pela Evolution é escrito diretamente no stdout dessa execução interativa. Ele não passa pelo logger estruturado nem é persistido. Depois de ler o QR, limpe a tela e o scrollback do terminal compatível:

```bash
clear
printf '\033[3J'
```

Não grave a resposta do QR em logs, banco ou tickets. Após a leitura, acompanhe `CONNECTION_UPDATE` e confirme que a conexão fica ativa. Use sempre um número dedicado e mantenha volume moderado.

## Operação

```bash
docker compose logs --tail=100 bridge
docker compose restart evolution bridge
docker compose down
```

Os logs do bridge contêm somente tipo do evento, resultado, status HTTP, ID interno do job e flags booleanas. Não incluem texto, telefone, instância, mídia, QR, payload bruto ou credenciais.

Quando a Evolution ou a máquina estiver desligada, o Supabase mantém jobs pendentes. Ao regressar, o bridge chama `claim_whatsapp_jobs` e envia `send_message` por `POST /message/sendText/{instance}`.

Jobs `process_message` são enviados por HMAC para `/functions/v1/whatsapp-process` com apenas `jobId`, `lockedAt` e `workerId`. A Edge Function conclui o processamento e o job atomicamente; após HTTP 2xx o bridge não executa PATCH de conclusão. Falhas usam o mesmo retry cercado por lease, sem encaminhar `message_id`, `space_id`, conteúdo, telefone ou IDs do provedor.

No início e durante o polling, o bridge chama no máximo uma vez por `REPORT_ENQUEUE_INTERVAL_MS` a RPC `app_v2.enqueue_whatsapp_monthly_reports`, passando somente o horário ISO de referência. O padrão é uma hora; o intervalo permitido vai de um minuto a 24 horas. Dia 25, timezone, opt-in, deduplicação e criação dos jobs são decisões exclusivas da RPC no Supabase. Cada relatório vira um job `send_message`; após o aceite da Evolution, o bridge chama `app_v2.mark_whatsapp_monthly_report_sent`. Uma falha de enqueue gera apenas log técnico redigido e não bloqueia o claim de outros jobs.

Nesta versão, `send_message` e `process_message` são executáveis. Recibos fazem upload direto para Storage privado durante o ingest, portanto `download_media` permanece explicitamente não suportado. `monthly_report` nao e um job executado pelo bridge: a RPC cria o conteudo e um `send_message` faz a entrega.

Mensagens com `remoteJid` telefonico sao normalizadas normalmente. Para `remoteJid` terminado em `@lid`, use `remoteJidAlt` apenas quando ele trouxer um JID telefonico valido; sem alternativo confiavel, ignore o evento de forma segura e redigida. Nunca derive ou armazene um telefone a partir de um LID.

Cada alteração do job exige `status=processing`, `locked_by` igual ao worker e o mesmo `locked_at` retornado pelo claim. Esse fencing impede que um worker antigo finalize um lease já retomado. Depois do aceite da Evolution, o bridge substitui o payload sensível por um recibo com instância, timestamp e, quando fornecido, hash SHA-256 do ID do provedor. Só então tenta marcar o job como concluído. Se essa finalização falhar, a fila de reconciliação repete apenas os PATCHes; ela não chama `sendText` novamente. Um job recuperado com `delivery_state=accepted` também vai direto para finalização.

Quando `send_message` contém `report_id`, esse UUID é preservado no recibo aceito. A reconciliação chama a RPC idempotente `app_v2.mark_whatsapp_monthly_report_sent` antes de concluir o job. Se essa atualização falhar, somente operações de banco são repetidas; a mensagem já aceita pela Evolution não é reenviada.

Essa estratégia reduz duplicatas, mas não oferece garantia exactly-once. A Evolution não fornece uma transação conjunta entre `sendText` e Supabase: se o processo morrer depois do aceite remoto e antes de persistir o recibo, um reclaim posterior pode reenviar. O reclaim do schema deve preservar e priorizar jobs com recibo `accepted`; operação crítica deve considerar esta janela residual.

## Segurança e limites

- Não publique as portas de Evolution, PostgreSQL ou Redis.
- Não adicione `ports` ao bridge. Health e webhook ficam somente nas redes Docker.
- Faça rotação periódica das três credenciais sensíveis.
- `MAX_WEBHOOK_BYTES` usa 8,5 MiB por padrão e possui teto configurável rígido de 12 MiB. `MAX_MEDIA_BYTES` limita a imagem decodificada a 6 MiB por padrão e no máximo 8 MiB.
- O bridge aceita somente o media type exato `application/json`, com parâmetros sintaticamente válidos.
- Imagens aceitam base64 puro ou data URI `image/*;base64`, com validação sintática e de tamanho antes do forward.
- O base64 existe somente no envelope HMAC em memória e atravessa a saída local para o Supabase por HTTPS. Ele nunca entra em logs, respostas HTTP ou eventos de auditoria.
- A Task 2 deve enviar a imagem para Storage privado temporário e remover `mediaBase64` antes de qualquer insert no banco. A política de expiração deve eliminar o objeto após processamento.
- Baileys usa WhatsApp Web e não é uma API oficial. Reconexões e bloqueios são possíveis.
- Revise os termos e requisitos de licença/branding da Evolution API antes de uso comercial.

## Testes

```bash
cd bridge
node --test
```

A suíte usa apenas o test runner nativo do Node e não exige rede. Para validar imagens, redes, healthchecks e interpolação de variáveis, execute também `docker compose config` e um ciclo integrado quando Docker estiver disponível.
