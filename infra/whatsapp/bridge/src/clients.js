import { createEvolutionSendRequest } from "./jobs.js";
import { createSignedHeaders } from "./signature.js";

export class LeaseLostError extends Error {
  constructor() {
    super("job lease is no longer held by this worker");
    this.name = "LeaseLostError";
  }
}

async function parseResponse(response) {
  const body = await response.text();
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function createClients(config, fetchImpl = fetch) {
  const supabaseHeaders = {
    apikey: config.supabaseServiceRoleKey,
    authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    "content-type": "application/json",
  };

  async function request(url, options) {
    const signal = AbortSignal.timeout(config.requestTimeoutMs);
    return parseResponse(await fetchImpl(url, { ...options, signal }));
  }

  return {
    async forwardWebhook(envelope) {
      const body = JSON.stringify(envelope);
      return request(`${config.supabaseUrl}/functions/v1/whatsapp-ingest`, {
        method: "POST",
        headers: createSignedHeaders(body, config.bridgeSecret),
        body,
      });
    },

    async claimJobs() {
      return (await request(`${config.supabaseUrl}/rest/v1/rpc/claim_whatsapp_jobs`, {
        method: "POST",
        headers: { ...supabaseHeaders, "content-profile": "app_v2", "accept-profile": "app_v2" },
        body: JSON.stringify({ worker_id: config.workerId, limit: config.claimLimit }),
      })) ?? [];
    },

    async sendMessage(job) {
      const { url, options } = createEvolutionSendRequest({
        baseUrl: config.evolutionBaseUrl,
        apiKey: config.evolutionApiKey,
        ...job.payload,
      });
      return request(url, options);
    },

    async processMessage(job) {
      const body = JSON.stringify({
        jobId: job.id,
        lockedAt: job.lockedAt,
        workerId: config.workerId,
      });
      return request(`${config.supabaseUrl}/functions/v1/whatsapp-process`, {
        method: "POST",
        headers: createSignedHeaders(body, config.bridgeSecret),
        body,
      });
    },

    async enqueueMonthlyReports(referenceTime) {
      if (typeof referenceTime !== "string" || Number.isNaN(Date.parse(referenceTime))) {
        throw new TypeError("referenceTime must be an ISO timestamp");
      }
      return request(`${config.supabaseUrl}/rest/v1/rpc/enqueue_whatsapp_monthly_reports`, {
        method: "POST",
        headers: { ...supabaseHeaders, "content-profile": "app_v2", "accept-profile": "app_v2" },
        body: JSON.stringify({ reference_time: referenceTime }),
      });
    },

    async markReportSent(reportId) {
      return request(`${config.supabaseUrl}/rest/v1/rpc/mark_whatsapp_monthly_report_sent`, {
        method: "POST",
        headers: { ...supabaseHeaders, "content-profile": "app_v2", "accept-profile": "app_v2" },
        body: JSON.stringify({ report_id: reportId }),
      });
    },

    async updateJob(id, lockedAt, values) {
      if (typeof lockedAt !== "string" || Number.isNaN(Date.parse(lockedAt))) {
        throw new TypeError("lockedAt must be a valid timestamp");
      }
      const workerId = encodeURIComponent(config.workerId);
      const fencedAt = encodeURIComponent(lockedAt);
      const rows = await request(`${config.supabaseUrl}/rest/v1/whatsapp_jobs?id=eq.${id}&status=eq.processing&locked_by=eq.${workerId}&locked_at=eq.${fencedAt}`, {
        method: "PATCH",
        headers: {
          ...supabaseHeaders,
          "content-profile": "app_v2",
          prefer: "return=representation",
        },
        body: JSON.stringify(values),
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw new LeaseLostError();
      return rows[0];
    },
  };
}
