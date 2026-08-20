import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEvolutionEvent } from "../src/normalize.js";

test("normalizes an inbound text message", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-space-123",
    date_time: "2026-08-14T12:00:00.000Z",
    data: {
      key: {
        id: "provider-message-1",
        remoteJid: "351911111111@s.whatsapp.net",
        fromMe: false,
      },
      message: { conversation: "Almoco 12.34" },
      messageTimestamp: 1_776_427_200,
    },
  });

  assert.deepEqual(envelope, {
    event: "messages.upsert",
    instance: "organizze-space-123",
    receivedAt: "2026-08-14T12:00:00.000Z",
    data: {
      providerMessageId: "provider-message-1",
      remoteJid: "351911111111@s.whatsapp.net",
      fromMe: false,
      messageType: "text",
      text: "Almoco 12.34",
      occurredAt: "2026-04-17T12:00:00.000Z",
    },
  });
});

test("normalizes image metadata without copying media or QR content", () => {
  const envelope = normalizeEvolutionEvent({
    event: "messages.upsert",
    instance: "organizze-space-123",
    data: {
      key: { id: "image-1", remoteJid: "351922222222@s.whatsapp.net" },
      message: {
        imageMessage: {
          caption: "Recibo",
          mimetype: "image/jpeg",
          fileLength: "2048",
          jpegThumbnail: "base64-private-media",
          url: "https://private.invalid/media",
        },
      },
    },
  }, new Date("2026-08-14T12:01:00.000Z"));

  assert.deepEqual(envelope.data, {
    providerMessageId: "image-1",
    remoteJid: "351922222222@s.whatsapp.net",
    fromMe: false,
    messageType: "image",
    text: "Recibo",
    mimeType: "image/jpeg",
    fileSize: 2048,
    occurredAt: "2026-08-14T12:01:00.000Z",
  });
  assert.equal(JSON.stringify(envelope).includes("base64-private-media"), false);
  assert.equal(JSON.stringify(envelope).includes("private.invalid"), false);
});

test("normalizes message status and connection events", () => {
  const status = normalizeEvolutionEvent({
    event: "MESSAGES_UPDATE",
    instance: "organizze-space-123",
    data: {
      key: { id: "provider-message-1", remoteJid: "351911111111@s.whatsapp.net", fromMe: true },
      status: "DELIVERY_ACK",
    },
  }, new Date("2026-08-14T12:02:00.000Z"));
  const connection = normalizeEvolutionEvent({
    event: "CONNECTION_UPDATE",
    instance: "organizze-space-123",
    data: { state: "open", statusReason: 200 },
  }, new Date("2026-08-14T12:03:00.000Z"));

  assert.equal(status.event, "messages.update");
  assert.equal(status.data.status, "delivered");
  assert.equal(connection.event, "connection.update");
  assert.deepEqual(connection.data, { state: "open", statusReason: 200 });
});

test("keeps an ordinary phone JID for inbound messages", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-bot",
    data: {
      key: {
        id: "phone-jid-1",
        remoteJid: "351911111111@s.whatsapp.net",
      },
      message: { conversation: "Cafe 2.50" },
    },
  });

  assert.equal(envelope.data.remoteJid, "351911111111@s.whatsapp.net");
});

test("uses a valid phone alternate when an inbound message has a LID", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-bot",
    data: {
      key: {
        id: "lid-with-alternate",
        remoteJid: "17478523958123@lid",
        remoteJidAlt: "351911111111@s.whatsapp.net",
      },
      message: { conversation: "Almoco 12.34" },
    },
  });

  assert.equal(envelope.data.remoteJid, "351911111111@s.whatsapp.net");
  assert.equal(JSON.stringify(envelope).includes("17478523958123@lid"), false);
});

test("ignores an inbound LID without a phone alternate", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-bot",
    data: {
      key: {
        id: "lid-without-alternate",
        remoteJid: "17478523958123@lid",
      },
      message: { conversation: "Almoco 12.34" },
    },
  });

  assert.equal(envelope, null);
});

test("ignores an inbound LID with an invalid alternate", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-bot",
    data: {
      key: {
        id: "lid-with-invalid-alternate",
        remoteJid: "17478523958123@lid",
        remoteJidAlt: "17478523958123@lid",
      },
      message: { conversation: "Almoco 12.34" },
    },
  });

  assert.equal(envelope, null);
});

test("uses a valid phone alternate for message updates with a LID", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPDATE",
    instance: "organizze-bot",
    data: {
      key: {
        id: "lid-update",
        remoteJid: "17478523958123@lid",
        remoteJidAlt: "351911111111@s.whatsapp.net",
        fromMe: true,
      },
      status: "READ",
    },
  });

  assert.deepEqual(envelope.data, {
    providerMessageId: "lid-update",
    remoteJid: "351911111111@s.whatsapp.net",
    fromMe: true,
    status: "read",
    occurredAt: envelope.receivedAt,
  });
});

test("accepts Business and Multi-Device phone JID suffixes", () => {
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-bot",
    data: {
      key: {
        id: "lid-business-device",
        remoteJid: "17478523958123@lid",
        remoteJidAlt: "5511987654321:42@c.us",
      },
      message: { conversation: "Mercado 25.00" },
    },
  });

  assert.equal(envelope.data.remoteJid, "5511987654321:42@c.us");
});

test("redacts QR values and ignores unsupported events", () => {
  const qr = normalizeEvolutionEvent({
    event: "QRCODE_UPDATED",
    instance: "organizze-space-123",
    data: { qrcode: { base64: "secret-qr", code: "private-code", count: 3 } },
  }, new Date("2026-08-14T12:04:00.000Z"));

  assert.deepEqual(qr.data, { count: 3 });
  assert.equal(JSON.stringify(qr).includes("secret-qr"), false);
  assert.equal(normalizeEvolutionEvent({ event: "PRESENCE_UPDATE", data: {} }), null);
  assert.equal(normalizeEvolutionEvent({ event: "messages.upsert", data: {} }), null);
});

test("forwards validated image base64 only in the normalized envelope", () => {
  const mediaBase64 = "data:image/jpeg;base64,aGVsbG8=";
  const envelope = normalizeEvolutionEvent({
    event: "MESSAGES_UPSERT",
    instance: "organizze-space-123",
    data: {
      key: { id: "image-with-media", remoteJid: "351922222222@s.whatsapp.net" },
      message: {
        imageMessage: {
          mimetype: "image/jpeg",
          fileLength: "5",
          base64: mediaBase64,
        },
      },
    },
  }, new Date("2026-08-14T12:05:00.000Z"), { maxMediaBytes: 10 });

  assert.equal(envelope.data.mediaBase64, mediaBase64);
});

test("rejects malformed and oversized image base64", () => {
  const payload = (base64) => ({
    event: "MESSAGES_UPSERT",
    instance: "organizze-space-123",
    data: {
      key: { id: "image-invalid", remoteJid: "351922222222@s.whatsapp.net" },
      message: { imageMessage: { mimetype: "image/jpeg", base64 } },
    },
  });

  assert.throws(
    () => normalizeEvolutionEvent(payload("not base64!"), new Date(), { maxMediaBytes: 10 }),
    /base64/i,
  );
  assert.throws(
    () => normalizeEvolutionEvent(payload(Buffer.alloc(11).toString("base64")), new Date(), { maxMediaBytes: 10 }),
    /large/i,
  );
});
