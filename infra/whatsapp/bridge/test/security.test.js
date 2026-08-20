import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { createSignedHeaders } from "../src/signature.js";
import { createSafeLogMetadata } from "../src/safe-log.js";

test("creates a Task 2 compatible HMAC signature", () => {
  const body = JSON.stringify({ event: "messages.upsert", instance: "instance-1", data: {} });
  const secret = "test-only-secret";
  const timestamp = 1_723_636_800;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  assert.deepEqual(createSignedHeaders(body, secret, timestamp), {
    "content-type": "application/json",
    "x-organizze-timestamp": String(timestamp),
    "x-organizze-signature": `sha256=${expected}`,
  });
});

test("safe log metadata excludes sensitive payload fields", () => {
  const metadata = createSafeLogMetadata({
    event: "messages.upsert",
    instance: "organizze-space-123",
    data: {
      providerMessageId: "provider-message-1",
      remoteJid: "351911111111@s.whatsapp.net",
      text: "Conteudo privado",
      qrcode: "qr-private",
      apiKey: "api-private",
    },
  }, { outcome: "forwarded", statusCode: 202 });

  assert.deepEqual(metadata, {
    event: "messages.upsert",
    outcome: "forwarded",
    statusCode: 202,
    hasInstance: true,
    hasProviderMessageId: true,
  });
  const serialized = JSON.stringify(metadata);
  for (const secret of ["organizze-space-123", "351911111111", "Conteudo privado", "qr-private", "api-private"]) {
    assert.equal(serialized.includes(secret), false);
  }
});
