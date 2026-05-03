"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FieldLabel, TextInput } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { useNoticeState } from "@/components/workspace/use-notice-state";
import { getErrorMessage } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  useCreateFolderMutation,
  useGetFoldersQuery,
  workspaceQueryOptions,
} from "@/store/workspace-api";

type FoldersViewProps = {
  error?: string;
  success?: string;
  workspaceSlug: string;
};

export function FoldersView({
  error,
  success,
  workspaceSlug,
}: FoldersViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { error: noticeError, showError, showSuccess, success: noticeSuccess } =
    useNoticeState(error, success);
  const formRef = useRef<HTMLFormElement | null>(null);
  const queryArg = { workspaceSlug };
  const { data, isFetching, isLoading } = useGetFoldersQuery(queryArg, workspaceQueryOptions);
  const [createFolder, createFolderState] = useCreateFolderMutation();
  const folders = data ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const request = createFolder({
        payload: {
          name: String(formData.get("name") ?? ""),
        },
        workspaceSlug,
      }).unwrap();
      formRef.current?.reset();
      setIsCreateModalOpen(false);
      await request;
      showSuccess("Folder created.");
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspaceSlug}
        title="Folders"
        description="Group contacts across campaigns, themes, or strategic focus areas."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:border-white/16 hover:bg-white/[0.04]"
          >
            Create folder
          </button>
        }
      />

      <NoticeBanner error={noticeError} success={noticeSuccess} />

      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create folder"
        description="Create a new grouping for campaigns, segments, or strategic lists."
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <div>
            <FieldLabel htmlFor="name">Folder name</FieldLabel>
            <TextInput id="name" name="name" placeholder="Warm intros" required />
          </div>
          <div className="flex justify-end">
            <SubmitButton loading={createFolderState.isLoading}>Create folder</SubmitButton>
          </div>
        </form>
      </Modal>

      <section className="space-y-4">
        {isLoading && !data ? (
          <div className="panel rounded-[24px] px-4 py-8 text-sm text-muted">
            Loading folders...
          </div>
        ) : (
        <>
          <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
            {folders.length} folders available for grouping contacts by campaign or priority.
            {isFetching ? " Refreshing..." : ""}
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
                  <span className="text-sm text-foreground">{folder.contactCount}</span>
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
        </>
        )}
      </section>
    </div>
  );
}
