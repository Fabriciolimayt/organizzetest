import { createClient } from "npm:@supabase/supabase-js@2.105.4";

import {
  buildExpenseParserRequest,
  buildReceiptParserRequest,
  createGeminiChatRequest,
  extractAiMessageContent,
  parseProcessEnvelope,
  validateAiReceipt,
  validateAiExpense,
} from "../_shared/whatsapp-process.ts";
import {
  exceedsWebhookBodyLimit,
  readLimitedWebhookBody,
  verifyBridgeSignature,
} from "../_shared/whatsapp-ingest.ts";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
const MAX_RECEIPT_BYTES = 6 * 1024 * 1024;
const RECEIPT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function bytesToDataUri(bytes: Uint8Array, mimeType: string): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 32_768, bytes.length)));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response(405, { error: "method_not_allowed" });
  if (exceedsWebhookBodyLimit(request.headers.get("content-length"))) {
    return response(413, { error: "payload_too_large" });
  }

  const secret = Deno.env.get("WHATSAPP_BRIDGE_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!secret || !supabaseUrl || !serviceRoleKey || !geminiApiKey) {
    return response(503, { error: "service_unavailable" });
  }

  const body = await readLimitedWebhookBody(request.body);
  if (!body.ok) return response(body.reason === "payload_too_large" ? 413 : 400, { error: body.reason });

  const verification = await verifyBridgeSignature({
    rawBody: body.rawBody,
    secret,
    timestampHeader: request.headers.get("x-organizze-timestamp"),
    signatureHeader: request.headers.get("x-organizze-signature"),
  });
  if (!verification.ok) return response(401, { error: "unauthorized" });

  let rawEnvelope: unknown;
  try {
    rawEnvelope = JSON.parse(body.rawBody);
  } catch {
    return response(400, { error: "invalid_request" });
  }
  const envelope = parseProcessEnvelope(rawEnvelope);
  if (!envelope) return response(400, { error: "invalid_request" });

  const supabaseBase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const supabase = supabaseBase.schema("app_v2");

  const { data: job, error: jobError } = await supabase
    .from("whatsapp_jobs")
    .select("id, space_id, message_id")
    .eq("id", envelope.jobId)
    .eq("status", "processing")
    .eq("job_type", "process_message")
    .eq("locked_at", envelope.lockedAt)
    .eq("locked_by", envelope.workerId)
    .maybeSingle();
  if (jobError) return response(500, { error: "processing_failed" });
  if (!job?.message_id) return response(409, { error: "lease_not_found" });

  const [{ data: message, error: messageError }, { data: space, error: spaceError }] = await Promise.all([
    supabase
      .from("whatsapp_messages")
      .select("id, body_redacted, message_type")
      .eq("id", job.message_id)
      .eq("space_id", job.space_id)
      .eq("direction", "inbound")
      .maybeSingle(),
    supabase.from("spaces").select("currency").eq("id", job.space_id).maybeSingle(),
  ]);
  if (messageError || spaceError) return response(500, { error: "processing_failed" });
  if (!message || !space?.currency || !["text", "image"].includes(message.message_type)) {
    return response(422, { error: "message_not_processable" });
  }

  let aiRequest: Record<string, unknown>;
  let receiptMedia: { storage_path: string } | null = null;
  if (message.message_type === "image") {
    const now = new Date().toISOString();
    const { data: media, error: mediaError } = await supabase
      .from("whatsapp_media")
      .select("id, storage_path, mime_type, size_bytes")
      .eq("message_id", message.id)
      .eq("space_id", job.space_id)
      .eq("is_valid", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(2);
    if (mediaError) return response(500, { error: "processing_failed" });
    if (!media || media.length !== 1) return response(422, { error: "message_not_processable" });
    const selectedMedia = media[0];
    if (
      !RECEIPT_MIME_TYPES.has(selectedMedia.mime_type)
      || typeof selectedMedia.size_bytes !== "number"
      || selectedMedia.size_bytes < 1
      || selectedMedia.size_bytes > MAX_RECEIPT_BYTES
    ) {
      return response(422, { error: "message_not_processable" });
    }

    const { data: receiptBlob, error: downloadError } = await supabaseBase.storage
      .from("whatsapp-inbox").download(selectedMedia.storage_path);
    if (
      downloadError
      || !receiptBlob
      || receiptBlob.size < 1
      || receiptBlob.size > MAX_RECEIPT_BYTES
      || (receiptBlob.type !== "" && receiptBlob.type !== selectedMedia.mime_type)
    ) {
      return response(502, { error: "processing_failed" });
    }
    const receiptBytes = new Uint8Array(await receiptBlob.arrayBuffer());
    aiRequest = buildReceiptParserRequest(bytesToDataUri(receiptBytes, selectedMedia.mime_type), space.currency);
    receiptMedia = { storage_path: selectedMedia.storage_path };
  } else {
    if (typeof message.body_redacted !== "string" || !message.body_redacted.trim()) {
      return response(422, { error: "message_not_processable" });
    }
    aiRequest = buildExpenseParserRequest(message.body_redacted, space.currency);
  }

  let aiResponse: Response;
  try {
    aiResponse = await fetch(createGeminiChatRequest(geminiApiKey, aiRequest));
  } catch {
    return response(502, { error: "processing_failed" });
  }
  if (!aiResponse.ok) return response(502, { error: "processing_failed" });

  let aiPayload: unknown;
  try {
    const responseBody = await aiResponse.text();
    if (responseBody.length > 65_536) return response(502, { error: "processing_failed" });
    aiPayload = JSON.parse(responseBody);
  } catch {
    return response(502, { error: "processing_failed" });
  }
  const aiContent = extractAiMessageContent(aiPayload);
  const parsedExpense = message.message_type === "image"
    ? validateAiReceipt(aiContent, space.currency)
    : validateAiExpense(aiContent, space.currency);
  if (!parsedExpense) return response(502, { error: "processing_failed" });

  const { error: completionError } = await supabase.rpc("complete_whatsapp_processing", {
    job_id: envelope.jobId,
    locked_at: envelope.lockedAt,
    worker_id: envelope.workerId,
    parsed: parsedExpense,
  });
  if (completionError) return response(500, { error: "processing_failed" });

  if (receiptMedia) {
    try {
      await supabaseBase.storage.from("whatsapp-inbox").remove([receiptMedia.storage_path]);
    } catch {
      // Cleanup is deliberately best-effort after the durable transaction commit.
    }
  }

  return response(202, { accepted: true });
});
