import Link from "next/link";

import { updateOrganizationAction } from "@/actions/organizations";
import { ActivityTimeline } from "@/components/activity-timeline";
import { AIPlaceholderCard } from "@/components/ai-placeholder-card";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FieldLabel, TextArea, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { getOrganizationDetail, getWorkspaceContext } from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";

type OrganizationDetailPageProps = {
  params: Promise<{ workspaceSlug: string; organizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationDetailPageProps) {
  const { workspaceSlug, organizationId } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const [organization, query] = await Promise.all([
    getOrganizationDetail(workspace.id, organizationId),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organization profile"
        title={organization.name}
        description="Keep the company record, related contacts, and outreach history in one place."
      />

      <NoticeBanner
        error={getMessageValue(query.error)}
        success={getMessageValue(query.success)}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="panel rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-foreground">Organization profile</h2>
          <form action={updateOrganizationAction} className="mt-6 space-y-4">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="organizationId" value={organization.id} />
            <div>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <TextInput id="name" name="name" defaultValue={organization.name} required />
            </div>
            <div>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <TextInput id="website" name="website" defaultValue={organization.website ?? ""} />
            </div>
            <div>
              <FieldLabel htmlFor="note">Note</FieldLabel>
              <TextArea id="note" name="note" defaultValue={organization.note ?? ""} />
            </div>
            <SubmitButton>Save organization</SubmitButton>
          </form>
        </section>

        <div className="space-y-6">
          <div className="panel rounded-[28px] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-accent">Linked records</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Contacts</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{organization.contacts.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Activities</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{organization.activities.length}</p>
              </div>
            </div>
          </div>

          <AIPlaceholderCard
            title="AI summary"
            description="Use future summarization to compress all contacts, notes, and outreach history into an executive snapshot."
          />
        </div>
      </div>

      <section className="space-y-5">
        <PageHeader
          title="Contacts in this organization"
          description="Everyone currently assigned to the company record."
        />
        <DataTable
          data={organization.contacts}
          emptyState={
            <EmptyState
              title="No contacts assigned"
              description="Contacts will appear here once they are linked to this organization."
            />
          }
          columns={[
            {
              key: "name",
              header: "Contact",
              render: (contact) => (
                <div>
                  <Link
                    href={`/workspaces/${workspaceSlug}/contacts/${contact.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {contact.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{contact.role || "No role set"}</p>
                </div>
              ),
            },
            {
              key: "channels",
              header: "Channels",
              render: (contact) => (
                <div className="text-xs leading-6 text-muted">
                  {[contact.telegram, contact.linkedin, contact.whatsapp, contact.gmail]
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((value) => (
                      <p key={value}>{value}</p>
                    ))}
                </div>
              ),
            },
            {
              key: "last",
              header: "Last contact",
              render: (contact) => <span className="text-sm text-muted">{contact.last_contact_date ?? "No activity"}</span>,
            },
          ]}
        />
      </section>

      <section className="space-y-5">
        <PageHeader
          title="Organization outreach"
          description="All outreach activity linked to this organization across contacts."
        />
        <ActivityTimeline activities={organization.activities} />
      </section>
    </div>
  );
}
