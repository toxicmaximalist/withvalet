"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ActivityTimeline } from "@/components/activity-timeline";
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
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
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
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const formRef = useRef<HTMLFormElement | null>(null);
  const queryArg = { workspaceSlug };
  const activitiesQuery = useGetWorkspaceActivitiesQuery(queryArg, activityQueryOptions);
  const contactsQuery = useGetContactsQuery(queryArg, workspaceQueryOptions);
  const [createActivity, createActivityState] = useCreateActivityMutation();
  const activities = activitiesQuery.data ?? [];
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspaceSlug}
        title="Outreach"
        description="Track every planned or completed touchpoint across the workspace."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
          >
            Log activity
          </button>
        }
      />

      <NoticeBanner error={noticeError} success={noticeSuccess} />

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
            <TextArea id="content" name="content" required />
          </div>
          <div className="flex justify-end">
            <SubmitButton loading={createActivityState.isLoading}>Log activity</SubmitButton>
          </div>
        </form>
      </Modal>

      <section className="space-y-4">
          {activitiesQuery.isLoading && contactsQuery.isLoading && !activitiesQuery.data ? (
            <div className="panel rounded-[24px] px-4 py-8 text-sm text-muted">
              Loading outreach...
            </div>
          ) : (
          <>
          <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
            {activities.length} activity records across this workspace.
            {activitiesQuery.isFetching ? " Refreshing..." : ""}
          </div>

          {activities.length ? (
            <ActivityTimeline activities={activities} />
          ) : (
            <EmptyState
              title="No outreach recorded"
              description="Start logging conversations, emails, and meetings to build the workspace timeline."
            />
          )}

          {activities.length ? (
            <div className="panel rounded-[28px] p-6">
              <h3 className="text-base font-semibold text-foreground">Recent links</h3>
              <div className="mt-4 space-y-3 text-sm text-muted">
                {activities.slice(0, 5).map((activity) => (
                  <p key={activity.id}>
                    <Link
                      href={`/workspaces/${workspaceSlug}/contacts/${activity.contact_id}`}
                      className="text-foreground hover:text-accent"
                    >
                      {activity.contactName ?? "Unknown contact"}
                    </Link>
                    {activity.organizationName ? ` · ${activity.organizationName}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          </>
          )}
      </section>
    </div>
  );
}
