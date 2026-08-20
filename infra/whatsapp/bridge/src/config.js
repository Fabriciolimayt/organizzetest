function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function integer(env, name, fallback, min, max) {
  const value = Number(env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be between ${min} and ${max}`);
  return value;
}

export function loadConfig(env = process.env) {
  return Object.freeze({
    evolutionBaseUrl: env.EVOLUTION_BASE_URL?.trim() || "http://evolution:8080",
    evolutionApiKey: required(env, "EVOLUTION_API_KEY"),
    instancePrefix: env.EVOLUTION_INSTANCE_PREFIX?.trim() || "organizze-",
    supabaseUrl: required(env, "SUPABASE_URL").replace(/\/$/, ""),
    supabaseServiceRoleKey: required(env, "SUPABASE_SERVICE_ROLE_KEY"),
    bridgeSecret: required(env, "WHATSAPP_BRIDGE_SECRET"),
    host: env.BRIDGE_HOST?.trim() || "0.0.0.0",
    port: integer(env, "BRIDGE_PORT", 3000, 1, 65535),
    maxWebhookBytes: integer(env, "MAX_WEBHOOK_BYTES", 8_912_896, 1_024, 12_582_912),
    maxMediaBytes: integer(env, "MAX_MEDIA_BYTES", 6_291_456, 1_024, 8_388_608),
    pollIntervalMs: integer(env, "JOB_POLL_INTERVAL_MS", 2_000, 250, 60_000),
    claimLimit: integer(env, "JOB_CLAIM_LIMIT", 10, 1, 100),
    retryBaseMs: integer(env, "JOB_RETRY_BASE_MS", 2_000, 100, 60_000),
    retryMaxMs: integer(env, "JOB_RETRY_MAX_MS", 300_000, 1_000, 3_600_000),
    reportEnqueueIntervalMs: integer(
      env,
      "REPORT_ENQUEUE_INTERVAL_MS",
      3_600_000,
      60_000,
      86_400_000,
    ),
    requestTimeoutMs: integer(env, "REQUEST_TIMEOUT_MS", 15_000, 1_000, 120_000),
    workerId: env.BRIDGE_WORKER_ID?.trim() || `bridge-${env.HOSTNAME || "local"}`,
  });
}
