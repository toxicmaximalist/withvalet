alter type public.contact_status add value if not exists 'ghosted';

alter type public.activity_type rename to activity_type_old;

create type public.activity_type as enum (
  'email',
  'linkedin_message',
  'follow_up',
  'call',
  'demo',
  'telegram_message'
);

alter type public.activity_status rename to activity_status_old;

create type public.activity_status as enum (
  'planned',
  'sent',
  'replied',
  'followed_up_1',
  'followed_up_2'
);

alter table public.outreach_activities
alter column status drop default;

alter table public.outreach_activities
alter column type type public.activity_type
using (
  case type::text
    when 'email' then 'email'
    when 'linkedin' then 'linkedin_message'
    when 'telegram' then 'telegram_message'
    when 'whatsapp' then 'telegram_message'
    when 'call' then 'call'
    when 'meeting' then 'demo'
    when 'note' then 'follow_up'
  end
)::public.activity_type;

alter table public.outreach_activities
alter column status type public.activity_status
using (
  case status::text
    when 'planned' then 'planned'
    when 'sent' then 'sent'
    when 'replied' then 'replied'
    when 'completed' then 'sent'
    when 'failed' then 'followed_up_2'
  end
)::public.activity_status;

alter table public.outreach_activities
alter column status set default 'planned';

drop type public.activity_type_old;
drop type public.activity_status_old;
