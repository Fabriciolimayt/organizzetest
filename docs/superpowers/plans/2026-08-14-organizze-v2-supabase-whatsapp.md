# Organizze V2 Supabase and Local WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add a complete parallel `app_v2` Supabase model and a local Evolution API bridge without deleting or renaming legacy tables.

**Architecture:** Supabase remains the business source of truth. Evolution API, its PostgreSQL, Redis, and a small TypeScript bridge run locally; the bridge only makes outbound calls to Supabase and claims outbound work through an atomic service-role RPC.

**Tech Stack:** PostgreSQL/Supabase, RLS, Deno Edge Functions, TypeScript, Vitest, Docker Compose, Evolution API/Baileys.

## Global Constraints

- Preserve every existing table and migration.
- Create all business tables in schema `app_v2` with explicit grants and RLS.
- Never expose service-role, Evolution API keys, raw link codes, or unredacted payloads to the browser.
- Use Portugal defaults: `pt-PT`, `EUR`, `Europe/Lisbon`.
- Use Evolution API locally without requiring a public tunnel.
- New behavior must be test-first; configuration and generated declarations may use static validation.

---

### Task 1: Complete app_v2 database migration

**Files:**
- Create: `supabase/migrations/*_create_app_v2.sql`
- Create: `supabase/tests/app_v2_schema.test.sql`

Create enums, private authorization helpers, all profile/group/finance/WhatsApp/commercial tables from the approved plan, explicit constraints and indexes, RLS policies, `security_invoker` monthly view, signup bootstrap trigger, storage bucket policies, public link/import RPCs, service-role job claim RPC, legacy imports, grants, and SQL assertions.

### Task 2: Supabase TypeScript contracts and whatsapp-ingest

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Create: `src/integrations/supabase/v2.ts`
- Create: `supabase/functions/whatsapp-ingest/index.ts`
- Create: tests under `src/test/` and `supabase/functions/whatsapp-ingest/`
- Modify: `supabase/config.toml`

Expose a typed V2 schema client, pure webhook validation/normalization helpers, idempotent ingestion, job creation, signed bridge requests, and tests for invalid signatures, duplicate messages, redaction, text, image, and status events.

### Task 3: Evolution Docker stack and local bridge

**Files:**
- Create: `infra/whatsapp/docker-compose.yml`
- Create: `infra/whatsapp/.env.example`
- Create: `infra/whatsapp/bridge/**`

Pin Evolution, PostgreSQL, Redis, and Node images. Implement a tested bridge that accepts Evolution webhooks locally, signs and forwards normalized events to Supabase, atomically claims outbound jobs, sends through Evolution, completes/retries jobs with exponential backoff, and reports health without logging secrets or message bodies.

### Task 4: Operational hardening and verification

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`
- Create: `docs/whatsapp-local.md`

Ignore secrets/local stores, document Supabase schema exposure and migration commands, document Evolution QR setup and dedicated-number risk, add static configuration validation, run build/lint/tests/SQL checks, and record any verification blocked by unavailable Docker or Supabase credentials.
