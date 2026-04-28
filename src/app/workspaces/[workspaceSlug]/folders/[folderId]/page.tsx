import Link from "next/link";

import { deleteFolderAction, syncFolderContactsAction } from "@/actions/folders";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { NoticeBanner } from "@/components/notice-banner";
import { OrganizationBadge } from "@/components/organization-badge";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { getFolderDetail, getWorkspaceContext } from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";
import { formatDate } from "@/lib/utils";

type FolderDetailPageProps = {
  params: Promise<{ workspaceSlug: string; folderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FolderDetailPage({
  params,
  searchParams,
}: FolderDetailPageProps) {
  const { workspaceSlug, folderId } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const [folder, query] = await Promise.all([
    getFolderDetail(workspace.id, folderId),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Folder detail"
        title={folder.name}
        description={`Created ${formatDate(folder.created_at)}. Add or remove contacts to shape the group.`}
        actions={
          <form action={deleteFolderAction}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="folderId" value={folder.id} />
            <button className="rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger/10">
              Delete folder
            </button>
          </form>
        }
      />

      <NoticeBanner
        error={getMessageValue(query.error)}
        success={getMessageValue(query.success)}
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-foreground">Membership editor</h2>
          <p className="mt-2 text-sm text-muted">
            Pick every contact that should belong to this folder. A contact can be in multiple folders.
          </p>
          <form action={syncFolderContactsAction} className="mt-6 space-y-4">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="folderId" value={folder.id} />
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-2">
              {folder.selectableContacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <input
                    type="checkbox"
                    name="contactIds"
                    value={contact.id}
                    defaultChecked={contact.selected}
                    className="mt-1 size-4 rounded border-white/20 bg-transparent text-accent"
                  />
                  <div>
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {contact.role || "No role set"}
                      {contact.organizationName ? ` · ${contact.organizationName}` : ""}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <SubmitButton>Save membership</SubmitButton>
          </form>
        </div>

        <DataTable
          data={folder.contacts}
          emptyState={
            <EmptyState
              title="No contacts in this folder"
              description="Use the membership editor to assign contacts to this collection."
            />
          }
          columns={[
            {
              key: "contact",
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
              key: "organization",
              header: "Organization",
              render: (contact) => (
                <OrganizationBadge
                  name={contact.organizationName}
                  href={
                    contact.organization_id
                      ? `/workspaces/${workspaceSlug}/organizations/${contact.organization_id}`
                      : undefined
                  }
                />
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (contact) => <span className="text-sm text-muted">{contact.status}</span>,
            },
          ]}
        />
      </section>
    </div>
  );
}
