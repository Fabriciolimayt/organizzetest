create or replace function app_v2.save_budget_plan(
  target_space_id uuid,
  target_plan_id uuid,
  plan_name text,
  plan_expected_income numeric,
  plan_period_start date,
  plan_period_end date,
  plan_currency varchar,
  plan_allocations jsonb
)
returns app_v2.budget_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target app_v2.budget_plans;
begin
  if not app_private.has_space_role(target_space_id, array['owner', 'admin', 'member']::app_v2.member_role[]) then
    raise exception 'access denied' using errcode = '42501';
  end if;
  if jsonb_typeof(plan_allocations) <> 'array' or jsonb_array_length(plan_allocations) = 0 then
    raise exception 'invalid allocations' using errcode = '22023';
  end if;
  if (select count(*) <> count(distinct category_id) or round(sum(percentage), 2) <> 100
      from jsonb_to_recordset(plan_allocations) as item(category_id uuid, percentage numeric, amount numeric)) then
    raise exception 'invalid allocations' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(plan_allocations) as item(category_id uuid, percentage numeric, amount numeric)
    left join app_v2.categories category on category.id = item.category_id and category.space_id = target_space_id and category.transaction_type = 'expense'
    where category.id is null or item.percentage < 0 or item.percentage > 100 or item.amount < 0
  ) then
    raise exception 'invalid allocation category' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_space_id::text, 0));
  if target_plan_id is null then
    insert into app_v2.budget_plans (space_id, created_by, name, expected_income, period_start, period_end, currency, is_active)
    values (target_space_id, auth.uid(), btrim(plan_name), plan_expected_income, plan_period_start, plan_period_end, upper(plan_currency), true)
    returning * into target;
  else
    update app_v2.budget_plans
    set name = btrim(plan_name), expected_income = plan_expected_income, period_start = plan_period_start,
        period_end = plan_period_end, currency = upper(plan_currency), is_active = true
    where id = target_plan_id and space_id = target_space_id returning * into target;
    if target.id is null then raise exception 'budget plan not found' using errcode = 'P0002'; end if;
  end if;

  update app_v2.budget_plans set is_active = false
  where space_id = target_space_id and id <> target.id and is_active
    and period_start <= target.period_end and period_end >= target.period_start;
  delete from app_v2.budget_allocations where space_id = target_space_id and budget_plan_id = target.id;
  insert into app_v2.budget_allocations (space_id, budget_plan_id, category_id, percentage, amount)
  select target_space_id, target.id, item.category_id, item.percentage, item.amount
  from jsonb_to_recordset(plan_allocations) as item(category_id uuid, percentage numeric, amount numeric);
  return target;
end;
$$;

revoke all on function app_v2.save_budget_plan(uuid, uuid, text, numeric, date, date, varchar, jsonb) from public, anon;
grant execute on function app_v2.save_budget_plan(uuid, uuid, text, numeric, date, date, varchar, jsonb) to authenticated;
