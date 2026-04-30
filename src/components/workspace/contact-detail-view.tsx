"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FolderKanban,
  Link2,
  Mail,
  MessageCircleMore,
  Send,
  Signal,
  StickyNote,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { deleteContactAction } from "@/actions/contacts";
import { ActivityFeedTable } from "@/components/activity-feed-table";
import { FieldLabel, SelectInput, TextArea, TextInput } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { useNoticeState } from "@/components/workspace/use-notice-state";
import { getActivityContentText } from "@/lib/activity-content";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
} from "@/lib/constants";
import {
  cn,
  getErrorMessage,
  formatDate,
  getInitials,
  sortByNewestDate,
} from "@/lib/utils";
import type { ActivityListItem, ContactDetail } from "@/lib/data";
import {
  activityQueryOptions,
  useCreateActivityMutation,
  useGetContactDetailQuery,
  useGetWorkspaceMembersQuery,
  useUpdateContactMutation,
  workspaceQueryOptions,
} from "@/store/workspace-api";

type ContactDetailViewProps = {
  contactId: string;
  error?: string;
  success?: string;
  workspaceSlug: string;
};

export function ContactDetailView({
  contactId,
  error,
  success,
  workspaceSlug,
}: ContactDetailViewProps) {
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityListItem | null>(null);
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const queryArg = { workspaceSlug, contactId };
  const activityFormRef = useRef<HTMLFormElement | null>(null);
  const { data, isFetching, isLoading } = useGetContactDetailQuery(queryArg, activityQueryOptions);
  const membersQuery = useGetWorkspaceMembersQuery({ workspaceSlug }, workspaceQueryOptions);
  const [updateContact, updateContactState] = useUpdateContactMutation();
  const [createActivity, createActivityState] = useCreateActivityMutation();
  const contact = data;
  const sortedActivities = contact ? sortByNewestDate(contact.activities) : [];
  const members = membersQuery.data ?? [];

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await updateContact({
        contactId,
        payload: {
          gmail: String(formData.get("gmail") ?? ""),
          linkedin: String(formData.get("linkedin") ?? ""),
          name: String(formData.get("name") ?? ""),
          note: String(formData.get("note") ?? ""),
          organizationName: String(formData.get("organizationName") ?? ""),
          responsibleUserId: String(formData.get("responsibleUserId") ?? ""),
          role: String(formData.get("role") ?? ""),
          status: String(formData.get("status") ?? "") as ContactDetail["status"],
          telegram: String(formData.get("telegram") ?? ""),
          whatsapp: String(formData.get("whatsapp") ?? ""),
        },
        workspaceSlug,
      }).unwrap();
      showSuccess("Contact updated.");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  async function handleActivitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await createActivity({
        optimistic: {
          contactLastContactDate: contact?.last_contact_date,
          contactName: contact?.name,
          organizationName: contact?.organizationName,
        },
        payload: {
          activityDate: String(formData.get("activityDate") ?? ""),
          contactId,
          content: String(formData.get("content") ?? ""),
          organizationId: contact?.organization_id,
          status: String(formData.get("status") ?? "") as ContactDetail["activities"][number]["status"],
          type: String(formData.get("type") ?? "") as ContactDetail["activities"][number]["type"],
        },
        workspaceSlug,
      }).unwrap();

      activityFormRef.current?.reset();
      const activityDateInput = activityFormRef.current?.elements.namedItem(
        "activityDate",
      ) as HTMLInputElement | null;

      if (activityDateInput) {
        activityDateInput.value = new Date().toISOString().slice(0, 16);
      }

      setIsActivityModalOpen(false);
      showSuccess("Activity logged.");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  if (isLoading && !contact) {
    return (
      <div className="panel rounded-[28px] px-6 py-10 text-sm text-muted">
        Loading contact...
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="panel rounded-[28px] px-6 py-10 text-sm text-danger">
        Unable to load contact.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Contact profile"
          title={contact.name}
          description={`Update profile details and review every outreach touchpoint${isFetching ? " · Refreshing live data" : "."}`}
          actions={<StatusBadge status={contact.status} />}
        />

        <NoticeBanner error={noticeError} success={noticeSuccess} />

        <Modal
          open={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          title="Log outreach"
          description="Add a new touchpoint to this contact timeline."
        >
          <form
            ref={activityFormRef}
            onSubmit={handleActivitySubmit}
            className="space-y-4"
          >
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="contactId" value={contact.id} />
            <input type="hidden" name="organizationId" value={contact.organization_id ?? ""} />
            <input
              type="hidden"
              name="returnTo"
              value={`/workspaces/${workspaceSlug}/contacts/${contact.id}`}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <SelectInput id="type" name="type" defaultValue="email">
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {ACTIVITY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </SelectInput>
              </div>
              <div>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <SelectInput id="status" name="status" defaultValue="completed">
                  {ACTIVITY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ACTIVITY_STATUS_LABELS[status]}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="activityDate">Activity date</FieldLabel>
              <TextInput
                id="activityDate"
                name="activityDate"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="content">Note or message summary</FieldLabel>
              <TextArea
                id="content"
                name="content"
                placeholder="Shared a follow-up, booked a call, or captured the outcome..."
                required
              />
            </div>
            <div className="flex justify-end">
              <SubmitButton loading={createActivityState.isLoading}>Log activity</SubmitButton>
            </div>
          </form>
        </Modal>

        <div className="grid gap-6 xl:grid-cols-[minmax(420px,0.92fr)_minmax(460px,1.08fr)]">
          <section className="panel rounded-[30px] p-6">
            <div className="flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] text-lg font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {getInitials(contact.name) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    User profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">
                    {contact.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Last contact {formatDate(contact.last_contact_date, "has not happened yet")}
                  </p>
                </div>
              </div>

              <form action={deleteContactAction}>
                <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                <input type="hidden" name="contactId" value={contact.id} />
                <button className="rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger/10">
                  Delete
                </button>
              </form>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ContextCard
                icon={Building2}
                label="Organization"
                value={
                  contact.organization_id ? (
                    <Link
                      href={`/workspaces/${workspaceSlug}/organizations/${contact.organization_id}`}
                      className="text-foreground hover:text-accent"
                    >
                      {contact.organizationName}
                    </Link>
                  ) : (
                    "Unassigned"
                  )
                }
              />
              <ContextCard
                icon={FolderKanban}
                label="Folders"
                value={
                  contact.folders.length ? (
                    <div className="flex flex-wrap gap-2">
                      {contact.folders.map((folder) => (
                        <Link
                          key={folder.id}
                          href={`/workspaces/${workspaceSlug}/folders/${folder.id}`}
                          className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-foreground hover:border-white/16 hover:bg-white/[0.08]"
                        >
                          {folder.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    "No folder assignments"
                  )
                }
              />
              <ContextCard
                icon={UserRound}
                label="Responsible"
                value={contact.responsibleUserName ?? contact.responsibleUserEmail ?? "Unassigned"}
              />
            </div>

            <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input type="hidden" name="contactId" value={contact.id} />

              <div>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <InputWithIcon icon={UserRound}>
                  <TextInput
                    id="name"
                    name="name"
                    defaultValue={contact.name}
                    placeholder="Jane Doe"
                    required
                    className="pl-11"
                  />
                </InputWithIcon>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <InputWithIcon icon={BriefcaseBusiness}>
                    <TextInput
                      id="role"
                      name="role"
                      defaultValue={contact.role ?? ""}
                      placeholder="Founder, operator, investor..."
                      className="pl-11"
                    />
                  </InputWithIcon>
                </div>
                <div>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <InputWithIcon icon={Signal}>
                    <SelectInput id="status" name="status" defaultValue={contact.status} className="pl-11">
                      {CONTACT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {CONTACT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </SelectInput>
                  </InputWithIcon>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="organizationName">Organization</FieldLabel>
                <InputWithIcon icon={Building2}>
                  <TextInput
                    id="organizationName"
                    name="organizationName"
                    defaultValue={contact.organizationName ?? ""}
                    placeholder="Acme Ventures"
                    className="pl-11"
                  />
                </InputWithIcon>
              </div>
              <div>
                <FieldLabel htmlFor="responsibleUserId">Responsible person</FieldLabel>
                <InputWithIcon icon={UserRound}>
                  <SelectInput
                    id="responsibleUserId"
                    name="responsibleUserId"
                    defaultValue={contact.responsible_user_id ?? ""}
                    className="pl-11"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.fullName || member.email}
                      </option>
                    ))}
                  </SelectInput>
                </InputWithIcon>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="telegram">Telegram</FieldLabel>
                  <InputWithIcon icon={Send}>
                    <TextInput
                      id="telegram"
                      name="telegram"
                      defaultValue={contact.telegram ?? ""}
                      placeholder="@janedoe"
                      className="pl-11"
                    />
                  </InputWithIcon>
                </div>
                <div>
                  <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
                  <InputWithIcon icon={Link2}>
                    <TextInput
                      id="linkedin"
                      name="linkedin"
                      defaultValue={contact.linkedin ?? ""}
                      placeholder="linkedin.com/in/janedoe"
                      className="pl-11"
                    />
                  </InputWithIcon>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
                  <InputWithIcon icon={MessageCircleMore}>
                    <TextInput
                      id="whatsapp"
                      name="whatsapp"
                      defaultValue={contact.whatsapp ?? ""}
                      placeholder="+1 555 123 4567"
                      className="pl-11"
                    />
                  </InputWithIcon>
                </div>
                <div>
                  <FieldLabel htmlFor="gmail">Gmail</FieldLabel>
                  <InputWithIcon icon={Mail}>
                    <TextInput
                      id="gmail"
                      name="gmail"
                      type="email"
                      defaultValue={contact.gmail ?? ""}
                      placeholder="jane@company.com"
                      className="pl-11"
                    />
                  </InputWithIcon>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="note">Note</FieldLabel>
                <InputWithIcon icon={StickyNote} alignTop>
                  <TextArea
                    id="note"
                    name="note"
                    defaultValue={contact.note ?? ""}
                    placeholder="Add context, intro source, relationship notes, or follow-up guidance..."
                    className="min-h-36 pl-11"
                  />
                </InputWithIcon>
              </div>

              <SubmitButton loading={updateContactState.isLoading}>Save contact</SubmitButton>
            </form>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Outreach activities
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Activity feed
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Every outreach touchpoint for this contact, newest first.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsActivityModalOpen(true)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                Log outreach
              </button>
            </div>

            {sortedActivities.length ? (
              <ActivityFeedTable
                activities={sortedActivities}
                onSelect={setSelectedActivity}
              />
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No outreach activity yet
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Start the timeline by logging an email, call, note, or meeting.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <ActivityDetailsDrawer
        activity={selectedActivity}
        contact={contact}
        onClose={() => setSelectedActivity(null)}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}

function InputWithIcon({
  alignTop = false,
  children,
  icon: Icon,
}: {
  alignTop?: boolean;
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-4 z-10 size-4 text-muted-foreground",
          alignTop ? "top-4" : "top-1/2 -translate-y-1/2",
        )}
      />
      {children}
    </div>
  );
}

function ContextCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-3 text-sm text-muted">{value}</div>
    </div>
  );
}

function ActivityDetailsDrawer({
  activity,
  contact,
  onClose,
  workspaceSlug,
}: {
  activity: ActivityListItem | null;
  contact: ContactDetail;
  onClose: () => void;
  workspaceSlug: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        activity ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        aria-label="Close activity details"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity",
          activity ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/10 bg-[#09090b]/96 shadow-[-24px_0_80px_rgba(0,0,0,0.5)] transition-transform duration-300",
          activity ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Outreach details
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              {activity ? ACTIVITY_TYPE_LABELS[activity.type] : "Activity"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-muted hover:border-white/16 hover:bg-white/[0.05] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {activity ? (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {ACTIVITY_TYPE_LABELS[activity.type]}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground">
                  {ACTIVITY_STATUS_LABELS[activity.status]}
                </span>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Message or note
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-base leading-8 text-foreground">
                {getActivityContentText(activity.content)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DrawerMeta
                icon={CalendarDays}
                label="Activity date"
                value={formatDate(activity.activity_date, "No date", "MMMM d, yyyy · HH:mm")}
              />
              <DrawerMeta
                icon={UserRound}
                label="Contact"
                value={contact.name}
              />
              <DrawerMeta
                icon={Building2}
                label="Organization"
                value={
                  activity.organizationName ? (
                    contact.organization_id ? (
                      <Link
                        href={`/workspaces/${workspaceSlug}/organizations/${contact.organization_id}`}
                        className="text-foreground hover:text-accent"
                      >
                        {activity.organizationName}
                      </Link>
                    ) : (
                      activity.organizationName
                    )
                  ) : (
                    "None linked"
                  )
                }
              />
              <DrawerMeta
                icon={FolderKanban}
                label="Folder coverage"
                value={
                  contact.folders.length
                    ? contact.folders.map((folder) => folder.name).join(", ")
                    : "No folders assigned"
                }
              />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Contact channels
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ChannelRow icon={Mail} label="Gmail" value={contact.gmail} />
                <ChannelRow icon={Link2} label="LinkedIn" value={contact.linkedin} />
                <ChannelRow icon={Send} label="Telegram" value={contact.telegram} />
                <ChannelRow icon={MessageCircleMore} label="WhatsApp" value={contact.whatsapp} />
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function DrawerMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-3 text-sm leading-6 text-foreground">{value}</div>
    </div>
  );
}

function ChannelRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-2 text-sm text-foreground">{value || "Not provided"}</p>
    </div>
  );
}
