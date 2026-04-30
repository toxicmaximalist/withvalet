import { SettingsView } from "@/components/workspace/settings-view";
import {
  getWorkspaceContext,
  getWorkspaceInvitations,
  getWorkspaceMembers,
} from "@/lib/data";
import { getMessageValue } from "@/lib/navigation";

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
  const [members, invitations, query] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getWorkspaceInvitations(workspace.id),
    searchParams,
  ]);

  return (
    <SettingsView
      canManageMembers={workspace.role === "owner"}
      error={getMessageValue(query.error)}
      initialInvitations={invitations}
      initialMembers={members}
      success={getMessageValue(query.success)}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
    />
  );
}
