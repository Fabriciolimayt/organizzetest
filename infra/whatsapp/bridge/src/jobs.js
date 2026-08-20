import { createHash } from "node:crypto";

const E164 = /^\+[1-9][0-9]{7,14}$/;
const PROVIDER_HASH = /^sha256:[a-f0-9]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function calculateRetryDelayMs(attempt, options = {}) {
  const baseMs = options.baseMs ?? 2_000;
  const maxMs = options.maxMs ?? 300_000;
  const random = options.random ?? Math.random;
  const exponential = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  const jittered = exponential * (0.8 + Math.min(1, Math.max(0, random())) * 0.4);
  return Math.min(maxMs, Math.round(jittered));
}

export function parseSendMessageJob(raw, { instancePrefix } = {}) {
  if (!raw || raw.job_type !== "send_message") throw new TypeError("unsupported job type");
  if (!Number.isInteger(raw.id) || raw.id < 1) throw new TypeError("job id is invalid");
  if (typeof raw.locked_at !== "string" || Number.isNaN(Date.parse(raw.locked_at))) {
    throw new TypeError("locked_at must be a valid timestamp");
  }
  const payload = raw.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("job payload is invalid");
  if (typeof payload.instance !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.instance)) {
    throw new TypeError("instance is invalid");
  }
  if (typeof instancePrefix !== "string" || !instancePrefix || !payload.instance.startsWith(instancePrefix)) {
    throw new TypeError("instance does not match the configured prefix");
  }

  const common = {
    id: raw.id,
    lockedAt: raw.locked_at,
    attempts: Number.isInteger(raw.attempts) ? raw.attempts : 0,
    maxAttempts: Number.isInteger(raw.max_attempts) ? raw.max_attempts : 5,
  };
  if (payload.report_id != null) {
    if (typeof payload.report_id !== "string" || !UUID.test(payload.report_id)) {
      throw new TypeError("report_id must be a UUID");
    }
    common.reportId = payload.report_id;
  }

  if (payload.delivery_state === "accepted") {
    if (payload.provider_message_id_hash !== null && !PROVIDER_HASH.test(payload.provider_message_id_hash ?? "")) {
      throw new TypeError("provider receipt is invalid");
    }
    if (Number.isNaN(Date.parse(payload.provider_accepted_at))) {
      throw new TypeError("provider acceptance timestamp is invalid");
    }
    return {
      ...common,
      accepted: true,
      payload: {
        instance: payload.instance,
        deliveryState: "accepted",
        providerMessageIdHash: payload.provider_message_id_hash,
        providerAcceptedAt: payload.provider_accepted_at,
      },
    };
  }

  if (typeof payload.phone_e164 !== "string" || !E164.test(payload.phone_e164)) {
    throw new TypeError("phone must use E.164 format");
  }
  if (typeof payload.text !== "string" || payload.text.trim().length < 1 || payload.text.length > 4_000) {
    throw new TypeError("message text is invalid");
  }

  return {
    ...common,
    accepted: false,
    payload: {
      instance: payload.instance,
      phoneE164: payload.phone_e164,
      text: payload.text,
    },
  };
}

export function parseProcessMessageJob(raw, { workerId } = {}) {
  if (!raw || raw.job_type !== "process_message") throw new TypeError("unsupported job type");
  if (!Number.isInteger(raw.id) || raw.id < 1) throw new TypeError("job id is invalid");
  if (!Number.isInteger(raw.message_id) || raw.message_id < 1) {
    throw new TypeError("message_id must be a positive integer");
  }
  if (typeof raw.space_id !== "string" || !UUID.test(raw.space_id)) {
    throw new TypeError("space_id must be a UUID");
  }
  if (typeof raw.locked_at !== "string" || Number.isNaN(Date.parse(raw.locked_at))) {
    throw new TypeError("locked_at must be a valid timestamp");
  }
  if (raw.locked_by != null && raw.locked_by !== workerId) {
    throw new TypeError("locked_by does not match this worker");
  }

  return {
    id: raw.id,
    messageId: raw.message_id,
    spaceId: raw.space_id,
    lockedAt: raw.locked_at,
    attempts: Number.isInteger(raw.attempts) ? raw.attempts : 0,
    maxAttempts: Number.isInteger(raw.max_attempts) ? raw.max_attempts : 5,
  };
}

export function createProviderReceipt(response, now = new Date()) {
  const providerMessageId = response?.key?.id
    ?? response?.data?.key?.id
    ?? response?.messageId
    ?? response?.id;
  return {
    providerMessageIdHash: typeof providerMessageId === "string" && providerMessageId
      ? `sha256:${createHash("sha256").update(providerMessageId).digest("hex")}`
      : null,
    acceptedAt: now.toISOString(),
  };
}

export function createEvolutionSendRequest({ baseUrl, apiKey, instance, phoneE164, text, signal }) {
  if (!baseUrl || !apiKey) throw new TypeError("Evolution configuration is incomplete");
  return {
    url: `${baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(instance)}`,
    options: {
      method: "POST",
      headers: { apikey: apiKey, "content-type": "application/json" },
      body: JSON.stringify({ number: phoneE164.slice(1), text }),
      signal,
    },
  };
}
