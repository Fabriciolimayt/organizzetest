create schema app_v2;
create schema app_private;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

revoke all on schema app_v2 from public, anon, authenticated;
revoke all on schema app_private from public, anon, authenticated;
alter default privileges in schema app_v2 revoke execute on functions from public;
alter default privileges in schema app_private revoke execute on functions from public;

create type app_v2.space_kind as enum ('personal', 'family');
create type app_v2.member_role as enum ('owner', 'admin', 'member', 'viewer');
create type app_v2.invitation_status as enum ('pending', 'accepted', 'declined', 'expired', 'revoked');
create type app_v2.transaction_type as enum ('expense', 'income', 'transfer');
create type app_v2.transaction_source as enum ('app', 'whatsapp', 'import', 'recurring');
create type app_v2.transaction_status as enum ('pending', 'cleared', 'void');
create type app_v2.recurrence_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');
create type app_v2.connection_status as enum ('pending', 'active', 'disabled');
create type app_v2.message_direction as enum ('inbound', 'outbound');
create type app_v2.message_status as enum ('received', 'queued', 'processing', 'sent', 'delivered', 'read', 'failed');
create type app_v2.job_type as enum ('process_message', 'send_message', 'download_media', 'monthly_report');
create type app_v2.job_status as enum ('pending', 'processing', 'retry', 'completed', 'failed');
create type app_v2.report_status as enum ('pending', 'generating', 'ready', 'failed');
create type app_v2.subscription_status as enum ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');
create type app_v2.payment_event_status as enum ('pending', 'processed', 'failed', 'ignored');
create type app_v2.import_status as enum ('pending', 'processing', 'completed', 'partial', 'skipped', 'failed');

create table app_v2.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'pt-PT',
  currency varchar(3) not null default 'EUR' check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/Lisbon',
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_v2.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  kind app_v2.space_kind not null default 'personal',
  locale text not null default 'pt-PT',
  currency varchar(3) not null default 'EUR' check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/Lisbon',
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_user_id)
);

create table app_v2.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_v2.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, user_id)
);

create table app_v2.space_invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  role app_v2.member_role not null default 'member' check (role <> 'owner'),
  status app_v2.invitation_status not null default 'pending',
  token_hash bytea not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, invited_by) references app_v2.space_members(space_id, user_id),
  foreign key (space_id, accepted_by) references app_v2.space_members(space_id, user_id)
);

create table app_v2.categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  transaction_type app_v2.transaction_type not null default 'expense' check (transaction_type <> 'transfer'),
  color varchar(7) check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, transaction_type, name),
  unique (space_id, id)
);

create table app_v2.budget_plans (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  expected_income numeric(14,2) not null default 0 check (expected_income >= 0),
  is_active boolean not null default true,
  currency varchar(3) not null check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  foreign key (space_id, created_by) references app_v2.space_members(space_id, user_id)
);

create table app_v2.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  budget_plan_id uuid not null,
  category_id uuid not null,
  amount numeric(14,2) check (amount is null or amount >= 0),
  percentage numeric(5,2) check (percentage is null or percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_plan_id, category_id),
  check (amount is not null or percentage is not null),
  foreign key (space_id, budget_plan_id) references app_v2.budget_plans(space_id, id) on delete cascade,
  foreign key (space_id, category_id) references app_v2.categories(space_id, id) on delete cascade
);

create table app_v2.transactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  transaction_type app_v2.transaction_type not null,
  source app_v2.transaction_source not null default 'app',
  status app_v2.transaction_status not null default 'cleared',
  amount numeric(14,2) not null check (amount > 0),
  currency varchar(3) not null check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  description text,
  merchant text check (merchant is null or length(btrim(merchant)) between 1 and 120),
  whatsapp_message_id bigint,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  check (
    (source = 'whatsapp' and whatsapp_message_id is not null)
    or (source <> 'whatsapp' and whatsapp_message_id is null)
  ),
  foreign key (space_id, created_by) references app_v2.space_members(space_id, user_id),
  foreign key (space_id, category_id) references app_v2.categories(space_id, id)
);

create table app_v2.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  transaction_id uuid not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (length(btrim(storage_path)) > 0),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, transaction_id) references app_v2.transactions(space_id, id) on delete cascade,
  foreign key (space_id, uploaded_by) references app_v2.space_members(space_id, user_id)
);

create table app_v2.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  transaction_type app_v2.transaction_type not null,
  amount numeric(14,2) not null check (amount > 0),
  currency varchar(3) not null check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  description text,
  frequency app_v2.recurrence_frequency not null,
  interval_count integer not null default 1 check (interval_count > 0),
  next_run_at timestamptz not null,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= next_run_at),
  foreign key (space_id, created_by) references app_v2.space_members(space_id, user_id),
  foreign key (space_id, category_id) references app_v2.categories(space_id, id)
);

create table app_v2.spending_limits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  category_id uuid,
  amount numeric(14,2) not null check (amount > 0),
  currency varchar(3) not null check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  period app_v2.recurrence_frequency not null default 'monthly',
  starts_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, category_id) references app_v2.categories(space_id, id) on delete cascade
);

create table app_v2.financial_goals (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  currency varchar(3) not null check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  target_date date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, created_by) references app_v2.space_members(space_id, user_id)
);

create table app_v2.data_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  space_id uuid references app_v2.spaces(id) on delete cascade,
  import_key text not null check (length(btrim(import_key)) > 0),
  source text not null,
  status app_v2.import_status not null default 'pending',
  attempted_count integer not null default 0 check (attempted_count >= 0),
  imported_count integer not null default 0 check (imported_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, import_key),
  foreign key (space_id, user_id) references app_v2.space_members(space_id, user_id)
);

create table app_v2.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  linked_user_id uuid not null references auth.users(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^[+][1-9][0-9]{7,14}$'),
  provider text not null default 'evolution' check (provider = 'evolution'),
  instance_name text not null default 'organizze-bot',
  monthly_report_opt_in boolean not null default false,
  report_preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(report_preferences) = 'object'),
  status app_v2.connection_status not null default 'pending',
  verified_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  foreign key (space_id, linked_user_id) references app_v2.space_members(space_id, user_id)
);

create table app_v2.whatsapp_link_tokens (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  connection_id uuid not null,
  requested_by uuid not null references auth.users(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^[+][1-9][0-9]{7,14}$'),
  code_hash bytea not null,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 10),
  last_attempt_at timestamptz,
  blocked_at timestamptz,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, connection_id) references app_v2.whatsapp_connections(space_id, id) on delete cascade,
  foreign key (space_id, requested_by) references app_v2.space_members(space_id, user_id)
);

create table app_v2.whatsapp_messages (
  id bigint generated always as identity primary key,
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  connection_id uuid not null,
  direction app_v2.message_direction not null,
  status app_v2.message_status not null,
  external_message_id text,
  message_type text not null default 'text',
  body_redacted text,
  metadata_redacted jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata_redacted) = 'object'),
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  foreign key (space_id, connection_id) references app_v2.whatsapp_connections(space_id, id) on delete cascade
);

create table app_v2.whatsapp_media (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  message_id bigint not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  is_valid boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, message_id) references app_v2.whatsapp_messages(space_id, id) on delete cascade
);

create table app_v2.whatsapp_jobs (
  id bigint generated always as identity primary key,
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  message_id bigint,
  job_type app_v2.job_type not null,
  status app_v2.job_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  run_at timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attempts <= max_attempts),
  check (
    (
      status = 'processing'
      and locked_at is not null
      and locked_by is not null
    )
    or (
      status <> 'processing'
      and locked_at is null
      and locked_by is null
    )
  ),
  foreign key (space_id, message_id) references app_v2.whatsapp_messages(space_id, id) on delete cascade
);

create table app_v2.whatsapp_events (
  id bigint generated always as identity primary key,
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  message_id bigint,
  event_key text,
  event_type text not null,
  details_redacted jsonb not null default '{}'::jsonb check (jsonb_typeof(details_redacted) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, message_id) references app_v2.whatsapp_messages(space_id, id) on delete cascade
);

create table app_v2.whatsapp_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references app_v2.spaces(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  status app_v2.report_status not null default 'pending',
  scheduled_for timestamptz,
  generation_started_at timestamptz,
  generated_at timestamptz,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'scheduled', 'sent', 'delivered', 'failed', 'skipped')),
  delivery_attempted_at timestamptz,
  delivered_at timestamptz,
  storage_path text,
  summary_redacted jsonb not null default '{}'::jsonb check (jsonb_typeof(summary_redacted) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, month),
  foreign key (space_id, requested_by) references app_v2.space_members(space_id, user_id)
);

create table app_v2.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text unique,
  product_id text,
  price_id text,
  status app_v2.subscription_status not null default 'incomplete',
  amount numeric(14,2) check (amount is null or amount >= 0),
  currency varchar(3) check (currency is null or (currency = upper(currency) and currency ~ '^[A-Z]{3}$')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'live',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table app_v2.payment_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid,
  provider_event_id text not null unique,
  event_type text not null,
  status app_v2.payment_event_status not null default 'pending',
  payload_redacted jsonb not null default '{}'::jsonb check (jsonb_typeof(payload_redacted) = 'object'),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, subscription_id) references app_v2.subscriptions(user_id, id) on delete cascade
);

alter table app_v2.transactions
add constraint transactions_whatsapp_message_fk
foreign key (space_id, whatsapp_message_id)
references app_v2.whatsapp_messages(space_id, id);

create index spaces_owner_user_id_idx on app_v2.spaces (owner_user_id);
create index space_members_space_id_idx on app_v2.space_members (space_id);
create index space_members_user_id_idx on app_v2.space_members (user_id);
create unique index space_members_one_owner_uidx on app_v2.space_members (space_id) where role = 'owner';
create index space_invitations_space_id_idx on app_v2.space_invitations (space_id);
create index space_invitations_invited_by_idx on app_v2.space_invitations (invited_by);
create index space_invitations_accepted_by_idx on app_v2.space_invitations (accepted_by) where accepted_by is not null;
create index space_invitations_space_invited_by_idx on app_v2.space_invitations (space_id, invited_by);
create index space_invitations_space_accepted_by_idx on app_v2.space_invitations (space_id, accepted_by) where accepted_by is not null;
create index categories_space_id_idx on app_v2.categories (space_id);
create index budget_plans_space_id_idx on app_v2.budget_plans (space_id);
create index budget_plans_created_by_idx on app_v2.budget_plans (created_by);
create index budget_plans_space_created_by_idx on app_v2.budget_plans (space_id, created_by);
create index budget_allocations_plan_id_idx on app_v2.budget_allocations (space_id, budget_plan_id);
create index budget_allocations_category_id_idx on app_v2.budget_allocations (space_id, category_id);
create index transactions_space_occurred_idx on app_v2.transactions (space_id, occurred_at desc);
create index transactions_created_by_idx on app_v2.transactions (created_by);
create index transactions_category_id_idx on app_v2.transactions (category_id) where category_id is not null;
create index transactions_space_created_by_idx on app_v2.transactions (space_id, created_by);
create index transactions_space_category_idx on app_v2.transactions (space_id, category_id) where category_id is not null;
create index transactions_space_whatsapp_message_idx on app_v2.transactions (space_id, whatsapp_message_id) where whatsapp_message_id is not null;
create unique index transactions_whatsapp_message_uidx on app_v2.transactions (whatsapp_message_id) where whatsapp_message_id is not null;
create index transaction_attachments_transaction_id_idx on app_v2.transaction_attachments (transaction_id);
create index transaction_attachments_uploaded_by_idx on app_v2.transaction_attachments (uploaded_by);
create index transaction_attachments_space_transaction_idx on app_v2.transaction_attachments (space_id, transaction_id);
create index transaction_attachments_space_uploader_idx on app_v2.transaction_attachments (space_id, uploaded_by);
create index recurring_rules_space_id_idx on app_v2.recurring_rules (space_id);
create index recurring_rules_created_by_idx on app_v2.recurring_rules (created_by);
create index recurring_rules_category_id_idx on app_v2.recurring_rules (category_id) where category_id is not null;
create index recurring_rules_space_created_by_idx on app_v2.recurring_rules (space_id, created_by);
create index recurring_rules_space_category_idx on app_v2.recurring_rules (space_id, category_id) where category_id is not null;
create index spending_limits_space_id_idx on app_v2.spending_limits (space_id);
create index spending_limits_category_id_idx on app_v2.spending_limits (category_id) where category_id is not null;
create index spending_limits_space_category_idx on app_v2.spending_limits (space_id, category_id) where category_id is not null;
create index financial_goals_space_id_idx on app_v2.financial_goals (space_id);
create index financial_goals_created_by_idx on app_v2.financial_goals (created_by);
create index financial_goals_space_created_by_idx on app_v2.financial_goals (space_id, created_by);
create index data_imports_user_id_idx on app_v2.data_imports (user_id) where user_id is not null;
create index data_imports_space_id_idx on app_v2.data_imports (space_id) where space_id is not null;
create index data_imports_space_user_idx on app_v2.data_imports (space_id, user_id) where space_id is not null and user_id is not null;
create unique index data_imports_unowned_key_uidx on app_v2.data_imports (import_key) where user_id is null;
create index whatsapp_connections_space_id_idx on app_v2.whatsapp_connections (space_id);
create index whatsapp_connections_linked_user_idx on app_v2.whatsapp_connections (linked_user_id);
create index whatsapp_connections_space_linked_user_idx on app_v2.whatsapp_connections (space_id, linked_user_id);
create unique index whatsapp_connections_active_phone_uidx on app_v2.whatsapp_connections (phone_e164) where status = 'active';
create index whatsapp_connections_instance_phone_idx on app_v2.whatsapp_connections (instance_name, phone_e164);
create unique index whatsapp_connections_live_space_phone_uidx on app_v2.whatsapp_connections (space_id, phone_e164) where status in ('pending', 'active');
create index whatsapp_link_tokens_space_id_idx on app_v2.whatsapp_link_tokens (space_id);
create index whatsapp_link_tokens_connection_id_idx on app_v2.whatsapp_link_tokens (connection_id);
create index whatsapp_link_tokens_requested_by_idx on app_v2.whatsapp_link_tokens (requested_by);
create index whatsapp_link_tokens_space_requested_by_idx on app_v2.whatsapp_link_tokens (space_id, requested_by);
create index whatsapp_link_tokens_space_connection_idx on app_v2.whatsapp_link_tokens (space_id, connection_id);
create unique index whatsapp_link_tokens_active_link_uidx on app_v2.whatsapp_link_tokens (space_id, phone_e164) where consumed_at is null;
create unique index whatsapp_link_tokens_active_code_hash_uidx on app_v2.whatsapp_link_tokens (code_hash) where consumed_at is null;
create index whatsapp_messages_space_id_idx on app_v2.whatsapp_messages (space_id);
create index whatsapp_messages_connection_id_idx on app_v2.whatsapp_messages (connection_id);
create index whatsapp_messages_space_connection_idx on app_v2.whatsapp_messages (space_id, connection_id);
create unique index whatsapp_messages_external_id_uidx on app_v2.whatsapp_messages (connection_id, external_message_id) where external_message_id is not null;
create index whatsapp_media_space_id_idx on app_v2.whatsapp_media (space_id);
create index whatsapp_media_message_id_idx on app_v2.whatsapp_media (message_id);
create index whatsapp_media_space_message_idx on app_v2.whatsapp_media (space_id, message_id);
create index whatsapp_jobs_space_status_run_idx on app_v2.whatsapp_jobs (space_id, status, run_at);
create index whatsapp_jobs_message_id_idx on app_v2.whatsapp_jobs (message_id) where message_id is not null;
create index whatsapp_jobs_space_message_idx on app_v2.whatsapp_jobs (space_id, message_id) where message_id is not null;
create unique index whatsapp_jobs_message_type_uidx on app_v2.whatsapp_jobs (message_id, job_type) where message_id is not null;
create unique index whatsapp_jobs_report_id_uidx on app_v2.whatsapp_jobs ((payload ->> 'report_id')) where job_type = 'send_message' and payload ? 'report_id';
create index whatsapp_events_space_created_idx on app_v2.whatsapp_events (space_id, created_at desc);
create unique index whatsapp_events_space_event_key_uidx on app_v2.whatsapp_events (space_id, event_key) where event_key is not null;
create index whatsapp_events_message_id_idx on app_v2.whatsapp_events (message_id) where message_id is not null;
create index whatsapp_events_space_message_idx on app_v2.whatsapp_events (space_id, message_id) where message_id is not null;
create index whatsapp_monthly_reports_space_id_idx on app_v2.whatsapp_monthly_reports (space_id);
create index whatsapp_monthly_reports_requested_by_idx on app_v2.whatsapp_monthly_reports (requested_by) where requested_by is not null;
create index whatsapp_monthly_reports_space_requester_idx on app_v2.whatsapp_monthly_reports (space_id, requested_by) where requested_by is not null;
create index subscriptions_user_id_idx on app_v2.subscriptions (user_id);
create index payment_events_user_id_idx on app_v2.payment_events (user_id);
create index payment_events_subscription_id_idx on app_v2.payment_events (subscription_id) where subscription_id is not null;
create index payment_events_user_subscription_idx on app_v2.payment_events (user_id, subscription_id) where subscription_id is not null;

create function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function app_private.whatsapp_message_status_rank(target_status app_v2.message_status)
returns integer
language sql
immutable
strict
set search_path = ''
as $$
  select case target_status
    when 'received' then 10
    when 'queued' then 10
    when 'processing' then 20
    when 'sent' then 30
    when 'delivered' then 40
    when 'read' then 50
    when 'failed' then 0
  end;
$$;

create function app_private.enforce_whatsapp_message_status_monotonic()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'read' then
    new.status := old.status;
  elsif old.status = 'delivered' and new.status <> 'read' then
    new.status := old.status;
  elsif old.status = 'failed' then
    if new.status not in ('delivered', 'read') then
      new.status := old.status;
    end if;
  elsif new.status = 'failed' then
    if old.status not in ('queued', 'processing', 'sent') then
      new.status := old.status;
    end if;
  elsif app_private.whatsapp_message_status_rank(new.status)
    <= app_private.whatsapp_message_status_rank(old.status) then
    new.status := old.status;
  end if;

  return new;
end;
$$;

create function app_private.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app_v2.space_members member
      where member.space_id = target_space_id
        and member.user_id = (select auth.uid())
    );
$$;

create function app_private.has_space_role(
  target_space_id uuid,
  allowed_roles app_v2.member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app_v2.space_members member
      where member.space_id = target_space_id
        and member.user_id = (select auth.uid())
        and member.role = any(allowed_roles)
    );
$$;

create function app_private.can_read_budget_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app_v2.budget_plans plan
      join app_v2.space_members member on member.space_id = plan.space_id
      where plan.id = target_plan_id
        and member.user_id = (select auth.uid())
    );
$$;

create function app_private.can_write_budget_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app_v2.budget_plans plan
      join app_v2.space_members member on member.space_id = plan.space_id
      where plan.id = target_plan_id
        and member.user_id = (select auth.uid())
        and member.role = any(array['owner', 'admin', 'member']::app_v2.member_role[])
    );
$$;

create function app_private.can_read_transaction(target_transaction_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app_v2.transactions transaction_row
      join app_v2.space_members member on member.space_id = transaction_row.space_id
      where transaction_row.id = target_transaction_id
        and member.user_id = (select auth.uid())
    );
$$;

create function app_private.can_write_transaction(target_transaction_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from app_v2.transactions transaction_row
      join app_v2.space_members member on member.space_id = transaction_row.space_id
      where transaction_row.id = target_transaction_id
        and member.user_id = (select auth.uid())
        and member.role = any(array['owner', 'admin', 'member']::app_v2.member_role[])
    );
$$;

create function app_private.enforce_immutable_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  column_name text;
begin
  foreach column_name in array tg_argv
  loop
    if to_jsonb(new) -> column_name is distinct from to_jsonb(old) -> column_name then
      raise exception '% is immutable on %.%', column_name, tg_table_schema, tg_table_name
        using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

create function app_private.enforce_space_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_space_id uuid;
  expected_owner uuid;
  membership_owner uuid;
  owner_count integer;
begin
  if tg_table_name = 'spaces' then
    target_space_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    target_space_id := case when tg_op = 'DELETE' then old.space_id else new.space_id end;
  end if;

  select space.owner_user_id into expected_owner
  from app_v2.spaces space
  where space.id = target_space_id;

  if not found then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select count(*)::integer, min(member.user_id::text)::uuid
  into owner_count, membership_owner
  from app_v2.space_members member
  where member.space_id = target_space_id
    and member.role = 'owner';

  if owner_count <> 1 or membership_owner is distinct from expected_owner then
    raise exception 'space ownership must match exactly one owner membership'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  personal_space_id uuid;
begin
  insert into app_v2.profiles (user_id, display_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''));

  insert into app_v2.spaces (owner_user_id, name, kind)
  values (new.id, 'Meu espaço', 'personal')
  returning id into personal_space_id;

  insert into app_v2.space_members (space_id, user_id, role)
  values (personal_space_id, new.id, 'owner');

  insert into app_v2.categories (space_id, name, transaction_type, is_system, sort_order)
  values
    (personal_space_id, 'Alimentação', 'expense', true, 10),
    (personal_space_id, 'Transporte', 'expense', true, 20),
    (personal_space_id, 'Lazer', 'expense', true, 30),
    (personal_space_id, 'Casa', 'expense', true, 40),
    (personal_space_id, 'Saúde', 'expense', true, 50),
    (personal_space_id, 'Outros', 'expense', true, 60);

  return new;
end;
$$;

create trigger create_app_v2_user
after insert on auth.users
for each row execute function app_private.handle_new_user();

create constraint trigger spaces_ownership_consistency
after insert or update on app_v2.spaces
deferrable initially deferred
for each row execute function app_private.enforce_space_ownership();

create constraint trigger space_members_ownership_consistency
after insert or update or delete on app_v2.space_members
deferrable initially deferred
for each row execute function app_private.enforce_space_ownership();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'spaces', 'space_members', 'space_invitations', 'categories',
    'budget_plans', 'budget_allocations', 'transactions', 'transaction_attachments',
    'recurring_rules', 'spending_limits', 'financial_goals', 'data_imports',
    'whatsapp_connections', 'whatsapp_link_tokens', 'whatsapp_messages',
    'whatsapp_media', 'whatsapp_jobs', 'whatsapp_events', 'whatsapp_monthly_reports',
    'subscriptions', 'payment_events'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on app_v2.%I for each row execute function app_private.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create trigger space_members_immutable before update on app_v2.space_members
for each row execute function app_private.enforce_immutable_columns('space_id', 'user_id');
create trigger space_invitations_immutable before update on app_v2.space_invitations
for each row execute function app_private.enforce_immutable_columns('space_id', 'invited_by');
create trigger budget_plans_immutable before update on app_v2.budget_plans
for each row execute function app_private.enforce_immutable_columns('space_id', 'created_by');
create trigger budget_allocations_immutable before update on app_v2.budget_allocations
for each row execute function app_private.enforce_immutable_columns('space_id', 'budget_plan_id', 'category_id');
create trigger transactions_immutable before update on app_v2.transactions
for each row execute function app_private.enforce_immutable_columns('space_id', 'created_by', 'whatsapp_message_id');
create trigger transaction_attachments_immutable before update on app_v2.transaction_attachments
for each row execute function app_private.enforce_immutable_columns('space_id', 'transaction_id', 'uploaded_by');
create trigger recurring_rules_immutable before update on app_v2.recurring_rules
for each row execute function app_private.enforce_immutable_columns('space_id', 'created_by');
create trigger spending_limits_immutable before update on app_v2.spending_limits
for each row execute function app_private.enforce_immutable_columns('space_id');
create trigger financial_goals_immutable before update on app_v2.financial_goals
for each row execute function app_private.enforce_immutable_columns('space_id', 'created_by');
create trigger data_imports_immutable before update on app_v2.data_imports
for each row execute function app_private.enforce_immutable_columns('space_id', 'user_id', 'import_key');
create trigger whatsapp_connections_immutable before update on app_v2.whatsapp_connections
for each row execute function app_private.enforce_immutable_columns('space_id', 'linked_user_id', 'phone_e164');
create trigger whatsapp_link_tokens_immutable before update on app_v2.whatsapp_link_tokens
for each row execute function app_private.enforce_immutable_columns('space_id', 'connection_id', 'requested_by', 'phone_e164', 'code_hash');
create trigger whatsapp_messages_immutable before update on app_v2.whatsapp_messages
for each row execute function app_private.enforce_immutable_columns('space_id', 'connection_id');
create trigger whatsapp_messages_status_monotonic before update on app_v2.whatsapp_messages
for each row execute function app_private.enforce_whatsapp_message_status_monotonic();
create trigger whatsapp_media_immutable before update on app_v2.whatsapp_media
for each row execute function app_private.enforce_immutable_columns('space_id', 'message_id');
create trigger whatsapp_jobs_immutable before update on app_v2.whatsapp_jobs
for each row execute function app_private.enforce_immutable_columns('space_id', 'message_id');
create trigger whatsapp_events_immutable before update on app_v2.whatsapp_events
for each row execute function app_private.enforce_immutable_columns('space_id', 'message_id', 'event_key');
create trigger whatsapp_monthly_reports_immutable before update on app_v2.whatsapp_monthly_reports
for each row execute function app_private.enforce_immutable_columns('space_id', 'requested_by', 'month');
create trigger subscriptions_immutable before update on app_v2.subscriptions
for each row execute function app_private.enforce_immutable_columns('user_id');
create trigger payment_events_immutable before update on app_v2.payment_events
for each row execute function app_private.enforce_immutable_columns('user_id', 'subscription_id', 'provider_event_id');
revoke execute on function app_private.whatsapp_message_status_rank(app_v2.message_status) from public, anon, authenticated, service_role;
revoke execute on function app_private.enforce_whatsapp_message_status_monotonic() from public, anon, authenticated, service_role;
revoke execute on function app_private.is_space_member(uuid) from public, anon, service_role;
revoke execute on function app_private.has_space_role(uuid, app_v2.member_role[]) from public, anon, service_role;
revoke execute on function app_private.can_read_budget_plan(uuid) from public, anon, service_role;
revoke execute on function app_private.can_write_budget_plan(uuid) from public, anon, service_role;
revoke execute on function app_private.can_read_transaction(uuid) from public, anon, service_role;
revoke execute on function app_private.can_write_transaction(uuid) from public, anon, service_role;
revoke execute on function app_private.enforce_immutable_columns() from public, anon, authenticated, service_role;
revoke execute on function app_private.enforce_space_ownership() from public, anon, authenticated, service_role;
grant execute on function app_private.is_space_member(uuid) to authenticated;
grant execute on function app_private.has_space_role(uuid, app_v2.member_role[]) to authenticated;
grant execute on function app_private.can_read_budget_plan(uuid) to authenticated;
grant execute on function app_private.can_write_budget_plan(uuid) to authenticated;
grant execute on function app_private.can_read_transaction(uuid) to authenticated;
grant execute on function app_private.can_write_transaction(uuid) to authenticated;

revoke execute on function app_private.handle_new_user() from public, anon, authenticated, service_role;
alter table app_v2.profiles enable row level security;
alter table app_v2.spaces enable row level security;
alter table app_v2.space_members enable row level security;
alter table app_v2.space_invitations enable row level security;
alter table app_v2.categories enable row level security;
alter table app_v2.budget_plans enable row level security;
alter table app_v2.budget_allocations enable row level security;
alter table app_v2.transactions enable row level security;
alter table app_v2.transaction_attachments enable row level security;
alter table app_v2.recurring_rules enable row level security;
alter table app_v2.spending_limits enable row level security;
alter table app_v2.financial_goals enable row level security;
alter table app_v2.data_imports enable row level security;
alter table app_v2.whatsapp_connections enable row level security;
alter table app_v2.whatsapp_link_tokens enable row level security;
alter table app_v2.whatsapp_messages enable row level security;
alter table app_v2.whatsapp_media enable row level security;
alter table app_v2.whatsapp_jobs enable row level security;
alter table app_v2.whatsapp_events enable row level security;
alter table app_v2.whatsapp_monthly_reports enable row level security;
alter table app_v2.subscriptions enable row level security;
alter table app_v2.payment_events enable row level security;

create policy profiles_select_self on app_v2.profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy profiles_insert_self on app_v2.profiles for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy profiles_update_self on app_v2.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy profiles_delete_self on app_v2.profiles for delete to authenticated
using ((select auth.uid()) = user_id);

create policy spaces_select_member on app_v2.spaces for select to authenticated
using ((select app_private.is_space_member(id)));
create policy spaces_insert_owner on app_v2.spaces for insert to authenticated
with check ((select auth.uid()) = owner_user_id);
create policy spaces_update_admin on app_v2.spaces for update to authenticated
using ((select app_private.has_space_role(id, array['owner', 'admin']::app_v2.member_role[])))
with check ((select app_private.has_space_role(id, array['owner', 'admin']::app_v2.member_role[])));
create policy spaces_delete_admin on app_v2.spaces for delete to authenticated
using ((select app_private.has_space_role(id, array['owner', 'admin']::app_v2.member_role[])));

create policy space_members_select_member on app_v2.space_members for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy space_members_insert_admin on app_v2.space_members for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));
create policy space_members_update_admin on app_v2.space_members for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));
create policy space_members_delete_admin on app_v2.space_members for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));

create policy space_invitations_select_admin on app_v2.space_invitations for select to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));
create policy space_invitations_insert_admin on app_v2.space_invitations for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])) and invited_by = (select auth.uid()));
create policy space_invitations_update_admin on app_v2.space_invitations for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));
create policy space_invitations_delete_admin on app_v2.space_invitations for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));

create policy categories_select_member on app_v2.categories for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy categories_insert_writer on app_v2.categories for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy categories_update_writer on app_v2.categories for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy categories_delete_writer on app_v2.categories for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));

create policy budget_plans_select_member on app_v2.budget_plans for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy budget_plans_insert_writer on app_v2.budget_plans for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])) and created_by = (select auth.uid()));
create policy budget_plans_update_writer on app_v2.budget_plans for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy budget_plans_delete_writer on app_v2.budget_plans for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));

create policy budget_allocations_select_member on app_v2.budget_allocations for select to authenticated
using ((select app_private.can_read_budget_plan(budget_plan_id)));
create policy budget_allocations_insert_writer on app_v2.budget_allocations for insert to authenticated
with check ((select app_private.can_write_budget_plan(budget_plan_id)));
create policy budget_allocations_update_writer on app_v2.budget_allocations for update to authenticated
using ((select app_private.can_write_budget_plan(budget_plan_id)))
with check ((select app_private.can_write_budget_plan(budget_plan_id)));
create policy budget_allocations_delete_writer on app_v2.budget_allocations for delete to authenticated
using ((select app_private.can_write_budget_plan(budget_plan_id)));

create policy transactions_select_member on app_v2.transactions for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy transactions_insert_writer on app_v2.transactions for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])) and created_by = (select auth.uid()));
create policy transactions_update_writer on app_v2.transactions for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy transactions_delete_writer on app_v2.transactions for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));

create policy transaction_attachments_select_member on app_v2.transaction_attachments for select to authenticated
using ((select app_private.can_read_transaction(transaction_id)));
create policy transaction_attachments_insert_writer on app_v2.transaction_attachments for insert to authenticated
with check ((select app_private.can_write_transaction(transaction_id)) and uploaded_by = (select auth.uid()));
create policy transaction_attachments_update_writer on app_v2.transaction_attachments for update to authenticated
using ((select app_private.can_write_transaction(transaction_id)))
with check ((select app_private.can_write_transaction(transaction_id)));
create policy transaction_attachments_delete_writer on app_v2.transaction_attachments for delete to authenticated
using ((select app_private.can_write_transaction(transaction_id)));

create policy recurring_rules_select_member on app_v2.recurring_rules for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy recurring_rules_insert_writer on app_v2.recurring_rules for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])) and created_by = (select auth.uid()));
create policy recurring_rules_update_writer on app_v2.recurring_rules for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy recurring_rules_delete_writer on app_v2.recurring_rules for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));

create policy spending_limits_select_member on app_v2.spending_limits for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy spending_limits_insert_writer on app_v2.spending_limits for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy spending_limits_update_writer on app_v2.spending_limits for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy spending_limits_delete_writer on app_v2.spending_limits for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));

create policy financial_goals_select_member on app_v2.financial_goals for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy financial_goals_insert_writer on app_v2.financial_goals for insert to authenticated
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])) and created_by = (select auth.uid()));
create policy financial_goals_update_writer on app_v2.financial_goals for update to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])))
with check ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy financial_goals_delete_writer on app_v2.financial_goals for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));

create policy data_imports_select_self on app_v2.data_imports for select to authenticated
using ((select auth.uid()) = user_id);
create policy data_imports_insert_self on app_v2.data_imports for insert to authenticated
with check ((select auth.uid()) = user_id and (select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy data_imports_update_self on app_v2.data_imports for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and (select app_private.has_space_role(space_id, array['owner', 'admin', 'member']::app_v2.member_role[])));
create policy data_imports_delete_self on app_v2.data_imports for delete to authenticated
using ((select auth.uid()) = user_id);

create policy whatsapp_connections_select_admin on app_v2.whatsapp_connections for select to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));

create policy whatsapp_link_tokens_select_admin on app_v2.whatsapp_link_tokens for select to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])) and requested_by = (select auth.uid()));

create policy whatsapp_messages_select_member on app_v2.whatsapp_messages for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy whatsapp_media_select_member on app_v2.whatsapp_media for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy whatsapp_media_delete_admin on app_v2.whatsapp_media for delete to authenticated
using ((select app_private.has_space_role(space_id, array['owner', 'admin']::app_v2.member_role[])));
create policy whatsapp_events_select_member on app_v2.whatsapp_events for select to authenticated
using ((select app_private.is_space_member(space_id)));
create policy whatsapp_monthly_reports_select_member on app_v2.whatsapp_monthly_reports for select to authenticated
using ((select app_private.is_space_member(space_id)));

create policy subscriptions_select_self on app_v2.subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
create policy payment_events_select_self on app_v2.payment_events for select to authenticated
using ((select auth.uid()) = user_id);

create view app_v2.monthly_spending_summary
with (security_invoker = true)
as
select
  transaction_row.space_id,
  date_trunc('month', transaction_row.occurred_at)::date as month,
  transaction_row.currency,
  transaction_row.category_id,
  transaction_row.transaction_type,
  sum(transaction_row.amount)::numeric(14,2) as total_amount,
  count(*)::bigint as transaction_count
from app_v2.transactions transaction_row
where transaction_row.deleted_at is null
  and transaction_row.status <> 'void'
group by
  transaction_row.space_id,
  date_trunc('month', transaction_row.occurred_at)::date,
  transaction_row.currency,
  transaction_row.category_id,
  transaction_row.transaction_type;

create function app_v2.create_space(
  name text,
  kind app_v2.space_kind default 'family'
)
returns app_v2.spaces
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_profile app_v2.profiles%rowtype;
  created_space app_v2.spaces%rowtype;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if name is null or length(btrim(name)) not between 1 and 120 then
    raise exception 'space name is invalid' using errcode = '22023';
  end if;

  select profile.* into caller_profile
  from app_v2.profiles profile
  where profile.user_id = caller_id;

  if not found then
    raise exception 'profile is not ready' using errcode = '55000';
  end if;

  insert into app_v2.spaces (
    owner_user_id, name, kind, locale, currency, timezone
  ) values (
    caller_id,
    btrim(create_space.name),
    create_space.kind,
    caller_profile.locale,
    caller_profile.currency,
    caller_profile.timezone
  ) returning * into created_space;

  insert into app_v2.space_members (space_id, user_id, role)
  values (created_space.id, caller_id, 'owner');

  return created_space;
end;
$$;

create function app_v2.accept_space_invitation(token text)
returns app_v2.space_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text;
  invitation app_v2.space_invitations%rowtype;
  accepted_membership app_v2.space_members%rowtype;
begin
  if caller_id is null or token is null or btrim(token) = '' then
    raise exception 'invitation is invalid or unavailable' using errcode = '22023';
  end if;

  select lower(auth_user.email)
  into caller_email
  from auth.users auth_user
  where auth_user.id = caller_id;

  select candidate.*
  into invitation
  from app_v2.space_invitations candidate
  where candidate.token_hash = extensions.digest(token, 'sha256')
    and candidate.status = 'pending'
    and candidate.expires_at > now()
    and candidate.role <> 'owner'
  for update;

  if not found
    or caller_email is null
    or lower(invitation.email) <> caller_email then
    raise exception 'invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if exists (
    select 1
    from app_v2.space_members member
    where member.space_id = invitation.space_id
      and member.user_id = caller_id
  ) then
    raise exception 'invitation is invalid or unavailable' using errcode = '22023';
  end if;

  begin
    insert into app_v2.space_members (space_id, user_id, role)
    values (invitation.space_id, caller_id, invitation.role)
    returning * into accepted_membership;
  exception when unique_violation then
    raise exception 'invitation is invalid or unavailable' using errcode = '22023';
  end;

  update app_v2.space_invitations candidate
  set status = 'accepted',
      accepted_by = caller_id,
      accepted_at = now()
  where candidate.id = invitation.id;

  return accepted_membership;
end;
$$;

create function app_v2.transfer_space_ownership(space_id uuid, new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  current_owner_id uuid;
begin
  select space.owner_user_id
  into current_owner_id
  from app_v2.spaces space
  where space.id = transfer_space_ownership.space_id
  for update;

  if not found or caller_id is null or caller_id <> current_owner_id then
    raise exception 'only the current owner may transfer ownership'
      using errcode = '42501';
  end if;

  if new_owner_id = current_owner_id or not exists (
    select 1 from app_v2.space_members member
    where member.space_id = transfer_space_ownership.space_id
      and member.user_id = transfer_space_ownership.new_owner_id
  ) then
    raise exception 'new owner must be a different existing member'
      using errcode = '22023';
  end if;

  update app_v2.space_members member
  set role = 'admin'
  where member.space_id = transfer_space_ownership.space_id
    and member.user_id = current_owner_id;

  update app_v2.space_members member
  set role = 'owner'
  where member.space_id = transfer_space_ownership.space_id
    and member.user_id = transfer_space_ownership.new_owner_id;

  update app_v2.spaces space
  set owner_user_id = transfer_space_ownership.new_owner_id
  where space.id = transfer_space_ownership.space_id;
end;
$$;

create function app_v2.create_whatsapp_link(phone_e164 text, space_id uuid)
returns table (code text, expires_at timestamptz, instance_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  provisioned_connection app_v2.whatsapp_connections%rowtype;
  provisioned_connection_id uuid;
  provisioned_instance_name text;
  random_bytes bytea;
  generated_code text;
  token_expires_at timestamptz := now() + interval '10 minutes';
  token_id uuid;
  generation_attempt integer;
begin
  if caller_id is null or not app_private.has_space_role(
    space_id,
    array['owner', 'admin']::app_v2.member_role[]
  ) then
    raise exception 'not authorized to manage WhatsApp links for this space'
      using errcode = '42501';
  end if;

  if phone_e164 is null or phone_e164 !~ '^[+][1-9][0-9]{7,14}$' then
    raise exception 'phone_e164 must use E.164 format'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(create_whatsapp_link.phone_e164, 0));
  perform pg_advisory_xact_lock(hashtextextended(
    create_whatsapp_link.space_id::text || ':' || create_whatsapp_link.phone_e164,
    0
  ));

  update app_v2.whatsapp_link_tokens token
  set consumed_at = now()
  where token.space_id = create_whatsapp_link.space_id
    and token.phone_e164 = create_whatsapp_link.phone_e164
    and token.consumed_at is null;

  select connection.instance_name
  into provisioned_instance_name
  from app_v2.whatsapp_connections connection
  where connection.provider = 'evolution'
    and connection.instance_name is not null
  order by connection.created_at, connection.id
  limit 1;

  provisioned_instance_name := coalesce(provisioned_instance_name, 'organizze-bot');

  select connection.*
  into provisioned_connection
  from app_v2.whatsapp_connections connection
  where connection.space_id = create_whatsapp_link.space_id
    and connection.phone_e164 = create_whatsapp_link.phone_e164
    and connection.status in ('pending', 'active')
  for update;

  if found and provisioned_connection.linked_user_id <> caller_id then
    if provisioned_connection.status = 'active' then
      raise exception 'phone is already linked to another active connection'
        using errcode = '23505';
    end if;

    update app_v2.whatsapp_connections connection
    set status = 'disabled',
        updated_at = now()
    where connection.id = provisioned_connection.id;
    provisioned_connection.id := null;
  end if;

  if provisioned_connection.id is null then
    provisioned_connection_id := extensions.gen_random_uuid();

    insert into app_v2.whatsapp_connections (
      id,
      space_id,
      linked_user_id,
      phone_e164,
      instance_name,
      status
    ) values (
      provisioned_connection_id,
      create_whatsapp_link.space_id,
      caller_id,
      create_whatsapp_link.phone_e164,
      provisioned_instance_name,
      'pending'
    )
    returning * into provisioned_connection;
  else
    provisioned_connection_id := provisioned_connection.id;
    provisioned_instance_name := provisioned_connection.instance_name;
  end if;

  for generation_attempt in 1..10
  loop
    random_bytes := extensions.gen_random_bytes(4);
    generated_code := lpad((
      (
        get_byte(random_bytes, 0)::bigint * 16777216
        + get_byte(random_bytes, 1) * 65536
        + get_byte(random_bytes, 2) * 256
        + get_byte(random_bytes, 3)
      ) % 1000000
    )::text, 6, '0');

    begin
      insert into app_v2.whatsapp_link_tokens (
        space_id, connection_id, requested_by, phone_e164, code_hash, expires_at
      ) values (
        create_whatsapp_link.space_id,
        provisioned_connection_id,
        caller_id,
        create_whatsapp_link.phone_e164,
        extensions.digest(generated_code, 'sha256'),
        token_expires_at
      ) returning id into token_id;
      exit;
    exception when unique_violation then
      token_id := null;
      update app_v2.whatsapp_link_tokens token
      set consumed_at = now()
      where token.space_id = create_whatsapp_link.space_id
        and token.phone_e164 = create_whatsapp_link.phone_e164
        and token.consumed_at is null;
    end;
  end loop;

  if token_id is null then
    raise exception 'could not allocate a unique WhatsApp link code'
      using errcode = '23505';
  end if;

  return query select generated_code, token_expires_at, provisioned_instance_name;
end;
$$;

create function app_v2.consume_whatsapp_link(code text, phone_e164 text)
returns app_v2.whatsapp_connections
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  matched_token app_v2.whatsapp_link_tokens%rowtype;
  connection app_v2.whatsapp_connections%rowtype;
begin
  if code is null or phone_e164 is null or phone_e164 !~ '^[+][1-9][0-9]{7,14}$' then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(consume_whatsapp_link.phone_e164, 0));

  select token.*
  into matched_token
  from app_v2.whatsapp_link_tokens token
  where token.code_hash = extensions.digest(code, 'sha256')
    and token.phone_e164 = consume_whatsapp_link.phone_e164
    and token.expires_at > now()
    and token.consumed_at is null
    and token.blocked_at is null
    and token.attempts < token.max_attempts
  for update;

  if not found then
    update app_v2.whatsapp_link_tokens token
    set attempts = least(token.attempts + 1, token.max_attempts),
        last_attempt_at = now(),
        blocked_at = case
          when token.attempts + 1 >= token.max_attempts then now()
          else token.blocked_at
        end
    where token.phone_e164 = consume_whatsapp_link.phone_e164
      and token.expires_at > now()
      and token.consumed_at is null
      and token.blocked_at is null;
    return null;
  end if;

  select existing_connection.*
  into connection
  from app_v2.whatsapp_connections existing_connection
  where existing_connection.id = matched_token.connection_id
    and existing_connection.space_id = matched_token.space_id
    and existing_connection.linked_user_id = matched_token.requested_by
    and existing_connection.phone_e164 = matched_token.phone_e164
    and existing_connection.instance_name is not null
    and existing_connection.status in ('pending', 'active')
  for update;

  if not found then
    return null;
  end if;

  update app_v2.whatsapp_link_tokens token
  set consumed_at = now(),
      last_attempt_at = now()
  where token.id = matched_token.id
    and token.consumed_at is null;

  if not found then
    return null;
  end if;

  update app_v2.whatsapp_connections existing_connection
  set status = 'active',
      verified_at = now(),
      updated_at = now()
  where existing_connection.id = matched_token.connection_id
  returning * into connection;

  return connection;
end;
$$;

create function app_v2.import_legacy_finances(space_id uuid, payload jsonb, import_key text)
returns table (data_import_id uuid, imported_count integer, skipped_count integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  caller_id uuid := (select auth.uid());
  existing_import app_v2.data_imports%rowtype;
  import_id uuid;
  item jsonb;
  item_type app_v2.transaction_type;
  item_amount numeric(14,2);
  item_currency varchar(3);
  item_occurred_at timestamptz;
  attempted integer := 0;
  imported integer := 0;
  skipped integer := 0;
begin
  if caller_id is null or not app_private.has_space_role(
    space_id,
    array['owner', 'admin', 'member']::app_v2.member_role[]
  ) then
    raise exception 'not authorized to import finances into this space'
      using errcode = '42501';
  end if;

  if import_key is null or btrim(import_key) = '' then
    raise exception 'import_key is required'
      using errcode = '22023';
  end if;

  if payload is null
    or jsonb_typeof(payload) <> 'object'
    or jsonb_typeof(payload -> 'transactions') <> 'array' then
    raise exception 'payload.transactions must be an array'
      using errcode = '22023';
  end if;

  insert into app_v2.data_imports (
    user_id,
    space_id,
    import_key,
    source,
    status
  ) values (
    caller_id,
    import_legacy_finances.space_id,
    import_legacy_finances.import_key,
    'rpc',
    'processing'
  )
  on conflict (user_id, import_key) do nothing
  returning id into import_id;

  if import_id is null then
    select data_import.*
    into existing_import
    from app_v2.data_imports data_import
    where data_import.user_id = caller_id
      and data_import.import_key = import_legacy_finances.import_key;

    return query
    select existing_import.id, existing_import.imported_count, existing_import.skipped_count;
    return;
  end if;

  for item in select value from jsonb_array_elements(payload -> 'transactions')
  loop
    attempted := attempted + 1;
    begin
      if jsonb_typeof(item) <> 'object'
        or coalesce(item ->> 'type', '') not in ('expense', 'income', 'transfer')
        or coalesce(item ->> 'amount', '') !~ '^[0-9]+([.][0-9]{1,2})?$'
        or (item ->> 'amount')::numeric <= 0
        or coalesce(item ->> 'currency', '') !~ '^[A-Z]{3}$'
      then
        skipped := skipped + 1;
        continue;
      end if;

      item_type := (item ->> 'type')::app_v2.transaction_type;
      item_amount := (item ->> 'amount')::numeric(14,2);
      item_currency := item ->> 'currency';

      if item ? 'occurred_at' then
        item_occurred_at := (item ->> 'occurred_at')::timestamptz;
      else
        item_occurred_at := now();
      end if;

      insert into app_v2.transactions (
        space_id,
        created_by,
        transaction_type,
        source,
        status,
        amount,
        currency,
        description,
        occurred_at,
        metadata
      ) values (
        import_legacy_finances.space_id,
        caller_id,
        item_type,
        'import',
        'cleared',
        item_amount,
        item_currency,
        nullif(btrim(item ->> 'description'), ''),
        item_occurred_at,
        jsonb_build_object('data_import_id', import_id)
      );

      imported := imported + 1;
    exception
      when data_exception or datetime_field_overflow or invalid_text_representation or numeric_value_out_of_range then
        skipped := skipped + 1;
    end;
  end loop;

  update app_v2.data_imports data_import
  set attempted_count = attempted,
      imported_count = imported,
      skipped_count = skipped,
      status = case
        when imported = 0 and skipped > 0 then 'skipped'::app_v2.import_status
        when skipped > 0 then 'partial'::app_v2.import_status
        else 'completed'::app_v2.import_status
      end,
      reason = case when skipped > 0 then 'One or more payload transactions were invalid' end
  where data_import.id = import_id;

  return query select import_id, imported, skipped;
end;
$$;

create function app_v2.apply_whatsapp_message_status(
  connection_id uuid,
  external_message_id text,
  status app_v2.message_status
)
returns app_v2.whatsapp_messages
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  updated_message app_v2.whatsapp_messages%rowtype;
begin
  if apply_whatsapp_message_status.connection_id is null
    or apply_whatsapp_message_status.external_message_id is null
    or btrim(apply_whatsapp_message_status.external_message_id) = ''
    or apply_whatsapp_message_status.status is null then
    raise exception 'message status update is invalid' using errcode = '22023';
  end if;

  insert into app_v2.whatsapp_messages (
    space_id,
    connection_id,
    direction,
    status,
    external_message_id,
    message_type
  )
  select
    connection.space_id,
    connection.id,
    'outbound',
    apply_whatsapp_message_status.status,
    apply_whatsapp_message_status.external_message_id,
    'status_only'
  from app_v2.whatsapp_connections connection
  where connection.id = apply_whatsapp_message_status.connection_id
  on conflict (connection_id, external_message_id)
    where external_message_id is not null
  do nothing;

  update app_v2.whatsapp_messages message
  set status = case
        when message.status = 'read' then message.status
        when message.status = 'delivered'
          and apply_whatsapp_message_status.status <> 'read' then message.status
        when message.status = 'failed' then case
          when apply_whatsapp_message_status.status in ('delivered', 'read')
            then apply_whatsapp_message_status.status
          else message.status
        end
        when apply_whatsapp_message_status.status = 'failed'
          and message.status in ('queued', 'processing', 'sent')
            then apply_whatsapp_message_status.status
        when app_private.whatsapp_message_status_rank(apply_whatsapp_message_status.status)
          > app_private.whatsapp_message_status_rank(message.status)
            then apply_whatsapp_message_status.status
        else message.status
      end,
      updated_at = now()
  where message.connection_id = apply_whatsapp_message_status.connection_id
    and message.external_message_id = apply_whatsapp_message_status.external_message_id
    and message.direction = 'outbound'
  returning message.* into updated_message;

  return updated_message;
end;
$$;

create function app_v2.complete_whatsapp_processing(
  job_id bigint,
  locked_at timestamptz,
  worker_id text,
  parsed jsonb
)
returns app_v2.transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  processing_job app_v2.whatsapp_jobs%rowtype;
  inbound_message app_v2.whatsapp_messages%rowtype;
  linked_connection app_v2.whatsapp_connections%rowtype;
  parsed_amount numeric(14,2);
  parsed_currency varchar(3);
  parsed_description text;
  parsed_merchant text;
  parsed_type app_v2.transaction_type;
  parsed_category_name text;
  parsed_category_id uuid;
  completed_transaction app_v2.transactions%rowtype;
  processing_job_id bigint;
  inbound_message_id bigint;
  linked_connection_id uuid;
begin
  if complete_whatsapp_processing.job_id is null
    or complete_whatsapp_processing.locked_at is null
    or complete_whatsapp_processing.worker_id is null
    or btrim(complete_whatsapp_processing.worker_id) = '' then
    raise exception 'processing lease is invalid' using errcode = '40001';
  end if;

  select job.id, message.id, connection.id
  into processing_job_id, inbound_message_id, linked_connection_id
  from app_v2.whatsapp_jobs job
  join app_v2.whatsapp_messages message
    on message.id = job.message_id
   and message.space_id = job.space_id
  join app_v2.whatsapp_connections connection
    on connection.id = message.connection_id
   and connection.space_id = message.space_id
  where job.id = complete_whatsapp_processing.job_id
    and job.locked_at = complete_whatsapp_processing.locked_at
    and job.locked_by = complete_whatsapp_processing.worker_id
    and job.status = 'processing'
    and job.job_type = 'process_message'
    and message.direction = 'inbound'
    and connection.status = 'active'
  for update of job;

  if not found then
    raise exception 'processing lease is invalid' using errcode = '40001';
  end if;

  select job.*
  into processing_job
  from app_v2.whatsapp_jobs job
  where job.id = processing_job_id;

  select message.*
  into inbound_message
  from app_v2.whatsapp_messages message
  where message.id = inbound_message_id;

  select connection.*
  into linked_connection
  from app_v2.whatsapp_connections connection
  where connection.id = linked_connection_id;

  if linked_connection.instance_name is null
    or complete_whatsapp_processing.parsed is null
    or jsonb_typeof(complete_whatsapp_processing.parsed) <> 'object'
    or coalesce(complete_whatsapp_processing.parsed ->> 'amount', '') !~ '^[0-9]+([.][0-9]{1,2})?$'
    or coalesce(complete_whatsapp_processing.parsed ->> 'currency', '') !~ '^[A-Z]{3}$'
    or length(btrim(coalesce(complete_whatsapp_processing.parsed ->> 'description', ''))) not between 1 and 240
    or length(btrim(coalesce(complete_whatsapp_processing.parsed ->> 'category', ''))) not between 1 and 80
    or (
      complete_whatsapp_processing.parsed ? 'merchant'
      and complete_whatsapp_processing.parsed ->> 'merchant' is not null
      and length(btrim(complete_whatsapp_processing.parsed ->> 'merchant')) not between 1 and 120
    )
    or coalesce(complete_whatsapp_processing.parsed ->> 'type', 'expense') not in ('expense', 'income')
  then
    raise exception 'parsed finance data is invalid' using errcode = '22023';
  end if;

  begin
    parsed_amount := (complete_whatsapp_processing.parsed ->> 'amount')::numeric(14,2);
  exception when numeric_value_out_of_range then
    raise exception 'parsed finance data is invalid' using errcode = '22023';
  end;

  if parsed_amount <= 0 then
    raise exception 'parsed finance data is invalid' using errcode = '22023';
  end if;

  parsed_currency := complete_whatsapp_processing.parsed ->> 'currency';
  parsed_description := btrim(complete_whatsapp_processing.parsed ->> 'description');
  parsed_merchant := nullif(btrim(complete_whatsapp_processing.parsed ->> 'merchant'), '');
  parsed_category_name := btrim(complete_whatsapp_processing.parsed ->> 'category');
  parsed_type := coalesce(
    complete_whatsapp_processing.parsed ->> 'type',
    'expense'
  )::app_v2.transaction_type;

  select category.id
  into parsed_category_id
  from app_v2.categories category
  where lower(category.name) = lower(parsed_category_name)
    and category.space_id = processing_job.space_id
    and category.transaction_type = parsed_type
    and category.is_active
  order by category.is_system desc, category.sort_order, category.id
  limit 1;

  if parsed_category_id is null then
    select category.id
    into parsed_category_id
    from app_v2.categories category
    where lower(category.name) = lower('Outros')
      and category.space_id = processing_job.space_id
      and category.transaction_type = parsed_type
      and category.is_active
    order by category.is_system desc, category.sort_order, category.id
    limit 1;
  end if;

  insert into app_v2.transactions (
    space_id,
    created_by,
    category_id,
    transaction_type,
    source,
    status,
    amount,
    currency,
    description,
    merchant,
    whatsapp_message_id,
    occurred_at,
    metadata
  ) values (
    processing_job.space_id,
    linked_connection.linked_user_id,
    parsed_category_id,
    parsed_type,
    'whatsapp',
    'cleared',
    parsed_amount,
    parsed_currency,
    parsed_description,
    parsed_merchant,
    inbound_message.id,
    coalesce(inbound_message.received_at, inbound_message.created_at),
    jsonb_build_object('whatsapp_message_id', inbound_message.id)
  )
  on conflict (whatsapp_message_id)
    where whatsapp_message_id is not null
  do nothing
  returning * into completed_transaction;

  if completed_transaction.id is null then
    select transaction_row.*
    into completed_transaction
    from app_v2.transactions transaction_row
    where transaction_row.whatsapp_message_id = inbound_message.id;
  end if;

  insert into app_v2.whatsapp_jobs (
    space_id,
    message_id,
    job_type,
    status,
    payload
  ) values (
    processing_job.space_id,
    inbound_message.id,
    'send_message',
    'pending',
    jsonb_build_object(
      'instance', linked_connection.instance_name,
      'phone_e164', linked_connection.phone_e164,
      'text', format('Registo confirmado: %s %s.', parsed_amount, parsed_currency)
    )
  )
  on conflict (message_id, job_type)
    where message_id is not null
  do nothing;

  update app_v2.whatsapp_media media
  set is_valid = false,
      expires_at = now(),
      updated_at = now()
  where media.space_id = processing_job.space_id
    and media.message_id = inbound_message.id
    and media.is_valid;

  update app_v2.whatsapp_messages message
  set body_redacted = '[processed]',
      metadata_redacted = jsonb_build_object('type', message.message_type),
      updated_at = now()
  where message.id = inbound_message.id
    and message.space_id = processing_job.space_id;

  update app_v2.whatsapp_jobs job
  set status = 'completed',
      locked_by = null,
      locked_at = null,
      last_error = null,
      updated_at = now()
  where job.id = complete_whatsapp_processing.job_id
    and job.locked_at = complete_whatsapp_processing.locked_at
    and job.locked_by = complete_whatsapp_processing.worker_id
    and job.status = 'processing';

  if not found then
    raise exception 'processing lease is invalid' using errcode = '40001';
  end if;

  return completed_transaction;
end;
$$;

create function app_v2.update_whatsapp_preferences(
  space_id uuid,
  monthly_report_opt_in boolean,
  preferences jsonb default '{}'::jsonb
)
returns app_v2.whatsapp_connections
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_connection app_v2.whatsapp_connections%rowtype;
begin
  if caller_id is null
    or update_whatsapp_preferences.space_id is null
    or update_whatsapp_preferences.monthly_report_opt_in is null then
    raise exception 'WhatsApp preferences are unavailable' using errcode = '42501';
  end if;

  if update_whatsapp_preferences.preferences is null
    or jsonb_typeof(update_whatsapp_preferences.preferences) <> 'object'
    or pg_column_size(update_whatsapp_preferences.preferences) > 8192 then
    raise exception 'preferences must be an object up to 8192 bytes'
      using errcode = '22023';
  end if;

  select connection.*
  into selected_connection
  from app_v2.whatsapp_connections connection
  where connection.space_id = update_whatsapp_preferences.space_id
    and (
      connection.linked_user_id = caller_id
      or app_private.has_space_role(
        update_whatsapp_preferences.space_id,
        array['owner', 'admin']::app_v2.member_role[]
      )
    )
  order by
    (connection.linked_user_id = caller_id) desc,
    (connection.status = 'active') desc,
    connection.created_at,
    connection.id
  limit 1
  for update;

  if not found then
    raise exception 'WhatsApp preferences are unavailable' using errcode = '42501';
  end if;

  update app_v2.whatsapp_connections connection
  set monthly_report_opt_in = update_whatsapp_preferences.monthly_report_opt_in,
      report_preferences = update_whatsapp_preferences.preferences,
      updated_at = now()
  where connection.id = selected_connection.id
  returning connection.* into selected_connection;

  return selected_connection;
end;
$$;

create function app_v2.enqueue_whatsapp_monthly_reports(
  reference_time timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  local_reference timestamp without time zone;
  report_month date;
  period_start timestamptz;
  selected_connection record;
  expense_total numeric(14,2);
  income_total numeric(14,2);
  generated_report app_v2.whatsapp_monthly_reports%rowtype;
  enqueued_count integer := 0;
begin
  if enqueue_whatsapp_monthly_reports.reference_time is null then
    raise exception 'reference_time is required' using errcode = '22023';
  end if;

  local_reference := enqueue_whatsapp_monthly_reports.reference_time
    at time zone 'Europe/Lisbon';

  if extract(day from local_reference)::integer <> 25 then
    return 0;
  end if;

  report_month := date_trunc('month', local_reference)::date;
  period_start := report_month::timestamp at time zone 'Europe/Lisbon';

  for selected_connection in
    select distinct on (connection.space_id)
      connection.space_id,
      connection.linked_user_id,
      connection.instance_name,
      connection.phone_e164,
      space.currency
    from app_v2.whatsapp_connections connection
    join app_v2.spaces space on space.id = connection.space_id
    where connection.status = 'active'
      and connection.monthly_report_opt_in
      and connection.instance_name is not null
    order by connection.space_id, connection.created_at, connection.id
  loop
    select
      coalesce(sum(transaction_row.amount) filter (
        where transaction_row.transaction_type = 'expense'
      ), 0),
      coalesce(sum(transaction_row.amount) filter (
        where transaction_row.transaction_type = 'income'
      ), 0)
    into expense_total, income_total
    from app_v2.transactions transaction_row
    where transaction_row.space_id = selected_connection.space_id
      and transaction_row.occurred_at >= period_start
      and transaction_row.occurred_at <= enqueue_whatsapp_monthly_reports.reference_time
      and transaction_row.status <> 'void';

    generated_report := null;

    insert into app_v2.whatsapp_monthly_reports (
      space_id,
      requested_by,
      month,
      status,
      scheduled_for,
      generated_at,
      delivery_status,
      summary_redacted
    ) values (
      selected_connection.space_id,
      selected_connection.linked_user_id,
      report_month,
      'ready',
      enqueue_whatsapp_monthly_reports.reference_time,
      enqueue_whatsapp_monthly_reports.reference_time,
      'scheduled',
      jsonb_build_object(
        'period_start', report_month,
        'period_end', enqueue_whatsapp_monthly_reports.reference_time,
        'currency', selected_connection.currency,
        'expense_total', expense_total,
        'income_total', income_total
      )
    )
    on conflict (space_id, month) do nothing
    returning * into generated_report;

    if generated_report.id is null then
      continue;
    end if;

    insert into app_v2.whatsapp_jobs (
      space_id,
      job_type,
      status,
      payload
    ) values (
      selected_connection.space_id,
      'send_message',
      'pending',
      jsonb_build_object(
        'instance', selected_connection.instance_name,
        'phone_e164', selected_connection.phone_e164,
        'text', format(
          'Resumo mensal: despesas %s %s; receitas %s %s.',
          selected_connection.currency,
          expense_total,
          selected_connection.currency,
          income_total
        ),
        'report_id', generated_report.id
      )
    )
    on conflict ((payload ->> 'report_id'))
      where job_type = 'send_message' and payload ? 'report_id'
    do nothing;

    enqueued_count := enqueued_count + 1;
  end loop;

  return enqueued_count;
end;
$$;

create function app_v2.mark_whatsapp_monthly_report_sent(report_id uuid)
returns app_v2.whatsapp_monthly_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  locked_report app_v2.whatsapp_monthly_reports%rowtype;
begin
  if mark_whatsapp_monthly_report_sent.report_id is null then
    raise exception 'monthly report is unavailable' using errcode = '22023';
  end if;

  select report.*
  into locked_report
  from app_v2.whatsapp_monthly_reports report
  where report.id = mark_whatsapp_monthly_report_sent.report_id
  for update;

  if not found then
    raise exception 'monthly report is unavailable' using errcode = '22023';
  end if;

  update app_v2.whatsapp_monthly_reports report
  set delivery_status = case
        when report.delivery_status = 'delivered' then 'delivered'
        else 'sent'
      end,
      delivery_attempted_at = coalesce(report.delivery_attempted_at, now()),
      updated_at = now()
  where report.id = locked_report.id
  returning report.* into locked_report;

  return locked_report;
end;
$$;

create function app_v2.claim_whatsapp_jobs(worker_id text, "limit" integer default 10)
returns setof app_v2.whatsapp_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if worker_id is null or btrim(worker_id) = '' then
    raise exception 'worker_id is required'
      using errcode = '22023';
  end if;

  if "limit" is null or "limit" < 1 or "limit" > 100 then
    raise exception 'limit must be between 1 and 100'
      using errcode = '22023';
  end if;

  update app_v2.whatsapp_jobs job
  set status = 'failed',
      locked_by = null,
      locked_at = null,
      last_error = coalesce(job.last_error, 'Processing lease expired at maximum attempts'),
      updated_at = now()
  where job.status = 'processing'
    and job.locked_at <= now() - interval '5 minutes'
    and job.attempts >= job.max_attempts;

  return query
  with claimable as (
    select job.id
    from app_v2.whatsapp_jobs job
    where (
        (
          job.status in ('pending', 'retry')
          and job.run_at <= now()
        )
        or (
          job.status = 'processing'
          and job.locked_at <= now() - interval '5 minutes'
        )
      )
      and job.attempts < job.max_attempts
    order by job.run_at, job.id
    for update skip locked
    limit "limit"
  )
  update app_v2.whatsapp_jobs job
  set status = 'processing',
      attempts = job.attempts + 1,
      locked_by = claim_whatsapp_jobs.worker_id,
      locked_at = now(),
      updated_at = now()
  from claimable
  where job.id = claimable.id
  returning job.*;
end;
$$;

revoke execute on function app_v2.create_space(text, app_v2.space_kind) from public, anon, service_role;
revoke execute on function app_v2.accept_space_invitation(text) from public, anon, service_role;
revoke execute on function app_v2.create_whatsapp_link(text, uuid) from public, anon, service_role;
revoke execute on function app_v2.transfer_space_ownership(uuid, uuid) from public, anon, service_role;
revoke execute on function app_v2.consume_whatsapp_link(text, text) from public, anon, authenticated;
revoke execute on function app_v2.import_legacy_finances(uuid, jsonb, text) from public, anon, service_role;
revoke execute on function app_v2.claim_whatsapp_jobs(text, integer) from public, anon, authenticated;
revoke execute on function app_v2.apply_whatsapp_message_status(uuid, text, app_v2.message_status) from public, anon, authenticated;
revoke execute on function app_v2.complete_whatsapp_processing(bigint, timestamptz, text, jsonb) from public, anon, authenticated;
revoke execute on function app_v2.update_whatsapp_preferences(uuid, boolean, jsonb) from public, anon, service_role;
revoke execute on function app_v2.enqueue_whatsapp_monthly_reports(timestamptz) from public, anon, authenticated;
revoke execute on function app_v2.mark_whatsapp_monthly_report_sent(uuid) from public, anon, authenticated;
grant execute on function app_v2.create_space(text, app_v2.space_kind) to authenticated;
grant execute on function app_v2.accept_space_invitation(text) to authenticated;
grant execute on function app_v2.create_whatsapp_link(text, uuid) to authenticated;
grant execute on function app_v2.transfer_space_ownership(uuid, uuid) to authenticated;
grant execute on function app_v2.import_legacy_finances(uuid, jsonb, text) to authenticated;
grant execute on function app_v2.consume_whatsapp_link(text, text) to service_role;
grant execute on function app_v2.claim_whatsapp_jobs(text, integer) to service_role;
grant execute on function app_v2.apply_whatsapp_message_status(uuid, text, app_v2.message_status) to service_role;
grant execute on function app_v2.complete_whatsapp_processing(bigint, timestamptz, text, jsonb) to service_role;
grant execute on function app_v2.update_whatsapp_preferences(uuid, boolean, jsonb) to authenticated;
grant execute on function app_v2.enqueue_whatsapp_monthly_reports(timestamptz) to service_role;
grant execute on function app_v2.mark_whatsapp_monthly_report_sent(uuid) to service_role;

grant usage on schema app_v2 to authenticated, service_role;
grant usage on schema app_private to authenticated;

grant select, insert, delete on table
  app_v2.profiles,
  app_v2.space_members,
  app_v2.space_invitations,
  app_v2.categories,
  app_v2.budget_plans,
  app_v2.budget_allocations,
  app_v2.transactions,
  app_v2.transaction_attachments,
  app_v2.recurring_rules,
  app_v2.spending_limits,
  app_v2.financial_goals,
  app_v2.data_imports
to authenticated;

grant select, delete on table app_v2.spaces to authenticated;

grant update on table
  app_v2.profiles,
  app_v2.space_members,
  app_v2.space_invitations,
  app_v2.categories,
  app_v2.budget_plans,
  app_v2.budget_allocations,
  app_v2.transactions,
  app_v2.transaction_attachments,
  app_v2.recurring_rules,
  app_v2.spending_limits,
  app_v2.financial_goals,
  app_v2.data_imports
to authenticated;

grant update (name, kind, locale, currency, timezone, settings, updated_at)
on table app_v2.spaces to authenticated;

grant select on table
  app_v2.whatsapp_connections,
  app_v2.whatsapp_link_tokens,
  app_v2.whatsapp_messages,
  app_v2.whatsapp_media,
  app_v2.whatsapp_events,
  app_v2.whatsapp_monthly_reports,
  app_v2.subscriptions,
  app_v2.payment_events,
  app_v2.monthly_spending_summary
to authenticated;

grant delete on table app_v2.whatsapp_media to authenticated;
grant select on table app_v2.spaces, app_v2.categories to service_role;
grant select, insert, update on table
  app_v2.transactions,
  app_v2.whatsapp_jobs,
  app_v2.whatsapp_monthly_reports,
  app_v2.subscriptions,
  app_v2.payment_events
to service_role;
grant select on table app_v2.whatsapp_connections to service_role;
grant update (last_seen_at, updated_at) on table app_v2.whatsapp_connections to service_role;
grant select, insert, update on table app_v2.whatsapp_messages to service_role;
grant insert on table app_v2.whatsapp_events to service_role;
grant select, insert, update, delete on table app_v2.whatsapp_media to service_role;
grant usage, select on sequence
  app_v2.whatsapp_messages_id_seq,
  app_v2.whatsapp_jobs_id_seq,
  app_v2.whatsapp_events_id_seq,
  app_v2.payment_events_id_seq
to service_role;

insert into storage.buckets (id, name, public)
values ('whatsapp-inbox', 'whatsapp-inbox', false)
on conflict (id) do update set public = false;

grant select, delete on table storage.objects to authenticated;
grant select, insert, update, delete on table storage.objects to service_role;

create policy whatsapp_inbox_member_read
on storage.objects for select to authenticated
using (
  bucket_id = 'whatsapp-inbox'
  and exists (
    select 1
    from app_v2.space_members member
    where member.user_id = (select auth.uid())
      and member.space_id::text = (storage.foldername(name))[1]
  )
);

create policy whatsapp_inbox_member_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'whatsapp-inbox'
  and app_private.has_space_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin']::app_v2.member_role[]
  )
);

create policy whatsapp_inbox_service_manage
on storage.objects for all to service_role
using (bucket_id = 'whatsapp-inbox')
with check (bucket_id = 'whatsapp-inbox');

do $$
declare
  existing_user record;
  personal_space_id uuid;
begin
  for existing_user in select id, raw_user_meta_data from auth.users
  loop
    insert into app_v2.profiles (user_id, display_name)
    values (
      existing_user.id,
      nullif(btrim(existing_user.raw_user_meta_data ->> 'full_name'), '')
    )
    on conflict (user_id) do nothing;

    select space.id
    into personal_space_id
    from app_v2.spaces space
    where space.owner_user_id = existing_user.id
      and space.kind = 'personal'
    order by space.created_at
    limit 1;

    if personal_space_id is null then
      insert into app_v2.spaces (owner_user_id, name, kind)
      values (existing_user.id, 'Meu espaço', 'personal')
      returning id into personal_space_id;

      insert into app_v2.space_members (space_id, user_id, role)
      values (personal_space_id, existing_user.id, 'owner');

      insert into app_v2.categories (space_id, name, transaction_type, is_system, sort_order)
      values
        (personal_space_id, 'Alimentação', 'expense', true, 10),
        (personal_space_id, 'Transporte', 'expense', true, 20),
        (personal_space_id, 'Lazer', 'expense', true, 30),
        (personal_space_id, 'Casa', 'expense', true, 40),
        (personal_space_id, 'Saúde', 'expense', true, 50),
        (personal_space_id, 'Outros', 'expense', true, 60);
    end if;
  end loop;
end;
$$;

do $$
declare
  legacy_user record;
  target_space_id uuid;
  marker_id uuid;
  attempted integer;
  imported integer;
begin
  if to_regclass('public.expenses') is not null
    and (
      select count(*)
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'expenses'
        and column_name = any(array[
          'id',
          'user_id',
          'amount',
          'description',
          'name',
          'occurred_at',
          'date',
          'created_at',
          'merchant'
        ])
    ) = 9 then
    for legacy_user in select distinct user_id from public.expenses where user_id is not null
    loop
      if exists (
        select 1 from app_v2.data_imports
        where user_id = legacy_user.user_id
          and import_key = 'legacy:public.expenses:v1'
      ) then
        continue;
      end if;

      select space.id
      into target_space_id
      from app_v2.spaces space
      where space.owner_user_id = legacy_user.user_id
        and space.kind = 'personal'
      order by space.created_at
      limit 1;

      if target_space_id is null then
        insert into app_v2.data_imports (
          user_id, space_id, import_key, source, status, reason
        ) values (
          case when exists (select 1 from auth.users where id = legacy_user.user_id)
            then legacy_user.user_id else null end,
          null,
          'legacy:public.expenses:v1:' || legacy_user.user_id::text,
          'public.expenses',
          'skipped',
          'No reliable personal-space ownership mapping was available'
        ) on conflict do nothing;
        continue;
      end if;

      select count(*)::integer
      into attempted
      from public.expenses expense
      where expense.user_id = legacy_user.user_id;

      insert into app_v2.data_imports (
        user_id, space_id, import_key, source, status, attempted_count
      ) values (
        legacy_user.user_id,
        target_space_id,
        'legacy:public.expenses:v1',
        'public.expenses',
        'processing',
        attempted
      ) returning id into marker_id;

      insert into app_v2.transactions (
        space_id,
        created_by,
        transaction_type,
        source,
        status,
        amount,
        currency,
        description,
        occurred_at,
        metadata
      )
      select
        target_space_id,
        expense.user_id,
        'expense',
        'import',
        'cleared',
        expense.amount::numeric(14,2),
        profile.currency,
        coalesce(
          nullif(btrim(expense.description), ''),
          nullif(btrim(expense.name), ''),
          nullif(btrim(expense.merchant), '')
        ),
        coalesce(expense.occurred_at, expense.date::timestamptz, expense.created_at),
        jsonb_build_object(
          'data_import_id', marker_id,
          'legacy_table', 'public.expenses',
          'legacy_id', expense.id
        )
      from public.expenses expense
      join app_v2.profiles profile on profile.user_id = expense.user_id
      where expense.user_id = legacy_user.user_id
        and expense.amount > 0;

      get diagnostics imported = row_count;

      update app_v2.data_imports
      set imported_count = imported,
          skipped_count = attempted - imported,
          status = case when imported = attempted then 'completed'::app_v2.import_status else 'partial'::app_v2.import_status end,
          reason = case when imported < attempted then 'Rows with non-positive amounts were skipped' end
      where id = marker_id;
    end loop;
  elsif to_regclass('public.expenses') is not null then
    select count(*)::integer
    into attempted
    from public.expenses;

    insert into app_v2.data_imports (
      user_id,
      import_key,
      source,
      status,
      attempted_count,
      skipped_count,
      reason
    ) values (
      null,
      'legacy:public.expenses:incompatible:v1',
      'public.expenses',
      'skipped',
      attempted,
      attempted,
      'Legacy expenses schema has no reliable authenticated-user mapping'
    );
  end if;
end;
$$;

do $$
declare
  legacy_user record;
  target_space_id uuid;
  marker_id uuid;
  attempted integer;
  imported integer;
begin
  if to_regclass('public.whatsapp_users') is not null then
    for legacy_user in select distinct user_id from public.whatsapp_users
    loop
      if exists (
        select 1 from app_v2.data_imports
        where user_id = legacy_user.user_id
          and import_key = 'legacy:public.whatsapp_users:v1'
      ) then
        continue;
      end if;

      select space.id into target_space_id
      from app_v2.spaces space
      where space.owner_user_id = legacy_user.user_id and space.kind = 'personal'
      order by space.created_at limit 1;

      if target_space_id is null then
        insert into app_v2.data_imports (user_id, import_key, source, status, reason)
        values (
          case when exists (select 1 from auth.users where id = legacy_user.user_id) then legacy_user.user_id else null end,
          'legacy:public.whatsapp_users:v1:' || legacy_user.user_id::text,
          'public.whatsapp_users',
          'skipped',
          'No reliable personal-space ownership mapping was available'
        ) on conflict do nothing;
        continue;
      end if;

      select count(*)::integer into attempted
      from public.whatsapp_users legacy_connection
      where legacy_connection.user_id = legacy_user.user_id;

      insert into app_v2.data_imports (user_id, space_id, import_key, source, status, attempted_count)
      values (legacy_user.user_id, target_space_id, 'legacy:public.whatsapp_users:v1', 'public.whatsapp_users', 'processing', attempted)
      returning id into marker_id;

      insert into app_v2.whatsapp_connections (
        space_id, linked_user_id, phone_e164, status, verified_at, created_at
      )
      select
        target_space_id,
        legacy_connection.user_id,
        legacy_connection.phone,
        case when legacy_connection.verified then 'active'::app_v2.connection_status else 'pending'::app_v2.connection_status end,
        case when legacy_connection.verified then legacy_connection.linked_at end,
        legacy_connection.linked_at
      from public.whatsapp_users legacy_connection
      where legacy_connection.user_id = legacy_user.user_id
        and legacy_connection.phone ~ '^[+][1-9][0-9]{7,14}$'
      on conflict (phone_e164) where status = 'active' do nothing;

      get diagnostics imported = row_count;

      update app_v2.data_imports
      set imported_count = imported,
          skipped_count = attempted - imported,
          status = case when imported = attempted then 'completed'::app_v2.import_status else 'partial'::app_v2.import_status end,
          reason = case when imported < attempted then 'Invalid or conflicting phone values were skipped' end
      where id = marker_id;
    end loop;
  end if;
end;
$$;

do $$
declare
  legacy_user record;
  target_space_id uuid;
  marker_id uuid;
  attempted integer;
  imported integer;
begin
  if to_regclass('public.whatsapp_links') is not null then
    for legacy_user in select distinct user_id from public.whatsapp_links
    loop
      if exists (
        select 1 from app_v2.data_imports
        where user_id = legacy_user.user_id
          and import_key = 'legacy:public.whatsapp_links:v1'
      ) then
        continue;
      end if;

      select space.id into target_space_id
      from app_v2.spaces space
      where space.owner_user_id = legacy_user.user_id and space.kind = 'personal'
      order by space.created_at limit 1;

      if target_space_id is null then
        insert into app_v2.data_imports (user_id, import_key, source, status, reason)
        values (
          case when exists (select 1 from auth.users where id = legacy_user.user_id) then legacy_user.user_id else null end,
          'legacy:public.whatsapp_links:v1:' || legacy_user.user_id::text,
          'public.whatsapp_links',
          'skipped',
          'No reliable personal-space ownership mapping was available'
        ) on conflict do nothing;
        continue;
      end if;

      select count(*)::integer into attempted
      from public.whatsapp_links legacy_link
      where legacy_link.user_id = legacy_user.user_id;

      insert into app_v2.data_imports (user_id, space_id, import_key, source, status, attempted_count)
      values (legacy_user.user_id, target_space_id, 'legacy:public.whatsapp_links:v1', 'public.whatsapp_links', 'processing', attempted)
      returning id into marker_id;

      insert into app_v2.whatsapp_connections (
        space_id, linked_user_id, phone_e164, status, verified_at, created_at
      )
      select
        target_space_id,
        legacy_link.user_id,
        legacy_link.phone,
        'active',
        legacy_link.verified_at,
        legacy_link.created_at
      from public.whatsapp_links legacy_link
      where legacy_link.user_id = legacy_user.user_id
        and legacy_link.verified_at is not null
        and legacy_link.phone ~ '^[+][1-9][0-9]{7,14}$'
      on conflict (phone_e164) where status = 'active' do nothing;

      get diagnostics imported = row_count;

      update app_v2.data_imports
      set imported_count = imported,
          skipped_count = attempted - imported,
          status = case
            when imported = 0 then 'skipped'::app_v2.import_status
            when imported = attempted then 'completed'::app_v2.import_status
            else 'partial'::app_v2.import_status
          end,
          reason = case when imported < attempted then 'Unverified, invalid, or conflicting links were skipped without importing legacy secrets' end
      where id = marker_id;
    end loop;
  end if;
end;
$$;

do $$
declare
  legacy_user record;
  target_space_id uuid;
  marker_id uuid;
  attempted integer;
  imported integer;
begin
  if to_regclass('public.whatsapp_events') is not null then
    insert into app_v2.data_imports (user_id, import_key, source, status, reason)
    select null, 'legacy:public.whatsapp_events:unowned:v1', 'public.whatsapp_events', 'skipped',
      'Events without a user cannot be assigned to a space reliably'
    where exists (select 1 from public.whatsapp_events where user_id is null)
    on conflict do nothing;

    for legacy_user in select distinct user_id from public.whatsapp_events where user_id is not null
    loop
      if exists (
        select 1 from app_v2.data_imports
        where user_id = legacy_user.user_id
          and import_key = 'legacy:public.whatsapp_events:v1'
      ) then
        continue;
      end if;

      select space.id into target_space_id
      from app_v2.spaces space
      where space.owner_user_id = legacy_user.user_id and space.kind = 'personal'
      order by space.created_at limit 1;

      if target_space_id is null then
        insert into app_v2.data_imports (user_id, import_key, source, status, reason)
        values (
          case when exists (select 1 from auth.users where id = legacy_user.user_id) then legacy_user.user_id else null end,
          'legacy:public.whatsapp_events:v1:' || legacy_user.user_id::text,
          'public.whatsapp_events',
          'skipped',
          'No reliable personal-space ownership mapping was available'
        ) on conflict do nothing;
        continue;
      end if;

      select count(*)::integer into attempted
      from public.whatsapp_events legacy_event
      where legacy_event.user_id = legacy_user.user_id;

      insert into app_v2.data_imports (user_id, space_id, import_key, source, status, attempted_count)
      values (legacy_user.user_id, target_space_id, 'legacy:public.whatsapp_events:v1', 'public.whatsapp_events', 'processing', attempted)
      returning id into marker_id;

      insert into app_v2.whatsapp_events (space_id, event_type, details_redacted, created_at)
      select
        target_space_id,
        legacy_event.event_type,
        jsonb_build_object('success', legacy_event.success, 'legacy_import', true),
        legacy_event.created_at
      from public.whatsapp_events legacy_event
      where legacy_event.user_id = legacy_user.user_id;

      get diagnostics imported = row_count;

      update app_v2.data_imports
      set imported_count = imported,
          skipped_count = attempted - imported,
          status = 'completed'
      where id = marker_id;
    end loop;
  end if;
end;
$$;

do $$
declare
  legacy_user record;
  marker_id uuid;
  attempted integer;
  imported integer;
begin
  if to_regclass('public.subscriptions') is not null then
    for legacy_user in select distinct user_id from public.subscriptions
    loop
      if not exists (select 1 from auth.users where id = legacy_user.user_id) then
        insert into app_v2.data_imports (user_id, import_key, source, status, reason)
        values (
          null,
          'legacy:public.subscriptions:v1:' || legacy_user.user_id::text,
          'public.subscriptions',
          'skipped',
          'Subscription user does not exist in auth.users'
        ) on conflict do nothing;
        continue;
      end if;

      if exists (
        select 1 from app_v2.data_imports
        where user_id = legacy_user.user_id
          and import_key = 'legacy:public.subscriptions:v1'
      ) then
        continue;
      end if;

      select count(*)::integer into attempted
      from public.subscriptions legacy_subscription
      where legacy_subscription.user_id = legacy_user.user_id;

      insert into app_v2.data_imports (user_id, import_key, source, status, attempted_count)
      values (legacy_user.user_id, 'legacy:public.subscriptions:v1', 'public.subscriptions', 'processing', attempted)
      returning id into marker_id;

      insert into app_v2.subscriptions (
        user_id,
        provider_customer_id,
        provider_subscription_id,
        product_id,
        price_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        environment,
        created_at,
        updated_at
      )
      select
        legacy_subscription.user_id,
        legacy_subscription.stripe_customer_id,
        legacy_subscription.stripe_subscription_id,
        legacy_subscription.product_id,
        legacy_subscription.price_id,
        case
          when legacy_subscription.status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
            then legacy_subscription.status::app_v2.subscription_status
          else 'incomplete'::app_v2.subscription_status
        end,
        legacy_subscription.current_period_start,
        legacy_subscription.current_period_end,
        coalesce(legacy_subscription.cancel_at_period_end, false),
        legacy_subscription.environment,
        legacy_subscription.created_at,
        legacy_subscription.updated_at
      from public.subscriptions legacy_subscription
      where legacy_subscription.user_id = legacy_user.user_id
      on conflict (provider_subscription_id) do nothing;

      get diagnostics imported = row_count;

      update app_v2.data_imports
      set imported_count = imported,
          skipped_count = attempted - imported,
          status = case when imported = attempted then 'completed'::app_v2.import_status else 'partial'::app_v2.import_status end,
          reason = case when imported < attempted then 'Conflicting provider subscription identifiers were skipped' end
      where id = marker_id;
    end loop;
  end if;
end;
$$;

revoke execute on function app_private.set_updated_at() from public, anon, authenticated, service_role;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, app_v2';
notify pgrst, 'reload config';
