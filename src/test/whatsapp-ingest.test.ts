import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  deriveMessageIdempotencyKey,
  deriveWebhookEventKey,
  decodeImageMedia,
  connectionEventOrderFilter,
  phoneE164FromRemoteJid,
  uniqueSpaceIds,
  exceedsWebhookBodyLimit,
  ensureInboundProcessJob,
  normalizeBridgeEnvelope,
  readLimitedWebhookBody,
  verifyBridgeSignature,
} from "../../supabase/functions/_shared/whatsapp-ingest.ts";

const timestamp = 1_786_708_800;
const nowSeconds = timestamp + 120;
const secret = "test-only-secret";
const rawBody =
  '{"event":"messages.upsert","instance":"organizze-space-1","receivedAt":"2026-08-14T12:00:00.000Z","data":{"providerMessageId":"msg-1","remoteJid":"351911111111@s.whatsapp.net","fromMe":false,"messageType":"text","text":"Almoco 12.34","occurredAt":"2026-08-14T12:00:00.000Z"}}';
const knownSignature =
  "sha256=4a9e585cddb44076d51a53b3ff6fa0e3581843822db23d8623412985fe85bdc7";

describe("bridge HMAC verification", () => {
  it("accepts the known Node bridge signature vector", async () => {
    await expect(
      verifyBridgeSignature({
        rawBody,
        secret,
        timestampHeader: String(timestamp),
        signatureHeader: knownSignature,
        nowSeconds,
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("rejects a bad signature", async () => {
    await expect(
      verifyBridgeSignature({
        rawBody,
        secret,
        timestampHeader: String(timestamp),
        signatureHeader: `sha256=${"0".repeat(64)}`,
        nowSeconds,
      }),
    ).resolves.toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects timestamps outside the five-minute window", async () => {
    await expect(
      verifyBridgeSignature({
        rawBody,
        secret,
        timestampHeader: String(timestamp),
        signatureHeader: knownSignature,
        nowSeconds: timestamp + 301,
      }),
    ).resolves.toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("rejects malformed lowercase hex before comparison", async () => {
    await expect(
      verifyBridgeSignature({
        rawBody,
        secret,
        timestampHeader: String(timestamp),
        signatureHeader: `sha256=${"A".repeat(64)}`,
        nowSeconds,
      }),
    ).resolves.toEqual({ ok: false, reason: "malformed_signature" });
  });
});

describe("normalized bridge envelopes", () => {
  it("normalizes an inbound text and truncates its redacted body", () => {
    const result = normalizeBridgeEnvelope({
      event: "messages.upsert",
      instance: "organizze-space-1",
      receivedAt: "2026-08-14T12:00:00.000Z",
      data: {
        providerMessageId: "msg-1",
        remoteJid: "351911111111@s.whatsapp.net",
        fromMe: false,
        messageType: "text",
        text: `  Cafe\u0000 ${"x".repeat(4_100)}  `,
        occurredAt: "2026-08-14T11:59:00.000Z",
        apiKey: "must-not-survive",
      },
    });

    expect(result).toMatchObject({
      kind: "message_upsert",
      instanceName: "organizze-space-1",
      providerMessageId: "msg-1",
      direction: "inbound",
      phoneE164: "+351911111111",
      messageType: "text",
      occurredAt: "2026-08-14T11:59:00.000Z",
    });
    expect(result.kind === "message_upsert" && result.bodyRedacted.length).toBe(4_000);
    expect(JSON.stringify(result)).not.toContain("must-not-survive");
    expect(JSON.stringify(result)).not.toContain("@s.whatsapp.net");
    expect(JSON.stringify(result)).not.toContain("\u0000");
  });

  it("normalizes image metadata and keeps media only in the transient field", () => {
    const result = normalizeBridgeEnvelope({
      event: "messages.upsert",
      instance: "organizze-space-1",
      receivedAt: "2026-08-14T12:00:00.000Z",
      data: {
        providerMessageId: "img-1",
        remoteJid: "351922222222@s.whatsapp.net",
        fromMe: false,
        messageType: "image",
        text: "Recibo",
        mimeType: "image/jpeg",
        fileSize: 2_048,
        url: "https://private.invalid/media",
        mediaBase64: "aGVsbG8=",
        qrcode: "private-qr",
      },
    });

    expect(result).toMatchObject({
      kind: "message_upsert",
      messageType: "image",
      phoneE164: "+351922222222",
      bodyRedacted: "Recibo",
      metadataRedacted: { mimeType: "image/jpeg", fileSize: 2_048 },
      mediaBase64: "aGVsbG8=",
    });
    expect(JSON.stringify(result)).not.toMatch(/private.invalid|private-qr|remoteJid/i);
  });

  it("normalizes message status without accepting arbitrary status values", () => {
    expect(
      normalizeBridgeEnvelope({
        event: "messages.update",
        instance: "organizze-space-1",
        receivedAt: "2026-08-14T12:01:00.000Z",
        data: { providerMessageId: "msg-1", status: "delivered", remoteJid: "351911111111@s.whatsapp.net" },
      }),
    ).toEqual({
      kind: "message_update",
      instanceName: "organizze-space-1",
      providerMessageId: "msg-1",
      phoneE164: "+351911111111",
      status: "delivered",
      occurredAt: "2026-08-14T12:01:00.000Z",
    });
  });

  it("redacts connection diagnostics and never returns QR payloads", () => {
    expect(
      normalizeBridgeEnvelope({
        event: "connection.update",
        instance: "organizze-space-1",
        receivedAt: "2026-08-14T12:02:00.000Z",
        data: { state: "open", statusReason: 200, token: "private-token" },
      }),
    ).toEqual({
      kind: "connection_update",
      instanceName: "organizze-space-1",
      state: "open",
      statusReason: 200,
      occurredAt: "2026-08-14T12:02:00.000Z",
    });

    expect(
      normalizeBridgeEnvelope({
        event: "qrcode.updated",
        instance: "organizze-space-1",
        receivedAt: "2026-08-14T12:03:00.000Z",
        data: { count: 3, code: "private-code", base64: "private-qr" },
      }),
    ).toEqual({
      kind: "qr_update",
      instanceName: "organizze-space-1",
      count: 3,
      occurredAt: "2026-08-14T12:03:00.000Z",
    });
  });

  it("marks unsupported events without retaining their payload", () => {
    expect(
      normalizeBridgeEnvelope({
        event: "presence.update",
        instance: "organizzze-space-1",
        data: { secret: "must-not-survive" },
      }),
    ).toEqual({ kind: "unsupported" });
  });

  it("accepts only safely mappable individual WhatsApp JIDs", () => {
    expect(phoneE164FromRemoteJid("351911111111@s.whatsapp.net")).toBe("+351911111111");
    expect(phoneE164FromRemoteJid("351911111111:12@s.whatsapp.net")).toBe("+351911111111");
    expect(phoneE164FromRemoteJid("351911111111@c.us")).toBe("+351911111111");
    for (const jid of [
      "120363000000@g.us",
      "status@broadcast",
      "351911111111@lid",
      "0@s.whatsapp.net",
      "private",
    ]) {
      expect(phoneE164FromRemoteJid(jid)).toBeNull();
    }
  });

  it("uses a trusted phone alternate when bridge events carry modern LID JIDs", () => {
    expect(normalizeBridgeEnvelope({
      event: "messages.upsert",
      instance: "organizze-bot",
      receivedAt: "2026-08-14T12:00:00.000Z",
      data: {
        providerMessageId: "lid-1",
        remoteJid: "17478523958123@lid",
        remoteJidAlt: "351911111111@s.whatsapp.net",
        fromMe: false,
        messageType: "text",
        text: "Cafe 2.50",
      },
    })).toMatchObject({
      kind: "message_upsert",
      phoneE164: "+351911111111",
    });

    expect(normalizeBridgeEnvelope({
      event: "messages.update",
      instance: "organizze-bot",
      receivedAt: "2026-08-14T12:01:00.000Z",
      data: {
        providerMessageId: "lid-update-1",
        remoteJid: "17478523958123@lid",
        remoteJidAlt: "5511987654321:42@c.us",
        status: "read",
      },
    })).toMatchObject({
      kind: "message_update",
      phoneE164: "+5511987654321",
      status: "read",
    });
  });

  it("rejects LID JIDs without a reliable phone alternate", () => {
    for (const remoteJidAlt of [undefined, "17478523958123@lid", "status@broadcast"]) {
      expect(normalizeBridgeEnvelope({
        event: "messages.upsert",
        instance: "organizze-bot",
        receivedAt: "2026-08-14T12:00:00.000Z",
        data: {
          providerMessageId: "lid-without-phone",
          remoteJid: "17478523958123@lid",
          remoteJidAlt,
          fromMe: false,
          messageType: "text",
          text: "Cafe 2.50",
        },
      })).toEqual({ kind: "invalid" });
    }
  });

  it("redacts an inbound six-digit link code while keeping it transient", () => {
    expect(normalizeBridgeEnvelope({
      event: "messages.upsert",
      instance: "shared-instance",
      receivedAt: "2026-08-14T12:00:00.000Z",
      data: {
        providerMessageId: "link-1",
        remoteJid: "351911111111@s.whatsapp.net",
        fromMe: false,
        messageType: "text",
        text: "123456",
      },
    })).toMatchObject({
      kind: "message_upsert",
      phoneE164: "+351911111111",
      bodyRedacted: "[link-code]",
      linkCode: "123456",
    });
  });
});

it("derives message idempotency from provider, connection and message identity", () => {
  expect(deriveMessageIdempotencyKey("connection-1", "evolution", "msg-1")).toBe(
    "evolution:connection-1:msg-1",
  );
  expect(deriveMessageIdempotencyKey("connection-2", "evolution", "msg-1")).not.toBe(
    deriveMessageIdempotencyKey("connection-1", "evolution", "msg-1"),
  );
});

describe("ingest resource and recovery guarantees", () => {
  it("fast-rejects bodies above the global 8.5 MiB cap", () => {
    expect(exceedsWebhookBodyLimit("8912897")).toBe(true);
    expect(exceedsWebhookBodyLimit("8912896")).toBe(false);
  });

  it("reads a chunked UTF-8 body without splitting multibyte characters", async () => {
    const encoded = new TextEncoder().encode("{\"text\":\"café\"}");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded.slice(0, encoded.length - 2));
        controller.enqueue(encoded.slice(encoded.length - 2));
        controller.close();
      },
    });

    await expect(readLimitedWebhookBody(stream, 65_536)).resolves.toEqual({
      ok: true,
      rawBody: "{\"text\":\"café\"}",
    });
  });

  it("cancels a chunked request as soon as it exceeds the byte cap", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(40_000));
        controller.enqueue(new Uint8Array(30_000));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(readLimitedWebhookBody(stream, 65_536)).resolves.toEqual({ ok: false, reason: "payload_too_large" });
    expect(cancelled).toBe(true);
  });

  it("recovers a duplicate message and always ensures its process job", async () => {
    const calls: string[] = [];
    const messageId = await ensureInboundProcessJob(
      {
        async insertMessage() {
          calls.push("insert_message");
          return { kind: "duplicate" };
        },
        async findMessage() {
          calls.push("find_message");
          return { id: 42 };
        },
        async repairBeforeJob(id) {
          calls.push(`repair_media:${id}`);
        },
        async upsertProcessJob(id) {
          calls.push(`upsert_job:${id}`);
        },
      },
      { connectionId: "connection-1", providerMessageId: "msg-1" },
    );

    expect(messageId).toBe(42);
    expect(calls).toEqual(["insert_message", "find_message", "repair_media:42", "upsert_job:42"]);
  });

  it("wires status updates through the monotonic service-role RPC", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/whatsapp-ingest/index.ts"),
      "utf8",
    );
    expect(source).toContain('.rpc("apply_whatsapp_message_status"');
    const statusBranch = source.slice(
      source.indexOf('if (event.kind === "message_update")'),
      source.indexOf("const details ="),
    );
    expect(statusBranch).not.toContain('.from("whatsapp_messages").update');
  });

  it("builds an atomic filter that rejects stale connection and QR events", () => {
    expect(connectionEventOrderFilter("2026-08-14T12:03:00.000Z")).toBe(
      "last_seen_at.is.null,last_seen_at.lt.2026-08-14T12:03:00.000Z",
    );
  });

  it("deduplicates spaces for shared-instance audit events", () => {
    expect(uniqueSpaceIds([
      { space_id: "space-1" },
      { space_id: "space-1" },
      { space_id: "space-2" },
    ])).toEqual(["space-1", "space-2"]);
  });

  it("derives a deterministic SHA-256 event key without retaining the body", async () => {
    await expect(deriveWebhookEventKey("event-body")).resolves.toBe(
      "0d2f68a6ac82102c7480127e283bff8245efd2541090aeb57c4bb21178e20b5f",
    );
  });

  it("validates and decodes temporary receipt media", () => {
    expect(decodeImageMedia("data:image/png;base64,aGVsbG8=", "image/png")).toEqual({
      ok: true,
      mimeType: "image/png",
      bytes: new Uint8Array([104, 101, 108, 108, 111]),
    });
    expect(decodeImageMedia("aGVsbG8=", "image/gif")).toEqual({ ok: false, reason: "invalid_media_type" });
    expect(decodeImageMedia("not-base64!", "image/jpeg")).toEqual({ ok: false, reason: "invalid_media_base64" });
  });

  it("wires outbound enrichment, event deduplication and private media repair", () => {
    const source = readFileSync(resolve(process.cwd(), "supabase/functions/whatsapp-ingest/index.ts"), "utf8");
    expect(source).toContain("event_key: eventKey");
    expect(source).toContain('.from("whatsapp_media").upsert');
    expect(source).toContain('.from("whatsapp-inbox").upload');
    expect(source).toContain("expires_at:");
    const outboundInsert = source.lastIndexOf('direction: "outbound"');
    const duplicateStart = source.indexOf('if (error?.code === "23505")', outboundInsert);
    const enrichment = source.slice(duplicateStart, source.indexOf('} else if (error)', duplicateStart));
    expect(enrichment).toContain('.from("whatsapp_messages").update');
    expect(enrichment).toContain("message_type:");
    expect(enrichment).toContain("sent_at:");
    expect(enrichment).not.toContain("status:");
  });

  it("looks messages up by shared instance and sender phone", () => {
    const source = readFileSync(resolve(process.cwd(), "supabase/functions/whatsapp-ingest/index.ts"), "utf8");
    const firstLookup = source.indexOf('const { data: connections');
    const secondLookup = source.indexOf('const { data: connections', firstLookup + 1);
    const messageLookup = source.slice(secondLookup, source.indexOf('if (event.kind === "message_update"'));
    expect(messageLookup).toContain('.eq("instance_name", event.instanceName)');
    expect(messageLookup).toContain('.eq("phone_e164", event.phoneE164)');
    expect(messageLookup).toContain('.in("status", ["active", "pending"])');
    expect(messageLookup).toContain("connections.length !== 1");
    expect(source).toContain("connection.status !== \"active\"");
    expect(source).toContain("!connection.verified_at");
  });

  it("consumes link codes without creating an expense-processing job", () => {
    const source = readFileSync(resolve(process.cwd(), "supabase/functions/whatsapp-ingest/index.ts"), "utf8");
    const linkBranch = source.slice(source.indexOf("if (event.linkCode)"), source.indexOf("const decodedMedia"));
    expect(linkBranch).toContain('.rpc("consume_whatsapp_link"');
    expect(linkBranch).toContain('job_type: "send_message"');
    expect(linkBranch).not.toContain('job_type: "process_message"');
    const sendPayload = linkBranch.slice(linkBranch.indexOf("payload: {"), linkBranch.indexOf("},", linkBranch.indexOf("payload: {")));
    expect(sendPayload).not.toContain("linkCode");
    expect(source).toContain('body_redacted: event.linkCode ? "[link-code]"');
  });

  it("updates every shared-instance connection without changing link status", () => {
    const source = readFileSync(resolve(process.cwd(), "supabase/functions/whatsapp-ingest/index.ts"), "utf8");
    const globalStart = source.indexOf('if (event.kind === "connection_update"');
    const firstGlobalLookup = source.indexOf('const { data: connections', globalStart);
    const globalEnd = source.indexOf('const { data: connections', firstGlobalLookup + 1);
    const globalBranch = source.slice(globalStart, globalEnd);
    expect(globalBranch).toContain('.eq("instance_name", event.instanceName)');
    expect(globalBranch).toContain("uniqueSpaceIds(connections)");
    expect(globalBranch).not.toContain("status:");
    expect(globalBranch).not.toContain("verified_at");
  });
});
