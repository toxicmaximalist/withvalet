import { FoldersView } from "@/components/workspace/folders-view";
import { getMessageValue } from "@/lib/navigation";

type FoldersPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FoldersPage({
  params,
  searchParams,
}: FoldersPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;

  return (
    <FoldersView
      error={getMessageValue(query.error)}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
