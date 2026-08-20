import http from "node:http";

import {
  InvalidMediaError,
  MediaTooLargeError,
  normalizeEvolutionEvent,
} from "./normalize.js";
import { createSafeLogMetadata, logSafe } from "./safe-log.js";

function reply(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readBody(request, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new RangeError("request_too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function isJsonContentType(value) {
  if (typeof value !== "string") return false;
  const token = "[!#$%&'*+\\-.^_`|~0-9A-Za-z]+";
  const quoted = '"(?:[^"\\\\]|\\\\.)*"';
  return new RegExp(`^application/json(?:[ \\t]*;[ \\t]*${token}[ \\t]*=[ \\t]*(?:${token}|${quoted}))*[ \\t]*$`, "i")
    .test(value);
}

export function createBridgeRequestHandler(config, clients) {
  return async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      return reply(response, 200, { status: "ok" });
    }
    if (request.method !== "POST" || request.url !== "/webhooks/evolution") {
      return reply(response, 404, { error: "not_found" });
    }
    if (!isJsonContentType(request.headers["content-type"])) {
      return reply(response, 415, { error: "content_type_must_be_json" });
    }

    let payload;
    try {
      payload = JSON.parse(await readBody(request, config.maxWebhookBytes));
    } catch (error) {
      return reply(response, error instanceof RangeError ? 413 : 400, {
        error: error instanceof RangeError ? "request_too_large" : "invalid_json",
      });
    }

    let envelope;
    try {
      envelope = normalizeEvolutionEvent(payload, new Date(), {
        maxMediaBytes: config.maxMediaBytes,
      });
    } catch (error) {
      if (error instanceof MediaTooLargeError) return reply(response, 413, { error: "media_too_large" });
      if (error instanceof InvalidMediaError) return reply(response, 400, { error: "invalid_media" });
      return reply(response, 400, { error: "invalid_payload" });
    }
    if (!envelope || !envelope.instance.startsWith(config.instancePrefix)) {
      logSafe("info", "evolution_webhook", createSafeLogMetadata(envelope, { outcome: "ignored", statusCode: 202 }));
      return reply(response, 202, { accepted: false });
    }

    try {
      await clients.forwardWebhook(envelope);
      logSafe("info", "evolution_webhook", createSafeLogMetadata(envelope, { outcome: "forwarded", statusCode: 202 }));
      return reply(response, 202, { accepted: true });
    } catch {
      logSafe("warn", "evolution_webhook", createSafeLogMetadata(envelope, { outcome: "failed", statusCode: 502 }));
      return reply(response, 502, { error: "ingest_unavailable" });
    }
  };
}

export function createBridgeServer(config, clients) {
  return http.createServer(createBridgeRequestHandler(config, clients));
}
