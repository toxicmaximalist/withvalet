"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CalendarDays,
  Link2,
  Mail,
  UserRound,
  X,
} from "lucide-react";

import {
  deleteAllActivitiesAction,
  importActivitiesAction,
} from "@/actions/outreach";
import { ActivityFeedTable } from "@/components/activity-feed-table";
import { EmptyState } from "@/components/empty-state";
import {
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { useNoticeState } from "@/components/workspace/use-notice-state";
import { getActivityContentText } from "@/lib/activity-content";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/constants";
import { cn, formatDate, getErrorMessage, sortByNewestDate } from "@/lib/utils";
import type { ActivityListItem } from "@/lib/data";
import {
  activityQueryOptions,
  useCreateActivityMutation,
  useGetContactsQuery,
  useGetWorkspaceActivitiesQuery,
  workspaceQueryOptions,
} from "@/store/workspace-api";

type OutreachViewProps = {
  error?: string;
  success?: string;
  workspaceSlug: string;
};

export function OutreachView({
  error,
  success,
  workspaceSlug,
}: OutreachViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityListItem | null>(null);
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const formRef = useRef<HTMLFormElement | null>(null);
  const queryArg = { workspaceSlug };
  const activitiesQuery = useGetWorkspaceActivitiesQuery(queryArg, activityQueryOptions);
  const contactsQuery = useGetContactsQuery(queryArg, workspaceQueryOptions);
  const [createActivity, createActivityState] = useCreateActivityMutation();
  const activities = sortByNewestDate(activitiesQuery.data ?? []);
  const contacts = contactsQuery.data ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const contactId = String(formData.get("contactId") ?? "");
    const selectedContact = contacts.find((contact) => contact.id === contactId);

    try {
      await createActivity({
        optimistic: {
          contactLastContactDate: selectedContact?.last_contact_date,
          contactName: selectedContact?.name,
          organizationName: selectedContact?.organizationName ?? null,
        },
        payload: {
          activityDate: String(formData.get("activityDate") ?? ""),
          contactId,
          content: String(formData.get("content") ?? ""),
          organizationId: selectedContact?.organization_id ?? null,
          status: String(formData.get("status") ?? "") as ActivityListItem["status"],
          type: String(formData.get("type") ?? "") as ActivityListItem["type"],
        },
        workspaceSlug,
      }).unwrap();

      formRef.current?.reset();
      const activityDateInput = formRef.current?.elements.namedItem(
        "activityDate",
      ) as HTMLInputElement | null;

      if (activityDateInput) {
        activityDateInput.value = new Date().toISOString().slice(0, 16);
      }

      setIsCreateModalOpen(false);
      showSuccess("Activity logged.");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  const completedCount = activities.filter((activity) => activity.status === "completed").length;
  const repliedCount = activities.filter((activity) => activity.status === "replied").length;

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Workspace outreach"
          title="Outreach"
          description="Track every planned or completed touchpoint across the workspace."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                disabled={!activities.length}
                className="inline-flex items-center rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete all
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                Import activities
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                Log activity
              </button>
            </div>
          }
        />

        <NoticeBanner error={noticeError} success={noticeSuccess} />

        <Modal
          open={isDeleteAllModalOpen}
          onClose={() => setIsDeleteAllModalOpen(false)}
          title="Delete all outreach activities"
          description="This removes every outreach activity record in the workspace. Contacts will remain intact."
        >
          <form action={deleteAllActivitiesAction} className="space-y-5">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="returnTo" value={`/workspaces/${workspaceSlug}/outreach`} />
            <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm leading-6 text-danger">
              This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <SubmitButton
                className="border-danger/40 bg-danger text-white shadow-none hover:scale-100 hover:bg-[#ef4444] hover:shadow-none"
                pendingLabel="Deleting..."
              >
                Delete all activities
              </SubmitButton>
            </div>
          </form>
        </Modal>

        <Modal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import outreach activities"
          description="Upload a CSV or Excel file. OpenAI will parse each touchpoint and link it to an existing or newly created contact."
        >
          <form action={importActivitiesAction} className="space-y-4">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="returnTo" value={`/workspaces/${workspaceSlug}/outreach`} />
            <div>
              <FieldLabel htmlFor="activitiesImportFile">CSV or Excel file</FieldLabel>
              <input
                id="activitiesImportFile"
                name="file"
                type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
                className="w-full rounded-2xl border border-white/10 bg-[#0f1012] px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-sm file:text-foreground"
              />
              <p className="mt-2 text-sm leading-6 text-muted">
                Include whichever identifiers you have: contact name, company, email, Telegram,
                WhatsApp, LinkedIn, date, channel, status, and note content.
              </p>
            </div>
            <div className="flex justify-end">
              <SubmitButton pendingLabel="Importing...">Import activities</SubmitButton>
            </div>
          </form>
        </Modal>

        <Modal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Log workspace activity"
          description="Capture a completed or planned touchpoint for any contact in this workspace."
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="returnTo" value={`/workspaces/${workspaceSlug}/outreach`} />
            <div>
              <FieldLabel htmlFor="contactId">Contact</FieldLabel>
              <SelectInput id="contactId" name="contactId" required>
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                    {contact.organizationName ? ` · ${contact.organizationName}` : ""}
                  </option>
                ))}
              </SelectInput>
            </div>
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
              <FieldLabel htmlFor="content">Content or note</FieldLabel>
              <TextArea
                id="content"
                name="content"
                placeholder="Summarize the touchpoint, decision, or follow-up context..."
                required
              />
            </div>
            <div className="flex justify-end">
              <SubmitButton loading={createActivityState.isLoading}>Log activity</SubmitButton>
            </div>
          </form>
        </Modal>

        {activitiesQuery.isLoading && contactsQuery.isLoading && !activitiesQuery.data ? (
          <div className="panel rounded-[24px] px-4 py-8 text-sm text-muted">
            Loading outreach...
          </div>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Total touchpoints"
                value={activities.length}
                detail={activitiesQuery.isFetching ? "Refreshing live data" : "Across the full workspace"}
              />
              <MetricCard
                label="Completed"
                value={completedCount}
                detail="Finished emails, calls, notes, or meetings"
              />
              <MetricCard
                label="Replies"
                value={repliedCount}
                detail="Touchpoints that resulted in a response"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Activity feed
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    Recent outreach
                  </h2>
                </div>
                <p className="text-sm text-muted">
                  Click any item to inspect the full activity record.
                </p>
              </div>

              {activities.length ? (
                <ActivityFeedTable activities={activities} onSelect={setSelectedActivity} />
              ) : (
                <EmptyState
                  title="No outreach recorded"
                  description="Start logging conversations, emails, and meetings to build the workspace timeline."
                />
              )}
            </div>
          </section>
        )}
      </div>

      <WorkspaceActivityDrawer
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <div className="panel rounded-[26px] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function WorkspaceActivityDrawer({
  activity,
  onClose,
  workspaceSlug,
}: {
  activity: ActivityListItem | null;
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
              Workspace activity
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
            {activity.contact_id ? (
              <div className="flex justify-start">
                <Link
                  href={`/workspaces/${workspaceSlug}/contacts/${activity.contact_id}`}
                  onClick={onClose}
                  className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
                >
                  View contact
                </Link>
              </div>
            ) : null}

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
                value={
                  activity.contact_id ? (
                    <Link
                      href={`/workspaces/${workspaceSlug}/contacts/${activity.contact_id}`}
                      className="text-foreground hover:text-accent"
                    >
                      {activity.contactName ?? "Unknown contact"}
                    </Link>
                  ) : (
                    activity.contactName ?? "Unknown contact"
                  )
                }
              />
              <DrawerMeta
                icon={Link2}
                label="Organization"
                value={activity.organizationName ?? "No linked organization"}
              />
              <DrawerMeta
                icon={ActivityTypeIconForMeta}
                label="Channel"
                value={ACTIVITY_TYPE_LABELS[activity.type]}
              />
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
  icon: React.ComponentType<{ className?: string }>;
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

function ActivityTypeIconForMeta({ className }: { className?: string }) {
  return <Mail className={className} />;
}
