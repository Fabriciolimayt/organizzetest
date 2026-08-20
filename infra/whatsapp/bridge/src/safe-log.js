const ALLOWED_OUTCOMES = new Set([
  "accepted",
  "completed",
  "failed",
  "forwarded",
  "ignored",
  "retry",
  "started",
  "stopped",
]);

export function createSafeLogMetadata(envelope, details = {}) {
  const metadata = {
    event: typeof envelope?.event === "string" ? envelope.event : "unknown",
    outcome: ALLOWED_OUTCOMES.has(details.outcome) ? details.outcome : "failed",
  };

  if (Number.isInteger(details.statusCode)) metadata.statusCode = details.statusCode;
  if (Number.isInteger(details.jobId)) metadata.jobId = details.jobId;
  if (Number.isInteger(details.attempt)) metadata.attempt = details.attempt;
  if (Number.isFinite(details.retryInMs)) metadata.retryInMs = Math.round(details.retryInMs);
  metadata.hasInstance = Boolean(envelope?.instance);
  metadata.hasProviderMessageId = Boolean(envelope?.data?.providerMessageId);

  return metadata;
}

export function logSafe(level, message, metadata = {}) {
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  method(JSON.stringify({ level, message, ...metadata }));
}
