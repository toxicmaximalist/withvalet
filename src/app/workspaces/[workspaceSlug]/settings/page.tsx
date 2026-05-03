import { SettingsView } from "@/components/workspace/settings-view";
import {
  getCurrentUserProfile,
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
  const [currentUserProfile, members, invitationState, query] = await Promise.all([
    getCurrentUserProfile(),
    getWorkspaceMembers(workspace.id),
    getWorkspaceInvitations(workspace.id),
    searchParams,
  ]);

  return (
    <SettingsView
      canManageMembers={workspace.role === "owner"}
      currentUserEmail={currentUserProfile.email}
      currentUserFullName={currentUserProfile.fullName}
      currentUserId={currentUserProfile.userId}
      error={getMessageValue(query.error)}
      initialInvitations={invitationState.invitations}
      invitationsEnabled={invitationState.isAvailable}
      initialMembers={members}
      success={getMessageValue(query.success)}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
    />
  );
}
