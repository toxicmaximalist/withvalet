export const CONTACT_STATUSES = [
  "fresh",
  "contacted",
  "replied",
  "followed_up",
  "call_scheduled",
  "call_done",
  "interested",
  "not_interested",
  "ghosted",
] as const;

export const ACTIVITY_TYPES = [
  "email",
  "linkedin_message",
  "follow_up",
  "call",
  "demo",
  "telegram_message",
] as const;

export const ACTIVITY_STATUSES = [
  "planned",
  "sent",
  "replied",
  "followed_up_1",
  "followed_up_2",
] as const;

export const WORKSPACE_MEMBER_ROLES = ["owner", "member"] as const;

export const CONTACT_STATUS_LABELS: Record<(typeof CONTACT_STATUSES)[number], string> =
  {
    fresh: "Fresh",
    contacted: "Contacted",
    replied: "Replied",
    followed_up: "Followed up",
    call_scheduled: "Call scheduled",
    call_done: "Call done",
    interested: "Interested",
    not_interested: "Not interested",
    ghosted: "Ghosted",
  };

export const ACTIVITY_TYPE_LABELS: Record<(typeof ACTIVITY_TYPES)[number], string> = {
  email: "Email",
  linkedin_message: "LinkedIn message",
  follow_up: "Follow up",
  call: "Call",
  demo: "Demo",
  telegram_message: "Telegram message",
};

export const ACTIVITY_STATUS_LABELS: Record<
  (typeof ACTIVITY_STATUSES)[number],
  string
> = {
  planned: "Planned",
  sent: "Sent",
  replied: "Replied",
  followed_up_1: "Followed up 1",
  followed_up_2: "Followed up 2",
};
