import assert from "node:assert/strict";
import test from "node:test";

import { createInstanceRequest, validateInstanceName } from "../src/provision.js";

test("builds a Baileys instance request with webhook base64 enabled", () => {
  const request = createInstanceRequest({
    baseUrl: "http://evolution:8080",
    apiKey: "test-api-key",
    instanceName: "organizze-space-123",
    instancePrefix: "organizze-",
    webhookUrl: "http://bridge:3000/webhooks/evolution",
  });

  assert.equal(request.url, "http://evolution:8080/instance/create");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), {
    instanceName: "organizze-space-123",
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    webhook: {
      enabled: true,
      url: "http://bridge:3000/webhooks/evolution",
      events: [
        "QRCODE_UPDATED",
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "CONNECTION_UPDATE",
      ],
      base64: true,
    },
  });
  assert.equal(request.options.headers.apikey, "test-api-key");
});

test("provisioning rejects names outside the configured prefix", () => {
  assert.equal(validateInstanceName("organizze-space-123", "organizze-"), "organizze-space-123");
  assert.throws(() => validateInstanceName("foreign-space", "organizze-"), /prefix/i);
  assert.throws(() => validateInstanceName("organizze-invalid name", "organizze-"), /invalid/i);
});
