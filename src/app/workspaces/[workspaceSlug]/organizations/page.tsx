import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { getOrganizations, getWorkspaceContext } from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";
import { formatDate } from "@/lib/utils";

type OrganizationsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationsPage({
  params,
  searchParams,
}: OrganizationsPageProps) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const [organizations, query] = await Promise.all([
    getOrganizations(workspace.id),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Organizations"
        description="Organizations are created from contact assignment and become the shared home for relationship context."
      />

      <NoticeBanner
        error={getMessageValue(query.error)}
        success={getMessageValue(query.success)}
      />

      <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
        {organizations.length} organizations generated from contact assignment.
      </div>

      <section>
        <DataTable
          data={organizations}
          emptyState={
            <EmptyState
              title="No organizations yet"
              description="Organizations appear automatically when contacts are assigned to a company."
            />
          }
          columns={[
            {
              key: "name",
              header: "Organization",
              render: (organization) => (
                <div>
                  <Link
                    href={`/workspaces/${workspaceSlug}/organizations/${organization.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {organization.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {organization.website || "No website set"}
                  </p>
                </div>
              ),
            },
            {
              key: "note",
              header: "Note",
              render: (organization) => (
                <p className="max-w-md text-sm text-muted">
                  {organization.note || "No note yet"}
                </p>
              ),
            },
            {
              key: "contacts",
              header: "Contacts",
              render: (organization) => (
                <span className="text-sm text-foreground">
                  {organization.contactCount}
                </span>
              ),
            },
            {
              key: "activity",
              header: "Activity",
              render: (organization) => (
                <span className="text-sm text-foreground">
                  {organization.activityCount}
                </span>
              ),
            },
            {
              key: "created",
              header: "Created",
              render: (organization) => (
                <span className="text-sm text-muted">
                  {formatDate(organization.created_at)}
                </span>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
