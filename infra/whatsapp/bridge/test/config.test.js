import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../src/config.js";

const required = {
  EVOLUTION_API_KEY: "test-evolution-key",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  WHATSAPP_BRIDGE_SECRET: "test-bridge-secret",
};

test("webhook defaults accommodate an 8.5 MiB request with a 12 MiB hard cap", () => {
  assert.equal(loadConfig(required).maxWebhookBytes, 8_912_896);
  assert.equal(loadConfig({ ...required, MAX_WEBHOOK_BYTES: "12582912" }).maxWebhookBytes, 12_582_912);
  assert.throws(
    () => loadConfig({ ...required, MAX_WEBHOOK_BYTES: "12582913" }),
    /MAX_WEBHOOK_BYTES/,
  );
});

test("media decoded-size limit is configurable and bounded", () => {
  assert.equal(loadConfig(required).maxMediaBytes, 6_291_456);
  assert.equal(loadConfig({ ...required, MAX_MEDIA_BYTES: "8388608" }).maxMediaBytes, 8_388_608);
  assert.throws(() => loadConfig({ ...required, MAX_MEDIA_BYTES: "8388609" }), /MAX_MEDIA_BYTES/);
});

test("monthly report enqueue interval defaults to one hour and is bounded", () => {
  assert.equal(loadConfig(required).reportEnqueueIntervalMs, 3_600_000);
  assert.equal(
    loadConfig({ ...required, REPORT_ENQUEUE_INTERVAL_MS: "60000" }).reportEnqueueIntervalMs,
    60_000,
  );
  assert.equal(
    loadConfig({ ...required, REPORT_ENQUEUE_INTERVAL_MS: "86400000" }).reportEnqueueIntervalMs,
    86_400_000,
  );
  assert.throws(
    () => loadConfig({ ...required, REPORT_ENQUEUE_INTERVAL_MS: "59999" }),
    /REPORT_ENQUEUE_INTERVAL_MS/,
  );
});
