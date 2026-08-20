import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationsDir).filter((file) =>
  file.endsWith("_create_app_v2.sql"),
);

const tableBody = (sql: string, table: string) => {
  const match = sql.match(
    new RegExp(`create\\s+table\\s+app_v2\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, "i"),
  );

  expect(match, `missing definition for app_v2.${table}`).not.toBeNull();
  return match![1];
};

const functionBody = (sql: string, name: string) => {
  const match = sql.match(
    new RegExp(
      `create\\s+function\\s+app_v2\\.${name}\\b[\\s\\S]*?as\\s+\\$\\$([\\s\\S]*?)\\$\\$;`,
      "i",
    ),
  );

  expect(match, `missing definition for app_v2.${name}`).not.toBeNull();
  return match![1];
};

const grantsFor = (sql: string, role: string, object: string) =>
  sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => /^grant\b/i.test(statement))
    .filter((statement) => new RegExp(`to\\s+${role}$`, "i").test(statement))
    .filter((statement) => statement.includes(object));

describe("app_v2 migration contract", () => {
  it("defines the complete additive and secure V2 schema", () => {
    expect(migrationFiles).toHaveLength(1);

    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const tables = [
      "profiles",
      "spaces",
      "space_members",
      "space_invitations",
      "categories",
      "budget_plans",
      "budget_allocations",
      "transactions",
      "transaction_attachments",
      "recurring_rules",
      "spending_limits",
      "financial_goals",
      "data_imports",
      "whatsapp_connections",
      "whatsapp_link_tokens",
      "whatsapp_messages",
      "whatsapp_media",
      "whatsapp_jobs",
      "whatsapp_events",
      "whatsapp_monthly_reports",
      "subscriptions",
      "payment_events",
    ];

    for (const table of tables) {
      expect(sql).toMatch(
        new RegExp(`create\\s+table\\s+app_v2\\.${table}\\b`, "i"),
      );
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+table\\s+app_v2\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
          "i",
        ),
      );
    }

    for (const rpc of [
      "create_whatsapp_link",
      "consume_whatsapp_link",
      "import_legacy_finances",
      "claim_whatsapp_jobs",
      "apply_whatsapp_message_status",
      "complete_whatsapp_processing",
      "update_whatsapp_preferences",
      "enqueue_whatsapp_monthly_reports",
      "mark_whatsapp_monthly_report_sent",
    ]) {
      expect(sql).toMatch(
        new RegExp(`create\\s+(?:or\\s+replace\\s+)?function\\s+app_v2\\.${rpc}\\b`, "i"),
      );
    }

    expect(sql).toMatch(/create\s+schema\s+app_v2/i);
    expect(sql).toMatch(/create\s+schema\s+app_private/i);
    expect(sql).toMatch(
      /create\s+schema\s+if\s+not\s+exists\s+extensions\s*;[\s\S]*create\s+extension\s+if\s+not\s+exists\s+pgcrypto\s+with\s+schema\s+extensions/i,
    );
    expect(sql).toMatch(
      /create\s+view\s+app_v2\.monthly_spending_summary\s+with\s*\(security_invoker\s*=\s*true\)/i,
    );
    expect(sql).not.toMatch(/auth\.role\s*\(/i);
    expect(sql).not.toMatch(/\bverify_code\b/i);
    expect(sql).not.toMatch(
      /\b(?:drop|truncate)\s+(?:table\s+)?(?:if\s+exists\s+)?public\.(?:expenses|whatsapp_users|whatsapp_links|whatsapp_events|subscriptions)\b/i,
    );
    expect(sql).not.toMatch(
      /alter\s+table\s+public\.(?:expenses|whatsapp_users|whatsapp_links|whatsapp_events|subscriptions)\b/i,
    );
  });

  it("enforces tenant-safe keys and immutable ownership metadata", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");

    expect(tableBody(sql, "budget_allocations")).toMatch(/\bspace_id\s+uuid\s+not\s+null/i);
    expect(sql).toMatch(
      /foreign\s+key\s*\(space_id,\s*budget_plan_id\)\s+references\s+app_v2\.budget_plans\s*\(space_id,\s*id\)/i,
    );
    expect(sql).toMatch(
      /foreign\s+key\s*\(space_id,\s*category_id\)\s+references\s+app_v2\.categories\s*\(space_id,\s*id\)/i,
    );
    expect(sql).toMatch(
      /foreign\s+key\s*\(space_id,\s*created_by\)\s+references\s+app_v2\.space_members\s*\(space_id,\s*user_id\)/i,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+space_members_one_owner_uidx[\s\S]*where\s+role\s*=\s*'owner'/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+transactions_space_whatsapp_message_idx\s+on\s+app_v2\.transactions\s*\(space_id,\s*whatsapp_message_id\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+whatsapp_link_tokens_space_connection_idx\s+on\s+app_v2\.whatsapp_link_tokens\s*\(space_id,\s*connection_id\)/i,
    );
    expect(sql).toMatch(/create\s+function\s+app_v2\.transfer_space_ownership\b/i);
    expect(sql).toMatch(/create\s+function\s+app_private\.enforce_space_ownership\b/i);
    expect(sql).toMatch(/create\s+function\s+app_private\.enforce_immutable_columns\b/i);
    expect(sql).toMatch(
      /create\s+trigger\s+transactions_immutable[\s\S]*app_private\.enforce_immutable_columns\('space_id',\s*'created_by'\)/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+transaction_attachments_immutable[\s\S]*'uploaded_by'/i,
    );
  });

  it("uses safe phone, money, token, and concurrent import contracts", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");

    expect(sql).toContain("^[+][1-9][0-9]{7,14}$");
    expect(sql).not.toContain("^\\\\+[1-9][0-9]{7,14}$");
    expect(sql).toContain("^[0-9]+([.][0-9]{1,2})?$");
    expect(tableBody(sql, "whatsapp_link_tokens")).not.toMatch(
      /code_hash\s+bytea\s+not\s+null\s+unique/i,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+whatsapp_link_tokens_active_code_hash_uidx[\s\S]*where\s+consumed_at\s+is\s+null/i,
    );
    expect(sql).toMatch(/exception\s+when\s+unique_violation/i);
    expect(sql).toMatch(
      /insert\s+into\s+app_v2\.data_imports[\s\S]*on\s+conflict\s*\(user_id,\s*import_key\)\s+do\s+nothing[\s\S]*returning\s+id/i,
    );
    expect(sql).not.toMatch(/grant\s+all(?:\s+privileges)?\b/i);
    expect(sql).toMatch(
      /alter\s+role\s+authenticator\s+set\s+pgrst\.db_schemas\s*=\s*'public,\s*graphql_public,\s*app_v2'/i,
    );
    expect(sql).toMatch(/notify\s+pgrst,\s*'reload config'/i);
  });

  it("skips incompatible legacy expenses without reading missing columns", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");

    expect(sql).toMatch(
      /information_schema\.columns[\s\S]*table_schema\s*=\s*'public'[\s\S]*table_name\s*=\s*'expenses'[\s\S]*column_name\s*=\s*any\s*\(array\[[\s\S]*'user_id'[\s\S]*'occurred_at'[\s\S]*'merchant'[\s\S]*\]\)[\s\S]*=\s*9/i,
    );
    expect(sql).toMatch(
      /legacy:public\.expenses:incompatible:v1[\s\S]*Legacy expenses schema has no reliable authenticated-user mapping/i,
    );
  });

  it("contains the reviewed V2 domain fields and constraints", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");

    expect(tableBody(sql, "profiles")).toMatch(/\bonboarding_completed\s+boolean\s+not\s+null/i);
    expect(tableBody(sql, "categories")).toMatch(/\bsort_order\s+integer\s+not\s+null/i);
    expect(tableBody(sql, "budget_plans")).toMatch(/\bexpected_income\s+numeric\s*\(14,\s*2\)/i);
    expect(tableBody(sql, "budget_plans")).toMatch(/\bis_active\s+boolean\s+not\s+null/i);
    expect(tableBody(sql, "budget_allocations")).toMatch(/\bpercentage\s+numeric\s*\(5,\s*2\)/i);
    expect(tableBody(sql, "transactions")).toMatch(/\bmerchant\s+text\b/i);
    expect(tableBody(sql, "whatsapp_connections")).toMatch(/\bprovider\s+text\s+not\s+null/i);
    expect(tableBody(sql, "whatsapp_connections")).toMatch(
      /\binstance_name\s+text\s+not\s+null\s+default\s+'organizze-bot'/i,
    );
    expect(tableBody(sql, "whatsapp_connections")).toMatch(/\bmonthly_report_opt_in\s+boolean\s+not\s+null/i);
    expect(tableBody(sql, "whatsapp_connections")).toMatch(/\breport_preferences\s+jsonb\s+not\s+null/i);
    expect(sql).not.toMatch(/whatsapp_connections_instance_name_uidx/i);
    expect(sql).toMatch(
      /create\s+index\s+whatsapp_connections_instance_phone_idx\s+on\s+app_v2\.whatsapp_connections\s*\(instance_name,\s*phone_e164\)/i,
    );
    expect(tableBody(sql, "whatsapp_media")).toMatch(/\bis_valid\s+boolean\s+not\s+null/i);
    expect(tableBody(sql, "whatsapp_media")).toMatch(/\bexpires_at\s+timestamptz\b/i);
    expect(tableBody(sql, "whatsapp_monthly_reports")).toMatch(/\bscheduled_for\s+timestamptz\b/i);
    expect(tableBody(sql, "whatsapp_monthly_reports")).toMatch(/\bdelivery_status\s+text\s+not\s+null/i);
    expect(tableBody(sql, "whatsapp_monthly_reports")).toMatch(/\bdelivered_at\s+timestamptz\b/i);
    expect(tableBody(sql, "whatsapp_events")).toMatch(/\bevent_key\s+text\b/i);
    expect(sql).toMatch(
      /create\s+unique\s+index\s+whatsapp_events_space_event_key_uidx\s+on\s+app_v2\.whatsapp_events\s*\(space_id,\s*event_key\)\s+where\s+event_key\s+is\s+not\s+null/i,
    );
  });

  it("creates spaces atomically through an authenticated RPC", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");

    expect(sql).toMatch(/create\s+function\s+app_v2\.create_space\b/i);
    expect(sql).toMatch(
      /create\s+function\s+app_v2\.create_space[\s\S]*security\s+definer[\s\S]*set\s+search_path\s*=\s*''/i,
    );
    expect(sql).toMatch(
      /insert\s+into\s+app_v2\.spaces[\s\S]*owner_user_id[\s\S]*caller_id[\s\S]*insert\s+into\s+app_v2\.space_members[\s\S]*'owner'/i,
    );
    expect(sql).toMatch(/grant\s+execute\s+on\s+function\s+app_v2\.create_space\b[\s\S]*to\s+authenticated/i);
    expect(sql).toMatch(/grant\s+select,\s*delete\s+on\s+table\s+app_v2\.spaces\s+to\s+authenticated/i);
  });

  it("accepts invitations atomically without exposing or granting owner", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const invitation = tableBody(sql, "space_invitations");

    expect(invitation).toMatch(/\btoken_hash\s+bytea\s+not\s+null/i);
    expect(invitation).not.toMatch(/\btoken\s+text\b/i);
    expect(invitation).toMatch(/\baccepted_at\s+timestamptz\b/i);
    expect(sql).toMatch(/create\s+function\s+app_v2\.accept_space_invitation\s*\(token\s+text\)/i);
    expect(sql).toMatch(
      /accept_space_invitation[\s\S]*extensions\.digest\(token,\s*'sha256'\)[\s\S]*status\s*=\s*'pending'[\s\S]*expires_at\s*>\s*now\(\)/i,
    );
    expect(sql).toMatch(
      /accept_space_invitation[\s\S]*auth\.users[\s\S]*lower\([\s\S]*email[\s\S]*insert\s+into\s+app_v2\.space_members/i,
    );
    expect(sql).toMatch(/accept_space_invitation[\s\S]*candidate\.role\s*<>\s*'owner'/i);
    const acceptInvitation = functionBody(sql, "accept_space_invitation");
    expect(acceptInvitation).toMatch(
      /exists\s*\([\s\S]*from\s+app_v2\.space_members[\s\S]*raise\s+exception\s+'invitation is invalid or unavailable'/i,
    );
    expect(acceptInvitation).not.toMatch(/on\s+conflict\s*\(space_id,\s*user_id\)\s+do\s+nothing/i);
    expect(sql).toMatch(/grant\s+execute\s+on\s+function\s+app_v2\.accept_space_invitation\(text\)\s+to\s+authenticated/i);
  });

  it("keeps authenticated WhatsApp connections and link tokens read-only", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const connectionGrants = grantsFor(sql, "authenticated", "app_v2.whatsapp_connections");
    const tokenGrants = grantsFor(sql, "authenticated", "app_v2.whatsapp_link_tokens");

    expect(sql).toMatch(/create\s+policy\s+whatsapp_connections_select_admin\b/i);
    expect(sql).not.toMatch(
      /create\s+policy\s+whatsapp_connections_(?:insert|update|delete)_admin\b/i,
    );
    expect(sql).not.toMatch(
      /create\s+policy\s+whatsapp_link_tokens_(?:insert|update|delete)_admin\b/i,
    );
    expect(connectionGrants.join("\n")).toMatch(/grant\s+select\b/i);
    expect(connectionGrants.join("\n")).not.toMatch(/\b(?:insert|update|delete)\b/i);
    expect(tokenGrants.join("\n")).toMatch(/grant\s+select\b/i);
    expect(tokenGrants.join("\n")).not.toMatch(/\b(?:insert|update|delete)\b/i);
  });

  it("guards WhatsApp links per space and phone with bounded attempts", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const tokens = tableBody(sql, "whatsapp_link_tokens");
    const createLink = functionBody(sql, "create_whatsapp_link");
    const consumeLink = functionBody(sql, "consume_whatsapp_link");

    expect(tokens).toMatch(/\bconnection_id\s+uuid\s+not\s+null/i);
    expect(sql).toMatch(
      /foreign\s+key\s*\(space_id,\s*connection_id\)\s+references\s+app_v2\.whatsapp_connections\s*\(space_id,\s*id\)/i,
    );
    expect(tokens).toMatch(/\battempts\s+integer\s+not\s+null\s+default\s+0/i);
    expect(tokens).toMatch(/\bmax_attempts\s+integer\s+not\s+null/i);
    expect(tokens).toMatch(/\blast_attempt_at\s+timestamptz\b/i);
    expect(tokens).toMatch(/\bblocked_at\s+timestamptz\b/i);
    expect(sql).toMatch(
      /create\s+unique\s+index\s+whatsapp_link_tokens_active_link_uidx\s+on\s+app_v2\.whatsapp_link_tokens\s*\(space_id,\s*phone_e164\)/i,
    );
    expect(sql).not.toMatch(/whatsapp_link_tokens_active_link_uidx[\s\S]{0,160}requested_by/i);
    expect(sql).toMatch(
      /create_whatsapp_link[\s\S]*pg_advisory_xact_lock[\s\S]*space_id::text[\s\S]*phone_e164/i,
    );
    expect(sql).toMatch(
      /consume_whatsapp_link[\s\S]*pg_advisory_xact_lock[\s\S]*attempts\s*=\s*least\([\s\S]*blocked_at/i,
    );
    expect(sql).toMatch(
      /create\s+function\s+app_v2\.create_whatsapp_link[\s\S]*returns\s+table\s*\([\s\S]*instance_name\s+text/i,
    );
    expect(createLink).toMatch(
      /provider\s*=\s*'evolution'[\s\S]*instance_name\s+is\s+not\s+null[\s\S]*order\s+by[\s\S]*created_at[\s\S]*id[\s\S]*'organizze-bot'/i,
    );
    expect(createLink).not.toMatch(/'organizze-'\s*\|\|\s*replace/i);
    expect(createLink).toMatch(
      /insert\s+into\s+app_v2\.whatsapp_link_tokens[\s\S]*connection_id/i,
    );
    expect(consumeLink).toMatch(
      /connection\.id\s*=\s*matched_token\.connection_id[\s\S]*set\s+status\s*=\s*'active'[\s\S]*verified_at\s*=\s*now\(\)/i,
    );
    expect(consumeLink).not.toMatch(/insert\s+into\s+app_v2\.whatsapp_connections/i);
    expect(createLink).not.toMatch(/verified_at\s*=\s*now\(\)/i);
  });

  it("scopes message idempotency to a connection and uses minimal service grants", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const serviceAppGrants = grantsFor(sql, "service_role", "app_v2.").join("\n");

    expect(sql).toMatch(
      /create\s+unique\s+index\s+whatsapp_messages_external_id_uidx\s+on\s+app_v2\.whatsapp_messages\s*\(connection_id,\s*external_message_id\)/i,
    );
    expect(sql).toMatch(
      /foreign\s+key\s*\(space_id,\s*connection_id\)\s+references\s+app_v2\.whatsapp_connections\s*\(space_id,\s*id\)/i,
    );
    expect(sql).not.toMatch(/grant[\s\S]{0,120}\breferences\b[\s\S]{0,120}to\s+service_role/i);
    expect(sql).not.toMatch(/grant[\s\S]{0,120}\btrigger\b[\s\S]{0,120}to\s+service_role/i);
    expect(sql).not.toMatch(/grant\s+usage,\s*select,\s*update\s+on\s+all\s+sequences/i);
    expect(sql).not.toMatch(/grant[\s\S]*?on\s+all\s+sequences[\s\S]*?to\s+service_role/i);
    expect(serviceAppGrants).not.toMatch(
      /app_v2\.(?:profiles|space_members|space_invitations|budget_plans|budget_allocations|transaction_attachments|recurring_rules|spending_limits|financial_goals|data_imports|whatsapp_link_tokens|monthly_spending_summary)\b/i,
    );
    for (const table of [
      "categories",
      "spaces",
      "transactions",
      "whatsapp_connections",
      "whatsapp_messages",
      "whatsapp_media",
      "whatsapp_jobs",
      "whatsapp_events",
      "whatsapp_monthly_reports",
      "subscriptions",
      "payment_events",
    ]) {
      expect(serviceAppGrants).toContain(`app_v2.${table}`);
    }
    expect(sql).toMatch(
      /grant\s+select\s+on\s+table\s+app_v2\.spaces,\s*app_v2\.categories\s+to\s+service_role/i,
    );
    expect(sql).toMatch(
      /grant\s+select,\s*insert,\s*update\s+on\s+table\s+app_v2\.transactions,\s*app_v2\.whatsapp_jobs,\s*app_v2\.whatsapp_monthly_reports,\s*app_v2\.subscriptions,\s*app_v2\.payment_events\s+to\s+service_role/i,
    );
    expect(sql).toMatch(/grant\s+select\s+on\s+table\s+app_v2\.whatsapp_connections\s+to\s+service_role/i);
    expect(sql).toMatch(
      /grant\s+update\s*\(last_seen_at,\s*updated_at\)\s+on\s+table\s+app_v2\.whatsapp_connections\s+to\s+service_role/i,
    );
    expect(sql).not.toMatch(
      /grant\s+update\s*\([^)]*(?:status|verified_at)[^)]*\)\s+on\s+table\s+app_v2\.whatsapp_connections\s+to\s+service_role/i,
    );
    expect(sql).toMatch(
      /grant\s+select,\s*insert,\s*update\s+on\s+table\s+app_v2\.whatsapp_messages\s+to\s+service_role/i,
    );
    expect(sql).toMatch(/grant\s+insert\s+on\s+table\s+app_v2\.whatsapp_events\s+to\s+service_role/i);
    expect(sql).toMatch(
      /grant\s+select,\s*insert,\s*update,\s*delete\s+on\s+table\s+app_v2\.whatsapp_media\s+to\s+service_role/i,
    );
    expect(sql).toMatch(
      /grant\s+usage,\s*select\s+on\s+sequence\s+app_v2\.whatsapp_messages_id_seq,\s*app_v2\.whatsapp_jobs_id_seq,\s*app_v2\.whatsapp_events_id_seq,\s*app_v2\.payment_events_id_seq\s+to\s+service_role/i,
    );
    expect(sql).not.toMatch(/grant\s+usage\s+on\s+schema\s+app_private\s+to\s+service_role/i);
  });

  it("keeps message jobs idempotent and status callbacks monotonic", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const applyStatus = functionBody(sql, "apply_whatsapp_message_status");

    expect(sql).toMatch(
      /create\s+unique\s+index\s+whatsapp_jobs_message_type_uidx\s+on\s+app_v2\.whatsapp_jobs\s*\(message_id,\s*job_type\)\s+where\s+message_id\s+is\s+not\s+null/i,
    );
    expect(sql).toMatch(
      /create\s+function\s+app_v2\.apply_whatsapp_message_status\s*\(\s*connection_id\s+uuid,\s*external_message_id\s+text,\s*status\s+app_v2\.message_status\s*\)/i,
    );
    expect(applyStatus).toMatch(/message\.direction\s*=\s*'outbound'/i);
    expect(applyStatus).toMatch(
      /insert\s+into\s+app_v2\.whatsapp_messages[\s\S]*'outbound'[\s\S]*'status_only'[\s\S]*on\s+conflict\s*\(connection_id,\s*external_message_id\)[\s\S]*do\s+nothing/i,
    );
    expect(applyStatus).toMatch(
      /message\.status\s*=\s*'read'[\s\S]*message\.status\s*=\s*'delivered'[\s\S]*status\s*<>\s*'read'[\s\S]*message\.status\s*=\s*'failed'[\s\S]*apply_whatsapp_message_status\.status\s+in\s*\('delivered',\s*'read'\)/i,
    );
    expect(applyStatus).toMatch(
      /app_private\.whatsapp_message_status_rank\(apply_whatsapp_message_status\.status\)[\s\S]*>\s*app_private\.whatsapp_message_status_rank\(message\.status\)/i,
    );
    expect(sql).toMatch(
      /revoke\s+execute\s+on\s+function\s+app_v2\.apply_whatsapp_message_status\(uuid,\s*text,\s*app_v2\.message_status\)\s+from\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+app_v2\.apply_whatsapp_message_status\(uuid,\s*text,\s*app_v2\.message_status\)\s+to\s+service_role/i,
    );
  });

  it("completes inbound WhatsApp processing atomically with lease fencing", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const transactions = tableBody(sql, "transactions");
    const completeProcessing = functionBody(sql, "complete_whatsapp_processing");

    expect(transactions).toMatch(/\bwhatsapp_message_id\s+bigint\b/i);
    expect(sql).toMatch(
      /foreign\s+key\s*\(space_id,\s*whatsapp_message_id\)\s+references\s+app_v2\.whatsapp_messages\s*\(space_id,\s*id\)/i,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+transactions_whatsapp_message_uidx\s+on\s+app_v2\.transactions\s*\(whatsapp_message_id\)\s+where\s+whatsapp_message_id\s+is\s+not\s+null/i,
    );
    expect(sql).toMatch(
      /create\s+function\s+app_v2\.complete_whatsapp_processing\s*\(\s*job_id\s+bigint,\s*locked_at\s+timestamptz,\s*worker_id\s+text,\s*parsed\s+jsonb\s*\)/i,
    );
    expect(completeProcessing).toMatch(
      /job\.id\s*=\s*complete_whatsapp_processing\.job_id[\s\S]*job\.locked_at\s*=\s*complete_whatsapp_processing\.locked_at[\s\S]*job\.locked_by\s*=\s*complete_whatsapp_processing\.worker_id[\s\S]*job\.status\s*=\s*'processing'[\s\S]*job\.job_type\s*=\s*'process_message'[\s\S]*for\s+update\s+of\s+job/i,
    );
    expect(completeProcessing).toMatch(/message\.direction\s*=\s*'inbound'/i);
    expect(completeProcessing).toMatch(/linked_connection\.linked_user_id/i);
    expect(completeProcessing).toMatch(
      /parsed[\s\S]*amount[\s\S]*currency[\s\S]*description[\s\S]*category/i,
    );
    expect(completeProcessing).toMatch(
      /parsed\s*->>\s*'merchant'[\s\S]*length[\s\S]*between\s+1\s+and\s+120/i,
    );
    expect(completeProcessing).toMatch(
      /parsed_category_name\s*:=\s*btrim\s*\([\s\S]*parsed\s*->>\s*'category'/i,
    );
    expect(completeProcessing).toMatch(
      /from\s+app_v2\.categories[\s\S]*lower\s*\(category\.name\)\s*=\s*lower\s*\(parsed_category_name\)[\s\S]*category\.space_id\s*=\s*processing_job\.space_id[\s\S]*category\.transaction_type\s*=\s*parsed_type[\s\S]*category\.is_active/i,
    );
    expect(completeProcessing).toMatch(
      /lower\s*\(category\.name\)\s*=\s*lower\s*\('Outros'\)/i,
    );
    expect(completeProcessing).toMatch(
      /insert\s+into\s+app_v2\.transactions[\s\S]*'whatsapp'[\s\S]*whatsapp_message_id[\s\S]*on\s+conflict\s*\(whatsapp_message_id\)[\s\S]*do\s+nothing/i,
    );
    expect(completeProcessing).toMatch(
      /insert\s+into\s+app_v2\.whatsapp_jobs[\s\S]*'send_message'[\s\S]*'instance'\s*,\s*linked_connection\.instance_name[\s\S]*phone_e164[\s\S]*on\s+conflict\s*\(message_id,\s*job_type\)[\s\S]*do\s+nothing/i,
    );
    expect(completeProcessing).not.toMatch(/'instance_name'\s*,/i);
    expect(completeProcessing).toMatch(
      /update\s+app_v2\.whatsapp_media[\s\S]*is_valid\s*=\s*false[\s\S]*expires_at\s*=\s*now\(\)[\s\S]*message_id\s*=\s*inbound_message\.id/i,
    );
    expect(completeProcessing).toMatch(
      /update\s+app_v2\.whatsapp_messages[\s\S]*body_redacted\s*=\s*'\[processed\]'[\s\S]*metadata_redacted\s*=\s*jsonb_build_object\s*\(\s*'type'[\s\S]*message_type[\s\S]*id\s*=\s*inbound_message\.id/i,
    );
    expect(completeProcessing).toMatch(
      /status\s*=\s*'completed'[\s\S]*locked_by\s*=\s*null[\s\S]*locked_at\s*=\s*null/i,
    );
    expect(sql).toMatch(
      /revoke\s+execute\s+on\s+function\s+app_v2\.complete_whatsapp_processing\(bigint,\s*timestamptz,\s*text,\s*jsonb\)\s+from\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+app_v2\.complete_whatsapp_processing\(bigint,\s*timestamptz,\s*text,\s*jsonb\)\s+to\s+service_role/i,
    );
  });

  it("fails exhausted leases and reclaims only eligible WhatsApp jobs", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const jobs = tableBody(sql, "whatsapp_jobs");
    const claimJobs = functionBody(sql, "claim_whatsapp_jobs");

    expect(jobs).toMatch(
      /check\s*\([\s\S]*status\s*=\s*'processing'[\s\S]*locked_at\s+is\s+not\s+null[\s\S]*locked_by\s+is\s+not\s+null[\s\S]*status\s*<>\s*'processing'[\s\S]*locked_at\s+is\s+null[\s\S]*locked_by\s+is\s+null/i,
    );
    expect(claimJobs).toMatch(
      /update\s+app_v2\.whatsapp_jobs[\s\S]*status\s*=\s*'failed'[\s\S]*locked_by\s*=\s*null[\s\S]*locked_at\s*=\s*null[\s\S]*status\s*=\s*'processing'[\s\S]*locked_at\s*<=?\s*now\(\)\s*-\s*interval\s*'5 minutes'[\s\S]*attempts\s*>=\s*job\.max_attempts/i,
    );
    expect(claimJobs.indexOf("status = 'failed'")).toBeLessThan(
      claimJobs.indexOf("with claimable as"),
    );

    expect(claimJobs).toMatch(
      /status\s*=\s*'processing'[\s\S]*locked_at\s*<=?\s*now\(\)\s*-\s*interval\s*'5 minutes'/i,
    );
    expect(claimJobs).toMatch(
      /attempts\s*<\s*job\.max_attempts[\s\S]*for\s+update\s+skip\s+locked/i,
    );
    expect(claimJobs).toMatch(
      /locked_by\s*=\s*claim_whatsapp_jobs\.worker_id[\s\S]*locked_at\s*=\s*now\(\)/i,
    );
  });

  it("updates WhatsApp report preferences only through an authorized RPC", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const updatePreferences = functionBody(sql, "update_whatsapp_preferences");
    const connectionGrants = grantsFor(
      sql,
      "authenticated",
      "app_v2.whatsapp_connections",
    ).join("\n");

    expect(sql).toMatch(
      /create\s+function\s+app_v2\.update_whatsapp_preferences\s*\(\s*space_id\s+uuid,\s*monthly_report_opt_in\s+boolean,\s*preferences\s+jsonb\s+default\s+'\{\}'::jsonb\s*\)/i,
    );
    expect(updatePreferences).toMatch(/caller_id\s+uuid\s*:=\s*\(select\s+auth\.uid\(\)\)/i);
    expect(updatePreferences).toMatch(
      /jsonb_typeof\s*\(update_whatsapp_preferences\.preferences\)\s*<>\s*'object'[\s\S]*pg_column_size\s*\(update_whatsapp_preferences\.preferences\)\s*>\s*8192/i,
    );
    expect(updatePreferences).toMatch(
      /connection\.linked_user_id\s*=\s*caller_id[\s\S]*app_private\.has_space_role\s*\([\s\S]*array\['owner',\s*'admin'\]/i,
    );
    expect(updatePreferences).toMatch(
      /order\s+by[\s\S]*connection\.linked_user_id\s*=\s*caller_id[\s\S]*connection\.status\s*=\s*'active'[\s\S]*connection\.created_at[\s\S]*connection\.id[\s\S]*for\s+update/i,
    );
    expect(updatePreferences).toMatch(
      /update\s+app_v2\.whatsapp_connections[\s\S]*monthly_report_opt_in\s*=\s*update_whatsapp_preferences\.monthly_report_opt_in[\s\S]*report_preferences\s*=\s*update_whatsapp_preferences\.preferences[\s\S]*updated_at\s*=\s*now\(\)/i,
    );
    expect(connectionGrants).not.toMatch(/\bupdate\b/i);
    expect(sql).toMatch(
      /revoke\s+execute\s+on\s+function\s+app_v2\.update_whatsapp_preferences\(uuid,\s*boolean,\s*jsonb\)\s+from\s+public,\s*anon,\s*service_role/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+app_v2\.update_whatsapp_preferences\(uuid,\s*boolean,\s*jsonb\)\s+to\s+authenticated/i,
    );
  });

  it("uses canonical AI categories and restricts WhatsApp Storage deletion", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const storageDeletePolicy = sql.match(
      /create\s+policy\s+whatsapp_inbox_member_delete[\s\S]*?\n\);/i,
    )?.[0];

    expect(storageDeletePolicy).toBeDefined();

    for (const [name, order] of [
      ["Alimentação", 10],
      ["Transporte", 20],
      ["Lazer", 30],
      ["Casa", 40],
      ["Saúde", 50],
      ["Outros", 60],
    ] as const) {
      expect(sql).toMatch(
        new RegExp(`'${name}',\\s*'expense',\\s*true,\\s*${order}`, "i"),
      );
    }
    expect(storageDeletePolicy).toMatch(
      /app_private\.has_space_role\s*\([\s\S]*array\['owner',\s*'admin'\]/i,
    );
    expect(storageDeletePolicy).not.toMatch(/from\s+app_v2\.space_members/i);
  });

  it("enqueues deterministic monthly reports once on Lisbon day 25", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const enqueueReports = functionBody(sql, "enqueue_whatsapp_monthly_reports");

    expect(sql).toMatch(
      /create\s+unique\s+index\s+whatsapp_jobs_report_id_uidx\s+on\s+app_v2\.whatsapp_jobs\s*\(\s*\(payload\s*->>\s*'report_id'\)\s*\)\s+where\s+job_type\s*=\s*'send_message'\s+and\s+payload\s*\?\s*'report_id'/i,
    );
    expect(sql).toMatch(
      /create\s+function\s+app_v2\.enqueue_whatsapp_monthly_reports\s*\(\s*reference_time\s+timestamptz\s+default\s+now\(\)\s*\)\s*returns\s+integer/i,
    );
    expect(enqueueReports).toMatch(
      /reference_time\s+at\s+time\s+zone\s+'Europe\/Lisbon'[\s\S]*extract\s*\(day[\s\S]*<>\s*25[\s\S]*return\s+0/i,
    );
    expect(enqueueReports).toMatch(
      /distinct\s+on\s*\(connection\.space_id\)[\s\S]*connection\.status\s*=\s*'active'[\s\S]*connection\.monthly_report_opt_in[\s\S]*connection\.instance_name\s+is\s+not\s+null[\s\S]*order\s+by\s+connection\.space_id,\s*connection\.created_at,\s*connection\.id/i,
    );
    expect(enqueueReports).toMatch(
      /transaction_row\.transaction_type\s*=\s*'expense'[\s\S]*transaction_row\.transaction_type\s*=\s*'income'[\s\S]*from\s+app_v2\.transactions/i,
    );
    expect(enqueueReports).toMatch(
      /from\s+app_v2\.transactions[\s\S]*transaction_row\.occurred_at\s*>=\s*period_start[\s\S]*transaction_row\.occurred_at\s*<=\s*enqueue_whatsapp_monthly_reports\.reference_time[\s\S]*transaction_row\.status\s*<>\s*'void'/i,
    );
    expect(enqueueReports).toMatch(
      /insert\s+into\s+app_v2\.whatsapp_monthly_reports[\s\S]*summary_redacted[\s\S]*values[\s\S]*'ready'[\s\S]*'scheduled'[\s\S]*on\s+conflict\s*\(space_id,\s*month\)\s+do\s+nothing/i,
    );
    expect(enqueueReports).toMatch(
      /insert\s+into\s+app_v2\.whatsapp_jobs[\s\S]*'send_message'[\s\S]*'instance'[\s\S]*'phone_e164'[\s\S]*'text'[\s\S]*'report_id'[\s\S]*on\s+conflict[\s\S]*do\s+nothing/i,
    );
    expect(sql).toMatch(
      /revoke\s+execute\s+on\s+function\s+app_v2\.enqueue_whatsapp_monthly_reports\(timestamptz\)\s+from\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+app_v2\.enqueue_whatsapp_monthly_reports\(timestamptz\)\s+to\s+service_role/i,
    );
  });

  it("marks monthly report delivery sent idempotently without regressing delivered", () => {
    const sql = readFileSync(resolve(migrationsDir, migrationFiles[0]), "utf8");
    const markSent = functionBody(sql, "mark_whatsapp_monthly_report_sent");

    expect(sql).toMatch(
      /create\s+function\s+app_v2\.mark_whatsapp_monthly_report_sent\s*\(\s*report_id\s+uuid\s*\)\s*returns\s+app_v2\.whatsapp_monthly_reports/i,
    );
    expect(markSent).toMatch(/for\s+update/i);
    expect(markSent).toMatch(
      /delivery_status\s*=\s*case[\s\S]*delivery_status\s*=\s*'delivered'[\s\S]*then\s+'delivered'[\s\S]*else\s+'sent'[\s\S]*delivery_attempted_at\s*=\s*coalesce\s*\([\s\S]*delivery_attempted_at,\s*now\(\)\)/i,
    );
    expect(sql).toMatch(
      /revoke\s+execute\s+on\s+function\s+app_v2\.mark_whatsapp_monthly_report_sent\(uuid\)\s+from\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+app_v2\.mark_whatsapp_monthly_report_sent\(uuid\)\s+to\s+service_role/i,
    );
  });
});
