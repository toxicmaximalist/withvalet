create or replace function public.can_access_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id = auth.uid()
    or exists (
      select 1
      from public.workspace_members as viewer
      join public.workspace_members as member
        on member.workspace_id = viewer.workspace_id
      where viewer.user_id = auth.uid()
        and member.user_id = target_user_id
    );
$$;

grant execute on function public.can_access_profile(uuid) to authenticated;

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_select_shared_workspace_member"
on public.profiles
for select
to authenticated
using (public.can_access_profile(id));
