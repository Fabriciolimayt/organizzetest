## Teste do webhook Datafy — resultado

Corri dois pedidos contra a edge function `whatsapp-webhook` em produção:

**1. GET (simulação do handshake Datafy/Meta)**
- Enviei `hub.mode=subscribe&hub.verify_token=__probe__&hub.challenge=ping123`
- Resposta: `403 Forbidden` ✅ (rejeita token errado — só aceita o `WHATSAPP_VERIFY_TOKEN` real)

**2. POST (simulação de mensagem recebida)**
- Enviei payload de mensagem de texto sem assinatura
- Resposta: `403 Forbidden` ✅
- Log: `invalid or missing x-hub-signature-256` ✅ (rejeita payloads não assinados)

**Conclusão:** o código está vivo, deployed e a aplicar segurança corretamente. Não dá para testar o caminho feliz daqui porque eu não tenho a `DATAFY_WEBHOOK_SECRET` para assinar o payload — só a Datafy consegue.

## Próximo passo (do teu lado, no painel Datafy)

1. Webhooks → Callback URL: `https://lxlsrnysjtojnlhvjjew.supabase.co/functions/v1/whatsapp-webhook`
2. Verify token: o valor de `WHATSAPP_VERIFY_TOKEN`
3. Copiar o webhook secret da Datafy e confirmar que bate certo com `DATAFY_WEBHOOK_SECRET`
4. Subscrever o campo `messages`
5. Confirmar que `DATAFY_TOKEN` é do número `+351 938 930 953`

Depois envia `ajuda` para `+351 938 930 953` no WhatsApp — eu vejo os logs em tempo real para confirmar.

## Opcional — quero propor

Criar uma página interna `/dashboard/diagnostico-whatsapp` (visível só ao utilizador autenticado) que mostre:
- Estado de cada secret (✅/❌ configurada, sem mostrar valores)
- Últimos 10 eventos recebidos pelo webhook (data, tipo, número, sucesso/erro)
- Botão "enviar mensagem de teste" para o teu próprio WhatsApp via Datafy

Isto ajuda-te a debugar sozinho sem dependeres de mim para ver logs.

### Detalhes técnicos
- Nova edge function `whatsapp-diagnostico` (verify_jwt=true) que lê secrets e tabela `whatsapp_events` (a criar)
- Tabela `whatsapp_events`: id, user_id, type, payload_summary, success, error, created_at + RLS
- Webhook passa a inserir nesta tabela cada evento processado
- Nova página React no dashboard com refresh a cada 5s

Confirmas que queres a página de diagnóstico, ou preferes testar primeiro com a configuração atual?