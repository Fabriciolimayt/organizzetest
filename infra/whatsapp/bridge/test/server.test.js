import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";

import { createBridgeRequestHandler } from "../src/server.js";

async function request(handler, { method = "GET", url = "/", headers = {}, body = "" } = {}) {
  const incoming = Readable.from(body ? [Buffer.from(body)] : []);
  Object.assign(incoming, { method, url, headers });
  const result = { statusCode: 0, headers: {}, body: "" };
  const response = {
    writeHead(statusCode, responseHeaders) {
      result.statusCode = statusCode;
      result.headers = responseHeaders;
    },
    end(responseBody = "") {
      result.body = String(responseBody);
    },
  };
  await handler(incoming, response);
  return { ...result, json: JSON.parse(result.body) };
}

test("health is dependency-neutral and unsupported events return 202", async () => {
  let forwards = 0;
  const handler = createBridgeRequestHandler(
    { maxWebhookBytes: 1_024, instancePrefix: "organizze-" },
    { forwardWebhook: async () => { forwards += 1; } },
  );
  const health = await request(handler, { method: "GET", url: "/health" });
  const unsupported = await request(handler, {
    method: "POST",
    url: "/webhooks/evolution",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event: "PRESENCE_UPDATE", instance: "organizze-space-1", data: {} }),
  });
  assert.equal(health.statusCode, 200);
  assert.deepEqual(health.json, { status: "ok" });
  assert.equal(unsupported.statusCode, 202);
  assert.equal(forwards, 0);
});

test("duplicate provider events are safely forwarded for downstream idempotency", async () => {
  const forwarded = [];
  const handler = createBridgeRequestHandler(
    { maxWebhookBytes: 4_096, instancePrefix: "organizze-" },
    { forwardWebhook: async (envelope) => { forwarded.push(envelope); } },
  );
  const payload = {
    event: "MESSAGES_UPSERT",
    instance: "organizze-space-1",
    data: {
      key: { id: "same-provider-id", remoteJid: "351911111111@s.whatsapp.net" },
      message: { conversation: "Despesa 10" },
    },
  };
  for (let index = 0; index < 2; index += 1) {
    const response = await request(handler, {
      method: "POST",
      url: "/webhooks/evolution",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(response.statusCode, 202);
  }
  assert.equal(forwarded.length, 2);
  assert.equal(forwarded[0].data.providerMessageId, "same-provider-id");
  assert.equal(forwarded[1].data.providerMessageId, "same-provider-id");
});

test("rejects unsupported content types and oversized requests", async () => {
  const handler = createBridgeRequestHandler(
    { maxWebhookBytes: 1_024, instancePrefix: "organizze-" },
    { forwardWebhook: async () => assert.fail("must not forward") },
  );
  const wrongType = await request(handler, {
    method: "POST",
    url: "/webhooks/evolution",
    body: "{}",
  });
  const maliciousType = await request(handler, {
    method: "POST",
    url: "/webhooks/evolution",
    headers: { "content-type": "application/json-malicious" },
    body: "{}",
  });
  const validParameterizedType = await request(handler, {
    method: "POST",
    url: "/webhooks/evolution",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ event: "PRESENCE_UPDATE", instance: "organizze-space-1", data: {} }),
  });
  const oversized = await request(handler, {
    method: "POST",
    url: "/webhooks/evolution",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(1_100) }),
  });
  assert.equal(wrongType.statusCode, 415);
  assert.equal(maliciousType.statusCode, 415);
  assert.equal(validParameterizedType.statusCode, 202);
  assert.equal(oversized.statusCode, 413);
});

test("forwards image base64 to ingest without exposing it in logs or response", async () => {
  const mediaBase64 = "data:image/jpeg;base64,aGVsbG8=";
  const forwarded = [];
  const logs = [];
  const originalInfo = console.info;
  console.info = (...values) => logs.push(values.join(" "));
  const handler = createBridgeRequestHandler(
    { maxWebhookBytes: 4_096, maxMediaBytes: 100, instancePrefix: "organizze-" },
    { forwardWebhook: async (envelope) => forwarded.push(envelope) },
  );
  try {
    const result = await request(handler, {
      method: "POST",
      url: "/webhooks/evolution",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "MESSAGES_UPSERT",
        instance: "organizze-space-1",
        data: {
          key: { id: "image-1", remoteJid: "351911111111@s.whatsapp.net" },
          message: { imageMessage: { mimetype: "image/jpeg", base64: mediaBase64 } },
        },
      }),
    });
    assert.equal(result.statusCode, 202);
    assert.equal(forwarded[0].data.mediaBase64, mediaBase64);
    assert.equal(result.body.includes(mediaBase64), false);
    assert.equal(logs.join(" ").includes(mediaBase64), false);
  } finally {
    console.info = originalInfo;
  }
});

test("rejects decoded image media above the configured limit", async () => {
  const handler = createBridgeRequestHandler(
    { maxWebhookBytes: 4_096, maxMediaBytes: 4, instancePrefix: "organizze-" },
    { forwardWebhook: async () => assert.fail("must not forward oversized media") },
  );
  const result = await request(handler, {
    method: "POST",
    url: "/webhooks/evolution",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event: "MESSAGES_UPSERT",
      instance: "organizze-space-1",
      data: {
        key: { id: "image-large", remoteJid: "351911111111@s.whatsapp.net" },
        message: { imageMessage: { mimetype: "image/jpeg", base64: "aGVsbG8=" } },
      },
    }),
  });

  assert.equal(result.statusCode, 413);
  assert.deepEqual(result.json, { error: "media_too_large" });
});
