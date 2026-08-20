const MAX_SIGNATURE_AGE_SECONDS = 300;
const MAX_BODY_LENGTH = 4_000;
const MAX_ID_LENGTH = 256;
const MAX_INSTANCE_LENGTH = 128;
const MAX_WEBHOOK_BODY_BYTES = 8.5 * 1_024 * 1_024;
const MAX_MEDIA_BASE64_BYTES = 8 * 1_024 * 1_024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type VerificationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "missing_headers"
        | "invalid_timestamp"
        | "stale_timestamp"
        | "malformed_signature"
        | "invalid_signature";
    };

type MessageStatus = "received" | "queued" | "processing" | "sent" | "delivered" | "read" | "failed";

export type NormalizedBridgeEvent =
  | {
      kind: "message_upsert";
      instanceName: string;
      providerMessageId: string;
      phoneE164: string;
      direction: "inbound" | "outbound";
      messageType: "text" | "image";
      bodyRedacted: string;
      metadataRedacted: { mimeType?: string; fileSize?: number };
      mediaBase64?: string;
      linkCode?: string;
      occurredAt: string;
    }
  | {
      kind: "message_update";
      instanceName: string;
      providerMessageId: string;
      phoneE164: string;
      status: MessageStatus;
      occurredAt: string;
    }
  | {
      kind: "connection_update";
      instanceName: string;
      state: string;
      statusReason?: number;
      occurredAt: string;
    }
  | {
      kind: "qr_update";
      instanceName: string;
      count?: number;
      occurredAt: string;
    }
  | { kind: "unsupported" }
  | { kind: "invalid" };

interface VerifySignatureInput {
  rawBody: string;
  secret: string;
  timestampHeader: string | null;
  signatureHeader: string | null;
  nowSeconds?: number;
}

interface InboundMessageRepository {
  insertMessage(): Promise<{ kind: "inserted"; id: number } | { kind: "duplicate" }>;
  findMessage(): Promise<{ id: number } | null>;
  repairBeforeJob?(messageId: number): Promise<void>;
  upsertProcessJob(messageId: number): Promise<void>;
}

export function exceedsWebhookBodyLimit(
  contentLength: string | null,
  rawBody?: string,
  maxBytes = MAX_WEBHOOK_BODY_BYTES,
): boolean {
  if (contentLength && /^[0-9]+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    return true;
  }
  return rawBody === undefined
    ? false
    : new TextEncoder().encode(rawBody).byteLength > maxBytes;
}

export async function readLimitedWebhookBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = MAX_WEBHOOK_BODY_BYTES,
): Promise<{ ok: true; rawBody: string } | { ok: false; reason: "payload_too_large" | "invalid_encoding" }> {
  if (!body) return { ok: true, rawBody: "" };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const bytesToKeep = Math.min(value.byteLength, maxBytes + 1 - totalBytes);
      if (bytesToKeep > 0) {
        chunks.push(value.subarray(0, bytesToKeep));
        totalBytes += bytesToKeep;
      }
      if (totalBytes > maxBytes || value.byteLength > bytesToKeep) {
        await reader.cancel("payload_too_large").catch(() => undefined);
        return { ok: false, reason: "payload_too_large" };
      }
    }
  } finally {
    reader.releaseLock();
  }

  const completeBody = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    completeBody.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, rawBody: new TextDecoder("utf-8", { fatal: true }).decode(completeBody) };
  } catch {
    return { ok: false, reason: "invalid_encoding" };
  }
}

export function connectionEventOrderFilter(occurredAt: string): string {
  return `last_seen_at.is.null,last_seen_at.lt.${occurredAt}`;
}

export function phoneE164FromRemoteJid(remoteJid: unknown): string | null {
  if (typeof remoteJid !== "string") return null;
  const match = /^([1-9][0-9]{7,14})(?::[0-9]{1,5})?@(s\.whatsapp\.net|c\.us)$/.exec(remoteJid);
  return match ? `+${match[1]}` : null;
}

function phoneE164FromBridgeJids(remoteJid: unknown, remoteJidAlt: unknown): string | null {
  if (typeof remoteJid !== "string") return null;
  if (remoteJid.toLowerCase().endsWith("@lid")) return phoneE164FromRemoteJid(remoteJidAlt);
  return phoneE164FromRemoteJid(remoteJid);
}

export function uniqueSpaceIds(connections: Array<{ space_id: string }>): string[] {
  return [...new Set(connections.map((connection) => connection.space_id))];
}

export async function ensureInboundMessage(repository: Pick<InboundMessageRepository, "insertMessage" | "findMessage">) {
  const insertion = await repository.insertMessage();
  const message = insertion.kind === "inserted" ? insertion : await repository.findMessage();
  if (!message) throw new Error("duplicate_message_not_found");
  return message;
}

export async function ensureInboundProcessJob(
  repository: InboundMessageRepository,
  _identity: { connectionId: string; providerMessageId: string },
): Promise<number> {
  const message = await ensureInboundMessage(repository);
  await repository.repairBeforeJob?.(message.id);
  await repository.upsertProcessJob(message.id);
  return message.id;
}

export async function deriveWebhookEventKey(rawBody: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawBody)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function decodeImageMedia(
  mediaBase64: string,
  declaredMimeType: string,
):
  | { ok: true; mimeType: "image/jpeg" | "image/png" | "image/webp"; bytes: Uint8Array }
  | { ok: false; reason: "invalid_media_type" | "invalid_media_base64" | "media_too_large" } {
  const mimeType = declaredMimeType.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) return { ok: false, reason: "invalid_media_type" };
  if (mediaBase64.length > MAX_MEDIA_BASE64_BYTES) return { ok: false, reason: "media_too_large" };

  let encoded = mediaBase64;
  if (mediaBase64.startsWith("data:")) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(mediaBase64);
    if (!match || match[1] !== mimeType) return { ok: false, reason: "invalid_media_base64" };
    encoded = match[2];
  }
  if (!encoded || encoded.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    return { ok: false, reason: "invalid_media_base64" };
  }

  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const decodedLength = (encoded.length / 4) * 3 - padding;
  if (decodedLength > MAX_MEDIA_BASE64_BYTES) return { ok: false, reason: "media_too_large" };
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return { ok: true, mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp", bytes };
  } catch {
    return { ok: false, reason: "invalid_media_base64" };
  }
}

function decodeHex(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export async function verifyBridgeSignature(input: VerifySignatureInput): Promise<VerificationResult> {
  if (!input.timestampHeader || !input.signatureHeader || !input.secret) {
    return { ok: false, reason: "missing_headers" };
  }
  if (!/^[0-9]{10}$/.test(input.timestampHeader)) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const timestamp = Number(input.timestampHeader);
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1_000);
  if (Math.abs(nowSeconds - timestamp) > MAX_SIGNATURE_AGE_SECONDS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const match = /^sha256=([0-9a-f]{64})$/.exec(input.signatureHeader);
  const provided = match ? decodeHex(match[1]) : null;
  if (!provided) return { ok: false, reason: "malformed_signature" };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(input.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${input.timestampHeader}.${input.rawBody}`),
    ),
  );

  return constantTimeEqual(expected, provided)
    ? { ok: true }
    : { ok: false, reason: "invalid_signature" };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 ? " " : character;
  }).join("").trim();
  return normalized.length > 0 ? normalized.slice(0, maxLength) : null;
}

function isoDate(value: unknown, fallback?: unknown): string | null {
  for (const candidate of [value, fallback]) {
    if (typeof candidate !== "string") continue;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function normalizedBase(input: Record<string, unknown>) {
  const instanceName = boundedString(input.instance, MAX_INSTANCE_LENGTH);
  const occurredAt = isoDate(input.receivedAt);
  const data = record(input.data);
  return instanceName && occurredAt && data ? { instanceName, occurredAt, data } : null;
}

export function normalizeBridgeEnvelope(input: unknown): NormalizedBridgeEvent {
  const envelope = record(input);
  if (!envelope || typeof envelope.event !== "string") return { kind: "invalid" };
  if (!["messages.upsert", "messages.update", "connection.update", "qrcode.updated"].includes(envelope.event)) {
    return { kind: "unsupported" };
  }

  const base = normalizedBase(envelope);
  if (!base) return { kind: "invalid" };
  const { instanceName, data } = base;
  const occurredAt = isoDate(data.occurredAt, base.occurredAt) ?? base.occurredAt;

  if (envelope.event === "messages.upsert") {
    const providerMessageId = boundedString(data.providerMessageId, MAX_ID_LENGTH);
    const phoneE164 = phoneE164FromBridgeJids(data.remoteJid, data.remoteJidAlt);
    const messageType = data.messageType === "image" ? "image" : data.messageType === "text" ? "text" : null;
    if (!providerMessageId || !phoneE164 || !messageType || typeof data.fromMe !== "boolean") return { kind: "invalid" };

    const metadataRedacted: { mimeType?: string; fileSize?: number } = {};
    const mimeType = boundedString(data.mimeType, 128);
    if (messageType === "image" && mimeType) metadataRedacted.mimeType = mimeType;
    if (messageType === "image" && Number.isSafeInteger(data.fileSize) && Number(data.fileSize) >= 0) {
      metadataRedacted.fileSize = Number(data.fileSize);
    }

    const mediaBase64 = messageType === "image" && typeof data.mediaBase64 === "string"
      ? data.mediaBase64
      : undefined;
    const normalizedText = boundedString(data.text, MAX_BODY_LENGTH) ?? "";
    const linkCode = !data.fromMe && messageType === "text" && /^[0-9]{6}$/.test(normalizedText)
      ? normalizedText
      : undefined;
    return {
      kind: "message_upsert",
      instanceName,
      providerMessageId,
      phoneE164,
      direction: data.fromMe ? "outbound" : "inbound",
      messageType,
      bodyRedacted: linkCode ? "[link-code]" : normalizedText,
      metadataRedacted,
      ...(mediaBase64 === undefined ? {} : { mediaBase64 }),
      ...(linkCode === undefined ? {} : { linkCode }),
      occurredAt,
    };
  }

  if (envelope.event === "messages.update") {
    const providerMessageId = boundedString(data.providerMessageId, MAX_ID_LENGTH);
    const phoneE164 = phoneE164FromBridgeJids(data.remoteJid, data.remoteJidAlt);
    const allowedStatuses: MessageStatus[] = ["received", "queued", "processing", "sent", "delivered", "read", "failed"];
    const status = typeof data.status === "string" && allowedStatuses.includes(data.status as MessageStatus)
      ? (data.status as MessageStatus)
      : null;
    return providerMessageId && phoneE164 && status
      ? { kind: "message_update", instanceName, providerMessageId, phoneE164, status, occurredAt }
      : { kind: "invalid" };
  }

  if (envelope.event === "connection.update") {
    const state = boundedString(data.state, 32);
    if (!state) return { kind: "invalid" };
    const result: Extract<NormalizedBridgeEvent, { kind: "connection_update" }> = {
      kind: "connection_update",
      instanceName,
      state,
      occurredAt,
    };
    if (Number.isSafeInteger(data.statusReason)) result.statusReason = Number(data.statusReason);
    return result;
  }

  const count = Number.isSafeInteger(data.count) && Number(data.count) >= 0 ? Number(data.count) : undefined;
  return { kind: "qr_update", instanceName, ...(count === undefined ? {} : { count }), occurredAt };
}

export function deriveMessageIdempotencyKey(
  connectionId: string,
  provider: string,
  providerMessageId: string,
): string {
  return `${provider}:${connectionId}:${providerMessageId}`;
}
