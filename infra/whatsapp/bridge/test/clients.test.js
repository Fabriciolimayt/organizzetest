import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { createClients, LeaseLostError } from "../src/clients.js";

const config = {
  supabaseUrl: "https://project.supabase.co",
  supabaseServiceRoleKey: "test-service-role",
  workerId: "worker-1",
  bridgeSecret: "test-bridge-secret",
  requestTimeoutMs: 1_000,
};

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

test("job PATCH requires the active worker lease and exactly one returned row", async () => {
  let request;
  const clients = createClients(config, async (url, options) => {
    request = { url, options };
    return response([{ id: 42, status: "completed" }]);
  });

  const updated = await clients.updateJob(
    42,
    "2026-08-14T12:00:00.000Z",
    { status: "completed" },
  );

  assert.equal(
    request.url,
    "https://project.supabase.co/rest/v1/whatsapp_jobs?id=eq.42&status=eq.processing&locked_by=eq.worker-1&locked_at=eq.2026-08-14T12%3A00%3A00.000Z",
  );
  assert.equal(request.options.headers.prefer, "return=representation");
  assert.equal(updated.id, 42);
});

test("job PATCH rejects a missing or ambiguous lease row", async () => {
  for (const body of [[], [{ id: 42 }, { id: 42 }]]) {
    const clients = createClients(config, async () => response(body));
    await assert.rejects(
      clients.updateJob(42, "2026-08-14T12:00:00.000Z", { status: "completed" }),
      (error) => error instanceof LeaseLostError,
    );
  }
});

test("processMessage sends only a minimal HMAC-signed request", async () => {
  let request;
  const clients = createClients(config, async (url, options) => {
    request = { url, options };
    return response({ completed: true }, 200);
  });
  const job = {
    id: 77,
    lockedAt: "2026-08-14T12:00:00.000Z",
    messageId: 901,
    spaceId: "4f756b52-93c8-4a23-96c4-8be4b6678db0",
  };

  await clients.processMessage(job);

  const body = JSON.stringify({
    jobId: 77,
    lockedAt: "2026-08-14T12:00:00.000Z",
    workerId: "worker-1",
  });
  assert.equal(request.url, "https://project.supabase.co/functions/v1/whatsapp-process");
  assert.equal(request.options.body, body);
  assert.equal(request.options.headers["content-type"], "application/json");
  const timestamp = request.options.headers["x-organizze-timestamp"];
  const expected = createHmac("sha256", config.bridgeSecret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  assert.equal(request.options.headers["x-organizze-signature"], `sha256=${expected}`);
  const serialized = JSON.stringify(request);
  assert.equal(serialized.includes("messageId"), false);
  assert.equal(serialized.includes("spaceId"), false);
  assert.equal(serialized.includes("phone"), false);
  assert.equal(serialized.includes("text"), false);
});

test("image media is covered by the signed ingest envelope", async () => {
  let request;
  const clients = createClients(config, async (url, options) => {
    request = { url, options };
    return response({ accepted: true }, 202);
  });
  const mediaBase64 = "data:image/jpeg;base64,aGVsbG8=";

  await clients.forwardWebhook({
    event: "messages.upsert",
    instance: "organizze-space-1",
    receivedAt: "2026-08-14T12:00:00.000Z",
    data: { messageType: "image", mediaBase64 },
  });

  assert.equal(request.url, "https://project.supabase.co/functions/v1/whatsapp-ingest");
  assert.equal(JSON.parse(request.options.body).data.mediaBase64, mediaBase64);
  const timestamp = request.options.headers["x-organizze-timestamp"];
  const expected = createHmac("sha256", config.bridgeSecret)
    .update(`${timestamp}.${request.options.body}`)
    .digest("hex");
  assert.equal(request.options.headers["x-organizze-signature"], `sha256=${expected}`);
});

test("monthly report RPCs use app_v2 with testable reference time", async () => {
  const requests = [];
  const clients = createClients(config, async (url, options) => {
    requests.push({ url, options });
    return response([{ id: "result" }], 200);
  });

  await clients.enqueueMonthlyReports("2026-08-25T09:00:00.000Z");
  await clients.markReportSent("6fdd1351-dc04-4c52-bb95-1fd09c6c7b48");

  assert.equal(
    requests[0].url,
    "https://project.supabase.co/rest/v1/rpc/enqueue_whatsapp_monthly_reports",
  );
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    reference_time: "2026-08-25T09:00:00.000Z",
  });
  assert.equal(requests[0].options.headers["content-profile"], "app_v2");
  assert.equal(
    requests[1].url,
    "https://project.supabase.co/rest/v1/rpc/mark_whatsapp_monthly_report_sent",
  );
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    report_id: "6fdd1351-dc04-4c52-bb95-1fd09c6c7b48",
  });
});
