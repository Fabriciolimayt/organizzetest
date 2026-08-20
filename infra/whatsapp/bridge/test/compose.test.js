import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("bridge is not published to the host by default", async () => {
  const compose = await readFile(new URL("../../docker-compose.yml", import.meta.url), "utf8");
  const bridgeBlock = compose.split(/^  bridge:\s*$/m)[1].split(/^networks:\s*$/m)[0];

  assert.doesNotMatch(bridgeBlock, /^    ports:\s*$/m);
  assert.match(bridgeBlock, /whatsapp_internal/);
});

test("runbook checks health inside Docker and does not advertise a host oracle", async () => {
  const readme = await readFile(new URL("../../README.md", import.meta.url), "utf8");

  assert.match(readme, /docker compose exec bridge node -e/);
  assert.doesNotMatch(readme, /curl[^\n]*127\.0\.0\.1:3000/);
  assert.match(readme, /não (?:publica|expõe) nenhuma porta/i);
});

test("Gemini credentials are documented as Supabase-only", async () => {
  const readme = await readFile(new URL("../../README.md", import.meta.url), "utf8");
  const example = await readFile(new URL("../../.env.example", import.meta.url), "utf8");

  assert.match(readme, /GEMINI_API_KEY[^\n]*somente[^\n]*Supabase/i);
  assert.doesNotMatch(example, /^GEMINI_API_KEY=/m);
});
