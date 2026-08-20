import { createClient } from "npm:@supabase/supabase-js@2.105.4";

import {
  connectionEventOrderFilter,
  decodeImageMedia,
  deriveWebhookEventKey,
  ensureInboundMessage,
  ensureInboundProcessJob,
  exceedsWebhookBodyLimit,
  normalizeBridgeEnvelope,
  readLimitedWebhookBody,
  uniqueSpaceIds,
  verifyBridgeSignature,
} from "../_shared/whatsapp-ingest.ts";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
const MAX_TEXT_WEBHOOK_BYTES = 65_536;

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response(405, { error: "method_not_allowed" });
  if (exceedsWebhookBodyLimit(request.headers.get("content-length"))) {
    return response(413, { error: "payload_too_large" });
  }

  const secret = Deno.env.get("WHATSAPP_BRIDGE_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceRoleKey) return response(503, { error: "service_unavailable" });

  const body = await readLimitedWebhookBody(request.body);
  if (!body.ok) return response(body.reason === "payload_too_large" ? 413 : 400, { error: body.reason });
  const rawBody = body.rawBody;
  const verification = await verifyBridgeSignature({
    rawBody,
    secret,
    timestampHeader: request.headers.get("x-organizze-timestamp"),
    signatureHeader: request.headers.get("x-organizze-signature"),
  });
  if (!verification.ok) return response(401, { error: verification.reason });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return response(400, { error: "invalid_json" });
  }

  const event = normalizeBridgeEnvelope(payload);
  if (event.kind === "unsupported") return response(202, { accepted: false, reason: "unsupported_event" });
  if (event.kind === "invalid") return response(400, { error: "invalid_envelope" });
  if (!(event.kind === "message_upsert" && event.messageType === "image")
    && exceedsWebhookBodyLimit(null, rawBody, MAX_TEXT_WEBHOOK_BYTES)) {
    return response(413, { error: "payload_too_large" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const supabase = adminClient.schema("app_v2");

  if (event.kind === "connection_update" || event.kind === "qr_update") {
    const { data: connections, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("id, space_id")
      .eq("instance_name", event.instanceName);
    if (connectionError) return response(500, { error: "connection_lookup_failed" });
    if (!connections?.length) return response(404, { error: "connection_not_found" });

    const { error: updateError } = await supabase
      .from("whatsapp_connections")
      .update({ last_seen_at: event.occurredAt, updated_at: new Date().toISOString() })
      .eq("instance_name", event.instanceName)
      .or(connectionEventOrderFilter(event.occurredAt));
    if (updateError) return response(500, { error: "connection_update_failed" });

    const details = event.kind === "qr_update"
      ? { count: event.count ?? null }
      : { state: event.state, statusReason: event.statusReason ?? null };
    const eventKey = await deriveWebhookEventKey(rawBody);
    let duplicateCount = 0;
    const spaces = uniqueSpaceIds(connections);
    for (const spaceId of spaces) {
      const { error: eventError } = await supabase.from("whatsapp_events").insert({
        space_id: spaceId,
        event_type: event.kind === "qr_update" ? "qrcode.updated" : "connection.update",
        event_key: eventKey,
        details_redacted: details,
      });
      if (eventError?.code === "23505") duplicateCount += 1;
      else if (eventError) return response(500, { error: "event_persistence_failed" });
    }
    return response(202, { accepted: true, duplicate: duplicateCount === spaces.length });
  }

  const { data: connections, error: connectionError } = await supabase
    .from("whatsapp_connections")
    .select("id, space_id, status, verified_at, instance_name, phone_e164")
    .eq("instance_name", event.instanceName)
    .eq("phone_e164", event.phoneE164)
    .in("status", ["active", "pending"])
    .order("status", { ascending: true })
    .limit(2);
  if (connectionError) return response(500, { error: "connection_lookup_failed" });
  if (!connections || connections.length !== 1) {
    return response(connections?.length ? 409 : 404, { error: "connection_not_found_or_ambiguous" });
  }
  const connection = connections[0];

  if (event.kind === "message_update") {
    const { error } = await supabase.rpc("apply_whatsapp_message_status", {
      connection_id: connection.id,
      external_message_id: event.providerMessageId,
      status: event.status,
    });
    return error ? response(500, { error: "message_update_failed" }) : response(202, { accepted: true });
  }

  const timestampValues = event.direction === "inbound"
    ? { received_at: event.occurredAt, sent_at: null }
    : { received_at: null, sent_at: event.occurredAt };
  let duplicate = false;
  const inboundMessageRepository = {
    async insertMessage() {
      const { data, error } = await supabase.from("whatsapp_messages").insert({
        space_id: connection.space_id,
        connection_id: connection.id,
        direction: "inbound",
        status: "received",
        external_message_id: event.providerMessageId,
        message_type: event.messageType,
        body_redacted: event.linkCode ? "[link-code]" : event.bodyRedacted || null,
        metadata_redacted: event.metadataRedacted,
        ...timestampValues,
      }).select("id").single();
      if (error?.code === "23505") {
        duplicate = true;
        return { kind: "duplicate" } as const;
      }
      if (error || !data) throw new Error("message_persistence_failed");
      return { kind: "inserted", id: data.id } as const;
    },
    async findMessage() {
      const { data, error } = await supabase.from("whatsapp_messages")
        .select("id")
        .eq("connection_id", connection.id)
        .eq("external_message_id", event.providerMessageId)
        .maybeSingle();
      if (error) throw new Error("message_lookup_failed");
      return data;
    },
  };

  if (event.direction === "inbound") {
    if (event.linkCode) {
      try {
        const message = await ensureInboundMessage(inboundMessageRepository);
        const { data: consumed, error: consumeError } = await supabase.rpc("consume_whatsapp_link", {
          code: event.linkCode,
          phone_e164: event.phoneE164,
        });
        if (consumeError) throw new Error("link_consume_failed");

        let linkedConnection = consumed;
        if (!linkedConnection && duplicate) {
          const { data: refreshed, error: refreshError } = await supabase.from("whatsapp_connections")
            .select("id, space_id, status, verified_at, instance_name, phone_e164")
            .eq("id", connection.id)
            .maybeSingle();
          if (refreshError) throw new Error("connection_refresh_failed");
          if (refreshed?.status === "active" && refreshed.verified_at) linkedConnection = refreshed;
        }
        if (!linkedConnection) return response(202, { accepted: false, linked: false, duplicate });

        const { error: jobError } = await supabase.from("whatsapp_jobs").insert({
          space_id: linkedConnection.space_id,
          message_id: message.id,
          job_type: "send_message",
          status: "pending",
          payload: {
            instance: linkedConnection.instance_name ?? event.instanceName,
            phone_e164: event.phoneE164,
            text: "Número associado ao Organizze com sucesso.",
          },
        });
        if (jobError && jobError.code !== "23505") throw new Error("link_confirmation_failed");
        return response(202, { accepted: true, linked: true, duplicate });
      } catch {
        return response(500, { error: "link_processing_failed" });
      }
    }

    if (connection.status !== "active" || !connection.verified_at) {
      return response(202, { accepted: false, reason: "connection_not_verified" });
    }
    const decodedMedia = event.messageType === "image"
      ? decodeImageMedia(event.mediaBase64 ?? "", event.metadataRedacted.mimeType ?? "")
      : null;
    if (decodedMedia && !decodedMedia.ok) {
      return response(decodedMedia.reason === "media_too_large" ? 413 : 400, { error: decodedMedia.reason });
    }

    try {
      await ensureInboundProcessJob(
        {
          ...inboundMessageRepository,
          async repairBeforeJob(messageId) {
            if (!decodedMedia?.ok) return;
            const storagePath = `${connection.space_id}/${messageId}/receipt`;
            const { error: storageError } = await adminClient.storage
              .from("whatsapp-inbox").upload(storagePath, decodedMedia.bytes, {
                contentType: decodedMedia.mimeType,
                upsert: true,
              });
            if (storageError) throw new Error("media_upload_failed");

            const { error: mediaError } = await supabase.from("whatsapp_media").upsert({
              space_id: connection.space_id,
              message_id: messageId,
              storage_path: storagePath,
              mime_type: decodedMedia.mimeType,
              size_bytes: decodedMedia.bytes.byteLength,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
              is_valid: true,
            }, { onConflict: "storage_path" });
            if (mediaError) throw new Error("media_persistence_failed");
          },
          async upsertProcessJob(messageId) {
            const { error } = await supabase.from("whatsapp_jobs").insert({
              space_id: connection.space_id,
              message_id: messageId,
              job_type: "process_message",
              status: "pending",
              payload: { connectionId: connection.id, providerMessageId: event.providerMessageId },
            });
            if (error && error.code !== "23505") throw new Error("job_persistence_failed");
          },
        },
        { connectionId: connection.id, providerMessageId: event.providerMessageId },
      );
    } catch {
      return response(500, { error: "message_or_job_persistence_failed" });
    }
    return response(202, { accepted: true, duplicate });
  }

  const { error } = await supabase.from("whatsapp_messages").insert({
    space_id: connection.space_id,
    connection_id: connection.id,
    direction: "outbound",
    status: "sent",
    external_message_id: event.providerMessageId,
    message_type: event.messageType,
    body_redacted: event.bodyRedacted || null,
    metadata_redacted: event.metadataRedacted,
    ...timestampValues,
  });
  if (error?.code === "23505") {
    duplicate = true;
    const { error: enrichmentError } = await supabase.from("whatsapp_messages").update({
      message_type: event.messageType,
      body_redacted: event.bodyRedacted || null,
      metadata_redacted: event.metadataRedacted,
      sent_at: event.occurredAt,
      updated_at: new Date().toISOString(),
    })
      .eq("connection_id", connection.id)
      .eq("external_message_id", event.providerMessageId)
      .eq("direction", "outbound");
    if (enrichmentError) return response(500, { error: "message_enrichment_failed" });
  } else if (error) {
    return response(500, { error: "message_persistence_failed" });
  }
  return response(202, { accepted: true, duplicate });
});
