alter type public.contact_status rename to contact_status_old;

create type public.contact_status as enum (
  'fresh',
  'contacted',
  'replied',
  'followed_up',
  'call_scheduled',
  'call_done',
  'interested',
  'not_interested'
);

alter table public.contacts
alter column status drop default;

alter table public.contacts
alter column status type public.contact_status
using (
  case status::text
    when 'new' then 'fresh'
    when 'contacted' then 'contacted'
    when 'replied' then 'replied'
    when 'interested' then 'interested'
    when 'not_interested' then 'not_interested'
    when 'meeting_scheduled' then 'call_scheduled'
    when 'closed' then 'not_interested'
    when 'archived' then 'not_interested'
  end
)::public.contact_status;

alter table public.contacts
alter column status set default 'fresh';

drop type public.contact_status_old;
