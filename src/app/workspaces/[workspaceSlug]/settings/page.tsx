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
import { getWorkspaceContext, getWorkspaceMembers } from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";
import { formatDate } from "@/lib/utils";

type SettingsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({
  params,
  searchParams,
}: SettingsPageProps) {
  const { workspaceSlug } = await params;
  const { workspace } = await getWorkspaceContext(workspaceSlug);
  const [members, query] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace.name}
        title="Settings"
        description="Manage workspace metadata, share invite access, and review current members."
      />

      <NoticeBanner
        error={getMessageValue(query.error)}
        success={getMessageValue(query.success)}
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="panel rounded-[28px] p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Workspace details
            </h2>
            <form action={updateWorkspaceSettingsAction} className="mt-6 space-y-4">
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <div>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <TextInput id="name" name="name" defaultValue={workspace.name} required />
              </div>
              <div>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <TextInput id="slug" value={workspace.slug} readOnly />
              </div>
              <SubmitButton>Save settings</SubmitButton>
            </form>
          </div>

          <div className="panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent">
                  Invite code
                </p>
                <p className="mt-3 font-mono text-2xl text-foreground">
                  {workspace.invite_code}
                </p>
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
