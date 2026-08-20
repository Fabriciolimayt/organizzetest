const EVENT_NAMES = new Map([
  ["MESSAGES_UPSERT", "messages.upsert"],
  ["MESSAGES_UPDATE", "messages.update"],
  ["CONNECTION_UPDATE", "connection.update"],
  ["QRCODE_UPDATED", "qrcode.updated"],
]);

const STATUS_NAMES = new Map([
  ["PENDING", "pending"],
  ["SERVER_ACK", "sent"],
  ["DELIVERY_ACK", "delivered"],
  ["READ", "read"],
  ["PLAYED", "read"],
  ["ERROR", "failed"],
]);

export class InvalidMediaError extends Error {
  constructor() {
    super("image base64 is invalid");
    this.name = "InvalidMediaError";
  }
}

export class MediaTooLargeError extends Error {
  constructor() {
    super("image media is too large");
    this.name = "MediaTooLargeError";
  }
}

function validatedImageBase64(value, maxMediaBytes) {
  if (value == null) return undefined;
  if (typeof value !== "string" || value.length === 0) throw new InvalidMediaError();

  const dataUri = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/i);
  const encoded = dataUri ? dataUri[2] : value;
  if (encoded.length % 4 !== 0
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new InvalidMediaError();
  }

  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const decodedBytes = (encoded.length / 4) * 3 - padding;
  if (decodedBytes > maxMediaBytes) throw new MediaTooLargeError();
  return value;
}

function canonicalEvent(value) {
  if (typeof value !== "string") return null;
  const upper = value.replaceAll(".", "_").replaceAll("-", "_").toUpperCase();
  return EVENT_NAMES.get(upper) ?? null;
}

function receivedAt(payload, now) {
  const candidate = payload.date_time ?? payload.datetime ?? payload.receivedAt;
  const parsed = typeof candidate === "string" ? new Date(candidate) : now;
  return Number.isNaN(parsed.getTime()) ? now.toISOString() : parsed.toISOString();
}

function eventData(payload) {
  return Array.isArray(payload.data) ? payload.data[0] : payload.data;
}

function occurredAt(data, fallback) {
  const raw = data?.messageTimestamp ?? data?.timestamp;
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    const millis = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
    return new Date(millis).toISOString();
  }
  return fallback;
}

function isPhoneJid(value) {
  return typeof value === "string"
    && /^[1-9][0-9]{0,14}(?::[0-9]+)?@(?:s\.whatsapp\.net|c\.us)$/i.test(value);
}

function normalizedRemoteJid(key) {
  const remoteJid = key?.remoteJid;
  if (typeof remoteJid !== "string" || remoteJid.length === 0) return null;
  if (!remoteJid.toLowerCase().endsWith("@lid")) return remoteJid;

  return isPhoneJid(key.remoteJidAlt) ? key.remoteJidAlt : null;
}

function normalizeMessage(payload, event, at, options) {
  const data = eventData(payload);
  const key = data?.key;
  const remoteJid = normalizedRemoteJid(key);
  if (!data || !key?.id || !remoteJid) return null;

  if (event === "messages.update") {
    return {
      providerMessageId: String(key.id),
      remoteJid,
      fromMe: Boolean(key.fromMe),
      status: STATUS_NAMES.get(String(data.status ?? data.update?.status).toUpperCase()) ?? "pending",
      occurredAt: occurredAt(data, at),
    };
  }

  const message = data.message ?? {};
  const image = message.imageMessage;
  const extended = message.extendedTextMessage;
  const text = message.conversation ?? extended?.text ?? image?.caption;
  const normalized = {
    providerMessageId: String(key.id),
    remoteJid,
    fromMe: Boolean(key.fromMe),
    messageType: image ? "image" : "text",
  };
  if (typeof text === "string" && text.length > 0) normalized.text = text.slice(0, 4_000);
  if (image?.mimetype) normalized.mimeType = String(image.mimetype).slice(0, 128);
  const fileSize = Number(image?.fileLength);
  if (Number.isSafeInteger(fileSize) && fileSize >= 0) normalized.fileSize = fileSize;
  if (image) {
    const mediaBase64 = validatedImageBase64(
      image.base64 ?? data.base64 ?? message.base64,
      options.maxMediaBytes,
    );
    if (mediaBase64) normalized.mediaBase64 = mediaBase64;
  }
  normalized.occurredAt = occurredAt(data, at);
  return normalized;
}

export function normalizeEvolutionEvent(payload, now = new Date(), options = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const event = canonicalEvent(payload.event);
  const instance = payload.instance ?? payload.instanceName;
  if (!event || typeof instance !== "string" || instance.length < 1 || instance.length > 128) return null;

  const at = receivedAt(payload, now);
  let data;
  if (event.startsWith("messages.")) {
    data = normalizeMessage(payload, event, at, {
      maxMediaBytes: options.maxMediaBytes ?? 6_291_456,
    });
  } else if (event === "connection.update") {
    const raw = eventData(payload);
    if (!raw || typeof raw !== "object") return null;
    data = {
      state: String(raw.state ?? raw.status ?? "unknown").slice(0, 32),
    };
    const reason = Number(raw.statusReason ?? raw.statusCode);
    if (Number.isInteger(reason)) data.statusReason = reason;
  } else {
    const raw = eventData(payload);
    const count = Number(raw?.qrcode?.count ?? raw?.count);
    data = Number.isInteger(count) && count >= 0 ? { count } : {};
  }
  if (!data) return null;

  return { event, instance, receivedAt: at, data };
}
