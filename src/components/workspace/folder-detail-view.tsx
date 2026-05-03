"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { NoticeBanner } from "@/components/notice-banner";
import { OrganizationBadge } from "@/components/organization-badge";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { useNoticeState } from "@/components/workspace/use-notice-state";
import { buildPathWithMessage } from "@/lib/navigation";
import { getErrorMessage } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  useDeleteFolderMutation,
  useGetFolderDetailQuery,
  useSyncFolderContactsMutation,
  workspaceQueryOptions,
} from "@/store/workspace-api";

type FolderDetailViewProps = {
  error?: string;
  folderId: string;
  success?: string;
  workspaceSlug: string;
};

export function FolderDetailView({
  error,
  folderId,
  success,
  workspaceSlug,
}: FolderDetailViewProps) {
  const router = useRouter();
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const queryArg = { workspaceSlug, folderId };
  const { data, isFetching, isLoading } = useGetFolderDetailQuery(queryArg, workspaceQueryOptions);
  const [syncFolderContacts, syncFolderContactsState] = useSyncFolderContactsMutation();
  const [deleteFolder, deleteFolderState] = useDeleteFolderMutation();
  const folder = data;
  const [draftSelectedContactIds, setDraftSelectedContactIds] = useState<string[] | null>(null);
  const selectedContactIds =
    draftSelectedContactIds ??
    (folder?.selectableContacts.filter((contact) => contact.selected).map((contact) => contact.id) ?? []);

  function toggleContact(contactId: string, checked: boolean) {
    setDraftSelectedContactIds((current) => {
      const source =
        current ??
        (folder?.selectableContacts
          .filter((contact) => contact.selected)
          .map((contact) => contact.id) ?? []);

      if (checked) {
        return source.includes(contactId) ? source : [...source, contactId];
      }

      return source.filter((id) => id !== contactId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await syncFolderContacts({
        folderId,
        payload: {
          contactIds: selectedContactIds,
        },
        workspaceSlug,
      }).unwrap();
      setDraftSelectedContactIds(null);
      showSuccess("Folder membership updated.");
    } catch (error) {
      setDraftSelectedContactIds(null);
      showError(getErrorMessage(error));
    }
  }

  async function handleDeleteFolder() {
    const targetPath = `/workspaces/${workspaceSlug}/folders`;
    router.push(buildPathWithMessage(targetPath, "success", "Folder deleted."));

    try {
      await deleteFolder({
        folderId,
        workspaceSlug,
      }).unwrap();
    } catch (deleteError) {
      router.replace(buildPathWithMessage(targetPath, "error", getErrorMessage(deleteError)));
    }
  }

  if (isLoading && !folder) {
    return (
      <div className="panel rounded-[28px] px-6 py-10 text-sm text-muted">
        Loading folder...
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="panel rounded-[28px] px-6 py-10 text-sm text-danger">
        Unable to load folder.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Folder detail"
        title={folder.name}
        description={`Created ${formatDate(folder.created_at)}. Add or remove contacts to shape the group${isFetching ? " · Refreshing..." : "."}`}
        actions={
          <button
            type="button"
            onClick={handleDeleteFolder}
            disabled={deleteFolderState.isLoading}
            className="rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteFolderState.isLoading ? "Deleting..." : "Delete folder"}
          </button>
        }
      />

      <NoticeBanner error={noticeError} success={noticeSuccess} />

      <section className="grid gap-6 xl:grid-cols-[minmax(340px,0.92fr)_minmax(0,1.08fr)]">
        <div className="panel rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-foreground">Membership editor</h2>
          <p className="mt-2 text-sm text-muted">
            Pick every contact that should belong to this folder. A contact can be in multiple folders.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                    checked={selectedContactIds.includes(contact.id)}
                    onChange={(event) => toggleContact(contact.id, event.target.checked)}
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
            <SubmitButton loading={syncFolderContactsState.isLoading}>
              Save membership
            </SubmitButton>
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
