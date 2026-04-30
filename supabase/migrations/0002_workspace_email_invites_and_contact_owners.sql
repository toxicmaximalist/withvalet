create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (email = lower(trim(email))),
  role public.workspace_role not null default 'member',
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, email)
);

alter table public.contacts
add column responsible_user_id uuid references auth.users (id) on delete set null;

create index workspace_invitations_workspace_id_idx
on public.workspace_invitations (workspace_id);

create index workspace_invitations_email_idx
on public.workspace_invitations (email);

create index contacts_responsible_user_id_idx
on public.contacts (responsible_user_id);

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
    where email = normalized_email
    returning workspace_id
  )
  select distinct deleted_invitations.workspace_id
  from deleted_invitations;
end;
$$;

create or replace function public.clear_removed_member_contact_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contacts
  set responsible_user_id = null
  where workspace_id = old.workspace_id
    and responsible_user_id = old.user_id;

  return old;
end;
$$;

create trigger workspace_members_clear_contact_assignments
after delete on public.workspace_members
for each row
execute function public.clear_removed_member_contact_assignments();

alter table public.workspace_invitations enable row level security;

grant execute on function public.accept_workspace_invitations_for_current_user() to authenticated;

create policy "workspace_invitations_select_member"
on public.workspace_invitations
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "workspace_invitations_insert_owner"
on public.workspace_invitations
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

create policy "workspace_invitations_delete_owner"
on public.workspace_invitations
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));
