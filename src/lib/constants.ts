export const CONTACT_STATUSES = [
  "new",
  "contacted",
  "replied",
  "interested",
  "not_interested",
  "meeting_scheduled",
  "closed",
  "archived",
] as const;

export const ACTIVITY_TYPES = [
  "email",
  "linkedin",
  "telegram",
  "whatsapp",
  "call",
  "meeting",
  "note",
] as const;

export const ACTIVITY_STATUSES = [
  "planned",
  "sent",
  "replied",
  "completed",
  "failed",
] as const;

export const WORKSPACE_MEMBER_ROLES = ["owner", "member"] as const;

export const CONTACT_STATUS_LABELS: Record<(typeof CONTACT_STATUSES)[number], string> =
  {
    new: "New",
    contacted: "Contacted",
    replied: "Replied",
    interested: "Interested",
    not_interested: "Not interested",
    meeting_scheduled: "Meeting scheduled",
    closed: "Closed",
    archived: "Archived",
  };

export const ACTIVITY_TYPE_LABELS: Record<(typeof ACTIVITY_TYPES)[number], string> = {
  email: "Email",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  call: "Call",
  meeting: "Meeting",
  note: "Note",
};

export const ACTIVITY_STATUS_LABELS: Record<
  (typeof ACTIVITY_STATUSES)[number],
  string
> = {
  planned: "Planned",
  sent: "Sent",
  replied: "Replied",
  completed: "Completed",
  failed: "Failed",
};
