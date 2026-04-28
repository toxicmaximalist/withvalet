create extension if not exists pgcrypto;

create type public.contact_status as enum (
  'new',
  'contacted',
  'replied',
  'interested',
  'not_interested',
  'meeting_scheduled',
  'closed',
  'archived'
);

create type public.activity_type as enum (
  'email',
  'linkedin',
  'telegram',
  'whatsapp',
  'call',
  'meeting',
  'note'
);

create type public.activity_status as enum (
  'planned',
  'sent',
  'replied',
  'completed',
  'failed'
);

create type public.workspace_role as enum ('owner', 'member');

create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null check (char_length(trim(slug)) >= 2),
  invite_code text not null default public.generate_invite_code(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  website text,
  note text,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, workspace_id),
  unique (workspace_id, name)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  role text,
  organization_id uuid,
  telegram text,
  linkedin text,
  whatsapp text,
  gmail text,
  status public.contact_status not null default 'new',
  last_contact_date timestamptz,
  note text,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, workspace_id),
  constraint contacts_organization_workspace_fk
    foreign key (organization_id, workspace_id)
    references public.organizations (id, workspace_id)
    on delete set null
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, workspace_id),
  unique (workspace_id, name)
);

create table public.contact_folders (
  contact_id uuid not null,
  folder_id uuid not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (contact_id, folder_id),
  constraint contact_folders_contact_workspace_fk
    foreign key (contact_id, workspace_id)
    references public.contacts (id, workspace_id)
    on delete cascade,
  constraint contact_folders_folder_workspace_fk
    foreign key (folder_id, workspace_id)
    references public.folders (id, workspace_id)
    on delete cascade
);

create table public.outreach_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null,
  organization_id uuid,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type public.activity_type not null,
  status public.activity_status not null default 'planned',
  content text not null,
  activity_date timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint outreach_contact_workspace_fk
    foreign key (contact_id, workspace_id)
    references public.contacts (id, workspace_id)
    on delete cascade,
  constraint outreach_organization_workspace_fk
    foreign key (organization_id, workspace_id)
    references public.organizations (id, workspace_id)
    on delete set null
);

create unique index workspaces_slug_key on public.workspaces (lower(slug));
create unique index workspaces_invite_code_key on public.workspaces (invite_code);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index contacts_workspace_id_idx on public.contacts (workspace_id);
create index contacts_organization_id_idx on public.contacts (organization_id);
create index contacts_status_idx on public.contacts (status);
create index organizations_workspace_id_idx on public.organizations (workspace_id);
create index folders_workspace_id_idx on public.folders (workspace_id);
create index outreach_workspace_id_idx on public.outreach_activities (workspace_id);
create index outreach_contact_id_idx on public.outreach_activities (contact_id);
create index outreach_org_id_idx on public.outreach_activities (organization_id);
create index outreach_activity_date_idx on public.outreach_activities (activity_date desc);
create index contact_folders_workspace_id_idx on public.contact_folders (workspace_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.sync_workspace_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do update
    set role = 'owner';

  return new;
end;
$$;

create trigger workspaces_owner_membership
after insert on public.workspaces
for each row
execute function public.sync_workspace_owner_membership();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces
    where id = target_workspace_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.join_workspace_by_invite_code(invite_code_input text)
returns table (id uuid, name text, slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace public.workspaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_workspace
  from public.workspaces
  where invite_code = upper(trim(invite_code_input));

  if target_workspace.id is null then
    raise exception 'Workspace not found for invite code';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (target_workspace.id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  return query
  select target_workspace.id, target_workspace.name, target_workspace.slug;
end;
$$;

create or replace function public.regenerate_workspace_invite_code(target_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'Only workspace owners can regenerate invite codes';
  end if;

  new_code := public.generate_invite_code();

  update public.workspaces
  set invite_code = new_code
  where id = target_workspace_id;

  return new_code;
end;
$$;

create or replace function public.refresh_contact_last_contact_date(
  target_contact_id uuid,
  target_workspace_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.contacts
  set last_contact_date = (
    select max(activity_date)
    from public.outreach_activities
    where contact_id = target_contact_id
      and workspace_id = target_workspace_id
      and status in ('sent', 'replied', 'completed')
  )
  where id = target_contact_id
    and workspace_id = target_workspace_id;
$$;

create or replace function public.sync_contact_last_contact_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_contact_last_contact_date(old.contact_id, old.workspace_id);
    return old;
  end if;

  if tg_op = 'UPDATE'
     and (old.contact_id <> new.contact_id or old.workspace_id <> new.workspace_id) then
    perform public.refresh_contact_last_contact_date(old.contact_id, old.workspace_id);
  end if;

  perform public.refresh_contact_last_contact_date(new.contact_id, new.workspace_id);
  return new;
end;
$$;

create trigger outreach_refresh_contact_date
after insert or update or delete on public.outreach_activities
for each row
execute function public.sync_contact_last_contact_date();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.organizations enable row level security;
alter table public.contacts enable row level security;
alter table public.folders enable row level security;
alter table public.contact_folders enable row level security;
alter table public.outreach_activities enable row level security;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.join_workspace_by_invite_code(text) to authenticated;
grant execute on function public.regenerate_workspace_invite_code(uuid) to authenticated;
grant execute on function public.refresh_contact_last_contact_date(uuid, uuid) to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

create policy "workspaces_insert_owner"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (owner_id = auth.uid());

create policy "workspaces_delete_owner"
on public.workspaces
for delete
to authenticated
using (public.is_workspace_owner(id));

create policy "workspace_members_select_member"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "workspace_members_insert_self_or_owner"
on public.workspace_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.is_workspace_member(workspace_id)
    or public.is_workspace_owner(workspace_id)
  )
);

create policy "workspace_members_update_owner"
on public.workspace_members
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

create policy "workspace_members_delete_owner_or_self"
on public.workspace_members
for delete
to authenticated
using (
  public.is_workspace_owner(workspace_id)
  or user_id = auth.uid()
);

create policy "organizations_member_all"
on public.organizations
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "contacts_member_all"
on public.contacts
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "folders_member_all"
on public.folders
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "contact_folders_member_all"
on public.contact_folders
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "outreach_member_all"
on public.outreach_activities
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
