"use client";

import {
  regenerateInviteCodeAction,
  updateWorkspaceSettingsAction,
} from "@/actions/settings";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FieldLabel, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/utils";
import type { WorkspaceMemberSummary } from "@/lib/data";
import { useGetWorkspaceMembersQuery, workspaceQueryOptions } from "@/store/workspace-api";

type SettingsViewProps = {
  error?: string;
  initialMembers: WorkspaceMemberSummary[];
  inviteCode: string;
  success?: string;
  workspaceName: string;
  workspaceSlug: string;
};

export function SettingsView({
  error,
  initialMembers,
  inviteCode,
  success,
  workspaceName,
  workspaceSlug,
}: SettingsViewProps) {
  const queryArg = { workspaceSlug };
  const { data, isFetching } = useGetWorkspaceMembersQuery(queryArg, workspaceQueryOptions);
  const members = data ?? initialMembers;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspaceName}
        title="Settings"
        description="Manage workspace metadata, share invite access, and review current members."
      />

      <NoticeBanner error={error} success={success} />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="panel rounded-[28px] p-6">
            <h2 className="text-lg font-semibold text-foreground">Workspace details</h2>
            <form action={updateWorkspaceSettingsAction} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <div>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <TextInput id="name" name="name" defaultValue={workspaceName} required />
              </div>
              <div>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <TextInput id="slug" value={workspaceSlug} readOnly />
              </div>
              <SubmitButton>Save settings</SubmitButton>
            </form>
          </div>

          <div className="panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent">Invite code</p>
                <p className="mt-3 font-mono text-2xl text-foreground">{inviteCode}</p>
              </div>
              <form action={regenerateInviteCodeAction}>
                <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                <button className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-foreground hover:border-accent/30 hover:bg-white/[0.03]">
                  Regenerate
                </button>
              </form>
            </div>
          </div>
        </div>

        <div>
          <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
            {members.length} members currently have access to this workspace.
            {isFetching ? " Refreshing..." : ""}
          </div>
          <div className="mt-4">
            <DataTable
              data={members}
              emptyState={
                <EmptyState
                  title="No members found"
                  description="Member records appear once the workspace has at least one accessible user."
                />
              }
              columns={[
                {
                  key: "member",
                  header: "Member",
                  render: (member) => (
                    <div>
                      <p className="font-medium text-foreground">
                        {member.fullName || member.email}
                      </p>
                      <p className="mt-1 text-xs text-muted">{member.email}</p>
                    </div>
                  ),
                },
                {
                  key: "role",
                  header: "Role",
                  render: (member) => (
                    <span className="text-sm text-foreground">{member.role}</span>
                  ),
                },
                {
                  key: "joined",
                  header: "Joined",
                  render: (member) => (
                    <span className="text-sm text-muted">
                      {formatDate(member.createdAt)}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
