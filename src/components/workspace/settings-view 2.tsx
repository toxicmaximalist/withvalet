"use client";

import {
  cancelWorkspaceInvitationAction,
  inviteWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateProfileAction,
  updateWorkspaceSettingsAction,
} from "@/actions/settings";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FieldLabel, TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/utils";
import type {
  WorkspaceInvitationSummary,
  WorkspaceMemberSummary,
} from "@/lib/data";
import { useGetWorkspaceMembersQuery, workspaceQueryOptions } from "@/store/workspace-api";

type SettingsViewProps = {
  canManageMembers: boolean;
  currentUserEmail: string;
  currentUserFullName: string | null;
  error?: string;
  initialInvitations: WorkspaceInvitationSummary[];
  invitationsEnabled: boolean;
  initialMembers: WorkspaceMemberSummary[];
  success?: string;
  workspaceName: string;
  workspaceSlug: string;
};

export function SettingsView({
  canManageMembers,
  currentUserEmail,
  currentUserFullName,
  error,
  initialInvitations,
  invitationsEnabled,
  initialMembers,
  success,
  workspaceName,
  workspaceSlug,
}: SettingsViewProps) {
  const queryArg = { workspaceSlug };
  const { data, isFetching } = useGetWorkspaceMembersQuery(queryArg, workspaceQueryOptions);
  const members = data ?? initialMembers;
  const pendingInvitations = initialInvitations;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspaceName}
        title="Settings"
        description="Manage workspace metadata and review current members."
      />

      <NoticeBanner error={error} success={success} />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="panel rounded-[28px] p-6">
            <h2 className="text-lg font-semibold text-foreground">Your profile</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Update the personal name shown across member lists and assignment controls.
            </p>
            <form action={updateProfileAction} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <div>
                <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                <TextInput
                  id="fullName"
                  name="fullName"
                  defaultValue={currentUserFullName ?? ""}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                <TextInput id="profile-email" value={currentUserEmail} readOnly />
              </div>
              <SubmitButton>Save profile</SubmitButton>
            </form>
          </div>

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
            <h2 className="text-lg font-semibold text-foreground">Invite teammate</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Invite people with their email address. If they do not have an account yet, access
              will activate automatically once they sign in with the same email.
            </p>
            {!invitationsEnabled ? (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-muted">
                Email invitations are unavailable until
                {" "}
                <code>supabase/migrations/0002_workspace_email_invites_and_contact_owners.sql</code>
                {" "}
                is applied.
              </div>
            ) : canManageMembers ? (
              <form action={inviteWorkspaceMemberAction} className="mt-5 space-y-4">
                <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                <div>
                  <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                  <TextInput
                    id="invite-email"
                    name="email"
                    type="email"
                    placeholder="teammate@company.com"
                    required
                  />
                </div>
                <SubmitButton>Send invite</SubmitButton>
              </form>
            ) : (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-muted">
                Only workspace owners can send invitations or remove members.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
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
                {
                  key: "actions",
                  header: "Actions",
                  className: "w-[120px]",
                  render: (member) =>
                    canManageMembers && member.role !== "owner" ? (
                      <form action={removeWorkspaceMemberAction}>
                        <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                        <input type="hidden" name="userId" value={member.userId} />
                        <button className="text-sm text-danger hover:text-[#fca5a5]">
                          Remove
                        </button>
                      </form>
                    ) : (
                      <span className="text-sm text-muted">
                        {member.role === "owner" ? "Owner" : "—"}
                      </span>
                    ),
                },
              ]}
            />
          </div>

          <div>
            <div className="panel rounded-[24px] px-4 py-3 text-sm text-muted">
              {invitationsEnabled
                ? `${pendingInvitations.length} pending invitation${pendingInvitations.length === 1 ? "" : "s"}.`
                : "Pending email invitations are unavailable until migration 0002 is applied."}
            </div>
            <div className="mt-4">
              <DataTable
                data={pendingInvitations}
                emptyState={
                  <EmptyState
                    title={invitationsEnabled ? "No pending invitations" : "Invitations unavailable"}
                    description={
                      invitationsEnabled
                        ? "Email invites waiting for acceptance will appear here."
                        : "Apply migration 0002 to enable email invitations for this workspace."
                    }
                  />
                }
                columns={[
                  {
                    key: "email",
                    header: "Email",
                    render: (invitation) => (
                      <div>
                        <p className="font-medium text-foreground">{invitation.email}</p>
                        <p className="mt-1 text-xs text-muted">
                          {invitation.invitedByName || invitation.invitedByEmail
                            ? `Invited by ${invitation.invitedByName || invitation.invitedByEmail}`
                            : "Invited by workspace owner"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "role",
                    header: "Role",
                    render: (invitation) => (
                      <span className="text-sm text-foreground">{invitation.role}</span>
                    ),
                  },
                  {
                    key: "sent",
                    header: "Invited",
                    render: (invitation) => (
                      <span className="text-sm text-muted">
                        {formatDate(invitation.createdAt)}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    className: "w-[120px]",
                    render: (invitation) =>
                      canManageMembers && invitationsEnabled ? (
                        <form action={cancelWorkspaceInvitationAction}>
                          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                          <input type="hidden" name="invitationId" value={invitation.id} />
                          <button className="text-sm text-danger hover:text-[#fca5a5]">
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
