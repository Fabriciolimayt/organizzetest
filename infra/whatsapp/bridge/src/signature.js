import { createHmac } from "node:crypto";

export function createSignedHeaders(rawBody, secret, timestamp = Math.floor(Date.now() / 1000)) {
  if (typeof rawBody !== "string" || !secret) {
    throw new TypeError("rawBody and secret are required");
  }

  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return {
    "content-type": "application/json",
    "x-organizze-timestamp": String(timestamp),
    "x-organizze-signature": `sha256=${digest}`,
  };
}
