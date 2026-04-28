import { SettingsView } from "@/components/workspace/settings-view";
import { getWorkspaceContext, getWorkspaceMembers } from "@/lib/data";
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
  const [members, query] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    searchParams,
  ]);

  return (
    <SettingsView
      error={getMessageValue(query.error)}
      initialMembers={members}
      inviteCode={workspace.invite_code}
      success={getMessageValue(query.success)}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
    />
  );
}
