begin;

select no_plan();

select has_schema('app_v2', 'app_v2 schema exists');
select has_schema('app_private', 'app_private schema exists');

select has_table('app_v2', 'profiles', 'profiles table exists');
select has_table('app_v2', 'spaces', 'spaces table exists');
select has_table('app_v2', 'space_members', 'space_members table exists');
select has_table('app_v2', 'space_invitations', 'space_invitations table exists');
select has_table('app_v2', 'categories', 'categories table exists');
select has_table('app_v2', 'budget_plans', 'budget_plans table exists');
select has_table('app_v2', 'budget_allocations', 'budget_allocations table exists');
select has_table('app_v2', 'transactions', 'transactions table exists');
select has_table('app_v2', 'transaction_attachments', 'transaction_attachments table exists');
select has_table('app_v2', 'recurring_rules', 'recurring_rules table exists');
select has_table('app_v2', 'spending_limits', 'spending_limits table exists');
select has_table('app_v2', 'financial_goals', 'financial_goals table exists');
select has_table('app_v2', 'data_imports', 'data_imports table exists');
select has_table('app_v2', 'whatsapp_connections', 'whatsapp_connections table exists');
select has_table('app_v2', 'whatsapp_link_tokens', 'whatsapp_link_tokens table exists');
select has_table('app_v2', 'whatsapp_messages', 'whatsapp_messages table exists');
select has_table('app_v2', 'whatsapp_media', 'whatsapp_media table exists');
select has_table('app_v2', 'whatsapp_jobs', 'whatsapp_jobs table exists');
select has_table('app_v2', 'whatsapp_events', 'whatsapp_events table exists');
select has_table('app_v2', 'whatsapp_monthly_reports', 'whatsapp_monthly_reports table exists');
select has_table('app_v2', 'subscriptions', 'subscriptions table exists');
select has_table('app_v2', 'payment_events', 'payment_events table exists');

select has_function(
  'app_v2',
  'create_whatsapp_link',
  array['text', 'uuid'],
  'authenticated WhatsApp link RPC exists'
);
select has_function(
  'app_v2',
  'consume_whatsapp_link',
  array['text', 'text'],
  'service WhatsApp link RPC exists'
);
select has_function(
  'app_v2',
  'import_legacy_finances',
  array['uuid', 'jsonb', 'text'],
  'legacy finance import RPC exists'
);
select has_function(
  'app_v2',
  'claim_whatsapp_jobs',
  array['text', 'integer'],
  'job claim RPC exists'
);
select has_function(
  'app_v2',
  'apply_whatsapp_message_status',
  array['uuid', 'text', 'app_v2.message_status'],
  'monotonic WhatsApp message status RPC exists'
);
select has_function(
  'app_v2',
  'complete_whatsapp_processing',
  array['bigint', 'timestamp with time zone', 'text', 'jsonb'],
  'atomic inbound processing completion RPC exists'
);
select has_function(
  'app_v2',
  'update_whatsapp_preferences',
  array['uuid', 'boolean', 'jsonb'],
  'authenticated WhatsApp preferences RPC exists'
);
select has_function(
  'app_v2',
  'enqueue_whatsapp_monthly_reports',
  array['timestamp with time zone'],
  'monthly report enqueue RPC exists'
);
select has_function(
  'app_v2',
  'mark_whatsapp_monthly_report_sent',
  array['uuid'],
  'monthly report delivery RPC exists'
);

select is(
  (
    select count(*)::integer
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'app_v2'
      and relation.relkind = 'r'
      and relation.relrowsecurity
  ),
  22,
  'RLS is enabled on every app_v2 table'
);

select ok(
  coalesce((
    select 'security_invoker=true' = any(relation.reloptions)
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'app_v2'
      and relation.relname = 'monthly_spending_summary'
  ), false),
  'monthly spending summary uses security_invoker'
);

select ok(
  not has_table_privilege('anon', 'app_v2.transactions', 'select'),
  'anon cannot read business transactions'
);
select ok(
  has_table_privilege('authenticated', 'app_v2.transactions', 'select')
    and has_table_privilege('authenticated', 'app_v2.transactions', 'insert')
    and has_table_privilege('authenticated', 'app_v2.transactions', 'update')
    and has_table_privilege('authenticated', 'app_v2.transactions', 'delete'),
  'authenticated transaction CRUD is mediated by RLS'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'app_v2'
      and tablename = 'categories'
      and policyname = 'categories_update_writer'
      and roles = array['authenticated']::name[]
      and qual is not null
      and with_check is not null
  ),
  'writer update policy has USING and WITH CHECK'
);
select ok(
  not has_table_privilege('authenticated', 'app_v2.whatsapp_jobs', 'select'),
  'authenticated users cannot inspect the service job queue'
);
select ok(
  has_table_privilege('authenticated', 'app_v2.whatsapp_connections', 'select')
    and not has_table_privilege('authenticated', 'app_v2.whatsapp_connections', 'insert')
    and not has_table_privilege('authenticated', 'app_v2.whatsapp_connections', 'update')
    and not has_table_privilege('authenticated', 'app_v2.whatsapp_connections', 'delete'),
  'authenticated users can only read WhatsApp connections through RLS'
);
select ok(
  has_table_privilege('authenticated', 'app_v2.whatsapp_link_tokens', 'select')
    and not has_table_privilege('authenticated', 'app_v2.whatsapp_link_tokens', 'insert')
    and not has_table_privilege('authenticated', 'app_v2.whatsapp_link_tokens', 'update')
    and not has_table_privilege('authenticated', 'app_v2.whatsapp_link_tokens', 'delete'),
  'authenticated users can only read their WhatsApp link tokens through RLS'
);
select ok(
  has_table_privilege('authenticated', 'app_v2.subscriptions', 'select'),
  'authenticated users may read subscriptions through self-only RLS'
);
select ok(
  not has_table_privilege('authenticated', 'app_v2.subscriptions', 'insert'),
  'authenticated users cannot write commercial tables'
);
select ok(
  not has_table_privilege('service_role', 'app_v2.profiles', 'select')
    and not has_table_privilege('service_role', 'app_v2.space_members', 'select')
    and not has_table_privilege('service_role', 'app_v2.data_imports', 'select'),
  'service role has no direct structural or import table access'
);
select ok(
  has_table_privilege('service_role', 'app_v2.spaces', 'select')
    and not has_table_privilege('service_role', 'app_v2.spaces', 'update')
    and has_table_privilege('service_role', 'app_v2.categories', 'select')
    and not has_table_privilege('service_role', 'app_v2.categories', 'insert')
    and has_table_privilege('service_role', 'app_v2.transactions', 'select')
    and has_table_privilege('service_role', 'app_v2.transactions', 'insert')
    and has_table_privilege('service_role', 'app_v2.transactions', 'update')
    and not has_table_privilege('service_role', 'app_v2.transactions', 'delete')
    and has_table_privilege('service_role', 'app_v2.subscriptions', 'insert')
    and has_table_privilege('service_role', 'app_v2.payment_events', 'update'),
  'service role has parser and commercial sync operations without delete'
);
select ok(
  has_table_privilege('service_role', 'app_v2.whatsapp_connections', 'select')
    and has_column_privilege('service_role', 'app_v2.whatsapp_connections', 'last_seen_at', 'update')
    and not has_column_privilege('service_role', 'app_v2.whatsapp_connections', 'status', 'update')
    and not has_column_privilege('service_role', 'app_v2.whatsapp_connections', 'verified_at', 'update')
    and not has_table_privilege('service_role', 'app_v2.whatsapp_connections', 'insert')
    and not has_table_privilege('service_role', 'app_v2.whatsapp_connections', 'delete')
    and has_table_privilege('service_role', 'app_v2.whatsapp_messages', 'insert')
    and has_table_privilege('service_role', 'app_v2.whatsapp_messages', 'update')
    and has_table_privilege('service_role', 'app_v2.whatsapp_jobs', 'update')
    and has_table_privilege('service_role', 'app_v2.whatsapp_events', 'insert')
    and has_table_privilege('service_role', 'app_v2.whatsapp_media', 'delete'),
  'service role has the required WhatsApp ingest and bridge operations'
);
select ok(
  not has_schema_privilege('service_role', 'app_private', 'usage'),
  'service role does not need direct app_private schema access'
);
select ok(
  has_function_privilege('authenticated', 'app_v2.create_whatsapp_link(text,uuid)', 'execute'),
  'authenticated may execute create_whatsapp_link'
);
select ok(
  not has_function_privilege('authenticated', 'app_v2.consume_whatsapp_link(text,text)', 'execute'),
  'authenticated may not execute consume_whatsapp_link'
);
select ok(
  has_function_privilege('service_role', 'app_v2.consume_whatsapp_link(text,text)', 'execute'),
  'service role may execute consume_whatsapp_link'
);
select ok(
  has_function_privilege('service_role', 'app_v2.claim_whatsapp_jobs(text,integer)', 'execute'),
  'service role may execute claim_whatsapp_jobs'
);
select ok(
  has_function_privilege(
    'service_role',
    'app_v2.apply_whatsapp_message_status(uuid,text,app_v2.message_status)',
    'execute'
  )
    and not has_function_privilege(
      'authenticated',
      'app_v2.apply_whatsapp_message_status(uuid,text,app_v2.message_status)',
      'execute'
    ),
  'only service role may execute apply_whatsapp_message_status'
);
select ok(
  has_function_privilege(
    'service_role',
    'app_v2.complete_whatsapp_processing(bigint,timestamp with time zone,text,jsonb)',
    'execute'
  )
    and not has_function_privilege(
      'authenticated',
      'app_v2.complete_whatsapp_processing(bigint,timestamp with time zone,text,jsonb)',
      'execute'
    ),
  'only service role may execute complete_whatsapp_processing'
);
select ok(
  has_function_privilege('authenticated', 'app_v2.update_whatsapp_preferences(uuid,boolean,jsonb)', 'execute')
    and not has_function_privilege('service_role', 'app_v2.update_whatsapp_preferences(uuid,boolean,jsonb)', 'execute'),
  'only authenticated users may execute update_whatsapp_preferences'
);
select ok(
  has_function_privilege('service_role', 'app_v2.enqueue_whatsapp_monthly_reports(timestamp with time zone)', 'execute')
    and not has_function_privilege('authenticated', 'app_v2.enqueue_whatsapp_monthly_reports(timestamp with time zone)', 'execute'),
  'only service role may enqueue monthly reports'
);
select ok(
  has_function_privilege('service_role', 'app_v2.mark_whatsapp_monthly_report_sent(uuid)', 'execute')
    and not has_function_privilege('authenticated', 'app_v2.mark_whatsapp_monthly_report_sent(uuid)', 'execute'),
  'only service role may mark monthly reports sent'
);
select ok(
  not has_function_privilege('public', 'app_private.is_space_member(uuid)', 'execute'),
  'private authorization helper is not executable by PUBLIC'
);
select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'whatsapp-inbox'
      and public = false
  ),
  'whatsapp-inbox bucket is private'
);
select is(
  (
    select array_agg(cmd order by cmd)::text[]
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in ('whatsapp_inbox_member_read', 'whatsapp_inbox_member_delete')
  ),
  array['DELETE', 'SELECT']::text[],
  'authenticated storage policies grant only read and delete'
);

select has_column('app_v2', 'profiles', 'onboarding_completed', 'profiles track onboarding state');
select has_column('app_v2', 'categories', 'sort_order', 'categories have stable ordering');
select has_column('app_v2', 'budget_allocations', 'space_id', 'budget allocations carry tenant identity');
select has_column('app_v2', 'budget_allocations', 'percentage', 'budget allocations support percentages');
select has_column('app_v2', 'transactions', 'merchant', 'transactions store merchant');
select has_column('app_v2', 'whatsapp_media', 'expires_at', 'WhatsApp media tracks expiry');
select has_column('app_v2', 'whatsapp_link_tokens', 'connection_id', 'link tokens target a provisioned connection');
select has_column('app_v2', 'whatsapp_events', 'event_key', 'WhatsApp events support replay deduplication');
select has_function(
  'app_v2',
  'transfer_space_ownership',
  array['uuid', 'uuid'],
  'ownership transfer RPC exists'
);
select ok(
  not has_table_privilege('service_role', 'app_v2.transactions', 'truncate'),
  'service role grants do not include destructive TRUNCATE'
);
select ok(
  exists (
    select 1
    from pg_constraint constraint_row
    join pg_class relation on relation.oid = constraint_row.conrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'app_v2'
      and relation.relname = 'budget_allocations'
      and constraint_row.contype = 'f'
      and pg_get_constraintdef(constraint_row.oid) ilike '%FOREIGN KEY (space_id, budget_plan_id)%'
  ),
  'budget allocations enforce a tenant-safe plan FK'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'app_v2'
      and indexname = 'space_members_one_owner_uidx'
      and indexdef ilike '%UNIQUE%WHERE (role = %owner%'
  ),
  'each space has at most one owner membership'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'app_v2'
      and indexname = 'whatsapp_jobs_message_type_uidx'
      and indexdef ilike '%UNIQUE%message_id%job_type%WHERE (message_id IS NOT NULL)%'
  ),
  'one WhatsApp job type exists per message'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'app_v2'
      and indexname = 'whatsapp_connections_instance_phone_idx'
      and indexdef ilike '%instance_name%phone_e164%'
      and indexdef not ilike '%UNIQUE%'
  ),
  'shared Evolution instance supports instance and phone lookup'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'app_v2'
      and indexname = 'whatsapp_jobs_report_id_uidx'
      and indexdef ilike '%UNIQUE%report_id%send_message%'
  ),
  'monthly report delivery jobs are idempotent by report id'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'app_v2'
      and indexname = 'whatsapp_events_space_event_key_uidx'
      and indexdef ilike '%UNIQUE%space_id%event_key%WHERE (event_key IS NOT NULL)%'
  ),
  'WhatsApp event replay keys are unique per space when present'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@app-v2.test', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000002', 'admin-a@app-v2.test', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000003', 'member-a@app-v2.test', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000004', 'viewer-a@app-v2.test', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000005', 'invitee-a@app-v2.test', '{}'::jsonb),
  ('20000000-0000-0000-0000-000000000001', 'owner-b@app-v2.test', '{}'::jsonb);

insert into app_v2.space_members (space_id, user_id, role)
select space.id, membership.user_id, membership.role
from app_v2.spaces space
cross join (
  values
    ('10000000-0000-0000-0000-000000000002'::uuid, 'admin'::app_v2.member_role),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'member'::app_v2.member_role),
    ('10000000-0000-0000-0000-000000000004'::uuid, 'viewer'::app_v2.member_role)
) as membership(user_id, role)
where space.owner_user_id = '10000000-0000-0000-0000-000000000001';

select is(
  (
    select array_agg(category.name order by category.sort_order)
    from app_v2.categories category
    join app_v2.spaces space on space.id = category.space_id
    where space.owner_user_id = '10000000-0000-0000-0000-000000000001'
      and category.transaction_type = 'expense'
      and category.is_system
  ),
  array['Alimentação', 'Transporte', 'Lazer', 'Casa', 'Saúde', 'Outros']::text[],
  'personal spaces seed the canonical AI expense taxonomy including Outros'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is(
  (select count(*) from app_v2.spaces),
  1::bigint,
  'owner cannot read another tenant space'
);
reset role;

select throws_ok(
  $$
    insert into app_v2.transactions (
      space_id, created_by, category_id, transaction_type, amount, currency
    )
    select
      owner_space.id,
      '10000000-0000-0000-0000-000000000001'::uuid,
      other_category.id,
      'expense',
      10.00,
      'EUR'
    from app_v2.spaces owner_space
    cross join lateral (
      select category.id
      from app_v2.categories category
      join app_v2.spaces category_space on category_space.id = category.space_id
      where category_space.owner_user_id = '20000000-0000-0000-0000-000000000001'
      order by category.sort_order, category.id
      limit 1
    ) other_category
    where owner_space.owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  '23503',
  null,
  'cross-tenant category assignment is rejected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$
    update app_v2.spaces
    set settings = '{"review_test": true}'::jsonb
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  'admin may update space settings'
);
select throws_ok(
  $$
    update app_v2.space_members
    set role = 'owner'
    where user_id = '10000000-0000-0000-0000-000000000002'
      and space_id = (
        select id from app_v2.spaces
        where owner_user_id = '10000000-0000-0000-0000-000000000001'
      )
  $$,
  '23505',
  null,
  'admin cannot promote itself to owner'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$
    insert into app_v2.whatsapp_connections (
      space_id, linked_user_id, phone_e164, status
    )
    select id, owner_user_id, '+351933333333', 'active'
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'owner cannot create a WhatsApp connection directly'
);
select throws_ok(
  $$
    update app_v2.whatsapp_connections
    set status = 'disabled'
    where space_id = (
      select id from app_v2.spaces
      where owner_user_id = '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'owner cannot update a WhatsApp connection directly'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$
    insert into app_v2.transactions (
      space_id, created_by, transaction_type, amount, currency, merchant
    )
    select id, '10000000-0000-0000-0000-000000000003', 'expense', 5.25, 'EUR', 'Member shop'
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  'member may create a transaction'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$
    insert into app_v2.transactions (
      space_id, created_by, transaction_type, amount, currency
    )
    select id, '10000000-0000-0000-0000-000000000004', 'expense', 5.25, 'EUR'
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'viewer cannot create a transaction'
);
reset role;

select has_function(
  'app_v2',
  'create_space',
  array['text', 'app_v2.space_kind'],
  'authenticated create_space RPC exists'
);
select has_function(
  'app_v2',
  'accept_space_invitation',
  array['text'],
  'authenticated invitation acceptance RPC exists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select app_v2.create_space('Shared family', 'family')$$,
  'authenticated user can create a space atomically'
);
reset role;

select is(
  (
    select count(*)
    from app_v2.spaces space
    join app_v2.space_members member
      on member.space_id = space.id
     and member.user_id = space.owner_user_id
     and member.role = 'owner'
    where space.owner_user_id = '10000000-0000-0000-0000-000000000003'
      and space.name = 'Shared family'
      and space.kind = 'family'
  ),
  1::bigint,
  'create_space creates one coherent owner membership'
);

insert into app_v2.space_invitations (
  space_id, email, role, token_hash, invited_by, expires_at
)
select
  space.id,
  'invitee-a@app-v2.test',
  'member',
  extensions.digest('round-2-invitation-token', 'sha256'),
  space.owner_user_id,
  now() + interval '1 day'
from app_v2.spaces space
where space.owner_user_id = '10000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select app_v2.accept_space_invitation('wrong-token')$$,
  '22023',
  null,
  'invalid invitation token has a generic failure'
);
select lives_ok(
  $$select app_v2.accept_space_invitation('round-2-invitation-token')$$,
  'matching invitee accepts a valid invitation'
);
reset role;

select is(
  (
    select count(*)
    from app_v2.space_invitations invitation
    join app_v2.space_members member
      on member.space_id = invitation.space_id
     and member.user_id = invitation.accepted_by
     and member.role = invitation.role
    where invitation.email = 'invitee-a@app-v2.test'
      and invitation.status = 'accepted'
      and invitation.accepted_at is not null
      and invitation.role <> 'owner'
  ),
  1::bigint,
  'invitation acceptance creates membership and marks acceptance atomically'
);

insert into app_v2.space_invitations (
  space_id, email, role, token_hash, invited_by, expires_at
)
select
  space.id,
  'admin-a@app-v2.test',
  'member',
  extensions.digest('existing-member-invitation-token', 'sha256'),
  space.owner_user_id,
  now() + interval '1 day'
from app_v2.spaces space
where space.owner_user_id = '10000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select app_v2.accept_space_invitation('existing-member-invitation-token')$$,
  '22023',
  null,
  'existing member cannot consume an invitation or silently keep an old role'
);
reset role;

select is(
  (
    select status
    from app_v2.space_invitations
    where token_hash = extensions.digest('existing-member-invitation-token', 'sha256')
  ),
  'pending'::app_v2.invitation_status,
  'rejected existing-member invitation remains pending'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$
    select * from app_v2.create_whatsapp_link(
      '+351912345678',
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001')
    )
  $$,
  'second admin replaces the active token for the same space and phone'
);
reset role;

select is(
  (
    select count(*)
    from app_v2.whatsapp_connections connection
    join app_v2.whatsapp_link_tokens token
      on token.connection_id = connection.id
     and token.space_id = connection.space_id
    where connection.phone_e164 = '+351912345678'
      and connection.linked_user_id = '10000000-0000-0000-0000-000000000002'
      and connection.status = 'pending'
      and connection.instance_name = 'organizze-bot'
      and token.consumed_at is null
  ),
  1::bigint,
  'link creation provisions one deterministic pending Evolution connection'
);

select is(
  (
    select count(*)
    from app_v2.whatsapp_link_tokens token
    where token.space_id = (
      select id from app_v2.spaces
      where owner_user_id = '10000000-0000-0000-0000-000000000001'
    )
      and token.phone_e164 = '+351912345678'
      and token.consumed_at is null
  ),
  1::bigint,
  'one active token exists per space and phone across admins'
);

set local role service_role;
select lives_ok(
  $$select app_v2.consume_whatsapp_link('000000', '+351912345678')$$,
  'invalid WhatsApp consume is audited without enumeration error'
);
reset role;

select is(
  (
    select attempts
    from app_v2.whatsapp_link_tokens token
    where token.space_id = (
      select id from app_v2.spaces
      where owner_user_id = '10000000-0000-0000-0000-000000000001'
    )
      and token.phone_e164 = '+351912345678'
      and token.consumed_at is null
  ),
  1,
  'invalid WhatsApp consume increments the active token attempt audit'
);

set local role service_role;
select throws_ok(
  $$
    update app_v2.whatsapp_connections
    set status = 'active', verified_at = now()
    where phone_e164 = '+351912345678'
  $$,
  '42501',
  null,
  'service role cannot bypass consume_whatsapp_link verification'
);
reset role;

insert into app_v2.whatsapp_connections (
  space_id, linked_user_id, phone_e164, instance_name, status, verified_at
)
select id, owner_user_id, '+351911111111', 'evolution-owner-a-1', 'active', now()
from app_v2.spaces
where owner_user_id = '10000000-0000-0000-0000-000000000001';

insert into app_v2.whatsapp_connections (
  space_id, linked_user_id, phone_e164, instance_name, status, verified_at
)
select id, owner_user_id, '+351922222222', 'evolution-owner-a-2', 'active', now()
from app_v2.spaces
where owner_user_id = '10000000-0000-0000-0000-000000000001';

select lives_ok(
  $$
    insert into app_v2.whatsapp_connections (
      space_id, linked_user_id, phone_e164, instance_name, status
    )
    select id, owner_user_id, '+351955555555', 'evolution-owner-a-1', 'active'
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  'multiple user connections may share one Evolution instance'
);

insert into app_v2.whatsapp_events (space_id, event_key, event_type)
select id, 'qr-replay-key-1', 'connection.qr.updated'
from app_v2.spaces
where owner_user_id = '10000000-0000-0000-0000-000000000001';

select throws_ok(
  $$
    insert into app_v2.whatsapp_events (space_id, event_key, event_type)
    select id, 'qr-replay-key-1', 'connection.qr.updated'
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  '23505',
  null,
  'replayed WhatsApp event key is deduplicated per space'
);

insert into app_v2.whatsapp_messages (
  space_id, connection_id, direction, status, external_message_id, message_type,
  body_redacted, metadata_redacted
)
select space_id, id, 'inbound', 'received', 'provider-message-1', 'image',
  'Receipt at Cafe Central', '{"ocr":"sensitive raw text"}'::jsonb
from app_v2.whatsapp_connections
where phone_e164 = '+351911111111';

select throws_ok(
  $$
    insert into app_v2.whatsapp_messages (
      space_id, connection_id, direction, status, external_message_id
    )
    select space_id, id, 'inbound', 'received', 'provider-message-1'
    from app_v2.whatsapp_connections
    where phone_e164 = '+351911111111'
  $$,
  '23505',
  null,
  'same external message is idempotent within one connection'
);

select lives_ok(
  $$
    insert into app_v2.whatsapp_messages (
      space_id, connection_id, direction, status, external_message_id
    )
    select space_id, id, 'inbound', 'received', 'provider-message-1'
    from app_v2.whatsapp_connections
    where phone_e164 = '+351922222222'
  $$,
  'same provider message id may exist on another connection'
);

set local role service_role;
select lives_ok(
  $$
    select app_v2.apply_whatsapp_message_status(
      (select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'),
      'status-before-upsert',
      'delivered'
    )
  $$,
  'status callback creates an idempotent outbound placeholder before upsert'
);
select lives_ok(
  $$
    insert into app_v2.whatsapp_messages (
      space_id, connection_id, direction, status, external_message_id, message_type, body_redacted
    )
    select space_id, id, 'outbound', 'sent', 'status-before-upsert', 'text', 'Enriched body'
    from app_v2.whatsapp_connections
    where phone_e164 = '+351911111111'
    on conflict (connection_id, external_message_id)
      where external_message_id is not null
    do update set
      message_type = excluded.message_type,
      body_redacted = excluded.body_redacted,
      status = excluded.status
  $$,
  'later Edge upsert enriches the status-only placeholder'
);
reset role;

select ok(
  (
    select status = 'delivered'
      and message_type = 'text'
      and body_redacted = 'Enriched body'
    from app_v2.whatsapp_messages
    where external_message_id = 'status-before-upsert'
  ),
  'placeholder enrichment cannot regress its monotonic status'
);

insert into app_v2.whatsapp_messages (
  space_id, connection_id, direction, status, external_message_id
)
select space_id, id, 'outbound', 'queued', 'status-message-1'
from app_v2.whatsapp_connections
where phone_e164 = '+351911111111';

set local role service_role;
select lives_ok(
  $$
    select app_v2.apply_whatsapp_message_status(
      (select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'),
      'status-message-1',
      'delivered'
    )
  $$,
  'service role advances outbound message status'
);
select lives_ok(
  $$
    select app_v2.apply_whatsapp_message_status(
      (select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'),
      'status-message-1',
      'sent'
    )
  $$,
  'late sent callback is accepted without regressing delivered'
);
select lives_ok(
  $$
    select app_v2.apply_whatsapp_message_status(
      (select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'),
      'status-message-1',
      'failed'
    )
  $$,
  'late failure callback is accepted without regressing delivered'
);
reset role;

select is(
  (select status from app_v2.whatsapp_messages where external_message_id = 'status-message-1'),
  'delivered'::app_v2.message_status,
  'out-of-order callbacks do not regress a delivered message'
);

set local role service_role;
select lives_ok(
  $$
    select app_v2.apply_whatsapp_message_status(
      (select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'),
      'status-message-1',
      'read'
    )
  $$,
  'delivered message may advance to read'
);
reset role;

select is(
  (select status from app_v2.whatsapp_messages where external_message_id = 'status-message-1'),
  'read'::app_v2.message_status,
  'read remains the highest successful message status'
);

insert into app_v2.whatsapp_jobs (
  space_id, message_id, job_type, payload, run_at
)
select space_id, id, 'process_message', '{"idempotency":"first"}'::jsonb, now() + interval '1 day'
from app_v2.whatsapp_messages
where external_message_id = 'provider-message-1'
  and connection_id = (
    select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'
  );

insert into app_v2.categories (space_id, name, transaction_type, is_system)
select message.space_id, 'Lunch', 'expense', false
from app_v2.whatsapp_messages message
where message.external_message_id = 'provider-message-1'
on conflict (space_id, transaction_type, name) do nothing;

insert into app_v2.whatsapp_media (
  space_id, message_id, storage_path, mime_type, expires_at
)
select message.space_id, message.id, 'completion/inbound-receipt.jpg', 'image/jpeg', now() + interval '1 day'
from app_v2.whatsapp_messages message
where message.external_message_id = 'provider-message-1'
  and message.connection_id = (
    select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'
  );

select throws_ok(
  $$
    insert into app_v2.whatsapp_jobs (
      space_id, message_id, job_type, payload, run_at
    )
    select space_id, id, 'process_message', '{"idempotency":"retry"}'::jsonb, now() + interval '1 day'
    from app_v2.whatsapp_messages
    where external_message_id = 'provider-message-1'
      and connection_id = (
        select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'
      )
  $$,
  '23505',
  null,
  'message job insertion is idempotent by message and job type'
);

update app_v2.whatsapp_jobs
set status = 'processing',
    locked_by = 'completion-worker',
    locked_at = now()
where payload ->> 'idempotency' = 'first';

set local role service_role;
select throws_ok(
  $$
    select app_v2.complete_whatsapp_processing(
      job.id,
      job.locked_at,
      'completion-worker',
      '{"amount":"-1.00","currency":"EUR","description":"Invalid","category":"Lunch","merchant":"Cafe Central"}'::jsonb
    )
    from app_v2.whatsapp_jobs job
    where job.payload ->> 'idempotency' = 'first'
  $$,
  '22023',
  null,
  'completion rejects invalid parsed finance data atomically'
);
select throws_ok(
  $$
    select app_v2.complete_whatsapp_processing(
      job.id,
      job.locked_at + interval '1 second',
      'completion-worker',
      '{"amount":"12.34","currency":"EUR","description":"Lunch","category":"Lunch","merchant":"Cafe Central"}'::jsonb
    )
    from app_v2.whatsapp_jobs job
    where job.payload ->> 'idempotency' = 'first'
  $$,
  '40001',
  null,
  'completion rejects a stale lease fence'
);
select lives_ok(
  $$
    select app_v2.complete_whatsapp_processing(
      job.id,
      job.locked_at,
      'completion-worker',
      '{"amount":"12.34","currency":"EUR","description":"Lunch","category":"Lunch","merchant":"Cafe Central","type":"expense"}'::jsonb
    )
    from app_v2.whatsapp_jobs job
    where job.payload ->> 'idempotency' = 'first'
  $$,
  'completion atomically creates finance and confirmation work'
);
reset role;

select is(
  (
    select count(*)
    from app_v2.transactions transaction_row
    join app_v2.whatsapp_messages message
      on message.id = transaction_row.whatsapp_message_id
    where message.external_message_id = 'provider-message-1'
      and transaction_row.source = 'whatsapp'
      and transaction_row.amount = 12.34
      and transaction_row.merchant = 'Cafe Central'
      and transaction_row.category_id = (
        select category.id
        from app_v2.categories category
        where category.space_id = transaction_row.space_id
          and category.name = 'Lunch'
          and category.transaction_type = 'expense'
      )
  ),
  1::bigint,
  'completion creates one idempotent WhatsApp transaction'
);
select is(
  (
    select count(*)
    from app_v2.whatsapp_jobs send_job
    join app_v2.whatsapp_messages message on message.id = send_job.message_id
    where message.external_message_id = 'provider-message-1'
      and send_job.job_type = 'send_message'
      and send_job.payload ->> 'instance' = 'evolution-owner-a-1'
      and send_job.payload ->> 'phone_e164' = '+351911111111'
      and length(send_job.payload ->> 'text') > 0
  ),
  1::bigint,
  'completion creates one idempotent redacted confirmation job'
);
select ok(
  (
    select not media.is_valid and media.expires_at <= now()
    from app_v2.whatsapp_media media
    where media.storage_path = 'completion/inbound-receipt.jpg'
  ),
  'completion invalidates inbound media for immediate cleanup'
);
select ok(
  (
    select message.body_redacted = '[processed]'
      and message.metadata_redacted = '{"type":"image"}'::jsonb
    from app_v2.whatsapp_messages message
    where message.external_message_id = 'provider-message-1'
      and message.connection_id = (
        select id from app_v2.whatsapp_connections where phone_e164 = '+351911111111'
      )
  ),
  'completion removes sensitive inbound body and metadata atomically'
);
select ok(
  (
    select status = 'completed' and locked_by is null and locked_at is null
    from app_v2.whatsapp_jobs
    where payload ->> 'idempotency' = 'first'
  ),
  'completion marks process job completed and clears its lease'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$
    select app_v2.update_whatsapp_preferences(
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
      true,
      '{"language":"pt-PT"}'::jsonb
    )
  $$,
  'linked owner updates WhatsApp report preferences through the RPC'
);
select throws_ok(
  $$
    select app_v2.update_whatsapp_preferences(
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
      true,
      '[]'::jsonb
    )
  $$,
  '22023',
  null,
  'preferences RPC rejects non-object JSON'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$
    select app_v2.update_whatsapp_preferences(
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
      true,
      '{}'::jsonb
    )
  $$,
  '42501',
  null,
  'unlinked non-admin member cannot update another connection preferences'
);
reset role;

select is(
  (
    select count(*)
    from app_v2.whatsapp_connections connection
    join app_v2.spaces space on space.id = connection.space_id
    where space.owner_user_id = '10000000-0000-0000-0000-000000000001'
      and connection.monthly_report_opt_in
      and connection.report_preferences = '{"language":"pt-PT"}'::jsonb
  ),
  1::bigint,
  'preferences RPC changes exactly one deterministic connection'
);

update app_v2.whatsapp_connections connection
set monthly_report_opt_in = true
from app_v2.spaces space
where space.id = connection.space_id
  and space.owner_user_id = '10000000-0000-0000-0000-000000000001'
  and connection.status = 'active';

insert into app_v2.transactions (
  space_id, created_by, transaction_type, source, status, amount, currency,
  description, occurred_at
)
select id, owner_user_id, transaction_type, 'app', 'cleared', amount, 'EUR',
  description, occurred_at
from app_v2.spaces
cross join (
  values
    ('expense'::app_v2.transaction_type, 10.00::numeric, 'August expense', '2026-08-10 12:00:00+00'::timestamptz),
    ('income'::app_v2.transaction_type, 40.00::numeric, 'August income', '2026-08-11 12:00:00+00'::timestamptz)
) as fixture(transaction_type, amount, description, occurred_at)
where owner_user_id = '10000000-0000-0000-0000-000000000001';

set local role service_role;
select is(
  app_v2.enqueue_whatsapp_monthly_reports('2026-08-24 10:00:00+00'::timestamptz),
  0,
  'monthly reports are not enqueued before Lisbon local day 25'
);
select is(
  app_v2.enqueue_whatsapp_monthly_reports('2026-08-24 23:30:00+00'::timestamptz),
  1,
  'UTC day 24 after 23:00 is accepted as Lisbon local day 25'
);
select is(
  app_v2.enqueue_whatsapp_monthly_reports('2026-08-25 12:00:00+00'::timestamptz),
  0,
  'monthly report enqueue is idempotent for one space and month'
);
reset role;

select ok(
  (
    select report.status = 'ready'
      and report.delivery_status = 'scheduled'
      and report.month = '2026-08-01'::date
      and (report.summary_redacted ->> 'expense_total')::numeric = (
        select coalesce(sum(transaction_row.amount), 0)
        from app_v2.transactions transaction_row
        where transaction_row.space_id = report.space_id
          and transaction_row.transaction_type = 'expense'
          and transaction_row.status <> 'void'
          and transaction_row.occurred_at >= '2026-07-31 23:00:00+00'::timestamptz
          and transaction_row.occurred_at <= '2026-08-24 23:30:00+00'::timestamptz
      )
      and (report.summary_redacted ->> 'income_total')::numeric = 40.00
    from app_v2.whatsapp_monthly_reports report
    join app_v2.spaces space on space.id = report.space_id
    where space.owner_user_id = '10000000-0000-0000-0000-000000000001'
      and report.month = '2026-08-01'::date
  ),
  'monthly report stores deterministic redacted totals and delivery state'
);

select is(
  (
    select count(*)
    from app_v2.whatsapp_jobs job
    join app_v2.whatsapp_monthly_reports report
      on job.payload ->> 'report_id' = report.id::text
    where report.month = '2026-08-01'::date
      and job.job_type = 'send_message'
      and job.payload ?& array['instance', 'phone_e164', 'text', 'report_id']
      and job.payload ->> 'phone_e164' = (
        select connection.phone_e164
        from app_v2.whatsapp_connections connection
        where connection.space_id = report.space_id
          and connection.status = 'active'
          and connection.monthly_report_opt_in
          and connection.instance_name is not null
        order by connection.created_at, connection.id
        limit 1
      )
  ),
  1::bigint,
  'monthly report creates one deterministic redacted send_message job'
);

set local role service_role;
select lives_ok(
  $$
    select app_v2.mark_whatsapp_monthly_report_sent(id)
    from app_v2.whatsapp_monthly_reports
    where month = '2026-08-01'::date
  $$,
  'service role marks a monthly report sent'
);
select lives_ok(
  $$
    select app_v2.mark_whatsapp_monthly_report_sent(id)
    from app_v2.whatsapp_monthly_reports
    where month = '2026-08-01'::date
  $$,
  'marking a monthly report sent is idempotent'
);
reset role;

update app_v2.whatsapp_monthly_reports
set delivery_status = 'delivered', delivered_at = now()
where month = '2026-08-01'::date;

set local role service_role;
select lives_ok(
  $$
    select app_v2.mark_whatsapp_monthly_report_sent(id)
    from app_v2.whatsapp_monthly_reports
    where month = '2026-08-01'::date
  $$,
  'sent callback cannot regress an already delivered report'
);
reset role;

select ok(
  (
    select delivery_status = 'delivered'
      and delivery_attempted_at is not null
      and delivered_at is not null
    from app_v2.whatsapp_monthly_reports
    where month = '2026-08-01'::date
  ),
  'delivered report state remains monotonic'
);

insert into app_v2.whatsapp_jobs (
  space_id, job_type, status, payload, attempts, max_attempts, locked_by, locked_at
)
select id, 'process_message', 'processing', '{"lease":"expired"}'::jsonb,
  1, 5, 'old-worker', now() - interval '10 minutes'
from app_v2.spaces
where owner_user_id = '10000000-0000-0000-0000-000000000001';

insert into app_v2.whatsapp_jobs (
  space_id, job_type, status, payload, attempts, max_attempts, locked_by, locked_at
)
select id, 'process_message', 'processing', '{"lease":"active"}'::jsonb,
  1, 5, 'active-worker', now()
from app_v2.spaces
where owner_user_id = '10000000-0000-0000-0000-000000000001';

select throws_ok(
  $$
    insert into app_v2.whatsapp_jobs (
      space_id, job_type, status, payload
    )
    select id, 'process_message', 'processing', '{"lease":"missing-lock"}'::jsonb
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  null,
  'processing jobs require lock owner and timestamp'
);

select throws_ok(
  $$
    insert into app_v2.whatsapp_jobs (
      space_id, job_type, status, payload, locked_by, locked_at
    )
    select id, 'process_message', 'pending', '{"lease":"unexpected-lock"}'::jsonb,
      'unexpected-worker', now()
    from app_v2.spaces
    where owner_user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  '23514',
  null,
  'non-processing jobs cannot retain lock metadata'
);

insert into app_v2.whatsapp_jobs (
  space_id, job_type, status, payload, attempts, max_attempts, locked_by, locked_at
)
select id, 'process_message', 'processing', '{"lease":"exhausted"}'::jsonb,
  5, 5, 'exhausted-worker', now() - interval '10 minutes'
from app_v2.spaces
where owner_user_id = '10000000-0000-0000-0000-000000000001';

set local role service_role;
select lives_ok(
  $$select * from app_v2.claim_whatsapp_jobs('round-2-worker', 10)$$,
  'job claim reclaims an expired processing lease'
);
reset role;

select is(
  (select locked_by from app_v2.whatsapp_jobs where payload ->> 'lease' = 'expired'),
  'round-2-worker',
  'expired processing job is reclaimed'
);
select is(
  (select attempts from app_v2.whatsapp_jobs where payload ->> 'lease' = 'expired'),
  2,
  'reclaim increments attempts without exceeding max_attempts'
);
select is(
  (select locked_by from app_v2.whatsapp_jobs where payload ->> 'lease' = 'active'),
  'active-worker',
  'active processing lease is not stolen'
);
select is(
  (select status from app_v2.whatsapp_jobs where payload ->> 'lease' = 'exhausted'),
  'failed'::app_v2.job_status,
  'expired processing lease at max attempts is failed'
);
select ok(
  (
    select locked_by is null and locked_at is null
    from app_v2.whatsapp_jobs
    where payload ->> 'lease' = 'exhausted'
  ),
  'failed exhausted lease clears lock metadata'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$
    select *
    from app_v2.import_legacy_finances(
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
      '{"transactions":[{"type":"expense","amount":"12.34","currency":"EUR","description":"Decimal import"}]}'::jsonb,
      'pgtap-concurrent-contract'
    )
  $$,
  'first finance import succeeds'
);
select lives_ok(
  $$
    select *
    from app_v2.import_legacy_finances(
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
      '{"transactions":[{"type":"expense","amount":"99.99","currency":"EUR"}]}'::jsonb,
      'pgtap-concurrent-contract'
    )
  $$,
  'repeated finance import returns its reservation'
);
select is(
  (
    select count(*)
    from app_v2.data_imports
    where user_id = '10000000-0000-0000-0000-000000000001'
      and import_key = 'pgtap-concurrent-contract'
  ),
  1::bigint,
  'finance import creates one idempotency reservation'
);
select is(
  (
    select count(*)
    from app_v2.transactions
    where created_by = '10000000-0000-0000-0000-000000000001'
      and description = 'Decimal import'
      and amount = 12.34
  ),
  1::bigint,
  'decimal amount is imported exactly once'
);
select lives_ok(
  $$
    select * from app_v2.create_whatsapp_link(
      '+351912345678',
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001')
    )
  $$,
  'owner can create an E.164 WhatsApp link'
);
select throws_ok(
  $$
    select * from app_v2.create_whatsapp_link(
      '351912345678',
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001')
    )
  $$,
  '22023',
  null,
  'WhatsApp link rejects a phone without plus prefix'
);
reset role;

insert into storage.objects (bucket_id, name, owner_id)
values (
  'whatsapp-inbox',
  (select id::text from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001') || '/message.json',
  '10000000-0000-0000-0000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is(
  (select count(*) from storage.objects where bucket_id = 'whatsapp-inbox'),
  1::bigint,
  'space member may read its Storage prefix'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select is(
  (select count(*) from storage.objects where bucket_id = 'whatsapp-inbox'),
  0::bigint,
  'other tenant cannot read the Storage prefix'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$delete from storage.objects where bucket_id = 'whatsapp-inbox'$$,
  '42501',
  null,
  'direct viewer deletion is blocked so cleanup must use the Storage API'
);
reset role;

select is(
  (select count(*) from storage.objects where bucket_id = 'whatsapp-inbox'),
  1::bigint,
  'viewer cannot delete WhatsApp Storage objects'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$delete from storage.objects where bucket_id = 'whatsapp-inbox'$$,
  '42501',
  null,
  'direct owner deletion is blocked so cleanup must use the Storage API'
);
reset role;

select is(
  (select count(*) from storage.objects where bucket_id = 'whatsapp-inbox'),
  1::bigint,
  'blocked direct deletion preserves the WhatsApp Storage object'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$
    select app_v2.transfer_space_ownership(
      (select id from app_v2.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  'owner can transfer ownership atomically'
);
reset role;

select is(
  (
    select owner_user_id
    from app_v2.spaces
    where settings @> '{"review_test": true}'::jsonb
  ),
  '10000000-0000-0000-0000-000000000002'::uuid,
  'space owner matches the unique owner membership after transfer'
);

select * from finish();
rollback;
