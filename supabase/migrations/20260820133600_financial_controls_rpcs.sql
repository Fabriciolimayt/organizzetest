create or replace function app_v2.activate_budget_plan(target_plan_id uuid)
returns app_v2.budget_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target app_v2.budget_plans;
begin
  select * into target from app_v2.budget_plans where id = target_plan_id for update;
  if target.id is null or not app_private.has_space_role(target.space_id, array['owner', 'admin', 'member']::app_v2.member_role[]) then
    raise exception 'budget plan not found or access denied' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target.space_id::text, 0));
  update app_v2.budget_plans
  set is_active = false
  where space_id = target.space_id
    and id <> target.id
    and is_active
    and period_start <= target.period_end
    and period_end >= target.period_start;
  update app_v2.budget_plans set is_active = true where id = target.id returning * into target;
  return target;
end;
$$;

create or replace function app_v2.duplicate_budget_plan(target_plan_id uuid)
returns app_v2.budget_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  source app_v2.budget_plans;
  duplicate app_v2.budget_plans;
begin
  select * into source from app_v2.budget_plans where id = target_plan_id;
  if source.id is null or not app_private.has_space_role(source.space_id, array['owner', 'admin', 'member']::app_v2.member_role[]) then
    raise exception 'budget plan not found or access denied' using errcode = '42501';
  end if;

  insert into app_v2.budget_plans (space_id, created_by, name, expected_income, period_start, period_end, currency, is_active)
  values (source.space_id, auth.uid(), source.name || ' (cópia)', source.expected_income, source.period_start, source.period_end, source.currency, false)
  returning * into duplicate;

  insert into app_v2.budget_allocations (space_id, budget_plan_id, category_id, amount, percentage)
  select source.space_id, duplicate.id, category_id, amount, percentage
  from app_v2.budget_allocations
  where budget_plan_id = source.id and space_id = source.space_id;

  return duplicate;
end;
$$;

create or replace function app_v2.update_budget_plan(
  target_plan_id uuid,
  plan_name text,
  plan_expected_income numeric,
  plan_period_start date,
  plan_period_end date,
  plan_currency varchar
)
returns app_v2.budget_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target app_v2.budget_plans;
begin
  select * into target from app_v2.budget_plans where id = target_plan_id for update;
  if target.id is null or not app_private.has_space_role(target.space_id, array['owner', 'admin', 'member']::app_v2.member_role[]) then
    raise exception 'budget plan not found or access denied' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target.space_id::text, 0));
  update app_v2.budget_plans
  set name = btrim(plan_name), expected_income = plan_expected_income,
      period_start = plan_period_start, period_end = plan_period_end,
      currency = upper(plan_currency)
  where id = target.id returning * into target;
  if target.is_active then
    update app_v2.budget_plans
    set is_active = false
    where space_id = target.space_id and id <> target.id and is_active
      and budget_plans.period_start <= target.period_end
      and budget_plans.period_end >= target.period_start;
  end if;
  return target;
end;
$$;

revoke all on function app_v2.activate_budget_plan(uuid) from public, anon;
revoke all on function app_v2.duplicate_budget_plan(uuid) from public, anon;
revoke all on function app_v2.update_budget_plan(uuid, text, numeric, date, date, varchar) from public, anon;
grant execute on function app_v2.activate_budget_plan(uuid) to authenticated;
grant execute on function app_v2.duplicate_budget_plan(uuid) to authenticated;
grant execute on function app_v2.update_budget_plan(uuid, text, numeric, date, date, varchar) to authenticated;
