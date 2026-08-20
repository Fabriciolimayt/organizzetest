create or replace function app_private.has_paid_subscription(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from app_v2.subscriptions
    where user_id = target_user_id and status in ('trialing', 'active')
      and (current_period_end is null or current_period_end > now())
  );
$$;

create or replace function app_private.enforce_paid_capabilities()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if app_private.has_paid_subscription(auth.uid()) then return new; end if;
  if tg_table_name = 'spaces' and new.kind = 'family' and exists (
    select 1 from app_v2.spaces where owner_user_id = auth.uid() and kind = 'family'
  ) then raise exception 'O plano gratuito permite um espaço familiar.' using errcode = '42501'; end if;
  if tg_table_name = 'budget_plans' and exists (
    select 1 from app_v2.budget_plans where space_id = new.space_id
  ) then raise exception 'O plano gratuito permite um plano de orçamento.' using errcode = '42501'; end if;
  if tg_table_name = 'whatsapp_connections' then
    raise exception 'A automação por WhatsApp requer uma assinatura ativa.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger spaces_paid_capability before insert on app_v2.spaces
for each row execute function app_private.enforce_paid_capabilities();
create trigger budget_plans_paid_capability before insert on app_v2.budget_plans
for each row execute function app_private.enforce_paid_capabilities();
create trigger whatsapp_connections_paid_capability before insert on app_v2.whatsapp_connections
for each row execute function app_private.enforce_paid_capabilities();

revoke all on function app_private.has_paid_subscription(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.enforce_paid_capabilities() from public, anon, authenticated, service_role;
