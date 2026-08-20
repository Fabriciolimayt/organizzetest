import assert from "node:assert/strict";
import test from "node:test";

import { LeaseLostError } from "../src/clients.js";
import { createJobWorker } from "../src/worker.js";

const config = {
  instancePrefix: "organizze-",
  retryBaseMs: 1_000,
  retryMaxMs: 8_000,
  pollIntervalMs: 60_000,
};

function rawJob(overrides = {}) {
  return {
    id: 42,
    job_type: "send_message",
    status: "processing",
    locked_at: "2026-08-14T12:00:00.000Z",
    attempts: 1,
    max_attempts: 5,
    payload: {
      instance: "organizze-space-123",
      phone_e164: "+351911111111",
      text: "Registado",
    },
    ...overrides,
  };
}

function rawProcessJob(overrides = {}) {
  return {
    id: 77,
    job_type: "process_message",
    status: "processing",
    message_id: 901,
    space_id: "4f756b52-93c8-4a23-96c4-8be4b6678db0",
    locked_at: "2026-08-14T12:00:00.000Z",
    locked_by: "organizze-local-bridge",
    attempts: 1,
    max_attempts: 5,
    payload: {
      connectionId: "private-connection",
      providerMessageId: "private-provider",
      text: "private-content",
      phone: "+351911111111",
    },
    ...overrides,
  };
}

test("records a redacted provider receipt before marking a sent job completed", async () => {
  const updates = [];
  let sends = 0;
  const worker = createJobWorker(config, {
    sendMessage: async () => {
      sends += 1;
      return { key: { id: "raw-provider-id" } };
    },
    updateJob: async (id, lockedAt, values) => { updates.push({ id, lockedAt, values }); },
  });

  await worker.handle(rawJob());
  await worker.handle(rawJob({ status: "completed" }));

  assert.equal(sends, 1);
  assert.equal(updates.length, 2);
  assert.equal(updates[0].lockedAt, "2026-08-14T12:00:00.000Z");
  assert.equal(updates[0].values.status, "processing");
  assert.equal(updates[0].values.payload.delivery_state, "accepted");
  assert.match(updates[0].values.payload.provider_message_id_hash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(updates[1].values.status, "completed");
  const serialized = JSON.stringify(updates);
  assert.equal(serialized.includes("raw-provider-id"), false);
  assert.equal(serialized.includes("+351911111111"), false);
  assert.equal(serialized.includes("Registado"), false);
});

test("schedules a bounded retry after an Evolution failure", async () => {
  const updates = [];
  const worker = createJobWorker(config, {
    sendMessage: async () => { throw new Error("sensitive upstream details"); },
    updateJob: async (id, lockedAt, values) => { updates.push({ id, lockedAt, values }); },
  });

  await worker.handle(rawJob({ attempts: 2 }));

  assert.equal(updates[0].values.status, "retry");
  assert.equal(updates[0].values.last_error, "upstream_request_failed");
  assert.equal(JSON.stringify(updates).includes("sensitive upstream details"), false);
  assert.match(updates[0].values.run_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("retries finalization without sending again after provider acceptance", async () => {
  const updates = [];
  let sends = 0;
  let completionAttempts = 0;
  const worker = createJobWorker(config, {
    sendMessage: async () => {
      sends += 1;
      return { key: { id: "provider-accepted-id" } };
    },
    updateJob: async (id, lockedAt, values) => {
      updates.push({ id, lockedAt, values });
      if (values.status === "completed" && completionAttempts++ === 0) {
        throw new Error("temporary finalization failure");
      }
      return { id, ...values };
    },
  });

  await worker.handle(rawJob());
  assert.equal(sends, 1);
  assert.equal(worker.pendingFinalizations(), 1);
  await worker.reconcile({ force: true });
  assert.equal(sends, 1);
  assert.equal(worker.pendingFinalizations(), 0);
  assert.equal(updates.filter(({ values }) => values.status === "completed").length, 2);
});

test("a reclaimed accepted job finalizes without phone, text or another send", async () => {
  let sends = 0;
  const updates = [];
  const worker = createJobWorker(config, {
    sendMessage: async () => { sends += 1; },
    updateJob: async (id, lockedAt, values) => { updates.push({ id, lockedAt, values }); },
  });

  await worker.handle(rawJob({
    attempts: 2,
    payload: {
      instance: "organizze-space-123",
      delivery_state: "accepted",
      provider_message_id_hash: `sha256:${"b".repeat(64)}`,
      provider_accepted_at: "2026-08-14T12:00:00.000Z",
    },
  }));

  assert.equal(sends, 0);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].values.status, "completed");
});

test("an old worker cannot finalize a lease reclaimed with a new locked_at", async () => {
  let sends = 0;
  let updates = 0;
  const worker = createJobWorker(config, {
    sendMessage: async () => {
      sends += 1;
      return { key: { id: "accepted-before-reclaim" } };
    },
    updateJob: async (id, lockedAt, values) => {
      assert.equal(lockedAt, "2026-08-14T12:00:00.000Z");
      updates += 1;
      if (values.status === "completed") throw new LeaseLostError();
      return { id, ...values };
    },
  });

  await worker.handle(rawJob());

  assert.equal(sends, 1);
  assert.equal(updates, 2);
  assert.equal(worker.pendingFinalizations(), 0);
});

test("lease loss abandons finalization without sending again", async () => {
  let sends = 0;
  const worker = createJobWorker(config, {
    sendMessage: async () => {
      sends += 1;
      return { key: { id: "accepted-before-lease-loss" } };
    },
    updateJob: async () => { throw new LeaseLostError(); },
  });

  await worker.handle(rawJob());
  await worker.reconcile({ force: true });

  assert.equal(sends, 1);
  assert.equal(worker.pendingFinalizations(), 0);
});

test("rejects a job for an instance outside the configured prefix", async () => {
  const updates = [];
  let sends = 0;
  const worker = createJobWorker(config, {
    sendMessage: async () => { sends += 1; },
    updateJob: async (id, lockedAt, values) => { updates.push({ id, lockedAt, values }); },
  });

  await worker.handle(rawJob({ payload: {
    instance: "foreign-space",
    phone_e164: "+351911111111",
    text: "Do not send",
  } }));

  assert.equal(sends, 0);
  assert.equal(updates[0].values.status, "failed");
});

test("stops polling gracefully before returning", async () => {
  let releaseClaim;
  let claimStarted;
  const started = new Promise((resolve) => { claimStarted = resolve; });
  const claim = new Promise((resolve) => { releaseClaim = resolve; });
  const worker = createJobWorker({ ...config, pollIntervalMs: 10 }, {
    claimJobs: async () => {
      claimStarted();
      await claim;
      return [];
    },
  });

  worker.start();
  await started;
  let stopped = false;
  const stopping = worker.stop().then(() => { stopped = true; });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(stopped, false);
  releaseClaim();
  await stopping;
  assert.equal(stopped, true);
});

test("dispatches process_message without Evolution send or completion PATCH", async () => {
  let processCalls = 0;
  let sends = 0;
  let updates = 0;
  const worker = createJobWorker({ ...config, workerId: "organizze-local-bridge" }, {
    processMessage: async (job) => {
      processCalls += 1;
      assert.equal(job.id, 77);
      assert.equal("payload" in job, false);
    },
    sendMessage: async () => { sends += 1; },
    updateJob: async () => { updates += 1; },
  });

  await worker.handle(rawProcessJob());

  assert.equal(processCalls, 1);
  assert.equal(sends, 0);
  assert.equal(updates, 0);
});

test("retries process_message failures with locked_at fencing", async () => {
  const updates = [];
  const logs = [];
  const originalWarn = console.warn;
  console.warn = (...values) => logs.push(values.join(" "));
  const worker = createJobWorker({ ...config, workerId: "organizze-local-bridge" }, {
    processMessage: async () => { throw new Error("private-content +351911111111"); },
    sendMessage: async () => assert.fail("must not call Evolution"),
    updateJob: async (id, lockedAt, values) => updates.push({ id, lockedAt, values }),
  });

  try {
    await worker.handle(rawProcessJob({ attempts: 2 }));
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, 77);
  assert.equal(updates[0].lockedAt, "2026-08-14T12:00:00.000Z");
  assert.equal(updates[0].values.status, "retry");
  assert.equal(updates[0].values.last_error, "upstream_request_failed");
  const serialized = JSON.stringify(updates);
  assert.equal(serialized.includes("private-content"), false);
  assert.equal(serialized.includes("+351911111111"), false);
  assert.equal(logs.join(" ").includes("private-content"), false);
  assert.equal(logs.join(" ").includes("+351911111111"), false);
});

test("explicitly fails genuinely unsupported job types", async () => {
  const updates = [];
  const worker = createJobWorker({ ...config, workerId: "organizze-local-bridge" }, {
    updateJob: async (id, lockedAt, values) => updates.push({ id, lockedAt, values }),
  });

  await worker.handle(rawProcessJob({ job_type: "download_media" }));

  assert.equal(updates[0].values.status, "failed");
  assert.equal(updates[0].values.last_error, "unsupported_job_type");
});

test("monthly report scheduler is interval-bounded and server decides the day", async () => {
  const references = [];
  const worker = createJobWorker({
    ...config,
    workerId: "organizze-local-bridge",
    reportEnqueueIntervalMs: 3_600_000,
  }, {
    enqueueMonthlyReports: async (referenceTime) => references.push(referenceTime),
  });

  await worker.maybeEnqueueReports(1_700_000_000_000);
  await worker.maybeEnqueueReports(1_700_000_001_000);
  await worker.maybeEnqueueReports(1_700_003_600_000);

  assert.deepEqual(references, [
    "2023-11-14T22:13:20.000Z",
    "2023-11-14T23:13:20.000Z",
  ]);
});

test("report scheduler failure is safely logged and does not block claims", async () => {
  let claims = 0;
  const logs = [];
  const originalWarn = console.warn;
  console.warn = (...values) => logs.push(values.join(" "));
  const worker = createJobWorker({
    ...config,
    workerId: "organizze-local-bridge",
    reportEnqueueIntervalMs: 3_600_000,
  }, {
    enqueueMonthlyReports: async () => { throw new Error("private scheduler detail"); },
    claimJobs: async () => { claims += 1; return []; },
  });

  try {
    await worker.pollOnce(1_700_000_000_000);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(claims, 1);
  assert.equal(logs.join(" ").includes("private scheduler detail"), false);
});

test("report sent retry preserves report id without another Evolution send", async () => {
  const reportId = "6fdd1351-dc04-4c52-bb95-1fd09c6c7b48";
  const updates = [];
  let sends = 0;
  let marks = 0;
  const worker = createJobWorker(config, {
    sendMessage: async () => {
      sends += 1;
      return { key: { id: "provider-report-message" } };
    },
    markReportSent: async (id) => {
      assert.equal(id, reportId);
      marks += 1;
      if (marks === 1) throw new Error("temporary report update failure");
    },
    updateJob: async (id, lockedAt, values) => updates.push({ id, lockedAt, values }),
  });

  await worker.handle(rawJob({ payload: {
    instance: "organizze-space-123",
    phone_e164: "+351911111111",
    text: "Resumo mensal",
    report_id: reportId,
  } }));

  assert.equal(sends, 1);
  assert.equal(worker.pendingFinalizations(), 1);
  assert.equal(updates[0].values.payload.report_id, reportId);
  await worker.reconcile({ force: true });
  assert.equal(sends, 1);
  assert.equal(marks, 2);
  assert.equal(worker.pendingFinalizations(), 0);
  assert.equal(updates.at(-1).values.status, "completed");
});
