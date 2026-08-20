import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateRetryDelayMs,
  createProviderReceipt,
  createEvolutionSendRequest,
  parseProcessMessageJob,
  parseSendMessageJob,
} from "../src/jobs.js";

test("retry delay is exponential, jittered and bounded", () => {
  assert.equal(calculateRetryDelayMs(1, { baseMs: 1_000, maxMs: 8_000, random: () => 0 }), 800);
  assert.equal(calculateRetryDelayMs(2, { baseMs: 1_000, maxMs: 8_000, random: () => 0.5 }), 2_000);
  assert.equal(calculateRetryDelayMs(10, { baseMs: 1_000, maxMs: 8_000, random: () => 1 }), 8_000);
});

test("validates outbound send_message jobs", () => {
  const job = parseSendMessageJob({
    id: 42,
    job_type: "send_message",
    locked_at: "2026-08-14T12:00:00.000Z",
    attempts: 1,
    max_attempts: 5,
    payload: {
      instance: "organizze-space-123",
      phone_e164: "+351911111111",
      text: "Registado com sucesso",
      report_id: "6fdd1351-dc04-4c52-bb95-1fd09c6c7b48",
    },
  }, { instancePrefix: "organizze-" });

  assert.equal(job.id, 42);
  assert.equal(job.lockedAt, "2026-08-14T12:00:00.000Z");
  assert.equal(job.payload.phoneE164, "+351911111111");
  assert.equal(job.reportId, "6fdd1351-dc04-4c52-bb95-1fd09c6c7b48");
  assert.throws(() => parseSendMessageJob(
    { id: 1, job_type: "campaign", payload: {} },
    { instancePrefix: "organizze-" },
  ), /unsupported/i);
  assert.throws(() => parseSendMessageJob({
    id: 1,
    job_type: "send_message",
    locked_at: "2026-08-14T12:00:00.000Z",
    payload: { instance: "x", phone_e164: "911", text: "hello" },
  }, { instancePrefix: "organizze-" }), /prefix/i);
  assert.throws(() => parseSendMessageJob({
    id: 1,
    job_type: "send_message",
    locked_at: "2026-08-14T12:00:00.000Z",
    payload: { instance: "foreign-space", phone_e164: "+351911111111", text: "hello" },
  }, { instancePrefix: "organizze-" }), /prefix/i);
  assert.throws(() => parseSendMessageJob({
    id: 1,
    job_type: "send_message",
    locked_at: "not-a-timestamp",
    payload: { instance: "organizze-space", phone_e164: "+351911111111", text: "hello" },
  }, { instancePrefix: "organizze-" }), /locked_at/i);
});

test("parses an accepted job without requiring phone or text", () => {
  const job = parseSendMessageJob({
    id: 42,
    job_type: "send_message",
    status: "processing",
    locked_at: "2026-08-14T12:00:00.000Z",
    attempts: 2,
    max_attempts: 5,
    payload: {
      instance: "organizze-space-123",
      delivery_state: "accepted",
      provider_message_id_hash: `sha256:${"a".repeat(64)}`,
      provider_accepted_at: "2026-08-14T12:00:00.000Z",
      report_id: "6fdd1351-dc04-4c52-bb95-1fd09c6c7b48",
    },
  }, { instancePrefix: "organizze-" });

  assert.equal(job.accepted, true);
  assert.equal(job.lockedAt, "2026-08-14T12:00:00.000Z");
  assert.equal(job.reportId, "6fdd1351-dc04-4c52-bb95-1fd09c6c7b48");
  assert.equal("phoneE164" in job.payload, false);
  assert.equal("text" in job.payload, false);
});

test("creates a redacted provider receipt", () => {
  const receipt = createProviderReceipt(
    { key: { id: "raw-provider-message-id" } },
    new Date("2026-08-14T12:00:00.000Z"),
  );

  assert.match(receipt.providerMessageIdHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(receipt.acceptedAt, "2026-08-14T12:00:00.000Z");
  assert.equal(JSON.stringify(receipt).includes("raw-provider-message-id"), false);
});

test("validates process_message jobs without propagating provider payload", () => {
  const job = parseProcessMessageJob({
    id: 77,
    job_type: "process_message",
    message_id: 901,
    space_id: "4f756b52-93c8-4a23-96c4-8be4b6678db0",
    locked_at: "2026-08-14T12:00:00.000Z",
    locked_by: "worker-1",
    attempts: 1,
    max_attempts: 5,
    payload: {
      connectionId: "private-connection",
      providerMessageId: "private-provider-message",
      text: "private-message-content",
      phone: "+351911111111",
    },
  }, { workerId: "worker-1" });

  assert.deepEqual(job, {
    id: 77,
    messageId: 901,
    spaceId: "4f756b52-93c8-4a23-96c4-8be4b6678db0",
    lockedAt: "2026-08-14T12:00:00.000Z",
    attempts: 1,
    maxAttempts: 5,
  });
  const serialized = JSON.stringify(job);
  assert.equal(serialized.includes("private-provider-message"), false);
  assert.equal(serialized.includes("private-message-content"), false);
  assert.equal(serialized.includes("+351911111111"), false);
});

test("rejects malformed or foreign process_message leases", () => {
  const base = {
    id: 77,
    job_type: "process_message",
    message_id: 901,
    space_id: "4f756b52-93c8-4a23-96c4-8be4b6678db0",
    locked_at: "2026-08-14T12:00:00.000Z",
    locked_by: "worker-2",
  };
  assert.throws(() => parseProcessMessageJob(base, { workerId: "worker-1" }), /locked_by/i);
  assert.throws(() => parseProcessMessageJob({ ...base, locked_by: "worker-1", message_id: 0 }, { workerId: "worker-1" }), /message_id/i);
  assert.throws(() => parseProcessMessageJob({ ...base, locked_by: "worker-1", space_id: "not-uuid" }, { workerId: "worker-1" }), /space_id/i);
});

test("builds the Evolution sendText request without leaking the API key into the body", () => {
  const request = createEvolutionSendRequest({
    baseUrl: "http://evolution:8080",
    apiKey: "test-api-key",
    instance: "organizze-space-123",
    phoneE164: "+351911111111",
    text: "Registado com sucesso",
  });

  assert.equal(request.url, "http://evolution:8080/message/sendText/organizze-space-123");
  assert.deepEqual(request.options, {
    method: "POST",
    headers: { apikey: "test-api-key", "content-type": "application/json" },
    body: JSON.stringify({ number: "351911111111", text: "Registado com sucesso" }),
    signal: undefined,
  });
  assert.equal(request.options.body.includes("test-api-key"), false);
});
