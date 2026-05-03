create or replace function public.accept_workspace_invitations_for_current_user()
returns table (workspace_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  normalized_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  if normalized_email = '' then
    return;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  select invitation.workspace_id, auth.uid(), invitation.role
  from public.workspace_invitations as invitation
  where invitation.email = normalized_email
  on conflict (workspace_id, user_id) do nothing;

  return query
  with deleted_invitations as (
    delete from public.workspace_invitations
    where workspace_invitations.email = normalized_email
    returning workspace_invitations.workspace_id
  )
  select distinct deleted_invitations.workspace_id
  from deleted_invitations;
end;
$$;
