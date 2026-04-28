import { AppSidebar } from "@/components/app-sidebar";
import { WorkspacePersistor } from "@/components/workspace-persistor";
import { WorkspaceTopbar } from "@/components/workspace-topbar";
import { getWorkspaceContext } from "@/lib/data";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params;
  const { workspace, workspaces } = await getWorkspaceContext(workspaceSlug);

  return (
    <div className="workspace-shell workspace-grid-lines min-h-screen">
      <WorkspacePersistor slug={workspace.slug} />
      <div className="grid min-h-screen lg:grid-cols-[272px_minmax(0,1fr)]">
        <AppSidebar
          workspaceName={workspace.name}
          workspaceSlug={workspace.slug}
          workspaces={workspaces.map(({ id, name, slug }) => ({ id, name, slug }))}
        />
        <div className="min-w-0">
          <WorkspaceTopbar workspaceName={workspace.name} workspaceSlug={workspace.slug} />
          <main className="min-w-0 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
