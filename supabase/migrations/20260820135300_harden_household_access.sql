drop policy if exists space_members_insert_admin on app_v2.space_members;

revoke insert, update, delete on app_v2.space_members from authenticated;
grant update (role) on app_v2.space_members to authenticated;

revoke select, insert, update, delete on app_v2.space_invitations from authenticated;
grant select (
  id, space_id, email, role, status, invited_by, accepted_by, accepted_at,
  expires_at, created_at, updated_at
) on app_v2.space_invitations to authenticated;
grant insert (space_id, email, role, status, token_hash, invited_by, expires_at)
on app_v2.space_invitations to authenticated;
grant update (status) on app_v2.space_invitations to authenticated;

create policy profiles_select_shared_space
on app_v2.profiles for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from app_v2.space_members target
    join app_v2.space_members current_member on current_member.space_id = target.space_id
    where target.user_id = profiles.user_id
      and current_member.user_id = (select auth.uid())
  )
);
