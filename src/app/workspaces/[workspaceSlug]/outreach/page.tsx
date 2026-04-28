import Link from "next/link";

import { createActivityAction } from "@/actions/outreach";
import { ActivityTimeline } from "@/components/activity-timeline";
import { EmptyState } from "@/components/empty-state";
import {
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/constants";
import {
  getContactOptions,
  getWorkspaceActivities,
  getWorkspaceContext,
} from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";

type OutreachPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OutreachPage({
  params,
  searchParams,
}: OutreachPageProps) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const [activities, contacts, query] = await Promise.all([
    getWorkspaceActivities(workspace.id),
    getContactOptions(workspace.id),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Outreach"
        description="Track every planned or completed touchpoint across the workspace."
      />

      <NoticeBanner
        error={getMessageValue(query.error)}
        success={getMessageValue(query.success)}
      />

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <div className="panel rounded-[28px] p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Log workspace activity
            </h2>
            <form action={createActivityAction} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input
                type="hidden"
                name="returnTo"
                value={`/workspaces/${workspaceSlug}/outreach`}
              />
              <div>
                <FieldLabel htmlFor="contactId">Contact</FieldLabel>
                <SelectInput id="contactId" name="contactId" required>
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.organizationName
                        ? ` · ${contact.organizationName}`
                        : ""}
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
              <SubmitButton className="w-full">Log activity</SubmitButton>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
            {activities.length} activity records across this workspace.
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
                    {activity.organizationName
                      ? ` · ${activity.organizationName}`
                      : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
