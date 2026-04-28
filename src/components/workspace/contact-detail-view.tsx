"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { deleteContactAction } from "@/actions/contacts";
import { ActivityTimeline } from "@/components/activity-timeline";
import { AIPlaceholderCard } from "@/components/ai-placeholder-card";
import { FieldLabel, SelectInput, TextArea, TextInput } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { useNoticeState } from "@/components/workspace/use-notice-state";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
} from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { ContactDetail } from "@/lib/data";
import {
  activityQueryOptions,
  useCreateActivityMutation,
  useGetContactDetailQuery,
  useUpdateContactMutation,
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
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const queryArg = { workspaceSlug, contactId };
  const activityFormRef = useRef<HTMLFormElement | null>(null);
  const { data, isFetching, isLoading } = useGetContactDetailQuery(queryArg, activityQueryOptions);
  const [updateContact, updateContactState] = useUpdateContactMutation();
  const [createActivity, createActivityState] = useCreateActivityMutation();
  const contact = data;

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contact profile"
        title={contact.name}
        description={`Edit contact details, review related folders, and manage the outreach timeline${isFetching ? " · Refreshing live data" : "."}`}
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
              placeholder="Shared an intro note, booked a follow-up, or captured a call outcome..."
              required
            />
          </div>
          <div className="flex justify-end">
            <SubmitButton loading={createActivityState.isLoading}>Log activity</SubmitButton>
          </div>
        </form>
      </Modal>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Contact details</h2>
              <p className="mt-1 text-sm text-muted">
                Last contact {formatDate(contact.last_contact_date, "has not happened yet")}
              </p>
            </div>
            <form action={deleteContactAction}>
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input type="hidden" name="contactId" value={contact.id} />
              <button className="rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger/10">
                Delete
              </button>
            </form>
          </div>

          <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="contactId" value={contact.id} />
            <div>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <TextInput id="name" name="name" defaultValue={contact.name} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <TextInput id="role" name="role" defaultValue={contact.role ?? ""} />
              </div>
              <div>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <SelectInput id="status" name="status" defaultValue={contact.status}>
                  {CONTACT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CONTACT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="organizationName">Organization</FieldLabel>
              <TextInput
                id="organizationName"
                name="organizationName"
                defaultValue={contact.organizationName ?? ""}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="telegram">Telegram</FieldLabel>
                <TextInput id="telegram" name="telegram" defaultValue={contact.telegram ?? ""} />
              </div>
              <div>
                <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
                <TextInput id="linkedin" name="linkedin" defaultValue={contact.linkedin ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
                <TextInput id="whatsapp" name="whatsapp" defaultValue={contact.whatsapp ?? ""} />
              </div>
              <div>
                <FieldLabel htmlFor="gmail">Gmail</FieldLabel>
                <TextInput id="gmail" name="gmail" type="email" defaultValue={contact.gmail ?? ""} />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="note">Note</FieldLabel>
              <TextArea id="note" name="note" defaultValue={contact.note ?? ""} />
            </div>
            <SubmitButton loading={updateContactState.isLoading}>Save contact</SubmitButton>
          </form>
        </section>

        <div className="space-y-6">
          <div className="panel rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-foreground">Relationship context</h2>
            <div className="mt-5 space-y-4 text-sm text-muted">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Organization</p>
                <p className="mt-2 text-foreground">
                  {contact.organization_id ? (
                    <Link
                      href={`/workspaces/${workspaceSlug}/organizations/${contact.organization_id}`}
                      className="hover:text-accent"
                    >
                      {contact.organizationName}
                    </Link>
                  ) : (
                    "Unassigned"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Folders</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {contact.folders.length ? (
                    contact.folders.map((folder) => (
                      <Link
                        key={folder.id}
                        href={`/workspaces/${workspaceSlug}/folders/${folder.id}`}
                        className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-foreground"
                      >
                        {folder.name}
                      </Link>
                    ))
                  ) : (
                    <span>No folder assignments yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AIPlaceholderCard
            title="AI contact enrichment"
            description="Reserve this area for enrichment jobs that pull firmographic detail, social context, and confidence scoring into the profile."
          />
          <AIPlaceholderCard
            title="AI next best action"
            description="Use future signals from status, recency, and outreach patterns to suggest the best move for this relationship."
          />
        </div>
      </div>

      <section className="space-y-5">
        <div>
          <PageHeader
            title="Outreach timeline"
            description="A running history of this contact's manual outreach activity."
            actions={
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(true)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
              >
                Log outreach
              </button>
            }
          />
          <div className="mt-5">
            <ActivityTimeline activities={contact.activities} />
          </div>
        </div>
      </section>
    </div>
  );
}
