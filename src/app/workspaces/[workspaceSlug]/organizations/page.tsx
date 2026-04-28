import { OrganizationsView } from "@/components/workspace/organizations-view";
import { getMessageValue } from "@/lib/navigation";

type OrganizationsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationsPage({
  params,
  searchParams,
}: OrganizationsPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;

  return (
    <OrganizationsView
      error={getMessageValue(query.error)}
      success={getMessageValue(query.success)}
      workspaceSlug={workspaceSlug}
    />
  );
}
