import { FolderDetailView } from "@/components/workspace/folder-detail-view";
import { getMessageValue } from "@/lib/navigation";

type FolderDetailPageProps = {
  params: Promise<{ workspaceSlug: string; folderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FolderDetailPage({
  params,
  searchParams,
}: FolderDetailPageProps) {
  const { workspaceSlug, folderId } = await params;
  const query = await searchParams;

  return (
    <FolderDetailView
      error={getMessageValue(query.error)}
      folderId={folderId}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
