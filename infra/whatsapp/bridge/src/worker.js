import { LeaseLostError } from "./clients.js";
import {
  calculateRetryDelayMs,
  createProviderReceipt,
  parseProcessMessageJob,
  parseSendMessageJob,
} from "./jobs.js";
import { logSafe } from "./safe-log.js";

function nextRunAt(delayMs) {
  return new Date(Date.now() + delayMs).toISOString();
}

function acceptedPayload(instance, receipt, reportId) {
  const payload = {
    instance,
    delivery_state: "accepted",
    provider_message_id_hash: receipt.providerMessageIdHash,
    provider_accepted_at: receipt.acceptedAt,
  };
  if (reportId) payload.report_id = reportId;
  return payload;
}

export function createJobWorker(config, clients) {
  let timer;
  let running = false;
  let stopping = false;
  let lastReportEnqueueAt = Number.NEGATIVE_INFINITY;
  const finalizations = new Map();

  function queueFinalization(jobId, lockedAt, payload, phase, reportId) {
    finalizations.set(jobId, {
      jobId,
      lockedAt,
      payload,
      phase,
      reportId,
      attempts: 0,
      nextAttemptAt: 0,
    });
  }

  async function reconcileEntry(entry) {
    try {
      if (entry.phase === "record_acceptance") {
        await clients.updateJob(entry.jobId, entry.lockedAt, {
          status: "processing",
          payload: entry.payload,
          last_error: null,
        });
        entry.phase = entry.reportId ? "mark_report" : "complete";
      }

      if (entry.phase === "mark_report") {
        await clients.markReportSent(entry.reportId);
        entry.phase = "complete";
      }

      await clients.updateJob(entry.jobId, entry.lockedAt, {
        status: "completed",
        last_error: null,
        locked_by: null,
        locked_at: null,
      });
      finalizations.delete(entry.jobId);
      logSafe("info", "whatsapp_job", {
        event: "send_message.finalization",
        outcome: "completed",
        jobId: entry.jobId,
      });
    } catch (error) {
      if (error instanceof LeaseLostError) {
        finalizations.delete(entry.jobId);
        logSafe("warn", "whatsapp_job", {
          event: "send_message.lease",
          outcome: "ignored",
          jobId: entry.jobId,
        });
        return;
      }

      entry.attempts += 1;
      const delay = calculateRetryDelayMs(entry.attempts, {
        baseMs: config.retryBaseMs,
        maxMs: config.retryMaxMs,
      });
      entry.nextAttemptAt = Date.now() + delay;
      logSafe("warn", "whatsapp_job", {
        event: "send_message.finalization",
        outcome: "retry",
        jobId: entry.jobId,
        attempt: entry.attempts,
        retryInMs: delay,
      });
    }
  }

  async function reconcile({ force = false } = {}) {
    for (const entry of [...finalizations.values()]) {
      if (stopping) break;
      if (force || entry.nextAttemptAt <= Date.now()) await reconcileEntry(entry);
    }
  }

  async function failClaimedJob(rawJob, lastError) {
    if (!Number.isInteger(rawJob?.id)
      || typeof rawJob.locked_at !== "string"
      || Number.isNaN(Date.parse(rawJob.locked_at))) return;
    try {
      await clients.updateJob(rawJob.id, rawJob.locked_at, {
        status: "failed",
        last_error: lastError,
        locked_by: null,
        locked_at: null,
      });
    } catch {
      logSafe("warn", "whatsapp_job", {
        event: "send_message.lease",
        outcome: "ignored",
        jobId: rawJob.id,
      });
    }
  }

  async function scheduleJobRetry(job, error, event) {
    const exhausted = job.attempts >= job.maxAttempts;
    const delay = calculateRetryDelayMs(job.attempts, {
      baseMs: config.retryBaseMs,
      maxMs: config.retryMaxMs,
    });
    try {
      await clients.updateJob(job.id, job.lockedAt, {
        status: exhausted ? "failed" : "retry",
        run_at: exhausted ? new Date().toISOString() : nextRunAt(delay),
        last_error: error?.name === "TimeoutError" ? "upstream_timeout" : "upstream_request_failed",
        locked_by: null,
        locked_at: null,
      });
    } catch {
      logSafe("warn", "whatsapp_job", {
        event: "send_message.lease",
        outcome: "ignored",
        jobId: job.id,
      });
      return;
    }
    logSafe("warn", "whatsapp_job", {
      event,
      outcome: exhausted ? "failed" : "retry",
      jobId: job.id,
      attempt: job.attempts,
      retryInMs: exhausted ? undefined : delay,
    });
  }

  async function handle(rawJob) {
    if (rawJob?.status === "completed") return;

    if (rawJob?.job_type === "process_message") {
      let processJob;
      try {
        processJob = parseProcessMessageJob(rawJob, { workerId: config.workerId });
      } catch {
        await failClaimedJob(rawJob, "invalid_process_message_job");
        return;
      }

      try {
        await clients.processMessage(processJob);
      } catch (error) {
        await scheduleJobRetry(processJob, error, "process_message");
      }
      return;
    }

    if (rawJob?.job_type !== "send_message") {
      await failClaimedJob(rawJob, "unsupported_job_type");
      return;
    }

    let job;
    try {
      job = parseSendMessageJob(rawJob, { instancePrefix: config.instancePrefix });
    } catch {
      await failClaimedJob(rawJob, "invalid_send_message_job");
      return;
    }

    if (job.accepted) {
      queueFinalization(job.id, job.lockedAt, {
        instance: job.payload.instance,
        delivery_state: job.payload.deliveryState,
        provider_message_id_hash: job.payload.providerMessageIdHash,
        provider_accepted_at: job.payload.providerAcceptedAt,
        ...(job.reportId ? { report_id: job.reportId } : {}),
      }, job.reportId ? "mark_report" : "complete", job.reportId);
      await reconcile({ force: true });
      return;
    }

    let response;
    try {
      response = await clients.sendMessage(job);
    } catch (error) {
      await scheduleJobRetry(job, error, "send_message");
      return;
    }

    const receipt = createProviderReceipt(response);
    queueFinalization(
      job.id,
      job.lockedAt,
      acceptedPayload(job.payload.instance, receipt, job.reportId),
      "record_acceptance",
      job.reportId,
    );
    await reconcile({ force: true });
  }

  async function maybeEnqueueReports(nowMs = Date.now()) {
    const interval = config.reportEnqueueIntervalMs ?? 3_600_000;
    if (nowMs - lastReportEnqueueAt < interval) return;
    lastReportEnqueueAt = nowMs;
    if (typeof clients.enqueueMonthlyReports !== "function") return;
    try {
      await clients.enqueueMonthlyReports(new Date(nowMs).toISOString());
    } catch {
      logSafe("warn", "monthly_report_enqueue", {
        event: "monthly_report.enqueue",
        outcome: "failed",
      });
    }
  }

  async function poll(nowMs = Date.now()) {
    if (running || stopping) return;
    running = true;
    try {
      await maybeEnqueueReports(nowMs);
      await reconcile();
      const jobs = await clients.claimJobs();
      for (const job of Array.isArray(jobs) ? jobs : []) {
        if (stopping) break;
        await handle(job);
      }
    } catch {
      logSafe("warn", "job_poll", { event: "job.poll", outcome: "failed" });
    } finally {
      running = false;
    }
  }

  return {
    start() {
      if (timer) return;
      void poll();
      timer = setInterval(() => void poll(), config.pollIntervalMs);
      timer.unref();
    },
    async stop() {
      stopping = true;
      if (timer) clearInterval(timer);
      timer = undefined;
      while (running) await new Promise((resolve) => setTimeout(resolve, 25));
    },
    handle,
    reconcile,
    maybeEnqueueReports,
    pollOnce: poll,
    pendingFinalizations: () => finalizations.size,
  };
}
