import Link from "next/link";

import { createFolderAction } from "@/actions/folders";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FieldLabel, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { getFolders, getWorkspaceContext } from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";
import { formatDate } from "@/lib/utils";

type FoldersPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FoldersPage({
  params,
  searchParams,
}: FoldersPageProps) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const [folders, query] = await Promise.all([
    getFolders(workspace.id),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Folders"
        description="Group contacts across campaigns, themes, or strategic focus areas."
      />

      <NoticeBanner
        error={getMessageValue(query.error)}
        success={getMessageValue(query.success)}
      />

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="panel rounded-[28px] p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Create folder
          </h2>
          <form action={createFolderAction} className="mt-6 space-y-4">
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <div>
              <FieldLabel htmlFor="name">Folder name</FieldLabel>
              <TextInput id="name" name="name" placeholder="Warm intros" required />
            </div>
            <SubmitButton className="w-full">Create folder</SubmitButton>
          </form>
        </div>

        <div className="space-y-4">
          <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
            {folders.length} folders available for grouping contacts by campaign or priority.
          </div>
          <DataTable
            data={folders}
            emptyState={
              <EmptyState
                title="No folders yet"
                description="Create folders to group contacts by campaign, segment, or priority."
              />
            }
            columns={[
              {
                key: "name",
                header: "Folder",
                render: (folder) => (
                  <Link
                    href={`/workspaces/${workspaceSlug}/folders/${folder.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {folder.name}
                  </Link>
                ),
              },
              {
                key: "count",
                header: "Contacts",
                render: (folder) => (
                  <span className="text-sm text-foreground">
                    {folder.contactCount}
                  </span>
                ),
              },
              {
                key: "created",
                header: "Created",
                render: (folder) => (
                  <span className="text-sm text-muted">
                    {formatDate(folder.created_at)}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
