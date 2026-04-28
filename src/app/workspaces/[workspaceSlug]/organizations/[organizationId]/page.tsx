import { OrganizationDetailView } from "@/components/workspace/organization-detail-view";
import { getMessageValue } from "@/lib/navigation";

type OrganizationDetailPageProps = {
  params: Promise<{ workspaceSlug: string; organizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationDetailPageProps) {
  const { workspaceSlug, organizationId } = await params;
  const query = await searchParams;

  return (
    <OrganizationDetailView
      error={getMessageValue(query.error)}
      organizationId={organizationId}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
